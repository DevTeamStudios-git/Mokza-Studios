// server/auth/token.js reads AUTH_SECRET once, at import time. Give it a fixed test-only value
// before any test module imports it. This value signs nothing outside the test process.
process.env.AUTH_SECRET = 'test-only-secret-'.padEnd(48, 'x');
delete process.env.VERCEL;
