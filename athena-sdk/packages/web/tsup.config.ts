import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'AthenaWeb',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  noExternal: ['@athena-ai/core', 'three', '@pixiv/three-vrm'],
});
