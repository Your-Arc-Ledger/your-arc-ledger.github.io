import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/achievement-diary/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
