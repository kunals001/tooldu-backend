// workers/imageWorker.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { uploadToS3 } from "../utils/s3.js";
import { agenda } from "../utils/agenda.js";

const execAsync = promisify(exec);

const convertWithMagick = async (buffer, inputExt, outputExt, quality = 75) => {
  const inputPath = `/tmp/input_${Date.now()}.${inputExt}`;
  const outputPath = `/tmp/output_${Date.now()}.${outputExt}`;
  fs.writeFileSync(inputPath, buffer);

  let convertCommand = `convert "${inputPath}"`;

  if (outputExt === "ico") convertCommand += ` -resize 64x64`;
  convertCommand += ` -strip`;

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

export const convertImageJob = async (data) => {
  const { bufferBase64, originalName, inputExt, outputExt, fromUrl } = data;
  console.log(`📦 Converting: ${originalName} | ${inputExt} ➜ ${outputExt}`);

  try {
    const buffer = Buffer.from(bufferBase64, "base64");
    const convertedBuffer = await convertWithMagick(buffer, inputExt, outputExt);

    const originalSizeKB = buffer.length / 1024;
    const compressedSizeKB = convertedBuffer.length / 1024;
    const savedPercent = ((1 - compressedSizeKB / originalSizeKB) * 100).toFixed(2);

    const baseName = path.parse(originalName).name.replace(/\s+/g, "_");
    const shortId = Math.random().toString(36).substring(2, 6);
    const key = fromUrl
      ? `converted/fromurl_${shortId}.${outputExt}`
      : `converted/${baseName}_${shortId}.${outputExt}`;

    const contentType = `image/${outputExt}`;
    await uploadToS3(convertedBuffer, key, contentType);

    const url = `${process.env.CLOUDFRONT_BASE_URL}/${key}`;
    console.log(`✅ Uploaded: ${url}`);
    console.log(`📉 Compression: ${originalSizeKB.toFixed(2)}KB ➜ ${compressedSizeKB.toFixed(2)}KB (${savedPercent}%)`);

    return {
      url,
      key,
      originalSizeKB: originalSizeKB.toFixed(2),
      compressedSizeKB: compressedSizeKB.toFixed(2),
      savedPercent,
    };
  } catch (error) {
    console.error("❌ Error during image conversion:", error);
  }
};

// Start agenda worker
(async function () {
  await agenda.start();
  console.log("🚀 Agenda Worker Started...");
})();
