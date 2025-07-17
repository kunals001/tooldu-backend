// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./utils/connectDB.js";
import { agenda } from "./utils/agenda.js";
import { setupImageJob } from "./jobs/imageConversionJob.js";
import "./jobs/autoDeleteJob.js"; // Optional scheduled jobs

import convertRoutes from "./routes/convertRoute.js";
import adminRoutes from "./routes/adminRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

// Setup Agenda job
setupImageJob(agenda);
await agenda.start();
console.log("✅ Agenda started");

// Middlewares
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [process.env.CLIENT_URI, process.env.ADMIN_URI];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api", convertRoutes);



// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
