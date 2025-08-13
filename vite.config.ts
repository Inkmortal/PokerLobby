import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron';
  
  return {
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@frontend': path.resolve(__dirname, './src/frontend'),
        '@api': path.resolve(__dirname, './src/api'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@solver': path.resolve(__dirname, './src/solver'),
      },
    },
    base: isElectron ? './' : '/',
    build: {
      outDir: 'dist',
      sourcemap: true,
      // For electron, we need to output to a specific structure
      rollupOptions: isElectron ? {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      } : {},
    },
    server: {
      port: 5173,
      strictPort: true,
      // Allow electron to connect
      cors: true,
    },
    optimizeDeps: {
      // Native modules are loaded in main process
      exclude: [],
    },
  };
});