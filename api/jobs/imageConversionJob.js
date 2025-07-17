import { uploadToS3 } from "../utils/s3.js";
import { convertWithMagick } from "../workers/imageWorker.js";
import path from "path";
import AutoDelete from "../models/AutoDelete.model.js";

export const setupImageJob = (agenda) => {
  agenda.define("convert-image", async (job) => {
    const { bufferBase64, originalName, inputExt, outputExt, fromUrl, quality } = job.attrs.data;
    const buffer = Buffer.from(bufferBase64, "base64");

    const convertedBuffer = await convertWithMagick(buffer, inputExt, outputExt, quality);
    const baseName = path.parse(originalName).name.replace(/\s+/g, "_");
    const shortId = Math.random().toString(36).substring(2, 6);
    const key = fromUrl
      ? `converted/fromurl_${shortId}.${outputExt}`
      : `converted/${baseName}_${shortId}.${outputExt}`;
    
    const contentType = `image/${outputExt}`;
    await uploadToS3(convertedBuffer, key, contentType);

    // ⬇️ Save deletion schedule to MongoDB
    await AutoDelete.create({
      s3Key: key,
      deleteAt: new Date(Date.now() + 1*60), // 1 hour from now
    });

    return {
      url: `${process.env.CLOUDFRONT_BASE_URL}/${key}`,
      key,
    };
  });
};
