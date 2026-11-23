import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiPlugin } from './vite-plugin-api.js';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), apiPlugin()],
  build: {
    rollupOptions: isSsrBuild ? {} : {
      output: {
        manualChunks: {
          // Framer Motion n'est plus regroupé ici : son cœur léger reste avec l'application, ses fonctions
          // d'animation (src/lib/motion-features.js) partent dans un fichier chargé à part.
          motion: ['gsap', '@gsap/react'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
        },
      },
    },
  },
  ssr: { noExternal: ['react-helmet-async', 'framer-motion', 'lucide-react', 'gsap', '@gsap/react'] },
}));
