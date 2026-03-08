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
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('three/examples') || id.includes('three/build')) {
              return 'vendor-three-core';
            }
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('@pixiv/three-vrm') || id.includes('vrm-mixamo-retarget')) {
              return 'vendor-vrm';
            }
            if (id.includes('@mediapipe')) {
              return 'vendor-mediapipe';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  },
  worker: {
    format: "es"
  }
});
