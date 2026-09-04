import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// On GitHub Pages a *project* site is served from https://<user>.github.io/<repo>/,
// so the app must be built with base = "/<repo>/". The deploy workflow passes the
// repo name automatically via VITE_BASE; locally we fall back to "/".
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Split the two heavy vendors off the main chunk so first paint is lighter.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase'
          if (id.includes('d3-org-chart') || /[\\/]d3[-/]/.test(id) || id.includes('d3-flextree'))
            return 'd3'
        },
      },
    },
  },
})
