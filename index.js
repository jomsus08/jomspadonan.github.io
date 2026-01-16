

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyBUH4cFCq7-pjjbHZZNCdkm1m-VX04E6ik",
  authDomain: "chat-487cc.firebaseapp.com",
  databaseURL: "https://chat-487cc-default-rtdb.firebaseio.com",
  projectId: "chat-487cc",
  storageBucket: "chat-487cc.appspot.com",
  messagingSenderId: "654241113125",
  appId: "1:654241113125:web:35da481576b9f570dc4bcc",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== ELEMENTS =====
const chatIcon = document.getElementById('chatIcon');
const chatWindow = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('input');
const nameInput = document.getElementById('nameInput');
const startChat = document.getElementById('startChat');
const nameContainer = document.getElementById('nameContainer');
const inputContainer = document.getElementById('inputContainer');
const userChatBadge = document.getElementById('userChatBadge');

const adminPanel = document.getElementById('adminPanel');
const closeAdmin = document.getElementById('closeAdmin');
const userList = document.getElementById('userList');
const adminMessages = document.getElementById('adminMessages');
const adminInput = document.getElementById('adminInput');
const archiveBtn = document.getElementById('archiveChat');
const deleteBtn = document.getElementById('deleteChat');
const navbarChatBadge = document.getElementById('navbarChatBadge');
const navbarChatIcon = document.getElementById('navbarChatIcon');

// ===== STATE =====
let username = localStorage.getItem('username') || "";
let userId = localStorage.getItem('userId') || "";
let selectedAdminUser = null;
let adminEnabled = false;
let isInitialLoad = true; // Flag para pigilan ang pagdagdag sa unang load

// ===== PERSISTENT USER BADGE =====
let userBadge = 0; // Gawing 0 muna, kukunin natin ang tama sa Firebase

function updateBadgeUI() {
  userChatBadge.textContent = userBadge;
  if (userBadge <= 0) {
    userChatBadge.classList.add('hidden');
    localStorage.setItem('userBadge', '0');
  } else {
    userChatBadge.classList.remove('hidden');
    localStorage.setItem('userBadge', userBadge);
  }
}

function incrementBadge() {
  userBadge++;
  updateBadgeUI();
}

function resetBadge() {
  userBadge = 0;
  updateBadgeUI();
  
  if (userId) {
    db.ref(`users/${userId}/messages`).once('value', snap => {
      snap.forEach(child => {
        if (child.val().sender === 'admin' && !child.val().isRead) {
          child.ref.update({ isRead: true });
        }
      });
    });
  }
}

// ===== LISTEN FOR MESSAGES =====
function listenUserMessages() {
  if (!userId) return;

  const messagesRef = db.ref(`users/${userId}/messages`);
  messagesRef.off('child_added');

  // STEP 1: Kunin ang tamang count base sa unread messages sa DB (Para iwas multiply sa refresh)
  messagesRef.once('value', snapshot => {
    let count = 0;
    snapshot.forEach(child => {
      const m = child.val();
      if (m.sender === 'admin' && m.isRead !== true) {
        count++;
      }
    });
    userBadge = count;
    updateBadgeUI();
    isInitialLoad = false; // Tapos na ang initial counting
  });

  // STEP 2: Makinig sa mga DARATING na bagong messages
  messagesRef.on('child_added', snap => {
    const msg = snap.val();
    const chatVisible = chatWindow.style.display === 'flex';

    if (msg.sender === 'user') {
      if (chatVisible) renderMessage(msg);
    } else if (msg.sender === 'admin') {
      if (!chatVisible) {
        // Mag-increment lang kung TAPOS na ang initial load (real-time message)
        if (!isInitialLoad && msg.isRead !== true) {
          incrementBadge();
        }
      } else {
        // Mark as read agad kung nakabukas ang chat
        snap.ref.update({ isRead: true });
        renderMessage(msg);
      }
    }
  });
}

// 1. START CHAT BUTTON (Dito papasok ang bagong user)
startChat.addEventListener('click', () => {
  const typedName = nameInput.value.trim();
  if (typedName === "") {
    alert("Mangyaring ilagay ang iyong pangalan!");
    return;
  }

  username = typedName;
  userId = "user_" + Date.now(); 

  localStorage.setItem('username', username);
  localStorage.setItem('userId', userId);

  // UI TRANSITION
  nameContainer.style.display = 'none';
  messagesDiv.classList.remove('hidden');
  inputContainer.classList.remove('hidden');

  listenUserMessages();
});

