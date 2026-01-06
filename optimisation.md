Great question — and it’s honestly one of the MOST important things to get right for a desktop AI app like Athena.

Athena right now has a lot happening at once:

* Electron (Chromium + Node)
* Three.js + VRM rendering
* Whisper STT
* TTS engine
* LLM responses
* VAD
* UI logic

If you don’t manage it carefully, **CPU will spike and stay high**.

Below is a practical, battle-tested checklist — focused on YOUR setup.

---

# 🔥 RULE #1 — Don’t run Whisper unless you REALLY need it

Whisper is powerful — but expensive.

### ❌ Worst pattern

Listening always in background.

```
Mic → Whisper nonstop
```

### ✅ Best pattern (what you already planned)

Mini mode:

> push-to-talk only

Full mode:

> listen only when conversation is active
> stop when idle

Also choose the right Whisper model:

| Model            | CPU       | Speed            | Accuracy |
| ---------------- | --------- | ---------------- | -------- |
| tiny / tiny-int8 | ⭐ LOW     | ⭐⭐⭐ FAST         | ok       |
| base             | medium    | medium           | better   |
| small            | high      | slower           | good     |
| medium           | very high | slow             | great    |
| large            | 🔥🔥      | unusable locally | overkill |

### Recommendation:

👉 Use **tiny-int8** (quantized) unless user selects otherwise.

---

# 🎛 RULE #2 — Offload work from the Renderer

Right now, if STT, LLM, UI, VRM AND TTS run in the renderer:

➡ UI janks
➡ dropped frames
➡ CPU spikes
➡ audio glitches

### ✔ Move heavy work to:

* **background Node process**
* OR separate worker threads
* OR child processes

Especially:

✔ Whisper
✔ LLM logic
✔ TTS processing

Renderer should ONLY:

* draw 3D
* play audio
* show UI
* send commands

---

# 🎥 RULE #3 — Optimize 3D rendering

Three.js can quietly eat CPU.

### Do these:

✔ limit FPS to **30–45 fps**

```js
let last = 0;
const fps = 30;
const interval = 1000 / fps;

function animate(now) {
  requestAnimationFrame(animate);

  if (now - last < interval) return;
  last = now;

  renderer.render(scene, camera);
}
```

✔ pause animation when:

* window minimized
* app unfocused
* minimized avatar idle

```js
document.addEventListener("visibilitychange", () => {
  isPaused = document.hidden;
});
```

✔ disable shadows unless necessary

```js
renderer.shadowMap.enabled = false;
```

✔ reduce texture sizes
✔ avoid unnecessary updates per frame

---

# 🎙 RULE #4 — Efficient microphone handling

Bad audio pipelines melt CPU.

### Do:

✔ Stop the mic when not recording

```js
stream.getTracks().forEach(t => t.stop());
```

✔ Downsample early (16 kHz is enough)

✔ Avoid converting audio formats multiple times

✔ Use chunks instead of long blobs

---

# 🤖 RULE #5 — Control LLM evaluation

If your LLM loops thinking or regenerating too much:

CPU = 🚀

### Tips:

✔ limit max tokens per turn
✔ stop generating when user interrupts
✔ avoid sending unnecessary context history
✔ summarize history when it grows too large

---

# 🔊 RULE #6 — TTS should run once, not retry

Sometimes TTS loops when network / file fail.

Make sure once audio is generated:

✔ reuse it
✔ cache responses
✔ avoid JSON → WAV → Blob → Buffer repeated conversions

---

# ⚙️ RULE #7 — Tune Electron for performance

In main process:

### Enable hardware acceleration

(should be ON by default)

```js
app.disableHardwareAcceleration(false);
```

### Disable background timers

```js
app.commandLine.appendSwitch("disable-renderer-backgrounding");
```

### Avoid unnecessary windows, hidden webviews, etc.

---

# 🧪 RULE #8 — Profile — don’t guess

