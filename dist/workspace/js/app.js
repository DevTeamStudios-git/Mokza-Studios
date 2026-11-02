/* ========================================================================
   MOKZA STUDIOS — APPLICATION LOGIC
   ======================================================================== */

/* ── STATE ── */
const state = {
  currentPage: 'home',
  theme: 'dark',
  devModeActive: false,
  currentUser: null,
  announcements: [],
  suggestions: [],
  projects: [],
  tasks: [],
  chatMessages: [],
  activityLog: [],
  featureCards: {
    home: [], about: [], contact: [], community: [], roblox: [], creations: [], tos: []
  },
  navigationLinks: [
    { id: 'nav_home', label: 'Home', page: 'home', enabled: true, author: 'System', minRank: null },
    { id: 'nav_about', label: 'About Us', page: 'about', enabled: true, author: 'System', minRank: null },
    { id: 'nav_contact', label: 'Contact', page: 'contact', enabled: true, author: 'System', minRank: null },
    { id: 'nav_community', label: 'Community', page: 'community', enabled: true, author: 'System', minRank: null },
    { id: 'nav_roblox', label: 'Roblox', page: 'roblox', enabled: true, author: 'System', minRank: null },
    { id: 'nav_creations', label: 'Creations', page: 'creations', enabled: true, author: 'System', minRank: null },
    { id: 'nav_tos', label: 'Terms of Service', page: 'tos', enabled: true, author: 'System', minRank: null },
    { id: 'nav_workspace', label: 'Workspace', page: 'workspace', enabled: true, author: 'System', minRank: 'Apprentice' }
  ],
  pageViews: {},
  raidMode: false,
  /* restored features */
  customElements: [],
  personalFiles: [],
  devCloudFiles: [],
  contactMessages: [],
  textOverrides: {},
  siteSettings: { discordUrl: '', contactEmail: '' },
  tosContent: {
    lastUpdated: new Date().toISOString(),
    content: `<h1>Terms of Service</h1>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using Mokza Studios' website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
      
      <h2>2. Use of Services</h2>
      <p>You may use our services for lawful purposes only. You agree not to:</p>
      <ul>
        <li>Use the services for any illegal purpose</li>
        <li>Violate any international, federal, provincial, or local laws</li>
        <li>Infringe upon our intellectual property or that of others</li>
        <li>Harass, abuse, or harm other users</li>
        <li>Submit false, misleading, or fraudulent information</li>
      </ul>
      
      <h2>3. User Content</h2>
      <p>By submitting content (suggestions, messages, etc.) to our platform, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content. You represent that you have the right to grant such license.</p>
      
      <h2>4. Privacy Policy</h2>
      <p>Your privacy is important to us. Please review our Privacy Policy, which also governs our services and explains how we collect, use, and protect your data.</p>
      
      <h2>5. Disclaimer</h2>
      <p>Our services are provided "as is" without warranties of any kind. We do not guarantee that the services will be uninterrupted, secure, or error-free.</p>
      
      <h2>6. Limitation of Liability</h2>
      <p>Mokza Studios shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.</p>
      
      <h2>7. Changes to Terms</h2>
      <p>We reserve the right to modify these terms at any time. Continued use of our services after such modifications constitutes acceptance of the updated terms.</p>
      
      <h2>8. Contact</h2>
      <p>If you have questions about these Terms of Service, please contact us through our contact page.</p>`
  },
  translations: {
    en: {
      navHome: 'Home',
      navAbout: 'About Us',
      navContact: 'Contact',
      navCommunity: 'Community',
      navRoblox: 'Roblox',
      navCreations: 'Creations',
      navTOS: 'Terms of Service',
      navWorkspace: 'Workspace',
      suggestionTitle: 'Share Your Suggestions',
      suggestionDesc: 'We value your feedback! Help us improve by sharing your ideas.',
      suggestionSubmit: 'Submit Suggestion',
      suggestionPlaceholder: 'Tell us your ideas, feature requests, or feedback...',
      suggestionEmail: 'Email (optional) - receive notifications when your suggestion is reviewed'
    },
    es: {
      navHome: 'Inicio',
      navAbout: 'Sobre Nosotros',
      navContact: 'Contacto',
      navCommunity: 'Comunidad',
      navRoblox: 'Roblox',
      navCreations: 'Creaciones',
      navTOS: 'Términos de Servicio',
      navWorkspace: 'Espacio de Trabajo',
      suggestionTitle: 'Comparte tus Sugerencias',
      suggestionDesc: '¡Valoramos tus comentarios! Ayúdanos a mejorar compartiendo tus ideas.',
      suggestionSubmit: 'Enviar Sugerencia',
      suggestionPlaceholder: 'Cuéntanos tus ideas, solicitudes de funciones o comentarios...',
      suggestionEmail: 'Correo electrónico (opcional) - recibe notificaciones cuando se revise tu sugerencia'
    },
    fr: {
      navHome: 'Accueil',
      navAbout: 'À Propos',
      navContact: 'Contact',
      navCommunity: 'Communauté',
      navRoblox: 'Roblox',
      navCreations: 'Créations',
      navTOS: 'Conditions d\'Utilisation',
      navWorkspace: 'Espace de Travail',
      suggestionTitle: 'Partagez Vos Suggestions',
      suggestionDesc: 'Nous apprécions vos commentaires! Aidez-nous à nous améliorer en partageant vos idées.',
      suggestionSubmit: 'Envoyer Suggestion',
      suggestionPlaceholder: 'Dites-nous vos idées, demandes de fonctionnalités ou commentaires...',
      suggestionEmail: 'E-mail (optionnel) - recevez des notifications lorsque votre suggestion est examinée'
    }
  },
  currentLanguage: 'en',
  seeded: {},
  /* per-session / per-user UI state (never synced to the shared database) */
  editMode: false,
  textEditMode: false,
  adminMenuOpen: false,
  adminSection: 'overview',
  cloudView: null,
  searchQuery: '',
  chatChannel: '#general',
  inCall: false,
  micEnabled: true,
  videoEnabled: true,
  screenSharing: false
};
var SESSION_STARTED = Date.now();
var DEFAULT_NAV = JSON.parse(JSON.stringify(state.navigationLinks));

const USERS = {
  'ThéoDevO': { passwordHash: '0dfc6b27a925b6c5e47750a47906abc201310200dd01a82d6a683f96e4e41605', rank: 'Owner', permissions: 'ALL' },
  'GabrielDevCoO': { passwordHash: 'eaf5607c0ae46bd62bc68689a42b7a11e57d3f17ed60c26d399857d5bb59d6b8', rank: 'CoOwner', permissions: 'ALL' },
  'NeuraXIDev': { passwordHash: 'f74590b85aa9394eb675739ab1364e795059599bcc6bf31b1491268459ab02ee', rank: 'Developer', permissions: 'DEVELOPER' },
  'AprenticeDev': { passwordHash: '7d94c0ca4536bae28c3de2a369bfe303a3f2a8081196ed5dab0578769c321487', rank: 'Apprentice', permissions: 'APPRENTICE' }
};

const AUTH_MAX_ATTEMPTS = 5;
const AUTH_LOCKOUT_MS = 60000;
let _authAttempts = 0;
let _authLockedUntil = 0;

