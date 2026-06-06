import axios from 'axios';
import FormData from 'form-data';
import { Agent } from 'http';
import { config } from './config.js';
// Connection pooling for better performance
const httpAgent = new Agent({
    keepAlive: true,
    maxSockets: 5,
    maxFreeSockets: 2,
    timeout: 30000
});
export async function transcribe(input) {
    const MAX_RETRIES = config.MAX_RETRIES;
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
            if (attempt === 0)
                console.log(`[BACKEND STT] Sending ${buffer.length} bytes to Python Service...`);
            const form = new FormData();
            form.append('file', buffer, {
                filename: 'audio.webm',
                contentType: 'audio/webm',
                knownLength: buffer.length
            });
            const response = await axios.post(`${config.STT_URL}/stt`, form, {
                headers: {
                    ...form.getHeaders(),
                    'Content-Length': form.getLengthSync()
                },
                httpAgent,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: config.STT_TIMEOUT // timeout for processing
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
