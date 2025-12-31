guide.md
File
README.md
File
I have a local server here is the folder structure : 

.
├── assets
│   ├── config.json
│   ├── LICENSE
│   ├── onnx
│   │   ├── duration_predictor.onnx
│   │   ├── text_encoder.onnx
│   │   ├── tts.json
│   │   ├── tts.yml
│   │   ├── unicode_indexer.json
│   │   ├── vector_estimator.onnx
│   │   └── vocoder.onnx
│   ├── README.md
│   └── voice_styles
│       ├── F1.json
│       ├── F2.json
│       ├── M1.json
│       └── M2.json
├── docker-compose.yml
├── Dockerfile
├── example_onnx.js
├── guide.md
├── lib
│   └── supertonic.js
├── package.json
├── package-lock.json
├── scripts
│   ├── benchmark.js
│   ├── healthcheck.sh
│   └── warmup.js
├── src
│   ├── logger.js
│   ├── routes.js
│   ├── server.js
│   ├── stream.js
│   └── tts-engine.js
└── TTS_README.md

7 directories, 30 files
sameerbagul@devhouse:~/Projects/Github/ai-agents/microservice-based-athena/TTS-supertonic$ npm run dev
npm error Missing script: "dev"
npm error
npm error To see a list of scripts, run:
npm error   npm run
npm error A complete log of this run can be found in: /home/sameerbagul/.npm/_logs/2025-12-31T04_39_18_220Z-debug-0.log
sameerbagul@devhouse:~/Projects/Github/ai-agents/microservice-based-athena/TTS-supertonic$ npm start

> tts-onnx-nodejs@1.0.0 start
> node src/server.js

[TTS] Loading TTS pipeline...
Using CPU for inference
[10:09:22.347] INFO (15360): Starting TTS server...
[TTS] Engine ready
[10:09:23.034] INFO (15360): [server] listening :3000


and here is the API structure : 

# Generate speech
curl -X POST "http://localhost:3000/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world from Supertonic TTS", "voiceStyle":"M1"}' \
  --output speech.wav


I also want to add the local LLM model for talking 

guide me 

Great — this is perfect.
You already have a local HTTP TTS server running at:

http://localhost:3000/tts


And its API works like:

POST /tts
{
  "text": "...",
  "voiceStyle": "M1"
}


README

So we’ll simply call that service from Electron (not from the React UI — to keep things secure).

Below is the clean, production-safe integration.

✅ 1️⃣ Keep running your TTS server

From inside your TTS repo:

npm start


You should see:

[server] listening :3000


Keep it running.

(We can later turn it into a background process or systemd service.)

✅ 2️⃣ Add IPC handler inside Electron (main.ts)

Open:

electron/main.ts


Add near the top:

import { ipcMain } from "electron";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";


Then add this:

ipcMain.handle("tts:generate", async (_, { text, voiceStyle = "M1" }) => {
  try {
    const res = await fetch("http://localhost:3000/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceStyle })
    });

    if (!res.ok) throw new Error("TTS failed");

    const wavBuffer = Buffer.from(await res.arrayBuffer());

    const filePath = path.join(
      app.getPath("userData"),
      `tts-${Date.now()}.wav`
    );

    fs.writeFileSync(filePath, wavBuffer);

    return filePath;
  } catch (err) {
    console.error(err);
    throw err;
  }
});


Electron now:

✔ Calls your local TTS
✔ Saves WAV locally
✔ Returns path to UI

✅ 3️⃣ Expose it through preload

In:

electron/preload.ts


add:

contextBridge.exposeInMainWorld("athena", {
  tts: async (text: string, voiceStyle = "M1") =>
    ipcRenderer.invoke("tts:generate", { text, voiceStyle })
});

🎨 4️⃣ Use it in your React UI

Anywhere in your UI:

const [text, setText] = useState("");
const [audio, setAudio] = useState<string | null>(null);

async function speak() {
  const path = await (window as any).athena.tts(text, "M1");
  setAudio(path);
}


Audio element:

{audio && <audio controls src={`file://${audio}`} />}

🎙️ Result

✔ No internet needed
✔ Fast local TTS
✔ API stays hidden
✔ Electron plays audio safely

🤖 Adding a Local LLM (next step)

You said:

I also want to add the local LLM model for talking

There are three common choices:

