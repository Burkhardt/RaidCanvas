import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: [{ find: /^@dr2rai\/raid-canvas$/, replacement: new URL('../../packages/canvas/src/index.ts', import.meta.url).pathname }] },
  // Serves the CR053 glyph SVGs at /stereotypes/, the canvas default base URL.
  publicDir: new URL('../../packages/canvas/assets', import.meta.url).pathname,
  server: {
    port: 5173,
  },
});
