import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev-server config for running the UI half in a normal browser at
// http://localhost:5173 — useful when Figma plugin import is not available
// (e.g. Dev-Mode-only seats). The map, controls, and basemap picker all work
// identically to the Figma iframe; only the Insert-into-Figma round-trip is
// unreachable because there's no main thread on the other side of postMessage.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'src/ui',
  server: {
    port: 5173,
    open: true,
  },
})