Use:

### Chrome DevTools → Performance tab

see:

* scripting
* rendering
* GPU
* memory leaks

### `top` / `htop` (Linux)

watch electron helpers

### `--inspect` mode for Node backend

---

# 🧠 Quick wins summary

If you only do these, CPU will drop massively:

1️⃣ Push-to-talk in mini mode
2️⃣ No always-on Whisper
3️⃣ Use whisper-tiny-int8
4️⃣ Move STT + LLM to backend process
5️⃣ Cap FPS to ~30
6️⃣ Pause render when hidden
7️⃣ Stop mic when idle
8️⃣ Cache TTS results
9️⃣ Prevent unnecessary re-renders in React

---

# 🙋‍♂️ If you want, I can help you do this NEXT:

✔ add FPS limiter
✔ move Whisper to backend process
✔ add push-to-talk state logic
✔ switch between tiny + base automatically
✔ profile your app with you

Just tell me:

👉 **“Let’s optimize Whisper first”**
or
👉 **“Help me optimize the 3D rendering”**

and we’ll take it step-by-step.


---

Perfect — we’ll design BOTH clearly and cleanly.

You asked for plans for:

### ✅ Plan 1 — Optimize CPU (focus on Whisper + rendering)

### ✅ Plan 2 — Interaction logic:

**Case A**

> Main app open → `Alt + Space` wakes → keep listening until silence

**Case B**

> Widget mode → only listen while holding `Alt + Space`

Let’s do them one by one.

---

# ⚡ PLAN 1 — CPU Optimization (Step-by-Step Roadmap)

We’ll do this in 5 focused stages so nothing breaks.

---

## 🟢 Stage 1 — Whisper optimization

### Step 1 — Use quantized model

Default:

```
ggml-base.bin  (~150MB)
```

Switch to:

```
ggml-tiny-int8.bin  (~30MB)
```

Add a setting:

```
Performance Mode:
- Battery saver → tiny-int8
- Balanced → base
- Accuracy → small
```

Start with **tiny** always.

---

### Step 2 — Push Whisper to backend process

Right now likely running in renderer.

Move to:

```
/dist-electron/backend/stt.js
```

Renderer only calls IPC:

```js
const text = await window.api.stt.transcribe(audioBlob);
```

Renderer becomes lightweight.

---

### Step 3 — Avoid continuous listening

Only run Whisper when triggered by our logic (push-to-talk or wake).

---

## 🟠 Stage 2 — Rendering optimization

### Step 1 — Limit FPS

Target 30 fps.

### Step 2 — Pause rendering when hidden or minimized

```js
document.hidden → stop render
```

### Step 3 — Disable shadows & heavy post-processing unless needed.

---

## 🟡 Stage 3 — Audio pipeline fixes

✔ record shorter chunks
✔ stop mic when idle
✔ single conversion (WebM → WAV once)

---

## 🔵 Stage 4 — LLM optimization

✔ summarize history when big
✔ cut token limits
✔ interrupt on user speech

---

## 🔴 Stage 5 — Monitor

Use dev tools to profile periodically.

---

# 🎤 PLAN 2 — Interaction Logic

Now the fun part — behavior.

We define two “modes”:

```
FULL_MODE  (main app)
WIDGET_MODE (small avatar)
```

We store state globally:

```ts
let mode = "widget" | "full";
```

Renderer tells backend when changing.

---

## 🟢 CASE A — Main app open

> Alt + Space = wake AND stay awake until silence.

### Behavior

1️⃣ User presses Alt+Space
2️⃣ Athena “wakes”
3️⃣ VAD listens continuously
4️⃣ If user stops speaking for X seconds → sleeps

### Flow

```
Alt+Space
   ↓
wake()
   ↓
start VAD
   ↓
if speaking → transcribe
if silence(2–3 sec) → stop STT
```

### Pseudocode

