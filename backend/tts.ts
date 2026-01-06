import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { app } from "electron";

export async function speak(text: string, voiceStyle = "M1") {
  console.log(`[BACKEND TTS] Request received. Text: "${text.substring(0, 20)}...", Voice: ${voiceStyle}`);
  try {
    const res = await fetch("http://localhost:3000/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceStyle }),
    });

    if (!res.ok) {
      console.error(`[BACKEND TTS] Server error: ${res.status}`);
      throw new Error(`TTS Server errored: ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const wavBuffer = Buffer.from(arrayBuffer);
    const filePath = path.join(app.getPath("userData"), `tts-${Date.now()}.wav`);
    fs.writeFileSync(filePath, wavBuffer);
    console.log(`[BACKEND TTS] Success. Saved to: ${filePath} (${wavBuffer.length} bytes)`);
    return filePath;
  } catch (err) {
    console.error("[BACKEND TTS] Failed:", err);
    throw err;
  }
}
