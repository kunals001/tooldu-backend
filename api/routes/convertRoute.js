import express from "express";
import multer from "multer";
import { convertImage, convertFromUrl } from "../controllers/convertImage.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/convert", upload.array("images", 10), convertImage);
router.post("/convert-from-url", convertFromUrl);

export default router;
