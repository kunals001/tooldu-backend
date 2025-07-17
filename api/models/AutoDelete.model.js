// models/AutoDelete.js
import mongoose from "mongoose";

const autoDeleteSchema = new mongoose.Schema({
  s3Key: { type: String, required: true, unique: true },
  deleteAt: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model("AutoDelete", autoDeleteSchema);
