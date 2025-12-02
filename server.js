import express from "express";
import multer from "multer";
import path from "path";
import { Worker } from "bullmq";
import { v4 as uuidv4 } from "uuid";
import { whisperProcess } from "./workerCore.js";
import { whisperQueue } from "./queue.js";

const app = express();
const upload = multer({ dest: "uploads/" });

new Worker("whisper", whisperProcess, {
  connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

new Worker("whisper", whisperProcess, {
  connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

app.post("/speech-to-text", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const uniqueId = uuidv4();
  const wavPath = path.resolve(req.file.path);
  const fileName = `${req.file.filename}-${uniqueId}`;

  const job = await whisperQueue.add("convert", {
    file: wavPath,
    name: fileName,
  });

  res.json({ message: "Your audio is being processed", jobId: job.id });
});

app.get("/result/:id", async (req, res) => {
  const job = await whisperQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const state = await job.getState();

  if (state === "completed") return res.json(job.returnvalue);
  if (state === "failed")
    return res.status(500).json({ status: state, reason: job.failedReason });
  res.json({ status: state });
});

app.listen(3000, () => console.log("Server running on port 3000"));
