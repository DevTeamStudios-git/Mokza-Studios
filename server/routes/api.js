import express from 'express';
import { supabase } from '../supabase/client.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const STATE_FILE = path.resolve(process.cwd(), 'server', 'data', 'website-state.json');
const ANNOUNCEMENTS_FILE = path.resolve(process.cwd(), 'server', 'data', 'announcements.json');
const TASKS_FILE = path.resolve(process.cwd(), 'server', 'data', 'tasks.json');
const SUGGESTIONS_FILE = path.resolve(process.cwd(), 'server', 'data', 'suggestions.json');
const CALL_STATE_FILE = path.resolve(process.cwd(), 'server', 'data', 'call-state.json');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://developpement-team.vercel.app/api/auth/google/callback';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://developpement-team.vercel.app/api/auth/discord/callback';
// Serverless functions don't share memory, so state and sessions are signed tokens, not Maps.
const IS_PROD = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
// No fallback to other secrets or a public literal: a guessable signing key means forgeable Owner tokens.
const AUTH_SECRET = process.env.AUTH_SECRET || (IS_PROD ? '' : crypto.randomBytes(32).toString('hex'));
if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
  throw new Error('AUTH_SECRET must be set (at least 32 random characters). Generate one with: node scripts/hash-password.js --secret');
}
if (!process.env.AUTH_SECRET) console.warn('[Auth] AUTH_SECRET not set: using a random per-process secret (sessions reset on restart). Dev only.');

try { fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true }); } catch (_) {}

// ── Auth helpers ──────────────────────────────────────────────────────────────
function bearerToken(req) {
  const h = String(req.headers.authorization || '');
  return /^Bearer /i.test(h) ? h.slice(7).trim() : null;
}
// Resolves the caller's CURRENT account (and rank) from the database; null if not signed in.
async function softAuth(req) {
  try { return await authedAccount(req); } catch (_) { return null; }
}
function requireRank(min) {
  return async function (req, res, next) {
    try {
      const acc = await authedAccount(req);
      if (!acc) return res.status(401).json({ success: false, error: 'Sign in first' });
      if ((RANK_LEVEL[acc.rank] === undefined ? -1 : RANK_LEVEL[acc.rank]) < RANK_LEVEL[min]) return res.status(403).json({ success: false, error: min + '+ required' });
      req.account = acc;
      next();
    } catch (err) {
      console.error('[Auth] error:', err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };
}
const accName = (acc) => String(acc.name || acc.email || acc.id).slice(0, 80);
const randId = (prefix) => prefix + crypto.randomBytes(8).toString('hex');
const clip = (v, n) => String(v === undefined || v === null ? '' : v).slice(0, n);
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

// Helper: read JSON file
function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

// Helper: write JSON file (no-op on read-only filesystems like Vercel)
function writeJson(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); } catch (_) {}
}

// ═════════════════════════════════════════════════════════════════════════════
// WEBSITE STATE
// ═════════════════════════════════════════════════════════════════════════════

const STATE_TABLE = 'website_state';
const STATE_ID = '00000000-0000-0000-0000-000000000001';

async function supabaseSave(payload) {
  if (!supabase) return false;
  try {
    await supabase.from(STATE_TABLE).upsert(
      { id: STATE_ID, data: payload, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    return true;
  } catch (e) {
    console.warn('[Supabase] Save failed:', e.message);
    return false;
  }
}

async function supabaseLoad() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(STATE_TABLE)
      .select('data, updated_at')
      .eq('id', STATE_ID)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.data : null;
  } catch (e) {
    console.warn('[Supabase] Load failed:', e.message);
    return null;
  }
}