/* ── SVG ICON HELPERS ── */
function svgIcon(name, size = 24, color = 'currentColor') {
  const icons = {
    'game': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"/></svg>',
    'robot': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M9 10H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2m12 0h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2"/></svg>',
    'computer': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/></svg>',
    'chart': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    'clipboard': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><rect x="8" y="6" width="8" height="12" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
    'memo': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    'chat': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    'wrench': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 1.4l1.6 1.6a1 1 0 0 0 1.4 1.4l1.6 1.6a1 1 0 0 0 1.4 1.4l1.6 1.6a1 1 0 0 0 1.4 1.4l1.6 1.6a1 1 0 0 0 1.4 1.4l1.6 1.6a1 1 0 0 0 1.4 1.4l-7.6-7.6a1 1 0 0 0-1.4-1.4l-1.6-1.6a1 1 0 0 0-1.4-1.4l-1.6-1.6a1 1 0 0 0-1.4-1.4l-1.6-1.6a1 1 0 0 0-1.4-1.4z"/><path d="M11 14l4-4m0 0l-4-4m4 4l4 4"/></svg>',
    'chart-up': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    'lock': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    'unlock': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><path d="M7 7h5"/></svg>',
    'trash': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    'plus': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    'pencil': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M17 3l4 4M3.5 17.5l2.7 2.7M3 17.5v-1a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1V21a1 1 0 0 0 1 1h4.5a1 1 0 0 0 1-1v-4.5a1 1 0 0 0-1-1H14a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1z"/></svg>',
    'building': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="21"/><line x1="15" y1="21" x2="15" y2="21"/></svg>',
    'save': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8"/><polyline points="21 13 17 17"/><polyline points="17 13 14 14"/></svg>',
    'inbox': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><polyline points="7 17 12 12 17 17"/><polyline points="7 6 12 11 17 6"/><line x1="12" y1="17" x2="12" y2="11"/><line x1="2" y1="17" x2="22" y2="17"/><line x1="2" y1="11" x2="22" y2="11"/></svg>',
    'outbox': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><polyline points="17 7 12 12 7 7"/><polyline points="7 17 12 12 17 17"/><line x1="12" y1="17" x2="12" y2="7"/><line x1="2" y1="17" x2="22" y2="17"/><line x1="2" y1="11" x2="22" y2="11"/></svg>',
    'broom': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M5 17h14v2H5z"/><line x1="5" y1="17" x2="5.183" y2="16.817"/></svg>',
    'gear': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 1-1-1.51V21a2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 1 9 19.4a1.65 1.65 0 0 1-1.51 1H3a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 1 0-3.42v-.09a1.65 1.65 0 0 1 1-1.51a1.65 1.65 0 0 1 1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 1 1-1.51 1.65 1.65 0 0 1 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 1-1 1.51V3a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 1 1.51 1H21a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 1-1.51 1z"/></svg>',
    'x-mark': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    'bell': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    'rocket': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    'people': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    'sparkles': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M20.925 12.204a1 1 0 0 1-.835 0l-.889-.445a1 1 0 0 0-.166-1.17l-.35-.889a1 1 0 0 0-1.17-.166L17.2 9.59a1 1 0 0 0 0-1.17l-.445-.889a1 1 0 0 0-1.17-.166L14.2 7.343a1 1 0 0 0-1.17 0l-.445.889a1 1 0 0 0-.166 1.17l-.35.889a1 1 0 0 0 0 1.17l.889.445a1 1 0 0 1 .835 0l.889-.445a1 1 0 0 1 1.17.166l.35.889a1 1 0 0 0 1.17.166l.445-.889a1 1 0 0 1 .166-1.17zM10 13a1 1 0 1 0 0-2V3a1 1 0 1 0 0 2zM21 13a1 1 0 1 0 0-2v-8a1 1 0 1 0 0 2z"/></svg>',
    'target': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    'construction': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M9 17h6v2H9z"/><path d="M9 3v2h6V3zm-2 4h10v10H7z"/><path d="M9 3V1v2h6V3z"/></svg>',
    'search': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    'person': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'sun': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    'moon': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    'circle-green': '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+size/4+'" fill="#38ef7d"/>',
    'download': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    'upload': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 10 12 15 7 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    'cloud': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'chevron-up': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
    'chevron-down': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
    'calendar': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    'check': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    'x': '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };
  return icons[name] || '<span style="font-size:'+size+'px">?</span>';
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

function canAccess(rank) {
  const ranks = { Owner: 3, CoOwner: 2, Developer: 1, Apprentice: 0 };
  const userRank = state.currentUser ? ranks[state.currentUser.rank] : -1;
  return userRank >= ranks[rank];
}

function canManageCards() { return canAccess('Developer'); }
function canEditElement(author) { return !!state.currentUser && (state.currentUser.username === author || canAccess('Developer')); }
function canDeleteElement() { return canAccess('Developer'); }
function canEditAllText() { return canAccess('CoOwner'); }
function safeUrl(u) { return typeof u === 'string' && /^(https?:\/\/|mailto:)/i.test(u.trim()) ? u.trim() : ''; }
/* ids go into inline handlers: strip anything that could break out of a JS string */
function sid(x) { return String(x == null ? '' : x).replace(/[^\w.-]/g, ''); }
function byId(list, id) { return (list || []).find(function(x) { return sid(x.id) === sid(id); }); }
function afterRender() { if (typeof applyTextOverrides === 'function') applyTextOverrides(); }

function showNotification(title, message, type = 'info') {
  const container = document.getElementById('notificationContainer');
  const id = Date.now();
  const notif = document.createElement('div');
  notif.className = 'notification ' + type;
  var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  notif.innerHTML = '<div class="notification-icon">' + icon + '</div><div class="notification-content"><div class="notification-title">' + escHtml(title) + '</div><div class="notification-message">' + escHtml(message) + '</div></div>';
  container.appendChild(notif);
  setTimeout(function() {
    notif.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(function() { if (container.contains(notif)) container.removeChild(notif); }, 300);
  }, 4000);
}

function logActivity(action, details) {
  state.activityLog.unshift({ id: Date.now(), user: state.currentUser ? state.currentUser.username : 'System', action: action, details: details, timestamp: new Date().toLocaleString() });
  if (state.activityLog.length > 50) state.activityLog = state.activityLog.slice(0, 50);
}

/* ── AUTH ── */
async function sha256(message) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function isAuthLocked() {
  if (_authLockedUntil && Date.now() < _authLockedUntil) return true;
  if (_authLockedUntil && Date.now() >= _authLockedUntil) { _authAttempts = 0; _authLockedUntil = 0; }
  return false;
}

// ── USER AUTHENTICATION (OAuth + Dev Team) ──
function showUserLoginModal() {
  document.getElementById('authModal').innerHTML = '<div class="modal"><div class="modal-header"><h2>Sign In</h2><button class="modal-close" onclick="closeAuthModal()">' + svgIcon('x-mark', 20) + '</button></div><div class="modal-body"><div class="auth-tabs"><button class="auth-tab active" onclick="switchAuthTab(\'oauth\')">Sign In</button><button class="auth-tab" onclick="switchAuthTab(\'dev\')">Dev Team</button></div><div id="oauthSection" class="auth-section"><p style="margin-bottom:1.5rem;color:var(--text-secondary)">Sign in with your preferred account to track your suggestions and receive notifications.</p><button class="btn btn-primary" style="width:100%;margin-bottom:0.75rem;background:#5865F2;border:none;" onclick="oauthLogin(\'discord\')"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:0.5rem;vertical-align:text-bottom;"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0 .032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084.028 19.868 19.868 0 0 0 6.017-3.03.077.077 0 0 0 .032-.054c.5-1.4.87-2.841 1.065-4.286a.077.077 0 0 0-.04-.058 18.704 18.704 0 0 0-5.922-3.03.077.077 0 0 0-.084-.028 19.747 19.747 0 0 0-5.993 3.03.07.07 0 0 0-.032.054c.46 1.45.81 2.891 1.065 4.286a.077.077 0 0 0-.04.058 18.953 18.953 0 0 0-5.922 3.03.077.077 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057z"/></svg> Sign in with Discord</button><button class="btn btn-primary" style="width:100%;background:#4285F4;border:none;" onclick="oauthLogin(\'google\')"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:0.5rem;vertical-align:text-bottom;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Sign in with Google</button><p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:1rem;">By signing in, you agree to our <a href="#" onclick="changePage(\'tos\');closeAuthModal();return false;">Terms of Service</a></p></div><div id="devSection" class="auth-section hidden"><div class="label-base">Security Code</div><input type="password" id="securityCodeInput" class="input-base" placeholder="Enter security code" /><div class="label-base" style="margin-top:1rem;">Credentials</div><input type="text" id="usernameInput" class="input-base" placeholder="Username" /><input type="password" id="passwordInput" class="input-base" placeholder="Password" /><div class="modal-footer"><button class="btn-primary" onclick="handleAuthSubmit()">Login</button><button class="btn-ghost" onclick="closeAuthModal()">Cancel</button></div></div></div></div>';
  document.getElementById('authModal').classList.remove('hidden');
}

function switchAuthTab(tab) {
  var oauthSection = document.getElementById('oauthSection');
  var devSection = document.getElementById('devSection');
  var tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  if (tab === 'oauth') {
    oauthSection.classList.remove('hidden');
    devSection.classList.add('hidden');
    tabs[0].classList.add('active');
  } else {
    oauthSection.classList.add('hidden');
    devSection.classList.remove('hidden');
    tabs[1].classList.add('active');
  }
}

function oauthLogin(provider) {
  // TODO: Implement OAuth flow
  // This requires backend OAuth endpoints and API keys
  showNotification('Coming Soon', provider.charAt(0).toUpperCase() + provider.slice(1) + ' OAuth login will be available soon!', 'info');
  console.log('[OAuth] Provider:', provider);
  // Example implementation:
  // window.location.href = '/api/auth/' + provider;
}
window.oauthLogin = oauthLogin;
window.switchAuthTab = switchAuthTab;

async function handleAuthSubmit() {
  if (isAuthLocked()) {
    var remaining = Math.ceil((_authLockedUntil - Date.now()) / 1000);
    showNotification('Locked', 'Too many attempts. Try again in ' + remaining + 's', 'error');
    return;
  }
  var code = document.getElementById('securityCodeInput').value;
  var hashed = await sha256(code);
  var SECURITY_CODE_HASH = 'bbf426ea8e5c0bf78035833c75064f60f810db695c3b4f16cecbe3ac5c20e957';
  if (hashed !== SECURITY_CODE_HASH) {
    _authAttempts++;
    showNotification('Failed', 'Wrong code. ' + (AUTH_MAX_ATTEMPTS - _authAttempts) + ' attempt(s) left', 'error');
    if (_authAttempts >= AUTH_MAX_ATTEMPTS) {
      _authLockedUntil = Date.now() + AUTH_LOCKOUT_MS;
      logActivity('Security', 'Auth locked after too many failed attempts');
    }
    return;
  }
  var username = document.getElementById('usernameInput').value.trim();
  var password = document.getElementById('passwordInput').value;
  var user = USERS[username];
  if (!user) { showNotification('Failed', 'Invalid credentials', 'error'); return; }
  var pwhash = await sha256(password);
  if (pwhash !== user.passwordHash) {
    _authAttempts++;
    showNotification('Failed', 'Invalid credentials', 'error');
    return;
  }
  _authAttempts = 0; _authLockedUntil = 0;
  state.currentUser = { username: username, rank: user.rank, permissions: user.permissions };
  state.devModeActive = true;
  document.getElementById('devToggle').classList.add('active');
  closeAuthModal();
  showNotification('Welcome!', 'Logged in as ' + username + ' (' + user.rank + ')', 'success');
  logActivity('User Login', username + ' logged in');
  updateAuthUI();
  renderPage();
  saveToFirestore();
}

function showAuthModal() {
  showUserLoginModal();
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function handleLogout() {
  var name = state.currentUser ? state.currentUser.username : 'User';
  state.currentUser = null;
  state.devModeActive = false;
  state.editMode = false;
  document.getElementById('devToggle').classList.remove('active');
  showNotification('Logged Out', 'Successfully logged out', 'info');
  logActivity('User Logout', name + ' logged out');
  updateAuthUI();
  renderPage();
}

/* Shows/hides everything that depends on who is signed in */
function updateAuthUI() {
  var u = state.currentUser;
  var adminBtn = document.getElementById('adminBtn'); if (adminBtn) adminBtn.classList.toggle('hidden', !u);
  var editBtn = document.getElementById('editTextsBtn'); if (editBtn) editBtn.classList.toggle('hidden', !canEditAllText());
  var dev = document.getElementById('devToggle'); if (dev) dev.classList.toggle('active', !!u);
  if (!u) {
    if (typeof closeAdminPanel === 'function') closeAdminPanel();
    if (typeof setTextEditMode === 'function') setTextEditMode(false);
    closeOfficeHub();
  } else if (!canEditAllText() && typeof setTextEditMode === 'function') { setTextEditMode(false); }
  renderNavigation();
}

function toggleDevMode() {
  if (!state.devModeActive) showAuthModal();
  else handleLogout();
}

/* ── PERSISTENCE (shared site data only — never sessions or personal UI state) ── */
var SESSION_KEYS = ['currentPage','theme','devModeActive','currentUser','editMode','textEditMode','adminMenuOpen','adminSection','cloudView','searchQuery','chatChannel','inCall','micEnabled','videoEnabled','screenSharing'];
var LOCAL_KEY = 'mokza_state_v2';

function persistable() {
  var out = {};
  Object.keys(state).forEach(function(k) { if (SESSION_KEYS.indexOf(k) === -1) out[k] = state[k]; });
  out.savedAt = new Date().toISOString();
  return out;
}
function applyPersisted(data) {
  if (!data || typeof data !== 'object') return;
  Object.keys(data).forEach(function(k) {
    if (SESSION_KEYS.indexOf(k) !== -1 || k === 'savedAt' || k === 'exportDate') return;
    state[k] = data[k];
  });
  ensureDefaults();
}
function saveLocal() { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(persistable())); } catch (e) {} }
function loadLocal() {
  try { var raw = localStorage.getItem(LOCAL_KEY); if (raw) { applyPersisted(JSON.parse(raw)); return true; } } catch (e) {}
  return false;
}

async function apiRequest(path, options) {
  options = options || {};
  options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  if (options.body && typeof options.body !== 'string') options.body = JSON.stringify(options.body);
  const res = await fetch('/api' + path, options);
  if (!res.ok) throw new Error('API ' + res.status);
  return res.json();
}

var _apiOnline = null;
var _saveIndicatorTimer = null;
function flashSaveIndicator(cls, text) {
  var el = document.getElementById('autoSaveIndicator');
  var tx = document.getElementById('autoSaveText');
  if (!el || !tx) return;
  tx.textContent = text;
  el.className = 'visible ' + cls;
  clearTimeout(_saveIndicatorTimer);
  _saveIndicatorTimer = setTimeout(function() { el.className = ''; }, 1800);
}

async function saveToFirestore() {
  saveLocal();                       // always keep a local copy so nothing is lost if the API is down
  flashSaveIndicator('saving', 'Saving…');
  try {
    await apiRequest('/website-state/save', { method: 'POST', body: { data: persistable() } });
    _apiOnline = true;
    flashSaveIndicator('saved', 'Saved');
  } catch (e) {
    _apiOnline = false;
    console.warn('Cloud save failed (kept locally):', e.message);
    flashSaveIndicator('error', 'Saved locally');
  }
}

async function loadFromFirestore() {
  loadLocal();
  try {
    var result = await apiRequest('/website-state');
    _apiOnline = true;
    if (result && result.state) { applyPersisted(result.state); return true; }
  } catch (e) { _apiOnline = false; console.warn('Load failed (using local copy):', e.message); }
  return false;
}

/* ── DEFAULT CONTENT (seeded once; admins can then edit/delete freely) ── */
var DEFAULT_CARDS = {
  home: [
    { icon: 'game', title: 'Game Development', description: 'Creating original, engaging, and memorable gaming experiences.' },
    { icon: 'robot', title: 'Roblox Projects', description: 'Building immersive Roblox experiences for millions of players.' },
    { icon: 'computer', title: 'Software Development', description: 'Designing, building, and deploying software solutions.' }
  ],
  about: [
    { icon: 'target', title: 'Our Mission', description: 'To create original games that entertain players, inspire creativity, and leave a lasting impression.' },
    { icon: 'sparkles', title: 'Our Values', description: 'Creativity, Quality, Originality, Community, Growth.' }
  ],
  roblox: [
    { icon: 'game', title: 'Mokza Adventure', description: 'An immersive adventure game built in Roblox Studio.' }
  ],
  community: [], contact: []
};
function ensureDefaults() {
  if (!state.featureCards || typeof state.featureCards !== 'object') state.featureCards = {};
  ['home','about','contact','community','roblox','creations'].forEach(function(pg) { if (!Array.isArray(state.featureCards[pg])) state.featureCards[pg] = []; });
  if (!state.seeded || typeof state.seeded !== 'object') state.seeded = {};
  Object.keys(DEFAULT_CARDS).forEach(function(pg) {
    if (!state.seeded[pg]) {
      state.seeded[pg] = true;
      if (state.featureCards[pg].length === 0) {
        state.featureCards[pg] = DEFAULT_CARDS[pg].map(function(c, i) { return { id: 'card_' + pg + '_seed' + i, icon: c.icon, title: c.title, description: c.description, link: null, author: 'System', order: i }; });
      }
    }
  });
  ['announcements','suggestions','projects','tasks','chatMessages','activityLog','customElements','personalFiles','devCloudFiles','contactMessages'].forEach(function(k) { if (!Array.isArray(state[k])) state[k] = []; });
  if (!state.pageViews || typeof state.pageViews !== 'object') state.pageViews = {};
  if (!state.textOverrides || typeof state.textOverrides !== 'object') state.textOverrides = {};
  if (!state.siteSettings || typeof state.siteSettings !== 'object') state.siteSettings = { discordUrl: '', contactEmail: '' };
  if (!Array.isArray(state.navigationLinks) || !state.navigationLinks.length) state.navigationLinks = JSON.parse(JSON.stringify(DEFAULT_NAV));
}

/* ── THEME (personal preference: saved choice, otherwise the OS preference) ── */
var ICON_SUN = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
var ICON_MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
function initTheme() {
  var t = null;
  try { t = localStorage.getItem('mokza_theme_forced'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  applyTheme(t, false);
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: light)');
    var follow = function(e) { var saved = null; try { saved = localStorage.getItem('mokza_theme_forced'); } catch (x) {} if (!saved) applyTheme(e.matches ? 'light' : 'dark', false); };
    if (mq.addEventListener) mq.addEventListener('change', follow);
  }
}
function applyTheme(t, persist) {
  state.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  var app = document.getElementById('app'); if (app) app.className = 'app ' + t;
  var ic = document.getElementById('themeIcon'); if (ic) ic.innerHTML = t === 'dark' ? ICON_SUN : ICON_MOON;
  var btn = document.getElementById('themeBtn'); if (btn) btn.title = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  if (persist !== false) { try { localStorage.setItem('mokza_theme_forced', t); } catch (e) {} }
}
function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  if (state.adminMenuOpen && typeof renderAdminContent === 'function') renderAdminContent();
}

