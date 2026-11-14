// Vercel function for /api/mozora/* (brief D4). Separate from api/index.js so Prisma stays out of the
// host bundle and Mozora has its own cold start, limiter and failure domain. vercel.json routes
// /api/mozora/(.*) here BEFORE the host's /api/(.*) catch-all.
import { createMozoraApp } from '../server/mozora/app.js';

export default createMozoraApp();
