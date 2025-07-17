// utils/agenda.js
import "dotenv/config";
import { Agenda } from "@hokify/agenda";
import { convertImageJob } from "../workers/imageWorker.js";

const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: "imageJobs",
    options: { useUnifiedTopology: true },
  },
  processEvery: "10 seconds",
  maxConcurrency: 20,
  defaultConcurrency: 5,
});

// Define the job
agenda.define("convert", async (job) => {
  const data = job.attrs.data;
  await convertImageJob(data); // now this works
});

export { agenda };