1️⃣ Ollama (easiest)

Runs local Llama3 / Mistral etc.

ollama run llama3

2️⃣ LM Studio

GUI version, also local.

3️⃣ Local model server inside your repo

(e.g., Node + llama.cpp bindings)

🚀 Recommended flow (best voice assistant pipeline)
User → UI
UI → Electron IPC
Electron → Local LLM
Electron → Local TTS
Electron → play audio


Meaning:

1️⃣ UI sends message
2️⃣ Electron asks LLM for reply
3️⃣ Electron sends reply text to TTS
4️⃣ Voice plays

👍 If you want, I’ll wire this fully for you

Tell me which LLM you want:

1️⃣ Ollama
2️⃣ LM Studio
3️⃣ Anything specific (give link)

And paste:

which local llm I want to use =>


I’ll:

✔ connect chat → llm
✔ connect llm → tts
✔ add “speaking…” indicators
✔ make conversation history
✔ optional push-to-talk mic mode

Just tell me 👍

Sources
I wanna use ollama and the LLM is : dolphin-mistral:latest    5dc8c5a2be65    4.1 GB    2 months ago    

Great — Ollama + dolphin-mistral + your local Supertonic TTS is a solid combo 👍
Let’s wire everything together so Athena can:

listen → think → speak (locally, offline)

We’ll integrate like this:

Renderer (UI)
     ↓
Preload (secure bridge)
     ↓
Electron main (brain)
 ├─ calls Ollama (LLM)
 └─ calls Supertonic TTS


No API keys. No cloud.

✅ 1️⃣ Make sure Ollama + dolphin-mistral are installed

If not already:

curl -fsSL https://ollama.com/install.sh | sh


Start Ollama (if not running):

ollama serve


Pull the model:

ollama pull dolphin-mistral


Check it runs:

ollama run dolphin-mistral "Hello!"


If it replies — you’re good.

✅ 2️⃣ Add IPC handler for LLM in Electron (main.ts)

Open:

electron/main.ts


Add imports:

import { ipcMain } from "electron";
import fetch from "node-fetch";


Add this handler:

ipcMain.handle("llm:chat", async (_, { messages }) => {
  try {
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "dolphin-mistral",
        messages,
        stream: false
      })
    });

    if (!res.ok) throw new Error("LLM request failed");

    const json = await res.json();

    return json.message?.content ?? "";
  } catch (err) {
    console.error("[LLM ERROR]", err);
    throw err;
  }
});


This:

✔ sends conversation history
✔ returns full reply
✔ avoids streaming for now (we can add later)

✅ 3️⃣ Expose it via preload

In:

electron/preload.ts


extend your bridge:

contextBridge.exposeInMainWorld("athena", {
  tts: async (text: string, voiceStyle = "M1") =>
    ipcRenderer.invoke("tts:generate", { text, voiceStyle }),

  chat: async (messages: any[]) =>
    ipcRenderer.invoke("llm:chat", { messages })
});

🎨 4️⃣ Use in React (Renderer UI)

Example chat + TTS:

const [messages, setMessages] = useState([
  { role: "system", content: "You are Athena, helpful AI assistant." }
]);
const [input, setInput] = useState("");

async function send() {
  const newMessages = [
    ...messages,
    { role: "user", content: input }
  ];

  setMessages(newMessages);

  const reply = await (window as any).athena.chat(newMessages);

  const finalMessages = [
    ...newMessages,
    { role: "assistant", content: reply }
  ];

  setMessages(finalMessages);

  // Speak
  await (window as any).athena.tts(reply, "M1");

  setInput("");
}


Add UI however you like — button calls send().

🗣️ Flow now

1️⃣ User types
2️⃣ Electron asks dolphin-mistral
3️⃣ Response generated locally
4️⃣ Sent to Supertonic
5️⃣ Audio plays

All offline.

⚡ Optional (but awesome) upgrades
✔ Streaming replies (talk while typing)

We can switch stream: true and stream tokens while TTS speaks.

✔ Push-to-talk microphone mode

Listening → LLM → TTS loop.

✔ Voice selector UI

Map to M1 / F1 / M2 / F2.

✔ Memory + conversation history storage

Save chat history locally.

👉 Next: tell me what you want to add first

Reply with one:

