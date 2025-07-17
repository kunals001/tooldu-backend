import cron from "node-cron";
import { deleteFromS3 } from "../utils/s3.js";
import redis from "../utils/redis.js"; 

cron.schedule("* * * * *", async () => {

  const keys = await redis.keys("delete:*");

  for (const key of keys) {
    const s3Key = key.replace("delete:", "");
    const timestamp = await redis.get(key);

    if (Date.now() >= parseInt(timestamp)) {
      try {
        await deleteFromS3(s3Key);
        await redis.del(key);
        await redis.del(`recent:${s3Key}`);
      } catch (err) {
        console.error("❌ Delete failed:", err.message);
      }
    }
  }
});

