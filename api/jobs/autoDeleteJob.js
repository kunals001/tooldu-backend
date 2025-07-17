// cron/autoDelete.js
import cron from "node-cron";
import AutoDelete from "../models/AutoDelete.model.js";
import { deleteFromS3 } from "../utils/s3.js";

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expiredItems = await AutoDelete.find({ deleteAt: { $lte: now } });

    for (const item of expiredItems) {
      try {
        await deleteFromS3(item.s3Key);               
        await AutoDelete.deleteOne({ _id: item._id }); 
        console.log(`✅ Deleted from S3: ${item.s3Key}`);
      } catch (err) {
        console.error("❌ Error deleting:", item.s3Key, err.message);
      }
    }
  } catch (err) {
    console.error("❌ Auto-delete cron error:", err.message);
  }
});