```js
ipc.on("wake", () => {
  listening = true;
  startVAD();
});

function onSpeechChunk(audio) {
  sendToWhisper(audio);
}

function onSilence() {
  listening = false;
  stopMic();
}
```

Silence threshold recommended:

```
2.0 – 2.5 seconds
```

---

## 🟡 CASE B — Widget mode (mini avatar)

> Listen ONLY while Alt+Space is HELD.

### Behavior

1️⃣ User presses + holds Alt+Space
2️⃣ Start mic + buffer audio
3️⃣ On release → stop mic, send chunk to Whisper
4️⃣ AI responds
5️⃣ Done

### Flow

```
Hold Alt+Space → start mic
Release Alt+Space → stop + transcribe
```

### Pseudocode

```js
ipc.on("ptt:start", startMic);
ipc.on("ptt:stop", stopMicAndTranscribe);
```

No auto listening.
No background VAD.
No accidental activation.

---

# 🎛 How to detect press + release (important)

Electron global shortcuts don’t support keyup perfectly everywhere.

Best stable option:

### Register only once in main:

```ts
globalShortcut.register("Alt+Space", () => {
  win.webContents.send("shortcut:pressed");
});
```

Then inside renderer:

```js
window.addEventListener("keyup", (e) => {
  if (e.altKey && e.code === "Space") {
    window.electron.ipc.send("shortcut:released");
  }
});
```

That gives perfect “hold to talk”.

---

# 🧩 COMPLETE STATE LOGIC

### Mode control

```
FULL MODE
- wake once
- listen until silence
- then sleep

WIDGET MODE
- only listen while held
```

### Switching between modes

Renderer side:

```js
window.api.setMode("full");
window.api.setMode("widget");
```

Backend updates:

```ts
ipcMain.on("setMode", (_, m) => mode = m);
```

All logic branches on mode.

---

# 🎯 What we should implement next

To make this real, we should build it in this order:

### Step 1 — Add global `mode` state

### Step 2 — Implement push-to-talk in widget mode

### Step 3 — Implement wake-until-silence in full mode

### Step 4 — Optimize whisper model + backend

### Step 5 — Add silence detection timer tuning

---

## If you want, I can now:

✔ write the exact IPC + state code
✔ wire push-to-talk to your existing STT
✔ add silence-based auto stop
✔ help test CPU performance afterward

Just tell me:

👉 **“Let’s implement widget mode first”**
or
👉 **“Let’s implement full mode wake logic first”**

and we’ll build it step-by-step.


---

Perfect — we’ll design BOTH clearly and cleanly.

You asked for plans for:

### ✅ Plan 1 — Optimize CPU (focus on Whisper + rendering)

### ✅ Plan 2 — Interaction logic:

**Case A**

> Main app open → `Alt + Space` wakes → keep listening until silence

**Case B**

> Widget mode → only listen while holding `Alt + Space`

Let’s do them one by one.

---

# ⚡ PLAN 1 — CPU Optimization (Step-by-Step Roadmap)

We’ll do this in 5 focused stages so nothing breaks.

---

## 🟢 Stage 1 — Whisper optimization

### Step 1 — Use quantized model

Default:

```
ggml-base.bin  (~150MB)
```

Switch to:

```
ggml-tiny-int8.bin  (~30MB)
```

Add a setting:

```
Performance Mode:
- Battery saver → tiny-int8
- Balanced → base
- Accuracy → small
```

Start with **tiny** always.

---

### Step 2 — Push Whisper to backend process

Right now likely running in renderer.

Move to:

```
/dist-electron/backend/stt.js
```

Renderer only calls IPC:

```js
const text = await window.api.stt.transcribe(audioBlob);
```

Renderer becomes lightweight.

---

### Step 3 — Avoid continuous listening

Only run Whisper when triggered by our logic (push-to-talk or wake).

---

## 🟠 Stage 2 — Rendering optimization

