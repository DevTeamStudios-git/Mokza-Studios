import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const serveStaticJs = () => ({
  name: 'serve-static-js',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url.endsWith('.js') && (req.url.startsWith('/workspace/js/') || req.url === '/api-client.js')) {
        const filePath = path.resolve(__dirname, req.url.slice(1));
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/javascript');
          res.end(fs.readFileSync(filePath));
          return;
        }
      }
      next();
    });
  }
});

const copyStaticJs = () => ({
  name: 'copy-static-js',
  writeBundle() {
    // Copy workspace JS files to dist
    const filesToCopy = [
      'workspace/js/app.js',
      'workspace/js/admin.js',
      'api-client.js'
    ];
    
    filesToCopy.forEach(file => {
      const src = path.resolve(__dirname, file);
      const dest = path.resolve(__dirname, 'dist', file);
      const destDir = path.dirname(dest);
      
      if (fs.existsSync(src)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to dist`);
      }
    });
  }
});

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    fs: {
      allow: ['.'],
      strict: false,
    },
  },
  plugins: [serveStaticJs(), copyStaticJs()],
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
      },
    },
  },
});
