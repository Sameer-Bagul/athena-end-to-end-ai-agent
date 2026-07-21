import { config } from '../core/config.js';
export async function transcribe(input) {
    const MAX_RETRIES = config.MAX_RETRIES;
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
            if (attempt === 0)
                console.log(`[BACKEND STT] Sending ${buffer.length} bytes to Python Service...`);
            const form = new FormData();
            form.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), config.STT_TIMEOUT);
            const response = await fetch(`${config.STT_URL}/stt`, {
                method: 'POST',
                body: form,
                signal: controller.signal
            });
            clearTimeout(timeout);
            const json = await response.json();
            if (json.error) {
                console.error('[BACKEND STT] Python Error:', json.error);
                return "";
            }
            const text = json.text || "";
            console.log(`[BACKEND STT] Transcription finished: "${text}"`);
            return text;
        }
        catch (error) {
            const isConnRefused = error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED');
            if (isConnRefused) {
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
