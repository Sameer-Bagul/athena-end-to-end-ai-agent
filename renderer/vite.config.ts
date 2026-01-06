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
    commonjsOptions: {
      include: [/onnxruntime-web/, /node_modules/]
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('@pixiv/three-vrm') || id.includes('vrm-mixamo-retarget')) {
              return 'vendor-vrm';
            }
            if (id.includes('@mediapipe/tasks-vision')) {
              return 'vendor-mediapipe';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
          }
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ["onnxruntime-web"]
  },
  worker: {
    format: "es"
  }
});
