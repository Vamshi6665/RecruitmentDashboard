import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// npm run dev        -> http://localhost:5173 with /api proxied to the server on :8787
// npm run build      -> client/dist, served by the Express server (Docker) or Vercel
// npm run build:demo -> one-script build for a static hosted demo: React from cdnjs, JSON data mode
export default defineConfig(({ mode }) => {
  const shared = {
    base: './',
    server: { proxy: { '/api': process.env.API_URL ?? 'http://localhost:8787' } },
    test: { environment: 'jsdom', setupFiles: ['./test/setup.js'], globals: true },
  }
  if (mode !== 'demo') return { ...shared, plugins: [react()] }
  return {
    ...shared,
    define: { 'import.meta.env.VITE_DATA_MODE': JSON.stringify('json') },
    plugins: [react({ jsxRuntime: 'classic' })],
    esbuild: { jsxInject: `import React from 'react'` },
    build: {
      outDir: 'dist-demo', cssCodeSplit: false, copyPublicDir: false,
      rollupOptions: {
        external: ['react', 'react-dom', 'react-dom/client'],
        output: {
          format: 'iife', entryFileNames: 'app.js', assetFileNames: 'app[extname]',
          globals: { react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM' },
        },
      },
    },
  }
})
