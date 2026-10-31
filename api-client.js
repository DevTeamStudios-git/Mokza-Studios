/**
 * Mokza Studios API Client
 * 
 * Provides a drop-in replacement for the previous client-side Firebase/Supabase calls.
 * All requests go through the Express backend at /api/, which uses the Supabase
 * service role key securely on the server.
 * 
 * Exports:
 *   window.__firestoreOps  — { save, load, subscribe } (compatible with existing code)
 *   window.api             — { get, post, patch, del } helper
 */

const API_BASE = '/api';

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${errText}`);
  }
  return res.json();
}

// ═════════════════════════════════════════════════════════════════════════════
// window.__firestoreOps — compatible with existing frontend code
// ═════════════════════════════════════════════════════════════════════════════

let _subscribers = [];
let _subscriptionInterval = null;

function notifySubscribers(data) {
  _subscribers.forEach((cb) => {
    try { cb(data); } catch (_) {}
  });
}

async function startPolling() {
  if (_subscriptionInterval) return;
  _subscriptionInterval = setInterval(async () => {
    try {
      const { state } = await apiRequest('/website-state');
      if (state) notifySubscribers(state);
    } catch (_) {}
  }, 5000);
}

function stopPolling() {
  if (_subscriptionInterval) {
    clearInterval(_subscriptionInterval);
    _subscriptionInterval = null;
  }
}

window.__firestoreOps = {
  /**
   * Save the full website state payload.
   * @param {Object} data — full state object
   */
  save: async (data) => {
    return apiRequest('/website-state/save', {
      method: 'POST',
      body: { data },
    });
  },

  /**
   * Load the full website state.
   * @returns {Promise<Object|null>}
   */
  load: async () => {
    const { state } = await apiRequest('/website-state');
    return state || null;
  },

  /**
   * Subscribe to real-time state changes (polls every 5s).
   * @param {Function} callback — called with new state data
   * @returns {Function} unsubscribe
   */
  subscribe: (callback) => {
    _subscribers.push(callback);
    startPolling();
    return () => {
      _subscribers = _subscribers.filter((cb) => cb !== callback);
      if (_subscribers.length === 0) stopPolling();
    };
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// window.api — generic helper for other endpoints
// ═════════════════════════════════════════════════════════════════════════════

window.api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  del: (path) => apiRequest(path, { method: 'DELETE' }),
};

console.log('[Mokza API] Client initialized — routing through /api');
