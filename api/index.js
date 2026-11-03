import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { supabase } from '../server/supabase/client.js';
import apiRoutes from '../server/routes/api.js';

const app = express();

// Trust proxy so rate-limit and IP detection work behind Vercel
app.set('trust proxy', true);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // writes only: 300 per IP per 15 min
  skip: (req) => req.method === 'GET' || req.method === 'HEAD', // live-sync polling must never be rate limited into failure
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

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