/* ── NAVIGATION ── */
function renderNavigation() {
  var nav = document.getElementById('navbarLinks');
  var mobile = document.getElementById('mobileNavLinks');
  var enabled = state.navigationLinks.filter(function(l) { return l.enabled && (!l.minRank || canAccess(l.minRank)); });
  var html = enabled.map(function(l) {
    var badge = l.minRank ? '<span class="badge badge-blue">' + l.minRank + '+</span>' : '';
    return '<button class="nav-link ' + (state.currentPage === l.page ? 'active' : '') + '" onclick="changePage(\'' + l.page + '\')"><span>' + escHtml(l.label) + '</span>' + badge + '</button>';
  }).join('');
  nav.innerHTML = html;
  mobile.innerHTML = enabled.map(function(l) {
    return '<button class="mobile-nav-link ' + (state.currentPage === l.page ? 'active' : '') + '" onclick="changePage(\'' + l.page + '\');closeMobileNav();">' + escHtml(l.label) + '</button>';
  }).join('');
  
  // Add language selector
  var langSelector = '<div class="lang-selector" style="margin-left:1rem;display:flex;gap:0.5rem;align-items:center;">' +
    '<button class="lang-btn" onclick="setLanguage(\'en\')" style="padding:0.4rem 0.6rem;border:1px solid var(--ov-12);background:transparent;color:var(--text-secondary);border-radius:var(--radius-sm);cursor:pointer;' + (state.currentLanguage === 'en' ? 'background:var(--accent-primary);color:var(--on-accent);border-color:var(--accent-primary);' : '') + '">EN</button>' +
    '<button class="lang-btn" onclick="setLanguage(\'es\')" style="padding:0.4rem 0.6rem;border:1px solid var(--ov-12);background:transparent;color:var(--text-secondary);border-radius:var(--radius-sm);cursor:pointer;' + (state.currentLanguage === 'es' ? 'background:var(--accent-primary);color:var(--on-accent);border-color:var(--accent-primary);' : '') + '">ES</button>' +
    '<button class="lang-btn" onclick="setLanguage(\'fr\')" style="padding:0.4rem 0.6rem;border:1px solid var(--ov-12);background:transparent;color:var(--text-secondary);border-radius:var(--radius-sm);cursor:pointer;' + (state.currentLanguage === 'fr' ? 'background:var(--accent-primary);color:var(--on-accent);border-color:var(--accent-primary);' : '') + '">FR</button>' +
    '</div>';
  
  nav.innerHTML += langSelector;
  afterRender();
}

function changePage(page) {
  state.currentPage = page;
  state.pageViews[page] = (state.pageViews[page] || 0) + 1;
  closeMobileNav();
  renderNavigation();
  renderPage();
  window.scrollTo({ top: 0 });
}

function toggleMobileNav() {
  var drawer = document.getElementById('mobileNavDrawer');
  var overlay = document.getElementById('mobileNavOverlay');
  var isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
}
function closeMobileNav() {
  document.getElementById('mobileNavDrawer').classList.remove('open');
  document.getElementById('mobileNavOverlay').classList.remove('open');
}

/* ── PAGE RENDERING ── */
function iconHtml(icon, size) {
  if (!icon) return '';
  if (/^[a-z-]+$/.test(icon) && svgIcon(icon, size || 28).indexOf('<svg') === 0) return svgIcon(icon, size || 28);
  return escHtml(icon);
}

function renderPage() {
  var content = document.getElementById('pageContent');
  if (!content) return;
  var announcements = state.announcements.filter(function(a) { return a.type === 'all' || state.currentUser; });
  var annHtml = announcements.length > 0 ? '<div class="announcements-banner">' + announcements.map(function(a) {
    return '<div class="announcement ' + escHtml(a.type) + '"><div class="announcement-header"><span class="announcement-type ' + escHtml(a.type) + '">' + (a.type === 'staff' ? svgIcon('people', 16) + ' STAFF' : '📢 ANNOUNCEMENT') + '</span></div><div class="announcement-title">' + escHtml(a.title) + '</div><div class="announcement-content">' + escHtml(a.content) + '</div>' + (a.author ? '<div class="announcement-footer" style="margin-top:.6rem;font-size:.78rem;opacity:.6">Posted by ' + escHtml(a.author) + (a.timestamp ? ' · ' + escHtml(new Date(a.timestamp).toLocaleDateString()) : '') + '</div>' : '') + '</div>';
  }).join('') + '</div>' : '';
  var raid = state.raidMode ? '<div class="announcement staff" style="margin-bottom:1.5rem"><div class="announcement-title">🚨 Raid mode is active</div><div class="announcement-content">Public submissions are temporarily disabled.</div></div>' : '';
  switch (state.currentPage) {
    case 'home': content.innerHTML = renderHome(raid + annHtml); break;
    case 'about': content.innerHTML = renderAbout(); break;
    case 'contact': content.innerHTML = renderContact(); break;
    case 'community': content.innerHTML = renderCommunity(); break;
    case 'roblox': content.innerHTML = renderRoblox(); break;
    case 'creations': content.innerHTML = renderCreations(); renderProjectsGrid(); break;
    case 'tos': content.innerHTML = renderTOS(); break;
    case 'workspace': content.innerHTML = renderWorkspace(); break;
    default: content.innerHTML = renderGenericPage(state.currentPage);
  }
  afterRender();
}

function pageElements(page) {
  if (typeof renderCustomElement !== 'function') return '';
  return (state.customElements || []).filter(function(el) { return el.page === page; }).map(renderCustomElement).join('');
}

function renderFeatureCard(card, page) {
  var manage = canManageCards();
  var id = sid(card.id), pg = sid(page);
  var ctl = manage ? '<div class="card-controls"><button class="card-control-btn" onclick="editFeatureCard(\'' + id + '\',\'' + pg + '\')" title="Edit card" aria-label="Edit card">' + svgIcon('pencil', 14) + '</button><button class="card-control-btn delete" onclick="deleteFeatureCard(\'' + id + '\',\'' + pg + '\')" title="Delete card" aria-label="Delete card">' + svgIcon('trash', 14) + '</button></div>' : '';
  var link = safeUrl(card.link);
  var drag = manage ? ' draggable="true" ondragstart="handleCardDragStart(event)" ondragend="handleCardDragEnd(event)" ondragover="handleCardDragOver(event)" ondrop="handleCardDrop(event)"' : '';
  return '<div class="feature-card' + (manage ? ' draggable' : '') + '" data-card-id="' + id + '" data-page="' + pg + '"' + drag + '>' + ctl +
    '<div class="feature-icon">' + iconHtml(card.icon) + '</div><h3>' + escHtml(card.title) + '</h3><p>' + escHtml(card.description) + '</p>' +
    (link ? '<a class="card-link" href="' + escHtml(link) + '" target="_blank" rel="noopener noreferrer">Visit link →</a>' : '') + '</div>';
}

function renderCardsSection(page, addLabel) {
  var cards = (state.featureCards[page] || []).slice().sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
  var add = canManageCards() ? '<div class="page-tools"><button class="btn btn-primary" onclick="addFeatureCard(\'' + page + '\')">' + svgIcon('plus', 16) + ' ' + escHtml(addLabel || 'Add Card') + '</button></div>' : '';
  return add + (cards.length ? '<div class="features-grid">' + cards.map(function(c) { return renderFeatureCard(c, page); }).join('') + '</div>' : '');
}

function pageHeader(title, subtitle) {
  return '<div class="page-header"><h1 class="page-title">' + escHtml(title) + '</h1>' + (subtitle ? '<p class="page-subtitle">' + escHtml(subtitle) + '</p>' : '') + '</div>';
}

function renderHome(annHtml) {
  var openTasks = state.tasks.filter(function(t) { return !t.done; }).length;
  return annHtml + '<div class="hero"><div class="hero-bg"></div><div class="hero-content"><div class="hero-badge">' + svgIcon('sparkles', 16) + ' Mokza Studios</div><h1 class="hero-title">Building the Future</h1><p class="hero-subtitle">Independent game studio creating exceptional digital experiences, Roblox projects, and more.</p><div class="hero-actions"><button class="btn btn-primary" onclick="changePage(\'creations\')">View Projects</button><button class="btn btn-outline" onclick="changePage(\'community\')">Join Community</button></div><div class="hero-stats"><div class="stat-card"><div class="stat-number">' + state.projects.length + '</div><div class="stat-label">Projects</div></div><div class="stat-card"><div class="stat-number">' + openTasks + '</div><div class="stat-label">Open Tasks</div></div><div class="stat-card"><div class="stat-number">' + state.announcements.length + '</div><div class="stat-label">Announcements</div></div></div></div></div>' +
    pageElements('home') + renderCardsSection('home', 'Add Feature Card') +
    '<div class="suggestions-section"><div class="suggestions-header"><h2 class="suggestions-title">💡 Share Your Suggestions</h2><p class="suggestions-description">We value your feedback! Help us improve by sharing your ideas.</p></div><div class="suggestion-form"><textarea id="suggestionInput" placeholder="Tell us your ideas, feature requests, or feedback..."></textarea><input type="email" id="suggestionEmail" class="input-base" placeholder="Email (optional) - receive notifications when your suggestion is reviewed" style="margin-top:1rem;width:100%;" /><button class="btn btn-primary" onclick="submitSuggestion()">Submit Suggestion</button></div>' +
    (state.suggestions.length > 0 ? '<div class="suggestion-list">' + state.suggestions.slice(0, 5).map(function(s) {
      var canManage = state.currentUser && canAccess('Apprentice');
      var statusBadge = s.status === 'approved' ? '<span style="color:var(--accent-success);font-size:0.75rem;font-weight:700;margin-left:0.5rem">✓ Approved</span>' : s.status === 'denied' ? '<span style="color:var(--accent-error);font-size:0.75rem;font-weight:700;margin-left:0.5rem">✗ Denied</span>' : '';
      var actions = canManage && s.status === 'pending' ? '<div style="margin-top:0.5rem;display:flex;gap:0.5rem"><button class="btn btn-ghost btn-sm" style="border:1px solid var(--accent-success);color:var(--accent-success)" onclick="approveSuggestion(\'' + sid(s.id) + '\')">Approve</button><button class="btn btn-ghost btn-sm" style="border:1px solid var(--accent-error);color:var(--accent-error)" onclick="denySuggestion(\'' + sid(s.id) + '\')">Deny</button></div>' : '';
      return '<div class="suggestion-item"><div class="suggestion-author">' + escHtml(s.author) + statusBadge + '</div><div class="suggestion-text">' + escHtml(s.text) + '</div><div class="suggestion-time">' + escHtml(s.timestamp) + '</div>' + actions + '</div>';
    }).join('') + '</div>' : '') + '</div>';
}

