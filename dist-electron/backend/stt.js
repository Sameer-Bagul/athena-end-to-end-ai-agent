"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribe = transcribe;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
async function transcribe(input) {
    const MAX_RETRIES = 5;
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
            if (attempt === 0)
                console.log(`[BACKEND STT] Sending ${buffer.length} bytes to Python Service...`);
            const form = new form_data_1.default();
            form.append('file', buffer, {
                filename: 'audio.webm',
                contentType: 'audio/webm',
                knownLength: buffer.length
            });
            const response = await axios_1.default.post('http://127.0.0.1:9001/stt', form, {
                headers: {
                    ...form.getHeaders(),
                    'Content-Length': form.getLengthSync()
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 30000 // 30s timeout for processing
            });
            const json = response.data;
            if (json.error) {
                console.error('[BACKEND STT] Python Error:', json.error);
                return "";
            }
            const text = json.text || "";
            console.log(`[BACKEND STT] Transcription finished: "${text}"`);
            return text;
        }
        catch (error) {
            if (error.code === 'ECONNREFUSED') {
                attempt++;
                console.warn(`[BACKEND STT] Python server not ready (Attempt ${attempt}/${MAX_RETRIES}). Retrying in ${attempt}s...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
            else {
                console.error('[BACKEND STT] Error:', error.message);
                return "";
            }
        }
    }
    console.error('[BACKEND STT] Failed to connect to Python server after multiple retries.');
    return "Error: STT Service Unavailable";
}
