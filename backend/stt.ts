import axios from 'axios';
import FormData from 'form-data';

export async function transcribe(input: any): Promise<string> {
    try {
        const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
        console.log(`[BACKEND STT] Sending ${buffer.length} bytes to Python Service...`);

        const form = new FormData();
        // Send as .webm, server will handle it
        form.append('file', buffer, {
            filename: 'audio.webm',
            contentType: 'audio/webm',
            knownLength: buffer.length
        });

        const response = await axios.post('http://127.0.0.1:9001/stt', form, {
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

    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error('[BACKEND STT] Python server not running (port 9001)');
            return "Error: STT Service Down";
        }
        console.error('[BACKEND STT] Error:', error.message);
        return "";
    }
}