function renderAbout() {
  return pageHeader('About Us', 'Mokza Studios is an independent game studio focused on creating original, engaging, and memorable gaming experiences.') + pageElements('about') + renderCardsSection('about', 'Add Feature Card');
}

function renderContact() {
  var mail = safeUrl('mailto:' + (state.siteSettings.contactEmail || ''));
  return pageHeader('Contact Us', 'Get in touch with us for collaborations, inquiries, or just to say hello!') +
    '<div class="card-bg" style="padding:2rem;border-radius:var(--radius-lg);max-width:600px;margin:0 auto 2rem;"><div class="label-base">Name</div><input type="text" id="contactName" class="input-base" placeholder="Your name" maxlength="80" /><div class="label-base" style="margin-top:1rem;">Email</div><input type="email" id="contactEmail" class="input-base" placeholder="you@example.com" maxlength="120" /><div class="label-base" style="margin-top:1rem;">Message</div><textarea id="contactMessage" class="input-base" placeholder="Your message..." rows="4" maxlength="2000"></textarea><button class="btn btn-primary" style="margin-top:1rem;width:100%;justify-content:center;" onclick="sendContactMessage()">Send Message</button>' +
    (state.siteSettings.contactEmail ? '<p style="margin-top:1rem;text-align:center;font-size:.85rem;opacity:.7">Or email us directly: <a href="' + escHtml(mail) + '" style="color:var(--accent-primary)">' + escHtml(state.siteSettings.contactEmail) + '</a></p>' : '') + '</div>' +
    pageElements('contact') + renderCardsSection('contact', 'Add Contact Card');
}

