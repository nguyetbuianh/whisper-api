import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/speech-to-text", upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const uniqueId = uuidv4();
  const wavPath = path.resolve(req.file.path);
  const outputDir = path.resolve("output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputFileBase = path.join(
    outputDir,
    `${req.file.filename}-${uniqueId}`
  );

  const cmd = `cd ~/whisper.cpp &&
    ./build/bin/whisper-cli -m models/ggml-base.en.bin "${wavPath}" -otxt -of "${outputFileBase}"`;

  const outputTxt = `${outputFileBase}.txt`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Whisper exec error:", error);
      console.error("stderr:", stderr);
      fs.unlinkSync(wavPath);
      return res.status(500).json({ message: "Whisper failed", error: stderr });
    }

    fs.readFile(outputTxt, "utf8", (err, text) => {
      fs.unlink(wavPath, () => {});
      fs.unlink(outputTxt, () => {});

      if (err) return res.status(500).json({ message: "Cannot read text" });

      res.json({ text });
    });
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
