import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'a22a9b1f7363b4848980e865dab06576-543859913.ap-south-1.elb.amazonaws.com'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'a22a9b1f7363b4848980e865dab06576-543859913.ap-south-1.elb.amazonaws.com'
    ]
  }
})