function sendContactMessage() {
  if (state.raidMode && !state.currentUser) { showNotification('Unavailable', 'Submissions are temporarily disabled.', 'error'); return; }
  var name = document.getElementById('contactName').value.trim();
  var email = document.getElementById('contactEmail').value.trim();
  var message = document.getElementById('contactMessage').value.trim();
  if (!name || !message) { showNotification('Missing info', 'Please enter your name and a message.', 'error'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotification('Invalid email', 'Please check your email address.', 'error'); return; }
  state.contactMessages.unshift({ id: 'msg_' + Date.now(), name: name, email: email, message: message, timestamp: new Date().toISOString() });
  if (state.contactMessages.length > 200) state.contactMessages.length = 200;
  logActivity('Contact Message', 'New message from ' + name);
  saveToFirestore();
  showNotification('Message sent', 'Thanks ' + name + ' — we will get back to you soon.', 'success');
  ['contactName', 'contactEmail', 'contactMessage'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
}

function renderTOS() {
  var canEdit = canAccess('CoOwner');
  var editBtn = canEdit ? '<button class="btn btn-primary" style="margin-bottom:1.5rem;" onclick="openTOSEditor()">' + svgIcon('pencil', 16) + ' Edit Terms of Service</button>' : '';
  return pageHeader('Terms of Service', 'Please read our terms carefully before using our services.') + editBtn +
    '<div class="card-bg" style="padding:2rem;border-radius:var(--radius-lg);max-width:900px;margin:0 auto;line-height:1.8;"><div id="tosContent">' + state.tosContent.content + '</div></div>' +
    '<div style="text-align:center;margin-top:2rem;color:var(--text-muted);font-size:0.85rem;"><p>Last updated: ' + escHtml(new Date(state.tosContent.lastUpdated).toLocaleString()) + '</p></div>';
}

function openTOSEditor() {
  if (!canAccess('CoOwner')) { showNotification('Access Denied', 'CoOwner+ required to edit TOS', 'error'); return; }
  openModal('Edit Terms of Service', '<label class="modal-label">Terms of Service Content (HTML allowed)</label><textarea id="tosEditor" class="modal-input" rows="20" style="font-family:monospace;font-size:0.85rem;">' + escHtml(state.tosContent.content) + '</textarea><div class="modal-buttons"><button class="btn-primary" onclick="saveTOS()">Save Changes</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>');
}

function saveTOS() {
  if (!canAccess('CoOwner')) { showNotification('Access Denied', 'CoOwner+ required to edit TOS', 'error'); return; }
  var content = document.getElementById('tosEditor').value.trim();
  if (!content) { showNotification('Empty Content', 'TOS content cannot be empty', 'error'); return; }
  state.tosContent.content = content;
  state.tosContent.lastUpdated = new Date().toISOString();
  closeElementModal();
  logActivity('TOS Updated', 'Terms of Service updated by ' + state.currentUser.username);
  saveToFirestore();
  showNotification('Saved', 'Terms of Service updated successfully', 'success');
  renderPage();
}
window.openTOSEditor = openTOSEditor;
window.saveTOS = saveTOS;

function renderCommunity() {
  return pageHeader('Community', 'Join our growing community of developers, designers, and creators!') +
    '<div class="card-bg" style="padding:2rem;border-radius:var(--radius-lg);max-width:800px;margin:0 auto 2rem;"><p>Join our Discord server to connect with the team and other community members.</p><button class="btn btn-primary" style="margin-top:1rem;" onclick="openDiscord()">Join Discord</button></div>' +
    pageElements('community') + renderCardsSection('community', 'Add Community Card');
}
function openDiscord() {
  var url = safeUrl(state.siteSettings.discordUrl);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
  else showNotification('Discord invite not set', canAccess('CoOwner') ? 'Set it in Admin Panel → Site.' : 'The invite link has not been configured yet.', 'info');
}

function renderRoblox() {
  return pageHeader('Roblox Projects', 'Explore our Roblox game development projects and creations.') + pageElements('roblox') + renderCardsSection('roblox', 'Add Roblox Card');
}

function renderGenericPage(page) {
  var link = (state.navigationLinks || []).find(function(l) { return l.page === page; });
  if (!state.featureCards[page]) state.featureCards[page] = [];
  return pageHeader(link ? link.label : page, '') + pageElements(page) + renderCardsSection(page, 'Add Card');
}

function renderCreations() {
  return '<div class="page-header"><h1 class="page-title">Our Creations</h1></div><div class="search-bar"><input type="text" class="input-base" id="projectSearch" placeholder="Search projects..." value="' + escHtml(state.searchQuery || '') + '" oninput="onProjectSearch(this.value)" aria-label="Search projects" />' + (canManageCards() ? '<button class="btn btn-primary" onclick="addProject()">' + svgIcon('plus', 16) + ' Add Project</button>' : '') + '</div>' + pageElements('creations') + '<div class="projects-grid" id="projectsGrid"></div>';
}
function onProjectSearch(v) { state.searchQuery = v; renderProjectsGrid(); }
function renderProjectsGrid() {
  var grid = document.getElementById('projectsGrid');
  if (!grid) return;
  var q = (state.searchQuery || '').toLowerCase();
  var list = state.projects.filter(function(p) { return !q || (p.title || '').toLowerCase().indexOf(q) !== -1 || (p.description || '').toLowerCase().indexOf(q) !== -1; });
  if (!list.length) {
    grid.innerHTML = '<div class="empty-placeholder"><div class="empty-icon">' + svgIcon('construction', 48) + '</div><h3>' + (state.projects.length ? 'No matching projects' : 'No creations yet!') + '</h3><p>' + (state.projects.length ? 'Try a different search.' : 'Come back later — we\'re working on something great.') + '</p></div>';
    afterRender(); return;
  }
  grid.innerHTML = list.map(function(p) {
    var link = safeUrl(p.link);
    var ctl = canManageCards() ? '<div class="card-controls"><button class="card-control-btn" onclick="editProject(' + Number(p.id) + ')" title="Edit project" aria-label="Edit project">' + svgIcon('pencil', 14) + '</button><button class="card-control-btn delete" onclick="deleteProject(' + Number(p.id) + ')" title="Delete project" aria-label="Delete project">' + svgIcon('trash', 14) + '</button></div>' : '';
    return '<div class="project-card">' + ctl + '<div class="project-image">' + iconHtml(p.image || '📦', 56) + '</div><div class="project-content"><div class="project-title">' + escHtml(p.title) + '</div><div class="project-description">' + escHtml(p.description) + '</div><div class="project-meta"><span>' + svgIcon('calendar', 16) + ' ' + escHtml(p.date || '') + '</span><span>' + svgIcon('person', 16) + ' ' + escHtml(p.poster || '') + '</span></div>' + (link ? '<a href="' + escHtml(link) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width:100%;justify-content:center;">View Project</a>' : '') + '</div></div>';
  }).join('');
  afterRender();
}

function renderWorkspace() {
  if (!state.currentUser) {
    return '<div class="card-bg" style="padding:3rem;text-align:center;max-width:600px;margin:0 auto;"><div class="empty-icon">' + svgIcon('lock', 20) + '</div><h3>Staff Workspace</h3><p style="margin-bottom:1.5rem;">Mokza Nexus is our internal workspace — chat, tasks, project boards, notes, and more. It\'s restricted to signed-in team members.</p><button class="btn btn-primary" onclick="showAuthModal()">Sign In</button></div>';
  }
  return '<div class="page-header"><h1 class="page-title">Mokza Nexus Workspace</h1><p class="page-subtitle">Our internal team workspace — chat, tasks, project boards, notes, and the Software Center.</p></div><div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:2rem;"><button class="btn btn-primary" onclick="closeOfficeHub();openOfficeHub()">' + svgIcon('building', 20) + ' Open Office Hub</button><button class="btn btn-outline" onclick="switchHubView(\'chat\',this);closeOfficeHub();openOfficeHub()">' + svgIcon('chat', 20) + ' Team Chat</button><button class="btn btn-outline" onclick="switchHubView(\'tasks\',this);closeOfficeHub();openOfficeHub()">' + svgIcon('memo', 20) + ' Task Board</button></div><iframe src="workspace/index.html" title="Mokza Nexus Workspace" style="width:100%;height:600px;border:none;border-radius:var(--radius-lg);"></iframe>';
}

function submitSuggestion() {
  if (state.raidMode && !state.currentUser) { showNotification('Unavailable', 'Submissions are temporarily disabled.', 'error'); return; }
  var inp = document.getElementById('suggestionInput');
  var emailInp = document.getElementById('suggestionEmail');
  var text = inp.value.trim();
  var email = emailInp ? emailInp.value.trim() : '';
  if (!text) { showNotification('Empty Suggestion', 'Please enter your suggestion', 'error'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotification('Invalid email', 'Please check your email address for notifications', 'error'); return; }
  state.suggestions.unshift({ id: Date.now(), author: state.currentUser ? state.currentUser.username : 'Anonymous', email: email, text: text, timestamp: new Date().toLocaleString(), status: 'pending' });
  inp.value = '';
  if (emailInp) emailInp.value = '';
  logActivity('Suggestion Submitted', 'New suggestion from ' + (state.currentUser ? state.currentUser.username : 'Anonymous'));
  saveToFirestore();
  showNotification('Thank You!', 'Your suggestion has been submitted' + (email ? '. You will receive email notifications.' : ''), 'success');
  renderPage();
}

function approveSuggestion(id) {
  if (!requireRank('Apprentice', 'Approving suggestions')) return;
  var s = byId(state.suggestions, id);
  if (!s) return;
  s.status = 'approved';
  s.approvedBy = state.currentUser.username;
  s.approvedAt = new Date().toLocaleString();
  logActivity('Suggestion Approved', 'Approved suggestion by ' + s.author);
  saveToFirestore();
  showNotification('Approved', 'Suggestion has been approved', 'success');
  renderPage();
  // Send notification if email provided
  if (s.email) {
    sendSuggestionNotification(s, 'approved');
  }
}

function denySuggestion(id) {
  if (!requireRank('Apprentice', 'Denying suggestions')) return;
  var s = byId(state.suggestions, id);
  if (!s) return;
  s.status = 'denied';
  s.deniedBy = state.currentUser.username;
  s.deniedAt = new Date().toLocaleString();
  s.deleteAt = Date.now() + (5 * 60 * 1000); // Auto-delete in 5 minutes
  logActivity('Suggestion Denied', 'Denied suggestion by ' + s.author);
  saveToFirestore();
  showNotification('Denied', 'Suggestion has been denied and will auto-delete in 5 minutes', 'info');
  renderPage();
  // Send notification if email provided
  if (s.email) {
    sendSuggestionNotification(s, 'denied');
  }
  // Start auto-delete timer
  setTimeout(function() {
    deleteSuggestion(id);
  }, 5 * 60 * 1000);
}

window.approveSuggestion = approveSuggestion;
window.denySuggestion = denySuggestion;

function deleteSuggestion(id) {
  if (!requireRank('Apprentice', 'Deleting suggestions')) return;
  var s = byId(state.suggestions, id);
  if (!s || !confirm('Delete this suggestion?')) return;
  state.suggestions = state.suggestions.filter(function(x) { return x !== s; });
  logActivity('Suggestion Deleted', 'Deleted suggestion from ' + s.author);
  saveToFirestore();
  showNotification('Deleted', 'Suggestion has been removed', 'success');
  renderPage();
}
window.deleteSuggestion = deleteSuggestion;

// Email notification function (placeholder - requires email service integration)
function sendSuggestionNotification(suggestion, status) {
  // This is a placeholder for email notification
  // In production, this would call your backend API to send emails
  console.log('[Notification] Email would be sent to:', suggestion.email);
  console.log('[Notification] Status:', status);
  console.log('[Notification] Suggestion:', suggestion.text);
  
  // TODO: Integrate with email service (e.g., SendGrid, Mailgun, or Supabase Email)
  // Example API call:
  // await apiRequest('/api/send-notification', {
  //   method: 'POST',
  //   body: {
  //     email: suggestion.email,
  //     type: 'suggestion_' + status,
  //     data: {
  //       suggestion: suggestion.text,
  //       status: status,
  //       timestamp: new Date().toISOString()
  //     }
  //   }
  // });
}
window.sendSuggestionNotification = sendSuggestionNotification;

// ── LANGUAGE SUPPORT ──
function t(key) {
  var lang = state.currentLanguage || 'en';
  var trans = state.translations[lang];
  return trans && trans[key] || state.translations.en[key] || key;
}

function setLanguage(lang) {
  if (!state.translations[lang]) return;
  state.currentLanguage = lang;
  localStorage.setItem('mokza_language', lang);
  renderNavigation();
  renderPage();
  showNotification('Language Changed', 'Language set to ' + lang.toUpperCase(), 'success');
}
window.setLanguage = setLanguage;

/* ── OFFICE HUB ── */
function openOfficeHub() {
  if (!state.currentUser) { showNotification('Login required', '', 'error'); return; }
  document.getElementById('officeHub').classList.add('open');
  switchHubView('dashboard', null);
}
function closeOfficeHub() {
  document.getElementById('officeHub').classList.remove('open');
}
function switchHubView(view, btn) {
  document.querySelectorAll('.hub-view').forEach(function(el) { el.classList.remove('active'); el.style.display = 'none'; });
  document.querySelectorAll('.hub-nav-item').forEach(function(b) { b.classList.remove('active'); });
  var el = document.getElementById('hub-view-' + view);
  if (el) { el.classList.add('active'); el.style.display = view === 'chat' ? 'block' : 'block'; }
  if (btn) btn.classList.add('active');
  if (view === 'dashboard') renderHubDash();
  else if (view === 'activity') renderHubAct();
  else if (view === 'tasks') renderHubTasks();
  else if (view === 'chat') renderHubChat();
  else if (view === 'toolbox') renderHubToolbox();
  else if (view === 'bots') renderHubBots();
  else if (view === 'analytics') renderHubAnalytics();
}

function renderHubDash() {
  var online = _apiOnline === true;
  var openT = (state.tasks || []).filter(function(t) { return !t.done; }).length;
  var allF = (state.personalFiles || []).length + (state.devCloudFiles || []).length;
  var totalV = Object.values(state.pageViews || {}).reduce(function(a,b) { return a + b; }, 0);
  document.getElementById('hubDashContent').innerHTML = '<div class="hub-grid"><div class="hub-card"><h3>' + svgIcon('chart', 20) + ' System Health</h3><div class="hub-card-row"><span class="dot ' + (online ? 'dot-green' : 'dot-red') + '"></span>DB: ' + (online ? 'Online' : 'Offline') + '</div><div class="hub-card-row"><span class="dot ' + (state.raidMode ? 'dot-red' : 'dot-green') + '"></span>Raid: ' + (state.raidMode ? 'ON' : 'OFF') + '</div><div class="hub-card-row"><span class="dot dot-green"></span>Cache: Active</div></div><div class="hub-card"><h3>' + svgIcon('people', 20) + ' Team</h3>' + Object.entries(USERS).map(function(pair) {
    var n = pair[0], u = pair[1];
    return '<div class="hub-card-row"><span class="dot ' + (state.currentUser && state.currentUser.username === n ? 'dot-green' : 'dot-grey') + '"></span><span style="flex:1">' + escHtml(n) + verifiedBadge(u.rank) + '</span><span style="opacity:.45;font-size:.72rem">' + u.rank + '</span></div>';
  }).join('') + '</div><div class="hub-card"><h3>' + svgIcon('target', 20) + ' Quick Stats</h3><div class="hub-stat-grid"><div><div class="hub-stat-big">' + state.projects.length + '</div><div class="hub-stat-label">Projects</div></div><div><div class="hub-stat-big">' + openT + '</div><div class="hub-stat-label">Open Tasks</div></div><div><div class="hub-stat-big">' + allF + '</div><div class="hub-stat-label">Files</div></div><div><div class="hub-stat-big">' + totalV + '</div><div class="hub-stat-label">Page Views</div></div></div></div></div><div class="hub-grid" style="grid-template-columns:1fr 1fr;"><div class="hub-card"><h3>' + svgIcon('clipboard', 20) + ' Recent Activity</h3><div class="act-feed">' + (state.activityLog || []).slice(0,7).map(function(a) {
    return '<div class="act-entry"><span class="act-icon">' + (a.action.includes('Login') ? '' + svgIcon('unlock', 20) + '' : a.action.includes('Logout') ? '' + svgIcon('lock', 20) + '' : a.action.includes('Added') ? '' + svgIcon('plus', 20) + '' : a.action.includes('Deleted') ? '' + svgIcon('trash', 20) + '' : '' + svgIcon('pencil', 20) + '') + '</span><span class="act-body"><strong>' + escHtml(a.user) + '</strong> ' + escHtml(a.details) + '</span><span class="act-time">' + escHtml(a.timestamp) + '</span></div>';
  }).join('') + '</div></div><div class="hub-card"><h3>' + svgIcon('robot', 20) + ' DevTBot</h3><div class="hub-card-row"><span class="dot dot-green"></span><strong>DevTBot</strong> Online' + verifiedBadge('Bot', true) + '</div><div style="margin:.5rem 0;font-size:.78rem;opacity:.7">Prefix: <code>/</code> or <code>!</code> · ' + BOT_COMMANDS.length + ' commands</div><div style="font-size:.76rem;opacity:.6;line-height:1.6">Type <code>/help</code> in Team Chat to see them all.</div></div></div>';
}

function renderHubAct() {
  document.getElementById('hubActContent').innerHTML = '<h2 style="color:var(--accent-primary);font-size:1.05rem;margin-bottom:.9rem">' + svgIcon('clipboard', 20) + ' Full Activity Log</h2><div class="act-feed">' + (state.activityLog || []).map(function(a) {
    return '<div class="act-entry"><span class="act-icon">' + (a.action.includes('Login') ? '' + svgIcon('unlock', 20) + '' : a.action.includes('Logout') ? '' + svgIcon('lock', 20) + '' : a.action.includes('Added') ? '' + svgIcon('plus', 20) + '' : a.action.includes('Deleted') ? '' + svgIcon('trash', 20) + '' : '' + svgIcon('pencil', 20) + '') + '</span><div class="act-body"><strong>' + escHtml(a.user) + '</strong> ' + escHtml(a.details) + '</div><span class="act-time">' + escHtml(a.timestamp) + '</span></div>';
  }).join('') + '</div>';
}

function renderHubTasks() {
  var tasks = state.tasks || [];
  document.getElementById('hubTaskContent').innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem"><h2 style="color:var(--accent-primary);font-size:1.05rem">' + svgIcon('memo', 20) + ' Task Board</h2>' + (canAccess('Developer') ? '<button class="hub-qa-btn" onclick="openAddTaskModal()">+ Add Task</button>' : '') + '</div>' + (tasks.length ? tasks.map(function(t) {
    return '<div class="task-item ' + (t.done ? 'done' : '') + ' ' + t.priority + '"><div class="task-checkbox ' + (t.done ? 'checked' : '') + '" onclick="toggleTask(\'' + escHtml(t.id) + '\');renderHubTasks()">' + (t.done ? '✓' : '') + '</div><div style="flex:1;"><div class="task-title" style="' + (t.done ? 'text-decoration:line-through' : '') + '">' + escHtml(t.title) + '</div>' + (t.description ? '<div class="task-meta">' + escHtml(t.description) + '</div>' : '') + '<div class="task-meta"><span class="task-priority ' + t.priority + '">' + t.priority.toUpperCase() + '</span>' + (t.assignee ? ' · ' + svgIcon('person', 20) + ' ' + escHtml(t.assignee) : '') + (t.dueDate ? ' · ' + svgIcon('calendar', 20) + ' ' + escHtml(t.dueDate) : '') + ' · by ' + escHtml(t.author) + '</div></div>' + (canAccess('Developer') ? '<button class="btn-icon" onclick="deleteTask(\'' + escHtml(t.id) + '\');renderHubTasks()" style="color:#f5576c;font-size:1rem">' + svgIcon('trash', 20) + '</button>' : '') + '</div>';
  }).join('') : '<div style="text-align:center;padding:3rem;opacity:.4">No tasks yet</div>');
}

function openAddTaskModal() {
  document.getElementById('elementModalTitle').textContent = 'Add Task';
  document.getElementById('elementModalContent').innerHTML = '<label class="modal-label">Title *</label><input type="text" id="taskTitle" class="modal-input" placeholder="Fix the login bug" maxlength="140" /><label class="modal-label">Priority</label><select id="taskPriority" class="modal-select"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select><div class="modal-buttons"><button class="btn-primary" onclick="saveTask()">Save Task</button><button class="btn-ghost" onclick="closeElementModal()">Cancel</button></div>';
  document.getElementById('elementModal').classList.remove('hidden');
  setTimeout(function() { var t = document.getElementById('taskTitle'); if (t) t.focus(); }, 30);
}
function closeElementModal() { var m = document.getElementById('elementModal'); if (m) m.classList.add('hidden'); }
function saveTask() {
  var title = document.getElementById('taskTitle').value.trim();
  if (!title) { showNotification('Missing title', 'Please enter a task title.', 'error'); return; }
  state.tasks.unshift({ id: 'task_' + Date.now(), title: title, priority: document.getElementById('taskPriority').value, author: state.currentUser.username, done: false, createdAt: new Date().toISOString() });
  closeElementModal();
  saveToFirestore();
  renderHubTasks();
  renderPage();
  showNotification('Task Added', title, 'success');
}
function toggleTask(id) {
  var t = (state.tasks || []).find(function(t) { return t.id === id; });
  if (t) { t.done = !t.done; saveToFirestore(); renderHubTasks(); }
}
function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  state.tasks = (state.tasks || []).filter(function(t) { return t.id !== id; });
  saveToFirestore();
  renderHubTasks();
}

