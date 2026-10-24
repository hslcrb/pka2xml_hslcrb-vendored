import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode, command }) => ({
  base: './',
  plugins: [
    react(),
    {
      name: 'development-csp',
      transformIndexHtml: html => command === 'serve'
        ? html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'").replace("style-src 'self'", "style-src 'self' 'unsafe-inline'").replace("connect-src 'none'", "connect-src 'self' ws://localhost:* ws://127.0.0.1:*")
        : html,
    },
    ...(mode === 'renderer' ? [] : [electron({
      main: { entry: 'electron/main.ts' },
      preload: {
        input: 'electron/preload.ts',
        vite: { build: { rollupOptions: { output: { format: 'cjs', entryFileNames: 'preload.cjs' } } } },
      },
    })]),
  ],
}))
