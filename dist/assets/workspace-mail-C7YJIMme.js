import"./modulepreload-polyfill-BTn-X1SE.js";import{initializeApp as me}from"https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";import{getFirestore as ue,setDoc as ee,doc as u,serverTimestamp as w,getDoc as pe,addDoc as W,collection as x,query as fe,orderBy as ge,onSnapshot as te,updateDoc as g}from"https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";import{getAuth as ye,GoogleAuthProvider as be,signInWithEmailAndPassword as he,createUserWithEmailAndPassword as we,updateProfile as ne,signInWithPopup as ve,signOut as Ee,onAuthStateChanged as Ie}from"https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";const ke={apiKey:"AIzaSyBy7_8PHwKIYfw9s72AMDhgfI26Xe2ux1I",authDomain:"mokza-eedf0.firebaseapp.com",projectId:"mokza-eedf0",storageBucket:"mokza-eedf0.firebasestorage.app",messagingSenderId:"416552102227",appId:"1:416552102227:web:4bf54a87acbe27acce59a6"},oe=me(ke),d=ue(oe),A=ye(oe),Se=new be;let i=null,m=[],F="inbox",l=null,v=new Set,R=[],Q=null,M=!0,Be=!1,S=[],N=[],C=0,z=300,h=!1,j=null,ae="#4A80F5",I=null,k=null,U=null,H=[];window.switchAuthTab=xe;window.doLogin=Ae;window.doRegister=$e;window.doGoogleLogin=Le;window.doLogout=Te;window.toggleSidebar=yt;window.setFolder=Qe;window.openCompose=$;window.closeCompose=L;window.minimizeCompose=Fe;window.sendEmail=We;window.scheduleSend=Ue;window.autoSaveDraft=Ke;window.handleSearch=le;window.showSearchFilters=Xe;window.hideSearchFilters=Ze;window.applyFilter=et;window.toggleSelectAll=Ge;window.bulkAction=qe;window.toggleSort=Ve;window.openSettings=ct;window.closeSettings=G;window.switchSettingsTab=mt;window.openLabelCreate=nt;window.closeLabelModal=re;window.createLabel=at;window.selectLabelColor=ot;window.saveProfileName=ut;window.saveApiKey=pt;window.aiAssistCompose=De;window.acceptAiSuggestion=Ne;window.closeAiAssist=K;window.toggleMarkdownMode=Ye;window.formatText=Je;window.triggerFileAttach=_e;window.handleFileAttach=Oe;window.setExpiryOnCompose=He;window.stopSpeedReader=q;window.toggleSpeedPlay=de;window.adjustWPM=gt;window.toggleNotifDropdown=lt;window.clearNotifications=rt;window.showToast=a;window.devModeEnabled=Be;window.testApiEmail=bt;window.showFirestoreSchema=ht;function xe(e){document.querySelectorAll(".auth-tab").forEach((t,n)=>t.classList.toggle("active",n===0&&e==="login"||n===1&&e==="register")),document.getElementById("login-form").style.display=e==="login"?"":"none",document.getElementById("register-form").style.display=e==="register"?"":"none",document.getElementById("auth-error").style.display="none"}async function Ae(){const e=document.getElementById("login-email").value,t=document.getElementById("login-password").value;if(!e||!t)return B("Please fill in all fields.");try{await he(A,e,t)}catch(n){B(_(n))}}async function $e(){const e=document.getElementById("reg-name").value,t=document.getElementById("reg-email").value,n=document.getElementById("reg-password").value;if(!e||!t||!n)return B("Please fill in all fields.");try{const o=await we(A,t,n);await ne(o.user,{displayName:e}),await ee(u(d,"users",o.user.uid),{name:e,email:t,createdAt:w(),settings:{theme:"dark",notifications:!0}}),await se(o.user)}catch(o){B(_(o))}}async function Le(){try{const e=await ve(A,Se),t=u(d,"users",e.user.uid);(await pe(t)).exists()||(await ee(t,{name:e.user.displayName||"User",email:e.user.email,createdAt:w(),settings:{theme:"dark",notifications:!0}}),await se(e.user))}catch(e){B(_(e))}}async function Te(){I&&I(),k&&k(),await Ee(A),G(),document.getElementById("app").classList.remove("visible"),document.getElementById("auth-screen").style.display="flex"}function B(e){const t=document.getElementById("auth-error");t.textContent=e,t.style.display="block"}function _(e){return{"auth/user-not-found":"User not found.","auth/wrong-password":"Wrong password.","auth/email-already-in-use":"Email already registered.","auth/weak-password":"Password must be at least 6 chars.","auth/invalid-email":"Invalid email address.","auth/popup-closed-by-user":"Sign-in popup closed."}[e.code]||e.message||"An error occurred."}async function se(e){const t=[{from:"gabriel@mokza.com",fromName:"Gabriel (Mokza)",to:[e.email],subject:"🚀 Welcome to Mokza Nexus Mail!",body:`Hi ${e.displayName||"there"},

Welcome to Mokza Nexus Mail — your workspace-aware communication engine.

Here's what you can do:
• Compose and manage emails within your Mokza workspace
• Use AI to summarize threads and suggest replies (set your API key in Settings → AI)
• Link emails to projects and tasks
• Enable Dev Mode to inspect raw email data

Let's build something incredible together.

— The Mokza Team`,labels:["inbox"],isRead:!1,isStarred:!1,isImportant:!0,priority:9,folder:"inbox",attachments:[],aiSummary:"Welcome email from Mokza Studios introducing Nexus Mail features and capabilities."},{from:"anna@dts.com",fromName:"Anna Chen",to:[e.email],subject:"Q3 Sprint Planning — your input needed",body:`Hey,

Following up on yesterday's standup. We need your input on the sprint goals before EOD Friday.

Specifically:
1. Authentication module — is the OAuth flow ready?
2. Dashboard performance — the load time is still above 3s
3. Mobile responsiveness — any blockers?

Please update the board by Thursday. If you need to talk it through, grab a slot on my calendar.

Best,
Anna`,labels:["inbox"],isRead:!1,isStarred:!0,isImportant:!0,priority:8,folder:"inbox",attachments:[{name:"sprint_plan_q3.pdf",size:"284 KB",icon:"📄"}],aiSummary:"Anna needs input on Q3 sprint goals by Friday — OAuth, dashboard performance, and mobile responsiveness."},{from:"devops@mokza.com",fromName:"Mokza DevOps Bot",to:[e.email],subject:"⚠️ Production Alert: High CPU usage detected",body:`ALERT: Production server CPU usage exceeded 85% threshold.

Server: prod-api-01
Time: 14:32 UTC
CPU: 87% (threshold: 85%)
Memory: 62%

Action: Please investigate. Auto-scale triggered.

— Mokza DevOps Monitoring`,labels:["inbox","important"],isRead:!1,isStarred:!1,isImportant:!0,priority:10,folder:"inbox",attachments:[],aiSummary:"Production server CPU at 87%, above 85% threshold. Auto-scale triggered at 14:32 UTC."},{from:"marcus@startup.io",fromName:"Marcus Williams",to:[e.email],subject:"Partnership proposal — AI integration",body:`Hi,

I came across Mokza Studios' work on the AI-powered workspace tools and I'm very impressed.

We're building an AI layer for enterprise dev teams and think there's a strong synergy with what you're building. Would love to set up a 30-min call this week to explore collaboration.

Let me know what works.

Best,
Marcus`,labels:["inbox"],isRead:!0,isStarred:!1,isImportant:!1,priority:4,folder:"inbox",attachments:[{name:"partnership_deck.pdf",size:"1.2 MB",icon:"📄"},{name:"company_overview.png",size:"340 KB",icon:"🖼️"}],aiSummary:"Marcus from Startup.io proposes a partnership for AI integration. Requesting a 30-min call."},{from:"hr@mokza.com",fromName:"Mokza HR",to:[e.email],subject:"Team offsite — save the date 🗓",body:`Hi everyone,

We're planning the next Mokza team offsite!

📅 Date: June 14–16
📍 Location: Montréal, QC
🏨 Hotel: Le Germain Hôtel (rooms reserved)

Please confirm your attendance by May 30 via the HR portal.

Travel reimbursement: up to $400 CAD.

Excited to see you all!

— Mokza HR Team`,labels:["inbox"],isRead:!0,isStarred:!1,isImportant:!1,priority:3,folder:"inbox",attachments:[],aiSummary:"Mokza team offsite June 14-16 in Montréal. Confirm by May 30, travel up to $400 CAD covered."},{from:e.email,fromName:e.displayName||"You",to:["anna@dts.com"],subject:"Re: Q3 Sprint Planning",body:`Hi Anna,

Just took a look at the board. Quick update:

1. OAuth flow is done and tested — PR is up for review (#247)
2. Dashboard perf — I found the bottleneck. It's the analytics query. Down to 1.8s after indexing.
3. Mobile — one remaining issue with the nav drawer on Android. Should be fixed by Wednesday.

I'll update the board by EOD tomorrow.

Cheers`,labels:["sent"],isRead:!0,isStarred:!1,isImportant:!1,priority:2,folder:"sent",attachments:[],aiSummary:"Reply to Anna's sprint planning email. OAuth done, dashboard fixed to 1.8s, mobile fix by Wednesday."}];for(const n of t)await W(x(d,"users",e.uid,"emails"),{...n,createdAt:w(),updatedAt:w(),screened:!0,selfDestruct:null,readReceipt:!1})}Ie(A,async e=>{document.getElementById("app-loading").style.display="none",e?(i=e,document.getElementById("auth-screen").style.display="none",document.getElementById("app").classList.add("visible"),ie(e),Me(),Ce(),it()):(document.getElementById("auth-screen").style.display="flex",document.getElementById("app").classList.remove("visible"))});function ie(e){const t=(e.displayName||e.email||"U").split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2);document.getElementById("user-avatar").textContent=t,document.getElementById("sidebar-avatar").textContent=t,document.getElementById("settings-avatar").textContent=t,document.getElementById("sidebar-name").textContent=e.displayName||"User",document.getElementById("sidebar-email").textContent=e.email||"",document.getElementById("settings-name-display").textContent=e.displayName||"User",document.getElementById("settings-email-display").textContent=e.email||"",document.getElementById("settings-name-input").value=e.displayName||"";const n=localStorage.getItem("dts_ai_key")||"";n&&(document.getElementById("ai-api-key-input").value=n)}function Ce(){I&&I(),document.getElementById("email-skeleton").style.display="block";const e=fe(x(d,"users",i.uid,"emails"),ge("createdAt","desc"));I=te(e,t=>{m=t.docs.map(n=>({id:n.id,...n.data()})),document.getElementById("email-skeleton").style.display="none",P(),st(),dt()},t=>{document.getElementById("email-skeleton").style.display="none",a("Could not load emails: "+t.message,"error")})}function Me(){k&&k();const e=x(d,"users",i.uid,"labels");k=te(e,t=>{R=t.docs.map(n=>({id:n.id,...n.data()})),tt()})}function P(){const e=document.getElementById("email-list-body"),t=document.getElementById("search-input").value.toLowerCase().trim();let n=ze(m,F);if(t&&(n=n.filter(o=>je(o,t))),M||(n=[...n].reverse()),n.length===0){e.innerHTML=`<div class="empty-state"><div class="empty-icon">${Et(F)}</div><h3>${t?"No results":"All clear!"}</h3><p>${t?"Try different search terms.":"Nothing here right now."}</p></div>`;return}e.innerHTML=n.map(o=>Re(o)).join("")}function ze(e,t){switch(t){case"inbox":return e.filter(n=>n.folder==="inbox"&&!n.deleted&&!n.archived);case"starred":return e.filter(n=>n.isStarred&&!n.deleted);case"important":return e.filter(n=>n.isImportant&&!n.deleted);case"sent":return e.filter(n=>n.folder==="sent"&&!n.deleted);case"drafts":return e.filter(n=>n.folder==="drafts"&&!n.deleted);case"snoozed":return e.filter(n=>n.snoozed&&!n.deleted);case"screener":return e.filter(n=>n.screened===!1&&!n.deleted);case"trash":return e.filter(n=>n.deleted);default:return e.filter(n=>n.labels&&n.labels.includes(t)&&!n.deleted)}}function je(e,t){return t.startsWith("from:")?(e.from||"").toLowerCase().includes(t.slice(5)):t.startsWith("is:unread")?!e.isRead:t.startsWith("is:starred")?e.isStarred:t.startsWith("is:important")?e.isImportant:t.startsWith("has:attachment")?e.attachments&&e.attachments.length>0:(e.subject||"").toLowerCase().includes(t)||(e.body||"").toLowerCase().includes(t)||(e.from||"").toLowerCase().includes(t)||(e.fromName||"").toLowerCase().includes(t)}function Re(e){const t=!e.isRead,n=l&&l.id===e.id,o=wt(e.createdAt),r=(e.labels||[]).filter(y=>!["inbox","sent","drafts","trash"].includes(y)).map(y=>{const p=R.find(D=>D.name===y);return p?`<span class="email-label-tag" style="color:${p.color};border-color:${p.color}30;background:${p.color}12">${p.name}</span>`:""}).join(""),c=e.isImportant?'<span style="font-size:10px;color:var(--amber)">●</span>':"",s=e.attachments&&e.attachments.length>0?"📎":"",b=e.screened===!1?'<span style="font-size:10px;color:var(--amber)">🛡 Unscreened</span>':"";return`<div class="email-row${t?" unread":""}${n?" active":""}" onclick="openEmail('${e.id}')" id="row-${e.id}">
    <input type="checkbox" class="email-check" ${v.has(e.id)?"checked":""} onclick="event.stopPropagation();toggleEmailSelect('${e.id}',this)">
    <span class="email-star${e.isStarred?" starred":""}" onclick="event.stopPropagation();toggleStar('${e.id}')" title="Star">${e.isStarred?"★":"☆"}</span>
    ${t?'<div class="unread-dot"></div>':""}
    <div class="email-main">
      <div class="email-row-top">
        <span class="email-sender">${c} ${e.fromName||e.from}</span>
        <span class="email-time">${o}</span>
      </div>
      <div class="email-subject">${e.subject||"(No subject)"} ${s}</div>
      <div class="email-preview">${(e.body||"").replace(/\n/g," ").slice(0,80)}…</div>
      ${r||b?`<div class="email-row-flags">${r}${b}</div>`:""}
    </div>
    <div class="email-row-hover-actions">
      <button class="btn-icon" onclick="event.stopPropagation();archiveEmail('${e.id}')" title="Archive">📦</button>
      <button class="btn-icon" onclick="event.stopPropagation();snoozeEmail('${e.id}')" title="Snooze">😴</button>
      <button class="btn-icon" onclick="event.stopPropagation();deleteEmail('${e.id}')" title="Delete">🗑️</button>
    </div>
  </div>`}window.openEmail=O;async function O(e){if(l=m.find(n=>n.id===e),!l)return;l.isRead||(await g(u(d,"users",i.uid,"emails",e),{isRead:!0}),l.isRead=!0),Pe(l),document.querySelectorAll(".email-row").forEach(n=>n.classList.remove("active"));const t=document.getElementById("row-"+e);t&&t.classList.add("active")}function Pe(e){document.getElementById("email-placeholder").style.display="none";const t=document.getElementById("email-view-content");t.style.display="block";const n=It(e.from||"A"),o=(e.fromName||e.from||"?").split(" ").map(f=>f[0]).join("").toUpperCase().slice(0,2),r=e.attachments&&e.attachments.length>0,c=localStorage.getItem("dts_ai_key"),s=e.aiSummary||c,b=(e.labels||[]).filter(f=>!["inbox","sent","drafts","trash"].includes(f)).map(f=>{const E=R.find(ce=>ce.name===f);return E?`<span class="tag" style="color:${E.color};border-color:${E.color}40;background:${E.color}15">${E.name}</span>`:""}).join(""),y=e.screened===!1?`<div class="screener-banner"><span class="icon">🛡️</span><div class="info"><strong>Screener:</strong> First time hearing from this sender. Do you want to approve them?</div><button class="btn btn-ghost btn-sm" onclick="approveSender('${e.id}')">Approve</button><button class="btn btn-danger btn-sm" onclick="blockSender('${e.id}')">Block</button></div>`:"",p=e.selfDestruct?`<span class="expiry-badge">💣 Self-destructs: ${e.selfDestruct}</span>`:"",D=e.readReceipt?'<span class="read-receipt-badge">✓✓ Read</span>':"";t.innerHTML=`
    <div class="email-view-topbar">
      <button class="btn-icon" onclick="replyEmail('${e.id}')" title="Reply">↩️ Reply</button>
      <button class="btn-icon" onclick="replyAllEmail('${e.id}')" title="Reply All">↩️ All</button>
      <button class="btn-icon" onclick="forwardEmail('${e.id}')" title="Forward">↪️ Forward</button>
      <div style="flex:1"></div>
      ${p}
      ${D}
      <button class="btn-icon" onclick="toggleStar('${e.id}')" title="Star">${e.isStarred?"★":"☆"}</button>
      <button class="btn-icon" onclick="markImportant('${e.id}')" title="Important">${e.isImportant?"🏷️":"🔖"}</button>
      <button class="btn-icon" onclick="snoozeEmail('${e.id}')" title="Snooze">😴</button>
      <button class="btn-icon" onclick="archiveEmail('${e.id}')" title="Archive">📦</button>
      <button class="btn-icon" onclick="deleteEmail('${e.id}')" title="Delete">🗑️</button>
      <button class="btn btn-ghost btn-sm" onclick="openSpeedReader('${e.id}')" title="Speed Read">⚡ Read Fast</button>
      
    </div>
    ${y}
    <div class="email-view-subject">${e.subject||"(No subject)"}</div>
    <div style="padding:4px 20px 0">${b}</div>
    <div class="email-meta">
      <div class="email-meta-avatar" style="background:${n}">${o}</div>
      <div class="email-meta-info">
        <div class="email-meta-from">${e.fromName||e.from} <span style="color:var(--txt-3);font-size:12px">&lt;${e.from}&gt;</span></div>
        <div class="email-meta-to">To: ${(e.to||[]).join(", ")}</div>
      </div>
      <div class="email-meta-date">${vt(e.createdAt)}</div>
    </div>
    ${s?`<div class="ai-summary-card" id="ai-card-${e.id}">
      <div class="ai-badge">✨ AI Summary</div>
      <p id="ai-summary-text-${e.id}">${e.aiSummary||"Click to generate summary…"}</p>
      <div class="ai-actions-row">
        <button class="ai-action-btn" onclick="aiAction('summarize','${e.id}')">📋 Summarize</button>
        <button class="ai-action-btn" onclick="aiAction('reply','${e.id}')">✍️ Suggest Reply</button>
        <button class="ai-action-btn" onclick="aiAction('tasks','${e.id}')">✅ Extract Tasks</button>
        <button class="ai-action-btn" onclick="aiAction('tone','${e.id}')">🎭 Change Tone</button>
      </div>
    </div>`:""}
    <div class="email-body">${e.body||""}</div>
    ${r?`<div class="email-attachments">
      <div class="attachments-title">📎 Attachments (${e.attachments.length})</div>
      <div class="attachments-grid">${e.attachments.map(f=>`<div class="attachment-card"><span class="attachment-icon">${f.icon||"📄"}</span><div><div class="attachment-name">${f.name}</div><div class="attachment-size">${f.size||""}</div></div></div>`).join("")}</div>
    </div>`:""}
    <div class="workspace-panel">
      <div class="workspace-panel-title">
        <span>🔗 Workspace</span>
        <button class="btn-icon" style="font-size:11px;color:var(--txt-3)" onclick="showToast('Workspace panel expanded','info')">expand</button>
      </div>
      <div class="workspace-links">
        <div class="workspace-link" onclick="showToast('Linked to Project Alpha','success')"><span>📁</span> Project Alpha</div>
        <div class="workspace-link" onclick="showToast('Linked to Task #421','success')"><span>✅</span> Task #421 — Fix login flow</div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="convertToTask('${e.id}')">+ Convert to Task</button>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Link project dialog coming soon','info')">+ Link Project</button>
      </div>
    </div>
    <div class="email-reply-bar">
      <button class="btn btn-ghost btn-sm" onclick="replyEmail('${e.id}')">↩️ Reply</button>
      <button class="btn btn-ghost btn-sm" onclick="replyAllEmail('${e.id}')">↩️ Reply All</button>
      <button class="btn btn-ghost btn-sm" onclick="forwardEmail('${e.id}')">↪️ Forward</button>
    </div>
    
  `}window.switchDevTab=function(e,t){document.querySelectorAll(".dev-tab").forEach(n=>n.classList.remove("active")),e.classList.add("active"),document.getElementById("dev-raw-json").style.display=t==="raw-json"?"block":"none",document.getElementById("dev-headers").style.display=t==="headers"?"block":"none",document.getElementById("dev-metadata").style.display=t==="metadata"?"block":"none"};async function De(){var s,b;const e=localStorage.getItem("dts_ai_key");if(!e){a("Set your API key in Settings → AI","error");return}const t=document.getElementById("compose-subject").value,n=document.getElementById("compose-to").value,o=document.getElementById("compose-body").value;if(!t&&!o){a("Add a subject or some content first","info");return}const r=document.getElementById("ai-assist-bar"),c=document.getElementById("ai-assist-text");r.classList.add("visible"),c.textContent="✨ Generating suggestion…";try{const p=await(await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":e,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:`Write a professional email body based on this info:
To: ${n}
Subject: ${t}
Draft: ${o||"(empty)"}

Just the email body, no subject line, no greeting header.`}]})})).json();window._aiSuggestedText=((b=(s=p.content)==null?void 0:s[0])==null?void 0:b.text)||"",c.textContent=window._aiSuggestedText}catch(y){c.textContent="Error: "+y.message}}function Ne(){window._aiSuggestedText&&(document.getElementById("compose-body").value=window._aiSuggestedText),K()}function K(){document.getElementById("ai-assist-bar").classList.remove("visible")}function $(e={}){document.getElementById("compose-overlay").classList.add("open"),document.getElementById("compose-to").value=e.to||"",document.getElementById("compose-subject").value=e.subject||"",document.getElementById("compose-body").value=e.body||"",document.getElementById("compose-title").textContent=e.title||"New Message",document.getElementById("compose-attachments").innerHTML="",document.getElementById("compose-expiry").style.display="none",H=[],U=null,K()}function L(){document.getElementById("compose-overlay").classList.remove("open")}function Fe(){L(),a("Draft saved","info")}window.replyEmail=function(e){const t=m.find(n=>n.id===e);t&&$({to:t.from,subject:"Re: "+t.subject,title:"Reply"})};window.replyAllEmail=function(e){const t=m.find(n=>n.id===e);t&&$({to:[t.from,...t.to||[]].join(", "),subject:"Re: "+t.subject,title:"Reply All"})};window.forwardEmail=function(e){const t=m.find(n=>n.id===e);t&&$({subject:"Fwd: "+t.subject,body:`---------- Forwarded message ----------
`+t.body,title:"Forward"})};async function We(){const e=document.getElementById("compose-to").value,t=document.getElementById("compose-subject").value,n=document.getElementById("compose-body").value;if(!e||!t||!n){a("Please fill in To, Subject, and message.","error");return}try{await W(x(d,"users",i.uid,"emails"),{from:i.email,fromName:i.displayName||i.email,to:e.split(",").map(o=>o.trim()),cc:document.getElementById("compose-cc").value?document.getElementById("compose-cc").value.split(",").map(o=>o.trim()):[],subject:t,body:n,labels:["sent"],isRead:!0,isStarred:!1,isImportant:!1,priority:0,folder:"sent",attachments:H,selfDestruct:U,readReceipt:!1,screened:!0,createdAt:w(),updatedAt:w()}),L(),a("Email sent ✓","success"),J("📤 Email sent to "+e)}catch(o){a("Failed to send: "+o.message,"error")}}async function Ue(){const e=prompt("Schedule send (YYYY-MM-DD HH:MM):");e&&(a("Scheduled for "+e+" ✓","success"),L())}function He(){const e=prompt("Self-destruct after how many hours? (e.g. 24):","24");e&&!isNaN(e)&&(U=new Date(Date.now()+parseInt(e)*36e5).toISOString().slice(0,16).replace("T"," "),document.getElementById("expiry-time-label").textContent=e+"h",document.getElementById("compose-expiry").style.display="flex",document.getElementById("compose-expiry").style.alignItems="center",document.getElementById("compose-expiry").style.gap="8px")}function _e(){document.getElementById("file-input").click()}function Oe(e){const t=document.getElementById("compose-attachments");Array.from(e).forEach(n=>{H.push({name:n.name,size:X(n.size),icon:Z(n.name)});const o=document.createElement("div");o.className="attachment-card",o.style.cursor="default",o.innerHTML=`${Z(n.name)} <span>${n.name}</span> <span style="color:var(--txt-3)">${X(n.size)}</span>`,t.appendChild(o)})}function Ke(){clearTimeout(Q),Q=setTimeout(()=>{},3e3)}function Je(e){const t=document.getElementById("compose-body"),n=t.selectionStart,o=t.selectionEnd;if(n===o)return;const r=t.value.slice(n,o),c={bold:"**",italic:"_",underline:"__"};if(c[e]){const s=c[e];t.value=t.value.slice(0,n)+s+r+s+t.value.slice(o)}}function Ye(){a("Markdown mode toggled","info")}window.toggleStar=async function(e){const t=m.find(n=>n.id===e);t&&(await g(u(d,"users",i.uid,"emails",e),{isStarred:!t.isStarred}),a(t.isStarred?"Unstarred":"Starred ⭐","info"))};window.markImportant=async function(e){const t=m.find(n=>n.id===e);t&&(await g(u(d,"users",i.uid,"emails",e),{isImportant:!t.isImportant}),a(t.isImportant?"Marked normal":"Marked important 🏷️","info"),l&&l.id===e&&O(e))};window.archiveEmail=async function(e){await g(u(d,"users",i.uid,"emails",e),{archived:!0,folder:"archive"}),a("Archived","success"),l&&l.id===e&&T()};window.deleteEmail=async function(e){await g(u(d,"users",i.uid,"emails",e),{deleted:!0}),a("Moved to Trash","info"),l&&l.id===e&&T()};window.snoozeEmail=async function(e){const t=prompt("Snooze for how many hours?","2");t&&!isNaN(t)&&(await g(u(d,"users",i.uid,"emails",e),{snoozed:!0,snoozeUntil:new Date(Date.now()+parseInt(t)*36e5).toISOString()}),a("Snoozed for "+t+"h 😴","success"),l&&l.id===e&&T())};window.approveSender=async function(e){await g(u(d,"users",i.uid,"emails",e),{screened:!0}),a("Sender approved ✓","success"),l&&l.id===e&&O(e)};window.blockSender=async function(e){await g(u(d,"users",i.uid,"emails",e),{deleted:!0}),a("Sender blocked & email removed","info"),T()};window.convertToTask=function(e){const t=m.find(n=>n.id===e);t&&(a('Task created: "'+t.subject+'" ✅',"success"),J("✅ Task created from email: "+t.subject))};function T(){l=null,document.getElementById("email-placeholder").style.display="flex",document.getElementById("email-view-content").style.display="none"}function Ge(e){document.querySelectorAll(".email-check").forEach(t=>{var o,r;t.checked=e;const n=(r=(o=t.closest(".email-row"))==null?void 0:o.id)==null?void 0:r.replace("row-","");n&&(e?v.add(n):v.delete(n))}),document.getElementById("bulk-actions").classList.toggle("visible",e)}function qe(e){if(v.size===0)return;const t=[...v];e==="delete"&&t.forEach(n=>deleteEmail(n)),e==="archive"&&t.forEach(n=>archiveEmail(n)),e==="read"&&t.forEach(n=>g(u(d,"users",i.uid,"emails",n),{isRead:!0})),v.clear(),document.getElementById("bulk-actions").classList.remove("visible"),document.getElementById("select-all").checked=!1,a(t.length+" emails updated","success")}function Qe(e){F=e,document.querySelectorAll(".nav-item").forEach(o=>o.classList.remove("active"));const t=document.getElementById("nav-"+e);t&&t.classList.add("active");const n={inbox:"Inbox",starred:"Starred",important:"Important",sent:"Sent",drafts:"Drafts",snoozed:"Snoozed",screener:"Screener",trash:"Trash"};document.getElementById("folder-title").textContent=n[e]||e.charAt(0).toUpperCase()+e.slice(1),T(),P()}function Ve(){M=!M,document.getElementById("sort-label").textContent=M?"Newest":"Oldest",P()}let V;function le(e){clearTimeout(V),V=setTimeout(()=>P(),200)}function Xe(){document.getElementById("search-filters").classList.add("visible")}function Ze(){setTimeout(()=>document.getElementById("search-filters").classList.remove("visible"),200)}function et(e){const t=document.getElementById("search-input");t.value=e,t.focus(),le()}function tt(){const e=document.getElementById("labels-list");e.innerHTML=R.map(t=>`<div class="nav-item" onclick="setFolder('${t.name}')"><span class="nav-icon"><span class="label-dot" style="background:${t.color}"></span></span><span class="nav-label">${t.name}</span></div>`).join("")}function nt(){document.getElementById("label-modal").classList.add("open")}function re(){document.getElementById("label-modal").classList.remove("open")}function ot(e){document.querySelectorAll(".label-color-swatch").forEach(t=>t.classList.remove("selected")),e.classList.add("selected"),ae=e.dataset.color}async function at(){const e=document.getElementById("label-name-input").value.trim();if(!e)return a("Enter a label name","error");await W(x(d,"users",i.uid,"labels"),{name:e,color:ae,createdAt:w()}),re(),document.getElementById("label-name-input").value="",a('Label "'+e+'" created ✓',"success")}function st(){const e=m.filter(s=>!s.isRead&&s.folder==="inbox"&&!s.deleted).length,t=m.filter(s=>s.folder==="drafts"&&!s.deleted).length,n=m.filter(s=>s.screened===!1&&!s.deleted).length,o=document.getElementById("unread-count"),r=document.getElementById("drafts-count"),c=document.getElementById("screener-count");o.textContent=e,o.style.display=e>0?"":"none",r.textContent=t,r.style.display=t>0?"":"none",c.textContent=n,c.style.display=n>0?"":"none"}function it(){S=[{text:"New email from anna@dts.com",time:"Just now",icon:"📧"},{text:"Reminder: Reply to sprint planning email",time:"2h ago",icon:"🔔"},{text:"Production alert: CPU usage elevated",time:"3h ago",icon:"⚠️"}],Y()}function J(e){S.unshift({text:e,time:"Just now",icon:"📬"}),Y(),document.getElementById("notif-dot").style.display="block"}function Y(){const e=document.getElementById("notif-list");e.innerHTML=S.slice(0,8).map(t=>`<div class="notif-item"><div class="notif-item-row"><div class="notif-item-icon">${t.icon}</div><div class="notif-item-text">${t.text}<small>${t.time}</small></div></div></div>`).join(""),S.length===0&&(e.innerHTML='<div style="padding:24px;text-align:center;color:var(--txt-3);font-size:13px">No notifications</div>')}function lt(){document.getElementById("notif-dropdown").classList.toggle("open"),document.getElementById("notif-dot").style.display="none"}function rt(){S=[],Y(),document.getElementById("notif-dropdown").classList.remove("open")}function dt(){const e=m.filter(t=>t.folder==="inbox"&&!t.isRead&&t.priority>=7);e.length>0&&Math.random()>.7&&J("⏰ Reminder: You have "+e.length+" important unread email(s)")}function ct(){document.getElementById("settings-overlay").classList.add("open"),document.getElementById("notif-dropdown").classList.remove("open")}function G(){document.getElementById("settings-overlay").classList.remove("open")}function mt(e,t){document.querySelectorAll(".settings-section").forEach(n=>n.classList.remove("active")),document.querySelectorAll(".settings-nav-item").forEach(n=>n.classList.remove("active")),document.getElementById("section-"+e).classList.add("active"),t&&t.classList.add("active")}async function ut(){const e=document.getElementById("settings-name-input").value.trim();if(!e)return a("Enter a name","error");try{await ne(i,{displayName:e}),ie(i),a("Profile updated ✓","success")}catch(t){a("Failed to update: "+t.message,"error")}}function pt(){const e=document.getElementById("ai-api-key-input").value.trim();if(!e)return a("Enter an API key","error");localStorage.setItem("dts_ai_key",e),a("API key saved ✓","success")}function q(){clearInterval(j),h=!1,document.getElementById("speed-reader").classList.remove("open")}function de(){h=!h,document.getElementById("speed-play-btn").textContent=h?"⏸ Pause":"▶ Play",h?j=setInterval(()=>{if(C>=N.length){q();return}ft(N[C],C,N.length),C++},6e4/z):clearInterval(j)}function ft(e,t,n){const o=Math.floor(e.length/2),r=document.getElementById("speed-reader-word");r.innerHTML=`${e.slice(0,o)}<span class="focus-letter">${e[o]||""}</span>${e.slice(o+1)}`,document.getElementById("speed-bar").style.width=t/n*100+"%"}function gt(e){z=Math.max(100,Math.min(1e3,z+e)),document.getElementById("wpm-display").textContent=z+" WPM",h&&(clearInterval(j),h=!1,de())}function yt(){document.getElementById("sidebar").classList.toggle("collapsed")}function bt(){const e=document.getElementById("dev-output"),t=document.getElementById("dev-output-code");e.style.display="block",t.textContent=`POST /api/send-email
{
  "to": ["test@mokza.com"],
  "subject": "API Test Email",
  "body": "This is a test email sent via Mokza API",
  "headers": { "X-Mokza-Source": "API" }
}

→ 200 OK
{ "id": "email_`+Math.random().toString(36).slice(2,10)+'", "status": "sent" }',a("API test email simulated ✓","success")}function ht(){const e=document.getElementById("dev-output"),t=document.getElementById("dev-output-code");e.style.display="block",t.textContent=`Firestore Schema — Mokza Nexus Mail
==================================

users/{userId}
  ├─ emails/{emailId}
  │    from: string
  │    fromName: string
  │    to: string[]
  │    cc: string[]
  │    subject: string
  │    body: string
  │    labels: string[]
  │    isRead: boolean
  │    isStarred: boolean
  │    isImportant: boolean
  │    priority: number (0-10, AI)
  │    folder: 'inbox'|'sent'|'drafts'|'trash'
  │    attachments: {name,size,icon,url}[]
  │    aiSummary: string
  │    aiTags: string[]
  │    selfDestruct: string|null (ISO date)
  │    screened: boolean
  │    readReceipt: boolean
  │    archived: boolean
  │    deleted: boolean
  │    snoozed: boolean
  │    snoozeUntil: string
  │    createdAt: Timestamp
  │    updatedAt: Timestamp
  │
  ├─ labels/{labelId}
  │    name: string
  │    color: string (hex)
  │    createdAt: Timestamp
  │
  └─ drafts/{draftId}
       to: string[]
       subject: string
       body: string
       updatedAt: Timestamp

threads/{threadId}
  participants: string[]
  lastMessage: string
  lastUpdated: Timestamp`}function a(e,t="info"){const n=document.getElementById("toast-container"),o=document.createElement("div");o.className=`toast toast-${t}`,o.textContent=e,n.appendChild(o),setTimeout(()=>{o.style.opacity="0",o.style.transition="opacity 0.3s",setTimeout(()=>o.remove(),300)},3e3)}function wt(e){if(!e)return"";const t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e),o=(new Date-t)/1e3;return o<60?"now":o<3600?Math.floor(o/60)+"m":o<86400?t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):o<604800?t.toLocaleDateString([],{weekday:"short"}):t.toLocaleDateString([],{month:"short",day:"numeric"})}function vt(e){if(!e)return"";const t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e);return t.toLocaleDateString([],{weekday:"long",year:"numeric",month:"long",day:"numeric"})+" at "+t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function Et(e){return{inbox:"📥",starred:"⭐",important:"🏷️",sent:"📤",drafts:"📝",trash:"🗑️",snoozed:"😴",screener:"🛡️"}[e]||"📁"}function It(e){const t=["#4A80F5","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#14B8A6","#F97316"];let n=0;for(let o=0;o<e.length;o++)n=e.charCodeAt(o)+((n<<5)-n);return t[Math.abs(n)%t.length]}function X(e){return e<1024?e+"B":e<1048576?(e/1024).toFixed(0)+"KB":(e/1048576).toFixed(1)+"MB"}function Z(e){const t=e.split(".").pop().toLowerCase();return{pdf:"📄",doc:"📝",docx:"📝",xls:"📊",xlsx:"📊",png:"🖼️",jpg:"🖼️",jpeg:"🖼️",gif:"🖼️",mp4:"🎬",zip:"📦",rar:"📦",json:"💻",js:"💻",ts:"💻"}[t]||"📎"}document.addEventListener("click",e=>{e.target.closest(".notif-btn")||document.getElementById("notif-dropdown").classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&(L(),G(),document.getElementById("label-modal").classList.remove("open"),q()),e.key==="c"&&!e.target.matches("input,textarea")&&$(),e.key==="/"&&!e.target.matches("input,textarea")&&(e.preventDefault(),document.getElementById("search-input").focus())});
//# sourceMappingURL=workspace-mail-C7YJIMme.js.map