/* ── CHAT ── */
var CHANNELS = [
  { id: '#general', read: 'Apprentice', write: 'Developer', desc: 'Team chat' },
  { id: '#announcements', read: 'Apprentice', write: 'CoOwner', desc: 'Official announcements' },
  { id: '#bot-commands', read: 'Apprentice', write: 'Apprentice', desc: 'Run bot commands here' },
  { id: '#staff-only', read: 'CoOwner', write: 'CoOwner', desc: 'Leadership only' }
];
function channelById(id) { return CHANNELS.find(function(c) { return c.id === id; }) || CHANNELS[0]; }
function canReadChannel(ch) { return !!state.currentUser && canAccess(ch.read); }
function canWriteChannel(ch) { return !!state.currentUser && canAccess(ch.write); }

var _saveTimer = null;
function scheduleSave() { clearTimeout(_saveTimer); _saveTimer = setTimeout(saveToFirestore, 1500); }

function verifiedBadge(rank, isBot) {
  var img = (isBot || rank === 'Owner' || rank === 'CoOwner') ? 'badge-gold' : (rank === 'Developer' ? 'badge-blue' : null);
  if (!img) return '';
  var label = isBot ? 'Verified bot' : 'Verified ' + (rank === 'CoOwner' ? 'Co-Owner' : rank);
  return '<img class="verified-img" src="/assets/' + img + '.png" alt="Verified" title="' + escHtml(label) + '" data-badge="' + img + '" onerror="badgeFallback(this)">';
}
function badgeFallback(img) {
  var gold = img.getAttribute('data-badge') === 'badge-gold';
  var span = document.createElement('span');
  span.className = 'verified-badge ' + (gold ? 'gold' : 'blue');
  span.textContent = '✓';
  span.title = img.title;
  if (img.parentNode) img.parentNode.replaceChild(span, img);
}

function fmtChat(text) {
  return escHtml(String(text || '')).replace(/\n/g, '<br>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderHubChat() {
  var cur = channelById(state.chatChannel);
  if (!canReadChannel(cur)) { state.chatChannel = '#general'; cur = channelById('#general'); }
  renderHubChatChannels();
  renderHubChatMsgs();
  renderHubChatMembers();
  var hdr = document.getElementById('chatHdr'); if (hdr) hdr.innerHTML = escHtml(cur.id) + ' <span style="opacity:.5;font-weight:400;font-size:.8rem">— ' + escHtml(cur.desc) + '</span>';
  var inp = document.getElementById('chatInputEl');
  if (inp) {
    var ok = canWriteChannel(cur);
    inp.disabled = !ok;
    inp.placeholder = ok ? 'Message ' + cur.id + ' — or type /help' : 'Read-only in this channel';
  }
}
function switchChannel(id) { state.chatChannel = id; renderHubChat(); }
function renderHubChatChannels() {
  var el = document.getElementById('chatChannelList');
  if (!el) return;
  el.innerHTML = CHANNELS.filter(canReadChannel).map(function(c) {
    return '<button class="chat-channel-btn' + (c.id === state.chatChannel ? ' active' : '') + '" onclick="switchChannel(\'' + c.id + '\')">' + escHtml(c.id) + '</button>';
  }).join('');
}
function renderHubChatMsgs() {
  var el = document.getElementById('chatMsgsArea');
  if (!el) return;
  var msgs = state.chatMessages.filter(function(m) { return (m.ch || '#general') === state.chatChannel; }).slice(-100);
  if (!msgs.length) { el.innerHTML = '<div style="text-align:center;opacity:.5;padding:2.5rem;font-size:.88rem">No messages yet. Say hello! 👋</div>'; return; }
  el.innerHTML = msgs.map(function(m) {
    var rankCls = m.isBot ? 'is-bot' : m.rank === 'Owner' ? 'is-owner' : m.rank === 'CoOwner' ? 'is-coowner' : '';
    return '<div class="chat-message"><div class="chat-avatar" style="background:var(--accent-primary);color:var(--on-accent)">' + escHtml((m.from || '?')[0].toUpperCase()) + '</div><div class="chat-msg-body"><div class="chat-msg-meta"><span class="chat-author ' + rankCls + '">' + escHtml(m.from) + verifiedBadge(m.rank, m.isBot) + (m.isBot ? ' <span class="badge badge-gold">BOT</span>' : '') + '</span><span class="chat-time">' + escHtml(m.t || '') + '</span></div><div class="chat-text">' + fmtChat(m.text) + '</div>' + (m.embed ? '<div class="chat-embed">' + m.embed + '</div>' : '') + '</div></div>';
  }).join('');
  el.scrollTop = el.scrollHeight;
}
function renderHubChatMembers() {
  var el = document.getElementById('chatMemberList');
  if (!el) return;
  el.innerHTML = '<div class="chat-member-lbl">Online</div>' + (state.currentUser ? '<div class="chat-member-row"><span class="dot dot-green"></span>' + escHtml(state.currentUser.username) + verifiedBadge(state.currentUser.rank) + '</div>' : '') + '<div class="chat-member-row"><span class="dot dot-green"></span>DevTBot' + verifiedBadge('Bot', true) + '</div><div class="chat-member-lbl" style="margin-top:.4rem">Members</div>' + Object.keys(USERS).filter(function(n) { return n !== (state.currentUser && state.currentUser.username); }).map(function(n) {
    return '<div class="chat-member-row" style="opacity:.6"><span class="dot dot-grey"></span>' + escHtml(n) + verifiedBadge(USERS[n].rank) + '</div>';
  }).join('');
}
function handleChatKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMsg(); } }
function sendChatMsg() {
  if (!state.currentUser) { showNotification('Login required', '', 'error'); return; }
  var ch = channelById(state.chatChannel);
  var inp = document.getElementById('chatInputEl');
  var text = ((inp && inp.value) || '').trim();
  if (!text) return;
  if (!canWriteChannel(ch)) { showNotification('No permission', 'You cannot write in ' + ch.id, 'error'); return; }
  pushChat({ id: 'm' + Date.now(), from: state.currentUser.username, rank: state.currentUser.rank, text: text.slice(0, 1000), t: nowShort(), isBot: false, ch: ch.id });
  inp.value = '';
  if (/^[\/!]/.test(text)) setTimeout(function() { devTBot(text.slice(1), ch.id); }, 350);
}
function nowShort() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function pushChat(msg) {
  state.chatMessages.push(msg);
  if (state.chatMessages.length > 500) state.chatMessages = state.chatMessages.slice(-500);
  renderHubChatMsgs();
  if (typeof state.adminMenuOpen !== 'undefined' && state.adminMenuOpen && state.adminSection === 'chat' && typeof renderAdminContent === 'function') renderAdminContent();
  scheduleSave();
}

/* ── DEVTBOT — command registry (help is generated from this, so it can never be empty) ── */
var BOT_COMMANDS = [];
var RANK_ORDER = ['Apprentice', 'Developer', 'CoOwner', 'Owner'];
function rankLabel(r) { return r === 'CoOwner' ? 'Co-Owner' : r; }
function defCmd(name, o) { o.name = name; o.aliases = o.aliases || []; BOT_COMMANDS.push(o); }
function findCmd(n) { n = (n || '').toLowerCase().replace(/^[\/!]/, ''); return BOT_COMMANDS.find(function(c) { return c.name === n || c.aliases.indexOf(n) !== -1; }); }
function code(t) { return '<code>' + escHtml(t) + '</code>'; }
function taskByRef(ref) { var n = parseInt(String(ref || '').replace('#', ''), 10); return (n >= 1 && n <= state.tasks.length) ? { t: state.tasks[n - 1], n: n } : null; }
function fmtDuration(ms) { var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + 'h ' : '') + m + 'm ' + (s % 60) + 's'; }

defCmd('help', { cat: 'General', usage: '/help [command]', desc: 'Show every command, or details about one', min: 'Apprentice', aliases: ['commands', 'h'], run: function(c) {
  if (c.args) {
    var cmd = findCmd(c.argv[0]);
    if (!cmd) return c.reply('No command named "' + c.argv[0] + '"', 'Type ' + code('/help') + ' for the full list.');
    return c.reply('/' + cmd.name, '<b>Usage:</b> ' + code(cmd.usage) + '<br>' + escHtml(cmd.desc) + '<br><b>Requires:</b> ' + rankLabel(cmd.min) + '+' + (cmd.aliases.length ? '<br><b>Aliases:</b> ' + cmd.aliases.map(function(a) { return code('/' + a); }).join(' ') : ''));
  }
  var cats = []; BOT_COMMANDS.forEach(function(x) { if (cats.indexOf(x.cat) === -1) cats.push(x.cat); });
  var html = cats.map(function(cat) {
    return '<b>' + escHtml(cat) + '</b><br>' + BOT_COMMANDS.filter(function(x) { return x.cat === cat; }).map(function(x) { return (canAccess(x.min) ? '' : '🔒 ') + code(x.usage) + ' — ' + escHtml(x.desc); }).join('<br>');
  }).join('<br><br>');
  c.reply('Available commands (' + BOT_COMMANDS.length + ')', html + '<br><br><span style="opacity:.65">🔒 needs a higher rank · ' + code('/help <command>') + ' for details · prefix ' + code('/') + ' or ' + code('!') + '</span>');
} });
defCmd('ping', { cat: 'General', usage: '/ping', desc: 'Check that the bot and the API respond', min: 'Apprentice', run: function(c) {
  var t0 = performance.now();
  apiRequest('/health').then(function() { _apiOnline = true; c.reply('🏓 Pong!', 'API round-trip: <b>' + Math.round(performance.now() - t0) + ' ms</b>'); })
    .catch(function() { _apiOnline = false; c.reply('🏓 Pong!', 'Bot is up, but the API is <b>unreachable</b> (running on local data).'); });
} });
defCmd('status', { cat: 'General', usage: '/status', desc: 'Site and database status', min: 'Apprentice', run: function(c) {
  c.reply('Status', svgIcon('circle-green', 14, '#38ef7d') + ' Database: <b>' + (_apiOnline === true ? 'Online' : _apiOnline === false ? 'Offline (local data)' : 'Unknown') + '</b><br>' + svgIcon('lock', 14) + ' Raid mode: <b>' + (state.raidMode ? 'ON' : 'OFF') + '</b><br>' + svgIcon('building', 14) + ' Projects: <b>' + state.projects.length + '</b><br>' + svgIcon('memo', 14) + ' Open tasks: <b>' + state.tasks.filter(function(t) { return !t.done; }).length + '</b>');
} });
defCmd('uptime', { cat: 'General', usage: '/uptime', desc: 'How long this session has been running', min: 'Apprentice', run: function(c) { c.reply('Uptime', 'This session has been running for <b>' + fmtDuration(Date.now() - SESSION_STARTED) + '</b>.'); } });
defCmd('about', { cat: 'General', usage: '/about', desc: 'About DevTBot', min: 'Apprentice', run: function(c) { c.reply('DevTBot', 'Built-in assistant of the Mokza Nexus workspace.<br>' + BOT_COMMANDS.length + ' commands · prefix ' + code('/') + ' or ' + code('!') + '<br>Type ' + code('/help') + ' to get started.'); } });
defCmd('whoami', { cat: 'General', usage: '/whoami', desc: 'Show your account and permissions', min: 'Apprentice', run: function(c) { c.reply(c.user.username, '<b>Rank:</b> ' + rankLabel(c.user.rank) + '<br><b>Permissions:</b> ' + escHtml(c.user.permissions)); } });
defCmd('userinfo', { cat: 'General', usage: '/userinfo <username>', desc: 'Look up a team member', min: 'Apprentice', run: function(c) {
  var name = Object.keys(USERS).find(function(n) { return n.toLowerCase() === (c.args || '').toLowerCase(); });
  if (!name) return c.reply('User not found', 'Members: ' + Object.keys(USERS).map(escHtml).join(', '));
  c.reply(name, '<b>Rank:</b> ' + rankLabel(USERS[name].rank) + '<br><b>Permissions:</b> ' + escHtml(USERS[name].permissions) + '<br><b>Online:</b> ' + (c.user.username === name ? 'Yes' : 'Unknown'));
} });
defCmd('serverinfo', { cat: 'General', usage: '/serverinfo', desc: 'Overview of the whole site', min: 'Apprentice', aliases: ['siteinfo'], run: function(c) {
  var cards = Object.keys(state.featureCards).reduce(function(n, k) { return n + state.featureCards[k].length; }, 0);
  c.reply('Mokza Studios', 'Pages: <b>' + state.navigationLinks.filter(function(l) { return l.enabled; }).length + '</b> · Projects: <b>' + state.projects.length + '</b> · Feature cards: <b>' + cards + '</b><br>Tasks: <b>' + state.tasks.length + '</b> · Suggestions: <b>' + state.suggestions.length + '</b> · Messages: <b>' + state.contactMessages.length + '</b><br>Announcements: <b>' + state.announcements.length + '</b> · Custom elements: <b>' + state.customElements.length + '</b><br>Team: <b>' + Object.keys(USERS).length + '</b> members');
} });
defCmd('ranks', { cat: 'General', usage: '/ranks', desc: 'Explain the rank hierarchy', min: 'Apprentice', run: function(c) { c.reply('Ranks', '<b>Owner</b> — everything, including analytics reset<br><b>Co-Owner</b> — edit all texts, announcements, raid mode, sync, moderation<br><b>Developer</b> — manage cards, projects, navigation, tasks<br><b>Apprentice</b> — read access, run basic commands'); } });
defCmd('time', { cat: 'General', usage: '/time', desc: 'Current local and UTC time', min: 'Apprentice', run: function(c) { var d = new Date(); c.reply('Time', 'Local: <b>' + escHtml(d.toLocaleString()) + '</b><br>UTC: <b>' + escHtml(d.toUTCString()) + '</b>'); } });
defCmd('theme', { cat: 'General', usage: '/theme [light|dark]', desc: 'Switch your personal theme', min: 'Apprentice', run: function(c) {
  var v = (c.argv[0] || '').toLowerCase();
  if (v !== 'light' && v !== 'dark') return c.reply('Theme', 'Current theme: <b>' + state.theme + '</b>. Use ' + code('/theme light') + ' or ' + code('/theme dark') + '.');
  applyTheme(v); c.reply('Theme changed', 'Switched to <b>' + v + '</b>.');
} });

