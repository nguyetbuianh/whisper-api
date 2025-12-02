import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export const whisperProcess = (job) => {
  return new Promise((resolve, reject) => {
    const { file, name } = job.data;
    const outputDir = path.resolve("output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const outputBase = path.join(outputDir, name);
    const outputTxt = `${outputBase}.txt`;

    const whisper = spawn(
      "./build/bin/whisper-cli",
      ["-m", "models/ggml-base.en.bin", file, "-otxt", "-of", outputBase],
      { cwd: "/home/nguyet/whisper.cpp" }
    );

    whisper.stderr.on("data", (data) => console.error(data.toString()));

    whisper.on("close", (code) => {
      if (code !== 0) return reject("Whisper failed");

      fs.readFile(outputTxt, "utf8", (err, text) => {
        fs.unlink(file, () => {});
        fs.unlink(outputTxt, () => {});

        if (err) return reject("Cannot read output");
        resolve({ text });
      });
    });
  });
};
