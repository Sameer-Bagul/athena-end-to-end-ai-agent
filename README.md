# Athena - 3D VRM AI Assistant v1.0

A desktop 3D AI assistant built with Electron, Three.js, and React. Athena uses VRM avatars with FBX animations for a fully animated, interactive AI companion.

![Athena Banner](https://via.placeholder.com/800x200/1a1a2e/ffffff?text=Athena+AI+Assistant)

---

## 🎯 Overview

Athena v1 is the foundation for a modular, extensible 3D AI assistant. This version establishes:

- **3D Environment**: Complete Three.js scene with lighting and camera
- **VRM Avatar System**: Load and render VRM models with proper normalization
- **FBX Animation System**: Smooth animation blending and retargeting
- **Clean Architecture**: Strict separation between React UI and Three.js graphics

### What's in v1

✅ Three.js scene management  
✅ VRM avatar loading and rendering  
✅ FBX animation system with crossfade  
✅ Animation state machine (Idle, Talk, Greet, Happy, Jump)  
✅ Hooks for future TTS integration  
✅ Memory-safe lifecycle management  

### Future Roadmap

🔮 Supertonic TTS integration  
🔮 Phoneme-based lip sync  
🔮 Ollama LLM integration  
🔮 Emotion-based animation blending  
🔮 Voice input/output  

---

## 🏗️ Architecture

### Project Structure

```
athena/
├── electron/                  # Electron main process
│   ├── main.ts               # Main process entry
│   └── preload.ts            # Preload script
│
├── renderer/                  # React renderer process
│   ├── public/
│   │   ├── models/
│   │   │   └── athena.vrm    # VRM avatar model
│   │   └── animations/       # FBX animation files
│   │       ├── idleFemale.fbx
│   │       ├── talking.fbx
│   │       ├── greeting.fbx
│   │       ├── excited.fbx
│   │       └── jump.fbx
│   │
│   └── src/
│       ├── three/            # 🎮 Three.js Core (NO React)
│       │   ├── AthenaScene.ts       # Scene, camera, lights, render loop
│       │   ├── VRMLoader.ts         # VRM avatar loading & normalization
│       │   └── AnimationManager.ts  # FBX loading & animation blending
│       │
│       ├── components/       # ⚛️ React Components
│       │   └── ThreeStage.tsx       # Three.js mount/unmount wrapper
│       │
│       ├── App.tsx           # Main React app
│       └── main.tsx          # React entry point
│
├── package.json              # Root package.json
└── README.md                 # This file
```

### Architecture Principles

#### 🚫 Hard Constraints (DO NOT BREAK)

1. **NO React Three Fiber** - Pure imperative Three.js only
2. **NO ES Module Imports for Assets** - Load via runtime loaders
3. **NO Three.js in React Render** - Strict separation of concerns
4. **NO Node APIs in Renderer** - Use Electron IPC bridge
5. **NO Mixed Concerns** - UI logic ≠ Animation logic

#### ✅ Clean Separation

```
React Component (ThreeStage.tsx)
    ↓ (mount/unmount only)
Three.js Scene (AthenaScene.ts)
    ↓ (manages)
VRM Loader + Animation Manager
    ↓ (updates)
WebGL Renderer → Canvas
```

**React's responsibilities:**
- Mount/unmount Three.js scene
- Provide DOM container
- Handle UI controls
- Clean up on unmount

**Three.js responsibilities:**
- Scene management
- Render loop
- Animation updates
- Resource disposal

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd athena

# Install root dependencies
npm install

# Install renderer dependencies
cd renderer
npm install
cd ..
```

### Required Assets

Place your assets in the following locations:

**VRM Model:**
```
renderer/public/models/athena.vrm
```

**FBX Animations:**
```
renderer/public/animations/
├── idleFemale.fbx
├── talking.fbx
├── greeting.fbx
├── excited.fbx
└── jump.fbx
```

> **Note:** FBX animations should use Mixamo rig naming conventions for proper bone retargeting.

### Running the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📦 Dependencies

### Core Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | Latest | Desktop application framework |
| `react` | 19.x | UI framework |
| `vite` | 7.x | Build tool |
| `three` | Latest | 3D graphics library |
| `@pixiv/three-vrm` | Latest | VRM model loader |
| `tailwindcss` | 4.x | Styling |

### Three.js Loaders

- `GLTFLoader` - VRM base format
- `FBXLoader` - Animation files
- `VRMLoaderPlugin` - VRM-specific processing

---

## 🎮 Usage

### Basic Usage

The application automatically loads on startup:

1. **Scene Initialization** - Creates Three.js scene
2. **VRM Loading** - Loads and normalizes avatar
3. **Animation Loading** - Loads all FBX animations in parallel
4. **Idle Start** - Begins idle animation loop

### Animation Controls

Use the control panel to switch between animations:

```typescript
// Animation types available
enum AnimationAction {
  IDLE,   // Default idle stance
  TALK,   // Speaking/talking animation
  GREET,  // Greeting wave
  HAPPY,  // Excited/happy animation
  JUMP,   // Jump animation
}
```

### Programmatic Control

Access the animation manager:

```typescript
import { AnimationManager, AnimationAction } from './three/AnimationManager';

// Get reference from ThreeStage component
const handleReady = (manager: AnimationManager) => {
  // Play animation
  manager.play(AnimationAction.GREET);
  
  // Check current animation
  const current = manager.getCurrentAnimation();
  
  // Temporary TTS hooks (v1)
  manager.onSpeakStart(); // Plays TALK
  manager.onSpeakEnd();   // Returns to IDLE
};
```

---

## 🎨 Customization

### Adding New Animations

1. **Add FBX file** to `renderer/public/animations/`
2. **Update AnimationAction enum**:
   ```typescript
   export enum AnimationAction {
     IDLE = 'IDLE',
     TALK = 'TALK',
     // Add your animation
     WAVE = 'WAVE',
   }
   ```
3. **Update file mapping**:
   ```typescript
   const ANIMATION_FILES: Record<AnimationAction, string> = {
     [AnimationAction.IDLE]: 'idleFemale.fbx',
     [AnimationAction.TALK]: 'talking.fbx',
     [AnimationAction.WAVE]: 'wave.fbx', // Your file
   };
   ```

### Adjusting Camera

Edit [AthenaScene.ts](renderer/src/three/AthenaScene.ts#L37):

```typescript
this.camera = new THREE.PerspectiveCamera(
  35,    // FOV - increase for wider view
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
this.camera.position.set(0, 1.4, 3); // X, Y, Z position
this.camera.lookAt(0, 1.2, 0);       // Look-at point
```

### Modifying Lighting

Edit [AthenaScene.ts](renderer/src/three/AthenaScene.ts#L55):

```typescript
private setupLighting(): void {
  // Adjust intensities
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  
  // Adjust positions
  directionalLight.position.set(1, 2, 1);
}
```

### Changing Background

Edit [AthenaScene.ts](renderer/src/three/AthenaScene.ts#L29):

```typescript
this.scene.background = new THREE.Color(0x1a1a2e); // Hex color
```

---

## 🔧 Technical Details

### VRM Loading Pipeline

1. Load GLTF with VRM plugin
2. Extract VRM userData
3. Normalize humanoid skeleton
4. Remove unnecessary nodes/joints
5. Disable frustum culling
6. Apply rotation (face camera)
7. Add to scene

### Animation Retargeting

FBX animations use Mixamo bone names, which are mapped to VRM humanoid bones:

```typescript
mixamorigHips → hips
mixamorigSpine → spine
mixamorigLeftArm → leftUpperArm
// ... etc
```

This allows any Mixamo animation to work with any VRM model.

### Render Loop

```
requestAnimationFrame
    ↓
Get delta time (THREE.Clock)
    ↓
Update VRM (springs, physics)
    ↓
Update AnimationMixer
    ↓
Render scene to canvas
```

### Memory Management

All resources are properly disposed:

```typescript
useEffect(() => {
  // Initialize...
  
  return () => {
    animationManager?.dispose();
    scene?.dispose();
  };
}, []);
```

---

## 🐛 Troubleshooting

### Avatar Not Loading

**Issue:** Black screen or error loading VRM

**Solutions:**
1. Check VRM file exists at `renderer/public/models/athena.vrm`
2. Open browser DevTools (F12) and check console for errors
3. Ensure VRM file is valid (test in VRM viewer)
4. Check file permissions

### Animations Not Playing

**Issue:** Avatar loads but doesn't animate

**Solutions:**
1. Verify FBX files exist in `renderer/public/animations/`
2. Check console for animation loading errors
3. Ensure FBX uses Mixamo rig naming
4. Check animation file names match `ANIMATION_FILES` mapping

### Performance Issues

**Issue:** Low FPS or stuttering

**Solutions:**
1. Check GPU usage in Task Manager
2. Lower VRM model polygon count
3. Reduce number of lights in scene
4. Disable anti-aliasing in renderer:
   ```typescript
   this.renderer = new THREE.WebGLRenderer({
     antialias: false, // Disable
   });
   ```

### TypeScript Errors

**Issue:** Import errors or type mismatches

**Solutions:**
1. Reinstall dependencies: `npm install`
2. Clear cache: `rm -rf node_modules package-lock.json && npm install`
3. Check TypeScript version: `npx tsc --version`

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Application launches without errors
- [ ] 3D scene renders correctly
- [ ] VRM avatar loads and displays
- [ ] Idle animation plays automatically
- [ ] All animation buttons work
- [ ] Smooth transitions between animations
- [ ] No memory leaks on scene remount
- [ ] Window resize works correctly
- [ ] Application closes cleanly

### Performance Benchmarks

Target metrics:
- **FPS:** 60fps stable
- **Memory:** < 200MB idle
- **Startup:** < 5 seconds
- **Asset Load:** < 3 seconds

---

## 📚 API Reference

### AthenaScene

```typescript
class AthenaScene {
  init(container: HTMLDivElement): void
  add(object: THREE.Object3D): void
  remove(object: THREE.Object3D): void
  onUpdate(callback: (delta: number) => void): void
  dispose(): void
}
```

### VRMLoaderService

```typescript
class VRMLoaderService {
  load(path: string): Promise<VRMLoadResult>
  update(vrm: VRM, delta: number): void
  getBone(vrm: VRM, boneName: string): THREE.Object3D | null
}
```

### AnimationManager

```typescript
class AnimationManager {
  initialize(vrm: VRM): void
  loadAnimation(action: AnimationAction): Promise<void>
  loadAllAnimations(): Promise<void>
  play(action: AnimationAction, fadeTime?: number): void
  update(delta: number): void
  onSpeakStart(): void  // v1 TTS hook
  onSpeakEnd(): void    // v1 TTS hook
  dispose(): void
}
```

---

## 🤝 Contributing

This is a foundational version. Future contributions should maintain:

1. **Architecture purity** - Keep React and Three.js separate
2. **Clean interfaces** - Use clear, typed APIs
3. **Performance** - No frame drops, clean disposal
4. **Extensibility** - Design for future features

---

## 📝 License

[Your License Here]

---

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) - VRM loader
- [VRM Consortium](https://vrm.dev/) - VRM format specification
- [Mixamo](https://www.mixamo.com/) - Animation library

---

## 📧 Contact

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ by the Athena Team**

*Version 1.0 - December 2025*