defCmd('roll', { cat: 'Fun', usage: '/roll [NdM]', desc: 'Roll dice (default 1d6, max 20d1000)', min: 'Apprentice', aliases: ['dice'], run: function(c) {
  var m = /^(\d{1,2})?d(\d{1,4})$/i.exec(c.argv[0] || 'd6');
  if (!m) return c.reply('Usage', code('/roll 2d6'));
  var n = Math.min(parseInt(m[1] || '1', 10), 20), sides = Math.min(parseInt(m[2], 10), 1000);
  if (sides < 2) return c.reply('Dice need at least 2 sides');
  var rolls = []; for (var i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * sides));
  c.reply('🎲 ' + n + 'd' + sides, rolls.join(' + ') + (n > 1 ? ' = <b>' + rolls.reduce(function(a, b) { return a + b; }, 0) + '</b>' : ''));
} });
defCmd('coinflip', { cat: 'Fun', usage: '/coinflip', desc: 'Flip a coin', min: 'Apprentice', aliases: ['flip'], run: function(c) { c.reply('🪙 ' + (Math.random() < 0.5 ? 'Heads' : 'Tails')); } });
defCmd('8ball', { cat: 'Fun', usage: '/8ball <question>', desc: 'Ask the magic 8-ball', min: 'Apprentice', run: function(c) {
  if (!c.args) return c.reply('Ask a question first', code('/8ball will we ship today?'));
  var a = ['It is certain.', 'Without a doubt.', 'Yes — definitely.', 'Most likely.', 'Signs point to yes.', 'Ask again later.', 'Cannot predict now.', 'Don\'t count on it.', 'My sources say no.', 'Very doubtful.'];
  c.reply('🎱 ' + a[Math.floor(Math.random() * a.length)], '<i>' + escHtml(c.args) + '</i>');
} });
defCmd('choose', { cat: 'Fun', usage: '/choose <a | b | c>', desc: 'Pick one option at random', min: 'Apprentice', run: function(c) {
  var o = c.args.split('|').map(function(x) { return x.trim(); }).filter(Boolean);
  if (o.length < 2) return c.reply('Give me at least two options', code('/choose pizza | tacos'));
  c.reply('I choose…', '<b>' + escHtml(o[Math.floor(Math.random() * o.length)]) + '</b>');
} });

defCmd('projects', { cat: 'Site', usage: '/projects', desc: 'List projects', min: 'Apprentice', run: function(c) {
  c.reply('Projects (' + state.projects.length + ')', state.projects.slice(0, 10).map(function(p) { return '• <b>' + escHtml(p.title) + '</b> — ' + escHtml(p.description || ''); }).join('<br>') || 'No projects yet.');
} });
defCmd('announcements', { cat: 'Site', usage: '/announcements', desc: 'List current announcements', min: 'Apprentice', run: function(c) {
  c.reply('Announcements (' + state.announcements.length + ')', state.announcements.slice(0, 8).map(function(a) { return '• [' + escHtml(a.type.toUpperCase()) + '] <b>' + escHtml(a.title) + '</b>'; }).join('<br>') || 'None right now.');
} });
defCmd('suggestions', { cat: 'Site', usage: '/suggestions [n]', desc: 'Show the latest suggestions', min: 'Apprentice', run: function(c) {
  var n = Math.min(Math.max(parseInt(c.argv[0] || '5', 10) || 5, 1), 15);
  c.reply('Latest suggestions (' + state.suggestions.length + ' total)', state.suggestions.slice(0, n).map(function(s) { return '• <b>' + escHtml(s.author) + ':</b> ' + escHtml(s.text.slice(0, 120)); }).join('<br>') || 'No suggestions yet.');
} });
defCmd('activity', { cat: 'Site', usage: '/activity [n]', desc: 'Show recent activity', min: 'Apprentice', run: function(c) {
  var n = Math.min(Math.max(parseInt(c.argv[0] || '8', 10) || 8, 1), 20);
  c.reply('Recent activity', state.activityLog.slice(0, n).map(function(a) { return '• <b>' + escHtml(a.user) + '</b> ' + escHtml(a.details); }).join('<br>') || 'Nothing yet.');
} });

defCmd('task', { cat: 'Tasks', usage: '/task <add|list|done|remove|assign|priority> …', desc: 'Manage the task board (add/done/remove/assign need Developer+)', min: 'Apprentice', aliases: ['tasks'], run: function(c) {
  var sub = (c.argv[0] || 'list').toLowerCase(), rest = c.argv.slice(1);
  var needDev = function() { if (!canAccess('Developer')) { c.reply('⛔ Permission denied', '<code>/task ' + escHtml(sub) + '</code> requires <b>Developer+</b>.'); return false; } return true; };
  if (sub === 'list') {
    var open = state.tasks.map(function(t, i) { return { t: t, n: i + 1 }; }).filter(function(x) { return !x.t.done; });
    return c.reply('Open tasks: ' + open.length, open.slice(0, 10).map(function(x) { return '<b>#' + x.n + '</b> ' + escHtml(x.t.title) + ' [' + escHtml(x.t.priority) + ']' + (x.t.assignee ? ' → ' + escHtml(x.t.assignee) : ''); }).join('<br>') || 'No open tasks! 🎉');
  }
  if (sub === 'add') {
    if (!needDev()) return;
    var title = rest.join(' ').trim();
    if (!title) return c.reply('Usage', code('/task add <title>'));
    state.tasks.unshift({ id: 'task_' + Date.now(), title: title, description: '', priority: 'medium', assignee: '', dueDate: '', author: c.user.username, done: false, createdAt: new Date().toISOString() });
    logActivity('Task Added', 'Added task: ' + title); scheduleSave(); renderPage();
    return c.reply('Task created', '<b>' + escHtml(title) + '</b> (#1)');
  }
  if (['done', 'remove', 'assign', 'priority'].indexOf(sub) === -1) return c.reply('Unknown subcommand', code('/help task'));
  if (!needDev()) return;
  var ref = taskByRef(rest[0]);
  if (!ref) return c.reply('Task not found', 'Use a number from ' + code('/task list') + '.');
  if (sub === 'done') { ref.t.done = !ref.t.done; c.reply(ref.t.done ? 'Task completed' : 'Task reopened', '<b>#' + ref.n + '</b> ' + escHtml(ref.t.title)); }
  else if (sub === 'remove') { state.tasks.splice(ref.n - 1, 1); c.reply('Task removed', escHtml(ref.t.title)); }
  else if (sub === 'assign') { var who = Object.keys(USERS).find(function(n) { return n.toLowerCase() === (rest[1] || '').toLowerCase(); }); if (!who) return c.reply('Unknown member', Object.keys(USERS).map(escHtml).join(', ')); ref.t.assignee = who; c.reply('Task assigned', '<b>#' + ref.n + '</b> → ' + escHtml(who)); }
  else if (sub === 'priority') { var p = (rest[1] || '').toLowerCase(); if (['low', 'medium', 'high'].indexOf(p) === -1) return c.reply('Usage', code('/task priority 3 high')); ref.t.priority = p; c.reply('Priority updated', '<b>#' + ref.n + '</b> is now <b>' + p + '</b>'); }
  logActivity('Task Edited', 'Task command: ' + sub); scheduleSave(); renderPage();
} });
defCmd('nav', { cat: 'Tasks', usage: '/nav list', desc: 'List navigation links', min: 'Developer', run: function(c) { c.reply('Navigation', state.navigationLinks.map(function(l) { return (l.enabled ? '✅' : '⛔') + ' <b>' + escHtml(l.label) + '</b> → ' + code(l.page) + (l.minRank ? ' (' + escHtml(l.minRank) + '+)' : ''); }).join('<br>')); } });
defCmd('analytics', { cat: 'Tasks', usage: '/analytics [reset]', desc: 'Page view stats (reset = Owner only)', min: 'Developer', run: function(c) {
  if ((c.argv[0] || '').toLowerCase() === 'reset') { if (!canAccess('Owner')) return c.reply('⛔ Permission denied', 'Only the <b>Owner</b> can reset analytics.'); state.pageViews = {}; scheduleSave(); return c.reply('Analytics reset'); }
  var v = state.pageViews, total = Object.keys(v).reduce(function(a, k) { return a + v[k]; }, 0);
  c.reply('Analytics — ' + total + ' views', Object.keys(v).sort(function(a, b) { return v[b] - v[a]; }).map(function(k) { return escHtml(k) + ': <b>' + v[k] + '</b>'; }).join('<br>') || 'No views recorded.');
} });
defCmd('export', { cat: 'Tasks', usage: '/export', desc: 'Download a JSON backup of the site', min: 'Developer', run: function(c) { exportWebsiteState(); c.reply('Backup downloaded'); } });

