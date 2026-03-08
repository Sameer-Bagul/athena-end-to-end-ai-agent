from faster_whisper import WhisperModel
from fastapi import FastAPI, UploadFile, File
import uvicorn
import os
import shutil
import tempfile

app = FastAPI()

# Global model cache to avoid re-loading same model
current_model_name = "tiny.en"
model = None

def get_model(name: str):
    global model, current_model_name
    if model is None or name != current_model_name:
        print(f"Loading Whisper Model ({name})...", flush=True)
        
        # Check if we have a locally downloaded version in ATHENA_USER_DATA
        user_data = os.environ.get("ATHENA_USER_DATA")
        local_path = None
        if user_data:
            possible_path = os.path.join(user_data, "models", "intelligence", name)
            if os.path.exists(possible_path) and os.path.exists(os.path.join(possible_path, "model.bin")):
                local_path = possible_path
                print(f"Using local model from: {local_path}", flush=True)

        # Load from local_path if exists, otherwise fallback to standard cache
        model = WhisperModel(local_path or name, device="cpu", compute_type="int8")
        current_model_name = name
        print(f"Model {name} Loaded.", flush=True)
    return model

@app.get("/status")
async def status(model_name: str = "tiny.en"):
    """Check if a model is downloaded/ready"""
    # faster-whisper downloads to ~/.cache/huggingface/hub by default
    # We can check if it exists or just return currently loaded info
    return {
        "loaded_model": current_model_name,
        "is_ready": model is not None,
        "available": ["tiny.en", "base.en"]
    }

@app.post("/stt")
async def stt(file: UploadFile = File(...), model_name: str = "tiny.en"):
    print(f"Received request: {file.filename} using {model_name}", flush=True)
    
    active_model = get_model(model_name)
    
    suffix = ".wav" 
    if file.filename.endswith(".webm"):
        suffix = ".webm"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        segments, info = active_model.transcribe(tmp_path, beam_size=5)
        text = "".join([segment.text for segment in segments]).strip()
        
        print(f"Transcribed ({info.language}): {text}", flush=True)
        return {"text": text}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    print("Starting Uvicorn Server on port 9001...", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=9001)
