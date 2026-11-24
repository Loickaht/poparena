import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Chemin de base du site. En local c'est « / ».
// Pour GitHub Pages (https://<pseudo>.github.io/poparena/), on lance le build avec BASE_PATH=/poparena/
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    // PWA : génère le manifeste (installation sur l'écran d'accueil) et un service worker
    // qui met en cache tous les fichiers du site => le mode local marche sans connexion.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'PopArena – Jeux de soirée pop culture',
        short_name: 'PopArena',
        description: 'Jeux de soirée sur la pop culture. Premier jeu : l’Imposteur.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e0a1a',
        theme_color: '#0e0a1a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Le site est une seule page : toute navigation hors ligne renvoie index.html
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
