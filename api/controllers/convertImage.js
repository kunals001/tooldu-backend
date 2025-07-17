import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { imageQueue } from "../queues/imageQueue.js";

export const convertImage = async (req, res) => {
  const files = req.files;
  const formats = req.body.formats;
  const quality = req.body.quality || 75;

  if (!files?.length || !formats?.length) {
    return res.status(400).json({ message: "Missing image or format" });
  }

  const jobIds = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const toFormat = Array.isArray(formats) ? formats[i] : formats;

    const inputExt = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const outputExt = toFormat.toLowerCase();

    const job = await imageQueue.add("convert", {
      bufferBase64: file.buffer.toString("base64"),
      originalName: file.originalname,
      inputExt,
      outputExt,
      fromUrl: false,
      quality, 
    });

    jobIds.push(job.id);
  }

  res.json({ message: "Conversion started", jobIds });
};

export const convertFromUrl = async (req, res) => {
  const { imageUrl, toFormat, quality = 75 } = req.body;

  if (!imageUrl || !toFormat) {
    return res.status(400).json({ message: "Missing imageUrl or format" });
  }

  try {
    // 🔽 Fetch image from the URL
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // 🔽 Detect input extension from content-type or fallback from URL
    let inputExt = response.headers["content-type"]
      ?.split("/")[1]
      ?.split(";")[0]
      ?.toLowerCase();
    inputExt =
      inputExt ||
      imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase() ||
      "jpg";
    inputExt = inputExt.replace(/[^a-z]/gi, "");

    const outputExt = toFormat.toLowerCase();
    const supportedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "tiff",
      "avif",
      "gif",
      "bmp",
      "svg",
      "ico",
      "pdf",
    ];

    if (!supportedExtensions.includes(inputExt)) {
      inputExt = "jpg";
    }

    const safeName = `url-image-${uuidv4()}`;

    const job = await imageQueue.add("convert", {
      bufferBase64: buffer.toString("base64"),
      originalName: `${safeName}.${inputExt}`,
      inputExt,
      outputExt,
      fromUrl: true,
      quality,
    });

    res.json({ message: "URL conversion started", jobId: job.id });
  } catch (err) {
    console.error("❌ URL Conversion Error:", err.message);
    res.status(500).json({ message: "Failed to fetch or queue the image." });
  }
};
