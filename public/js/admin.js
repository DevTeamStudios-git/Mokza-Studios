/* ========================================================================
   MOKZA STUDIOS — ADMIN PANEL, CONTENT MANAGEMENT & TEXT EDITING
   Restored from the original site (Old-index.html) and rebuilt on the
   current architecture. Depends on app.js (state, helpers, auth, saving).
   ======================================================================== */

/* ── small helpers ── */
function $(id) { return document.getElementById(id); }
function val(id) { var el = $(id); return el ? el.value.trim() : ''; }
function openModal(title, html) {
  $('elementModalTitle').textContent = title;
  $('elementModalContent').innerHTML = html;
  $('elementModal').classList.remove('hidden');
  setTimeout(function() { var f = $('elementModalContent').querySelector('input,textarea,select'); if (f) f.focus(); }, 30);
}
function commit() {
  saveToFirestore();
  renderPage();
  if (state.adminMenuOpen) renderAdminContent();
}
function requireRank(rank, what) {
  if (canAccess(rank)) return true;
  showNotification('Access Denied', (what || 'This action') + ' requires ' + rankLabel(rank) + '+', 'error');
  return false;
}
function rowBtn(icon, title, onclick, danger) {
  return '<button class="btn-icon' + (danger ? ' danger' : '') + '" onclick="' + onclick + '" title="' + title + '" aria-label="' + title + '">' + svgIcon(icon, 16) + '</button>';
}
function noteBox(title, items) {
  return '<div class="admin-note"><b>' + title + '</b><ul>' + items.map(function(i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>';
}

/* ═════════════════════════ ADMIN PANEL ═════════════════════════ */
var ADMIN_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'chart', min: 'Apprentice' },
  { id: 'announcements', label: 'Announcements', icon: 'bell', min: 'CoOwner' },
  { id: 'navigation', label: 'Navigation', icon: 'rocket', min: 'Developer' },
  { id: 'elements', label: 'Elements', icon: 'building', min: 'Developer' },
  { id: 'cloud', label: 'Cloud', icon: 'cloud', min: 'Apprentice' },
  { id: 'chat', label: 'Chat', icon: 'chat', min: 'Developer' },
  { id: 'users', label: 'Users', icon: 'people', min: 'Apprentice' },
  { id: 'apprentice', label: 'Apprentice Accounts', icon: 'user-plus', min: 'CoOwner' },
  { id: 'messages', label: 'Messages', icon: 'inbox', min: 'Developer' },
  { id: 'suggestions', label: 'Suggestions', icon: 'sparkles', min: 'Apprentice' },
  { id: 'activity', label: 'Activity', icon: 'clipboard', min: 'Apprentice' },
  { id: 'site', label: 'Site', icon: 'gear', min: 'CoOwner' }
];

function openAdminPanel() {
  if (!state.currentUser) { showNotification('Access Denied', 'Please login first', 'error'); return; }
  state.adminMenuOpen = true;
  $('adminPanel').classList.add('open');
  var btn = $('adminBtn'); if (btn) btn.classList.add('on');
  renderAdminContent();
}
function closeAdminPanel() {
  state.adminMenuOpen = false;
  var p = $('adminPanel'); if (p) p.classList.remove('open');
  var btn = $('adminBtn'); if (btn) btn.classList.remove('on');
}
function changeAdminSection(id) {
  state.adminSection = id;
  renderAdminContent();
}
function renderAdminContent() {
  if (!state.currentUser) return;
  var visible = ADMIN_SECTIONS.filter(function(s) { return canAccess(s.min); });
  if (!visible.some(function(s) { return s.id === state.adminSection; })) state.adminSection = 'overview';
  $('adminTabs').innerHTML = visible.map(function(s) {
    return '<button class="admin-tab' + (s.id === state.adminSection ? ' active' : '') + '" onclick="changeAdminSection(\'' + s.id + '\')">' + svgIcon(s.icon, 15) + ' ' + s.label + '</button>';
  }).join('');
  var c = $('adminContent');
  var fn = { overview: renderOverviewSection, announcements: renderAnnouncementsSection, navigation: renderNavigationSection, elements: renderElementsSection, cloud: renderCloudSection, chat: renderChatSection, users: renderUsersSection, apprentice: renderApprenticeSection, messages: renderMessagesSection, suggestions: renderSuggestionsSection, activity: renderActivitySection, site: renderSiteSection }[state.adminSection];
  var st = c.scrollTop;
  fn(c);
  c.scrollTop = st;
}

function renderOverviewSection(c) {
  var u = state.currentUser;
  var cards = Object.keys(state.featureCards).reduce(function(n, k) { return n + state.featureCards[k].length; }, 0);
  c.innerHTML = '<div class="admin-overview"><h3>Welcome, ' + escHtml(u.username) + verifiedBadge(u.rank) + '</h3><p class="admin-role">Rank: <strong>' + rankLabel(u.rank) + '</strong></p><p class="admin-permissions">Permissions: <strong>' + escHtml(u.permissions) + '</strong></p>' +
    '<div class="admin-stats">' + [['Projects', state.projects.length], ['Feature Cards', cards], ['Nav Links', state.navigationLinks.filter(function(l) { return l.enabled; }).length], ['Custom Elements', state.customElements.length], ['Open Tasks', state.tasks.filter(function(t) { return !t.done; }).length], ['Messages', state.contactMessages.length]].map(function(x) {
      return '<div class="stat-box"><div class="stat-value">' + x[1] + '</div><div class="stat-label">' + x[0] + '</div></div>';
    }).join('') + '</div>' +
    '<div class="admin-btn-row" style="justify-content:center">' +
    '<button class="btn-primary" onclick="openOfficeHub();closeAdminPanel()">' + svgIcon('building', 16) + ' Office Hub</button>' +
    '<button class="btn-ghost" style="border:1px solid var(--ov-12)" onclick="exportWebsiteState()">' + svgIcon('inbox', 16) + ' Export Data</button>' +
    (canAccess('CoOwner') ? '<button class="btn-ghost" style="border:1px solid var(--ov-12)" onclick="importWebsiteState()">' + svgIcon('outbox', 16) + ' Import Data</button>' : '') + '</div>' +
    '<button class="btn-danger" onclick="handleLogout()">Logout</button></div>';
}