// GET /api/website-state
router.get('/website-state', async (req, res) => {
  try {
    let state = null;
    if (supabase) {
      state = await supabaseLoad();
    }
    if (!state) {
      state = readJson(STATE_FILE, null);
    }
    return res.json({ success: true, state, updated_at: state?.updated_at || null });
  } catch (err) {
    console.error('[API] GET website-state error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/website-state/save
router.post('/website-state/save', requireRank('Apprentice'), async (req, res) => {
  try {
    const { data } = req.body || {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    const savedAt = new Date().toISOString();
    const payload = { ...data, updated_at: savedAt };

    let cloudOk = false;
    if (supabase) cloudOk = await supabaseSave(payload);

    // Always persist locally too
    writeJson(STATE_FILE, { ...payload, id: STATE_ID });

    return res.json({ success: true, cloud: cloudOk, message: 'State saved', updated_at: savedAt });
  } catch (err) {
    console.error('[API] POST website-state/save error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═════════════════════════════════════════════════════════════════════════════

const ANNOUNCEMENTS_TABLE = 'announcements';

async function supabaseAnnouncements(type) {
  if (!supabase) return null;
  try {
    let q = supabase.from(ANNOUNCEMENTS_TABLE).select('*').order('timestamp', { ascending: false });
    if (type) q = q.eq('type', type);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[Supabase] Announcements load failed:', e.message);
    return null;
  }
}

async function supabaseCreateAnnouncement(item) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(ANNOUNCEMENTS_TABLE).insert([item]).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) {
    console.warn('[Supabase] Announcement create failed:', e.message);
    return null;
  }
}

async function supabaseDeleteAnnouncement(id) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(ANNOUNCEMENTS_TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] Announcement delete failed:', e.message);
    return false;
  }
}

// GET /api/announcements
router.get('/announcements', async (req, res) => {
  try {
    let announcements = null;
    if (supabase) {
      announcements = await supabaseAnnouncements(req.query.type);
    }
    if (!announcements) {
      announcements = readJson(ANNOUNCEMENTS_FILE, []);
      if (req.query.type) {
        announcements = announcements.filter(a => a.type === req.query.type);
      }
    }
    return res.json({ success: true, announcements });
  } catch (err) {
    console.error('[API] GET announcements error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/announcements
router.post('/announcements', requireRank('Developer'), async (req, res) => {
  try {
    const { type, title, content } = req.body || {};
    if (!type || !title || !content) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const item = { type: clip(type, 40), title: clip(title, 200), content: clip(content, 5000), author: accName(req.account), timestamp: new Date().toISOString(), id: randId('ann_') };

    let cloudItem = null;
    if (supabase) cloudItem = await supabaseCreateAnnouncement(item);

    const localList = readJson(ANNOUNCEMENTS_FILE, []);
    localList.unshift(cloudItem || item);
    writeJson(ANNOUNCEMENTS_FILE, localList);

    return res.json({ success: true, announcement: cloudItem || item });
  } catch (err) {
    console.error('[API] POST announcements error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/announcements/:id
router.delete('/announcements/:id', requireRank('Developer'), async (req, res) => {
  try {
    const { id } = req.params;
    let cloudOk = false;
    if (supabase) cloudOk = await supabaseDeleteAnnouncement(id);

    const list = readJson(ANNOUNCEMENTS_FILE, []);
    const filtered = list.filter(a => a.id !== id);
    writeJson(ANNOUNCEMENTS_FILE, filtered);

    return res.json({ success: true, cloud: cloudOk });
  } catch (err) {
    console.error('[API] DELETE announcements error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TASKS
// ═════════════════════════════════════════════════════════════════════════════

const TASKS_TABLE = 'tasks';

async function supabaseGetTasks() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(TASKS_TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[Supabase] Tasks load failed:', e.message);
    return null;
  }
}

async function supabaseCreateTask(task) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(TASKS_TABLE).insert([task]).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) {
    console.warn('[Supabase] Task create failed:', e.message);
    return null;
  }
}

async function supabaseUpdateTask(id, updates) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(TASKS_TABLE).update(updates).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) {
    console.warn('[Supabase] Task update failed:', e.message);
    return null;
  }
}

async function supabaseDeleteTask(id) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(TASKS_TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] Task delete failed:', e.message);
    return false;
  }
}

// GET /api/tasks
router.get('/tasks', async (req, res) => {
  try {
    let tasks = null;
    if (supabase) tasks = await supabaseGetTasks();
    if (!tasks) tasks = readJson(TASKS_FILE, []);
    return res.json({ success: true, tasks });
  } catch (err) {
    console.error('[API] GET tasks error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/tasks
const TASK_FIELDS = ['title', 'description', 'priority', 'assignee', 'due_date', 'done'];
function cleanTask(input) {
  const out = {};
  const b = input && typeof input === 'object' ? input : {};
  TASK_FIELDS.forEach((k) => { if (b[k] !== undefined) out[k] = k === 'done' ? !!b[k] : clip(b[k], k === 'description' ? 2000 : 200); });
  if (out.priority && ['low', 'medium', 'high'].indexOf(out.priority) < 0) out.priority = 'medium';
  return out;
}
router.post('/tasks', requireRank('Apprentice'), async (req, res) => {
  try {
    const task = cleanTask(req.body);
    if (!task.title) return res.status(400).json({ success: false, error: 'title required' });
    task.author = accName(req.account);
    task.created_at = new Date().toISOString();
    task.id = req.body && SAFE_ID.test(String(req.body.id || '')) ? String(req.body.id) : randId('task_');

    let cloudTask = null;
    if (supabase) cloudTask = await supabaseCreateTask(task);

    const list = readJson(TASKS_FILE, []);
    list.unshift(cloudTask || task);
    writeJson(TASKS_FILE, list);

    return res.json({ success: true, task: cloudTask || task });
  } catch (err) {
    console.error('[API] POST tasks error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PATCH /api/tasks/:id
router.patch('/tasks/:id', requireRank('Apprentice'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = cleanTask(req.body);

    let cloudTask = null;
    if (supabase) cloudTask = await supabaseUpdateTask(id, updates);

    const list = readJson(TASKS_FILE, []);
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      writeJson(TASKS_FILE, list);
      return res.json({ success: true, task: list[idx] });
    }
    if (cloudTask) return res.json({ success: true, task: cloudTask });
    return res.status(404).json({ success: false, error: 'Task not found' });
  } catch (err) {
    console.error('[API] PATCH tasks error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', requireRank('Apprentice'), async (req, res) => {
  try {
    const { id } = req.params;
    let cloudOk = false;
    if (supabase) cloudOk = await supabaseDeleteTask(id);

    const list = readJson(TASKS_FILE, []);
    const filtered = list.filter(t => t.id !== id);
    writeJson(TASKS_FILE, filtered);

    return res.json({ success: true, cloud: cloudOk });
  } catch (err) {
    console.error('[API] DELETE tasks error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SUGGESTIONS
// ═════════════════════════════════════════════════════════════════════════════

const SUGGESTIONS_TABLE = 'suggestions';

// The browser uses camelCase; the table uses snake_case. Only known columns are ever written.
const SUGG_COLUMNS = {
  id: 'id', author: 'author', email: 'email', text: 'text', timestamp: 'timestamp', status: 'status',
  approvedBy: 'approved_by', approvedAt: 'approved_at', deniedBy: 'denied_by', deniedAt: 'denied_at', deleteAt: 'delete_at',
  approved_by: 'approved_by', approved_at: 'approved_at', denied_by: 'denied_by', denied_at: 'denied_at', delete_at: 'delete_at',
};
function toSuggRow(input) {
  const row = {};
  Object.keys(input || {}).forEach((k) => { if (SUGG_COLUMNS[k] && input[k] !== undefined) row[SUGG_COLUMNS[k]] = input[k]; });
  if (row.text) row.text = String(row.text).slice(0, 2000);
  if (row.author) row.author = String(row.author).slice(0, 80);
  return row;
}
function fromSuggRow(r) {
  return { ...r, approvedBy: r.approved_by, approvedAt: r.approved_at, deniedBy: r.denied_by, deniedAt: r.denied_at, deleteAt: r.delete_at };
}

async function supabaseGetSuggestions() {
  if (!supabase) return null;
  try {
    // denied suggestions are removed for good once their delete_at time has passed (works even if no browser is open)
    await supabase.from(SUGGESTIONS_TABLE).delete().lt('delete_at', new Date().toISOString());
    const { data, error } = await supabase.from(SUGGESTIONS_TABLE).select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromSuggRow);
  } catch (e) {
    console.warn('[Supabase] Suggestions load failed:', e.message);
    return null;
  }
}

async function supabaseCreateSuggestion(suggestion) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(SUGGESTIONS_TABLE).insert([toSuggRow(suggestion)]).select();
    if (error) throw error;
    return data && data[0] ? fromSuggRow(data[0]) : null;
  } catch (e) {
    console.warn('[Supabase] Suggestion create failed:', e.message);
    return null;
  }
}

async function supabaseUpdateSuggestion(id, updates) {
  if (!supabase) return null;
  try {
    const row = toSuggRow(updates); delete row.id;
    row.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from(SUGGESTIONS_TABLE).update(row).eq('id', id).select();
    if (error) throw error;
    return data && data[0] ? fromSuggRow(data[0]) : null;
  } catch (e) {
    console.warn('[Supabase] Suggestion update failed:', e.message);
    return null;
  }
}

async function supabaseDeleteSuggestion(id) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(SUGGESTIONS_TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] Suggestion delete failed:', e.message);
    return false;
  }
}

// GET /api/suggestions
router.get('/suggestions', async (req, res) => {
  try {
    let suggestions = null;
    if (supabase) suggestions = await supabaseGetSuggestions();
    if (!suggestions) suggestions = readJson(SUGGESTIONS_FILE, []);
    // submitters' email addresses are private: only staff may see them
    const acc = await softAuth(req);
    if (!acc || RANK_LEVEL[acc.rank] < RANK_LEVEL.Apprentice) suggestions = suggestions.map((x) => { const { email, ...rest } = x; return rest; });
    return res.json({ success: true, suggestions });
  } catch (err) {
    console.error('[API] GET suggestions error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/suggestions
router.post('/suggestions', async (req, res) => {
  try {
    // Public endpoint: whitelist fields; status/timestamp are always set by the server.
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    const email = clip(b.email, 200).trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: 'Invalid email' });
    if (!clip(b.text, 2000).trim()) return res.status(400).json({ success: false, error: 'text required' });
    const suggestion = {
      id: SAFE_ID.test(String(b.id || '')) ? String(b.id) : randId('sugg_'),
      author: clip(b.author || 'Anonymous', 80),
      email: email || null,
      text: clip(b.text, 2000),
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    let cloudSuggestion = null;
    if (supabase) cloudSuggestion = await supabaseCreateSuggestion(suggestion);

    if (supabase && !cloudSuggestion) return res.status(502).json({ success: false, error: 'Database insert failed' });
    if (!supabase) {
      const list = readJson(SUGGESTIONS_FILE, []);
      list.unshift(suggestion);
      writeJson(SUGGESTIONS_FILE, list);
    }
    return res.json({ success: true, suggestion: cloudSuggestion || suggestion });
  } catch (err) {
    console.error('[API] POST suggestions error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PATCH /api/suggestions/:id
router.patch('/suggestions/:id', requireRank('Apprentice'), async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    // moderation only: the reviewer identity and timestamps come from the server, never the client
    if (['approved', 'denied', 'pending'].indexOf(b.status) < 0) return res.status(400).json({ success: false, error: 'invalid status' });
    const now = new Date().toISOString();
    const updates = { status: b.status };
    if (b.status === 'approved') { updates.approvedBy = accName(req.account); updates.approvedAt = now; }
    if (b.status === 'denied') { updates.deniedBy = accName(req.account); updates.deniedAt = now; updates.deleteAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); }
    if (supabase) {
      const updated = await supabaseUpdateSuggestion(id, updates);
      if (!updated) return res.status(502).json({ success: false, error: 'Database update failed or suggestion not found' });
      return res.json({ success: true, suggestion: updated });
    }
    const list = readJson(SUGGESTIONS_FILE, []);
    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      writeJson(SUGGESTIONS_FILE, list);
      return res.json({ success: true, suggestion: list[idx] });
    }
    return res.status(404).json({ success: false, error: 'Suggestion not found' });
  } catch (err) {
    console.error('[API] PATCH suggestions error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/suggestions/:id
router.delete('/suggestions/:id', requireRank('Apprentice'), async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase) {
      const ok = await supabaseDeleteSuggestion(id);
      if (!ok) return res.status(502).json({ success: false, error: 'Database delete failed' });
      return res.json({ success: true, cloud: true });
    }
    writeJson(SUGGESTIONS_FILE, readJson(SUGGESTIONS_FILE, []).filter(s => s.id !== id));
    return res.json({ success: true, cloud: false });
  } catch (err) {
    console.error('[API] DELETE suggestions error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// CALL STATE (Realtime team call)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/call-state — returns current call state (shared across all users)
router.get('/call-state', async (req, res) => {
  try {
    let call = null;
    if (supabase) {
      try {
        const { data, error } = await supabase.from('call_state').select('*').eq('id', 'main').single();
        if (!error && data) call = data.state;
      } catch (_) {}
    }
    if (!call) call = readJson(CALL_STATE_FILE, { inCall: false, micEnabled: true, videoEnabled: true, screenSharing: false, startedAt: null, participants: [], updatedAt: null });
    return res.json({ success: true, call });
  } catch (err) {
    console.error('[API] GET call-state error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/call-state — update call state (from any user)
router.post('/call-state', requireRank('Apprentice'), async (req, res) => {
  try {
    const { state: callState } = req.body || {};
    const updatedBy = accName(req.account);
    if (!callState || typeof callState !== 'object' || JSON.stringify(callState).length > 20000) {
      return res.status(400).json({ success: false, error: 'No call state provided' });
    }

    const updatedAt = new Date().toISOString();
    const payload = { ...callState, updatedAt, updatedBy };

    let cloudOk = false;
    if (supabase) {
      try {
        await supabase.from('call_state').upsert(
          { id: 'main', state: payload, updated_at: updatedAt },
          { onConflict: 'id' }
        );
        cloudOk = true;
      } catch (e) {
        console.warn('[Supabase] Call state save failed:', e.message);
      }
    }

    writeJson(CALL_STATE_FILE, payload);

    return res.json({ success: true, cloud: cloudOk, call: payload });
  } catch (err) {
    console.error('[API] POST call-state error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ═════════════════════════════════════════════
// CHAT (one row per message; browsers poll for rows newer than their cursor)
// ═════════════════════════════════════════════

const CHAT_TABLE = 'chat_messages';
const CHAT_FILE = path.resolve(process.cwd(), 'server', 'data', 'chat.json');
const CHAT_MAX_TEXT = 1000;

function chatRowToMsg(r) {
  return {
    seq: Number(r.seq),
    id: r.client_id || String(r.id),
    ch: r.channel,
    from: r.from,
    rank: r.rank,
    text: r.text,
    t: r.t,
    isBot: !!r.is_bot,
    embed: r.embed || null,
    createdAt: r.created_at,
  };
}

// GET /api/chat?after=<seq>&limit=<n>
//   after=0 (or missing) -> the latest `limit` messages (oldest first)
//   after=N              -> only messages with seq > N
// Also returns `ids` (every id currently stored in the window) so browsers can drop deleted messages.
router.get('/chat', async (req, res) => {
  try {
    const after = Math.max(0, parseInt(req.query.after, 10) || 0);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 200));
    let messages = null;
    if (supabase) {
      let q = supabase.from(CHAT_TABLE).select('*');
      q = after > 0 ? q.gt('seq', after).order('seq', { ascending: true }).limit(limit)
                    : q.order('seq', { ascending: false }).limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      messages = (data || []).map(chatRowToMsg);
      if (after === 0) messages.reverse();
    } else {
      const all = readJson(CHAT_FILE, []);
      messages = after > 0 ? all.filter((m) => m.seq > after).slice(0, limit) : all.slice(-limit);
    }
    const latest = messages.length ? messages[messages.length - 1].seq : after;
    return res.json({ success: true, messages, latest });
  } catch (err) {
    console.error('[API] GET chat error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/chat  { id, ch, from, rank, text, t, isBot, embed }
router.post('/chat', requireRank('User'), async (req, res) => {
  try {
    const b = req.body || {};
    const staff = RANK_LEVEL[req.account.rank] >= RANK_LEVEL.Apprentice;
    const isBot = staff && !!b.isBot; // only staff clients may post bot/command replies
    const text = String(b.text || '').slice(0, CHAT_MAX_TEXT);
    // sender name and rank come from the verified account, so they can't be spoofed
    const from = (isBot && b.from ? String(b.from) : accName(req.account)).slice(0, 60);
    if (!text || !from) return res.status(400).json({ success: false, error: 'text and from are required' });
    const row = {
      client_id: String(b.id || 'm' + Date.now() + Math.random().toString(36).slice(2, 7)).slice(0, 80),
      channel: String(b.ch || '#general').slice(0, 40),
      from,
      rank: isBot && b.rank ? String(b.rank).slice(0, 30) : req.account.rank,
      text,
      t: b.t ? String(b.t).slice(0, 20) : null,
      is_bot: isBot,
      embed: b.embed && typeof b.embed === 'string' ? b.embed.slice(0, 8000) : (b.embed || null),
    };
    if (supabase) {
      const { data, error } = await supabase
        .from(CHAT_TABLE)
        .upsert([row], { onConflict: 'client_id', ignoreDuplicates: true })
        .select();
      if (error) throw error;
      return res.json({ success: true, message: data && data[0] ? chatRowToMsg(data[0]) : null });
    }
    const all = readJson(CHAT_FILE, []);
    const seq = (all.length ? all[all.length - 1].seq : 0) + 1;
    const msg = { seq, id: row.client_id, ch: row.channel, from, rank: row.rank, text, t: row.t, isBot: row.is_bot, embed: row.embed, createdAt: new Date().toISOString() };
    all.push(msg);
    writeJson(CHAT_FILE, all.slice(-1000));
    return res.json({ success: true, message: msg });
  } catch (err) {
    console.error('[API] POST chat error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/chat  { ids: [...] }  — used by /clear
router.delete('/chat', requireRank('Apprentice'), async (req, res) => {
  try {
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map(String).slice(0, 500) : [];
    if (!ids.length) return res.status(400).json({ success: false, error: 'ids required' });
    if (supabase) {
      const { error } = await supabase.from(CHAT_TABLE).delete().in('client_id', ids);
      if (error) throw error;
    } else {
      writeJson(CHAT_FILE, readJson(CHAT_FILE, []).filter((m) => ids.indexOf(m.id) === -1));
    }
    return res.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error('[API] DELETE chat error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/chat/ids?ch=<channel>  — ids currently stored (lets browsers drop messages deleted elsewhere)
router.get('/chat-ids', async (req, res) => {
  try {
    let ids = [];
    if (supabase) {
      const { data, error } = await supabase.from(CHAT_TABLE).select('client_id').order('seq', { ascending: false }).limit(500);
      if (error) throw error;
      ids = (data || []).map((r) => r.client_id);
    } else {
      ids = readJson(CHAT_FILE, []).slice(-500).map((m) => m.id);
    }
    return res.json({ success: true, ids });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH (Google + Discord) — stateless: works on Vercel serverless
// ═══════════════════════════════════════════════════════════════════════════════

const b64u = (b) => Buffer.from(b).toString('base64url');
const sign = (payload) => { const body = b64u(JSON.stringify(payload)); return body + '.' + crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url'); };
function verify(tok) {
  if (!tok || typeof tok !== 'string' || tok.indexOf('.') < 0) return null;
  const [body, sig] = tok.split('.');
  const good = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); return p.exp && p.exp > Date.now() ? p : null; } catch (_) { return null; }
}
const generateState = () => crypto.randomBytes(16).toString('hex');
const generateCodeVerifier = () => crypto.randomBytes(32).toString('base64url');
const sha256Base64Url = (str) => crypto.createHash('sha256').update(str).digest('base64url');
function readCookie(req, name) {
  const m = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function safeReturn(r) { return typeof r === 'string' && /^\/[A-Za-z0-9_\-\/\.]*$/.test(r) && !r.startsWith('//') ? r : '/'; }
function startOAuth(req, res, provider, base, params) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  // verifier travels in a signed, httpOnly cookie that survives the round trip to the provider
  const cookie = sign({ state, provider, r: safeReturn(req.query.return), v: codeVerifier, exp: Date.now() + 10 * 60 * 1000 });
  res.setHeader('Set-Cookie', 'mokza_oauth=' + encodeURIComponent(cookie) + '; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600');
  const q = new URLSearchParams({ ...params, state, code_challenge: sha256Base64Url(codeVerifier), code_challenge_method: 'S256' });
  res.redirect(base + '?' + q.toString());
}
function takeSession(req, res, provider, state) {
  const p = verify(readCookie(req, 'mokza_oauth'));
  res.setHeader('Set-Cookie', 'mokza_oauth=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0');
  return p && p.provider === provider && p.state === state ? p : null;
}
// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTS & ROLES   User (default for Google/Discord sign-in) → Apprentice → Developer (by request)
// "Verified" is NOT requestable here; it is decided separately by the owners.
// ═══════════════════════════════════════════════════════════════════════════════

const RANK_LEVEL = { User: -1, Apprentice: 0, Developer: 1, CoOwner: 2, Owner: 3 };
const REQUESTABLE_RANKS = ['Apprentice', 'Developer'];
const RANK_PERMISSIONS = { User: 'USER', Apprentice: 'APPRENTICE', Developer: 'DEVELOPER', CoOwner: 'ALL', Owner: 'ALL' };
// Optional: emails in this env var become Owner on sign-in, so someone can approve the first requests.
const BOOTSTRAP_OWNER_EMAILS = (process.env.BOOTSTRAP_OWNER_EMAILS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const ACCOUNTS_FILE = path.resolve(process.cwd(), 'server', 'data', 'accounts.json');
const ROLE_REQUESTS_FILE = path.resolve(process.cwd(), 'server', 'data', 'role-requests.json');

function accountToUser(a) {
  const rank = RANK_LEVEL[a.rank] !== undefined ? a.rank : 'User';
  return {
    id: a.id, username: a.email || a.name || a.id, email: a.email, name: a.name, picture: a.picture,
    provider: a.provider, rank, permissions: RANK_PERMISSIONS[rank], verified: false,
  };
}

async function dbGetAccount(id) {
  if (supabase) {
    const { data, error } = await supabase.from('user_accounts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  }
  return readJson(ACCOUNTS_FILE, []).find((a) => a.id === id) || null;
}

async function dbSaveAccount(acc) {
  if (supabase) {
    const { data, error } = await supabase.from('user_accounts').upsert([acc], { onConflict: 'id' }).select().single();
    if (error) throw error;
    return data;
  }
  const all = readJson(ACCOUNTS_FILE, []);
  const i = all.findIndex((a) => a.id === acc.id);
  if (i >= 0) all[i] = { ...all[i], ...acc }; else all.push(acc);
  writeJson(ACCOUNTS_FILE, all);
  return i >= 0 ? all[i] : acc;
}

// First sign-in creates a plain "User". Later sign-ins keep whatever rank the account has earned.
async function upsertLoginAccount(profile) {
  const existing = await dbGetAccount(profile.id);
  const email = (profile.email || '').toLowerCase();
  let rank = existing ? existing.rank : 'User';
  if (email && profile.verified === true && BOOTSTRAP_OWNER_EMAILS.indexOf(email) >= 0 && RANK_LEVEL[rank] < RANK_LEVEL.Owner) rank = 'Owner';
  return dbSaveAccount({
    id: profile.id, email: profile.email || null, name: profile.name || null, picture: profile.picture || null,
    provider: profile.provider, rank, last_login_at: new Date().toISOString(),
    ...(existing ? {} : { created_at: new Date().toISOString() }),
  });
}

/* ── STAFF PASSWORD LOGIN ──────────────────────────────────────────────────────────
 * Owner/CoOwner/Developer staff sign in with a password (legacy dev-mode). Those
 * logins previously created a client-only "local_" token with no server identity,
 * so CoOwner+ could never open the Access Requests list. Password logins now get
 * the same signed token as Google/Discord logins and a row in user_accounts.
 * Ranks configured per staff name live here; rankings earned inside
 * user_accounts (e.g. Owner via BOOTSTRAP_OWNER_EMAILS) are never downgraded.
 * The default list mirrors the hashes shipped in app.js; override with the
 * STAFF_ACCOUNTS env var (JSON: {"Name": {"hash": "<sha256 hex>", "rank": "Owner"}}).
 */
/* Staff accounts come from the STAFF_ACCOUNTS env var (JSON), never from source code:
 *   {"Name": {"hash": "scrypt$<salt>$<hex>", "rank": "Owner"}}
 * Generate a hash with:  node scripts/hash-password.js
 * Optional STAFF_SECURITY_CODE_HASH (same format) adds the extra "security code" gate server-side.
 * Legacy unsalted SHA-256 hex hashes are still accepted but should be replaced. */
const STAFF_ACCOUNTS = (() => {
  try {
    const env = JSON.parse(process.env.STAFF_ACCOUNTS || '');
    if (!env || typeof env !== 'object' || Array.isArray(env)) return {};
    const ok = {};
    Object.keys(env).forEach((k) => { if (env[k] && env[k].hash && RANK_LEVEL[env[k].rank] !== undefined && env[k].rank !== 'User') ok[k] = env[k]; });
    return ok;
  } catch (_) { return {}; }
})();
if (!Object.keys(STAFF_ACCOUNTS).length) console.warn('[Auth] STAFF_ACCOUNTS is not set: staff password login is disabled.');

function checkSecret(input, stored) {
  try {
    stored = String(stored || '');
    if (stored.indexOf('scrypt$') === 0) {
      const parts = stored.split('$');
      const want = Buffer.from(parts[2] || '', 'hex');
      if (!want.length) return false;
      const got = crypto.scryptSync(input, parts[1], want.length);
      return crypto.timingSafeEqual(got, want);
    }
    const got = Buffer.from(crypto.createHash('sha256').update(input).digest('hex'));
    const want = Buffer.from(stored);
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch (_) { return false; }
}

// brute-force brake on the login endpoint (per IP; best effort across serverless instances)
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, error: 'Too many attempts. Try again later.' } });

const higherRank = (a, b) => ((RANK_LEVEL[a] === undefined ? -1 : RANK_LEVEL[a]) >= (RANK_LEVEL[b] === undefined ? -1 : RANK_LEVEL[b]) ? a : b);

// POST /api/auth/password { username, password } → signed session for staff accounts
router.post('/auth/password', loginLimiter, async (req, res) => {
  try {
    const username = String((req.body && req.body.username) || '').trim();
    const password = String((req.body && req.body.password) || '');
    const code = String((req.body && req.body.code) || '');
    const cfg = Object.prototype.hasOwnProperty.call(STAFF_ACCOUNTS, username) ? STAFF_ACCOUNTS[username] : null;
    const ok = cfg ? checkSecret(password, cfg.hash) : false;
    const codeOk = !process.env.STAFF_SECURITY_CODE_HASH || checkSecret(code, process.env.STAFF_SECURITY_CODE_HASH);
    if (!cfg || !ok || !codeOk) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const id = 'staff_' + username;
    const existing = await dbGetAccount(id);
    const rank = existing ? higherRank(existing.rank, cfg.rank) : cfg.rank;
    const acc = await dbSaveAccount({
      id, email: (existing && existing.email) || null, name: username, picture: null,
      provider: 'password', rank, last_login_at: new Date().toISOString(),
      ...(existing ? {} : { created_at: new Date().toISOString() }),
    });
    const token = sign({ uid: acc.id, exp: Date.now() + 90 * 24 * 3600 * 1000 });
    return res.json({ success: true, token, user: accountToUser(acc) });
  } catch (err) {
    console.error('[API] POST auth/password error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

async function finishLogin(res, profile, provider, ret) {
  const acc = await upsertLoginAccount({ ...profile, provider });
  const user = accountToUser(acc);
  const token = sign({ uid: acc.id, exp: Date.now() + 90 * 24 * 3600 * 1000 });
  res.redirect((ret || '/') + '#?oauth=success&token=' + encodeURIComponent(token) + '&provider=' + provider + '&user=' + encodeURIComponent(user.username));
}

// Resolves the signed token to the account's CURRENT rank from the database (never trusts rank stored in the token).
async function authedAccount(req) {
  const p = verify(bearerToken(req));
  if (!p) return null;
  const uid = p.uid || (p.user && p.user.id); // tokens issued before accounts existed carried the whole user
  if (!uid) return null;
  let acc = await dbGetAccount(uid);
  if (!acc && p.user) acc = await upsertLoginAccount({ ...p.user, provider: p.user.provider || 'google' });
  return acc;
}

async function dbListRequests({ status, accountId } = {}) {
  if (supabase) {
    let q = supabase.from('role_requests').select('*').order('created_at', { ascending: false }).limit(200);
    if (status) q = q.eq('status', status);
    if (accountId) q = q.eq('account_id', accountId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  return readJson(ROLE_REQUESTS_FILE, []).filter((r) => (!status || r.status === status) && (!accountId || r.account_id === accountId));
}

async function dbSaveRequest(r) {
  if (supabase) {
    const { data, error } = await supabase.from('role_requests').upsert([r], { onConflict: 'id' }).select().single();
    if (error) throw error;
    return data;
  }
  const all = readJson(ROLE_REQUESTS_FILE, []);
  const i = all.findIndex((x) => x.id === r.id);
  if (i >= 0) all[i] = { ...all[i], ...r }; else all.unshift(r);
  writeJson(ROLE_REQUESTS_FILE, all);
  return r;
}

const requestToClient = (r) => ({ id: r.id, accountId: r.account_id, username: r.username, requestedRank: r.requested_rank, message: r.message, status: r.status, createdAt: r.created_at, decidedBy: r.decided_by, decidedAt: r.decided_at, decisionNote: r.decision_note });

// A reviewer needs to outrank what is being requested (Developer requests: CoOwner+, Apprentice requests: Developer+).
const reviewerNeeded = (requestedRank) => (requestedRank === 'Developer' ? 'CoOwner' : 'Developer');

// POST /api/role-requests { rank: 'Apprentice' | 'Developer', message }
router.post('/role-requests', async (req, res) => {
  try {
    const acc = await authedAccount(req);
    if (!acc) return res.status(401).json({ success: false, error: 'Sign in first' });
    const rank = req.body && req.body.rank;
    if (REQUESTABLE_RANKS.indexOf(rank) < 0) return res.status(400).json({ success: false, error: 'Only Apprentice or Developer can be requested' });
    if (RANK_LEVEL[acc.rank] >= RANK_LEVEL[rank]) return res.status(400).json({ success: false, error: 'You already have ' + acc.rank + ' or higher' });
    const pending = await dbListRequests({ status: 'pending', accountId: acc.id });
    if (pending.length) return res.status(409).json({ success: false, error: 'You already have a pending request', request: requestToClient(pending[0]) });
    const saved = await dbSaveRequest({
      id: 'rr_' + crypto.randomBytes(8).toString('hex'), account_id: acc.id, username: acc.email || acc.name || acc.id,
      requested_rank: rank, message: String((req.body && req.body.message) || '').slice(0, 500), status: 'pending', created_at: new Date().toISOString(),
    });
    return res.json({ success: true, request: requestToClient(saved) });
  } catch (err) {
    console.error('[API] POST role-requests error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/role-requests/mine
router.get('/role-requests/mine', async (req, res) => {
  try {
    const acc = await authedAccount(req);
    if (!acc) return res.status(401).json({ success: false, error: 'Sign in first' });
    const list = await dbListRequests({ accountId: acc.id });
    return res.json({ success: true, requests: list.slice(0, 20).map(requestToClient) });
  } catch (err) { res.status(500).json({ success: false, error: 'Server error' }); }
});

// GET /api/role-requests?status=pending   (Developer+ sees Apprentice requests, CoOwner+ sees all)
router.get('/role-requests', async (req, res) => {
  try {
    const acc = await authedAccount(req);
    if (!acc || RANK_LEVEL[acc.rank] < RANK_LEVEL.Developer) return res.status(403).json({ success: false, error: 'Developer+ required' });
    const list = (await dbListRequests({ status: req.query.status || 'pending' })).filter((r) => RANK_LEVEL[acc.rank] >= RANK_LEVEL[reviewerNeeded(r.requested_rank)]);
    return res.json({ success: true, requests: list.map(requestToClient) });
  } catch (err) { res.status(500).json({ success: false, error: 'Server error' }); }
});

// PATCH /api/role-requests/:id { decision: 'approve' | 'deny', note }
router.patch('/role-requests/:id', async (req, res) => {
  try {
    const acc = await authedAccount(req);
    if (!acc) return res.status(401).json({ success: false, error: 'Sign in first' });
    const reqRow = (await dbListRequests({})).find((r) => r.id === req.params.id);
    if (!reqRow) return res.status(404).json({ success: false, error: 'Request not found' });
    if (reqRow.status !== 'pending') return res.status(409).json({ success: false, error: 'Already ' + reqRow.status });
    if (RANK_LEVEL[acc.rank] < RANK_LEVEL[reviewerNeeded(reqRow.requested_rank)]) return res.status(403).json({ success: false, error: reviewerNeeded(reqRow.requested_rank) + '+ required for this request' });
    if (reqRow.account_id === acc.id) return res.status(403).json({ success: false, error: 'You cannot decide your own request' });
    const decision = req.body && req.body.decision;
    if (decision !== 'approve' && decision !== 'deny') return res.status(400).json({ success: false, error: 'decision must be approve or deny' });
    if (decision === 'approve') {
      const target = await dbGetAccount(reqRow.account_id);
      if (target && RANK_LEVEL[target.rank] < RANK_LEVEL[reqRow.requested_rank]) await dbSaveAccount({ ...target, rank: reqRow.requested_rank });
    }
    const saved = await dbSaveRequest({ ...reqRow, status: decision === 'approve' ? 'approved' : 'denied', decided_by: acc.email || acc.name || acc.id, decided_at: new Date().toISOString(), decision_note: String((req.body && req.body.note) || '').slice(0, 300) });
    return res.json({ success: true, request: requestToClient(saved) });
  } catch (err) {
    console.error('[API] PATCH role-requests error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return res.status(500).json({ success: false, error: 'Google OAuth not configured' });
  startOAuth(req, res, 'google', 'https://accounts.google.com/o/oauth2/v2/auth', {
    client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI, response_type: 'code', scope: 'openid email profile', prompt: 'select_account',
  });
});

router.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect('/#?oauth=error&provider=google&msg=' + encodeURIComponent(error));
  const session = takeSession(req, res, 'google', state);
  if (!session) return res.redirect('/#?oauth=error&provider=google&msg=invalid_state');
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT_URI, grant_type: 'authorization_code', code_verifier: session.v }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error(tokens.error_description || tokens.error || 'No access token');
    const profile = await (await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: 'Bearer ' + tokens.access_token } })).json();
    await finishLogin(res, { id: 'google_' + profile.id, username: profile.email || profile.name, email: profile.email, name: profile.name, picture: profile.picture, provider: 'google', rank: 'Developer', permissions: 'DEVELOPER', verified: profile.verified_email === true }, 'google', session.r);
  } catch (e) {
    console.error('[OAuth] Google callback error:', e.message);
    res.redirect('/#?oauth=error&provider=google&msg=' + 'login_failed');
  }
});

router.get('/auth/discord', (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) return res.status(500).json({ success: false, error: 'Discord OAuth not configured' });
  startOAuth(req, res, 'discord', 'https://discord.com/api/oauth2/authorize', {
    client_id: DISCORD_CLIENT_ID, redirect_uri: DISCORD_REDIRECT_URI, response_type: 'code', scope: 'identify email',
  });
});

router.get('/auth/discord/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect('/#?oauth=error&provider=discord&msg=' + encodeURIComponent(error));
  const session = takeSession(req, res, 'discord', state);
  if (!session) return res.redirect('/#?oauth=error&provider=discord&msg=invalid_state');
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: DISCORD_CLIENT_ID, client_secret: DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: DISCORD_REDIRECT_URI, code_verifier: session.v }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error(tokens.error_description || tokens.error || 'No access token');
    const profile = await (await fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + tokens.access_token } })).json();
    await finishLogin(res, { id: 'discord_' + profile.id, username: profile.username + (profile.discriminator && profile.discriminator !== '0' ? '#' + profile.discriminator : ''), email: profile.email, name: profile.username, picture: profile.avatar ? 'https://cdn.discordapp.com/avatars/' + profile.id + '/' + profile.avatar + '.png' : null, provider: 'discord', rank: 'Developer', permissions: 'DEVELOPER', verified: !!profile.verified }, 'discord', session.r);
  } catch (e) {
    console.error('[OAuth] Discord callback error:', e.message);
    res.redirect('/#?oauth=error&provider=discord&msg=' + 'login_failed');
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'No token' });
    const acc = await authedAccount(req);
    if (!acc) return res.status(401).json({ success: false, error: 'Token expired' });
    const mine = await dbListRequests({ accountId: acc.id });
    return res.json({ success: true, user: accountToUser(acc), pendingRequest: mine.filter((r) => r.status === 'pending').map(requestToClient)[0] || null, lastDecision: mine.filter((r) => r.status !== 'pending').map(requestToClient)[0] || null });
  } catch (err) {
    console.error('[API] GET auth/me error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/auth/logout', (req, res) => res.json({ success: true }));

// ══════════════════════════════════════════════════════════════════════════════
// FILES (Studio Drive)
// ═════════════════════════════════════════════════════════════════════════════

const FILES_FILE = path.resolve(process.cwd(), 'server', 'data', 'files.json');

async function supabaseGetFiles() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('files').select('*').order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) { console.warn('[Supabase] Files load failed:', e.message); return null; }
}

async function supabaseCreateFile(file) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('files').insert([file]).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) { console.warn('[Supabase] File create failed:', e.message); return null; }
}

async function supabaseDeleteFile(id) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) { console.warn('[Supabase] File delete failed:', e.message); return false; }
}

router.get('/files', requireRank('Apprentice'), async (req, res) => {
  try {
    let files = null;
    if (supabase) {
      files = await supabaseGetFiles();
    }
    if (!files) {
      files = readJson(FILES_FILE, []);
    }
    const folder = req.query.folder || '';
    if (folder) {
      files = files.filter(f => f.folder === folder);
    }
    return res.json({ success: true, files: files.map(({ data, ...meta }) => meta) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

const MAX_FILE_BYTES = 4 * 1024 * 1024;
router.post('/files/upload', requireRank('Apprentice'), async (req, res) => {
  try {
    const { filename, folder, data } = req.body || {};
    if (!filename || typeof data !== 'string' || !data) {
      return res.status(400).json({ success: false, error: 'filename and data required' });
    }
    if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) return res.status(400).json({ success: false, error: 'data must be base64' });
    const size = Buffer.from(data, 'base64').length;
    if (size > MAX_FILE_BYTES) return res.status(413).json({ success: false, error: 'File too large (max 4 MB)' });
    const id = randId('file_');
    const file = {
      id,
      name: clip(String(filename).split(/[\\/]/).pop().replace(/[\u0000-\u001f"]/g, ''), 200) || 'file',
      folder: clip(folder, 100),
      data,
      size,
      type: '',
      uploadedAt: new Date().toISOString(),
      uploadedBy: accName(req.account),
      downloadURL: '/api/files/' + id + '/download',
    };
    if (supabase) {
      const saved = await supabaseCreateFile(file);
      if (!saved) return res.status(502).json({ success: false, error: 'Database insert failed' });
    } else {
      const list = readJson(FILES_FILE, []);
      list.push(file);
      writeJson(FILES_FILE, list);
    }
    const { data: _omit, ...meta } = file;
    return res.json({ success: true, file: meta });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/files/:id/download', requireRank('Apprentice'), async (req, res) => {
  try {
    let file = null;
    if (supabase) {
      const { data } = await supabase.from('files').select('*').eq('id', req.params.id).single();
      file = data;
    } else {
      const list = readJson(FILES_FILE, []);
      file = list.find(f => f.id === req.params.id);
    }
    if (!file || !file.data) return res.status(404).json({ success: false, error: 'File not found' });
    const buffer = Buffer.from(file.data, 'base64');
    res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(file.name));
    res.setHeader('Content-Type', 'application/octet-stream'); // never trust a stored type
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.delete('/files/:id', requireRank('Apprentice'), async (req, res) => {
  try {
    let cloudOk = false;
    if (supabase) {
      const { error } = await supabase.from('files').delete().eq('id', req.params.id);
      if (error) throw error;
      cloudOk = true;
    } else {
      const list = readJson(FILES_FILE, []);
      const filtered = list.filter(f => f.id !== req.params.id);
      writeJson(FILES_FILE, filtered);
    }
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;

