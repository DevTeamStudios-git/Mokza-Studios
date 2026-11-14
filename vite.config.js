import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mozoraVitePlugins } from './mozora/vite-plugin.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Mozora's API runs on its own port locally (npm run mozora:api); must precede the /api/ rule.
      '^/api/mozora/': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '^/api/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    fs: {
      allow: ['.'],
      strict: false,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
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
        mozora: './mozora/index.html',
      },
    },
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.gif'],
  },
  plugins: [
    ...mozoraVitePlugins(),
    {
      name: 'copy-badges',
      closeBundle() {
        const badgeFiles = ['badge-gold.png', 'badge-blue.png'];
        const assetsDir = resolve(__dirname, 'dist', 'assets');
        
        if (!existsSync(assetsDir)) {
          mkdirSync(assetsDir, { recursive: true });
        }
        
        badgeFiles.forEach(file => {
          const src = resolve(__dirname, 'assets', file);
          const dest = resolve(assetsDir, file);
          if (existsSync(src)) {
            copyFileSync(src, dest);
            console.log(`[copy-badges] Copied ${file} to dist/assets`);
          } else {
            console.warn(`[copy-badges] Source file not found: ${src}`);
          }
        });
      }
    }
  ]
});
