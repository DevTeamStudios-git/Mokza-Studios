// Local Mozora API on port 3002 (the host API keeps 3001). Vite proxies /api/mozora here.
// Run with: npm run mozora:api
import { createMozoraApp } from './app.js';

const port = Number(process.env.MOZORA_PORT || 3002);
createMozoraApp().listen(port, () => {
  console.log(`[mozora] API on http://localhost:${port}/api/mozora (enabled: ${process.env.MOZORA_ENABLED === '1'})`);
});
