import { TTSEngine } from "../src/tts-engine.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const engine = new TTSEngine(path.join(__dirname, "../assets"));
await engine.init();
console.log("Warmup complete");