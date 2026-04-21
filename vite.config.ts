import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/magic-editor/', // ← これを追加！前後のスラッシュ / を忘れずに
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
