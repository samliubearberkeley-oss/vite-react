import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 🚀 Production optimizations
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['@insforge/sdk'],
          utils: ['./src/utils/performanceMonitor.js', './src/utils/cacheManager.js']
        }
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096,
    
    // Source maps for production debugging
    sourcemap: false,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Development optimizations
  server: {
    hmr: {
      overlay: false
    }
  },
  
  // CSS optimization
  css: {
    devSourcemap: false
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', '@insforge/sdk']
  }
})
