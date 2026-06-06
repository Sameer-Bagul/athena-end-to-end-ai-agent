import path from 'path';
import fs from 'fs';
import { app } from 'electron';
export const NON_OLLAMA_MODELS = {
    "tiny.en": {
        id: "tiny.en",
        category: "intelligence",
        files: [
            { name: "model.bin", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/model.bin" },
            { name: "config.json", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/config.json" },
            { name: "vocabulary.txt", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/vocabulary.txt" },
            { name: "tokenizer.json", url: "https://huggingface.co/Systran/faster-whisper-tiny.en/resolve/main/tokenizer.json" }
        ]
    },
    "base.en": {
        id: "base.en",
        category: "intelligence",
        files: [
            { name: "model.bin", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/model.bin" },
            { name: "config.json", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/config.json" },
            { name: "vocabulary.txt", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/vocabulary.txt" },
            { name: "tokenizer.json", url: "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/tokenizer.json" }
        ]
    },
    "standard-v1": {
        id: "standard-v1",
        category: "presence",
        files: [
            { name: "duration_predictor.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/duration_predictor.onnx" },
            { name: "text_encoder.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/text_encoder.onnx" },
            { name: "vector_estimator.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/vector_estimator.onnx" },
            { name: "vocoder.onnx", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/vocoder.onnx" },
            { name: "tts.json", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/tts.json" },
            { name: "unicode_indexer.json", url: "https://huggingface.co/Supertone/supertonic/resolve/main/onnx/unicode_indexer.json" }
        ]
    }
};
export function getLocalModelDir(category, modelId) {
    return path.join(app.getPath('userData'), 'models', category, modelId);
}
export function isModelInstalled(modelId) {
    const def = NON_OLLAMA_MODELS[modelId];
    if (!def)
        return false;
    const dir = getLocalModelDir(def.category, modelId);
    if (!fs.existsSync(dir))
        return false;
    return def.files.every(f => fs.existsSync(path.join(dir, f.name)));
}
export function deleteModel(modelId) {
    const def = NON_OLLAMA_MODELS[modelId];
    if (!def)
        return false;
    const dir = getLocalModelDir(def.category, modelId);
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        return true;
    }
    return false;
}
