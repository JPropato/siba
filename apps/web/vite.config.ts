/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@siba/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    host: true, // Escuchar en todas las interfaces (0.0.0.0)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Code splitting manual para mejor caching y carga paralela
        manualChunks: {
          // React core - cambia poco, alta probabilidad de cache hit
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animaciones - pesado (~100KB), solo se necesita para interacciones
          'vendor-motion': ['framer-motion'],
          // Formularios - se usa en muchas páginas pero no en la carga inicial
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // UI utilities - iconos, toasts, etc.
          'vendor-ui': ['lucide-react', 'sonner', 'cmdk', 'clsx', 'tailwind-merge'],
          // Data fetching y state
          'vendor-data': ['@tanstack/react-query', '@tanstack/react-virtual', 'zustand', 'axios'],
        },
      },
    },
    // Reportar tamaño de chunks para monitoreo
    chunkSizeWarningLimit: 500, // Warning si chunk > 500KB
  },
});