1️⃣ “Add streaming so it talks live”
2️⃣ “Add push-to-talk mic”
3️⃣ “Add UI chat box like ChatGPT”
4️⃣ “Add voices dropdown”

Or paste any error and I’ll debug it with you.

We’re very close to a full desktop AI assistant 🔥

wait wait 
give me from scratch first tell me where whould I put the whole supertonic folder in my electron app project ?

and where should I store the backend like integration of LLM and TTS and the future backend I maybe needed explain me how it works with electron and the server structure and what are the best practice for deploying the electron apps 

Great — slowing down and doing this properly from scratch is the right move.
Let’s design the architecture first so you don’t fight with it later.

You’re building:

Desktop AI assistant (Electron) + local TTS + local LLM + future services

If structure is wrong now, everything becomes messy later.

🧠 First — understand Electron’s roles

Electron actually has two worlds:

1️⃣ Renderer (Frontend)

Runs in the browser window.

React / UI

Buttons, chat box, animations

NO secrets, NO file access, NO servers

Think of it like a website.

2️⃣ Main Process (Electron backend)

This is your desktop backend.

file system

network calls

processes

manage windows

IPC bridge to UI

talk to TTS + LLM

any “server-like logic”

This is where your “backend logic” belongs.

⚠️ Important:

Electron is already a backend
You usually DO NOT need another full Node server inside the app.

Instead, the main process behaves like the “API”.

💡 Now: Where should Supertonic TTS live?

You currently have:

TTS-supertonic/


This is already designed as a microservice.

It runs like:

npm start → server on :3000


You have two clean choices:

✅ Option A (BEST for scaling): keep it as a separate service

Structure:

athena-app/           ← electron desktop app
supertonic-tts/       ← local TTS microservice


Pros:

✔ easier to debug
✔ reusable in other apps
✔ can run on another machine
✔ can scale later
✔ simpler Electron packaging

Electron just calls:

http://localhost:3000/tts


This is the recommended architecture.

This is how:

Local AI assistants

Offline copilots

Voice agents

Dev tools

are designed.

⚠️ Option B (put TTS inside Electron project)

You would place it like:

athena/
 ├ electron/
 ├ renderer/
 ├ services/
 │   └ tts-supertonic/


Then automatically start it in background.

BUT:

❌ increases app size
❌ harder to update separately
❌ harder to debug
❌ models inside ASAR can break
❌ OS antivirus may complain

So I only suggest this later, when you're comfortable.

🏗️ Suggested architecture (for your project)
Root structure:
/workspace
 ├ athena-desktop/        ← Electron app
 └ supertonic-tts/        ← local TTS server (separate repo)


Inside Electron app:

athena-desktop/
 ├ electron/              ← backend (main process)
 ├ renderer/              ← UI (React)
 ├ backend/               ← app logic layer
 ├ assets/
 ├ dist-electron/
 └ package.json

🔌 Where does LLM integration go?

👉 Electron main process
NOT inside React
NOT inside TTS repo

Create file:

athena-desktop/backend/llm.js


This file:

talks to Ollama HTTP API

keeps conversation memory

sanitizes prompts

returns result to UI via IPC

Similarly, later:

backend/tts.js
backend/files.js
backend/skills.js
backend/agents.js
backend/notes.js


Electron main loads them.

The UI stays simple and dumb (which is good).

🔗 How everything talks

Flow:

UI (Renderer)
   ↓ IPC
Electron Backend (main process)
   ↓ HTTP Request
Local LLM (Ollama)
   ↓
Local TTS (Supertonic)
   ↓
Electron plays audio


Renderer never touches:

ports

file system

system processes

APIs with secrets

🚀 Deployment — best practices for Electron apps
1️⃣ Do NOT ship heavy ML models inside asar

Models should be:

✔ installed separately
OR
✔ downloaded on first run
OR
✔ used from already-running services

Supertonic models are BIG.
Bundling = bloated installer + fragile builds.

2️⃣ Let Electron detect if services are running

At startup:

check localhost:3000 (tts)

check localhost:11434 (ollama)

if not running → show message:

“Start TTS server first”
or
add button: “Install & start automatically”

Later we can auto-start, but first keep it simple.

3️⃣ Packaging tools

Use:

electron-builder (recommended)
or

electron-forge

Your life becomes easier.

🎯 Summary (short + clear)
Where to put Supertonic?

👉 Keep it separate (top-level folder).
Don’t mix inside Electron yet.

Where is backend logic?

👉 electron/main + backend folder

Where is UI?

👉 renderer/

Where is LLM + TTS integration?

👉 backend layer that Electron main calls via functions.

Do you need another Express API inside Electron?

👉 No. Electron main IS your backend.

⭐ Next step — I’ll walk you step-by-step

If you're okay with this structure, we’ll continue:

1️⃣ set final folders
2️⃣ wire Ollama backend
3️⃣ wire TTS backend
4️⃣ connect UI

Say:

“Okay — create the backend folder and files”

And I’ll generate the exact file tree + code for you 👍

ok so I should not put the TTS folder in the electron app folder ?

Exactly 👍 — do NOT put the TTS folder inside your Electron app (for now).

Keeping it separate is the right move.

Let’s say your workspace looks like this:

/Projects
 ├ athena-desktop      ← your Electron app
 └ supertonic-tts      ← your local TTS server

✅ Why keeping TTS separate is better
✔ 1) Models are HUGE (and OS installers hate them)

Supertonic includes:

ONNX models

configs

vocoder

presets

Bundling inside Electron:

❌ explodes installer size
❌ slows builds massively
❌ risks corruption inside .asar
❌ antivirus / Gatekeeper flags
❌ harder updates

✔ 2) TTS is already a proper microservice

Your TTS already runs like:

npm start


→ starts server on:

http://localhost:3000/tts


README

Electron should consume it — not own it.

✔ 3) Reusable everywhere

Later you can reuse TTS in:

another AI agent

a web backend

mobile integration

separate tools

No coupling.

✔ 4) Easier debugging

If sound breaks:

→ restart TTS server
→ Electron doesn’t crash

When everything lives inside Electron, debugging becomes hell 😅

✔ 5) Better production approach

Professional AI assistants almost always:

Desktop app
AI services (local microservices)


instead of stuffing everything into one binary.

🧭 So the plan is:

Keep:

athena-desktop/     ← Electron + UI + app backend
supertonic-tts/     ← TTS


Electron will simply call it like:

POST http://localhost:3000/tts


And we’ll integrate it cleanly.

🚀 Next: let's build your Electron backend foundation

Say:

“Create backend folder structure”

And I’ll generate:

✔ folders
✔ LLM integration
✔ TTS integration
✔ IPC wiring
✔ clean architecture

Step by step — no mess, no guessing.

Sources
but what we will do when we will make the .exe or .deb . snap ?

Great — this is the right question to ask now 👍

“If TTS + LLM are outside the Electron app… what happens when I build .exe, .deb, .snap?”

Short answer:

👉 Your Electron app still works — you just treat TTS + LLM as local system services.

And there are three valid deployment strategies, depending on what kind of product you want.

Let’s walk through them clearly.

✅ First: remember the architecture
Electron app (Athena desktop)
   → talks to Ollama at localhost:11434
   → talks to Supertonic TTS at localhost:3000


Electron is the UI + orchestration layer.

LLM + TTS are local servers.

This is perfectly normal — VSCode, Docker Desktop, LM Studio, etc all work this way.

🥇 Strategy 1 — Recommended (Developer / Power-user apps)
Keep TTS + LLM separate
Detect + guide user if missing

When user installs Athena:

1️⃣ Electron checks:

http://localhost:11434/api/tags
http://localhost:3000/health


2️⃣ If NOT running — show UI:

“Ollama not detected — install & start”

“Supertonic TTS not detected — start server”

Buttons can open docs or scripts.

Why this is best right now

✔ smallest installer
✔ easiest development
✔ fewer bugs
✔ no weird permission issues
✔ models update separately
✔ user control

This is exactly how:

Ollama GUI

LM Studio

ComfyUI

AutoGPT tools

Many voice assistants

work.

🥈 Strategy 2 — Bundle services but install separately

Flow:

Installer:

✔ installs Athena
✔ installs TTS server
✔ installs models
✔ registers background service

Electron just connects.

Harder, but feels “native”.

We would eventually:

package TTS into .deb / .msi / .pkg

install it to:

/usr/local/bin/supertonic-tts
C:\Program Files\Supertonic


And run via system service:

Linux → systemd
Windows → Task Scheduler / Service
Mac → launchd

