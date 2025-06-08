import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'markdown': [
            'react-markdown',
            'remark-gfm',
            'markdown-it'
          ],

          'syntax-highlighting': [
            'react-syntax-highlighter',
            'highlight.js'
          ],

          'adaptive-cards': ['adaptivecards'],
          'cytoscape': ['cytoscape'],
          'katex': ['katex'],
          'mermaid': ['mermaid'],
        }
      }
    },
    // Increase chunk size warning limit since we're intentionally chunking
    chunkSizeWarningLimit: 1000,

    // Enable source maps for production debugging (optional)
    sourcemap: false,

    // Optimize build
    minify: 'esbuild',
    target: 'esnext'
  }
})
