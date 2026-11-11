import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { supabase } from '../server/supabase/client.js';
import apiRoutes from '../server/routes/api.js';

const app = express();

// Trust proxy so rate-limit and IP detection work behind Vercel
app.set('trust proxy', 1);

// Middleware
// Same-origin by default. Set CORS_ORIGINS (comma-separated) to allow specific other origins.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '6mb' })); // uploads are capped at 4 MB decoded (about 5.4 MB base64)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // writes only: 300 per IP per 15 min
  skip: (req) => req.method === 'GET' || req.method === 'HEAD', // live-sync polling must never be rate limited into failure
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Reads are polled often, but still need an upper bound.
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  skip: (req) => !(req.method === 'GET' || req.method === 'HEAD'),
  message: 'Too many requests from this IP, please try again later.',
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Export for Vercel serverless function
export default app;

// Only listen locally, not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Mokza Studios backend running on http://localhost:${PORT}`);
  });
}
