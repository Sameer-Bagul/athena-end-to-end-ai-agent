from faster_whisper import WhisperModel
from fastapi import FastAPI, UploadFile, File
import uvicorn
import os
import shutil
import tempfile

app = FastAPI()

# Initialize Model (CPU for compatibility, INT8 quantization default)
print("Loading Whisper Model (base.en)...", flush=True)
model = WhisperModel("base.en", device="cpu", compute_type="int8")
print("Model Loaded.", flush=True)

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    print(f"Received request: {file.filename}", flush=True)
    
    suffix = ".wav" 
    if file.filename.endswith(".webm"):
        suffix = ".webm"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        file_size = os.path.getsize(tmp_path)
        print(f"Processing file: {tmp_path} ({file_size} bytes)", flush=True)
        
        segments, info = model.transcribe(tmp_path, beam_size=5)
        text = "".join([segment.text for segment in segments]).strip()
        
        print(f"Transcribed ({info.language}): {text}", flush=True)
        return {"text": text}
    except Exception as e:
        print(f"Error processing audio: {e}", flush=True)
        return {"error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    print("Starting Uvicorn Server on port 9001...", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=9001)
