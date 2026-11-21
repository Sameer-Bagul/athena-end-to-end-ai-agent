# Athena AI Assistant — Engineering & Design Directives

Build a polished, production-grade Tauri v2 desktop application.

## 🎨 UI & Aesthetics:
- **Desktop-Native Ergonomics**: Prioritize precise spacing, crisp typography, accessible contrast, distinctive visual identity, and consistent design tokens.
- **Anti-Slop Design**: Avoid generic AI-generated dashboard aesthetics (no low-contrast grey text, cliché purple-blue gradients, or unstyled default component templates).
- **Authentic Liquid Glass**: Use native operating system materials (macOS Liquid Glass, Windows 11 Mica) for the shell/background, and restrained CSS backdrop filters with edge lighting for floating cards.

## ⚡ Motion & 3D Presentation:
- **Smooth Micro-Interactions**: Use meaningful UI feedback, restrained spring motion, and performant GPU transform/opacity transitions.
- **60 FPS VRM Pipeline**: Maintain Three.js 60 FPS VRM rendering with `deepDispose` FBX geometry disposal, 20Hz WebAudio formant LipSync throttling, and async shader precompilation.
- **Accessibility**: Respect `prefers-reduced-motion` settings across all animations.

## 🦀 Architecture & Rust Boundaries:
- **Decoupled Presentation**: Keep 3D rendering, avatar controls, and user interactions in the React/WebGL layer.
- **Privileged Rust Engine**: Use Rust (Tauri 2.0 + Tokio) for OS integrations, file systems, process supervision, streaming channels, and local intelligence.
- **Strict IPC Contracts**: All Tauri commands (`#[tauri::command]`) and events must have serializable, typed request/response schemas. Never use unvalidated commands.
- **Zero-Dependency Native Pipelines**: Transition audio inference (STT/TTS) into embedded native execution to eliminate external Python and Node microservice dependencies.

## 🛡️ Security & Quality:
- Enforce least-privilege window capabilities and strict CSP.
- Validate all paths and prevent directory traversal.
- Rigorously test error states, loading skeletons, keyboard navigation (`Alt+Space`), and cross-platform builds.

