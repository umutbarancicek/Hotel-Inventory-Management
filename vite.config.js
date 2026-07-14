import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/tuted-api': {
        target: 'https://antalyatuted.org.tr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tuted-api/, ''),
        secure: false,
      }
    }
  }
});
