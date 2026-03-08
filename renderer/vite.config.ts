import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Three.js core
            if (id.includes('three/examples') || id.includes('three/build')) {
              return 'vendor-three-core';
            }
            if (id.includes('three')) {
              return 'vendor-three';
            }
            // VRM specific
            if (id.includes('@pixiv/three-vrm') || id.includes('vrm-mixamo-retarget')) {
              return 'vendor-vrm';
            }
            // MediaPipe (large WASM)
            if (id.includes('@mediapipe')) {
              return 'vendor-mediapipe';
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            // Markdown
            if (id.includes('react-markdown') || id.includes('remark')) {
              return 'vendor-markdown';
            }
            // Other vendors
            return 'vendor-misc';
          }
        }
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['three', '@pixiv/three-vrm', 'react', 'react-dom'],
    exclude: ['@mediapipe/tasks-vision'] // Large WASM module - load on demand
  },
  worker: {
    format: "es"
  }
});