/* ═════════════════════════ FEATURE CARDS ═════════════════════════ */
function cardForm(card, page, isEdit) {
  var c = card || {};
  return '<label class="modal-label">Icon (emoji or icon name)</label><input type="text" id="cardIcon" class="modal-input" placeholder="🎯  or  game, robot, target…" maxlength="24" value="' + escHtml(c.icon || '') + '" />' +
    '<label class="modal-label">Title</label><input type="text" id="cardTitle" class="modal-input" placeholder="Feature title" maxlength="80" value="' + escHtml(c.title || '') + '" />' +
    '<label class="modal-label">Description</label><textarea id="cardDescription" class="modal-input" rows="3" maxlength="400" placeholder="Feature description...">' + escHtml(c.description || '') + '</textarea>' +
    '<label class="modal-label">Link (optional)</label><input type="text" id="cardLink" class="modal-input" placeholder="https://example.com" value="' + escHtml(c.link || '') + '" /><p class="modal-hint">Leave empty if no link is needed. Only http(s) and mailto links are allowed.</p>' +
    '<input type="hidden" id="cardPage" value="' + escHtml(sid(page)) + '" />' + (isEdit ? '<input type="hidden" id="cardId" value="' + escHtml(sid(c.id)) + '" />' : '') +
    '<div class="modal-buttons"><button class="btn-primary" onclick="' + (isEdit ? 'updateFeatureCard()' : 'saveFeatureCard()') + '">' + (isEdit ? 'Update Card' : 'Add Card') + '</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>';
}
function readCardForm() {
  var f = { icon: val('cardIcon'), title: val('cardTitle'), description: val('cardDescription'), link: val('cardLink') };
  if (!f.title || !f.description) { showNotification('Validation Error', 'Title and description are required', 'error'); return null; }
  if (f.link && !safeUrl(f.link)) { showNotification('Invalid link', 'Use a full http(s):// or mailto: link', 'error'); return null; }
  f.icon = f.icon || '⭐';
  return f;
}
function addFeatureCard(page) { if (!requireRank('Developer', 'Adding cards')) return; openModal('Add Feature Card', cardForm(null, page, false)); }
function saveFeatureCard() {
  if (!requireRank('Developer', 'Adding cards')) return;
  var f = readCardForm(); if (!f) return;
  var page = val('cardPage'); if (!state.featureCards[page]) state.featureCards[page] = [];
  var list = state.featureCards[page];
  list.push({ id: 'card_' + page + '_' + Date.now(), icon: f.icon, title: f.title, description: f.description, link: f.link || null, author: state.currentUser.username, order: list.length });
  closeElementModal(); logActivity('Card Added', 'Added card "' + f.title + '" to ' + page);
  showNotification('Card Added', 'Feature card created successfully', 'success'); commit();
}
function editFeatureCard(id, page) {
  if (!requireRank('Developer', 'Editing cards')) return;
  var card = byId(state.featureCards[page], id); if (!card) return;
  openModal('Edit Feature Card', cardForm(card, page, true));
}
function updateFeatureCard() {
  if (!requireRank('Developer', 'Editing cards')) return;
  var f = readCardForm(); if (!f) return;
  var card = byId(state.featureCards[val('cardPage')], val('cardId')); if (!card) return;
  card.icon = f.icon; card.title = f.title; card.description = f.description; card.link = f.link || null;
  closeElementModal(); logActivity('Card Edited', 'Updated card "' + f.title + '" on ' + val('cardPage'));
  showNotification('Card Updated', 'Feature card updated successfully', 'success'); commit();
}
function deleteFeatureCard(id, page) {
  if (!requireRank('Developer', 'Deleting cards')) return;
  var card = byId(state.featureCards[page], id); if (!card) return;
  if (!confirm('Delete card "' + card.title + '"?')) return;
  state.featureCards[page] = state.featureCards[page].filter(function(c) { return c !== card; });
  state.featureCards[page].forEach(function(c, i) { c.order = i; });
  logActivity('Card Deleted', 'Deleted card "' + card.title + '" from ' + page);
  showNotification('Card Deleted', 'Feature card removed successfully', 'success'); commit();
}
/* drag & drop re-ordering */
var _dragCardId = null;
function handleCardDragStart(e) { var el = e.target.closest('.feature-card'); if (!el) return; _dragCardId = el.dataset.cardId; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', _dragCardId); } catch (x) {} }
function handleCardDragEnd() { document.querySelectorAll('.feature-card').forEach(function(c) { c.classList.remove('dragging', 'drag-over'); }); }
function handleCardDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; var t = e.target.closest('.feature-card'); document.querySelectorAll('.feature-card.drag-over').forEach(function(c) { c.classList.remove('drag-over'); }); if (t && t.dataset.cardId !== _dragCardId) t.classList.add('drag-over'); }
function handleCardDrop(e) {
  e.preventDefault(); e.stopPropagation();
  if (!canManageCards()) return;
  var t = e.target.closest('.feature-card'); if (!t || !_dragCardId) return;
  var page = t.dataset.page, list = state.featureCards[page];
  var from = list.findIndex(function(c) { return sid(c.id) === _dragCardId; }), to = list.findIndex(function(c) { return sid(c.id) === t.dataset.cardId; });
  if (from < 0 || to < 0 || from === to) { handleCardDragEnd(); return; }
  list.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
  from = list.findIndex(function(c) { return sid(c.id) === _dragCardId; }); to = list.findIndex(function(c) { return sid(c.id) === t.dataset.cardId; });
  var moved = list.splice(from, 1)[0]; list.splice(to, 0, moved);
  list.forEach(function(c, i) { c.order = i; });
  _dragCardId = null; logActivity('Card Reordered', 'Moved card on ' + page); showNotification('Card Moved', 'Card position updated', 'success'); commit();
}

/* ═════════════════════════ PROJECTS ═════════════════════════ */
function projectForm(p, isEdit) {
  p = p || {};
  return '<label class="modal-label">Project Title</label><input type="text" id="projectTitle" class="modal-input" placeholder="My Awesome Project" maxlength="80" value="' + escHtml(p.title || '') + '" />' +
    '<label class="modal-label">Description</label><textarea id="projectDescription" class="modal-input" rows="3" maxlength="400" placeholder="Project description...">' + escHtml(p.description || '') + '</textarea>' +
    '<label class="modal-label">Icon (emoji or icon name)</label><input type="text" id="projectImage" class="modal-input" maxlength="24" value="' + escHtml(p.image || '📦') + '" />' +
    '<label class="modal-label">Link (optional)</label><input type="text" id="projectLink" class="modal-input" placeholder="https://github.com/..." value="' + escHtml(p.link && p.link !== '#' ? p.link : '') + '" />' +
    (isEdit ? '<input type="hidden" id="projectId" value="' + Number(p.id) + '" />' : '') +
    '<div class="modal-buttons"><button class="btn-primary" onclick="' + (isEdit ? 'updateProject()' : 'saveProject()') + '">' + (isEdit ? 'Update Project' : 'Add Project') + '</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>';
}
function readProjectForm() {
  var f = { title: val('projectTitle'), description: val('projectDescription'), image: val('projectImage') || '📦', link: val('projectLink') };
  if (!f.title || !f.description) { showNotification('Validation Error', 'Title and description are required', 'error'); return null; }
  if (f.link && !safeUrl(f.link)) { showNotification('Invalid link', 'Use a full http(s):// link', 'error'); return null; }
  return f;
}
function addProject() { if (!requireRank('Developer', 'Adding projects')) return; openModal('Add Project', projectForm(null, false)); }
function saveProject() {
  if (!requireRank('Developer', 'Adding projects')) return;
  var f = readProjectForm(); if (!f) return;
  state.projects.push({ id: Date.now(), title: f.title, description: f.description, date: new Date().toISOString().split('T')[0], image: f.image, link: f.link || '#', poster: state.currentUser.username });
  closeElementModal(); logActivity('Project Added', 'Added project: ' + f.title);
  showNotification('Project Added', 'New project created successfully', 'success'); commit();
}
function editProject(id) {
  if (!requireRank('Developer', 'Editing projects')) return;
  var p = state.projects.find(function(x) { return Number(x.id) === Number(id); }); if (!p) return;
  openModal('Edit Project', projectForm(p, true));
}
function updateProject() {
  if (!requireRank('Developer', 'Editing projects')) return;
  var f = readProjectForm(); if (!f) return;
  var p = state.projects.find(function(x) { return Number(x.id) === Number(val('projectId')); }); if (!p) return;
  p.title = f.title; p.description = f.description; p.image = f.image; p.link = f.link || '#';
  closeElementModal(); logActivity('Project Edited', 'Updated project: ' + f.title);
  showNotification('Project Updated', 'Project updated successfully', 'success'); commit();
}
function deleteProject(id) {
  if (!requireRank('Developer', 'Deleting projects')) return;
  var p = state.projects.find(function(x) { return Number(x.id) === Number(id); }); if (!p) return;
  if (!confirm('Delete project "' + p.title + '"?')) return;
  state.projects = state.projects.filter(function(x) { return x !== p; });
  logActivity('Project Deleted', 'Deleted project: ' + p.title);
  showNotification('Project Deleted', 'Project removed successfully', 'success'); commit();
}

