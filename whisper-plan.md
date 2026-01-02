Awesome — let’s lock in **Option 1: Faster-Whisper as a local STT service** and do it *properly*, clean, and future-proof.

This plan will:

✔ avoid the Whisper.cpp crashes
✔ give you clearer logs + debugging
✔ keep your laptop usable
✔ integrate cleanly with Electron
✔ make it easy to upgrade later

We’ll go step-by-step.

---

# 🚀 GOAL

Architecture we are building:

```
🎤 Mic (Electron UI)
   ↓
Athena Backend (IPC handler)
   ↓
Faster-Whisper local server (Python)
   ↓
JSON text back to Athena
   ↓
LLM → TTS → Avatar
```

Each piece stays simple. No giant tangled codeball.

---

# 🗂️ STEP 1 — Create folder structure

Inside your Electron repo:

```
athena/
 ├ services/
 │   └ whisper-fast/
 │        ├ server.py
 │        ├ requirements.txt
 │        └ models/   (optional cache)
```

This keeps STT isolated.

---

# 🐍 STEP 2 — Create Python virtual env (Ubuntu)

Inside project root:

```bash
cd services
python3 -m venv stt-env
source stt-env/bin/activate
```

(Whenever working on STT, activate again with the same `source…` command.)

---

# 📦 STEP 3 — Install Faster-Whisper & API tools

Create file:

`services/whisper-fast/requirements.txt`

Put:

```
faster-whisper
fastapi
uvicorn
pydub
```

Install:

```bash
pip install -r services/whisper-fast/requirements.txt
```

First install will download models automatically later.

---

# 🧠 STEP 4 — Create the STT server

Create file:

`services/whisper-fast/server.py`

Paste:

```python
from faster_whisper import WhisperModel
from fastapi import FastAPI, UploadFile
import uvicorn
import tempfile
import os

app = FastAPI()

model = WhisperModel("base", device="cpu")

@app.post("/stt")
async def stt(file: UploadFile):
    # Save temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    segments, _ = model.transcribe(tmp_path)
    text = "".join(seg.text for seg in segments)

    os.remove(tmp_path)

    return {"text": text}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9001)
```

Run server manually to verify:

```bash
python services/whisper-fast/server.py
```

You should see:

```
Uvicorn running on http://127.0.0.1:9001
```

🎉 STT backend ready.

---

# 🧪 STEP 5 — Test manually (before Electron)

Test with curl:

```bash
curl -X POST "http://127.0.0.1:9001/stt" \
  -F file="@test.wav"
```

You should get:

```json
{ "text": "hello world" }
```

If this works → our base is solid.

---

# 🖥 STEP 6 — Integrate STT with Electron backend

In your Electron backend (Node side), create:

`dist-electron/backend/stt.js` (or TS version):

```js
const fetch = require("node-fetch");
const FormData = require("form-data");

async function transcribe(buffer) {
  try {
    const form = new FormData();
    form.append("file", buffer, {
      filename: "audio.wav",
      contentType: "audio/wav"
    });

    const res = await fetch("http://127.0.0.1:9001/stt", {
      method: "POST",
      body: form
    });

    const json = await res.json();

    return json?.text ?? "";
  } catch (err) {
    console.error("[STT ERROR]", err);
    return "";
  }
}

module.exports = { transcribe };
```

Wire to IPC in main process:

```js
ipcMain.handle("stt:transcribe", async (_, wavBuffer) => {
  return await transcribe(wavBuffer);
});
```

Renderer continues sending **WAV buffer** like we already built.

---

# 🔁 STEP 7 — Auto-start STT server with Electron

Later (not right now), we’ll make Electron spawn:

```bash
python services/whisper-fast/server.py
```

and restart if it crashes.

But first get it running manually.

---

# ⚙️ STEP 8 — Performance tuning (important)

You want your laptop to stay usable.

Inside server code, change:

```python
model = WhisperModel("base", device="cpu")
```

Try models:

| model  | speed | accuracy              | good for    |
| ------ | ----- | --------------------- | ----------- |
| tiny   | ⚡⚡⚡   | 😐                    | prototyping |
| base   | ⚡⚡    | 🙂                    |             |
| small  | ⚡     | 🙂                    |             |
| medium | 🐢    | 👍                    |             |
| large  | 🐌    | 🔥 accuracy but heavy |             |

For now:

```python
WhisperModel("tiny", device="cpu")
```

Much lighter.

---

# 🧯 STEP 9 — Error handling & resilience

We want:

✔ server never kills app
✔ Electron doesn’t crash
✔ clear logs

Add guard in UI: if text == "", ignore.

---

# 📦 STEP 10 — Packaging strategy (important)

When you later build .exe / .deb:

👉 Python service **does NOT go inside Electron bundle**

Instead:

Option A (easier now):
User installs python engine separately (Athena installer helper later)

Option B (later):
Bundle Python runtime + STT microservice

Both are doable — don’t worry yet.

---

# 🎯 What you get from Option 1

✔ stable STT
✔ predictable memory
✔ clean logs
✔ supports streaming later
✔ easier feature growth
✔ microservice architecture (ideal for Athena)

This is MUCH more “product-grade” than whisper.cpp.

---

# 🔜 What we’ll do next (after STT works)

Next steps:

1️⃣ connect STT → LLM (Ollama)
2️⃣ add conversation memory
3️⃣ pipe reply into SuperTonic TTS
4️⃣ sync avatar speech + animation
5️⃣ barge-in interruption

One clean layer at a time.

---

## 👍 Your turn

Do these now, in order:

1️⃣ create the folder + Python server
2️⃣ run:

```
python services/whisper-fast/server.py
```

3️⃣ test with `curl`
4️⃣ then try from Athena UI

Then paste:

✔ success logs
OR
❌ error logs

I’ll stay with you until it’s fully working.
