Yes, that's actually a very good idea.

I would not call it "disable tooling" though. I would design it as a **Performance Mode** system.

### Why?

On low-end devices, the expensive parts are usually:

* Real-time 3D animations
* Continuous thinking animations
* Tool execution state updates
* Multiple IPC events
* Streaming token synchronization
* Lip sync calculations
* Particle effects
* Physics calculations

The actual tool execution (weather, search, timer, etc.) is usually much cheaper than rendering complex avatar behaviors.

---

## Suggested Modes

### 1. Full Experience

```text
Avatar:
✓ Walking
✓ Gestures
✓ Tool Animations
✓ Thinking State
✓ Speaking State
✓ Emotions

Agent:
✓ Tools
✓ RAG
✓ MCP
✓ Everything
```

For high-end systems.

---

### 2. Balanced Mode

```text
Avatar:
✓ Walking
✓ Basic Gestures

✗ Complex Emotions
✗ Particle Effects
✗ Advanced Animations

Agent:
✓ Tools
✓ RAG
✓ MCP
```

Probably your default mode.

---

### 3. Performance Mode

```text
Avatar:
✓ Walking

✗ Tool Animations
✗ Thinking Animation
✗ Idle Variations
✗ Facial Expressions
✗ Lip Sync

Agent:
✓ Tools
✓ RAG
✓ MCP
```

The avatar becomes lightweight but the AI remains fully capable.

---

### 4. Assistant Only Mode

```text
Avatar:
✗ Hidden

Agent:
✓ Tools
✓ RAG
✓ MCP
```

Pure chat interface.

---

## What I Would Avoid

I would NOT disable tools just because the device is weak.

Example:

User:

```text
What's the weather?
```

If tools are disabled:

```text
Sorry, weather isn't available.
```

This makes Athena feel broken.

Instead:

```text
Disable visual effects
Keep intelligence intact
```

Users care much more about AI capabilities than animations.

---

## Better Architecture

Create separate performance budgets:

```typescript
interface PerformanceConfig {
  avatarEnabled: boolean;
  facialAnimations: boolean;
  toolAnimations: boolean;
  particleEffects: boolean;
  lipSync: boolean;
  shadowQuality: "low" | "medium" | "high";

  toolsEnabled: boolean;
  ragEnabled: boolean;
  mcpEnabled: boolean;
}
```

Then your renderer can dynamically adapt.

---

## Auto Detection (Recommended)

At startup:

```typescript
const ram = system.memory;
const gpu = system.gpu;
const cpu = system.cpu;
```

Calculate a score:

```text
Score < 30
→ Performance Mode

Score 30-70
→ Balanced

Score > 70
→ Full Experience
```

Then allow the user to override it.

---

For Athena specifically, I would keep **tooling, RAG, memory, and MCP always available**, and only reduce **avatar behavior and visual complexity**. The AI brain should stay powerful even on low-end hardware; only the visual companion should become simpler.
