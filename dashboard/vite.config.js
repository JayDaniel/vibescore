import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Prefer 5173 for local CLI integration, but don't fail if already in use.
    strictPort: false
  }
});
