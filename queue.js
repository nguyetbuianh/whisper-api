import { Queue } from "bullmq";

export const whisperQueue = new Queue("whisper", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});