### Step 1 — Limit FPS

Target 30 fps.

### Step 2 — Pause rendering when hidden or minimized

```js
document.hidden → stop render
```

### Step 3 — Disable shadows & heavy post-processing unless needed.

---

## 🟡 Stage 3 — Audio pipeline fixes

✔ record shorter chunks
✔ stop mic when idle
✔ single conversion (WebM → WAV once)

---

## 🔵 Stage 4 — LLM optimization

✔ summarize history when big
✔ cut token limits
✔ interrupt on user speech

---

## 🔴 Stage 5 — Monitor

Use dev tools to profile periodically.

---

# 🎤 PLAN 2 — Interaction Logic

Now the fun part — behavior.

We define two “modes”:

```
FULL_MODE  (main app)
WIDGET_MODE (small avatar)
```

We store state globally:

```ts
let mode = "widget" | "full";
```

Renderer tells backend when changing.

---

## 🟢 CASE A — Main app open

> Alt + Space = wake AND stay awake until silence.

### Behavior

1️⃣ User presses Alt+Space
2️⃣ Athena “wakes”
3️⃣ VAD listens continuously
4️⃣ If user stops speaking for X seconds → sleeps

### Flow

```
Alt+Space
   ↓
wake()
   ↓
start VAD
   ↓
if speaking → transcribe
if silence(2–3 sec) → stop STT
```

### Pseudocode

```js
ipc.on("wake", () => {
  listening = true;
  startVAD();
});

function onSpeechChunk(audio) {
  sendToWhisper(audio);
}

function onSilence() {
  listening = false;
  stopMic();
}
```

Silence threshold recommended:

```
2.0 – 2.5 seconds
```

---

## 🟡 CASE B — Widget mode (mini avatar)

> Listen ONLY while Alt+Space is HELD.

### Behavior

1️⃣ User presses + holds Alt+Space
2️⃣ Start mic + buffer audio
3️⃣ On release → stop mic, send chunk to Whisper
4️⃣ AI responds
5️⃣ Done

### Flow

```
Hold Alt+Space → start mic
Release Alt+Space → stop + transcribe
```

### Pseudocode

```js
ipc.on("ptt:start", startMic);
ipc.on("ptt:stop", stopMicAndTranscribe);
```

No auto listening.
No background VAD.
No accidental activation.

---

# 🎛 How to detect press + release (important)

Electron global shortcuts don’t support keyup perfectly everywhere.

Best stable option:

### Register only once in main:

```ts
globalShortcut.register("Alt+Space", () => {
  win.webContents.send("shortcut:pressed");
});
```

Then inside renderer:

```js
window.addEventListener("keyup", (e) => {
  if (e.altKey && e.code === "Space") {
    window.electron.ipc.send("shortcut:released");
  }
});
```

That gives perfect “hold to talk”.

---

# 🧩 COMPLETE STATE LOGIC

### Mode control

```
FULL MODE
- wake once
- listen until silence
- then sleep

WIDGET MODE
- only listen while held
```

### Switching between modes

Renderer side:

```js
window.api.setMode("full");
window.api.setMode("widget");
```

Backend updates:

```ts
ipcMain.on("setMode", (_, m) => mode = m);
```

All logic branches on mode.

---

# 🎯 What we should implement next

To make this real, we should build it in this order:

### Step 1 — Add global `mode` state

### Step 2 — Implement push-to-talk in widget mode

### Step 3 — Implement wake-until-silence in full mode

### Step 4 — Optimize whisper model + backend

### Step 5 — Add silence detection timer tuning

---

## If you want, I can now:

✔ write the exact IPC + state code
✔ wire push-to-talk to your existing STT
✔ add silence-based auto stop
✔ help test CPU performance afterward

Just tell me:

👉 **“Let’s implement widget mode first”**
or
👉 **“Let’s implement full mode wake logic first”**

and we’ll build it step-by-step.
