import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { uploadToS3 } from "../utils/s3.js";
import redis from "../utils/redis.js";

const execAsync = promisify(exec);
const connection = new IORedis({ maxRetriesPerRequest: null });

const convertWithMagick = async (buffer, inputExt, outputExt, quality = 75) => {
  const inputPath = `/tmp/input_${Date.now()}.${inputExt}`;
  const outputPath = `/tmp/output_${Date.now()}.${outputExt}`;

  fs.writeFileSync(inputPath, buffer);

  let convertCommand = `convert "${inputPath}"`;

  // 🔹 Resize for ICO (required)
  if (outputExt === "ico") {
    convertCommand += ` -resize 64x64`;
  }

  // 🔹 Remove metadata
  convertCommand += ` -strip`;

  // 🔹 Format-specific compression settings
  if (outputExt === "webp") {
    convertCommand += ` -define webp:method=6 -define webp:alpha-compression=1 -quality ${quality}`;
  } else if (outputExt === "avif") {
    convertCommand += ` -define avif:compression=av1 -define avif:effort=8 -quality ${quality}`;
  } else if (["jpg", "jpeg"].includes(outputExt)) {
    convertCommand += ` -sampling-factor 4:2:0 -interlace JPEG -quality ${quality}`;
  } else {
    convertCommand += ` -quality ${quality}`;
  }

  convertCommand += ` "${outputPath}"`;

  await execAsync(convertCommand);

  const resultBuffer = fs.readFileSync(outputPath);

  fs.unlinkSync(inputPath);
  fs.unlinkSync(outputPath);

  return resultBuffer;
};
new Worker(
  "image-conversion",
  async (job) => {
    const { bufferBase64, originalName, inputExt, outputExt, fromUrl } =
      job.data;
    console.log(
      `📦 Job data: ${originalName} | From: ${inputExt} ➜ ${outputExt}`
    );

    const buffer = Buffer.from(bufferBase64, "base64");

    const convertedBuffer = await convertWithMagick(
      buffer,
      inputExt,
      outputExt
    );

    const originalSizeKB = buffer.length / 1024;
    const compressedSizeKB = convertedBuffer.length / 1024;
    const savedPercent = (
      (1 - convertedBuffer.length / buffer.length) *
      100
    ).toFixed(2);

    const baseName = path.parse(originalName).name.replace(/\s+/g, "_");
    const shortId = Math.random().toString(36).substring(2, 6);
    const key = fromUrl
      ? `converted/fromurl_${shortId}.${outputExt}`
      : `converted/${baseName}_${shortId}.${outputExt}`;

    const contentType = `image/${outputExt}`;
    await uploadToS3(convertedBuffer, key, contentType);

    const url = `${process.env.CLOUDFRONT_BASE_URL}/${key}`;
    console.log(url);
    await redis.set(`recent:${key}`, "1", "EX", 1200); // 20 minutes = 1200 seconds
    await redis.set(`delete:${key}`, Date.now() + 1200000); // 20 minutes = 1,200,000 ms

    return {
      url,
      key,
      originalSizeKB: originalSizeKB.toFixed(2),
      compressedSizeKB: compressedSizeKB.toFixed(2),
      savedPercent,
    };
  },
  { connection }
);
