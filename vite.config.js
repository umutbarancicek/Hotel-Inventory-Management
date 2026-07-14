import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Hotel-Inventory-Management/',
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