// 2. CHAT ICON (Dito binubuksan ang chat window)
chatIcon.addEventListener('click', () => {
  // Ipakita ang window, itago ang icon
  chatWindow.classList.remove('hidden');
  chatWindow.style.display = 'flex';
  chatIcon.style.display = 'none';
  
  resetBadge(); 

  // Kung may userId na, i-load ang history
  if (userId) {
    // Siguraduhin na kita ang tamang container
    nameContainer.style.display = 'none';
    messagesDiv.classList.remove('hidden');
    inputContainer.classList.remove('hidden');

    messagesDiv.innerHTML = '';
    db.ref(`users/${userId}/messages`).once('value', snap => {
      snap.forEach(child => {
        renderMessage(child.val());
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  } else {
    // Kung wala pang userId, ipakita muna ang inputan ng pangalan
    nameContainer.style.display = 'block';
    messagesDiv.classList.add('hidden');
    inputContainer.classList.add('hidden');
  }
});
// 1. Siguraduhin na nandito ang mga elements (sa taas ng script)
const startChatBtn = document.getElementById('startChat');
const nameInputEl = document.getElementById('nameInput'); // check mo kung nameInput din ID nito sa HTML

// 2. ILAGAY MO ITO SA ILALIM NG "// ===== USER CHAT ACTIONS ====="
if (startChatBtn) {
    startChatBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Eto ang fix para ma-click at hindi mag-refresh ang page
        
        const typedName = nameInputEl.value.trim();
        
        if (typedName === "") {
            alert("Mangyaring ilagay ang iyong pangalan!");
            return;
        }

        // I-set ang user info
        username = typedName;
        userId = "user_" + Date.now(); 

        localStorage.setItem('username', username);
        localStorage.setItem('userId', userId);

        // UI Update: Itago ang login, ipakita ang chat
        if (nameContainer) nameContainer.style.display = 'none';
        if (messagesDiv) messagesDiv.classList.remove('hidden');
        if (inputContainer) inputContainer.classList.remove('hidden');

        // Simulan ang pakikinig sa messages
        listenUserMessages();
        
        console.log("Chat started for:", username);
    });
}


// 3. CLOSE BUTTON
const closeChatBtn = document.getElementById('closeChat');
if (closeChatBtn) {
  closeChatBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
    chatWindow.classList.add('hidden');
    chatIcon.style.display = 'flex';
  });
}