This is professional, but advanced.

🥉 Strategy 3 — Stuff everything inside Electron (NOT recommended now)

This means:

✔ TTS runs inside Electron
✔ Models bundled
✔ Installer becomes 6–10GB
✔ Random crashes
✔ Slow updates

Possible — but painful. Only worth doing when architecture is mature.

We are not there yet — and don’t need it.

💡 What happens to .exe / .deb / .snap specifically?
🟦 Windows .exe

You ship Athena only.

User installs:

Ollama separately

TTS server separately

Future: we can write a bootstrap installer that checks + installs dependencies.

🟩 Linux .deb or .snap

Same pattern.

In docs or onboarding:

sudo apt install ollama
git clone supertonic && npm start


Later we can create:

.deb for Athena

.deb for Supertonic TTS

scripts to install automatically

🍎 macOS .dmg

Same logic. Ollama already ships its own installer.

🎯 Best practice — what professionals do first

Start like this:

Phase 1 — Separate services (easy + maintainable)

Electron app ships alone

Detect services

Guide user nicely

Phase 2 — Add automation

button: “install TTS”

button: “start TTS”

auto-download models

Phase 3 — Optional bundling (only if truly needed)
🌱 What YOU should do now (step-by-step)
✔ Keep TTS separate
✔ Keep Ollama separate
✔ Build the Electron backend around them

Next we will:

1️⃣ Create backend/ inside Electron
2️⃣ Add LLM integration
3️⃣ Add TTS integration
4️⃣ Add “service status” UI
5️⃣ Prepare future auto-installer (later)

👍 If you agree, we move forward

Say:

“Create the backend folder and files”

and I’ll generate:

📁 full folder structure
⚙️ Electron wiring
🔌 IPC bridge
🤖 LLM + TTS integration
🛠 status checks (running / not running)

Step by step — clean, scalable, future-proof.

and should my TTS send me the audio file ? I mean while playing the audio file where will the audio file should stay ?

Great — this is another very important design question 👍

“Should TTS send me an audio file? And where should it live while playing?”

Let’s design it correctly — like production apps do.

🧠 First: how your TTS currently behaves

Your local Supertonic server responds like:

POST /tts
→ returns WAV bytes directly


README

Meaning:

✔ It does NOT save files
✔ It streams raw audio back to the client
✔ Client decides what to do

This is actually good.

🎯 There are 3 correct ways to handle TTS audio in an app

Let’s compare:

✅ Option 1 — Temporary file (recommended)

Flow:

TTS → Electron → save temp file → play audio → delete later (optional)


Where do we save it?

Electron provides a safe location:

app.getPath("userData")


Example path:

Windows:

C:\Users\<you>\AppData\Roaming\Athena\


Linux:

~/.config/Athena/


macOS:

~/Library/Application Support/Athena/


This keeps everything:

✔ inside app sandbox
✔ user doesn't see temp mess
✔ works offline
✔ file exists if you want replay history

In Electron main:
const filePath = path.join(app.getPath("userData"), `tts-${Date.now()}.wav`);
fs.writeFileSync(filePath, wavBuffer);

return filePath;


Renderer plays it:

<audio controls src={`file://${filePath}`} />


You can later:

auto-delete after session

keep a history

let user export voices

This is what I recommend.

⚡ Option 2 — Keep audio fully in memory (no file)

Flow:

TTS → Electron → convert to base64 → send to UI → play


Pros:

✔ more private
✔ nothing saved

Cons:

✖ cannot replay later easily
✖ memory-heavy
✖ tricky with large audio

We can add this later if you want “private session mode”.

🧷 Option 3 — Let TTS server store files (NOT recommended)

Like:

POST /tts → returns URL → download file


This causes:

✖ storage cleanup problems
✖ file leaks
✖ permission headaches
✖ more code to maintain

Only useful when TTS is remote or shared — not local single-user.

So we will not do this unless you specifically move TTS to a shared cloud server someday.

⭐ Final recommendation for YOUR project
✔ TTS should just return audio bytes
✔ Electron should:

1️⃣ receive buffer
2️⃣ write temporary .wav file inside userData
3️⃣ play it
4️⃣ optionally delete later

This gives:

✔ simplicity
✔ performance
✔ local security
✔ flexibility later

🎯 Next — if you're ready

