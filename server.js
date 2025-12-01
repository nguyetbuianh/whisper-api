import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "temp/" });

app.post("/speech-to-text", upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const wavPath = path.resolve(req.file.path);
  const outputDir = path.resolve("output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFileBase = path.join(outputDir, req.file.filename);

  const cmd = `cd ~/whisper.cpp &&
  ./build/bin/whisper-cli -m models/ggml-base.en.bin "${wavPath}" -otxt -of "${outputFileBase}"`;

  const outputTxt = `${outputFileBase}.txt`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Whisper exec error:", error);
      console.error("stderr:", stderr);
      return res.status(500).json({ message: "Whisper failed" });
    }

    fs.readFile(outputTxt, "utf8", (err, text) => {
      if (err) return res.status(500).json({ message: "Cannot read text" });

      res.json({ text });

      fs.unlinkSync(wavPath);
      fs.unlinkSync(outputTxt);
    });
  });
});

app.listen(3000, "0.0.0.0", () =>
  console.log("Whisper API running on port 3000")
);