function renderMessage(msg) {
  const div = document.createElement('div');
  const isUser = msg.sender === 'user';
  
  div.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`;

  const bubbleClass = isUser 
    ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg' 
    : 'bg-gray-200 text-gray-800 rounded-r-lg rounded-tl-lg';

  // --- STATUS LOGIC PARA SA ADMIN ---
  // Kung ikaw ang Admin at tinitignan mo ang reply mo sa user:
  let statusText = "";
  if (msg.sender === 'admin') {
     statusText = msg.isRead ? "Seen" : "Sent";
  } else if (msg.sender === 'user') {
     statusText = msg.isRead ? "Seen" : "Sent";
  }

  div.innerHTML = `
    <div class="px-3 py-2 max-w-[80%] ${bubbleClass} shadow-sm">
      <p class="text-sm">${msg.text}</p>
    </div>
    <span class="text-[10px] text-gray-400 mt-1">${statusText}</span>
  `;

  // messagesDiv (sa user) o adminMessages (sa admin)
  const targetDiv = adminPanel && !adminPanel.classList.contains('hidden') ? adminMessages : messagesDiv;
  targetDiv.appendChild(div);
  targetDiv.scrollTop = targetDiv.scrollHeight;
}

// ===== USER REPLY ACTION (ENTER COMMAND) =====
// Siguraduhin na ang ID ng input mo sa HTML ay id="input"
input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim() !== '') {
    const messageText = this.value.trim();
    
    // I-push ang message sa Firebase
    if (userId) {
      db.ref(`users/${userId}/messages`).push({
        name: username,
        text: messageText,
        timestamp: Date.now(),
        sender: 'user',
        isRead: false // Default ay false hangga't 'di nakikita ni Admin
      });
      
      this.value = ''; // Linisin ang input box pagkatapos mag-send
    } else {
      alert("Please start the chat first.");
    }
  }
});

// Auto-load user session
if (username && userId) {
  if (nameContainer) nameContainer.style.display = 'none';
  messagesDiv.classList.remove('hidden');
  inputContainer.classList.remove('hidden');
  listenUserMessages();
}






// ===== ADMIN PANEL =====

// Toggle admin mode
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'm') {
    adminEnabled = !adminEnabled;
    console.log('Admin mode:', adminEnabled ? 'ON' : 'OFF');
  }
});

// Close admin panel
closeAdmin.addEventListener('click', () => adminPanel.classList.add('hidden'));

// Real-time user list + notifications
db.ref('users').on('value', snapshot => {
  userList.innerHTML = '<h3 class="font-semibold mb-2">Users</h3>';
  let totalUnread = 0;

  snapshot.forEach(userSnap => {
    const uid = userSnap.key;
    const messagesObj = userSnap.child('messages').val() || {};
    const archived = userSnap.child('archived').val();
    if (archived) return;

    const lastRead = userSnap.child('lastReadTimestamp').val() || 0;
    let name = Object.values(messagesObj)[0]?.name || 'User';
    const unreadCount = Object.values(messagesObj).filter(m => m.sender === 'user' && m.timestamp > lastRead).length;
    totalUnread += unreadCount;

    const div = document.createElement('div');
    div.className = 'p-2 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    const badge = document.createElement('span');
    badge.className = 'bg-red-500 text-white text-xs px-1 rounded-full ' + (unreadCount ? '' : 'hidden');
    badge.textContent = unreadCount;

    div.appendChild(nameSpan);
    div.appendChild(badge);

    div.onclick = () => {
      selectUser(uid, name);
      badge.classList.add('hidden');
      db.ref(`users/${uid}`).update({ lastReadTimestamp: Date.now() });
    };

    userList.appendChild(div);

    // Update badge in real-time for each user
    db.ref(`users/${uid}/messages`).on('child_added', snap => {
      const msg = snap.val();
      if (msg.sender === 'user' && snap.val().timestamp > lastRead && selectedAdminUser !== uid) {
        badge.classList.remove('hidden');
        let count = parseInt(badge.textContent) || 0;
        count++;
        badge.textContent = count;
      }
    });
  });

  // Update navbar badge
  if (totalUnread > 0) {
    navbarChatBadge.textContent = totalUnread;
    navbarChatBadge.classList.remove('hidden');
  } else {
    navbarChatBadge.classList.add('hidden');
  }
});

// Admin selects a user
function selectUser(uid, name) {
  selectedAdminUser = uid;
  adminMessages.innerHTML = '';

  db.ref(`users/${uid}/messages`).off('child_added');
  db.ref(`users/${uid}/messages`).on('child_added', snap => {
    const msg = snap.val();
    const div = document.createElement('div');
    div.className = 'px-3 py-2 rounded-lg max-w-[80%] ' +
      (msg.sender === 'user' ? 'bg-gray-100 self-start' : 'bg-green-100 self-end');
    div.innerHTML = `<strong>${msg.sender === 'user' ? msg.name : 'Admin'}:</strong> ${msg.text}`;
    adminMessages.appendChild(div);
    adminMessages.scrollTop = adminMessages.scrollHeight;
  });
}

// Admin sends reply
adminInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && adminInput.value.trim() && selectedAdminUser) {
    db.ref(`users/${selectedAdminUser}/messages`).push({
      name: 'Admin',
      text: adminInput.value.trim(),
      timestamp: Date.now(),
      sender: 'admin'
    });
    adminInput.value = '';
  }
});

// Archive/Delete
archiveBtn.addEventListener('click', () => {
  if (!selectedAdminUser) return;
  if (!confirm('Archive this chat?')) return;
  db.ref(`users/${selectedAdminUser}`).update({ archived: true });
  adminMessages.innerHTML = '';
  selectedAdminUser = null;
});

deleteBtn.addEventListener('click', () => {
  if (!selectedAdminUser) return;
  if (!confirm('Delete this chat permanently?')) return;
  db.ref(`users/${selectedAdminUser}`).remove();
  adminMessages.innerHTML = '';
  selectedAdminUser = null;
});

// Navbar chat icon click (admin only)
navbarChatIcon.addEventListener('click', () => {
  if (!adminEnabled) return;
  adminPanel.classList.remove('hidden');
  navbarChatBadge.classList.add('hidden');
  const firstUserDiv = userList.querySelector('div');
  if (firstUserDiv) firstUserDiv.click();
});




       const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const openIcon = '<i class="fas fa-bars fa-lg"></i>';
const closeIcon = '<i class="fas fa-times fa-lg"></i>';

// Initialize burger icon
burger.innerHTML = openIcon;

// Toggle menu
burger.addEventListener('click', () => {
  const isOpen = mobileMenu.style.maxHeight && mobileMenu.style.maxHeight !== '0px';
  if (isOpen) {
    mobileMenu.style.maxHeight = '0';
    burger.innerHTML = openIcon;
  } else {
    mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
    burger.innerHTML = closeIcon;
  }
});

// Close menu when clicking any link inside mobile menu
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.style.maxHeight = '0';
    burger.innerHTML = openIcon;
  });
});

// Reset menu on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    mobileMenu.style.maxHeight = null; // show desktop menu
    burger.innerHTML = openIcon;
  } else {
    mobileMenu.style.maxHeight = '0'; // hide mobile menu by default
  }
});


        // Smooth scroll anchor behavior
        document.querySelectorAll('a[href^="#"]').forEach(a=>{ a.addEventListener('click', e=>{ const href=a.getAttribute('href'); if(href.length>1 && document.querySelector(href)){ e.preventDefault(); document.querySelector(href).scrollIntoView({behavior:'smooth',block:'start'}); if(mobileMenu) mobileMenu.style.maxHeight = '0'; } }); });

        // Contact form -> mailto
        const form = document.getElementById('contactForm');
        const statusEl = document.getElementById('formStatus');
        if(form){ form.addEventListener('submit', e=>{ e.preventDefault(); const data = new FormData(form); const name = data.get('name'); const email = data.get('email'); const message = data.get('message'); const subject = encodeURIComponent('Portfolio contact from '+name); const body = encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+message); window.location.href = `mailto:jomspadonan15@gmail.com?subject=${subject}&body=${body}`; if(statusEl){ statusEl.classList.remove('hidden'); setTimeout(()=>statusEl.classList.add('hidden'),3000);} form.reset(); }); }

        // Reveal on scroll with stagger and delay data support
        const reveals = Array.from(document.querySelectorAll('.reveal'));
        function revealElement(el, delay=0){ setTimeout(()=> el.classList.add('active'), delay); }
        if('IntersectionObserver' in window){
          const io = new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
              if(entry.isIntersecting){
                const idx = reveals.indexOf(entry.target);
                const delay = (idx>=0? idx * 120 : 0);
                revealElement(entry.target, delay);
                io.unobserve(entry.target);
              }
            });
          }, {threshold:0.12});
          reveals.forEach(r=> io.observe(r));
        } else {
          reveals.forEach((r,i)=> revealElement(r, i*120));
        }

        // Subtle tech badge animation: add small rotate on hover
        document.querySelectorAll('.tech').forEach(t=>{ t.addEventListener('mouseover', ()=> t.style.transform='translateY(-6px) rotate(-2deg)'); t.addEventListener('mouseout', ()=> t.style.transform='none'); });

        // Project card tilt on mouse move
        document.querySelectorAll('.project-card').forEach(card=>{
          card.addEventListener('mousemove', e=>{
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            const rotX = (y * 8).toFixed(2);
            const rotY = (x * -8).toFixed(2);
            card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
          });
          card.addEventListener('mouseleave', ()=>{ card.style.transform = 'none'; });
        });

        // Footer year
        document.getElementById('year').textContent = new Date().getFullYear();
      
        // Scroll progress bar
        const progress = document.getElementById('scrollProgress');
        function updateProgress(){ const h = document.documentElement.scrollHeight - window.innerHeight; const p = (window.scrollY / h) * 100; if(progress) progress.style.width = Math.min(Math.max(p,0),100) + '%'; }
        window.addEventListener('scroll', updateProgress); updateProgress();

        // Back to top visibility
        const toTop = document.getElementById('toTop');
        window.addEventListener('scroll', ()=>{ if(window.scrollY>400){ toTop.style.display='block' } else { toTop.style.display='none' } });
        if(toTop) toTop.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));

        // Animated counters when visible
        const counters = document.querySelectorAll('[data-target]');
        function animateCounter(el){ const target = +el.getAttribute('data-target'); let current = 0; const step = Math.max(1, Math.floor(target/80)); const iv = setInterval(()=>{ current += step; if(current>=target){ el.textContent = target; clearInterval(iv);} else el.textContent = current; },12); }
        if('IntersectionObserver' in window && counters.length){
          const coi = new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ animateCounter(entry.target); coi.unobserve(entry.target); } }); }, {threshold:0.4});
          counters.forEach(c=>coi.observe(c));
        } else { counters.forEach(c=>animateCounter(c)); }
        
        // Animate skill bars when they enter the viewport
        const skillEls = document.querySelectorAll('.skill-progress');
        function animateSkill(el){ const pct = +el.getAttribute('data-percent') || 0; el.style.width = pct + '%'; el.setAttribute('aria-valuenow', pct); }
        if('IntersectionObserver' in window && skillEls.length){
          const ski = new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ animateSkill(entry.target); ski.unobserve(entry.target); } }); }, {threshold:0.18});
          skillEls.forEach(s=>ski.observe(s));
        } else { skillEls.forEach(s=>animateSkill(s)); }

        /* ------- Interactive resume editing (modal panels) ------- */
        // Experience modal elements
        const expModalEl = document.getElementById('expModal');
        const expTitleEl = document.getElementById('expTitle');
        const expDatesEl = document.getElementById('expDates');
        const expBulletsEl = document.getElementById('expBullets');
        const expSaveBtn = document.getElementById('expSave');
        const expCancelBtn = document.getElementById('expCancel');

        function renderExperience(item){
          const art = document.createElement('article'); art.className = 'bg-white rounded-lg p-5 shadow reveal exp-item';
          art.innerHTML = `<div class="flex justify-between items-start">\n                    <div>\n                      <h3 class="font-semibold">${escapeHtml(item.title)}</h3>\n                      <p class="text-sm text-slate-500">${escapeHtml(item.dates)}</p>\n                    </div>\n                    <div class="flex gap-2">\n                      <button class="edit-exp text-slate-500 hover:text-sky-600" title="Edit"><i class="fas fa-pen"></i></button>\n                      <button class="del-exp text-slate-500 hover:text-red-600" title="Delete"><i class="fas fa-trash"></i></button>\n                    </div>\n                  </div>\n                  <ul class="mt-3 text-slate-600 list-disc list-inside">${item.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>`;
          // ensure reveal items are visible when dynamically added
          art.classList.add('active');
          // hide editor controls by default
          art.querySelectorAll('.edit-exp, .del-exp').forEach(btn=>{ btn.classList.add('editor-hidden'); });
          return art;
        }

        // Persistence helpers for experiences
        const STORAGE_EXP = 'jp_experiences_v1';
        const DEFAULT_EXPS = [
          { title: 'Mumuso — POS IT Support', dates: 'Oct 27, 2022 - Present', bullets: ['Troubleshooted printers, networks, and computers.', 'Conducted system and OS backups and restores.', 'Maintained and repaired POS printers.', 'Provided support for POS systems.', 'Setup store branches with necessary IT infrastructure.'] },
          { title: 'Medexpress — Local IT Support', dates: 'Jan 25, 2021 - June 25, 2022', bullets: ['Created Domain accounts and managed folder shares for domain users.', 'Managed firewall and internet connections.', 'Utilized ticketing tools to track and resolve IT issues.', 'Troubleshot computer and printer problems.', 'Set up computers, software, and networks for branch offices.', 'Uploaded data to SAP 760.', 'Provided troubleshooting support for MS Office applications, including Outlook email configuration.'] },
          { title: 'VST-ECS — Lenovo Field Engineer', dates: 'Oct 10, 2020 - Jan 20, 2021', bullets: ['Installed and repaired computers, including installing server parts and cloning PCs.'] },
          { title: 'MSI-ECS — Service Technician', dates: 'May 2, 2018 - Sep 5, 2018', bullets: ['Installed and repaired computers, including installing server parts and cloning PCs.'] }
        ];
        function saveExperiences(){
          const arr = Array.from(document.querySelectorAll('#experienceList .exp-item')).map(art=>({
            title: art.querySelector('h3')?.textContent.trim()||'',
            dates: art.querySelector('p')?.textContent.trim()||'',
            bullets: Array.from(art.querySelectorAll('ul li')).map(li=>li.textContent.trim())
          }));
          try{ localStorage.setItem(STORAGE_EXP, JSON.stringify(arr)); }catch(e){ console.warn('saveExperiences failed', e); }
        }

        function loadExperiences(){
          try{
            const raw = localStorage.getItem(STORAGE_EXP);
            if(!raw) return false;
            const arr = JSON.parse(raw);
            if(!Array.isArray(arr) || arr.length === 0) return false;
            expList.innerHTML = '';
            arr.forEach(item=>{ const node = renderExperience(item); expList.appendChild(node); });
            return true;
          }catch(e){ console.warn('loadExperiences failed', e); return false; }
        }

        // Ensure there is visible content: if no saved experiences, populate defaults
        const _loaded = loadExperiences();
        if(!_loaded){
          // if DOM has no experience items, insert defaults
          if(!document.querySelectorAll('#experienceList .exp-item').length){
            DEFAULT_EXPS.forEach(it=> expList.appendChild(renderExperience(it)));
            saveExperiences();
          }
        }

        function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

        // Show experience modal and return result via Promise
        function showExpModal(data){
          return new Promise(resolve=>{
            expModalEl.classList.remove('hidden'); expModalEl.classList.add('flex');
            expTitleEl.value = data?.title || '';
            expDatesEl.value = data?.dates || '';
            expBulletsEl.value = (data?.bullets || []).join('\n');
            expTitleEl.focus();

            function cleanup(){ expModalEl.classList.add('hidden'); expModalEl.classList.remove('flex'); expSaveBtn.removeEventListener('click', onSave); expCancelBtn.removeEventListener('click', onCancel); }
            function onSave(){ const bullets = expBulletsEl.value.split('\n').map(s=>s.trim()).filter(Boolean); const result = { title: expTitleEl.value.trim(), dates: expDatesEl.value.trim(), bullets }; cleanup(); resolve(result); }
            function onCancel(){ cleanup(); resolve(null); }
            expSaveBtn.addEventListener('click', onSave);
            expCancelBtn.addEventListener('click', onCancel);
          });
        }

        const expList = document.getElementById('experienceList');
        // hide add buttons by default
        document.getElementById('addExpBtn').classList.add('editor-hidden');
        document.getElementById('addExpBtn').addEventListener('click', async ()=>{
          const res = await showExpModal();
          if(res){ const node = renderExperience(res); expList.prepend(node); saveExperiences(); }
        });

        function attachExpHandlers(root){
          root.querySelectorAll('.edit-exp').forEach(btn=> btn.addEventListener('click', async ()=>{
            const art = btn.closest('.exp-item');
            const title = art.querySelector('h3').textContent.trim();
            const dates = art.querySelector('p').textContent.trim();
            const bullets = Array.from(art.querySelectorAll('ul li')).map(li=>li.textContent.trim());
            const data = await showExpModal({title, dates, bullets});
            if(data){ const newArt = renderExperience(data); art.replaceWith(newArt); saveExperiences(); }
          }));
          root.querySelectorAll('.del-exp').forEach(btn=> btn.addEventListener('click', ()=>{ if(confirm('Remove this experience?')){ btn.closest('.exp-item').remove(); saveExperiences(); } }));
        }
        // If stored experiences exist, load them and replace placeholders
        loadExperiences();

        // Skills: modal-based edit and add
        const skillsContainer = document.getElementById('skillsContainer');
        const skillModalEl = document.getElementById('skillModal');
        const skillNameEl = document.getElementById('skillName');
        const skillPercentEl = document.getElementById('skillPercent');
        const skillSaveBtn = document.getElementById('skillSave');
        const skillCancelBtn = document.getElementById('skillCancel');
        let _currentProgressEl = null;

        // Editor controls: hidden by default, toggled with Ctrl+Alt+J
        let editingMode = false;
        const _editorSelectors = '.edit-exp, .del-exp, .edit-skill, .del-skill, #addSkillBtn, #addExpBtn';
        function setEditingMode(on){
          editingMode = !!on;
          document.querySelectorAll(_editorSelectors).forEach(el=>{
            if(editingMode) el.classList.remove('editor-hidden'); else el.classList.add('editor-hidden');
          });
        }
        // start hidden
        setEditingMode(false);

        function showSkillModal(currentEl){
          return new Promise(resolve=>{
            _currentProgressEl = currentEl || null;
            skillModalEl.classList.remove('hidden'); skillModalEl.classList.add('flex');
            const currentPct = _currentProgressEl ? (+_currentProgressEl.getAttribute('data-percent')||0) : 70;
            const currentName = _currentProgressEl ? (_currentProgressEl.closest('.skill').querySelector('.label span').textContent || '') : '';
            skillNameEl.value = currentName;
            skillPercentEl.value = String(currentPct);
            skillNameEl.focus();

            function cleanup(){ skillModalEl.classList.add('hidden'); skillModalEl.classList.remove('flex'); skillSaveBtn.removeEventListener('click', onSave); skillCancelBtn.removeEventListener('click', onCancel); }
            function onSave(){ const name = skillNameEl.value.trim(); let pct = Math.max(0, Math.min(100, Number(skillPercentEl.value)||0)); cleanup(); resolve({ name, percent: pct, progressEl: _currentProgressEl }); }
            function onCancel(){ cleanup(); resolve(null); }
            skillSaveBtn.addEventListener('click', onSave);
            skillCancelBtn.addEventListener('click', onCancel);
          });
        }

        // hide add skill button by default
        document.getElementById('addSkillBtn').classList.add('editor-hidden');
        document.getElementById('addSkillBtn').addEventListener('click', async ()=>{
          const res = await showSkillModal(null);
          if(!res) return;
          const wrap = document.createElement('div'); wrap.className='skill';
          wrap.innerHTML = `<div class="label"><span>${escapeHtml(res.name)}</span><span><span class="skill-val">${res.percent}%</span> <button class="edit-skill text-slate-500 ml-2" title="Edit"><i class="fas fa-pen"></i></button> <button class="del-skill text-slate-500 ml-2" title="Delete"><i class="fas fa-trash"></i></button></span></div><div class="skill-track"><div class="skill-progress" data-percent="${res.percent}" aria-valuenow="0"></div></div>`;
          // hide editor controls on the newly created skill unless editingMode is active
          wrap.querySelectorAll('.edit-skill,.del-skill').forEach(b=>{ b.classList.add('editor-hidden'); if(!editingMode) b.style.display = 'none'; });
          skillsContainer.appendChild(wrap);
          requestAnimationFrame(()=> wrap.querySelector('.skill-progress').style.width = res.percent + '%');
          saveSkills();
        });

        // Skills persistence
        const STORAGE_SK = 'jp_skills_v1';
        function saveSkills(){
          const arr = Array.from(document.querySelectorAll('#skillsContainer .skill')).map(el=>({
            name: el.querySelector('.label span')?.textContent.trim()||'',
            percent: +el.querySelector('.skill-progress')?.getAttribute('data-percent')||0
          }));
          try{ localStorage.setItem(STORAGE_SK, JSON.stringify(arr)); }catch(e){ console.warn('saveSkills failed', e); }
        }

        function renderSkill(item){ const wrap = document.createElement('div'); wrap.className='skill'; wrap.innerHTML = `<div class="label"><span>${escapeHtml(item.name)}</span><span><span class="skill-val">${item.percent}%</span> <button class="edit-skill text-slate-500 ml-2" title="Edit"><i class="fas fa-pen"></i></button> <button class="del-skill text-slate-500 ml-2" title="Delete"><i class="fas fa-trash"></i></button></span></div><div class="skill-track"><div class="skill-progress" data-percent="${item.percent}" aria-valuenow="0"></div></div>`; wrap.querySelectorAll('.edit-skill,.del-skill').forEach(b=>b.classList.add('editor-hidden')); return wrap; }

        function loadSkills(){ try{ const raw = localStorage.getItem(STORAGE_SK); if(!raw) return false; const arr = JSON.parse(raw); if(!Array.isArray(arr)) return false; skillsContainer.innerHTML = ''; arr.forEach(it=>{ const node = renderSkill(it); skillsContainer.appendChild(node); }); return true; }catch(e){ console.warn('loadSkills failed', e); return false; } }

        // Try loading saved skills (replaces initial placeholders if present)
        loadSkills();
        // hide existing editor buttons and add buttons by default
        document.querySelectorAll('.edit-exp, .del-exp, .edit-skill, .del-skill').forEach(btn=> btn.classList.add('editor-hidden'));
        document.getElementById('addSkillBtn').classList.add('editor-hidden');
        document.getElementById('addExpBtn').classList.add('editor-hidden');

        // Initialize widths for skills already present (if IntersectionObserver missed them)
        document.querySelectorAll('.skill-progress').forEach(s=>{ const pct = +s.getAttribute('data-percent')||0; s.style.width = pct + '%'; });

        // EVENT DELEGATION: make edit/delete work for experiences and skills (handles dynamic items)
        // Experiences
        document.getElementById('experienceList').addEventListener('click', async (e)=>{
          const del = e.target.closest('.del-exp');
          const edit = e.target.closest('.edit-exp');
          if(del){
            const art = del.closest('.exp-item');
            // require keyboard-unlock (editingMode) to allow delete
            if(!editingMode) return; 
            if(confirm('Remove this experience?')){ art.remove(); saveExperiences(); }
            return;
          }
          if(edit){ const art = edit.closest('.exp-item'); const title = art.querySelector('h3').textContent.trim(); const dates = art.querySelector('p').textContent.trim(); const bullets = Array.from(art.querySelectorAll('ul li')).map(li=>li.textContent.trim()); const data = await showExpModal({title, dates, bullets}); if(data){ const newArt = renderExperience(data); art.replaceWith(newArt); saveExperiences(); }}
        });

        // Skills delegation (edit)
        document.getElementById('skillsContainer').addEventListener('click', async (e)=>{
          const btn = e.target.closest('.edit-skill');
          const del = e.target.closest('.del-skill');
          if(del){
            const sk = del.closest('.skill');
            if(!editingMode) return;
            if(confirm('Remove this skill?')){ sk.remove(); saveSkills(); }
            return;
          }
          if(!btn) return;
          const progressEl = btn.closest('.skill').querySelector('.skill-progress');
          const res = await showSkillModal(progressEl);
          if(!res) return;
          // if editing existing
          if(res.progressEl){
            res.progressEl.setAttribute('data-percent', res.percent);
            const valLabel = res.progressEl.closest('.skill').querySelector('.skill-val');
            if(valLabel) valLabel.textContent = res.percent + '%';
            const nameLabel = res.progressEl.closest('.skill').querySelector('.label span');
            if(nameLabel && res.name) nameLabel.textContent = res.name;
            requestAnimationFrame(()=> res.progressEl.style.width = res.percent + '%');
            saveSkills();
          }
        });

        // Keyboard shortcut to toggle editor controls (Ctrl+Alt+J)
        document.addEventListener('keydown', (e)=>{
          if(e.ctrlKey && e.altKey && e.key.toLowerCase()==='j'){
            setEditingMode(!editingMode);
          }
        });

        // Email buttons
        const mailtoBtn = document.getElementById('mailtoBtn');
        const copyEmailBtn = document.getElementById('copyEmailBtn');
        const emailAddress = 'jomspadonan15@gmail.com';
        if(mailtoBtn) mailtoBtn.addEventListener('click', ()=>{
          const subject = encodeURIComponent('Hello from your portfolio');
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddress)}&su=${subject}`;
          window.open(gmailUrl, '_blank');
        });
        if(copyEmailBtn) copyEmailBtn.addEventListener('click', ()=>{ navigator.clipboard?.writeText(emailAddress).then(()=>{ copyEmailBtn.textContent = 'Copied'; setTimeout(()=> copyEmailBtn.innerHTML = '<i class="fas fa-copy mr-2"></i>Copy',1200); }).catch(()=> alert('Copy failed — select and copy manually')); });

        
        window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  };