/* ═════════════════════════ ANNOUNCEMENTS ═════════════════════════ */
function renderAnnouncementsSection(c) {
  if (!canAccess('CoOwner')) { c.innerHTML = '<div class="admin-overview"><h3>Access Restricted</h3><p class="admin-role">CoOwner+ rank required to manage announcements.</p></div>'; return; }
  c.innerHTML = '<h3>Announcement Manager</h3><div class="admin-btn-row"><button class="btn-primary" onclick="createAnnouncement()">' + svgIcon('bell', 16) + ' Create Announcement</button></div><h4>Active announcements (' + state.announcements.length + ')</h4>' +
    (state.announcements.length ? state.announcements.map(function(a) {
      return '<div class="admin-row" style="align-items:flex-start"><div><span class="announcement-type ' + escHtml(a.type) + '">' + (a.type === 'staff' ? 'STAFF' : 'ALL') + '</span><div style="margin:.4rem 0"><strong>' + escHtml(a.title) + '</strong></div><div style="font-size:.88rem;color:var(--text-secondary)">' + escHtml(a.content) + '</div><div class="meta">By ' + escHtml(a.author || '') + ' · ' + escHtml(new Date(a.timestamp).toLocaleString()) + '</div></div><div class="admin-actions">' + rowBtn('trash', 'Delete announcement', 'deleteAnnouncement(\'' + sid(a.id) + '\')', true) + '</div></div>';
    }).join('') : '<p class="no-files">No announcements yet</p>') +
    noteBox('Announcement types', ['<b>Staff</b> — visible only to signed-in team members', '<b>All</b> — visible to every visitor', 'Announcements appear at the top of the home page']);
}
function createAnnouncement() {
  if (!requireRank('CoOwner', 'Announcements')) return;
  openModal('Create Announcement', '<label class="modal-label">Type</label><select id="announcementType" class="modal-select"><option value="all">📢 ALL — visible to everyone</option><option value="staff">👥 STAFF — signed-in team only</option></select><label class="modal-label">Title</label><input type="text" id="announcementTitle" class="modal-input" maxlength="100" placeholder="Announcement title" /><label class="modal-label">Content</label><textarea id="announcementContent" class="modal-input" rows="4" maxlength="1000" placeholder="Announcement message..."></textarea><div class="modal-buttons"><button class="btn-primary" onclick="saveAnnouncement()">Create Announcement</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>');
}
function saveAnnouncement() {
  if (!requireRank('CoOwner', 'Announcements')) return;
  var type = val('announcementType'), title = val('announcementTitle'), content = val('announcementContent');
  if (!title || !content) { showNotification('Validation Error', 'Title and content are required', 'error'); return; }
  state.announcements.unshift({ id: 'announcement_' + Date.now(), type: type === 'staff' ? 'staff' : 'all', title: title, content: content, author: state.currentUser.username, timestamp: new Date().toISOString() });
  closeElementModal(); logActivity('Announcement Created', 'Posted ' + type + ' announcement: ' + title);
  showNotification('Announcement Created', type.toUpperCase() + ' announcement posted', 'success'); commit();
}
function deleteAnnouncement(id) {
  if (!requireRank('CoOwner', 'Announcements')) return;
  var a = byId(state.announcements, id); if (!a) return;
  if (!confirm('Delete announcement "' + a.title + '"?')) return;
  state.announcements = state.announcements.filter(function(x) { return x !== a; });
  logActivity('Announcement Deleted', 'Deleted announcement: ' + a.title); commit();
}

/* ═════════════════════════ NAVIGATION ═════════════════════════ */
function renderNavigationSection(c) {
  if (!canAccess('Developer')) { c.innerHTML = '<div class="admin-overview"><h3>Access Restricted</h3><p class="admin-role">Developer+ rank required.</p></div>'; return; }
  c.innerHTML = '<h3>Navigation Manager</h3><div class="admin-btn-row"><button class="btn-primary" onclick="addNavigationLink()">' + svgIcon('plus', 16) + ' Add Nav Link</button></div><h4>Links (' + state.navigationLinks.length + ')</h4>' +
    state.navigationLinks.map(function(l, i) {
      return '<div class="admin-row"><div><strong>' + escHtml(l.label) + '</strong><div class="meta">Page: ' + escHtml(l.page) + ' · By ' + escHtml(l.author || 'System') + (l.minRank ? ' · ' + escHtml(l.minRank) + '+' : '') + '</div></div><div class="admin-actions"><label style="display:flex;align-items:center;gap:.3rem;font-size:.8rem;color:var(--text-secondary);cursor:pointer"><input type="checkbox" ' + (l.enabled ? 'checked' : '') + ' onchange="toggleNavLink(\'' + sid(l.id) + '\')" /> Enabled</label>' +
        (i > 0 ? rowBtn('chevron-up', 'Move up', 'moveNavLink(\'' + sid(l.id) + '\',-1)') : '') + (i < state.navigationLinks.length - 1 ? rowBtn('chevron-down', 'Move down', 'moveNavLink(\'' + sid(l.id) + '\',1)') : '') +
        rowBtn('pencil', 'Edit link', 'editNavigationLink(\'' + sid(l.id) + '\')') + (l.author !== 'System' ? rowBtn('trash', 'Delete link', 'deleteNavigationLink(\'' + sid(l.id) + '\')', true) : '') + '</div></div>';
    }).join('') + noteBox('Tips', ['Toggle “Enabled” to show/hide a link in the navbar', 'Set a minimum rank to restrict who sees a link', 'System links cannot be deleted', 'New links create a page where you can add cards and elements']);
}
function navForm(l, isEdit) {
  l = l || {};
  var ranks = ['', 'Apprentice', 'Developer', 'CoOwner', 'Owner'];
  return '<label class="modal-label">Link label</label><input type="text" id="navLabel" class="modal-input" maxlength="30" placeholder="My Page" value="' + escHtml(l.label || '') + '" />' +
    '<label class="modal-label">Target page id</label><input type="text" id="navPage" class="modal-input" maxlength="30" placeholder="mypage" value="' + escHtml(l.page || '') + '" ' + (isEdit && l.author === 'System' ? 'disabled' : '') + ' /><p class="modal-hint">Lowercase letters, numbers and dashes only.</p>' +
    '<label class="modal-label">Minimum rank to see this link</label><select id="navRank" class="modal-select">' + ranks.map(function(r) { return '<option value="' + r + '" ' + ((l.minRank || '') === r ? 'selected' : '') + '>' + (r ? rankLabel(r) + '+' : 'Everyone') + '</option>'; }).join('') + '</select>' +
    (isEdit ? '<input type="hidden" id="navId" value="' + sid(l.id) + '" />' : '') +
    '<div class="modal-buttons"><button class="btn-primary" onclick="' + (isEdit ? 'updateNavigationLink()' : 'saveNavigationLink()') + '">' + (isEdit ? 'Update Link' : 'Add Link') + '</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>';
}
function addNavigationLink() { if (!requireRank('Developer', 'Navigation')) return; openModal('Add Navigation Link', navForm(null, false)); }
function readNavForm(existing) {
  var label = val('navLabel'), page = existing && existing.author === 'System' ? existing.page : val('navPage').toLowerCase();
  if (!label || !page) { showNotification('Validation Error', 'Label and page are required', 'error'); return null; }
  if (!/^[a-z0-9-]+$/.test(page)) { showNotification('Invalid page id', 'Use lowercase letters, numbers and dashes only', 'error'); return null; }
  if (state.navigationLinks.some(function(l) { return l.page === page && l !== existing; })) { showNotification('Duplicate page', 'A link to “' + page + '” already exists', 'error'); return null; }
  return { label: label, page: page, minRank: val('navRank') || null };
}
function saveNavigationLink() {
  if (!requireRank('Developer', 'Navigation')) return;
  var f = readNavForm(null); if (!f) return;
  state.navigationLinks.push({ id: 'nav_' + Date.now(), label: f.label, page: f.page, enabled: true, author: state.currentUser.username, minRank: f.minRank });
  if (!state.featureCards[f.page]) state.featureCards[f.page] = [];
  closeElementModal(); logActivity('Navigation Added', 'Added link: ' + f.label);
  showNotification('Link Added', 'Navigation link created', 'success'); renderNavigation(); commit();
}
function editNavigationLink(id) { if (!requireRank('Developer', 'Navigation')) return; var l = byId(state.navigationLinks, id); if (l) openModal('Edit Navigation Link', navForm(l, true)); }
function updateNavigationLink() {
  if (!requireRank('Developer', 'Navigation')) return;
  var l = byId(state.navigationLinks, val('navId')); if (!l) return;
  var f = readNavForm(l); if (!f) return;
  l.label = f.label; l.page = f.page; l.minRank = f.minRank;
  closeElementModal(); logActivity('Navigation Edited', 'Updated link: ' + f.label);
  showNotification('Link Updated', 'Navigation link updated', 'success'); renderNavigation(); commit();
}
function toggleNavLink(id) {
  if (!requireRank('Developer', 'Navigation')) return;
  var l = byId(state.navigationLinks, id); if (!l) return;
  l.enabled = !l.enabled; logActivity('Navigation Toggled', (l.enabled ? 'Enabled' : 'Disabled') + ' link: ' + l.label);
  renderNavigation(); commit();
}
function moveNavLink(id, dir) {
  if (!requireRank('Developer', 'Navigation')) return;
  var list = state.navigationLinks, i = list.findIndex(function(l) { return sid(l.id) === sid(id); }), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  var t = list[i]; list[i] = list[j]; list[j] = t; renderNavigation(); commit();
}
function deleteNavigationLink(id) {
  if (!requireRank('Developer', 'Navigation')) return;
  var l = byId(state.navigationLinks, id); if (!l) return;
  if (l.author === 'System') { showNotification('Cannot Delete', 'System links cannot be deleted', 'error'); return; }
  if (!confirm('Delete navigation link "' + l.label + '"?')) return;
  state.navigationLinks = state.navigationLinks.filter(function(x) { return x !== l; });
  if (state.currentPage === l.page) state.currentPage = 'home';
  logActivity('Navigation Deleted', 'Deleted link: ' + l.label); renderNavigation(); commit();
}

