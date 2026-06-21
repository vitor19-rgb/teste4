import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Importamos o plugin do PWA
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Adicionamos e configuramos o PWA
    VitePWA({
      registerType: 'autoUpdate', // Atualiza automaticamente se houver nova versão
      includeAssets: ['icone.png'], // Dizemos ao Vite para preparar a tua logo
      manifest: {
        name: 'OrçaMais - Controle Financeiro Pessoal',
        short_name: 'OrçaMais',
        description: 'Sua ferramenta inteligente para controle financeiro pessoal. Registre suas transações e analise seus gastos de forma simples e eficiente.',
        theme_color: '#1e3a8a', // Cor azul escuro
        background_color: '#0f172a', // Cor de fundo da tela de carregamento (splash screen)
        display: 'standalone', // Faz o app abrir como janela nativa, sem a barra de pesquisa
        icons: [
          {
            src: '/icone.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icone.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icone.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Ajuda dispositivos Android a cortar o ícone da melhor forma
          }
        ]
      }
    })
  ],
  base: './', // Importante para GitHub Pages (mantido)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  optimizeDeps: {
    exclude: ['lucide-react'], // Mantido
  },
});