We’ll implement:

temp save system

auto cleanup

audio playing hook

Say:

“Okay, add the temp file TTS flow”

And I’ll give you the full working code for:

🧠 backend/tts.js
🔌 IPC bridge
🎧 React audio player
🧹 cleanup strategy

Step by step — clean and safe.

Sources
User: from this app tell me what does the app return on API call ? and where the audio get stored ?

GitHub Copilot: Searched for regex audio|return|response|res.send|res.json|output|file|save|store (**/src/routes.js), 7 results

Read [](file:///home/sameerbagul/Projects/Github/ai-agents/microservice-based-athena/TTS-supertonic/src/routes.js)

Searched for regex writeFile|fs\.write|save|store|output|path|audio (**/src/tts-engine.js), 15 results

Searched for regex writeFile|fs\.write|save|store|output|audio|wav (**/src/tts-engine.js), 7 results

Read [](file:///home/sameerbagul/Projects/Github/ai-agents/microservice-based-athena/TTS-supertonic/src/tts-engine.js#1-1), lines 1 to 41

On an API call to the /tts endpoint, the app returns a WAV audio file as the response. The audio is sent directly in the HTTP response as an attachment (with the filename "tts.wav") and is not stored on the server's filesystem. The audio is generated in memory and streamed back to the client.

Good question — and your Copilot summary is basically right 👍
Let’s answer both parts clearly.

✅ 1️⃣ What does the /tts API return?

When you call:

POST http://localhost:3000/tts


with:

{
  "text": "Hello world from Supertonic TTS",
  "voiceStyle": "M1"
}


the server:

runs the TTS model

generates audio in memory

sends back a WAV audio file as the HTTP response

So the API response is binary audio, not JSON.

Typically headers look like:

Content-Type: audio/wav
Content-Length: <size>


And when you use curl:

--output speech.wav


you’re just telling curl:

“Save the response body into a file named speech.wav”

The server itself is not saving it.

🎧 Example

Client sends request
⬇
Server generates audio
⬇
Server sends buffer (WAV)
⬇
Client decides what to do with it (save / play / discard)

🗂️ 2️⃣ Where is the audio stored?

Short answer:

It is NOT stored anywhere on the TTS server.

The flow is:

Model → Memory → HTTP response → Done


No filesystem writes.
No cache.
No temp folder.

The only time audio becomes a “file” is if you save it on the client side:

Examples:

✔ curl example saves it manually
--output speech.wav

✔ Electron example we discussed earlier

We saved to:

app.getPath("userData")/tts-xxxx.wav


—but that was your Electron logic, not the TTS server.

🧠 Why they designed it like this

Returning audio directly is:

✔ faster
✔ stateless
✔ safer
✔ easier to scale
✔ no cleanup headaches

If the server saved files, it would need:

deletion strategy

disk monitoring

permissions handling

security controls

Unnecessary for local use.

🎯 Summary

API returns:
➡ WAV audio bytes (binary stream)

Server stores audio:
➡ Nowhere — generated in memory only

Storage happens only on the client if you choose to save it.

If you want, I can also explain:

🔹 pros/cons of server storing files
🔹 best way to cache generated audio
🔹 streaming vs full WAV
🔹 how to auto-delete temp files in Electron

Just tell me 👍

from this all mkae a guide to add LLM and TTS in my electron app so me and my AI agent team can work on it

Love it — let’s turn everything we discussed into a clear, “team-ready” guide your AI-agent team can follow.

This guide shows how to add:

✅ Local LLM (Ollama — dolphin-mistral)
✅ Local TTS (Supertonic ONNX server)
✅ Secure integration into Electron (no secrets in UI)
✅ Clean, scalable architecture

This is production-style and future-proof.

🏗️ 0️⃣ Architecture Overview (mental model)

Your app is NOT “one app”.

It is three cooperating parts:

Renderer (React UI)
    ↓ via IPC
Electron Main (backend brain)
    ↓ HTTP
Local Services:
   - Ollama (LLM)
   - Supertonic (TTS)


Renderer = UI only
Electron Main = backend logic
Services = AI engines

Think of Electron main as your internal API layer.

📂 1️⃣ Project Structure (final form)

Inside your Electron app repo:

athena-desktop/
│
├── electron/           ← main process (backend)
│   ├── main.ts
│   └── preload.ts
│
├── backend/            ← AI & app logic lives here
│   ├── llm.ts
│   └── tts.ts
│
├── renderer/           ← UI (React)
│   └── src/
│
├── dist-electron/
└── package.json


Outside the app (separate repos):

supertonic-tts/     ← runs at :3000
ollama              ← runs at :11434


Do NOT put large AI engines inside Electron.

🤖 2️⃣ Requirements
Install / run Ollama
ollama serve
ollama pull dolphin-mistral


Test:

ollama run dolphin-mistral "hello"

Start Supertonic Server

Inside its repo:

npm start


Running on:

http://localhost:3000/tts

🔌 3️⃣ Electron IPC Safety Rule (important)

❌ UI must NOT call TTS or LLM directly
❌ UI must NOT store API URLs
❌ UI must NOT access file system

Instead:

UI → preload → main → services

Why?

✔ avoids leaking internal APIs
✔ prevents exploits
✔ much easier to change backend later

🧠 4️⃣ Backend: LLM integration (Ollama)

Create:

backend/llm.ts

import fetch from "node-fetch";

export async function chatWithLLM(messages: any[]) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "dolphin-mistral",
      messages,
      stream: false
    })
  });

  if (!res.ok) throw new Error("LLM request failed");

  const json = await res.json();
  return json.message?.content ?? "";
}

