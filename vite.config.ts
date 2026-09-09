import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Native filesystem events do not reach the dev server on some macOS
    // setups, which leaves it serving stale modules with no visible error.
    // The project is small enough that polling costs nothing noticeable.
    watch: { usePolling: true, interval: 300 },
  },
})
