import express from 'express';
import { supabase } from '../supabase/client.js';
import fs from 'node:fs';
import path from 'node:path';

const router = express.Router();

const STATE_FILE = path.resolve(process.cwd(), 'server', 'data', 'website-state.json');
const ANNOUNCEMENTS_FILE = path.resolve(process.cwd(), 'server', 'data', 'announcements.json');
const TASKS_FILE = path.resolve(process.cwd(), 'server', 'data', 'tasks.json');

fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });

// Helper: read JSON file
function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

// Helper: write JSON file
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
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

    return res.json({ success: true, cloud: cloudOk, message: 'State saved' });
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

export default router;