/* ═════════════════════════ CUSTOM ELEMENTS ═════════════════════════ */
var ELEMENT_TYPES = [['button', '🔘', 'Button'], ['text', '📝', 'Text'], ['heading', '🔤', 'Heading'], ['card', '🎴', 'Card'], ['image', '🖼️', 'Image'], ['divider', '➖', 'Divider']];
function renderElementsSection(c) {
  if (!canAccess('Developer')) { c.innerHTML = '<div class="admin-overview"><h3>Access Restricted</h3><p class="admin-role">Developer+ rank required.</p></div>'; return; }
  c.innerHTML = '<h3>Element Manager</h3><div class="admin-btn-row"><button class="' + (state.editMode ? 'btn-primary' : 'btn-ghost') + '" style="border:1px solid var(--ov-12)" onclick="toggleEditMode()">' + (state.editMode ? '✓ Edit Mode Active' : 'Enable Edit Mode') + '</button><button class="btn-primary" onclick="showElementLibrary()">' + svgIcon('plus', 16) + ' Add Element to “' + escHtml(state.currentPage) + '”</button></div>' +
    (state.editMode ? '<div class="admin-note" style="margin:0 0 1rem">✏️ <b>Edit mode active</b> — hover elements on the page to edit or delete them.</div>' : '') +
    '<h4>Custom elements (' + state.customElements.length + ')</h4>' +
    (state.customElements.length ? state.customElements.map(function(el) {
      return '<div class="admin-row"><div><strong style="text-transform:capitalize">' + escHtml(el.type) + '</strong><div class="meta">By ' + escHtml(el.author) + ' · Page: ' + escHtml(el.page) + '</div></div><div class="admin-actions">' + (canEditElement(el.author) ? rowBtn('pencil', 'Edit element', 'editCustomElement(\'' + sid(el.id) + '\')') : '') + (canDeleteElement() ? rowBtn('trash', 'Delete element', 'deleteCustomElement(\'' + sid(el.id) + '\')', true) : '') + '</div></div>';
    }).join('') : '<p class="no-files">No custom elements yet</p>');
}
function toggleEditMode() { state.editMode = !state.editMode; renderPage(); renderAdminContent(); }
function showElementLibrary() {
  if (!requireRank('Developer', 'Adding elements')) return;
  openModal('Add Element', '<div class="element-library">' + ELEMENT_TYPES.map(function(t) { return '<div class="library-item" role="button" tabindex="0" onclick="addElement(\'' + t[0] + '\')"><div class="library-icon">' + t[1] + '</div><div class="library-label">' + t[2] + '</div></div>'; }).join('') + '</div><div class="modal-buttons"><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>');
}
function opt(v, label, cur) { return '<option value="' + v + '" ' + (cur === v ? 'selected' : '') + '>' + label + '</option>'; }
function elementFormHtml(type, e) {
  e = e || {};
  switch (type) {
    case 'button': return '<label class="modal-label">Button text</label><input type="text" id="elementText" class="modal-input" maxlength="60" value="' + escHtml(e.text || 'Click me') + '" /><label class="modal-label">Style</label><select id="elementStyle" class="modal-select">' + opt('primary', 'Primary', e.style) + opt('danger', 'Danger', e.style) + opt('outline', 'Outline', e.style) + '</select><label class="modal-label">Link (optional)</label><input type="text" id="elementLink" class="modal-input" placeholder="https://…" value="' + escHtml(e.link && e.link !== '#' ? e.link : '') + '" />';
    case 'text': return '<label class="modal-label">Text</label><textarea id="elementText" class="modal-input" rows="4" maxlength="2000">' + escHtml(e.text || '') + '</textarea><label class="modal-label">Align</label><select id="elementAlign" class="modal-select">' + opt('left', 'Left', e.align) + opt('center', 'Center', e.align) + opt('right', 'Right', e.align) + '</select>';
    case 'heading': return '<label class="modal-label">Heading text</label><input type="text" id="elementText" class="modal-input" maxlength="120" value="' + escHtml(e.text || '') + '" /><label class="modal-label">Level</label><select id="elementLevel" class="modal-select">' + opt('h1', 'H1 (largest)', e.level) + opt('h2', 'H2', e.level) + opt('h3', 'H3', e.level || 'h3') + opt('h4', 'H4', e.level) + '</select>';
    case 'card': return '<label class="modal-label">Title</label><input type="text" id="elementTitle" class="modal-input" maxlength="80" value="' + escHtml(e.title || '') + '" /><label class="modal-label">Content</label><textarea id="elementText" class="modal-input" rows="4" maxlength="600">' + escHtml(e.text || '') + '</textarea><label class="modal-label">Icon (emoji or icon name)</label><input type="text" id="elementIcon" class="modal-input" maxlength="24" value="' + escHtml(e.icon || '🎯') + '" />';
    case 'image': return '<label class="modal-label">Image URL</label><input type="text" id="elementUrl" class="modal-input" placeholder="https://example.com/image.jpg" value="' + escHtml(e.url || '') + '" /><label class="modal-label">Alt text</label><input type="text" id="elementAlt" class="modal-input" maxlength="120" value="' + escHtml(e.alt || '') + '" /><label class="modal-label">Size</label><select id="elementSize" class="modal-select">' + opt('small', 'Small', e.size) + opt('medium', 'Medium', e.size || 'medium') + opt('large', 'Large', e.size) + opt('full', 'Full width', e.size) + '</select>';
    case 'divider': return '<label class="modal-label">Style</label><select id="elementStyle" class="modal-select">' + opt('solid', 'Solid', e.style) + opt('dashed', 'Dashed', e.style) + opt('accent', 'Accent', e.style) + '</select><label class="modal-label">Spacing</label><select id="elementSpacing" class="modal-select">' + opt('small', 'Small', e.spacing) + opt('medium', 'Medium', e.spacing || 'medium') + opt('large', 'Large', e.spacing) + '</select>';
  }
  return '';
}
function addElement(type) {
  openModal('Add ' + type.charAt(0).toUpperCase() + type.slice(1), elementFormHtml(type) + '<div class="modal-buttons"><button class="btn-primary" onclick="saveElement(\'' + type + '\')">Add Element</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>');
}
function readElementForm(type, el) {
  switch (type) {
    case 'button': el.text = val('elementText') || 'Button'; el.style = val('elementStyle'); el.link = val('elementLink'); if (el.link && !safeUrl(el.link)) { showNotification('Invalid link', 'Use a full http(s):// link', 'error'); return false; } el.link = el.link || '#'; break;
    case 'text': el.text = val('elementText'); el.align = val('elementAlign'); if (!el.text) { showNotification('Validation Error', 'Text is required', 'error'); return false; } break;
    case 'heading': el.text = val('elementText'); el.level = val('elementLevel'); if (!el.text) { showNotification('Validation Error', 'Heading text is required', 'error'); return false; } break;
    case 'card': el.title = val('elementTitle'); el.text = val('elementText'); el.icon = val('elementIcon') || '🎯'; if (!el.title) { showNotification('Validation Error', 'Title is required', 'error'); return false; } break;
    case 'image': el.url = val('elementUrl'); el.alt = val('elementAlt'); el.size = val('elementSize'); if (!/^https?:\/\//i.test(el.url)) { showNotification('Invalid URL', 'Image URL must start with http(s)://', 'error'); return false; } break;
    case 'divider': el.style = val('elementStyle'); el.spacing = val('elementSpacing'); break;
  }
  return true;
}
function saveElement(type) {
  if (!requireRank('Developer', 'Adding elements')) return;
  var el = { id: 'el_' + Date.now(), type: type, page: state.currentPage, author: state.currentUser.username, createdAt: new Date().toISOString() };
  if (!readElementForm(type, el)) return;
  state.customElements.push(el); closeElementModal(); logActivity('Element Added', 'Added ' + type + ' to ' + state.currentPage);
  showNotification('Element Added', type + ' added successfully', 'success'); commit();
}
function editCustomElement(id) {
  var el = byId(state.customElements, id); if (!el || !canEditElement(el.author)) return;
  openModal('Edit ' + el.type.charAt(0).toUpperCase() + el.type.slice(1), elementFormHtml(el.type, el) + '<div class="modal-buttons"><button class="btn-primary" onclick="updateElement(\'' + sid(el.id) + '\')">Update Element</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>');
}
function updateElement(id) {
  var el = byId(state.customElements, id); if (!el || !canEditElement(el.author)) return;
  if (!readElementForm(el.type, el)) return;
  closeElementModal(); logActivity('Element Edited', 'Updated ' + el.type + ' on ' + el.page);
  showNotification('Element Updated', 'Changes saved successfully', 'success'); commit();
}
function deleteCustomElement(id) {
  if (!requireRank('Developer', 'Deleting elements')) return;
  var el = byId(state.customElements, id); if (!el) return;
  if (!confirm('Delete this ' + el.type + '?')) return;
  state.customElements = state.customElements.filter(function(x) { return x !== el; });
  logActivity('Element Deleted', 'Deleted ' + el.type + ' from ' + el.page); showNotification('Element Deleted', 'Element removed successfully', 'success'); commit();
}
function renderCustomElement(el) {
  var ctl = state.editMode ? '<div class="element-controls">' + (canEditElement(el.author) ? '<button class="card-control-btn" onclick="editCustomElement(\'' + sid(el.id) + '\')" title="Edit" aria-label="Edit element">' + svgIcon('pencil', 14) + '</button>' : '') + (canDeleteElement() ? '<button class="card-control-btn delete" onclick="deleteCustomElement(\'' + sid(el.id) + '\')" title="Delete" aria-label="Delete element">' + svgIcon('trash', 14) + '</button>' : '') + '</div>' : '';
  var wrap = function(inner) { return '<div class="editable-element' + (state.editMode ? ' edit-mode' : '') + '" data-id="' + sid(el.id) + '">' + ctl + inner + '</div>'; };
  var sizes = { small: '200px', medium: '400px', large: '600px', full: '100%' }, spacing = { small: '1rem', medium: '2rem', large: '3rem' };
  switch (el.type) {
    case 'button': var cls = el.style === 'danger' ? 'btn-danger' : el.style === 'outline' ? 'btn-outline' : 'btn-primary'; return wrap('<a href="' + escHtml(safeUrl(el.link) || '#') + '" class="btn ' + cls + '" target="_blank" rel="noopener noreferrer" style="margin:1rem 0">' + escHtml(el.text) + '</a>');
    case 'text': return wrap('<p style="text-align:' + (['left', 'center', 'right'].indexOf(el.align) !== -1 ? el.align : 'left') + ';color:var(--text-secondary);line-height:1.7;margin:1rem 0">' + escHtml(el.text).replace(/\n/g, '<br>') + '</p>');
    case 'heading': var tag = ['h1', 'h2', 'h3', 'h4'].indexOf(el.level) !== -1 ? el.level : 'h3'; return wrap('<' + tag + ' style="color:var(--text-primary);margin:1.5rem 0">' + escHtml(el.text) + '</' + tag + '>');
    case 'card': return wrap('<div class="feature-card" style="margin:2rem 0"><div class="feature-icon">' + iconHtml(el.icon) + '</div><h3>' + escHtml(el.title) + '</h3><p>' + escHtml(el.text) + '</p></div>');
    case 'image': return /^https?:\/\//i.test(el.url) ? wrap('<img src="' + escHtml(el.url) + '" alt="' + escHtml(el.alt) + '" style="max-width:' + (sizes[el.size] || '400px') + ';width:100%;border-radius:12px;margin:2rem 0" />') : '';
    case 'divider': return wrap('<div style="margin:' + (spacing[el.spacing] || '2rem') + ' 0;' + (el.style === 'accent' ? 'height:2px;background:var(--accent-primary)' : 'border-top:2px ' + (el.style === 'dashed' ? 'dashed' : 'solid') + ' var(--ov-15)') + '"></div>');
  }
  return '';
}

/* ═════════════════════════ CLOUD FILES ═════════════════════════ */
var MAX_STORED_FILE = 300 * 1024;
function setCloudView(v) { state.cloudView = v; renderAdminContent(); }
function currentFiles() { return state.cloudView === 'personal' ? state.personalFiles : state.devCloudFiles; }
function renderCloudSection(c) {
  var files = state.cloudView ? currentFiles() : [];
  c.innerHTML = '<div class="cloud-selector"><button class="cloud-btn ' + (state.cloudView === 'personal' ? 'active' : '') + '" onclick="setCloudView(\'personal\')">Personal Cloud</button><button class="cloud-btn ' + (state.cloudView === 'devcloud' ? 'active' : '') + '" onclick="setCloudView(\'devcloud\')">DevCloud (Shared)</button></div>' +
    (state.cloudView ? '<button class="btn-primary" onclick="uploadFile()">' + svgIcon('outbox', 16) + ' Upload File</button><div class="files-list">' + (files.length ? files.map(function(f) {
      var mine = state.cloudView === 'personal' || f.uploadedBy === state.currentUser.username || canAccess('CoOwner');
      return '<div class="file-item"><div class="file-icon">📄</div><div class="file-info"><div class="file-name">' + escHtml(f.name) + '</div><div class="file-meta">' + escHtml(f.uploadedBy) + ' · ' + escHtml(new Date(f.date).toLocaleDateString()) + ' · ' + escHtml(f.size) + (f.data ? '' : ' · metadata only') + '</div></div><div class="file-actions">' + (f.data ? rowBtn('inbox', 'Download', 'downloadFile(\'' + sid(f.id) + '\')') : '') + (mine ? rowBtn('trash', 'Delete', 'deleteFile(\'' + sid(f.id) + '\')', true) : '') + '</div></div>';
    }).join('') : '<p class="no-files">No files yet</p>') + '</div>' + noteBox('About storage', ['Files up to ' + Math.round(MAX_STORED_FILE / 1024) + ' KB are stored and can be downloaded', 'Larger files are listed by name only']) : '<p class="cloud-prompt">Select a cloud to view files</p>');
}
function uploadFile() {
  if (!state.cloudView) return;
  var input = document.createElement('input'); input.type = 'file'; input.multiple = true;
  input.onchange = function(e) {
    var files = Array.prototype.slice.call(e.target.files); if (!files.length) return;
    var target = state.cloudView, pending = files.length;
    files.forEach(function(file) {
      var rec = { id: 'f_' + Date.now() + '_' + Math.floor(Math.random() * 1e6), name: file.name, uploadedBy: state.currentUser.username, date: new Date().toISOString(), size: file.size < 1024 * 1024 ? Math.max(1, Math.round(file.size / 1024)) + ' KB' : (file.size / 1024 / 1024).toFixed(2) + ' MB', type: file.type || 'Unknown' };
      var done = function() { (target === 'personal' ? state.personalFiles : state.devCloudFiles).push(rec); if (--pending === 0) { showNotification('Files Uploaded', 'Uploaded ' + files.length + ' file(s)', 'success'); logActivity('Files Uploaded', 'Uploaded ' + files.length + ' file(s) to ' + target); commit(); } };
      if (file.size <= MAX_STORED_FILE) { var r = new FileReader(); r.onload = function() { rec.data = r.result; done(); }; r.onerror = done; r.readAsDataURL(file); } else done();
    });
  };
  input.click();
}
function downloadFile(id) {
  var f = byId(currentFiles(), id); if (!f || !f.data) return;
  var a = document.createElement('a'); a.href = f.data; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
}
function deleteFile(id) {
  var f = byId(currentFiles(), id); if (!f || !confirm('Delete this file?')) return;
  if (state.cloudView === 'personal') state.personalFiles = state.personalFiles.filter(function(x) { return x !== f; }); else state.devCloudFiles = state.devCloudFiles.filter(function(x) { return x !== f; });
  logActivity('File Deleted', 'Deleted file: ' + f.name); showNotification('File Deleted', 'File removed successfully', 'success'); commit();
}

/* ═════════════════════════ ADMIN CHAT (+ call controls) ═════════════════════════ */
function renderChatSection(c) {
  var msgs = state.chatMessages.filter(function(m) { return (m.ch || '#general') === '#general'; }).slice(-60);
  var call = state.callState || {};
  var mic = call.micEnabled !== false, vid = call.videoEnabled !== false;
  var elapsed = call.inCall && call.startedAt ? Math.floor((Date.now() - call.startedAt) / 1000) : 0;
  var h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60;
  var timer = (h ? h + ':' : '') + (m < 10 && h ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  c.innerHTML = '<div class="admin-chat"><h3>Team chat <span style="font-weight:400;font-size:.8rem;color:var(--text-muted)">#general · type /help for bot commands</span></h3>' +
    (call.inCall ? '<div class="call-banner"><span class="call-dot"></span> LIVE CALL — ' + escHtml(timer) + ' <span style="opacity:.7">· ' + call.participants.length + ' participant' + (call.participants.length !== 1 ? 's' : '') + '</span></div>' : '') +
    '<div class="chat-messages" id="chatMessages">' + (msgs.length ? msgs.map(function(m) {
    return '<div class="chat-message"><div class="message-avatar">' + escHtml((m.from || '?')[0].toUpperCase()) + '</div><div class="message-content"><div style="font-size:.8rem;color:var(--text-muted)"><strong style="color:var(--text-primary)">' + escHtml(m.from) + '</strong>' + verifiedBadge(m.rank, m.isBot) + ' · ' + escHtml(m.t || '') + '</div><div style="color:var(--text-secondary)">' + fmtChat(m.text) + '</div>' + (m.embed ? '<div class="chat-embed">' + m.embed + '</div>' : '') + '</div></div>';
  }).join('') : '<p class="no-messages">No messages yet. Start chatting!</p>') + '</div>' +
    '<div class="chat-input-area"><input type="text" id="chatInput" class="input-base" placeholder="Type a message…" maxlength="1000" onkeydown="if(event.key===\'Enter\')sendMessage()" /><button class="btn-primary" onclick="sendMessage()" aria-label="Send">' + svgIcon('rocket', 16) + '</button></div>' +
    '<div class="call-controls">' +
    '<button class="call-btn ' + (call.inCall ? 'active' : '') + '" onclick="toggleCall()">' + (call.inCall ? 'End Call' : 'Start Call') + '</button>' +
    (call.inCall ? '<button class="control-btn ' + (mic ? '' : 'disabled') + '" onclick="toggleMic()" title="' + (mic ? 'Mute' : 'Unmute') + '">' + (mic ? svgIcon('mic-on', 16) : svgIcon('mic-off', 16)) + '</button>' : '') +
    (call.inCall ? '<button class="control-btn ' + (vid ? '' : 'disabled') + '" onclick="toggleVideo()" title="Camera">' + (vid ? svgIcon('video-on', 16) : svgIcon('video-off', 16)) + '</button>' : '') +
    (call.inCall ? '<button class="control-btn ' + (call.screenSharing ? 'active' : '') + '" onclick="toggleScreenShare()" title="Share screen">' + (call.screenSharing ? svgIcon('screen-share', 16) : svgIcon('screen', 16)) + '</button>' : '') +
    '</div>' +
    (call.inCall ? '<div class="call-status"><span style="font-weight:700">📞 In call</span>' + (call.screenSharing ? ' <span style="opacity:.7">· 🖥️ Screen sharing active</span>' : '') + '<br>' +
    (call.participants || []).map(function(p) {
      return '<span class="call-participant"><span class="dot ' + (p.mic ? 'dot-green' : 'dot-grey') + '"></span> ' + escHtml(p.name) + (p.screen ? ' <span style="opacity:.7">[screen]</span>' : '') + '</span>';
    }).join('') + '</div>' : '') + '</div>';
  var box = $('chatMessages'); if (box) box.scrollTop = box.scrollHeight;
}
function sendMessage() {
  var inp = $('chatInput'); var text = inp ? inp.value.trim() : '';
  if (!text) return;
  if (!canWriteChannel(channelById('#general'))) { showNotification('No permission', 'You cannot write in #general', 'error'); return; }
  pushChat({ id: 'm' + Date.now(), from: state.currentUser.username, rank: state.currentUser.rank, text: text.slice(0, 1000), t: nowShort(), isBot: false, ch: '#general' });
  if (/^[\/!]/.test(text)) setTimeout(function() { devTBot(text.slice(1), '#general'); }, 350);
}
function toggleCall() {
  var next = !state.callState.inCall;
  state.callState.inCall = next;
  state.callState.startedAt = next ? Date.now() : null;
  state.callState.participants = next ? [{ name: state.currentUser ? state.currentUser.username : 'You', mic: true, video: true, screen: false, joinedAt: Date.now() }] : [];
  state.inCall = next; state.micEnabled = true; state.videoEnabled = true; state.screenSharing = false;
  state.callState.micEnabled = true; state.callState.videoEnabled = true; state.callState.screenSharing = false;
  saveCallState();
  logActivity(state.inCall ? 'Call Started' : 'Call Ended', (state.inCall ? 'Started' : 'Ended') + ' team call');
  renderAdminContent();
}
function toggleMic() {
  state.callState.micEnabled = !state.callState.micEnabled;
  state.micEnabled = state.callState.micEnabled;
  saveCallState();
  renderAdminContent();
}
function toggleVideo() {
  state.callState.videoEnabled = !state.callState.videoEnabled;
  state.videoEnabled = state.callState.videoEnabled;
  saveCallState();
  renderAdminContent();
}
function toggleScreenShare() {
  state.callState.screenSharing = !state.callState.screenSharing;
  state.screenSharing = state.callState.screenSharing;
  saveCallState();
  renderAdminContent();
}

/* ── Realtime call state sync ── */
var _callPollTimer = null;
function startCallPolling() {
  if (_callPollTimer) return;
  _callPollTimer = setInterval(async function() {
    try {
      var res = await apiRequest('/call-state');
      if (res && res.success && res.call) {
        var remote = res.call;
        if (remote.updatedAt !== state.callState.updatedAt) {
          state.callState = remote;
          state.inCall = remote.inCall;
          state.micEnabled = remote.micEnabled;
          state.videoEnabled = remote.videoEnabled;
          state.screenSharing = remote.screenSharing;
          if (state.adminMenuOpen && state.adminSection === 'chat' && typeof renderAdminContent === 'function') renderAdminContent();
          // Also refresh hub chat view so call banner shows even outside admin panel
          if (typeof renderHubChat === 'function') renderHubChat();
          // Refresh meeting modal if open to show updated participants
          if (state.meetingActive && typeof renderMeetingModal === 'function') renderMeetingModal();
        }
      }
    } catch (e) { /* ignore - call state endpoint may not be ready */ }
  }, 3000);
}
function stopCallPolling() {
  if (_callPollTimer) { clearInterval(_callPollTimer); _callPollTimer = null; }
}
async function saveCallState() {
  state.callState.updatedAt = new Date().toISOString();
  state.callState.participants = state.callState.participants || [];
  if (state.callState.inCall && state.currentUser) {
    var me = state.callState.participants.find(function(p) { return p.name === state.currentUser.username; });
    if (!me) state.callState.participants.push({ name: state.currentUser.username, mic: state.callState.micEnabled, video: state.callState.videoEnabled, screen: state.callState.screenSharing, joinedAt: Date.now() });
  }
  try {
    await apiRequest('/call-state', { method: 'POST', body: { state: state.callState, updatedBy: state.currentUser ? state.currentUser.username : 'System' } });
  } catch (e) { console.warn('Call state save failed:', e.message); }
  renderAdminContent();
}

/* ═════════════════════════ USERS / ACTIVITY / MESSAGES / SITE ═════════════════════════ */
function renderUsersSection(c) {
  c.innerHTML = '<h3>User Management</h3><div class="user-list">' + Object.keys(USERS).map(function(n) {
    var u = USERS[n], on = state.currentUser && state.currentUser.username === n;
    return '<div class="user-item"><div class="user-avatar">' + escHtml(n[0]) + '</div><div class="user-info"><div class="user-name">' + escHtml(n) + verifiedBadge(u.rank) + (on ? ' <span style="color:var(--accent-success)">●</span>' : '') + '</div><div class="user-rank">' + rankLabel(u.rank) + ' · ' + escHtml(u.permissions) + '</div></div></div>';
  }).join('') + '</div>';
}
function renderApprenticeSection(c) {
  var apprenticeUsers = Object.keys(USERS).filter(function(n) { return USERS[n].rank === 'Apprentice'; });
  c.innerHTML = '<h3>Apprentice Account Management</h3><p class="admin-role">Create and manage Apprentice accounts. Only CoOwner+ can access this section.</p>' +
    '<div class="admin-btn-row" style="margin-bottom:1rem">' +
    '<button class="btn-primary" onclick="showCreateApprenticeModal()">' + svgIcon('user-plus', 16) + ' Create Apprentice Account</button>' +
    '</div>' +
    '<h4>Existing Apprentice Accounts (' + apprenticeUsers.length + ')</h4>' +
    (apprenticeUsers.length ? apprenticeUsers.map(function(n) {
      var u = USERS[n];
      return '<div class="admin-row" style="align-items:center"><div><strong>' + escHtml(n) + '</strong><div class="meta">Password: ••••••••</div></div><div class="admin-actions">' +
        rowBtn('pencil', 'Reset Password', 'showResetPasswordModal(\'' + sid(n) + '\')') +
        rowBtn('trash', 'Delete Account', 'deleteApprenticeAccount(\'' + sid(n) + '\')', true) +
        '</div></div>';
    }).join('') : '<p class="no-files">No Apprentice accounts yet.</p>');
}
function showCreateApprenticeModal() {
  var html = '<label class="modal-label">Username</label><input type="text" id="apprenticeUsername" class="modal-input" placeholder="Enter username" maxlength="24" />' +
    '<label class="modal-label">Password (leave empty to auto-generate)</label><input type="text" id="apprenticePassword" class="modal-input" placeholder="Auto-generated format: 1 letter + 1 number" maxlength="8" />' +
    '<p class="modal-hint">If you leave the password empty, a random password will be generated using the 1-letter-1-number format.</p>' +
    '<div class="modal-buttons"><button class="btn-primary" onclick="createApprenticeAccount()">Create Account</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>';
  openModal('Create Apprentice Account', html);
}
async function createApprenticeAccount() {
  var username = val('apprenticeUsername').trim();
  var password = val('apprenticePassword').trim();
  if (!username) { showNotification('Error', 'Username is required', 'error'); return; }
  if (USERS[username]) { showNotification('Error', 'Username already exists', 'error'); return; }
  if (!password) {
    // Generate random password: 1 letter + 1 number format
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    var numbers = '0123456789';
    var randomLetter = letters[Math.floor(Math.random() * letters.length)];
    var randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    password = randomLetter + randomNumber;
  }
  var passwordHash = await sha256(password);
  USERS[username] = { passwordHash: passwordHash, rank: 'Apprentice', permissions: 'APPRENTICE', lastSeen: null };
  closeElementModal();
  showNotification('Account Created', 'Apprentice account <b>' + escHtml(username) + '</b> created with password: <code>' + escHtml(password) + '</code>', 'success');
  logActivity('Apprentice Created', 'Created Apprentice account: ' + username);
  renderAdminContent();
  saveToFirestore();
}
function showResetPasswordModal(username) {
  var html = '<label class="modal-label">New Password (leave empty to auto-generate)</label><input type="text" id="newApprenticePassword" class="modal-input" placeholder="Auto-generated format: 1 letter + 1 number" maxlength="8" />' +
    '<p class="modal-hint">If you leave the password empty, a random password will be generated using the 1-letter-1-number format.</p>' +
    '<input type="hidden" id="resetUsername" value="' + escHtml(username) + '" />' +
    '<div class="modal-buttons"><button class="btn-primary" onclick="resetApprenticePassword()">Reset Password</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>';
  openModal('Reset Password for ' + escHtml(username), html);
}
async function resetApprenticePassword() {
  var username = val('resetUsername');
  var password = val('newApprenticePassword').trim();
  if (!USERS[username]) { showNotification('Error', 'User not found', 'error'); return; }
  if (!password) {
    // Generate random password: 1 letter + 1 number format
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    var numbers = '0123456789';
    var randomLetter = letters[Math.floor(Math.random() * letters.length)];
    var randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    password = randomLetter + randomNumber;
  }
  var passwordHash = await sha256(password);
  USERS[username].passwordHash = passwordHash;
  closeElementModal();
  showNotification('Password Reset', 'Password for <b>' + escHtml(username) + '</b> reset to: <code>' + escHtml(password) + '</code>', 'success');
  logActivity('Password Reset', 'Reset password for Apprentice: ' + username);
  renderAdminContent();
  saveToFirestore();
}
function deleteApprenticeAccount(username) {
  if (!confirm('Are you sure you want to delete this Apprentice account? This action cannot be undone.')) return;
  if (!USERS[username]) { showNotification('Error', 'User not found', 'error'); return; }
  if (USERS[username].rank !== 'Apprentice') { showNotification('Error', 'Only Apprentice accounts can be deleted here', 'error'); return; }
  delete USERS[username];
  showNotification('Account Deleted', 'Apprentice account <b>' + escHtml(username) + '</b> has been deleted', 'success');
  logActivity('Apprentice Deleted', 'Deleted Apprentice account: ' + username);
  renderAdminContent();
  saveToFirestore();
}
function renderActivitySection(c) {
  c.innerHTML = '<h3>Activity Log</h3>' + (state.activityLog.length ? state.activityLog.map(function(a) {
    var ic = a.action.indexOf('Login') !== -1 ? '🔓' : a.action.indexOf('Logout') !== -1 ? '🔒' : a.action.indexOf('Added') !== -1 || a.action.indexOf('Created') !== -1 ? '➕' : a.action.indexOf('Deleted') !== -1 ? '🗑️' : a.action.indexOf('Edited') !== -1 ? '✏️' : '📝';
    return '<div class="activity-item"><div class="activity-icon">' + ic + '</div><div class="activity-content"><div class="activity-text"><strong>' + escHtml(a.user) + '</strong> ' + escHtml(a.details) + '</div><div class="activity-time">' + escHtml(a.timestamp) + '</div></div></div>';
  }).join('') : '<p class="no-files">No activity yet</p>');
}
function renderMessagesSection(c) {
  c.innerHTML = '<h3>Contact Messages (' + state.contactMessages.length + ')</h3>' + (state.contactMessages.length ? state.contactMessages.map(function(m) {
    return '<div class="admin-row" style="align-items:flex-start"><div><strong>' + escHtml(m.name) + '</strong>' + (m.email ? ' <span class="meta" style="display:inline">&lt;' + escHtml(m.email) + '&gt;</span>' : '') + '<div style="margin:.4rem 0;color:var(--text-secondary);font-size:.9rem">' + escHtml(m.message).replace(/\n/g, '<br>') + '</div><div class="meta">' + escHtml(new Date(m.timestamp).toLocaleString()) + '</div></div><div class="admin-actions">' + rowBtn('trash', 'Delete message', 'deleteContactMessage(\'' + sid(m.id) + '\')', true) + '</div></div>';
  }).join('') : '<p class="no-files">No messages yet</p>');
}
function deleteContactMessage(id) {
  if (!requireRank('Developer', 'Deleting messages')) return;
  var m = byId(state.contactMessages, id); if (!m || !confirm('Delete this message?')) return;
  state.contactMessages = state.contactMessages.filter(function(x) { return x !== m; }); logActivity('Message Deleted', 'Deleted a contact message'); commit();
}
function renderSuggestionsSection(c) {
  if (!canAccess('Apprentice')) { c.innerHTML = '<div class="admin-overview"><h3>Access Restricted</h3><p class="admin-role">Apprentice+ rank required.</p></div>'; return; }
  c.innerHTML = '<h3>Suggestion Manager (' + state.suggestions.length + ')</h3>' + (state.suggestions.length ? state.suggestions.map(function(s) {
    var statusBadge = s.status === 'approved' ? '<span style="color:var(--accent-success);font-size:0.75rem;font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(56,239,125,0.15)">✓ Approved</span>' : s.status === 'denied' ? '<span style="color:var(--accent-error);font-size:0.75rem;font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(245,87,108,0.15)">✗ Denied</span>' : '<span style="color:var(--accent-warning);font-size:0.75rem;font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(251,191,36,0.15)">⏳ Pending</span>';
    var actions = s.status === 'pending' ? rowBtn('check', 'Approve', 'window.approveSuggestion(\'' + sid(s.id) + '\')') + rowBtn('x-mark', 'Deny', 'window.denySuggestion(\'' + sid(s.id) + '\')', true) : rowBtn('trash', 'Delete', 'deleteSuggestion(\'' + sid(s.id) + '\')', true);
    return '<div class="admin-row" style="align-items:flex-start"><div><div style="margin:.4rem 0"><strong>' + escHtml(s.author) + '</strong> ' + statusBadge + '</div><div style="margin:.4rem 0;color:var(--text-secondary);font-size:.9rem">' + escHtml(s.text) + '</div><div class="meta">' + escHtml(s.timestamp) + (s.approvedBy ? ' · Approved by ' + escHtml(s.approvedBy) : '') + (s.deniedBy ? ' · Denied by ' + escHtml(s.deniedBy) : '') + '</div></div><div class="admin-actions">' + actions + '</div></div>';
  }).join('') : '<p class="no-files">No suggestions yet</p>');
}
function deleteSuggestion(id) {
  if (!requireRank('Apprentice', 'Deleting suggestions')) return;
  var s = byId(state.suggestions, id); if (!s || !confirm('Delete this suggestion?')) return;
  state.suggestions = state.suggestions.filter(function(x) { return x !== s; }); logActivity('Suggestion Deleted', 'Deleted suggestion from ' + s.author); commit();
}
window.deleteSuggestion = deleteSuggestion;
function renderSiteSection(c) {
  if (!canAccess('CoOwner')) { c.innerHTML = '<div class="admin-overview"><h3>Access Restricted</h3><p class="admin-role">CoOwner+ rank required.</p></div>'; return; }
  var n = Object.keys(state.textOverrides).length;
  c.innerHTML = '<h3>Site settings</h3><label class="modal-label">Discord invite URL</label><input type="text" id="siteDiscord" class="modal-input" placeholder="https://discord.gg/…" value="' + escHtml(state.siteSettings.discordUrl || '') + '" /><label class="modal-label">Contact email</label><input type="text" id="siteEmail" class="modal-input" placeholder="contact@example.com" value="' + escHtml(state.siteSettings.contactEmail || '') + '" /><div class="admin-btn-row"><button class="btn-primary" onclick="saveSiteSettings()">Save settings</button></div>' +
    '<h4>Edited texts</h4><p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:.8rem">' + n + ' text' + (n === 1 ? '' : 's') + ' customised with “Edit Texts” mode.</p>' + (n ? '<button class="btn-ghost" style="border:1px solid var(--ov-12)" onclick="resetTextOverrides()">Reset all edited texts</button>' : '') +
    '<h4>Raid mode</h4><label style="display:flex;align-items:center;gap:.6rem;color:var(--text-secondary)"><input type="checkbox" ' + (state.raidMode ? 'checked' : '') + ' onchange="setRaidMode(this.checked)" /> Disable public submissions (suggestions & contact form)</label>';
}
function saveSiteSettings() {
  if (!requireRank('CoOwner', 'Site settings')) return;
  var d = val('siteDiscord'), m = val('siteEmail');
  if (d && !/^https?:\/\//i.test(d)) { showNotification('Invalid URL', 'The Discord link must start with http(s)://', 'error'); return; }
  if (m && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) { showNotification('Invalid email', 'Please check the email address', 'error'); return; }
  state.siteSettings.discordUrl = d; state.siteSettings.contactEmail = m;
  logActivity('Settings Edited', 'Updated site settings'); showNotification('Saved', 'Site settings updated', 'success'); commit();
}
function setRaidMode(on) { if (!requireRank('CoOwner', 'Raid mode')) return; state.raidMode = !!on; logActivity('Raid Mode', 'Raid mode ' + (on ? 'ON' : 'OFF')); commit(); }

/* ═════════════════════════ EDIT EVERY TEXT (CoOwner+) ═════════════════════════
   Any visible text on the public site (navbar, pages, footer) can be edited in
   place. Edits are stored as  original text → new text  and re-applied on every
   render, so they survive navigation, reloads and code updates.                  */
var TEXT_ROOT_SELECTORS = ['.navbar', '#pageContent', '.site-footer', '#mobileNavLinks'];
var TEXT_SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, CODE: 1, NOSCRIPT: 1 };
function textNodesIn(root) {
  var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
  while ((n = w.nextNode())) {
    var t = n.nodeValue.trim(); if (!t) continue;
    var p = n.parentElement; if (!p || TEXT_SKIP_TAGS[p.tagName] || p.closest('svg,[data-no-edit],#editTextsBtn,.element-controls,.card-controls,.stat-number,.lang-selector,.mobile-lang-wrap')) continue;
    if (/^[\d\s.,%+\/:\-–·]+$/.test(t)) continue;      // pure numbers / dates
    out.push(n);
  }
  return out;
}
function applyTextOverrides() {
  var ov = state.textOverrides || {}, edit = !!state.textEditMode, hasAny = Object.keys(ov).length > 0;
  if (!edit && !hasAny) return;
  TEXT_ROOT_SELECTORS.forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(root) {
      textNodesIn(root).forEach(function(node) {
        var raw = node.nodeValue, orig = raw.trim();
        var shown = Object.prototype.hasOwnProperty.call(ov, orig) ? ov[orig] : orig;
        if (!edit) { if (shown !== orig) node.nodeValue = raw.replace(orig, function() { return shown; }); return; }
        var lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
        var span = document.createElement('span');
        span.setAttribute('data-orig', orig); span.textContent = shown; span.spellcheck = true;
        span.contentEditable = 'true'; span.setAttribute('role', 'textbox'); span.setAttribute('aria-label', 'Editable text');
        var frag = document.createDocumentFragment();
        if (lead) frag.appendChild(document.createTextNode(lead));
        frag.appendChild(span);
        if (trail) frag.appendChild(document.createTextNode(trail));
        node.parentNode.replaceChild(frag, node);
      });
    });
  });
}
function setTextEditMode(on) {
  on = !!on && canEditAllText();
  if (state.textEditMode === on) return;
  state.textEditMode = on;
  document.body.classList.toggle('text-edit-on', on);
  var b = $('editTextsBtn'); if (b) b.classList.toggle('on', on);
  renderNavigation(); renderPage();     // re-render from source, then re-apply texts in the right mode
  if (!on) {                              // unwrap leftovers (e.g. footer isn't re-rendered) so nothing stays editable
    document.querySelectorAll('[data-orig]').forEach(function(sp) { sp.replaceWith(document.createTextNode(sp.textContent)); });
    document.querySelectorAll('[contenteditable]').forEach(function(el) { if (!el.closest('[data-keep-editable]')) el.removeAttribute('contenteditable'); });
    document.body.normalize(); applyTextOverrides();
  }
  if (on) showNotification('Edit mode on', 'Click any text to edit it. Enter to confirm.', 'info');
}
function toggleTextEditMode() {
  if (!canEditAllText()) { showNotification('Access Denied', 'Editing all texts requires CoOwner+', 'error'); return; }
  setTextEditMode(!state.textEditMode);
}
function commitTextEdit(span) {
  var orig = span.getAttribute('data-orig'); if (orig == null) return;
  var txt = span.textContent.replace(/\s+/g, ' ').trim();
  var had = Object.prototype.hasOwnProperty.call(state.textOverrides, orig) ? state.textOverrides[orig] : orig;
  if (!txt || txt === orig) { delete state.textOverrides[orig]; txt = orig; } else state.textOverrides[orig] = txt.slice(0, 500);
  if (txt === had) { span.textContent = txt; return; }
  document.querySelectorAll('[data-orig]').forEach(function(s) { if (s.getAttribute('data-orig') === orig && s !== span) s.textContent = txt; });
  span.textContent = txt;
  logActivity('Text Edited', 'Changed “' + orig.slice(0, 40) + '” to “' + txt.slice(0, 40) + '”');
  scheduleSave(); flashSaveIndicator('saving', 'Saving…');
}
function resetTextOverrides() {
  if (!requireRank('CoOwner', 'Resetting texts') || !confirm('Reset every edited text back to its original?')) return;
  state.textOverrides = {}; logActivity('Text Edited', 'Reset all edited texts'); renderNavigation(); commit();
}
/* in edit mode: clicks edit instead of triggering buttons/links; Enter/Esc confirm */
document.addEventListener('click', function(e) {
  if (!state.textEditMode) return;
  if (e.target.closest('#editTextsBtn, #adminBtn, #themeBtn, .dev-mode-toggle')) return;
  if (e.target.closest('.navbar, #pageContent, .site-footer, #mobileNavLinks')) { if (e.target.closest('button, a, [onclick]')) e.preventDefault(); e.stopPropagation(); }
}, true);
document.addEventListener('focusout', function(e) { if (state.textEditMode && e.target && e.target.hasAttribute && e.target.hasAttribute('data-orig')) commitTextEdit(e.target); });
document.addEventListener('keydown', function(e) {
  if (!state.textEditMode || !e.target || !e.target.hasAttribute || !e.target.hasAttribute('data-orig')) return;
  if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); e.target.blur(); }
  else if (e.key === ' ') e.stopPropagation();       // space must type a space, not "click" the parent button
}, true);
document.addEventListener('paste', function(e) {      // paste as plain text only
  if (!state.textEditMode || !e.target || !e.target.hasAttribute || !e.target.hasAttribute('data-orig')) return;
  e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text'); document.execCommand('insertText', false, t.replace(/\s+/g, ' '));
});
