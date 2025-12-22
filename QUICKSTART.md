# Quick Start Guide - Athena v1

Get Athena up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Your VRM model file
- FBX animation files (Mixamo recommended)

## Step 1: Install Dependencies

```bash
# From project root
cd athena

# Install root dependencies
npm install

# Install renderer dependencies
cd renderer
npm install
cd ..
```

## Step 2: Add Your Assets

### VRM Model

Place your VRM file here:
```
renderer/public/models/athena.vrm
```

Don't have a VRM? Download free models from:
- [VRoid Hub](https://hub.vroid.com/)
- [Booth.pm](https://booth.pm/)

### Animations

Download animations from [Mixamo](https://www.mixamo.com/):

1. Go to Mixamo.com (free account required)
2. Search for these animations:
   - "Idle" (female) → save as `idleFemale.fbx`
   - "Talking" → save as `talking.fbx`
   - "Waving" → save as `greeting.fbx`
   - "Excited" → save as `excited.fbx`
   - "Jump" → save as `jump.fbx`

3. Download settings:
   - Format: FBX Binary
   - Skin: Without Skin
   - Framerate: 30
   - Keyframe Reduction: None

4. Place in:
   ```
   renderer/public/animations/
   ├── idleFemale.fbx
   ├── talking.fbx
   ├── greeting.fbx
   ├── excited.fbx
   └── jump.fbx
   ```

## Step 3: Run the App

```bash
# From project root
npm run dev
```

The app should open automatically. You'll see:
1. Loading screen
2. Athena avatar appears
3. Idle animation starts
4. Control panel at the bottom

## Step 4: Test Animations

Click the animation buttons in the control panel:
- **idle** - Default standing pose
- **talk** - Speaking animation
- **greet** - Waving greeting
- **happy** - Excited celebration
- **jump** - Jump action

## Troubleshooting

### "Cannot find module 'three'"

```bash
cd renderer
npm install three @pixiv/three-vrm @types/three
```

### "Failed to load VRM"

- Check file path: `renderer/public/models/athena.vrm`
- Ensure VRM file is valid (test in [VRM Viewer](https://vrm.dev/))

### "Animation not loading"

- Verify FBX files are in `renderer/public/animations/`
- Check file names match exactly (case-sensitive)
- Ensure FBX format is **Binary**, not ASCII

### Black screen / Nothing renders

- Open DevTools (F12) and check Console for errors
- Check GPU drivers are up to date
- Try disabling hardware acceleration in Electron

## Next Steps

### Customize Athena

1. **Change background color** - Edit [AthenaScene.ts](renderer/src/three/AthenaScene.ts#L29)
2. **Adjust camera** - Edit [AthenaScene.ts](renderer/src/three/AthenaScene.ts#L37)
3. **Add more animations** - See [README.md](README.md#adding-new-animations)

### Integrate with AI

The animation system is ready for integration:

```typescript
// When TTS starts speaking
animationManager.onSpeakStart();

// When TTS finishes
animationManager.onSpeakEnd();
```

Future versions will add:
- Supertonic TTS
- Phoneme-based lip sync
- Ollama LLM integration

## Getting Help

- Check the [Full README](README.md)
- Review code comments in source files
- Open an issue on GitHub

---

**You're ready to go! 🚀**
