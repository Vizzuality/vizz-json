import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/main/code.ts'),
      formats: ['iife'],
      name: 'vizzFigmaMapMain',
      fileName: () => 'code.js',
    },
    target: 'es2017',
    minify: false,
    rollupOptions: {
      // Figma main thread has no module system; bundle everything.
      external: [],
    },
  },
})