defCmd('announce', { cat: 'Moderation', usage: '/announce <all|staff> <title> | <content>', desc: 'Post an announcement on the site', min: 'CoOwner', run: function(c) {
  var type = (c.argv[0] || '').toLowerCase();
  var body = c.args.slice(c.argv[0] ? c.argv[0].length : 0).trim().split('|');
  var title = (body.shift() || '').trim(), content = body.join('|').trim();
  if (['all', 'staff'].indexOf(type) === -1 || !title || !content) return c.reply('Usage', code('/announce all Maintenance | We will be down at 8pm'));
  state.announcements.unshift({ id: 'announcement_' + Date.now(), type: type, title: title, content: content, author: c.user.username, timestamp: new Date().toISOString() });
  logActivity('Announcement Created', 'Posted ' + type + ' announcement: ' + title); scheduleSave(); renderPage();
  c.reply('📢 Announcement posted', '<b>' + escHtml(title) + '</b> (' + type + ')');
} });
defCmd('say', { cat: 'Moderation', usage: '/say <text>', desc: 'Make the bot say something', min: 'CoOwner', run: function(c) { if (!c.args) return c.reply('Usage', code('/say Hello team!')); c.reply(c.args); } });
defCmd('sync', { cat: 'Moderation', usage: '/sync', desc: 'Force a cloud sync', min: 'CoOwner', run: function(c) { saveToFirestore().then(function() { c.reply('Sync complete', 'Database: <b>' + (_apiOnline === false ? 'offline — saved locally' : 'synced') + '</b>'); }); } });
defCmd('clear', { cat: 'Moderation', usage: '/clear [n|all]', desc: 'Delete messages in this channel', min: 'CoOwner', aliases: ['purge'], run: function(c) {
  var inCh = state.chatMessages.filter(function(m) { return (m.ch || '#general') === c.ch; });
  var n = (c.argv[0] || 'all').toLowerCase() === 'all' ? inCh.length : Math.max(1, parseInt(c.argv[0], 10) || 0);
  var drop = inCh.slice(-n).map(function(m) { return m.id; });
  state.chatMessages = state.chatMessages.filter(function(m) { return drop.indexOf(m.id) === -1; });
  renderHubChatMsgs(); scheduleSave(); c.reply('🧹 Cleared ' + drop.length + ' message(s)');
} });
defCmd('raid', { cat: 'Moderation', usage: '/raid <on|off|status>', desc: 'Toggle raid mode (disables public submissions)', min: 'CoOwner', run: function(c) {
  var a = (c.argv[0] || 'status').toLowerCase();
  if (a === 'status') return c.reply('Raid mode', 'Currently <b>' + (state.raidMode ? 'ON 🚨' : 'OFF ✅') + '</b>');
  if (a !== 'on' && a !== 'off') return c.reply('Usage', code('/raid on') + ' or ' + code('/raid off'));
  state.raidMode = a === 'on'; logActivity('Raid Mode', 'Raid mode ' + a.toUpperCase()); scheduleSave(); renderPage();
  c.reply(state.raidMode ? '🚨 Raid Mode ENABLED' : '✅ Raid Mode DISABLED', 'By ' + escHtml(c.user.username));
} });

function devTBot(cmdline, ch) {
  ch = ch || state.chatChannel;
  var parts = cmdline.trim().split(/\s+/);
  var name = (parts.shift() || '').toLowerCase();
  var args = parts.join(' ');
  var cmd = findCmd(name);
  if (!cmd) {
    var near = BOT_COMMANDS.filter(function(x) { return name && x.name.indexOf(name.slice(0, 2)) === 0; }).slice(0, 3).map(function(x) { return code('/' + x.name); });
    return botMsg('Unknown command "/' + name + '"', ch, 'Type ' + code('/help') + ' to see all commands.' + (near.length ? '<br>Did you mean ' + near.join(', ') + '?' : ''));
  }
  if (!state.currentUser) return botMsg('Please sign in first', ch);
  if (!canAccess(cmd.min)) return botMsg('⛔ Permission denied', ch, code('/' + cmd.name) + ' requires <b>' + rankLabel(cmd.min) + '+</b>. You are <b>' + rankLabel(state.currentUser.rank) + '</b>.');
  var ctx = { args: args, argv: parts, user: state.currentUser, ch: ch, reply: function(text, embed) { botMsg(text, ch, embed); } };
  try { cmd.run(ctx); } catch (e) { console.error(e); botMsg('Something went wrong running /' + cmd.name, ch, escHtml(e.message)); }
}
function botMsg(text, ch, embed) {
  pushChat({ id: 'b' + Date.now() + Math.random().toString(36).slice(2, 6), from: 'DevTBot', rank: 'Bot', text: text, t: nowShort(), isBot: true, embed: embed || null, ch: ch || state.chatChannel });
}

/* ── TOOLBOX ── */
function renderHubToolbox() {
  document.getElementById('hubToolContent').innerHTML = '<h2 style="color:var(--accent-primary);font-size:1.05rem;margin-bottom:.9rem">' + svgIcon('wrench', 20) + ' Developer Toolbox</h2><div class="toolbox-grid"><button class="toolbox-btn" onclick="saveToFirestore();showNotification(\'Synced\',\'\',\'success\')"><span class="tb-icon">' + svgIcon('cloud', 20) + '</span>Force Sync</button><button class="toolbox-btn" onclick="exportWebsiteState()"><span class="tb-icon">' + svgIcon('inbox', 20) + '</span>Export</button><button class="toolbox-btn" onclick="importWebsiteState()"><span class="tb-icon">' + svgIcon('outbox', 20) + '</span>Import</button><button class="toolbox-btn" onclick="hubClearCache()"><span class="tb-icon">' + svgIcon('broom', 20) + '</span>Clear Cache</button><button class="toolbox-btn" onclick="if(confirm(\'Reset analytics?\')){state.pageViews={};saveToFirestore();renderHubAnalytics();}"><span class="tb-icon">' + svgIcon('chart', 20) + '</span>Reset Analytics</button></div>';
}
function hubClearCache() {
  if (!confirm('Clear localStorage? Page will reload.')) return;
  localStorage.removeItem('mokza_state_v2');
  showNotification('Cache Cleared', 'Reloading...', 'info');
  setTimeout(function() { location.reload(); }, 1200);
}

/* ── BOTS ── */
function renderHubBots() {
  var cats = []; BOT_COMMANDS.forEach(function(x) { if (cats.indexOf(x.cat) === -1) cats.push(x.cat); });
  document.getElementById('hubBotContent').innerHTML = '<h2 style="color:var(--accent-primary);font-size:1.05rem;margin-bottom:.9rem">' + svgIcon('robot', 20) + ' Bot Manager</h2><div class="hub-card"><h3>Built-in Bot</h3><div class="hub-card-row"><span class="dot dot-green"></span><strong>DevTBot</strong>' + verifiedBadge('Bot', true) + ' — cannot be deleted</div><div style="margin-top:.6rem;font-size:.8rem;opacity:.7">Prefix: <code>/</code> or <code>!</code> · ' + BOT_COMMANDS.length + ' commands · works in any channel you can write in</div></div>' +
    cats.map(function(cat) {
      return '<div class="hub-card" style="margin-top:1rem"><h3>' + escHtml(cat) + '</h3>' + BOT_COMMANDS.filter(function(x) { return x.cat === cat; }).map(function(x) {
        return '<div class="hub-card-row" style="align-items:flex-start"><code style="min-width:210px">' + escHtml(x.usage) + '</code><span style="flex:1;opacity:.85">' + escHtml(x.desc) + '</span><span class="badge badge-blue">' + rankLabel(x.min) + '+</span></div>';
      }).join('') + '</div>';
    }).join('');
}

/* ── ANALYTICS ── */
function renderHubAnalytics() {
  var views = state.pageViews || {};
  var total = Object.values(views).reduce(function(a, b) { return a + b; }, 0);
  document.getElementById('hubAnalContent').innerHTML = '<h2 style="color:var(--accent-primary);font-size:1.05rem;margin-bottom:.9rem">' + svgIcon('chart-up', 20) + ' Analytics</h2><div class="analytics-grid"><div class="analytics-card"><div class="analytics-value">' + total + '</div><div class="analytics-label">Total Views</div></div><div class="analytics-card"><div class="analytics-value">' + state.projects.length + '</div><div class="analytics-label">Projects</div></div><div class="analytics-card"><div class="analytics-value">' + (state.tasks || []).filter(function(t) { return !t.done; }).length + '</div><div class="analytics-label">Open Tasks</div></div></div>';
}

/* ── SETTINGS ── */
function openSettings() {
  document.getElementById('settingsPanel').classList.add('open');
  renderSettingsSection('general');
}
function closeSettings() { document.getElementById('settingsPanel').classList.remove('open'); }
function renderSettingsSection(id) {
  var el = document.getElementById('settingsContent');
  if (!el) return;
  var sections = {
    general: '<h3>' + svgIcon('gear', 20) + ' General</h3><div class="s-row"><div class="s-info"><div class="s-name">Theme</div><div class="s-desc">Light / Dark (personal)</div></div><div class="s-ctrl"><select class="s-select" onchange="applyHubTheme(this.value)"><option value="light" ' + (state.theme === 'light' ? 'selected' : '') + '>' + svgIcon('sun', 20) + ' Light</option><option value="dark" ' + (state.theme === 'dark' ? 'selected' : '') + '>' + svgIcon('moon', 20) + ' Dark</option></select></div></div>',
    security: '<h3>' + svgIcon('lock', 20) + ' Security</h3><div class="s-row"><div class="s-info"><div class="s-name">Raid Mode</div><div class="s-desc">Lock site to public</div></div><div class="s-ctrl"><label class="s-toggle"><input type="checkbox" ' + (state.raidMode ? 'checked' : '') + ' onchange="state.raidMode=this.checked;saveToFirestore()"><div class="s-toggle-track"></div></label>' + (canAccess('CoOwner') ? '' : '<span class="s-lock">' + svgIcon('lock', 20) + ' CoOwner+</span>') + '</div></div>',
    data: '<h3>' + svgIcon('save', 20) + ' Data & Backup</h3><div class="s-row"><div class="s-info"><div class="s-name">Export JSON</div><div class="s-desc">Download full site data</div></div><div class="s-ctrl"><button class="hub-qa-btn" onclick="exportWebsiteState()">' + svgIcon('inbox', 20) + ' Export</button>' + (canAccess('Developer') ? '' : '<span style="opacity:.38">Dev+</span>') + '</div></div><div class="s-row"><div class="s-info"><div class="s-name">Import JSON</div><div class="s-desc">Restore from backup</div></div><div class="s-ctrl"><button class="hub-qa-btn" onclick="importWebsiteState()">' + svgIcon('outbox', 20) + ' Import</button>' + (canAccess('CoOwner') ? '' : '<span style="opacity:.38">CoOwner+</span>') + '</div></div>',
    devtools: '<h3>' + svgIcon('wrench', 20) + ' Developer Tools</h3><div class="s-row"><div class="s-info"><div class="s-name">Force Firestore Sync</div><div class="s-desc">Push all data to cloud now</div></div><div class="s-ctrl"><button class="hub-qa-btn" onclick="saveToFirestore();showNotification(\'Synced\',\'\',\'success\')">' + svgIcon('rocket', 20) + ' Sync</button>' + (canAccess('Developer') ? '' : '<span style="opacity:.38">Dev+</span>') + '</div></div>'
  };
  el.innerHTML = sections[id] || '<div style="opacity:.4">Section not found</div>';
}
function applyHubTheme(v) {
  applyTheme(v);
  renderPage();
}

/* ── EXPORT/IMPORT ── */
function exportWebsiteState() {
  var data = Object.assign({}, state, { exportDate: new Date().toISOString() });
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'mokza-backup-' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Export Complete', 'Website data exported successfully', 'success');
}
function importWebsiteState() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(event) {
      try {
        var importData = JSON.parse(event.target.result);
        if (confirm('This will replace all current data. Continue?')) {
          applyPersisted(importData);
          saveToFirestore();
          showNotification('Import Complete', 'Website data imported successfully', 'success');
          renderNavigation();
          renderPage();
        }
      } catch (error) { showNotification('Import Failed', 'Invalid file format', 'error'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ── INIT ── */
async function init() {
  try {
    initTheme();
    ensureDefaults();
    await loadFromFirestore();
    renderNavigation();
    renderPage();
    updateAuthUI();
    logActivity('System', 'Website initialized');
  } catch (err) {
    console.error('Init failed:', err);
  } finally {
    // Always dismiss the loading screen, even if the backend is unreachable
    var ls = document.getElementById('loadingScreen');
    if (ls) {
      setTimeout(function () { ls.classList.add('fade-out'); }, 400);
      setTimeout(function () { ls.style.display = 'none'; }, 1100);
    }
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  closeElementModal();
  var auth = document.getElementById('authModal'); if (auth && !auth.classList.contains('hidden')) closeAuthModal();
  if (typeof closeAdminPanel === 'function' && state.adminMenuOpen) closeAdminPanel();
  closeMobileNav();
});

// admin.js is loaded right after this file; wait for the DOM (deferred scripts have all run by then)
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
