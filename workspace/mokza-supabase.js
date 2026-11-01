/*
 * Mokza Workspace — Supabase data layer
 *
 * Supabase-backed replacement for the Firebase SDKs previously used by the
 * workspace apps. It keeps the same call shapes (Firestore compat + modular,
 * Realtime Database, Auth, Storage) so app code only changes at init time.
 *
 * Tables / bucket: see supabase/migrations/*_workspace.sql
 *   ws_documents  — Firestore-style documents (path = "col/doc/col/doc")
 *   ws_rtdb       — Realtime-Database-style JSON tree nodes
 *   workspace-files (storage bucket)
 *
 * Requires: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 (window.supabase)
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://pgxgfhqwzkdayhbyqfvl.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneGdmaHF3emtkYXloYnlxZnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMjQ3NTcsImV4cCI6MjEwODgwMDc1N30.1F0Zx7gWTrEJpmFLr_zrg00u4VfFTVXNE2TpBQ_ZzK0';
  const DOCS_TABLE = 'ws_documents';
  const RTDB_TABLE = 'ws_rtdb';
  const BUCKET = 'workspace-files';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[MokzaDB] supabase-js failed to load');
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const AUTO_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function autoId(len = 20) {
    const bytes = crypto.getRandomValues(new Uint8Array(len));
    let id = '';
    for (const b of bytes) id += AUTO_ID_CHARS[b % AUTO_ID_CHARS.length];
    return id;
  }
  function normPath(...segs) {
    return segs.join('/').split('/').filter(Boolean).join('/');
  }
  function sbError(error) {
    const e = new Error(error?.message || String(error));
    e.code = error?.code;
    return e;
  }

  /* ══ Timestamps & sentinels ══════════════════════════════════ */
  class Timestamp {
    constructor(seconds, nanoseconds = 0) { this.seconds = seconds; this.nanoseconds = nanoseconds; }
    static now() { return Timestamp.fromMillis(Date.now()); }
    static fromDate(d) { return Timestamp.fromMillis(d.getTime()); }
    static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6); }
    toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6); }
    toDate() { return new Date(this.toMillis()); }
    valueOf() { return this.toMillis(); }
    toJSON() { return this.toDate().toISOString(); }
    toString() { return this.toDate().toString(); }
  }
  const SERVER_TS = { __mokzaSentinel: 'serverTimestamp' };
  const DELETE_FIELD = { __mokzaSentinel: 'delete' };
  function increment(n) { return { __mokzaSentinel: 'increment', n }; }
  function arrayUnion(...v) { return { __mokzaSentinel: 'arrayUnion', v }; }
  function arrayRemove(...v) { return { __mokzaSentinel: 'arrayRemove', v }; }
  const isPlain = (v) => v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;

  function encode(v) {
    if (v === SERVER_TS) return { __ts: Date.now() };
    if (v instanceof Timestamp) return { __ts: v.toMillis() };
    if (v instanceof Date) return { __ts: v.getTime() };
    if (Array.isArray(v)) return v.map(encode);
    if (isPlain(v)) {
      const out = {};
      for (const [k, val] of Object.entries(v)) if (val !== undefined) out[k] = encode(val);
      return out;
    }
    return v;
  }
  function decode(v) {
    if (Array.isArray(v)) return v.map(decode);
    if (v && typeof v === 'object') {
      if (typeof v.__ts === 'number' && Object.keys(v).length === 1) return Timestamp.fromMillis(v.__ts);
      const out = {};
      for (const [k, val] of Object.entries(v)) out[k] = decode(val);
      return out;
    }
    return v;
  }
  function applyPatch(base, patch) {
    const out = { ...(base || {}) };
    for (const [key, val] of Object.entries(patch)) {
      const parts = key.split('.');
      let target = out;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = isPlain(target[parts[i]]) ? { ...target[parts[i]] } : {};
        target = target[parts[i]];
      }
      const leaf = parts[parts.length - 1];
      const s = val && val.__mokzaSentinel;
      if (s === 'delete') delete target[leaf];
      else if (s === 'increment') target[leaf] = (Number(target[leaf]) || 0) + val.n;
      else if (s === 'arrayUnion') {
        const arr = Array.isArray(target[leaf]) ? [...target[leaf]] : [];
        val.v.forEach((x) => { if (!arr.some((y) => JSON.stringify(y) === JSON.stringify(encode(x)))) arr.push(encode(x)); });
        target[leaf] = arr;
      } else if (s === 'arrayRemove') {
        const rm = val.v.map((x) => JSON.stringify(encode(x)));
        target[leaf] = (Array.isArray(target[leaf]) ? target[leaf] : []).filter((y) => !rm.includes(JSON.stringify(y)));
      } else target[leaf] = encode(val);
    }
    return out;
  }
  function stripSentinels(data) {
    const out = {};
    for (const [k, v] of Object.entries(data || {})) {
      const s = v && v.__mokzaSentinel;
      if (s === 'delete') continue;
      if (s === 'increment') out[k] = v.n;
      else if (s === 'arrayUnion') out[k] = v.v;
      else if (s === 'arrayRemove') out[k] = [];
      else out[k] = v;
    }
    return out;
  }

  /* ══ Change notification (realtime + local writes) ═══════════ */
  const listeners = new Set(); // { table, matches(path), refresh() }
  function notifyLocal(table, path) {
    listeners.forEach((l) => { if (l.table === table && l.matches(path)) l.refresh(); });
  }
  let channelSeq = 0;
  function subscribeTable(table, entry) {
    const debounced = (() => {
      let t = null;
      return () => { clearTimeout(t); t = setTimeout(entry.refresh, 60); };
    })();
    const l = { table, matches: entry.matches, refresh: debounced };
    listeners.add(l);
    const channel = client
      .channel(`mokza-${table}-${++channelSeq}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const path = payload.new?.path || payload.old?.path;
        if (!path || entry.matches(path)) debounced();
      })
      .subscribe();
    return () => { listeners.delete(l); client.removeChannel(channel); };
  }

  /* ══ Firestore-compatible API ════════════════════════════════ */
  function compare(a, b) {
    const norm = (x) => (x instanceof Timestamp ? x.toMillis() : x);
    a = norm(a); b = norm(b);
    if (a === b) return 0;
    if (a === undefined || a === null) return -1;
    if (b === undefined || b === null) return 1;
    return a < b ? -1 : 1;
  }
  const getField = (obj, field) => field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  function testWhere(data, { field, op, value }) {
    const v = getField(data, field);
    const eq = (x, y) => compare(x, y) === 0 && JSON.stringify(encode(x)) === JSON.stringify(encode(y));
    switch (op) {
      case '==': return eq(v, value);
      case '!=': return !eq(v, value);
      case '<': return v != null && compare(v, value) < 0;
      case '<=': return v != null && compare(v, value) <= 0;
      case '>': return v != null && compare(v, value) > 0;
      case '>=': return v != null && compare(v, value) >= 0;
      case 'array-contains': return Array.isArray(v) && v.some((x) => eq(x, value));
      case 'array-contains-any': return Array.isArray(v) && v.some((x) => value.some((y) => eq(x, y)));
      case 'in': return value.some((y) => eq(v, y));
      case 'not-in': return !value.some((y) => eq(v, y));
      default: throw new Error(`Unsupported where operator: ${op}`);
    }
  }

  class DocumentSnapshot {
    constructor(ref, data) { this.ref = ref; this.id = ref.id; this._data = data; this.exists = data != null; this.metadata = { hasPendingWrites: false, fromCache: false }; }
    data() { return this._data == null ? undefined : decode(this._data); }
    get(field) { return getField(this.data() || {}, field); }
  }
  class QuerySnapshot {
    constructor(docs, prevIds) {
      this.docs = docs; this.size = docs.length; this.empty = docs.length === 0;
      this.metadata = { hasPendingWrites: false, fromCache: false };
      this._changes = docs.filter((d) => !prevIds || !prevIds.has(d.id)).map((d, i) => ({ type: 'added', doc: d, newIndex: i, oldIndex: -1 }));
    }
    forEach(cb) { this.docs.forEach(cb); }
    docChanges() { return this._changes; }
  }

  class Query {
    constructor(path, constraints = {}) {
      this.path = normPath(path);
      this._c = { wheres: [], orders: [], limit: null, limitToLast: null, ...constraints };
    }
    _with(patch) { return new Query(this.path, { ...this._c, ...patch }); }
    where(field, op, value) { return this._with({ wheres: [...this._c.wheres, { field, op, value }] }); }
    orderBy(field, dir = 'asc') { return this._with({ orders: [...this._c.orders, { field, dir }] }); }
    limit(n) { return this._with({ limit: n }); }
    limitToLast(n) { return this._with({ limitToLast: n }); }
    async _fetch() {
      const { data, error } = await client.from(DOCS_TABLE).select('path,doc_id,data').eq('collection', this.path);
      if (error) throw sbError(error);
      let rows = (data || []).map((r) => ({ id: r.doc_id, raw: r.data, dec: decode(r.data) }));
      rows = rows.filter((r) => this._c.wheres.every((w) => testWhere(r.dec, w)));
      if (this._c.orders.length) {
        rows = rows.filter((r) => this._c.orders.every((o) => getField(r.dec, o.field) !== undefined));
        rows.sort((a, b) => {
          for (const o of this._c.orders) {
            const c = compare(getField(a.dec, o.field), getField(b.dec, o.field));
            if (c) return o.dir === 'desc' ? -c : c;
          }
          return 0;
        });
      }
      if (this._c.limit != null) rows = rows.slice(0, this._c.limit);
      if (this._c.limitToLast != null) rows = rows.slice(-this._c.limitToLast);
      const col = new CollectionReference(this.path);
      return rows.map((r) => new DocumentSnapshot(col.doc(r.id), r.raw));
    }
    async get() { return new QuerySnapshot(await this._fetch()); }
    onSnapshot(next, onError) {
      if (typeof next === 'object' && next) { onError = next.error; next = next.next; }
      let active = true, prevIds = null;
      const refresh = async () => {
        try {
          const docs = await this._fetch();
          if (!active) return;
          const snap = new QuerySnapshot(docs, prevIds);
          prevIds = new Set(docs.map((d) => d.id));
          next(snap);
        } catch (e) { if (onError) onError(e); else console.warn('[MokzaDB] snapshot error:', e.message); }
      };
      const prefix = this.path + '/';
      const unsub = subscribeTable(DOCS_TABLE, {
        matches: (p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'),
        refresh,
      });
      refresh();
      return () => { active = false; unsub(); };
    }
  }

  class CollectionReference extends Query {
    constructor(path) { super(path); this.id = this.path.split('/').pop(); }
    doc(id) { return new DocumentReference(normPath(this.path, id || autoId())); }
    async add(data) {
      const ref = this.doc();
      await ref.set(data);
      return ref;
    }
  }

  class DocumentReference {
    constructor(path) {
      this.path = normPath(path);
      const segs = this.path.split('/');
      this.id = segs.pop();
      this._collection = segs.join('/');
    }
    get parent() { return new CollectionReference(this._collection); }
    collection(name) { return new CollectionReference(normPath(this.path, name)); }
    async _read() {
      const { data, error } = await client.from(DOCS_TABLE).select('data').eq('path', this.path).maybeSingle();
      if (error) throw sbError(error);
      return data ? data.data : null;
    }
    async get() { return new DocumentSnapshot(this, await this._read()); }
    async _write(data) {
      const { error } = await client.from(DOCS_TABLE).upsert(
        { path: this.path, collection: this._collection, doc_id: this.id, data, updated_at: new Date().toISOString() },
        { onConflict: 'path' }
      );
      if (error) throw sbError(error);
      notifyLocal(DOCS_TABLE, this.path);
    }
    async set(data, options) {
      if (options && (options.merge || options.mergeFields)) {
        const existing = await this._read();
        return this._write(applyPatch(existing || {}, data));
      }
      return this._write(encode(stripSentinels(data)));
    }
    async update(data) {
      const existing = await this._read();
      if (existing == null) throw new Error(`No document to update: ${this.path}`);
      return this._write(applyPatch(existing, data));
    }
    async delete() {
      const { error } = await client.from(DOCS_TABLE).delete().eq('path', this.path);
      if (error) throw sbError(error);
      notifyLocal(DOCS_TABLE, this.path);
    }
    onSnapshot(next, onError) {
      if (typeof next === 'object' && next) { onError = next.error; next = next.next; }
      let active = true;
      const refresh = async () => {
        try { const snap = await this.get(); if (active) next(snap); }
        catch (e) { if (onError) onError(e); else console.warn('[MokzaDB] snapshot error:', e.message); }
      };
      const unsub = subscribeTable(DOCS_TABLE, { matches: (p) => p === this.path, refresh });
      refresh();
      return () => { active = false; unsub(); };
    }
  }

  class Firestore {
    collection(path) { return new CollectionReference(path); }
    doc(path) { return new DocumentReference(path); }
    batch() {
      const ops = [];
      return {
        set: (ref, data, opts) => { ops.push(() => ref.set(data, opts)); },
        update: (ref, data) => { ops.push(() => ref.update(data)); },
        delete: (ref) => { ops.push(() => ref.delete()); },
        commit: async () => { for (const op of ops) await op(); },
      };
    }
  }
  const firestore = new Firestore();

  /* ══ Auth ════════════════════════════════════════════════════ */
  class GoogleAuthProvider { constructor() { this.providerId = 'google.com'; } }
  class DiscordAuthProvider { constructor() { this.providerId = 'discord.com'; } }
  const PENDING_NAME_KEY = 'mokza_pending_display_name';

  function toUser(u) {
    if (!u) return null;
    const meta = u.user_metadata || {};
    const user = {
      uid: u.id,
      email: u.email || null,
      displayName: meta.display_name || meta.full_name || meta.name || meta.user_name || null,
      photoURL: meta.avatar_url || meta.picture || null,
      emailVerified: !!u.email_confirmed_at,
      providerData: (u.identities || []).map((i) => ({ providerId: i.provider, uid: i.id })),
      metadata: { creationTime: u.created_at, lastSignInTime: u.last_sign_in_at },
      updateProfile: (profile) => auth.updateProfile(profile),
      getIdToken: async () => (await client.auth.getSession()).data.session?.access_token || null,
    };
    return user;
  }

  const auth = {
    currentUser: null,
    _ready: null,
    onAuthStateChanged(cb) {
      let lastKey;
      const emit = (user) => {
        const key = user ? `${user.uid}|${user.displayName}|${user.photoURL}` : null;
        if (key === lastKey) return;
        lastKey = key;
        try { cb(user); } catch (e) { console.error(e); }
      };
      this._ready.then(() => emit(this.currentUser));
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        this.currentUser = toUser(session?.user);
        setTimeout(() => emit(this.currentUser), 0);
      });
      return () => data.subscription.unsubscribe();
    },
    async signInWithPopup(provider) {
      const p = provider?.providerId === 'discord.com' ? 'discord' : 'google';
      const { error } = await client.auth.signInWithOAuth({ provider: p, options: { redirectTo: window.location.href } });
      if (error) throw sbError(error);
      return new Promise(() => {}); // browser redirects to the provider
    },
    signInWithRedirect(provider) { return this.signInWithPopup(provider); },
    signInWithDiscord() { return this.signInWithPopup(new DiscordAuthProvider()); },
    async signInWithEmailAndPassword(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw sbError(error);
      this.currentUser = toUser(data.user);
      await this._applyPendingName();
      return { user: this.currentUser };
    },
    async createUserWithEmailAndPassword(email, password) {
      const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } });
      if (error) throw sbError(error);
      if (data.session) this.currentUser = toUser(data.user);
      return { user: toUser(data.user), needsEmailConfirmation: !data.session };
    },
    async sendPasswordResetEmail(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
      if (error) throw sbError(error);
    },
    async updateProfile(profile = {}) {
      const patch = {};
      if (profile.displayName !== undefined) { patch.display_name = profile.displayName; patch.full_name = profile.displayName; }
      if (profile.photoURL !== undefined) patch.avatar_url = profile.photoURL;
      const { data: s } = await client.auth.getSession();
      if (!s.session) {
        if (profile.displayName) localStorage.setItem(PENDING_NAME_KEY, profile.displayName);
        return;
      }
      const { data, error } = await client.auth.updateUser({ data: patch });
      if (error) throw sbError(error);
      this.currentUser = toUser(data.user);
    },
    async _applyPendingName() {
      const name = localStorage.getItem(PENDING_NAME_KEY);
      if (!name || !this.currentUser || this.currentUser.displayName) return;
      localStorage.removeItem(PENDING_NAME_KEY);
      await this.updateProfile({ displayName: name });
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw sbError(error);
      this.currentUser = null;
    },
  };
  auth._ready = client.auth.getSession().then(({ data }) => {
    auth.currentUser = toUser(data.session?.user);
    return auth._applyPendingName().catch(() => {});
  });

  /* ══ Storage ═════════════════════════════════════════════════ */
  function storageRef(path) {
    path = normPath(path || '');
    const bucket = () => client.storage.from(BUCKET);
    const ref = {
      fullPath: path,
      name: path.split('/').pop(),
      child: (p) => storageRef(normPath(path, p)),
      async getDownloadURL() { return bucket().getPublicUrl(path).data.publicUrl; },
      async delete() {
        const { error } = await bucket().remove([path]);
        if (error) throw sbError(error);
      },
      put(file, metadata) {
        const handlers = [];
        const total = file?.size || 0;
        const promise = (async () => {
          handlers.forEach((h) => h.next && h.next({ bytesTransferred: 0, totalBytes: total, state: 'running', ref }));
          const { error } = await bucket().upload(path, file, {
            upsert: true,
            contentType: metadata?.contentType || file?.type || 'application/octet-stream',
          });
          if (error) {
            const err = sbError(error);
            handlers.forEach((h) => h.error && h.error(err));
            throw err;
          }
          const snap = { bytesTransferred: total, totalBytes: total, state: 'success', ref };
          handlers.forEach((h) => { h.next && h.next(snap); h.complete && h.complete(); });
          return snap;
        })();
        return {
          on(_event, next, error, complete) {
            if (typeof next === 'object' && next) handlers.push(next);
            else handlers.push({ next, error, complete });
            return () => {};
          },
          then: (a, b) => promise.then(a, b),
          catch: (b) => promise.catch(b),
          snapshot: { ref },
        };
      },
    };
    return ref;
  }
  const storage = { ref: storageRef };

  /* ══ Realtime-Database-compatible API (tree stored as path rows) ═ */
  const RTDB_SERVER_TS = { '.sv': 'timestamp' };
  function rtdbEncode(v) {
    if (v === RTDB_SERVER_TS || (v && v['.sv'] === 'timestamp')) return Date.now();
    if (Array.isArray(v)) return v.map(rtdbEncode);
    if (v && typeof v === 'object') {
      const out = {};
      for (const [k, val] of Object.entries(v)) if (val !== undefined) out[k] = rtdbEncode(val);
      return out;
    }
    return v === undefined ? null : v;
  }
  function ancestorsOf(path) {
    const segs = path.split('/');
    const out = [];
    for (let i = 1; i < segs.length; i++) out.push(segs.slice(0, i).join('/'));
    return out;
  }
  function setIn(obj, rel, value) {
    if (!rel.length) return value;
    const root = obj && typeof obj === 'object' ? { ...obj } : {};
    let cur = root;
    for (let i = 0; i < rel.length - 1; i++) {
      cur[rel[i]] = cur[rel[i]] && typeof cur[rel[i]] === 'object' ? { ...cur[rel[i]] } : {};
      cur = cur[rel[i]];
    }
    if (value === null) delete cur[rel[rel.length - 1]];
    else cur[rel[rel.length - 1]] = value;
    return root;
  }
  const isEmptyVal = (v) => v === null || v === undefined || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

  async function rtdbRead(path) {
    const anc = ancestorsOf(path);
    const [own, desc] = await Promise.all([
      client.from(RTDB_TABLE).select('path,value').in('path', [...anc, path]),
      client.from(RTDB_TABLE).select('path,value').like('path', path.replace(/[%\\]/g, '\\$&') + '/%'),
    ]);
    if (own.error) throw sbError(own.error);
    if (desc.error) throw sbError(desc.error);
    const rows = [...(own.data || []), ...(desc.data || []).filter((r) => r.path.startsWith(path + '/'))];
    rows.sort((a, b) => a.path.split('/').length - b.path.split('/').length);
    let result = null;
    for (const r of rows) {
      if (r.path === path || r.path.startsWith(path + '/')) {
        const rel = r.path === path ? [] : r.path.slice(path.length + 1).split('/');
        result = setIn(result, rel, r.value);
      } else {
        const rel = path.slice(r.path.length + 1).split('/');
        const sub = rel.reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), r.value);
        result = sub === undefined ? null : sub;
      }
    }
    return isEmptyVal(result) ? null : result;
  }
  async function rtdbWrite(path, value) {
    value = rtdbEncode(value);
    const del = await client.from(RTDB_TABLE).delete().like('path', path.replace(/[%\\]/g, '\\$&') + '/%');
    if (del.error) throw sbError(del.error);
    const anc = ancestorsOf(path);
    let needTombstone = false;
    if (value === null && anc.length) {
      const { data, error } = await client.from(RTDB_TABLE).select('path').in('path', anc).limit(1);
      if (error) throw sbError(error);
      needTombstone = (data || []).length > 0;
    }
    if (value === null && !needTombstone) {
      const { error } = await client.from(RTDB_TABLE).delete().eq('path', path);
      if (error) throw sbError(error);
    } else {
      const { error } = await client.from(RTDB_TABLE).upsert(
        { path, value, updated_at: new Date().toISOString() },
        { onConflict: 'path' }
      );
      if (error) throw sbError(error);
    }
    notifyLocal(RTDB_TABLE, path);
  }
  function rtdbSnapshot(ref, val) {
    return { key: ref.key, ref, exists: () => val !== null, val: () => val, toJSON: () => val,
      forEach(cb) { if (val && typeof val === 'object') Object.keys(val).forEach((k) => cb(rtdbSnapshot(ref.child(k), val[k]))); } };
  }
  function rtdbRef(path) {
    path = normPath(path || '');
    return { path, key: path.split('/').pop() || null, child: (p) => rtdbRef(normPath(path, p)), toString: () => path };
  }
  const rtdbHandles = new Map(); // path -> Set(unsubscribe)
  const rtdb = {
    db: { type: 'mokza-rtdb' },
    ref: (_db, path) => rtdbRef(path),
    child: (ref, p) => ref.child(p),
    serverTimestamp: () => RTDB_SERVER_TS,
    async get(ref) { return rtdbSnapshot(ref, await rtdbRead(ref.path)); },
    set: (ref, value) => rtdbWrite(ref.path, value),
    remove: (ref) => rtdbWrite(ref.path, null),
    async update(ref, values) {
      for (const [k, v] of Object.entries(values)) await rtdbWrite(normPath(ref.path, k), v);
    },
    push(ref, value) {
      const child = ref.child('-' + Date.now().toString(36) + autoId(8));
      const p = value !== undefined ? rtdbWrite(child.path, value) : Promise.resolve();
      return Object.assign(child, { then: (a, b) => p.then(() => (a ? a(rtdbRef(child.path)) : rtdbRef(child.path)), b) });
    },
    onValue(ref, cb, onError) {
      let active = true;
      const refresh = async () => {
        try { const v = await rtdbRead(ref.path); if (active) cb(rtdbSnapshot(ref, v)); }
        catch (e) { if (onError) onError(e); else console.warn('[MokzaDB] rtdb error:', e.message); }
      };
      const p = ref.path;
      const stop = subscribeTable(RTDB_TABLE, {
        matches: (q) => q === p || q.startsWith(p + '/') || p.startsWith(q + '/'),
        refresh,
      });
      refresh();
      const unsub = () => { active = false; stop(); rtdbHandles.get(p)?.delete(unsub); };
      if (!rtdbHandles.has(p)) rtdbHandles.set(p, new Set());
      rtdbHandles.get(p).add(unsub);
      return unsub;
    },
    off(refOrUnsub) {
      if (typeof refOrUnsub === 'function') return refOrUnsub();
      const set = rtdbHandles.get(refOrUnsub?.path);
      if (set) [...set].forEach((u) => u());
    },
  };

  /* ══ Modular (v9+) style helpers ═════════════════════════════ */
  function modDocSnap(snap) {
    return { id: snap.id, ref: snap.ref, metadata: snap.metadata, exists: () => snap.exists, data: () => snap.data(), get: (f) => snap.get(f) };
  }
  function modQuerySnap(qs) {
    const docs = qs.docs.map(modDocSnap);
    return { docs, size: docs.length, empty: !docs.length, metadata: qs.metadata, forEach: (cb) => docs.forEach(cb),
      docChanges: () => qs.docChanges().map((c) => ({ ...c, doc: modDocSnap(c.doc) })) };
  }
  const refPath = (base) => (base && base.path) || '';
  const modular = {
    getFirestore: () => firestore,
    getAuth: () => auth,
    getStorage: () => storage,
    collection: (base, ...segs) => new CollectionReference(normPath(refPath(base), ...segs)),
    doc: (base, ...segs) => {
      if (base instanceof CollectionReference && !segs.length) return base.doc();
      return new DocumentReference(normPath(refPath(base), ...segs));
    },
    query: (q, ...constraints) => constraints.reduce((acc, c) => c(acc), q),
    where: (f, op, v) => (q) => q.where(f, op, v),
    orderBy: (f, dir) => (q) => q.orderBy(f, dir),
    limit: (n) => (q) => q.limit(n),
    limitToLast: (n) => (q) => q.limitToLast(n),
    addDoc: (col, data) => col.add(data),
    setDoc: (ref, data, opts) => ref.set(data, opts),
    updateDoc: (ref, data) => ref.update(data),
    deleteDoc: (ref) => ref.delete(),
    getDoc: async (ref) => modDocSnap(await ref.get()),
    getDocs: async (q) => modQuerySnap(await q.get()),
    onSnapshot: (ref, next, onError) => {
      if (typeof next === 'object' && next) { onError = next.error; next = next.next; }
      return ref.onSnapshot((s) => next(ref instanceof DocumentReference ? modDocSnap(s) : modQuerySnap(s)), onError);
    },
    writeBatch: () => firestore.batch(),
    serverTimestamp: () => SERVER_TS,
    deleteField: () => DELETE_FIELD,
    increment, arrayUnion, arrayRemove, Timestamp,
    GoogleAuthProvider, DiscordAuthProvider,
    onAuthStateChanged: (a, cb) => a.onAuthStateChanged(cb),
    signInWithPopup: (a, provider) => a.signInWithPopup(provider),
    signInWithRedirect: (a, provider) => a.signInWithPopup(provider),
    signInWithEmailAndPassword: (a, e, p) => a.signInWithEmailAndPassword(e, p),
    createUserWithEmailAndPassword: (a, e, p) => a.createUserWithEmailAndPassword(e, p),
    sendPasswordResetEmail: (a, e) => a.sendPasswordResetEmail(e),
    updateProfile: (_user, profile) => auth.updateProfile(profile),
    signOut: (a) => a.signOut(),
  };

  window.MokzaDB = {
    client,
    auth: () => auth,
    firestore: () => firestore,
    storage: () => storage,
    rtdb,
    modular,
    Timestamp,
    GoogleAuthProvider,
    DiscordAuthProvider,
    FieldValue: { serverTimestamp: () => SERVER_TS, delete: () => DELETE_FIELD, increment, arrayUnion, arrayRemove },
    serverTimestamp: () => SERVER_TS,
  };
  console.log('[MokzaDB] Supabase workspace layer ready');
})();
