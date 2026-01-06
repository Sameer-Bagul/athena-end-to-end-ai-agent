Love it — this is a GREAT feature to add, and it’s totally doable.
Here is a **clear, end-to-end plan** to integrate MediaPipe face tracking into Athena so your VRM avatar looks at the user — smoothly and realistically.

No guessing. No spaghetti. Step-by-step.

---

# 🎯 GOAL

> Use webcam → detect face → drive VRM LookAt for eyes + head
> with toggle, smoothing, and zero privacy risk.

We will do it in **4 phases**.

```
Phase 1 – Setup + Architecture
Phase 2 – Face tracking integration
Phase 3 – Connect tracking → VRM LookAt
Phase 4 – Polish (smoothing, idle, safety)
```

I’ll also explain where every file goes so your repo stays clean.

---

# 🧱 PHASE 1 — Architecture (Very Important)

We keep EVERYTHING related to tracking inside renderer.

📁 `renderer/src/features/face-tracking`

Structure:

```
face-tracking/
 ├── camera.ts           (camera control)
 ├── mediapipe.ts        (MediaPipe setup)
 ├── tracker.ts          (logic: process → emit events)
 └── types.ts
```

Why this is good:

✔ isolates tracking
✔ no Electron main process involvement
✔ easy to disable later
✔ avoids performance issues

And:

❌ we NEVER send camera frames to backend
✔ privacy stays local.

---

# 🛠 PHASE 2 — Install + Setup MediaPipe

### Install dependencies (renderer only)

```
cd renderer
npm install @mediapipe/face_mesh @mediapipe/camera_utils
```

### Create the camera handler

`camera.ts`

Responsible for:

✔ requesting webcam
✔ returning `<video>` element
✔ cleaning up

---

# 🤖 PHASE 3 — Face tracking → LookAt target

We will use **3 important landmarks**:

| Landmark | Meaning                    |
| -------- | -------------------------- |
| 33       | left eye                   |
| 263      | right eye                  |
| 1        | nose tip (stabilizes head) |

We compute midpoint between eyes = where VRM should look.

Then convert normalized tracking coords → Three.js world coords.

### Output of the tracking module:

It should emit:

```ts
{
  x: number;   // -1 → left, +1 → right
  y: number;   // -1 → down, +1 → up
  visible: boolean;
}
```

No VRM logic here. Just signals.

---

# 🧠 PHASE 4 — Drive VRM LookAt

In your **AthenaScene** or wherever you load VRM:

We subscribe:

```
faceTracker.onUpdate((target) => {
   avatar.lookAt(target)
})
```

Where:

```
avatar.lookAt()
```

internally does:

```js
vrm.lookAt?.applier?.lookAt(
  new THREE.Vector3(target.x, target.y, 1)
);
```

---

# ✨ POLISH — Make it feel REAL

### ✔ Add smoothing (lerp)

Without smoothing: twitchy, robotic.

We add:

```js
smoothedTarget.lerp(target, 0.15);
```

Higher = faster / more aggressive.

---

### ✔ Add dead-zone (micro movements)

If movement is too small → ignore.

Makes avatar feel calm instead of jittery.

---

### ✔ Add fallback idle behavior

When user leaves camera:

✔ auto-disable
✔ small natural idle eye shifts

---

### ✔ Toggle Button

UI:

```
[ Enable Camera Tracking ]
```

State:

```
trackingEnabled = true/false
```

Also allow:

* pause when user opens settings
* pause when minimized
* stop stream when disabled

---

# 🔐 PRIVACY RULES (MUST FOLLOW)

To avoid creepy experience:

✔ Ask clearly
✔ Process locally
✔ Never save frames
✔ On OFF → stop webcam completely

---

# 🚀 Deployment considerations

MediaPipe runs fully offline — huge win.

Electron bundles it fine.

No extra OS setup required.

---

# 📌 SUMMARY

You now have a practical plan:

### ✅ Face tracking belongs in renderer

### ✅ MediaPipe is best for performance + accuracy

### ✅ VRM LookAt integrates beautifully

### ✅ Smoothing + idle + toggle = human-like presence

---

Awesome — since mouth sync already works, we’ll layer on:

1️⃣ Natural blinking
2️⃣ Head following the user
3️⃣ Idle “life” when camera isn’t moving

All of these will work **together** with your current LookAt logic.

I’ll give you modular snippets so you can plug them in.

---

# 👁️ 1️⃣ NATURAL BLINKING (VRM Expressions)

VRM expression name usually is:

```
blink
```

We simulate human blinking patterns:

