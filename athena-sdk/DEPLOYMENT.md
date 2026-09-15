# 🚀 Athena SDK Deployment & Publishing Guide

This guide details how to build, test, publish, and deploy the Athena SDK packages (`@athena-ai/core`, `@athena-ai/react`, `@athena-ai/web`) and demo applications.

---

## 🏗️ 1. Building Production Bundles

Before publishing or deploying, compile all packages to generate TypeScript declaration files (`.d.ts`), ESM modules (`.js`), CommonJS modules (`.cjs`), and CSS assets (`style.css`).

```bash
# Clean previous builds
pnpm clean

# Build core, react, and web packages
pnpm build
```

This generates build outputs in:
- `packages/core/dist/` (`index.js`, `index.cjs`, `index.d.ts`)
- `packages/react/dist/` (`index.js`, `index.cjs`, `index.d.ts`, `style.css`)
- `packages/web/dist/` (`index.js`, `index.cjs`, `index.d.ts`)

---

## 📦 2. NPM Publishing Workflow

### Pre-requisites
1. Ensure you are logged into your npm account:
   ```bash
   npm login
   ```
2. Verify package versions in `packages/*/package.json`.

### Publish Packages to NPM
To publish all workspace packages:

```bash
# Publish @athena-ai/core
cd packages/core
pnpm publish --access public

# Publish @athena-ai/react
cd ../react
pnpm publish --access public

# Publish @athena-ai/web
cd ../web
pnpm publish --access public
```

---

## 🌐 3. CDN Distribution Setup

Once `@athena-ai/web` is published to NPM, it automatically becomes available on global CDNs:

### jsDelivr CDN
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@athena-ai/web/dist/index.js"></script>
```

### UNPKG CDN
```html
<script type="module" src="https://unpkg.com/@athena-ai/web/dist/index.js"></script>
```

---

## ☁️ 4. Deploying Showcase Demo Apps

### Deploying `apps/demo-react` to Vercel / Netlify

1. Build the demo app:
   ```bash
   pnpm --filter demo-react build
   ```
2. Set directory root to `athena-sdk/apps/demo-react`.
3. Output directory: `dist`.
4. Install command: `pnpm install`.
5. Build command: `pnpm --filter @athena-ai/core build && pnpm --filter @athena-ai/react build && pnpm build`.

### Deploying `apps/demo-vanilla` to Static Hosting

`apps/demo-vanilla` is a static HTML application. Upload `index.html` and `public/` assets directly to Cloudflare Pages, GitHub Pages, or Netlify.

---

## ✅ Deployment Checklist

- [ ] `pnpm typecheck` passes with zero TypeScript errors.
- [ ] `pnpm build` produces all `.d.ts`, `.js`, `.cjs` artifacts.
- [ ] 3D assets (`athena.vrm`) are bundled into demo `public/models/`.
- [ ] Version numbers bumped in `package.json`.
