import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes process.env available in the client code
    // Required for the Gemini API key handling as per the instructions
    'process.env': process.env
  }
})
