import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import dynamicImport from 'vite-plugin-dynamic-import'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dynamicImport()],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      // `jalali-moment` requires `moment/moment` (a non-existent subpath in the `moment` package).
      // Map it to the package entry to keep builds stable across bundlers.
      'moment/moment': 'moment',
    },
  },
  server: {
    proxy: {
      // Avoid CORS in local dev by proxying API calls through Vite.
      // With `VITE_API_PREFIX=/api/1` (default in dev), requests will hit this proxy.
      '/api/1': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'build'
  }
})
