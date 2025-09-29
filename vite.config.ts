import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    proxy: {
      '/api': {
        target: 'https://ioqa.maximeyes.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/e1': {
        target: 'https://aiscribeqa.maximeyes.com',
        changeOrigin: true,
      },
      '/audio-api': {
        target: 'https://aiscribeqa.maximeyes.com:5002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-api/, ''),
        secure: false
      },
      '/transcription-ws': {
        target: 'wss://aiscribeqa.maximeyes.com:5002',
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/transcription-ws/, '')
      },
      '/token-api': {
        target: 'https://aiscribeqa.maximeyes.com:444',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/token-api/, '')
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
