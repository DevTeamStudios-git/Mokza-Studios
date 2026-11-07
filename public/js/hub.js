/* ── OFFICE HUB v2 ─────────────────────────────────────────────────────────────
   Redesigned shell + DevTBot control panels (CoOwner/Owner only).
   Loaded after app.js: it re-uses app.js render functions for tasks, chat, voice,
   activity, toolbox and analytics, and replaces openOfficeHub / switchHubView.
   Bot data flows:  bot → Supabase (bot_data) → /api/bot/data → this file
                    this file → /api/bot/commands → Supabase (bot_commands) → bot
---------------------------------------------------------------------------- */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return (typeof escHtml === 'function') ? escHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var toast = function (t, m, k) { if (typeof showNotification === 'function') showNotification(t, m || '', k || 'info'); };

  var ICON = {
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    check: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    pulse: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    bot: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/><circle cx="8.5" cy="14" r="1"/><circle cx="15.5" cy="14" r="1"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v3h20v-3a3 3 0 0 1 0-6V6H2z"/>',
    gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>',
    poll: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8L7 17M17 7l2.8-2.8"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>'
  };
  function ic(n, s) { return '<svg width="' + (s || 16) + '" height="' + (s || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[n] + '</svg>'; }

  /* ── navigation model ── */
  var NAV = [
    { group: 'Workspace', items: [
      { id: 'dashboard', label: 'Overview', icon: 'grid' },
      { id: 'tasks', label: 'Tasks', icon: 'check' },
      { id: 'chat', label: 'Team Chat', icon: 'chat' },
      { id: 'activity', label: 'Activity', icon: 'pulse' }
    ] },
    { group: 'DevTBot Control', bot: true, items: [
      { id: 'bot-overview', label: 'Bot Overview', icon: 'bot' },
      { id: 'bot-mod', label: 'Moderation', icon: 'shield' },
      { id: 'bot-cases', label: 'Cases & Appeals', icon: 'file' },
      { id: 'bot-automod', label: 'Auto-Mod', icon: 'filter' },
      { id: 'bot-antiraid', label: 'Anti-Raid', icon: 'alert' },
      { id: 'bot-tickets', label: 'Tickets', icon: 'ticket' },
      { id: 'bot-giveaways', label: 'Giveaways', icon: 'gift' },
      { id: 'bot-polls', label: 'Polls', icon: 'poll' },
      { id: 'bot-leveling', label: 'Leveling', icon: 'star' },
      { id: 'bot-rr', label: 'Reaction Roles', icon: 'smile' },
      { id: 'bot-sched', label: 'Scheduler', icon: 'clock' },
      { id: 'bot-music', label: 'Music & Voice', icon: 'music' },
      { id: 'bot-settings', label: 'Bot Settings', icon: 'cog' },
      { id: 'bot-cmds', label: 'Command Reference', icon: 'book' }
    ] },
    { group: 'Tools', items: [
      { id: 'toolbox', label: 'Toolbox', icon: 'tool' },
      { id: 'bots', label: 'Chat Commands', icon: 'bot' },
      { id: 'analytics', label: 'Analytics', icon: 'poll' }
    ] }
  ];
  var LEGACY = { dashboard: 'renderHubDash', activity: 'renderHubAct', tasks: 'renderHubTasks', chat: 'renderHubChat', toolbox: 'renderHubToolbox', bots: 'renderHubBots', analytics: 'renderHubAnalytics' };

  function myRank() { var u = state.accountUser || state.currentUser; return (u && u.rank) || ''; }
  function isBotAdmin() { var r = myRank(); return r === 'CoOwner' || r === 'Owner'; }
  function visibleNav() { return NAV.filter(function (g) { return !g.bot || isBotAdmin(); }); }
  function labelOf(id) { var l = id; NAV.forEach(function (g) { g.items.forEach(function (i) { if (i.id === id) l = i.label; }); }); return l; }

  /* ── bot client ── */
  var Bot = { guild: null, status: null, online: false, data: {}, cmds: [], view: null, timer: null, err: null, busy: false };

  function token() { return state.sessionToken || ''; }
  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() };
    return fetch('/api' + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return { success: false, error: 'HTTP ' + r.status }; }); });
  }

  var KINDS_FOR = {
    'bot-overview': ['overview', 'music', 'tickets', 'giveaways', 'polls', 'warns'],
    'bot-mod': ['discord', 'warns', 'overview'],
    'bot-cases': ['cases', 'appeals'],
    'bot-automod': ['automod'],
    'bot-antiraid': ['antiraid', 'overview'],
    'bot-tickets': ['tickets'],
    'bot-giveaways': ['giveaways'],
    'bot-polls': ['polls'],
    'bot-leveling': ['leveling'],
    'bot-rr': ['reaction_roles', 'discord'],
    'bot-sched': ['scheduled'],
    'bot-music': ['music', 'discord'],
    'bot-settings': ['settings', 'discord']
  };

  function loadStatus() {
    return api('/bot/status').then(function (r) {
      if (!r.success) { Bot.err = r.error || 'Could not reach the bot bridge'; Bot.online = false; return; }
      Bot.err = null; Bot.online = !!r.online; Bot.status = r.status; Bot.updatedAt = r.updatedAt;
      if (r.status && r.status.guilds && r.status.guilds.length && !r.status.guilds.some(function (g) { return g.id === Bot.guild; })) Bot.guild = r.status.guilds[0].id;
    }).catch(function (e) { Bot.err = e.message; });
  }
  function loadData(kinds) {
    if (!Bot.guild) return Promise.resolve();
    return api('/bot/data?guild=' + Bot.guild + '&kind=' + kinds.join(',')).then(function (r) {
      if (r.success) Object.keys(r.data).forEach(function (k) { Bot.data[Bot.guild + ':' + k] = r.data[k]; });
    });
  }
  function D(kind, dflt) { var e = Bot.data[Bot.guild + ':' + kind]; return e ? e.data : dflt; }

  function refreshBot(force) {
    if (!isBotAdmin() || !Bot.view) return;
    loadStatus().then(function () { return loadData(KINDS_FOR[Bot.view] || ['overview']); }).then(function () { if (Bot.view) renderBot(); });
  }
  function startPolling() { stopPolling(); Bot.timer = setInterval(function () { if (Bot.view && !document.hidden && !document.querySelector('.hubx-modal')) refreshBot(); }, 12000); }
  function stopPolling() { if (Bot.timer) clearInterval(Bot.timer); Bot.timer = null; }

  /* queue an action, then wait for the bot to report the result */
  function act(action, payload, opts) {
    opts = opts || {};
    if (!Bot.online) { toast('Bot offline', 'DevTBot is not connected right now, the action was not queued.', 'error'); return Promise.resolve(false); }
    if (action !== 'set_status' && !Bot.guild) { toast('No server', 'Pick a server first', 'error'); return Promise.resolve(false); }
    return api('/bot/commands', { method: 'POST', body: { action: action, guild_id: Bot.guild, payload: payload || {} } }).then(function (r) {
      if (!r.success) { toast('Could not queue', r.error || '', 'error'); return false; }
      toast('Queued', labelAction(action) + ' sent to DevTBot…', 'info');
      return waitFor(r.id).then(function (c) {
        if (!c) { toast('Still waiting', 'The bot has not answered yet. Check the history in Bot Overview.', 'info'); return false; }
        var ok = c.status === 'done';
        toast(ok ? 'Done' : 'Failed', (c.result && c.result.message) || '', ok ? 'success' : 'error');
        refreshBot();
        return ok;
      });
    }).catch(function (e) { toast('Error', e.message, 'error'); return false; });
  }
  function waitFor(id) {
    return new Promise(function (resolve) {
      var tries = 0;
      (function poll() {
        api('/bot/commands?id=' + id).then(function (r) {
          var c = r.commands && r.commands[0];
          if (c && (c.status === 'done' || c.status === 'failed')) return resolve(c);
          if (++tries > 20) return resolve(null);
          setTimeout(poll, 1500);
        }).catch(function () { if (++tries > 20) resolve(null); else setTimeout(poll, 2000); });
      })();
    });
  }
  function labelAction(a) { return a.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }); }

  /* ── small UI helpers ── */
  function card(title, body, extra) { return '<section class="hubx-card"><header><h3>' + title + '</h3>' + (extra || '') + '</header><div class="hubx-card-body">' + body + '</div></section>'; }
  function stat(label, value, sub) { return '<div class="hubx-stat"><div class="hubx-stat-v">' + esc(value) + '</div><div class="hubx-stat-l">' + esc(label) + '</div>' + (sub ? '<div class="hubx-stat-s">' + esc(sub) + '</div>' : '') + '</div>'; }
  function empty(t) { return '<div class="hubx-empty">' + esc(t) + '</div>'; }
  function table(cols, rows, emptyText) {
    if (!rows.length) return empty(emptyText || 'Nothing here yet');
    return '<div class="hubx-table-wrap"><table class="hubx-table"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function btn(label, onclick, kind) { return '<button class="hubx-btn ' + (kind || '') + '" onclick="' + onclick + '">' + label + '</button>'; }
  function pill(t, kind) { return '<span class="hubx-pill ' + (kind || '') + '">' + esc(t) + '</span>'; }
  function ago(iso) {
    if (!iso) return '—';
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return Math.floor(s) + 's ago'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  function dur(sec) { var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60); return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + m + 'm'; }
  function chanOptions(types) {
    var ch = (D('discord', { channels: [] }).channels || []).filter(function (c) { return !types || types.indexOf(c.type) >= 0; });
    return ch.map(function (c) { return '<option value="' + esc(c.id) + '">#' + esc(c.name) + '</option>'; }).join('');
  }
  var TEXT = ['text', 'news'];

  /* modal form → resolves with an object or null */
  function form(title, fields, submitLabel, danger) {
    return new Promise(function (resolve) {
      var wrap = document.createElement('div');
      wrap.className = 'hubx-modal';
      wrap.innerHTML = '<div class="hubx-dialog" role="dialog" aria-modal="true"><h3>' + esc(title) + '</h3><form>' +
        fields.map(function (f, i) {
          var inp;
          if (f.type === 'select') inp = '<select name="' + f.name + '">' + f.options + '</select>';
          else if (f.type === 'textarea') inp = '<textarea name="' + f.name + '" rows="4" placeholder="' + esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea>';
          else if (f.type === 'checkbox') inp = '<label class="hubx-check"><input type="checkbox" name="' + f.name + '"' + (f.value ? ' checked' : '') + '> ' + esc(f.checkLabel || '') + '</label>';
          else inp = '<input name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + esc(f.value == null ? '' : f.value) + '" placeholder="' + esc(f.placeholder || '') + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + '>';
          return '<label class="hubx-field"><span>' + esc(f.label) + '</span>' + inp + '</label>';
        }).join('') +
        '<div class="hubx-dialog-actions"><button type="button" class="hubx-btn" data-x="1">Cancel</button><button type="submit" class="hubx-btn ' + (danger ? 'danger' : 'primary') + '">' + esc(submitLabel || 'Confirm') + '</button></div></form></div>';
      document.body.appendChild(wrap);
      var fm = wrap.querySelector('form');
      var first = fm.querySelector('input,select,textarea'); if (first) first.focus();
      function close(v) { document.removeEventListener('keydown', onKey); wrap.remove(); resolve(v); }
      function onKey(e) { if (e.key === 'Escape') close(null); }
      document.addEventListener('keydown', onKey);
      wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(null); });
      wrap.querySelector('[data-x]').onclick = function () { close(null); };
      fm.onsubmit = function (e) {
        e.preventDefault();
        var out = {};
        fields.forEach(function (f) { var el = fm.elements[f.name]; out[f.name] = f.type === 'checkbox' ? el.checked : el.value.trim(); });
        close(out);
      };
    });
  }
  var F = {
    user: { name: 'user_id', label: 'User ID', placeholder: 'e.g. 123456789012345678' },
    reason: { name: 'reason', label: 'Reason', placeholder: 'Optional' }
  };
  function withUser(base, uid) { var f = Object.assign({}, base); if (uid) f.value = uid; return f; }

  /* ── public actions called from markup ── */
  var H = window.HubBot = {
    go: function (id) { hubGo(id); },
    refresh: function () { refreshBot(true); toast('Refreshing…', '', 'info'); },
    guild: function (id) { Bot.guild = id; Bot.data = {}; refreshBot(); },
    warn: function (uid) { form('Warn member', [withUser(F.user, uid), F.reason], 'Warn').then(function (v) { if (v) act('warn', v); }); },
    timeout: function (uid) { form('Timeout member', [withUser(F.user, uid), { name: 'minutes', label: 'Duration (minutes)', type: 'number', value: 10, min: 1, max: 40320 }, F.reason], 'Timeout').then(function (v) { if (v) act('timeout', v); }); },
    untimeout: function () { form('Remove timeout', [F.user], 'Remove').then(function (v) { if (v) act('untimeout', v); }); },
    kick: function (uid) { form('Kick member', [withUser(F.user, uid), F.reason], 'Kick', true).then(function (v) { if (v) act('kick', v); }); },
    ban: function (uid) { form('Ban user', [withUser(F.user, uid), { name: 'delete_days', label: 'Delete messages from the last (days, 0-7)', type: 'number', value: 0, min: 0, max: 7 }, F.reason], 'Ban', true).then(function (v) { if (v) act('ban', v); }); },
    unban: function () { form('Unban user', [F.user, F.reason], 'Unban').then(function (v) { if (v) act('unban', v); }); },
    clearwarns: function (uid) {
      if (uid) { if (confirm('Clear all warnings for this member?')) act('clearwarns', { user_id: uid }); return; }
      form('Clear warnings', [F.user], 'Clear', true).then(function (v) { if (v) act('clearwarns', v); });
    },
    lockdown: function (on) { if (confirm(on ? 'Lock every text channel for @everyone?' : 'Lift the server lockdown?')) act('lockdown', { on: on }); },
    lockChannel: function (on) { form(on ? 'Lock channel' : 'Unlock channel', [{ name: 'channel_id', label: 'Channel', type: 'select', options: chanOptions(TEXT) }], on ? 'Lock' : 'Unlock').then(function (v) { if (v) act('lock_channel', { channel_id: v.channel_id, on: on }); }); },
    slowmode: function () { form('Slowmode', [{ name: 'channel_id', label: 'Channel', type: 'select', options: chanOptions(TEXT) }, { name: 'seconds', label: 'Seconds (0 turns it off)', type: 'number', value: 5, min: 0, max: 21600 }], 'Apply').then(function (v) { if (v) act('slowmode', v); }); },
    purge: function () { form('Purge messages', [{ name: 'channel_id', label: 'Channel', type: 'select', options: chanOptions(TEXT) }, { name: 'count', label: 'How many (1-100)', type: 'number', value: 10, min: 1, max: 100 }], 'Delete', true).then(function (v) { if (v) act('purge', v); }); },
    announce: function () { form('Send announcement', [{ name: 'channel_id', label: 'Channel', type: 'select', options: chanOptions(TEXT) }, { name: 'message', label: 'Message', type: 'textarea' }], 'Send').then(function (v) { if (v) act('announce', v); }); },
    caseNote: function (id) { form('Note on case #' + id, [{ name: 'note', label: 'Note', type: 'textarea' }], 'Save').then(function (v) { if (v) act('case_note', { case_id: id, note: v.note }); }); },
    caseExpunge: function (id) { if (confirm('Expunge case #' + id + '? It will be hidden from the member\'s record.')) act('case_expunge', { case_id: id }); },
    automod: function (on) { act('automod_toggle', { on: on }); },
    wordAdd: function () { form('Blacklist a word', [{ name: 'word', label: 'Word or phrase' }], 'Add').then(function (v) { if (v) act('blacklist_add', v); }); },
    wordRemove: function (w) { act('blacklist_remove', { word: w }); },
    raid: function () {
      var c = D('antiraid', {});
      form('Anti-raid settings', [{ name: 'enabled', label: 'Protection', type: 'checkbox', checkLabel: 'Enabled', value: c.enabled !== false }, { name: 'threshold', label: 'Joins that trigger it', type: 'number', value: c.threshold || 10, min: 2, max: 100 }, { name: 'window', label: 'Within (seconds)', type: 'number', value: c.window || 10, min: 3, max: 300 }], 'Save').then(function (v) { if (v) act('antiraid_config', v); });
    },
    ticketClose: function (id) { if (confirm('Close and delete this ticket channel?')) act('ticket_close', { channel_id: id }); },
    gEnd: function (id) { if (confirm('End this giveaway now and draw winners?')) act('giveaway_end', { message_id: id }); },
    gReroll: function (id) { act('giveaway_reroll', { message_id: id }); },
    pollEnd: function (id) { if (confirm('End this poll now?')) act('poll_end', { message_id: id }); },
    status: function () { form('Bot status text', [{ name: 'text', label: 'Playing…', placeholder: 'e.g. /help | dev-team.studio' }], 'Update').then(function (v) { if (v) act('set_status', v); }); },
    music: function (a) { act('music_' + a, {}); },
    resync: function () { act('resync', {}); },
    copy: function (t) { try { navigator.clipboard.writeText(t); toast('Copied', t, 'success'); } catch (e) { } }
  };

  /* ── bot views ── */
  function noBot() {
    return card('DevTBot is not connected', '<p class="hubx-muted">' + (Bot.err ? esc(Bot.err) + '. ' : '') + 'The bot syncs through Supabase every few seconds once its <code>site_bridge</code> module is running with <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> set.</p>' + btn('Retry', 'HubBot.refresh()', 'primary'));
  }
  function guildBar() {
    var gs = (Bot.status && Bot.status.guilds) || [];
    var chip = '<span class="hubx-pill ' + (Bot.online ? 'ok' : 'bad') + '">' + (Bot.online ? 'Online' : 'Offline') + '</span>';
    var sel = gs.length > 1 ? '<select class="hubx-select" onchange="HubBot.guild(this.value)">' + gs.map(function (g) { return '<option value="' + g.id + '"' + (g.id === Bot.guild ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select>' : (gs[0] ? '<strong>' + esc(gs[0].name) + '</strong>' : '');
    return '<div class="hubx-guildbar">' + chip + sel + '<span class="hubx-muted small">' + (Bot.updatedAt ? 'heartbeat ' + ago(Bot.updatedAt) : '') + '</span><span class="grow"></span>' + btn('Refresh', 'HubBot.refresh()') + '</div>';
  }
  function head(title, sub) { return '<div class="hubx-head"><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>'; }
  function mem(uid, name) { return '<button class="hubx-link" onclick="HubBot.copy(\'' + esc(uid) + '\')" title="Copy ID">' + esc(name || uid) + '</button>'; }

  var BOT_VIEWS = {
    'bot-overview': function () {
      var s = Bot.status || {}, o = D('overview', {}), m = D('music', {});
      var warns = D('warns', []), gw = D('giveaways', []).filter(function (g) { return !g.ended; }), pl = D('polls', []).filter(function (p) { return !p.ended; });
      var tk = (D('tickets', { open: [] }).open || []);
      var out = head('Bot Overview', 'Live status mirrored from DevTBot');
      out += '<div class="hubx-stats">' + stat('Latency', (s.latency_ms || 0) + ' ms') + stat('Uptime', dur(s.uptime_seconds || 0)) + stat('Servers', (s.guilds || []).length) + stat('Modules', s.cogs || 0, s.firebase_ok ? 'Database OK' : 'Database offline') + stat('Members', o.members || '—', o.name) + stat('Open tickets', tk.length) + stat('Active giveaways', gw.length) + stat('Active polls', pl.length) + '</div>';
      if (s.failed_cogs && s.failed_cogs.length) out += card('Modules that failed to load', '<ul class="hubx-list">' + s.failed_cogs.map(function (f) { return '<li>' + esc(Array.isArray(f) ? f[0] + ': ' + f[1] : f) + '</li>'; }).join('') + '</ul>');
      out += card('Quick actions', '<div class="hubx-actions">' + btn('Set status', 'HubBot.status()') + btn('Announce', 'HubBot.announce()') + btn('Lock server', 'HubBot.lockdown(true)', 'danger') + btn('Lift lockdown', 'HubBot.lockdown(false)') + btn('Force data refresh', 'HubBot.resync()') + '</div>');
      out += card('Most warned members', table(['Member', 'Warnings'], warns.slice(0, 5).map(function (w) { return [mem(w.user_id, w.user), String(w.count)]; }), 'No warnings recorded'));
      out += '<div id="hubxHistory"></div>';
      setTimeout(loadHistory, 0);
      return out;
    },
    'bot-mod': function () {
      var warns = D('warns', []);
      var out = head('Moderation', 'Act on members and channels. Every action is logged as a case.');
      out += '<div class="hubx-grid2">' +
        card('Members', '<div class="hubx-actions">' + btn('Warn', 'HubBot.warn()') + btn('Timeout', 'HubBot.timeout()') + btn('Remove timeout', 'HubBot.untimeout()') + btn('Kick', 'HubBot.kick()', 'danger') + btn('Ban', 'HubBot.ban()', 'danger') + btn('Unban', 'HubBot.unban()') + btn('Clear warnings', 'HubBot.clearwarns()') + '</div><p class="hubx-muted small">Tip: click a name in any table to copy that member\'s ID.</p>') +
        card('Channels', '<div class="hubx-actions">' + btn('Lock channel', 'HubBot.lockChannel(true)') + btn('Unlock channel', 'HubBot.lockChannel(false)') + btn('Slowmode', 'HubBot.slowmode()') + btn('Purge messages', 'HubBot.purge()', 'danger') + btn('Announce', 'HubBot.announce()') + '</div><div class="hubx-actions" style="margin-top:.6rem">' + btn('Lock whole server', 'HubBot.lockdown(true)', 'danger') + btn('Lift lockdown', 'HubBot.lockdown(false)') + '</div>') + '</div>';
      out += card('Members with warnings', table(['Member', 'Warnings', 'Latest reason', ''], warns.map(function (w) {
        var last = (w.recent || []).slice(-1)[0] || {};
        return [mem(w.user_id, w.user), String(w.count), esc(last.reason || '—'), btn('Warn', "HubBot.warn('" + esc(w.user_id) + "')") + btn('Timeout', "HubBot.timeout('" + esc(w.user_id) + "')") + btn('Clear', "HubBot.clearwarns('" + esc(w.user_id) + "')", 'danger')];
      }), 'Nobody has warnings'));
      return out;
    },
    'bot-cases': function () {
      var cases = D('cases', []), ap = D('appeals', []);
      var kind = { warn: 'warn', mute: 'warn', kick: 'bad', ban: 'bad', unban: 'ok', softban: 'bad', note: '' };
      var out = head('Cases & Appeals', 'Moderation history for this server');
      out += card('Cases (' + cases.length + ')', table(['#', 'Member', 'Action', 'Reason', 'Moderator', 'When', ''], cases.map(function (c) {
        return [String(c.case_id), mem(c.user_id, c.user_str), pill(c.action, kind[c.action]) + (c.expunged ? ' ' + pill('expunged', 'dim') : ''), esc(c.reason || '—') + (c.note ? '<div class="hubx-muted small">Note: ' + esc(c.note) + '</div>' : ''), esc(c.mod_str || '—'), ago(c.timestamp), btn('Note', 'HubBot.caseNote(' + c.case_id + ')') + (c.expunged ? '' : btn('Expunge', 'HubBot.caseExpunge(' + c.case_id + ')', 'danger'))];
      }), 'No cases yet'));
      out += card('Appeals (' + ap.length + ')', table(['Case', 'Member', 'Status', 'Message'], ap.map(function (a) { return [esc(a.case_id), esc(a.user_str || a.user_id), pill(a.status || 'open', a.status === 'accepted' ? 'ok' : a.status === 'denied' ? 'bad' : 'warn'), esc(a.reason || a.message || '—')]; }), 'No appeals'));
      return out;
    },
    'bot-automod': function () {
      var a = D('automod', { enabled: false, rules: {}, blacklist: [] });
      var rules = Object.keys(a.rules || {}).map(function (k) { var r = a.rules[k] || {}; return [esc(r.name || k), esc(r.type || r.pattern || '—'), pill(r.action || 'delete', 'warn')]; });
      var out = head('Auto-Mod', 'Word filters and automatic rules');
      out += card('Status', '<div class="hubx-actions">' + pill(a.enabled ? 'Enabled' : 'Disabled', a.enabled ? 'ok' : 'dim') + btn(a.enabled ? 'Disable' : 'Enable', 'HubBot.automod(' + (!a.enabled) + ')', a.enabled ? 'danger' : 'primary') + '</div>');
      out += card('Blacklisted words (' + (a.blacklist || []).length + ')', '<div class="hubx-actions" style="margin-bottom:.7rem">' + btn('Add word', 'HubBot.wordAdd()', 'primary') + '</div><div class="hubx-chips">' + ((a.blacklist || []).map(function (w) { return '<span class="hubx-chip">' + esc(w) + '<button aria-label="Remove" onclick="HubBot.wordRemove(\'' + esc(w).replace(/'/g, '&#39;') + '\')">×</button></span>'; }).join('') || empty('No words yet')) + '</div>');
      out += card('Rules', table(['Rule', 'Trigger', 'Action'], rules, 'No custom rules. Create them in Discord with the bot\'s automod commands.'));
      return out;
    },
    'bot-antiraid': function () {
      var c = D('antiraid', {});
      return head('Anti-Raid', 'Detects mass joins and locks the server') +
        '<div class="hubx-stats">' + stat('Protection', c.enabled === false ? 'Off' : 'On') + stat('Trigger', (c.threshold || 10) + ' joins') + stat('Window', (c.window || 10) + ' s') + stat('Lockdown', c.locked ? 'Active' : 'Inactive') + '</div>' +
        card('Controls', '<div class="hubx-actions">' + btn('Edit settings', 'HubBot.raid()', 'primary') + btn('Lock server now', 'HubBot.lockdown(true)', 'danger') + btn('Lift lockdown', 'HubBot.lockdown(false)') + '</div>');
    },
    'bot-tickets': function () {
      var t = D('tickets', { config: {}, open: [] });
      var cfg = t.config || {};
      return head('Tickets', 'Support channels opened by members') +
        card('Open tickets (' + (t.open || []).length + ')', table(['Channel', ''], (t.open || []).map(function (x) { return ['#' + esc(x.name), btn('Close', "HubBot.ticketClose('" + esc(x.id) + "')", 'danger')]; }), 'No open tickets')) +
        card('Configuration', Object.keys(cfg).length ? '<ul class="hubx-list">' + Object.keys(cfg).map(function (k) { return '<li><strong>' + esc(k) + ':</strong> ' + esc(typeof cfg[k] === 'object' ? JSON.stringify(cfg[k]) : cfg[k]) + '</li>'; }).join('') + '</ul>' : empty('Not configured. Use the bot\'s ticket setup command in Discord.'));
    },
    'bot-giveaways': function () {
      var g = D('giveaways', []);
      return head('Giveaways', 'Start them in Discord, manage them here') +
        card('Giveaways (' + g.length + ')', table(['Prize', 'Winners', 'Entrants', 'Status', ''], g.map(function (x) {
          return [esc(x.prize || x.title || x.message_id), esc(x.winners || 1), esc(x.entrants), pill(x.ended ? 'Ended' : 'Running', x.ended ? 'dim' : 'ok'), x.ended ? btn('Reroll', "HubBot.gReroll('" + esc(x.message_id) + "')") : btn('End now', "HubBot.gEnd('" + esc(x.message_id) + "')", 'danger')];
        }), 'No giveaways'));
    },
    'bot-polls': function () {
      var p = D('polls', []);
      return head('Polls', 'Live polls and results') +
        card('Polls (' + p.length + ')', p.length ? p.map(function (x) {
          var opts = x.options || [], votes = x.votes || {};
          var counts = opts.map(function (_, i) { var v = votes[i] || votes[String(i)] || []; return Array.isArray(v) ? v.length : Object.keys(v).length; });
          var tot = counts.reduce(function (a, b) { return a + b; }, 0) || 1;
          return '<div class="hubx-poll"><div class="hubx-poll-q">' + esc(x.question || x.message_id) + ' ' + pill(x.ended ? 'Ended' : 'Running', x.ended ? 'dim' : 'ok') + (x.ended ? '' : btn('End', "HubBot.pollEnd('" + esc(x.message_id) + "')", 'danger')) + '</div>' + opts.map(function (o, i) { var pc = Math.round(counts[i] * 100 / tot); return '<div class="hubx-bar"><span>' + esc(o) + '</span><div><i style="width:' + pc + '%"></i></div><b>' + counts[i] + '</b></div>'; }).join('') + '</div>';
        }).join('') : empty('No polls'));
    },
    'bot-leveling': function () {
      var l = D('leveling', []);
      return head('Leveling', 'XP leaderboard') + card('Top members', table(['#', 'Member', 'XP'], l.map(function (x, i) { return [String(i + 1), mem(x.user_id, x.user), esc(x.xp)]; }), 'No XP recorded'));
    },
    'bot-rr': function () {
      var r = D('reaction_roles', {}), keys = Object.keys(r || {});
      return head('Reaction Roles', 'Self-assign role messages') + card('Messages (' + keys.length + ')', table(['Message ID', 'Mappings'], keys.map(function (k) { var v = r[k] || {}; var map = v.roles || v; return [esc(k), '<code>' + esc(JSON.stringify(map)).slice(0, 220) + '</code>']; }), 'No reaction role messages. Create them in Discord.'));
    },
    'bot-sched': function () {
      var s = D('scheduled', []);
      return head('Scheduler', 'Messages queued for later') + card('Scheduled (' + s.length + ')', table(['Title', 'Send at', 'By', 'Message'], s.map(function (x) { return [esc(x.title || '—'), esc(x.send_at), esc(x.author_name || '—'), esc((x.message || '').slice(0, 120))]; }), 'Nothing scheduled'));
    },
    'bot-music': function () {
      var m = D('music', {});
      return head('Music & Voice', 'Playback in the voice channel') +
        '<div class="hubx-stats">' + stat('Voice', m.connected ? 'Connected' : 'Idle', m.channel || '') + stat('Playback', m.playing ? 'Playing' : (m.paused ? 'Paused' : 'Stopped')) + '</div>' +
        card('Controls', '<div class="hubx-actions">' + btn('Pause', "HubBot.music('pause')") + btn('Resume', "HubBot.music('resume')") + btn('Skip', "HubBot.music('skip')") + '</div><p class="hubx-muted small">Start tracks with the music commands in Discord.</p>');
    },
    'bot-settings': function () {
      var st = D('settings', {}), d = D('discord', { channels: [], roles: [] });
      return head('Bot Settings', 'Presence and server data') +
        card('Presence', '<div class="hubx-actions">' + btn('Change status text', 'HubBot.status()', 'primary') + '</div>') +
        card('Language', '<p>' + esc(st.language || 'en') + '</p><p class="hubx-muted small">Change it in Discord with the language command.</p>') +
        '<div class="hubx-grid2">' + card('Channels (' + d.channels.length + ')', '<div class="hubx-scroll">' + d.channels.map(function (c) { return '<div class="hubx-row">' + mem(c.id, '#' + c.name) + '<span class="hubx-muted small">' + esc(c.type) + '</span></div>'; }).join('') + '</div>') +
        card('Roles (' + d.roles.length + ')', '<div class="hubx-scroll">' + d.roles.slice().sort(function (a, b) { return b.position - a.position; }).map(function (r) { return '<div class="hubx-row">' + mem(r.id, r.name) + '</div>'; }).join('') + '</div>') + '</div>';
    },
    'bot-cmds': function () {
      var list = (typeof BOT_COMMANDS !== 'undefined') ? BOT_COMMANDS : [];
      var DISCORD_CMDS = {
        Moderation: 'warn, warnings, clearwarns, kick, ban, unban, mute/timeout, softban, purge, slowmode, lock, unlock, lockdown, case, cases, appeal, note',
        'Auto-Mod': 'automod, blacklist add/remove/list, advanced automod rules, AI moderation',
        'Anti-Raid': 'antiraid on/off/threshold, lockdown',
        Community: 'giveaway start/end/reroll, poll, reactionroles, tickets setup/close, level/rank/leaderboard, autoreact',
        Voice: 'tempvoice setup, voice bans, music play/pause/skip/queue',
        Utility: 'schedule, language, help, botsettings, config, AI chat (mention the bot)'
      };
      return head('Command Reference', 'What DevTBot can do in Discord, and the chat commands available on this site') +
        card('Discord (prefix ! and /)', '<ul class="hubx-list">' + Object.keys(DISCORD_CMDS).map(function (k) { return '<li><strong>' + k + ':</strong> ' + esc(DISCORD_CMDS[k]) + '</li>'; }).join('') + '</ul><p class="hubx-muted small">Use <code>/help</code> in Discord for the exact, current list.</p>') +
        card('Site chat commands (' + list.length + ')', table(['Command', 'Description', 'Rank'], list.map(function (c) { return ['<code>' + esc(c.usage) + '</code>', esc(c.desc), esc(c.min || '')]; }), 'None'));
    }
  };

  function loadHistory() {
    var el = $('hubxHistory'); if (!el) return;
    api('/bot/commands').then(function (r) {
      var el2 = $('hubxHistory'); if (!el2 || !r.success) return;
      el2.innerHTML = card('Recent actions from the site', table(['Action', 'By', 'Status', 'Result', 'When'], (r.commands || []).slice(0, 15).map(function (c) {
        return [esc(labelAction(c.action)), esc(c.requested_by || '—'), pill(c.status, c.status === 'done' ? 'ok' : c.status === 'failed' ? 'bad' : 'warn'), esc((c.result && c.result.message) || '—'), ago(c.created_at)];
      }), 'No actions yet'));
    });
  }

  function renderBot() {
    var box = $('hubBotPanel'); if (!box) return;
    if (!isBotAdmin()) { box.innerHTML = card('Restricted', '<p>Bot controls are available to CoOwner and Owner accounts only.</p>'); return; }
    var scroll = box.parentNode.scrollTop;
    if (!Bot.online && !Bot.status) { box.innerHTML = noBot(); return; }
    var fn = BOT_VIEWS[Bot.view];
    box.innerHTML = guildBar() + (Bot.online ? '' : '<div class="hubx-banner">DevTBot looks offline. Showing the last data it synced; actions are paused.</div>') + (fn ? fn() : '');
    box.parentNode.scrollTop = scroll;
  }

  /* ── shell ── */
  var built = false;
  var CHAT_MARKUP = null;

  function buildShell() {
    var hub = $('officeHub');
    if (!built) {
      var oldChat = $('hub-view-chat');
      CHAT_MARKUP = oldChat ? oldChat.innerHTML : '';
      built = true;
    }
    hub.innerHTML =
      '<div class="hubx-shell">' +
      '<aside class="hubx-side" id="hubxSide"><div class="hubx-brand">' + ic('grid', 20) + '<span>Office Hub</span></div><nav id="hubxNav"></nav>' +
      '<div class="hubx-me" id="hubxMe"></div></aside>' +
      '<div class="hubx-scrim" id="hubxScrim" onclick="HubUI.drawer(false)"></div>' +
      '<div class="hubx-col"><header class="hubx-top"><button class="hubx-icon hubx-burger" aria-label="Menu" onclick="HubUI.drawer(true)">' + ic('menu', 20) + '</button>' +
      '<div class="hubx-crumb" id="hubxCrumb"></div><button class="hubx-search" onclick="HubUI.palette()">' + ic('search', 15) + '<span>Search…</span><kbd>Ctrl K</kbd></button>' +
      '<span class="hubx-botchip" id="hubxChip"></span>' +
      '<button class="hubx-icon" aria-label="Settings" onclick="openSettings()">' + ic('cog', 18) + '</button><button class="hubx-icon" aria-label="Close Office Hub" onclick="closeOfficeHub()">' + ic('x', 18) + '</button></header>' +
      '<main class="hubx-main">' +
      '<div class="hub-view" id="hub-view-dashboard"><div id="hubDashContent"></div></div>' +
      '<div class="hub-view" id="hub-view-activity"><div id="hubActContent"></div></div>' +
      '<div class="hub-view" id="hub-view-tasks"><div id="hubTaskContent"></div></div>' +
      '<div class="hub-view chat-view" id="hub-view-chat">' + CHAT_MARKUP + '</div>' +
      '<div class="hub-view" id="hub-view-toolbox"><div id="hubToolContent"></div></div>' +
      '<div class="hub-view" id="hub-view-bots"><div id="hubBotContent"></div></div>' +
      '<div class="hub-view" id="hub-view-analytics"><div id="hubAnalContent"></div></div>' +
      '<div class="hub-view" id="hub-view-bot"><div id="hubBotPanel"></div></div>' +
      '</main></div></div>';
  }

  function renderNav(active) {
    var nav = $('hubxNav'); if (!nav) return;
    nav.innerHTML = visibleNav().map(function (g) {
      return '<div class="hubx-group">' + esc(g.group) + (g.bot ? ' <span class="hubx-lock" title="CoOwner and Owner only">' + ic('shield', 11) + '</span>' : '') + '</div>' +
        g.items.map(function (i) { return '<button class="hubx-nav' + (i.id === active ? ' active' : '') + '" data-id="' + i.id + '" onclick="switchHubView(\'' + i.id + '\',this)">' + ic(i.icon, 16) + '<span>' + esc(i.label) + '</span></button>'; }).join('');
    }).join('');
    var u = state.accountUser || state.currentUser || {};
    var me = $('hubxMe'); if (me) me.innerHTML = '<div class="hubx-avatar">' + esc((u.name || u.username || '?').charAt(0).toUpperCase()) + '</div><div><div class="hubx-me-n">' + esc(u.name || u.username || 'You') + '</div><div class="hubx-muted small">' + esc(myRank() || 'Member') + '</div></div>';
  }

  function updateChip() {
    var c = $('hubxChip'); if (!c) return;
    if (!isBotAdmin()) { c.style.display = 'none'; return; }
    c.style.display = '';
    c.className = 'hubx-botchip ' + (Bot.online ? 'ok' : 'bad');
    c.innerHTML = '<i></i>DevTBot ' + (Bot.online ? 'online' : 'offline');
  }

  var current = 'dashboard';
  function hubGo(id) {
    if (id.indexOf('bot-') === 0 && !isBotAdmin()) { toast('Restricted', 'Bot controls are for CoOwner and Owner accounts.', 'error'); id = 'dashboard'; }
    current = id;
    document.querySelectorAll('#officeHub .hub-view').forEach(function (el) { el.classList.remove('active'); el.style.display = 'none'; });
    var isBot = id.indexOf('bot-') === 0;
    var el = $(isBot ? 'hub-view-bot' : 'hub-view-' + id);
    if (el) { el.classList.add('active'); el.style.display = 'block'; }
    renderNav(id);
    var cr = $('hubxCrumb'); if (cr) cr.innerHTML = '<span class="hubx-muted">' + (isBot ? 'DevTBot Control' : 'Office Hub') + '</span><span class="sep">/</span><strong>' + esc(labelOf(id)) + '</strong>';
    HubUI.drawer(false);
    if (isBot) {
      Bot.view = id;
      var box = $('hubBotPanel'); if (box && !Bot.status) box.innerHTML = '<div class="hubx-empty">Connecting to DevTBot…</div>';
      refreshBot(); startPolling();
    } else {
      Bot.view = null; stopPolling();
      var fn = LEGACY[id]; if (fn && typeof window[fn] === 'function') { try { window[fn](); } catch (e) { console.error(e); } }
      if (isBotAdmin() && !Bot.status) loadStatus().then(updateChip);
    }
    updateChip();
    var main = document.querySelector('.hubx-main'); if (main) main.scrollTop = 0;
  }

  /* command palette (Ctrl/⌘ K) */
  var HubUI = window.HubUI = {
    drawer: function (open) { var s = $('hubxSide'), sc = $('hubxScrim'); if (s) s.classList.toggle('open', !!open); if (sc) sc.classList.toggle('open', !!open); },
    palette: function () {
      if (document.querySelector('.hubx-pal')) return;
      var items = [];
      visibleNav().forEach(function (g) { g.items.forEach(function (i) { items.push({ label: i.label, hint: g.group, run: function () { hubGo(i.id); } }); }); });
      if (isBotAdmin()) [['Warn a member', 'warn'], ['Timeout a member', 'timeout'], ['Kick a member', 'kick'], ['Ban a user', 'ban'], ['Unban a user', 'unban'], ['Send announcement', 'announce'], ['Purge messages', 'purge'], ['Set bot status', 'status']].forEach(function (a) { items.push({ label: a[0], hint: 'Bot action', run: function () { H[a[1]](); } }); });
      var w = document.createElement('div'); w.className = 'hubx-modal hubx-pal';
      w.innerHTML = '<div class="hubx-dialog pal"><input placeholder="Jump to a page or run an action…" aria-label="Search"><div class="hubx-pal-list"></div></div>';
      document.body.appendChild(w);
      var inp = w.querySelector('input'), list = w.querySelector('.hubx-pal-list'), sel = 0, shown = [];
      function close() { w.remove(); }
      function draw() {
        var q = inp.value.toLowerCase();
        shown = items.filter(function (i) { return !q || (i.label + ' ' + i.hint).toLowerCase().indexOf(q) >= 0; }).slice(0, 10);
        sel = Math.min(sel, Math.max(0, shown.length - 1));
        list.innerHTML = shown.map(function (i, n) { return '<div class="hubx-pal-item' + (n === sel ? ' sel' : '') + '" data-n="' + n + '"><span>' + esc(i.label) + '</span><em>' + esc(i.hint) + '</em></div>'; }).join('') || '<div class="hubx-empty">No match</div>';
      }
      function run(n) { var it = shown[n]; if (it) { close(); it.run(); } }
      inp.oninput = function () { sel = 0; draw(); };
      inp.onkeydown = function (e) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, shown.length - 1); draw(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
        else if (e.key === 'Enter') run(sel);
      };
      list.onclick = function (e) { var t = e.target.closest('.hubx-pal-item'); if (t) run(+t.dataset.n); };
      w.addEventListener('mousedown', function (e) { if (e.target === w) close(); });
      draw(); inp.focus();
    }
  };
  document.addEventListener('keydown', function (e) {
    var hub = $('officeHub');
    if (hub && hub.classList.contains('open') && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); HubUI.palette(); }
  });

  /* ── replace the old entry points ── */
  window.openOfficeHub = function () {
    if (!state.currentUser) { toast('Login required', '', 'error'); return; }
    buildShell();
    $('officeHub').classList.add('open');
    document.body.classList.add('hub-open');
    hubGo('dashboard');
  };
  window.closeOfficeHub = function () {
    $('officeHub').classList.remove('open');
    document.body.classList.remove('hub-open');
    stopPolling(); Bot.view = null;
  };
  window.switchHubView = function (view) { hubGo(view); };
})();
