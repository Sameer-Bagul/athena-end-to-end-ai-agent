import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AthenaReact',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'three', '@pixiv/three-vrm', '@pixiv/three-vrm-animation', '@athena-ai/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@athena-ai/core': 'AthenaCore',
        },
      },
    },
  },
});
