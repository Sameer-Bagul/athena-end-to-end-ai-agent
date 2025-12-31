import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { app } from "electron";

export async function speak(text: string, voiceStyle = "M1") {
  const res = await fetch("http://localhost:3000/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceStyle }),
  });
  const wavBuffer = Buffer.from(await res.arrayBuffer());
  const filePath = path.join(app.getPath("userData"), `tts-${Date.now()}.wav`);
  fs.writeFileSync(filePath, wavBuffer);
  return filePath;
}