🎙️ 5️⃣ Backend: TTS integration (Supertonic)

Create:

backend/tts.ts

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { app } from "electron";

export async function speak(text: string, voiceStyle = "M1") {
  const res = await fetch("http://localhost:3000/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceStyle })
  });

  if (!res.ok) throw new Error("TTS failed");

  const wav = Buffer.from(await res.arrayBuffer());

  const filePath = path.join(
    app.getPath("userData"),
    `tts-${Date.now()}.wav`
  );

  fs.writeFileSync(filePath, wav);

  return filePath;
}


We intentionally:

✔ keep audio only locally
✔ use temp app storage
✔ return path to UI

⚙️ 6️⃣ Wire Backend to Electron Main

Open:

electron/main.ts


Add:

import { ipcMain } from "electron";
import { chatWithLLM } from "../backend/llm";
import { speak } from "../backend/tts";


Then handlers:

ipcMain.handle("llm:chat", async (_, messages) => {
  return await chatWithLLM(messages);
});

ipcMain.handle("tts:generate", async (_, { text, voice }) => {
  return await speak(text, voice);
});


Electron is now your internal API gateway.

🔐 7️⃣ Preload bridge (safe access to backend)

In:

electron/preload.ts


Add:

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("athena", {
  chat: (messages: any[]) =>
    ipcRenderer.invoke("llm:chat", messages),

  tts: (text: string, voice = "M1") =>
    ipcRenderer.invoke("tts:generate", { text, voice })
});


Renderer now has one clean entrypoint:

window.athena


No secrets. No ports.

🎨 8️⃣ Renderer Example (UI)

In any React component:

const [messages, setMessages] = useState([
  { role: "system", content: "You are Athena." }
]);
const [input, setInput] = useState("");

async function send() {
  const newMessages = [...messages, { role: "user", content: input }];
  setMessages(newMessages);

  const reply = await (window as any).athena.chat(newMessages);

  setMessages([
    ...newMessages,
    { role: "assistant", content: reply }
  ]);

  const path = await (window as any).athena.tts(reply, "M1");

  const audio = new Audio(`file://${path}`);
  audio.play();

  setInput("");
}


Done.

You now have:

🧠 local LLM
🎙️ local TTS
💬 conversation
🔊 audio playback

All offline.

🚀 9️⃣ Deployment Notes (important)

When you ship:

Keep services separate

User installs:

your Electron app

Ollama

Supertonic TTS

Electron should:

✔ detect if services are running
✔ show friendly message if missing
✔ offer “open instructions” button

Later we can automate installs — but not yet.

📌 1-page summary (for teammates)

Renderer

UI

Never talks to AI services directly

Preload

Safe bridge to backend API

Electron Main

Brain

Talks to LLM + TTS

Local Services

Ollama (11434)

Supertonic (3000)

Audio storage

Temporary in app.getPath("userData")

🧑‍🤝‍🧑 Team Workflow Tips

