
import { pipeline, env } from '@xenova/transformers';

// Configuration
env.allowLocalModels = false; // Fetch from Hugging Face Hub (cached in browser)
env.useBrowserCache = true;

// Define the singleton transcriber
class MyTranscriptionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance: any = null;

    static async getInstance(progress_callback: any = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.onmessage = async (event) => {
    const { type, audio } = event.data;

    if (type === 'load') {
        try {
            self.postMessage({ status: 'loading', message: 'Loading Whisper model...' });
            await MyTranscriptionPipeline.getInstance((data: any) => {
                // Progress callback
                if (data.status === 'progress') {
                    self.postMessage({
                        status: 'progress',
                        file: data.file,
                        progress: data.progress
                    });
                }
            });
            self.postMessage({ status: 'ready' });
        } catch (error) {
            self.postMessage({ status: 'error', error: String(error) });
        }
    }

    else if (type === 'transcribe') {
        try {
            const transcriber = await MyTranscriptionPipeline.getInstance();

            // audio should be a Float32Array of 16kHz mono audio
            const output = await transcriber(audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
                return_timestamps: false // simplified for now
            });

            self.postMessage({
                status: 'complete',
                text: output.text
            });

        } catch (error) {
            self.postMessage({ status: 'error', error: String(error) });
        }
    }
};