✔ random timing
✔ short blink duration
✔ sometimes double blink

Create:

`blink.ts`

```ts
export function startBlinking(vrm: any) {
  let blinking = true;

  async function blinkLoop() {
    while (blinking) {
      // wait random time (2.5s – 6s)
      const wait = 2500 + Math.random() * 3500;
      await new Promise(r => setTimeout(r, wait));

      // blink down
      await animateBlink(vrm, 1, 80);

      // blink up
      await animateBlink(vrm, 0, 120);

      // rare double blink
      if (Math.random() < 0.15) {
        await animateBlink(vrm, 1, 70);
        await animateBlink(vrm, 0, 120);
      }
    }
  }

  blinkLoop();

  return () => (blinking = false);
}

async function animateBlink(vrm: any, value: number, duration: number) {
  const step = 10;
  const inc = step / duration;

  for (let t = 0; t <= 1; t += inc) {
    vrm.expressionManager?.setValue("blink", value * t);
    await new Promise(r => setTimeout(r, step));
  }
}
```

Usage:

```ts
let stopBlink: any;

stopBlink = startBlinking(vrm);

// call stopBlink() if you ever want to disable
```

---

# 🧠 2️⃣ HEAD FOLLOWING (FACE POSITION → HEAD ROTATION)

We already drive eyes using LookAt.

Now we add **subtle head motion** (not too much).

`head-follow.ts`

```ts
import * as THREE from "three";

const headTarget = new THREE.Vector3();
const smoothedHead = new THREE.Vector3();

export function updateHeadFollow(vrm: any, lookTarget: THREE.Vector3) {
  // less movement than eyes
  headTarget.copy(lookTarget).multiplyScalar(0.25);

  smoothedHead.lerp(headTarget, 0.1);

  const head = vrm.humanoid?.getBoneNode("head");
  if (!head) return;

  head.rotation.y = smoothedHead.x * 0.5;   // left/right
  head.rotation.x = -smoothedHead.y * 0.3;  // up/down
}
```

Integrate into existing `onFaceResults`:

```ts
const target = getLookTarget(results);

applyLookAt(vrm, target);
updateHeadFollow(vrm, target);
```

Now:

✔ eyes snap faster
✔ head moves slower & softer
= looks natural.

---

# 👀 3️⃣ IDLE MICRO MOTIONS (WHEN USER IS STILL)

If the user isn’t moving much, people naturally:

• shift eyes slightly
• tiny head drift
• subtle curiosity movement

Create:

`idle.ts`

```ts
import * as THREE from "three";

const idleTarget = new THREE.Vector3(0, 0, 1);

export function startIdle(emit: (v: THREE.Vector3) => void) {
  let active = true;

  async function loop() {
    while (active) {
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 1200));

      // very subtle motion
      idleTarget.x = (Math.random() - 0.5) * 0.2;
      idleTarget.y = (Math.random() - 0.5) * 0.15;

      emit(idleTarget);
    }
  }

  loop();

  return () => (active = false);
}
```

Integrate into your pipeline:

```ts
let idleStop: any;

idleStop = startIdle((idleTarget) => {
  // only apply idle when no user detected
  if (!faceDetected) {
    applyLookAt(vrm, idleTarget);
    updateHeadFollow(vrm, idleTarget);
  }
});
```

Where `faceDetected` comes from MediaPipe:

```ts
faceDetected = !!results.multiFaceLandmarks?.length;
```

---

# 🔗 PUTTING IT ALL TOGETHER

In your VRM scene init:

```ts
const stopBlink = startBlinking(vrm);

let idleStop = startIdle((idleTarget) => {
  if (!faceDetected) {
    applyLookAt(vrm, idleTarget);
    updateHeadFollow(vrm, idleTarget);
  }
});
```

Face tracking pipeline:

```ts
faceMesh.onResults(results => {
  faceDetected = !!results.multiFaceLandmarks?.length;

  if (!faceDetected) return;

  const target = getLookTarget(results);

  applyLookAt(vrm, target);
  updateHeadFollow(vrm, target);
});
```

---

# 🎬 Result

Your avatar now:

✔ looks at the user
✔ head gently follows movement
✔ blinks naturally
✔ stays alive when idle
✔ does NOT look creepy robotic anymore

This is now entering **VTuber-level animation quality**.

---

## 👉 Next upgrades (when you're ready)

We can add:

🔹 Eye saccades (micro fast eye jumps — very realistic)
🔹 Emotion expressions linked to speech intensity
🔹 Gaze priority (follow mouse OR face intelligently)
🔹 Disable tracking when minimized
🔹 Performance tuning
