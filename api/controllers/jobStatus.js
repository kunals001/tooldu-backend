import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ maxRetriesPerRequest: null });
const queue = new Queue("image-conversion", { connection });

export const getJobStatus = async (req, res) => {
  const jobId = req.params.id;
  const job = await queue.getJob(jobId);

  if (!job) return res.status(404).json({ message: "Job not found" });

  const state = await job.getState();
  const result = await job.returnvalue;

  res.json({ state, result });
};
