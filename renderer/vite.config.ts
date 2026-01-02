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
    }
  },
  optimizeDeps: {
    exclude: ["onnxruntime-web"]
  },
  worker: {
    format: "es"
  }
});
