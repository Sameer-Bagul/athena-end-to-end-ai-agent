"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribe = transcribe;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
async function transcribe(input) {
    try {
        const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
        console.log(`[BACKEND STT] Sending ${buffer.length} bytes to Python Service...`);
        const form = new form_data_1.default();
        // Send as .webm, server will handle it
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
            maxContentLength: Infinity
        });
        const json = response.data;
        // console.log('[BACKEND STT] Python Response:', json);
        if (json.error) {
            console.error('[BACKEND STT] Python Error:', json.error);
            return "";
        }
        return json.text || "";
    }
    catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('[BACKEND STT] Python server not running (port 9001)');
            return "Error: STT Service Down";
        }
        console.error('[BACKEND STT] Error:', error.message);
        return "";
    }
}
