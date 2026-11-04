import express from 'express';
import { supabase } from '../supabase/client.js';
import fs from 'node:fs';
import path from 'node:path';

const router = express.Router();

const STATE_FILE = path.resolve(process.cwd(), 'server', 'data', 'website-state.json');
const ANNOUNCEMENTS_FILE = path.resolve(process.cwd(), 'server', 'data', 'announcements.json');
const TASKS_FILE = path.resolve(process.cwd(), 'server', 'data', 'tasks.json');
const SUGGESTIONS_FILE = path.resolve(process.cwd(), 'server', 'data', 'suggestions.json');
const CALL_STATE_FILE = path.resolve(process.cwd(), 'server', 'data', 'call-state.json');

try { fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true }); } catch (_) {}

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
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/website-state/save
router.post('/website-state/save', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/announcements
router.post('/announcements', async (req, res) => {
  try {
    const { type, title, content, author } = req.body;
    if (!type || !title || !content || !author) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const item = { type, title, content, author, timestamp: new Date().toISOString(), id: 'ann_' + Date.now() };

    let cloudItem = null;
    if (supabase) cloudItem = await supabaseCreateAnnouncement(item);

    const localList = readJson(ANNOUNCEMENTS_FILE, []);
    localList.unshift(cloudItem || item);
    writeJson(ANNOUNCEMENTS_FILE, localList);

    return res.json({ success: true, announcement: cloudItem || item });
  } catch (err) {
    console.error('[API] POST announcements error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks
router.post('/tasks', async (req, res) => {
  try {
    const task = req.body;
    task.created_at = task.created_at || new Date().toISOString();
    task.id = task.id || 'task_' + Date.now();

    let cloudTask = null;
    if (supabase) cloudTask = await supabaseCreateTask(task);

    const list = readJson(TASKS_FILE, []);
    list.unshift(cloudTask || task);
    writeJson(TASKS_FILE, list);

    return res.json({ success: true, task: cloudTask || task });
  } catch (err) {
    console.error('[API] POST tasks error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let cloudTask = null;
    if (supabase) cloudTask = await supabaseUpdateTask(id, updates);

    const list = readJson(TASKS_FILE, []);
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      writeJson(TASKS_FILE, list);
      return res.json({ success: true, task: list[idx] });
    }
    return res.status(404).json({ success: false, error: 'Task not found' });
  } catch (err) {
    console.error('[API] PATCH tasks error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SUGGESTIONS
// ═════════════════════════════════════════════════════════════════════════════

const SUGGESTIONS_TABLE = 'suggestions';

async function supabaseGetSuggestions() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(SUGGESTIONS_TABLE).select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[Supabase] Suggestions load failed:', e.message);
    return null;
  }
}

async function supabaseCreateSuggestion(suggestion) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(SUGGESTIONS_TABLE).insert([suggestion]).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (e) {
    console.warn('[Supabase] Suggestion create failed:', e.message);
    return null;
  }
}

async function supabaseUpdateSuggestion(id, updates) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(SUGGESTIONS_TABLE).update(updates).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
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
    return res.json({ success: true, suggestions });
  } catch (err) {
    console.error('[API] GET suggestions error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/suggestions
router.post('/suggestions', async (req, res) => {
  try {
    const suggestion = req.body;
    suggestion.timestamp = suggestion.timestamp || new Date().toISOString();
    suggestion.id = suggestion.id || 'sugg_' + Date.now();
    suggestion.status = suggestion.status || 'pending';

    let cloudSuggestion = null;
    if (supabase) cloudSuggestion = await supabaseCreateSuggestion(suggestion);

    const list = readJson(SUGGESTIONS_FILE, []);
    list.unshift(cloudSuggestion || suggestion);
    writeJson(SUGGESTIONS_FILE, list);

    return res.json({ success: true, suggestion: cloudSuggestion || suggestion });
  } catch (err) {
    console.error('[API] POST suggestions error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/suggestions/:id
router.patch('/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let cloudSuggestion = null;
    if (supabase) cloudSuggestion = await supabaseUpdateSuggestion(id, updates);

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
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/suggestions/:id
router.delete('/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let cloudOk = false;
    if (supabase) cloudOk = await supabaseDeleteSuggestion(id);

    const list = readJson(SUGGESTIONS_FILE, []);
    const filtered = list.filter(s => s.id !== id);
    writeJson(SUGGESTIONS_FILE, filtered);

    return res.json({ success: true, cloud: cloudOk });
  } catch (err) {
    console.error('[API] DELETE suggestions error:', err.message);
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/call-state — update call state (from any user)
router.post('/call-state', async (req, res) => {
  try {
    const { state: callState, updatedBy } = req.body;
    if (!callState) {
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/chat  { id, ch, from, rank, text, t, isBot, embed }
router.post('/chat', async (req, res) => {
  try {
    const b = req.body || {};
    const text = String(b.text || '').slice(0, CHAT_MAX_TEXT);
    const from = String(b.from || '').slice(0, 60);
    if (!text || !from) return res.status(400).json({ success: false, error: 'text and from are required' });
    const row = {
      client_id: String(b.id || 'm' + Date.now() + Math.random().toString(36).slice(2, 7)).slice(0, 80),
      channel: String(b.ch || '#general').slice(0, 40),
      from,
      rank: b.rank ? String(b.rank).slice(0, 30) : null,
      text,
      t: b.t ? String(b.t).slice(0, 20) : null,
      is_bot: !!b.isBot,
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH (Google + Discord)
// ══════════════════════════════════════════════════════════════════════════════

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://developpement-team.vercel.app/api/auth/discord/callback';

// In-memory session store (production should use Redis/DB)
const oauthSessions = new Map(); // state -> { provider, codeVerifier, createdAt }
const userSessions = new Map(); // token -> { user, expiresAt }

function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateCodeVerifier() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

function sha256Base64Url(str) {
  const buf = crypto.subtle.digestSync('SHA-256', new TextEncoder().encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// GET /api/auth/google — initiate Google OAuth
router.get('/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return res.status(500).json({ success: false, error: 'Google OAuth not configured' });
  }
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = sha256Base64Url(codeVerifier);
  oauthSessions.set(state, { provider: 'google', codeVerifier, createdAt: Date.now() });
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent'
  });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
});

// GET /api/auth/google/callback — Google OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect('/#?oauth=error&provider=google&msg=' + encodeURIComponent(error));
  const session = oauthSessions.get(state);
  if (!session || session.provider !== 'google') {
    return res.redirect('/#?oauth=error&provider=google&msg=invalid_state');
  }
  oauthSessions.delete(state);
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: session.codeVerifier
      })
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + tokens.access_token }
    });
    const profile = await profileRes.json();
    const user = {
      id: 'google_' + profile.id,
      username: profile.email || profile.name,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      provider: 'google',
      rank: 'Developer',
      permissions: 'DEVELOPER',
      verified: profile.verified_email
    };
    const token = generateState();
    userSessions.set(token, { user, expiresAt: Date.now() + 7776000000 }); // 90 days
    res.redirect('/#?oauth=success&token=' + token + '&provider=google&user=' + encodeURIComponent(user.username));
  } catch (e) {
    console.error('[OAuth] Google callback error:', e.message);
    res.redirect('/#?oauth=error&provider=google&msg=' + encodeURIComponent(e.message));
  }
});

// GET /api/auth/discord — initiate Discord OAuth
router.get('/auth/discord', (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return res.status(500).json({ success: false, error: 'Discord OAuth not configured' });
  }
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = sha256Base64Url(codeVerifier);
  oauthSessions.set(state, { provider: 'discord', codeVerifier, createdAt: Date.now() });
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  res.redirect('https://discord.com/api/oauth2/authorize?' + params.toString());
});

// GET /api/auth/discord/callback — Discord OAuth callback
router.get('/auth/discord/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect('/#?oauth=error&provider=discord&msg=' + encodeURIComponent(error));
  const session = oauthSessions.get(state);
  if (!session || session.provider !== 'discord') {
    return res.redirect('/#?oauth=error&provider=discord&msg=invalid_state');
  }
  oauthSessions.delete(state);
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
        code_verifier: session.codeVerifier
      })
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');
    const profileRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: 'Bearer ' + tokens.access_token }
    });
    const profile = await profileRes.json();
    const user = {
      id: 'discord_' + profile.id,
      username: profile.username + (profile.discriminator ? '#' + profile.discriminator : ''),
      email: profile.email,
      name: profile.username,
      picture: profile.avatar ? 'https://cdn.discordapp.com/avatars/' + profile.id + '/' + profile.avatar + '.png' : null,
      provider: 'discord',
      rank: 'Developer',
      permissions: 'DEVELOPER',
      verified: !!profile.verified
    };
    const token = generateState();
    userSessions.set(token, { user, expiresAt: Date.now() + 7776000000 }); // 90 days
    res.redirect('/#?oauth=success&token=' + token + '&provider=discord&user=' + encodeURIComponent(user.username));
  } catch (e) {
    console.error('[OAuth] Discord callback error:', e.message);
    res.redirect('/#?oauth=error&provider=discord&msg=' + encodeURIComponent(e.message));
  }
});

// GET /api/auth/me — get current user from token
router.get('/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  const session = userSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    userSessions.delete(token);
    return res.status(401).json({ success: false, error: 'Token expired' });
  }
  return res.json({ success: true, user: session.user });
});

// POST /api/auth/logout — invalidate token
router.post('/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) userSessions.delete(token);
  return res.json({ success: true });
});

// DELETE /api/chat  { ids: [...] }  — used by /clear
router.delete('/chat', async (req, res) => {
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