✔ Commit Electron app separately
✔ Keep TTS repo separate
✔ Add README for teammates:

how to run ollama

how to run supertonic

how to start electron

✔ Separate responsibilities:

Role	Works On
Frontend dev	renderer UI
Backend logic dev	backend folder
AI engineer	TTS + LLM tuning
DevOps	packaging and install scripts
✅ Next steps (choose what you want next)

Reply with one:

1️⃣ “Make service status checker (UI shows running/not running)”
2️⃣ “Add streaming replies (talk while generating)”
3️⃣ “Add microphone speech-to-text”
4️⃣ “Create README for the team”
5️⃣ “Show how to package .exe / .deb / .snap correctly”

And I’ll build it with you.

for now can we put the TTS also in the electron app just for making the app it will be easy to look in all code 

Yes — we can put the TTS project inside the Electron app for development only, so everything is in one place and easier to reason about.

But we’ll do it in a way that:

doesn’t break Electron builds

avoids stuffing large models into the .asar

keeps us able to separate it again later (clean architecture)

Think of this as:

“Embed the service physically — run it logically as a separate process.”

✅ Where to put the TTS project (inside Electron repo)

Inside your Electron app, create:

athena-desktop/
│
├ electron/
├ renderer/
├ backend/
│
├ services/
│   └── supertonic-tts/     ← put the whole repo here
│
└ package.json


So:

👉 copy your entire TTS repo into:

services/supertonic-tts


Do NOT rename the internal files — just move the folder.

❗ Important rule

We do NOT run TTS inside Electron code.
We spawn it as a child process.

Why?

✔ avoids blocking Electron
✔ avoids model crashes killing UI
✔ matches future production structure
✔ easier debugging

⚠️ DO NOT bundle models into .asar

During packaging, .asar compresses everything.

ONNX models inside .asar = crashes + slow load.

We keep the folder unpacked.

When we get to packaging, we’ll do:

"asarUnpack": [
  "services/supertonic-tts/assets/**"
]


But we can ignore packaging for now — just remember this later.

🚀 Step 1 — Install dependencies for TTS (inside Electron repo)

From your Electron root:

cd services/supertonic-tts
npm install


You should still be able to run:

npm start


and see:

[server] listening :3000


If that works — good.

⚙️ Step 2 — Make Electron start the TTS server automatically

We’ll let Electron launch it when the app starts.

Open:

electron/main.ts


Add:

import { spawn } from "child_process";
import path from "path";

let ttsProcess: any = null;

function startTTS() {
  const ttsPath = path.join(__dirname, "..", "services", "supertonic-tts");

  ttsProcess = spawn("npm", ["start"], {
    cwd: ttsPath,
    shell: true,
    env: process.env
  });

  ttsProcess.stdout.on("data", data => {
    console.log("[TTS]", data.toString());
  });

  ttsProcess.stderr.on("data", data => {
    console.error("[TTS ERROR]", data.toString());
  });

  ttsProcess.on("close", () => {
    console.log("[TTS] stopped");
  });
}


Then call it before creating the window:

app.whenReady().then(() => {
  startTTS();
  createWindow();
});


Electron will now:

✔ start your TTS server
✔ UI still calls localhost:3000
✔ code lives in same repo

Much easier for development.

🧹 Step 3 — stop TTS when Electron exits

Add:

app.on("before-quit", () => {
  if (ttsProcess) ttsProcess.kill();
});


This avoids zombie processes.

🎯 Final behavior

When you run Electron:

npm run dev


it will:

1️⃣ start Electron
2️⃣ launch TTS server internally
3️⃣ your app continues to call:

http://localhost:3000/tts


And all code is visible in one repo.

⚠️ But remember — this is temporary

Once the app grows:

❌ packaging becomes heavy
❌ update cycles become painful
❌ TTS crashes can kill app
❌ system performance gets worse

Before release, we will move it back to standalone.

This dev setup just helps you:

✔ read code
✔ hack fast
✔ experiment

👍 Next — what do you want next?

Choose one:

1️⃣ “Add auto-check: show status if TTS failed to start”
2️⃣ “Let LLM + TTS talk together end-to-end”
3️⃣ “Prepare for packaging (.exe / .deb) with TTS inside (dev only)”
4️⃣ “Explain how we’ll later separate again safely”

Tell me — and we’ll continue step-by-step.