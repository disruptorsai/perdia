import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Ensure single React instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
