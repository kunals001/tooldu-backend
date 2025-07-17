import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./utils/connectDB.js";
import "./jobs/autoDeleteJob.js";
const PORT = process.env.PORT;

const app = express();
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

import convertRoutes from "./routes/convertRoute.js";
import adminRoutes from "./routes/adminRoute.js";

app.use("/api/admin", adminRoutes);
app.use("/api", convertRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
