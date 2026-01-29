import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Users, Mail, MessageSquare, Package, Clock, Settings, Cloud, Upload, Download, Trash2, Edit3, Save, Undo, Redo, Video, Mic, MicOff, VideoOff, Share2, Send, Search, Plus } from 'lucide-react';

/**
 * DEVELOPMENT TEAM WEBSITE
 * Complete professional website with admin features
 * 
 * KEY FEATURES:
 * - 6 Main pages (Home, About, Contact, Community, Roblox, Creations)
 * - Developer authentication with security code + credentials
 * - Admin panel with Cloud Storage, Chat, and Edit controls
 * - Text editing for Developers+ (can edit own text, delete/move others' text)
 * - Undo/Redo system
 * - Light/Dark theme
 * - Responsive design
 */

const DevelopmentTeamWebsite = () => {
  // ============ STATE MANAGEMENT ============
  const [currentPage, setCurrentPage] = useState('home');
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Auth
  const [devModeActive, setDevModeActive] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('code');
  const [securityCode, setSecurityCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Admin
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminSection, setAdminSection] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editHistory, setEditHistory] = useState([]);
  const [editHistoryIndex, setEditHistoryIndex] = useState(-1);
  
  // Cloud
  const [cloudView, setCloudView] = useState(null);
  const [personalFiles, setPersonalFiles] = useState([]);
  const [devCloudFiles, setDevCloudFiles] = useState([]);
  
  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [inCall, setInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  
  // Content (editable by admins)
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'Full-stack online shopping website with payment integration',
      date: '2024-01-15',
      image: '🛒',
      link: '#',
      poster: 'ThéoDevO'
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'Collaborative task tracking with real-time updates',
      date: '2024-01-10',
      image: '📋',
      link: '#',
      poster: 'GabrielDevCoO'
    }
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editable text content
  const [editableTexts, setEditableTexts] = useState({
    heroTitle: { text: 'Welcome to Development Team', author: 'System', editable: true },
    heroSubtitle: { text: 'Building the future, one project at a time', author: 'System', editable: true },
    aboutIntro: { text: 'Development Team is a passionate group of developers, designers, and creators dedicated to building exceptional digital experiences.', author: 'System', editable: true }
  });
  
  // ============ USER DATABASE ============
  const SECURITY_CODE = '5839201746029184573206';
  const USERS = {
    'ThéoDevO': { password: '12345!O', rank: 'Owner', permissions: 'ALL' },
    'GabrielDevCoO': { password: 'Dev0ppemenTeamAdminaccessCoO!?', rank: 'CoOwner', permissions: 'ALL' },
    'NeuraXIDev': { password: '0987654!Dev?', rank: 'Developer', permissions: 'DEVELOPER' },
    'AprenticeDev': { password: 'WTDT?AppD!', rank: 'Apprentice', permissions: 'APPRENTICE' }
  };
  
  // Check if user can edit/delete text
  const canEditText = (textAuthor) => {
    if (!currentUser) return false;
    if (currentUser.username === textAuthor) return true;
    return ['Owner', 'CoOwner', 'Developer'].includes(currentUser.rank);
  };
  
  const canDeleteText = (textAuthor) => {
    if (!currentUser) return false;
    return ['Owner', 'CoOwner', 'Developer'].includes(currentUser.rank);
  };
  
  // ============ AUTH FUNCTIONS ============
  const handleAuthSubmit = () => {
    if (authStep === 'code') {
      if (securityCode === SECURITY_CODE) {
        setAuthStep('credentials');
        setSecurityCode('');
      } else {
        alert('❌ Invalid security code!');
        setSecurityCode('');
      }
    } else {
      const user = USERS[username];
      if (user && user.password === password) {
        setCurrentUser({ username, rank: user.rank, permissions: user.permissions });
        setDevModeActive(true);
        setShowAuthModal(false);
        setAuthStep('code');
        setUsername('');
        setPassword('');
        alert(`✅ Welcome, ${username}! Rank: ${user.rank}`);
      } else {
        alert('❌ Invalid credentials!');
        setPassword('');
      }
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setDevModeActive(false);
    setAdminMenuOpen(false);
    setEditMode(false);
    alert('👋 Logged out successfully');
  };
  
  // ============ EDIT FUNCTIONS ============
  const saveToHistory = (state) => {
    const newHistory = editHistory.slice(0, editHistoryIndex + 1);
    newHistory.push(state);
    setEditHistory(newHistory);
    setEditHistoryIndex(newHistory.length - 1);
  };
  
  const handleUndo = () => {
    if (editHistoryIndex > 0) {
      const prev = editHistory[editHistoryIndex - 1];
      setProjects(prev.projects);
      setEditableTexts(prev.texts);
      setEditHistoryIndex(editHistoryIndex - 1);
    }
  };
  
  const handleRedo = () => {
    if (editHistoryIndex < editHistory.length - 1) {
      const next = editHistory[editHistoryIndex + 1];
      setProjects(next.projects);
      setEditableTexts(next.texts);
      setEditHistoryIndex(editHistoryIndex + 1);
    }
  };
  
  const handleStartEdit = () => {
    saveToHistory({ projects, texts: editableTexts });
    setEditMode(true);
  };
  
  const handleSaveChanges = () => {
    alert('✅ Changes saved!');
    setEditMode(false);
  };
  
  const handleCancelChanges = () => {
    if (editHistory.length > 0) {
      const first = editHistory[0];
      setProjects(first.projects);
      setEditableTexts(first.texts);
    }
    setEditMode(false);
  };
  
  const handleEditText = (key) => {
    const current = editableTexts[key];
    if (!canEditText(current.author)) {
      alert('❌ You can only edit your own text or text if you are Developer+');
      return;
    }
    const newText = prompt('Edit text:', current.text);
    if (newText) {
      setEditableTexts({
        ...editableTexts,
        [key]: { ...current, text: newText, author: currentUser.username }
      });
    }
  };
  
  const handleDeleteText = (key) => {
    const current = editableTexts[key];
    if (!canDeleteText(current.author)) {
      alert('❌ Developer+ required to delete text');
      return;
    }
    if (confirm('Delete this text?')) {
      setEditableTexts({
        ...editableTexts,
        [key]: { ...current, text: '', author: currentUser.username }
      });
    }
  };
  
  // ============ CLOUD FUNCTIONS ============
  const handleFileUpload = (cloudType) => {
    const fileName = prompt('File name:');
    if (fileName) {
      const newFile = {
        id: Date.now(),
        name: fileName,
        uploadedBy: currentUser.username,
        date: new Date().toISOString(),
        size: (Math.random() * 10).toFixed(2) + ' MB'
      };
      if (cloudType === 'personal') {
        setPersonalFiles([...personalFiles, newFile]);
      } else {
        setDevCloudFiles([...devCloudFiles, newFile]);
      }
      alert(`✅ Uploaded to ${cloudType === 'personal' ? 'Personal Cloud' : 'DevCloud'}`);
    }
  };
  
  const handleDeleteFile = (cloudType, fileId) => {
    if (confirm('Delete this file?')) {
      if (cloudType === 'personal') {
        setPersonalFiles(personalFiles.filter(f => f.id !== fileId));
      } else {
        setDevCloudFiles(devCloudFiles.filter(f => f.id !== fileId));
      }
      alert('🗑️ File deleted');
    }
  };
  
  // ============ CHAT FUNCTIONS ============
  const handleSendMessage = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, {
        id: Date.now(),
        sender: currentUser.username,
        text: chatInput,
        timestamp: new Date().toLocaleTimeString(),
        avatar: currentUser.username[0]
      }]);
      setChatInput('');
    }
  };
  
  const toggleCall = () => {
    setInCall(!inCall);
    if (!inCall) {
      setMicEnabled(true);
      setVideoEnabled(true);
      setScreenSharing(false);
    }
  };
  
  // ============ RENDER PAGES ============
  const renderHome = () => (
    <div className="page-content">
      <div className="hero-section">
        <h1 className="hero-title">
          {editableTexts.heroTitle.text}
          {editMode && (
            <button className="edit-btn" onClick={() => handleEditText('heroTitle')}>✏️</button>
          )}
        </h1>
        <p className="hero-subtitle">
          {editableTexts.heroSubtitle.text}
          {editMode && (
            <button className="edit-btn" onClick={() => handleEditText('heroSubtitle')}>✏️</button>
          )}
        </p>
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Projects Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">15+</div>
            <div className="stat-label">Team Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Dedication</div>
          </div>
        </div>
      </div>
      
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🚀</div>
          <h3>Innovative Solutions</h3>
          <p>We create cutting-edge software that solves real problems</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💡</div>
          <h3>Creative Design</h3>
          <p>Beautiful, user-friendly interfaces that people love</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Fast Development</h3>
          <p>Rapid prototyping and agile development practices</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Reliable & Secure</h3>
          <p>Built with best practices and security in mind</p>
        </div>
      </div>
    </div>
  );
  
  const renderAboutUs = () => (
    <div className="page-content">
      <h1 className="page-title">About Development Team</h1>
      
      <div className="about-section">
        <h2>Who We Are</h2>
        <p>
          {editableTexts.aboutIntro.text}
          {editMode && (
            <button className="edit-btn" onClick={() => handleEditText('aboutIntro')}>✏️</button>
          )}
        </p>
      </div>
      
      <div className="team-section">
        <h2>Our Leadership</h2>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar">👑</div>
            <h3>ThéoDevO</h3>
            <div className="team-role owner">Founder & Owner</div>
            <p>Visionary leader and full-stack developer</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">🎯</div>
            <h3>GabrielDevCoO</h3>
            <div className="team-role coowner">Co-Owner</div>
            <p>Strategic planner and backend specialist</p>
          </div>
        </div>
      </div>
      
      <div className="team-section">
        <h2>Our Developers</h2>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar">💻</div>
            <h3>NeuraXIDev</h3>
            <div className="team-role developer">Developer</div>
            <p>Frontend wizard and UI/UX enthusiast</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">🌱</div>
            <h3>AprenticeDev</h3>
            <div className="team-role apprentice">Apprentice</div>
            <p>Rising talent learning the craft</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderContact = () => (
    <div className="page-content">
      <h1 className="page-title">Contact Us</h1>
      <div className="contact-grid">
        <div className="contact-card">
          <h3>General Inquiries</h3>
          <p>📧 contact@developmentteam.dev</p>
          <p>📱 +1 (555) 123-4567</p>
        </div>
        <div className="contact-card">
          <h3>Business</h3>
          <p>📧 business@developmentteam.dev</p>
          <p>👤 ThéoDevO</p>
        </div>
        <div className="contact-card">
          <h3>Support</h3>
          <p>📧 support@developmentteam.dev</p>
          <p>👤 NeuraXIDev</p>
        </div>
        <div className="contact-card">
          <h3>Careers</h3>
          <p>📧 careers@developmentteam.dev</p>
          <p>👤 GabrielDevCoO</p>
        </div>
      </div>
    </div>
  );
  
  const renderCommunity = () => (
    <div className="page-content">
      <h1 className="page-title">Join Our Community</h1>
      <p className="community-intro">Connect with us on various platforms!</p>
      <div className="community-grid">
        <div className="community-card discord">
          <div className="community-icon">💬</div>
          <h3>Discord</h3>
          <p>Real-time discussions and support</p>
          <a href="https://discord.gg/devteam" className="community-link">Join Discord</a>
        </div>
        <div className="community-card snapchat">
          <div className="community-icon">👻</div>
          <h3>Snapchat</h3>
          <p>Behind-the-scenes content</p>
          <a href="#" className="community-link">Add Us</a>
        </div>
        <div className="community-card twitter">
          <div className="community-icon">🐦</div>
          <h3>Twitter/X</h3>
          <p>Latest announcements</p>
          <a href="#" className="community-link">Follow</a>
        </div>
        <div className="community-card youtube">
          <div className="community-icon">📺</div>
          <h3>YouTube</h3>
          <p>Tutorials and showcases</p>
          <a href="#" className="community-link">Subscribe</a>
        </div>
      </div>
    </div>
  );
  
  const renderRoblox = () => (
    <div className="page-content">
      <h1 className="page-title">Roblox Models</h1>
      <div className="roblox-redirect">
        <div className="redirect-card">
          <div className="redirect-icon">🎮</div>
          <h2>Visit Our Roblox Models Site</h2>
          <p>Explore our collection of high-quality Roblox models and assets</p>
          <a href="https://robloxmodels.developmentteam.dev" className="btn-primary btn-large" target="_blank">
            Visit Models Site →
          </a>
        </div>
      </div>
    </div>
  );
  
  const renderCreations = () => {
    const filtered = projects.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
      <div className="page-content">
        <h1 className="page-title">Recent Creations</h1>
        <div className="search-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          {currentUser && (
            <button className="btn-primary" onClick={() => {
              const title = prompt('Title:');
              if (!title) return;
              const desc = prompt('Description:');
              if (!desc) return;
              setProjects([{
                id: Date.now(),
                title,
                description: desc,
                date: new Date().toISOString().split('T')[0],
                image: '📦',
                link: '#',
                poster: currentUser.username
              }, ...projects]);
            }}>
              <Plus size={18} /> Add Project
            </button>
          )}
        </div>
        <div className="projects-grid">
          {filtered.map(p => (
            <div key={p.id} className="project-card">
              <div className="project-image">{p.image}</div>
              <div className="project-content">
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div className="project-meta">
                  <span>📅 {p.date}</span>
                  <span>👤 {p.poster}</span>
                </div>
                {currentUser && (
                  <button className="btn-danger" onClick={() => {
                    if (confirm('Delete?')) setProjects(projects.filter(x => x.id !== p.id));
                  }}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============ ADMIN PANEL ============
  const renderAdminPanel = () => {
    if (!adminMenuOpen) return null;
    
    return (
      <div className={`admin-panel ${adminMenuOpen ? 'open' : ''}`}>
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="btn-icon" onClick={() => setAdminMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="admin-tabs">
          <button className={`admin-tab ${adminSection === 'overview' ? 'active' : ''}`} onClick={() => setAdminSection('overview')}>
            Overview
          </button>
          <button className={`admin-tab ${adminSection === 'cloud' ? 'active' : ''}`} onClick={() => setAdminSection('cloud')}>
            <Cloud size={16} /> Cloud
          </button>
          <button className={`admin-tab ${adminSection === 'chat' ? 'active' : ''}`} onClick={() => setAdminSection('chat')}>
            <MessageSquare size={16} /> Chat
          </button>
          <button className={`admin-tab ${adminSection === 'edit' ? 'active' : ''}`} onClick={() => setAdminSection('edit')}>
            <Edit3 size={16} /> Edit
          </button>
        </div>
        
        <div className="admin-content">
          {adminSection === 'overview' && (
            <div className="admin-overview">
              <h3>Welcome, {currentUser.username}!</h3>
              <p className="admin-role">Rank: <strong>{currentUser.rank}</strong></p>
              <p className="admin-permissions">Permissions: <strong>{currentUser.permissions}</strong></p>
              
              <div className="admin-stats">
                <div className="stat-box">
                  <div className="stat-value">{projects.length}</div>
                  <div className="stat-label">Projects</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{personalFiles.length}</div>
                  <div className="stat-label">Personal Files</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{devCloudFiles.length}</div>
                  <div className="stat-label">DevCloud Files</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{chatMessages.length}</div>
                  <div className="stat-label">Messages</div>
                </div>
              </div>
              
              <button className="btn-danger" onClick={handleLogout}>Logout</button>
            </div>
          )}
          
          {adminSection === 'cloud' && (
            <div className="admin-cloud">
              <div className="cloud-selector">
                <button className={`cloud-btn ${cloudView === 'personal' ? 'active' : ''}`} onClick={() => setCloudView('personal')}>
                  Personal Cloud
                </button>
                <button className={`cloud-btn ${cloudView === 'devcloud' ? 'active' : ''}`} onClick={() => setCloudView('devcloud')}>
                  DevCloud (Shared)
                </button>
              </div>
              
              {cloudView && (
                <div className="cloud-content">
                  <button className="btn-primary" onClick={() => handleFileUpload(cloudView)}>
                    <Upload size={16} /> Upload File
                  </button>
                  
                  <div className="files-list">
                    {(cloudView === 'personal' ? personalFiles : devCloudFiles).length === 0 ? (
                      <p className="no-files">No files yet</p>
                    ) : (
                      (cloudView === 'personal' ? personalFiles : devCloudFiles).map(file => (
                        <div key={file.id} className="file-item">
                          <div className="file-icon">📄</div>
                          <div className="file-info">
                            <div className="file-name">{file.name}</div>
                            <div className="file-meta">{file.uploadedBy} • {new Date(file.date).toLocaleDateString()} • {file.size}</div>
                          </div>
                          <div className="file-actions">
                            <button className="btn-icon" title="Download"><Download size={16} /></button>
                            {(cloudView === 'personal' || file.uploadedBy === currentUser.username) && (
                              <button className="btn-icon btn-danger" onClick={() => handleDeleteFile(cloudView, file.id)} title="Delete">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {!cloudView && <div className="cloud-prompt"><p>Select a cloud to view files</p></div>}
            </div>
          )}
          
          {adminSection === 'chat' && (
            <div className="admin-chat">
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <p className="no-messages">No messages yet. Start chatting!</p>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`chat-message ${msg.sender === currentUser.username ? 'own-message' : ''}`}>
                      <div className="message-avatar">{msg.avatar}</div>
                      <div className="message-content">
                        <div className="message-header">
                          <strong>{msg.sender}</strong>
                          <span className="message-time">{msg.timestamp}</span>
                        </div>
                        <div className="message-text">{msg.text}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="chat-input"
                />
                <button className="btn-primary" onClick={handleSendMessage}>
                  <Send size={18} />
                </button>
              </div>
              
              <div className="call-controls">
                <button className={`call-btn ${inCall ? 'active' : ''}`} onClick={toggleCall}>
                  {inCall ? 'End Call' : 'Start Call'}
                </button>
                
                {inCall && (
                  <>
                    <button className={`control-btn ${!micEnabled ? 'disabled' : ''}`} onClick={() => setMicEnabled(!micEnabled)}>
                      {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    <button className={`control-btn ${!videoEnabled ? 'disabled' : ''}`} onClick={() => setVideoEnabled(!videoEnabled)}>
                      {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>
                    <button className={`control-btn ${screenSharing ? 'active' : ''}`} onClick={() => setScreenSharing(!screenSharing)}>
                      <Share2 size={18} />
                    </button>
                  </>
                )}
              </div>
              
              {inCall && (
                <div className="call-status">
                  <p>📞 In call with team</p>
                  {screenSharing && <p>🖥️ Screen sharing active</p>}
                </div>
              )}
            </div>
          )}
          
          {adminSection === 'edit' && (
            <div className="admin-edit">
              <h3>Content Editor</h3>
              <p>Control website content editing</p>
              
              <div className="edit-actions">
                <button className={`btn-primary ${editMode ? 'btn-success' : ''}`} onClick={editMode ? handleSaveChanges : handleStartEdit}>
                  {editMode ? '✓ Save Changes' : 'Start Editing'}
                </button>
                {editMode && (
                  <button className="btn-danger" onClick={handleCancelChanges}>
                    Cancel
                  </button>
                )}
              </div>
              
              {editMode && (
                <div className="edit-info">
                  <p>✏️ Edit mode active!</p>
                  <p>• Click edit icons (✏️) to modify text</p>
                  <p>• You can edit your own text</p>
                  <p>• Developer+ can delete/move others' text</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // ============ MAIN RENDER ============
  return (
    <div className={`app ${theme}`}>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Logo" className="brand-logo" />
          <span className="brand-text">Development Team</span>
        </div>
        
        <div className="navbar-links">
          <button className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
            <Home size={18} /> Home
          </button>
          <button className={`nav-link ${currentPage === 'about' ? 'active' : ''}`} onClick={() => setCurrentPage('about')}>
            <Users size={18} /> About Us
          </button>
          <button className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => setCurrentPage('contact')}>
            <Mail size={18} /> Contact
          </button>
          <button className={`nav-link ${currentPage === 'community' ? 'active' : ''}`} onClick={() => setCurrentPage('community')}>
            <MessageSquare size={18} /> Community
          </button>
          <button className={`nav-link ${currentPage === 'roblox' ? 'active' : ''}`} onClick={() => setCurrentPage('roblox')}>
            <Package size={18} /> Roblox Models
          </button>
          <button className={`nav-link ${currentPage === 'creations' ? 'active' : ''}`} onClick={() => setCurrentPage('creations')}>
            <Clock size={18} /> Recent Creations
          </button>
        </div>
        
        <div className="navbar-actions">
          <button className="settings-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Settings">
            <Settings size={20} />
          </button>
          
          <div className="dev-mode-toggle">
            <label className="toggle-label">Dev Mode</label>
            <button className={`toggle-switch ${devModeActive ? 'active' : ''}`} onClick={() => {
              if (devModeActive) {
                handleLogout();
              } else {
                setShowAuthModal(true);
              }
            }}>
              <div className="toggle-slider"></div>
            </button>
          </div>
        </div>
      </nav>
      
      {/* SETTINGS SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Settings</h2>
          <button className="btn-icon" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="setting-group">
            <label>Theme</label>
            <div className="theme-buttons">
              <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                ☀️ Light
              </button>
              <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                🌙 Dark
              </button>
            </div>
          </div>
          
          {currentUser && (
            <div className="setting-group">
              <label>Account</label>
              <p>Logged in as <strong>{currentUser.username}</strong></p>
              <button className="btn-danger" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
      
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Developer Authentication</h2>
              <button className="btn-icon" onClick={() => {
                setShowAuthModal(false);
                setAuthStep('code');
                setSecurityCode('');
                setUsername('');
                setPassword('');
              }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              {authStep === 'code' ? (
                <>
                  <p>Enter security code</p>
                  <input
                    type="password"
                    placeholder="Security Code"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuthSubmit()}
                    className="auth-input"
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <p>Enter credentials</p>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input"
                    autoFocus
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuthSubmit()}
                    className="auth-input"
                  />
                </>
              )}
              
              <button className="btn-primary btn-full" onClick={handleAuthSubmit}>
                {authStep === 'code' ? 'Next' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ADMIN ACCESS BUTTON */}
      {currentUser && (
        <button className="admin-access-btn" onClick={() => setAdminMenuOpen(!adminMenuOpen)}>
          {adminMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span>Admin Access</span>
        </button>
      )}
      
      {/* EDIT MODE CONTROLS */}
      {editMode && (
        <div className="edit-controls">
          <button className="edit-control-btn" onClick={handleUndo} disabled={editHistoryIndex <= 0}>
            <Undo size={18} />
          </button>
          <button className="edit-control-btn" onClick={handleRedo} disabled={editHistoryIndex >= editHistory.length - 1}>
            <Redo size={18} />
          </button>
          <div className="edit-control-divider"></div>
          <button className="edit-control-btn btn-success" onClick={handleSaveChanges}>
            <Save size={18} /> Save
          </button>
          <button className="edit-control-btn btn-danger" onClick={handleCancelChanges}>
            <X size={18} /> Cancel
          </button>
        </div>
      )}
      
      {/* ADMIN PANEL */}
      {renderAdminPanel()}
      
      {/* MAIN CONTENT */}
      <main className="main-content">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'about' && renderAboutUs()}
        {currentPage === 'contact' && renderContact()}
        {currentPage === 'community' && renderCommunity()}
        {currentPage === 'roblox' && renderRoblox()}
        {currentPage === 'creations' && renderCreations()}
      </main>
      
      {/* FOOTER */}
      <footer className="footer">
        <p>&copy; 2025 Development Team. All rights reserved.</p>
        <p>Built with passion ❤️</p>
      </footer>
      
      {/* ========== STYLES ========== */}
      <style>{`
        /* ===== GLOBAL RESET ===== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        /* ===== BASE STYLES ===== */
        .app {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }
        
        .app.light {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #2c3e50;
        }
        
        .app.dark {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: #eee;
        }
        
        /* ===== NAVBAR ===== */
        .navbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 2px solid rgba(102, 126, 234, 0.3);
        }
        
        .app.dark .navbar {
          background: rgba(15, 12, 41, 0.95);
          border-bottom: 2px solid rgba(102, 126, 234, 0.5);
        }
        
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .brand-logo {
          width: 45px;
          height: 45px;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(102, 126, 234, 0.4));
        }
        
        .navbar-links {
          display: flex;
          gap: 0.5rem;
          flex: 1;
          flex-wrap: wrap;
        }
        
        .nav-link {
          background: none;
          border: none;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          color: #2c3e50;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .app.dark .nav-link {
          color: #eee;
        }
        
        .nav-link:hover {
          background: rgba(102, 126, 234, 0.15);
          transform: translateY(-2px);
        }
        
        .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .settings-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #667eea;
        }
        
        .settings-btn:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: rotate(90deg);
        }
        
        /* ===== DEV MODE TOGGLE ===== */
        .dev-mode-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .toggle-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #667eea;
        }
        
        .app.dark .toggle-label {
          color: #a5b4fc;
        }
        
        .toggle-switch {
          width: 50px;
          height: 26px;
          background: #ccc;
          border: none;
          border-radius: 13px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .toggle-switch.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .toggle-slider {
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .toggle-switch.active .toggle-slider {
          transform: translateX(24px) rotate(90deg);
        }
        
        /* ===== MAIN CONTENT ===== */
        .main-content {
          flex: 1;
          padding: 2rem;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }
        
        .page-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.5s ease;
        }
        
        .app.dark .page-content {
          background: rgba(15, 12, 41, 0.8);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .page-title {
          font-size: 3rem;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* ===== HOME PAGE ===== */
        .hero-section {
          text-align: center;
          margin-bottom: 4rem;
        }
        
        .hero-title {
          font-size: 4rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slideDown 0.8s ease;
          position: relative;
          display: inline-block;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .hero-subtitle {
          font-size: 1.5rem;
          color: #666;
          margin-bottom: 3rem;
          animation: slideUp 0.8s ease;
          position: relative;
          display: inline-block;
        }
        
        .app.dark .hero-subtitle {
          color: #bbb;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .edit-btn {
          background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-left: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        .edit-btn:hover {
          transform: scale(1.1);
        }
        
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          border-radius: 15px;
          color: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-10px) scale(1.05);
        }
        
        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          font-size: 1rem;
          opacity: 0.9;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }
        
        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .app.dark .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .feature-card:hover {
          transform: translateY(-10px);
          border-color: #667eea;
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
        }
        
        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .feature-card h3 {
          margin-bottom: 1rem;
          color: #2c3e50;
        }
        
        .app.dark .feature-card h3 {
          color: #eee;
        }
        
        .feature-card p {
          color: #666;
          line-height: 1.6;
        }
        
        .app.dark .feature-card p {
          color: #bbb;
        }
        
        /* ===== TEAM CARDS ===== */
        .about-section {
          margin-bottom: 3rem;
        }
        
        .about-section h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #667eea;
        }
        
        .about-section p {
          line-height: 1.8;
          color: #666;
          font-size: 1.1rem;
        }
        
        .app.dark .about-section p {
          color: #bbb;
        }
        
        .team-section {
          margin-bottom: 3rem;
        }
        
        .team-section h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
          color: #667eea;
        }
        
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        
        .team-card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .app.dark .team-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .team-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
        }
        
        .team-avatar {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .team-card h3 {
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        
        .app.dark .team-card h3 {
          color: #eee;
        }
        
        .team-role {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .team-role.owner {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        
        .team-role.coowner {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }
        
        .team-role.developer {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
        }
        
        .team-role.apprentice {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: white;
        }
        
        .team-card p {
          color: #666;
          line-height: 1.6;
        }
        
        .app.dark .team-card p {
          color: #bbb;
        }
        
        /* ===== CONTACT PAGE ===== */
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .contact-card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .app.dark .contact-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .contact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .contact-card h3 {
          margin-bottom: 1rem;
          color: #667eea;
        }
        
        .contact-card p {
          margin-bottom: 0.5rem;
          color: #666;
        }
        
        .app.dark .contact-card p {
          color: #bbb;
        }

        
        /* ===== COMMUNITY PAGE ===== */
        .community-intro {
          text-align: center;
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 3rem;
        }
        
        .app.dark .community-intro {
          color: #bbb;
        }
        
        .community-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        
        .community-card {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .app.dark .community-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .community-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        }
        
        .community-card.discord:hover {
          border-color: #5865F2;
        }
        
        .community-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .community-card h3 {
          margin-bottom: 1rem;
          color: #2c3e50;
        }
        
        .app.dark .community-card h3 {
          color: #eee;
        }
        
        .community-card p {
          color: #666;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        
        .app.dark .community-card p {
          color: #bbb;
        }
        
        .community-link {
          display: inline-block;
          padding: 0.8rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .community-link:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        /* ===== ROBLOX PAGE ===== */
        .roblox-intro {
          text-align: center;
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 3rem;
        }
        
        .app.dark .roblox-intro {
          color: #bbb;
        }
        
        .roblox-redirect {
          margin-bottom: 4rem;
        }
        
        .redirect-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 3rem;
          border-radius: 20px;
          text-align: center;
          color: white;
          box-shadow: 0 15px 50px rgba(102, 126, 234, 0.4);
        }
        
        .redirect-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
        }
        
        .redirect-card h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        
        .redirect-card p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        
        /* ===== PROJECTS PAGE ===== */
        .search-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .search-bar {
          flex: 1;
          min-width: 300px;
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-bar svg {
          position: absolute;
          left: 1rem;
          color: #999;
        }
        
        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
        }
        
        .app.dark .search-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          color: #eee;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }
        
        .project-card {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .app.dark .project-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .project-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
        }
        
        .project-image {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }
        
        .project-content {
          padding: 1.5rem;
        }
        
        .project-content h3 {
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        
        .app.dark .project-content h3 {
          color: #eee;
        }
        
        .project-content p {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .app.dark .project-content p {
          color: #bbb;
        }
        
        .project-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #999;
        }
        
        /* ===== BUTTONS ===== */
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .btn-full {
          width: 100%;
          justify-content: center;
        }
        
        .btn-large {
          padding: 1rem 3rem;
          font-size: 1.2rem;
        }
        
        .btn-icon {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-icon:hover {
          background: rgba(102, 126, 234, 0.1);
        }
        
        .btn-icon.btn-danger {
          color: #f5576c;
        }
        
        .btn-icon.btn-danger:hover {
          background: rgba(245, 87, 108, 0.1);
        }
        
        /* ===== SIDEBAR ===== */
        .sidebar {
          position: fixed;
          top: 0;
          right: -400px;
          width: 400px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          box-shadow: -5px 0 30px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          transition: right 0.3s ease;
          overflow-y: auto;
        }
        
        .app.dark .sidebar {
          background: rgba(15, 12, 41, 0.98);
          border-left: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .sidebar.open {
          right: 0;
        }
        
        .sidebar-header {
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .app.dark .sidebar-header {
          border-bottom: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .sidebar-header h2 {
          color: #667eea;
        }
        
        .sidebar-content {
          padding: 2rem;
        }
        
        .setting-group {
          margin-bottom: 2rem;
        }
        
        .setting-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .app.dark .setting-group label {
          color: #eee;
        }
        
        .theme-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .theme-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        .app.dark .theme-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          color: #eee;
        }
        
        .theme-btn:hover {
          border-color: #667eea;
        }
        
        .theme-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }
        
        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }
        
        .modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.3s ease;
        }
        
        .app.dark .modal {
          background: rgba(15, 12, 41, 0.98);
          border: 1px solid rgba(102, 126, 234, 0.5);
        }
        
        .modal-header {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .app.dark .modal-header {
          border-bottom: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .modal-header h2 {
          color: #667eea;
        }
        
        .modal-content {
          padding: 2rem;
        }
        
        .modal-content p {
          margin-bottom: 1rem;
          color: #666;
        }
        
        .app.dark .modal-content p {
          color: #bbb;
        }
        
        .auth-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }
        
        .app.dark .auth-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          color: #eee;
        }
        
        .auth-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        /* ===== ADMIN ACCESS BUTTON ===== */
        .admin-access-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 1.5rem;
          border-radius: 50px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
          transition: all 0.3s ease;
          z-index: 900;
        }
        
        .admin-access-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
        }
        
        /* ===== ADMIN PANEL ===== */
        .admin-panel {
          position: fixed;
          top: 0;
          left: -550px;
          width: 500px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          box-shadow: 5px 0 30px rgba(0, 0, 0, 0.2);
          z-index: 950;
          transition: left 0.3s ease;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        
        .app.dark .admin-panel {
          background: rgba(15, 12, 41, 0.98);
          border-right: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .admin-panel.open {
          left: 0;
        }
        
        .admin-header {
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .admin-header h2 {
          color: white;
        }
        
        .admin-header .btn-icon {
          color: white;
        }
        
        .admin-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          background: white;
        }
        
        .app.dark .admin-tabs {
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(102, 126, 234, 0.3);
        }
        
        .admin-tab {
          flex: 1;
          padding: 1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: #666;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .app.dark .admin-tab {
          color: #bbb;
        }
        
        .admin-tab:hover {
          background: rgba(102, 126, 234, 0.05);
        }
        
        .admin-tab.active {
          color: #667eea;
          border-bottom: 3px solid #667eea;
        }
        
        .admin-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }
        
        .admin-overview h3 {
          margin-bottom: 1rem;
          color: #667eea;
        }
        
        .admin-role,
        .admin-permissions {
          margin-bottom: 1rem;
          color: #666;
        }
        
        .app.dark .admin-role,
        .app.dark .admin-permissions {
          color: #bbb;
        }
        
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin: 2rem 0;
        }
        
        .stat-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1.5rem;
          border-radius: 10px;
          color: white;
          text-align: center;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        /* ===== CLOUD SECTION ===== */
        .cloud-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .cloud-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          color: #666;
          transition: all 0.3s ease;
        }
        
        .app.dark .cloud-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          color: #bbb;
        }
        
        .cloud-btn:hover {
          border-color: #667eea;
        }
        
        .cloud-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }
        
        .cloud-content {
          animation: fadeIn 0.3s ease;
        }
        
        .cloud-prompt {
          text-align: center;
          padding: 3rem;
          color: #999;
        }
        
        .files-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .no-files {
          text-align: center;
          padding: 2rem;
          color: #999;
        }
        
        .file-item {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }
        
        .app.dark .file-item {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .file-item:hover {
          border-color: #667eea;
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }
        
        .file-icon {
          font-size: 2rem;
        }
        
        .file-info {
          flex: 1;
        }
        
        .file-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.3rem;
        }
        
        .app.dark .file-name {
          color: #eee;
        }
        
        .file-meta {
          font-size: 0.85rem;
          color: #999;
        }
        
        .file-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        /* ===== CHAT SECTION ===== */
        .admin-chat {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 250px);
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 10px;
          margin-bottom: 1rem;
        }
        
        .app.dark .chat-messages {
          background: rgba(255, 255, 255, 0.02);
        }
        
        .no-messages {
          text-align: center;
          padding: 2rem;
          color: #999;
        }
        
        .chat-message {
          margin-bottom: 1rem;
          display: flex;
          gap: 0.75rem;
          animation: slideUp 0.3s ease;
        }
        
        .chat-message.own-message {
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .message-content {
          flex: 1;
          max-width: 70%;
        }
        
        .message-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.3rem;
        }
        
        .message-header strong {
          color: #2c3e50;
          font-size: 0.9rem;
        }
        
        .app.dark .message-header strong {
          color: #eee;
        }
        
        .message-time {
          font-size: 0.75rem;
          color: #999;
        }
        
        .message-text {
          background: white;
          padding: 0.75rem 1rem;
          border-radius: 15px;
          border-top-left-radius: 5px;
          color: #2c3e50;
          line-height: 1.5;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .app.dark .message-text {
          background: rgba(255, 255, 255, 0.05);
          color: #eee;
        }
        
        .own-message .message-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-top-right-radius: 5px;
          border-top-left-radius: 15px;
        }
        
        .chat-input-area {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 25px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }
        
        .app.dark .chat-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          color: #eee;
        }
        
        .chat-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .call-controls {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        
        .call-btn {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
        }
        
        .call-btn.active {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .call-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .control-btn {
          background: white;
          border: 2px solid #e0e0e0;
          padding: 0.75rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .app.dark .control-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .control-btn:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }
        
        .control-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }
        
        .control-btn.disabled {
          background: #f5f5f5;
          color: #999;
          border-color: #e0e0e0;
        }
        
        .call-status {
          background: rgba(102, 126, 234, 0.1);
          padding: 1rem;
          border-radius: 10px;
          text-align: center;
          color: #667eea;
          font-weight: 600;
        }
        
        .call-status p {
          margin: 0.3rem 0;
        }
        
        /* ===== EDIT SECTION ===== */
        .admin-edit h3 {
          margin-bottom: 1rem;
          color: #667eea;
        }
        
        .admin-edit p {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .app.dark .admin-edit p {
          color: #bbb;
        }
        
        .edit-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
        }
        
        .edit-info {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 10px;
          border-left: 4px solid #667eea;
        }
        
        .edit-info p {
          margin: 0.5rem 0;
          color: #667eea;
        }
        
        /* ===== EDIT MODE CONTROLS ===== */
        .edit-controls {
          position: fixed;
          top: 50%;
          right: 2rem;
          transform: translateY(-50%);
          background: white;
          padding: 1rem;
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 900;
          animation: slideIn 0.3s ease;
        }
        
        .app.dark .edit-controls {
          background: rgba(15, 12, 41, 0.98);
          border: 1px solid rgba(102, 126, 234, 0.5);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
        
        .edit-control-btn {
          background: white;
          border: 2px solid #e0e0e0;
          padding: 0.75rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #667eea;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .app.dark .edit-control-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .edit-control-btn:hover:not(:disabled) {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          transform: scale(1.05);
        }
        
        .edit-control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .edit-control-btn.btn-success {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
          border-color: transparent;
        }
        
        .edit-control-btn.btn-danger {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border-color: transparent;
        }
        
        .edit-control-divider {
          height: 1px;
          background: #e0e0e0;
          margin: 0.5rem 0;
        }
        
        .app.dark .edit-control-divider {
          background: rgba(102, 126, 234, 0.3);
        }
        
        /* ===== FOOTER ===== */
        .footer {
          background: rgba(44, 62, 80, 0.95);
          color: white;
          text-align: center;
          padding: 2rem;
          margin-top: 4rem;
        }
        
        .footer p {
          margin: 0.5rem 0;
          opacity: 0.9;
        }
        
        /* ===== RESPONSIVE DESIGN ===== */
        @media (max-width: 1024px) {
          .admin-panel {
            width: 100%;
            left: -100%;
          }
          
          .sidebar {
            width: 100%;
            right: -100%;
          }
        }
        
        @media (max-width: 768px) {
          .navbar {
            padding: 1rem;
            flex-wrap: wrap;
          }
          
          .navbar-links {
            order: 3;
            width: 100%;
            margin-top: 1rem;
          }
          
          .nav-link {
            font-size: 0.85rem;
            padding: 0.5rem 0.75rem;
          }
          
          .hero-title {
            font-size: 2.5rem;
          }
          
          .page-title {
            font-size: 2rem;
          }
          
          .page-content {
            padding: 2rem 1.5rem;
          }
          
          .edit-controls {
            right: 1rem;
            padding: 0.75rem;
          }
          
          .admin-access-btn {
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DevelopmentTeamWebsite;
