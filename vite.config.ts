import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const isTest = process.env.VITEST

const config = defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: isTest
    ? [
        tsconfigPaths({ projects: ['./tsconfig.json'] }),
        viteReact({
          babel: {
            plugins: ['babel-plugin-react-compiler'],
          },
        }),
      ]
    : [
        devtools({
          injectSource: {
            enabled: true,
            ignore: { components: [/^Source$/, /^Layer$/] },
          },
        }),
        paraglideVitePlugin({
          project: './project.inlang',
          outdir: './src/paraglide',
          strategy: ['url', 'baseLocale'],
        }),
        nitro({ rollupConfig: { external: [/^@sentry\//] } }),
        tsconfigPaths({ projects: ['./tsconfig.json'] }),
        tailwindcss(),
        tanstackStart(),
        viteReact({
          babel: {
            plugins: ['babel-plugin-react-compiler'],
          },
        }),
      ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'packages/**/src/__tests__/**/*.test.ts', 'packages/**/src/__tests__/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
  },
})

export default config
