import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy API requests to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Copy all HTML files (including workspace/) into dist
    rollupOptions: {
      input: {
        main: './index.html',
        workspace: './workspace/index.html',
        'workspace-clock': './workspace/mokza-clock.html',
        'workspace-devforge': './workspace/mokza-devforge.html',
        'workspace-mail': './workspace/mokza-nexus-mail.html',
        'workspace-notepad': './workspace/mokza-notepad.html',
        'workspace-passwords': './workspace/mokza-passwords.html',
        'workspace-snippets': './workspace/mokza-snippets.html',
      },
    },
  },
});
