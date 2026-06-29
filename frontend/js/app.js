// ============================================
// KapChat Main App Logic
// ============================================

const STATE = {
  currentUser: null,
  token: null,
  friends: [],
  activeFriendId: null,
  messages: {},
  onlineUsers: new Set(),
  typingTimers: {},
  pendingRequests: []
};

// ---- Init ----
(function init() {
  const token = localStorage.getItem('kapchat_token');
  const user = localStorage.getItem('kapchat_user');
  if (token && user) {
    STATE.token = token;
    STATE.currentUser = JSON.parse(user);
    bootApp();
  }
})();

// ---- Auth Flows ----
async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const errEl = document.getElementById('signup-error');
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  setLoading(btn, true);
  errEl.classList.add('hidden');

  try {
    const res = await api.signup(username, email, password);
    STATE.token = res.data.token;
    STATE.currentUser = res.data.user;
    localStorage.setItem('kapchat_token', STATE.token);
    localStorage.setItem('kapchat_user', JSON.stringify(STATE.currentUser));
    bootApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    shakeEl(btn);
  } finally {
    setLoading(btn, false);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  setLoading(btn, true);
  errEl.classList.add('hidden');

  try {
    const res = await api.login(email, password);
    STATE.token = res.data.token;
    STATE.currentUser = res.data.user;
    localStorage.setItem('kapchat_token', STATE.token);
    localStorage.setItem('kapchat_user', JSON.stringify(STATE.currentUser));
    bootApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    shakeEl(btn);
  } finally {
    setLoading(btn, false);
  }
}

function handleLogout() {
  localStorage.removeItem('kapchat_token');
  localStorage.removeItem('kapchat_user');
  socketManager.disconnect();
  STATE.currentUser = null;
  STATE.token = null;
  STATE.friends = [];
  STATE.activeFriendId = null;
  STATE.messages = {};
  showScreen('auth-screen');
  switchTab('login');
  showToast('You have been signed out.', 'info');
}

// ---- Boot App ----
async function bootApp() {
  showScreen('app-screen');
  renderMyProfile();
  await loadFriends();
  socketManager.connect(STATE.token);
}

function renderMyProfile() {
  const u = STATE.currentUser;
  document.getElementById('my-avatar').textContent = getInitial(u.username);
  document.getElementById('my-username').textContent = u.username;
}

// ---- Friends ----
async function loadFriends() {
  try {
    const res = await api.getFriends();
    STATE.friends = res.data || [];

    const reqRes = await api.getFriendRequests();
    STATE.pendingRequests = reqRes.data || [];

    renderFriendsChatList();
    renderFriendsPanel();
  } catch (err) {
    showToast('Could not load friends: ' + err.message, 'error');
  }
}

function renderFriendsChatList() {
  const container = document.getElementById('friends-list');
  if (!STATE.friends.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p>No conversations yet</p>
        <span>Search for people to start chatting</span>
      </div>`;
    return;
  }
  container.innerHTML = STATE.friends.map(f => `
    <div class="chat-list-item ${STATE.activeFriendId === f._id ? 'active' : ''}"
         onclick="openChat('${f._id}', '${escapeHtml(f.username)}')"
         id="chat-item-${f._id}">
      <div class="chat-list-avatar-wrap">
        <div class="friend-avatar" style="${getAvatarGradient(f.username)}">${getInitial(f.username)}</div>
        <div class="status-dot ${STATE.onlineUsers.has(f._id) ? 'online' : 'offline'}"></div>
      </div>
      <div class="friend-info">
        <div class="friend-name">${escapeHtml(f.username)}</div>
        <div class="friend-last-msg" id="last-msg-${f._id}">${STATE.messages[f._id]?.slice(-1)[0]?.content || 'Click to start chatting'}</div>
      </div>
    </div>
  `).join('');
}

function renderFriendsPanel() {
  const list = document.getElementById('friends-panel-list');
  const reqList = document.getElementById('incoming-requests');

  // Render Requests
  if (!STATE.pendingRequests || !STATE.pendingRequests.length) {
    reqList.innerHTML = `<div class="empty-state small"><p>No pending requests</p></div>`;
  } else {
    reqList.innerHTML = STATE.pendingRequests.map(r => `
      <div class="request-item" id="req-${r._id}">
        <div class="friend-avatar" style="${getAvatarGradient(r.sender.username)}">${getInitial(r.sender.username)}</div>
        <div class="request-info">
          <div class="request-name">${escapeHtml(r.sender.username)}</div>
        </div>
        <div class="request-actions">
          <button class="btn-accept" onclick="acceptRequest('${r._id}')">Accept</button>
          <button class="btn-reject" onclick="rejectRequest('${r._id}')">Reject</button>
        </div>
      </div>
    `).join('');
  }

  // Render Friends
  if (!STATE.friends.length) {
    list.innerHTML = `<div class="empty-state small"><p>No friends yet</p></div>`;
    return;
  }
  list.innerHTML = STATE.friends.map(f => `
    <div class="request-item">
      <div class="friend-avatar" style="${getAvatarGradient(f.username)}">${getInitial(f.username)}</div>
      <div class="request-info">
        <div class="request-name">${escapeHtml(f.username)}</div>
      </div>
      <button class="btn-accept" style="background:rgba(124,58,237,0.2);color:#a78bfa;"
              onclick="openChat('${f._id}', '${escapeHtml(f.username)}')">Message</button>
    </div>
  `).join('');
}

// ---- Open Chat ----
async function openChat(friendId, friendName) {
  STATE.activeFriendId = friendId;

  // Mobile: hide sidebar
  document.getElementById('sidebar').classList.add('hidden-mobile');

  // Update header
  document.getElementById('chat-header-avatar').textContent = getInitial(friendName);
  document.getElementById('chat-header-avatar').style.cssText = getAvatarGradient(friendName);
  document.getElementById('chat-header-name').textContent = friendName;
  const isOnline = STATE.onlineUsers.has(friendId);
  updateChatStatus(friendId, isOnline);

  // Show chat window
  document.getElementById('chat-empty').classList.add('hidden');
  document.getElementById('chat-window').classList.remove('hidden');

  // Highlight sidebar item
  document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById(`chat-item-${friendId}`);
  if (item) item.classList.add('active');

  // Load messages
  await loadMessages(friendId);

  // Mark read
  socketManager.markRead(friendId);

  // Focus input
  document.getElementById('message-input').focus();
}

async function loadMessages(friendId) {
  const container = document.getElementById('messages-list');
  container.innerHTML = `<div class="empty-state"><span>Loading messages...</span></div>`;
  STATE.messagePage = 1;
  STATE.hasMoreMessages = true;

  try {
    const res = await api.getMessages(friendId, 1);
    const msgs = (res.data || []).reverse();
    STATE.messages[friendId] = msgs;
    if (msgs.length < 50) STATE.hasMoreMessages = false;
    
    renderMessages(friendId);
    scrollToBottom();
    setupPaginationScroll();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Could not load messages</p><span>${err.message}</span></div>`;
  }
}

function setupPaginationScroll() {
  const container = document.getElementById('messages-container');
  container.onscroll = async () => {
    if (container.scrollTop === 0 && STATE.hasMoreMessages) {
      STATE.messagePage++;
      const oldScrollHeight = container.scrollHeight;
      try {
        const res = await api.getMessages(STATE.activeFriendId, STATE.messagePage);
        const newMsgs = (res.data || []).reverse();
        if (newMsgs.length < 50) STATE.hasMoreMessages = false;
        if (newMsgs.length > 0) {
          STATE.messages[STATE.activeFriendId] = [...newMsgs, ...STATE.messages[STATE.activeFriendId]];
          renderMessages(STATE.activeFriendId);
          // Restore scroll position
          container.scrollTop = container.scrollHeight - oldScrollHeight;
        }
      } catch (err) {
        console.error('Failed to load more messages', err);
      }
    }
  };
}

function renderMessages(friendId) {
  const msgs = STATE.messages[friendId] || [];
  const container = document.getElementById('messages-list');

  if (!msgs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p>No messages yet</p>
        <span>Say hello! 👋</span>
      </div>`;
    return;
  }

  let lastDate = null;
  container.innerHTML = msgs.map(msg => {
    const isSent = msg.sender === STATE.currentUser.id || msg.sender?._id === STATE.currentUser.id;
    const dateStr = formatDate(msg.createdAt);
    let dateSep = '';
    if (dateStr !== lastDate) {
      lastDate = dateStr;
      dateSep = `<div class="date-separator">${dateStr}</div>`;
    }
    return dateSep + renderMessageBubble(msg, isSent);
  }).join('');
}

function renderMessageBubble(msg, isSent, friendUsername = '') {
  const time = formatTime(msg.createdAt);
  const initial = isSent ? getInitial(STATE.currentUser.username) : getInitial(friendUsername || STATE.friends.find(f => f._id === STATE.activeFriendId)?.username || '?');

  const isRead = msg.status === 'read' || msg.read === true;
  const isDelivered = msg.status === 'delivered';
  
  let ticks = '<polyline points="4 12 8 16 20 7"/>'; // Single tick (sent)
  if (isDelivered || isRead) {
    ticks = '<polyline points="1 12 5 16 12 9"/><polyline points="9 12 13 16 20 9"/>'; // Double tick
  }

  const readIcon = isSent ? `
    <span class="message-status ${isRead ? 'read' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        ${ticks}
      </svg>
    </span>` : '';

  const metaHtml = `
    <span class="message-meta-inline">
      <span class="message-time">${time}</span>
      ${readIcon}
    </span>
  `;

  let content = '';
  const mediaType = msg.mediaType || msg.type;
  
  if (mediaType === 'image') {
    content = `<div class="message-image"><img src="${msg.mediaUrl}" alt="Image" onclick="openLightbox('${msg.mediaUrl}')" style="cursor: pointer;" />${metaHtml}</div>`;
  } else if (mediaType === 'video') {
    content = `<div class="message-video"><video src="${msg.mediaUrl}" controls style="max-width:240px; border-radius:12px;"></video>${metaHtml}</div>`;
  } else if (mediaType === 'file' || mediaType === 'document' || mediaType === 'pdf') {
    content = `
      <a href="${msg.mediaUrl}" target="_blank" download class="message-file" style="text-decoration: none; color: inherit; display: flex;">
        <div class="message-file-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="message-file-info">
          <div class="message-file-name">${escapeHtml(msg.text || msg.content)}</div>
          <div class="message-file-size">Document</div>
        </div>
        ${metaHtml}
      </a>`;
  } else {
    content = `<div class="message-bubble">
      <span class="message-text">${escapeHtml(msg.text || msg.content)}</span>
      ${metaHtml}
    </div>`;
  }

  return `
    <div class="message-row ${isSent ? 'sent' : 'received'}" id="msg-${msg._id}">
      <div class="msg-avatar">${initial}</div>
      <div class="message-bubble-wrap">
        ${content}
      </div>
    </div>`;
}

// ---- Send Message ----
async function sendMessage() {
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  if (!content || !STATE.activeFriendId) return;

  input.value = '';
  autoResizeTextarea(input);
  socketManager.emitTyping(STATE.activeFriendId, false);

  const tempId = 'temp-' + Date.now();
  const tempMsg = {
    _id: tempId,
    sender: STATE.currentUser.id,
    content,
    type: 'text',
    read: false,
    createdAt: new Date().toISOString()
  };

  if (!STATE.messages[STATE.activeFriendId]) STATE.messages[STATE.activeFriendId] = [];
  STATE.messages[STATE.activeFriendId].push(tempMsg);
  appendMessageToDOM(tempMsg, true);
  scrollToBottom();
  updateLastMsg(STATE.activeFriendId, content);

  socketManager.sendMessage(STATE.activeFriendId, content, 'text', null, tempId);
}

function handleMessageKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ---- Typing ----
let typingTimeout = null;
function handleTyping() {
  const input = document.getElementById('message-input');
  autoResizeTextarea(input);
  if (!STATE.activeFriendId) return;
  socketManager.emitTyping(STATE.activeFriendId, true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socketManager.emitTyping(STATE.activeFriendId, false);
  }, 2000);
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ---- File Upload ----
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file || !STATE.activeFriendId) return;
  e.target.value = '';

  showToast('Uploading file...', 'info');

  try {
    const res = await api.uploadFile(file);
    if (!res.success) throw new Error(res.message);

    const type = res.data.mediaType || 'document';
    let content = file.name;
    if (type === 'image') content = 'Photo';
    else if (type === 'video') content = 'Video';
    
    const mediaUrl = res.data.mediaUrl;

    socketManager.sendMessage(STATE.activeFriendId, content, type, mediaUrl);

    const tempMsg = {
      _id: 'temp-' + Date.now(),
      sender: STATE.currentUser.id,
      content,
      type,
      mediaUrl,
      read: false,
      createdAt: new Date().toISOString()
    };
    if (!STATE.messages[STATE.activeFriendId]) STATE.messages[STATE.activeFriendId] = [];
    STATE.messages[STATE.activeFriendId].push(tempMsg);
    appendMessageToDOM(tempMsg, true);
    scrollToBottom();
    showToast('File sent!', 'success');
  } catch (err) {
    showToast('Upload failed: ' + err.message, 'error');
  }
}
// Removed Voice Recording

function appendMessageToDOM(msg, isSent) {
  const container = document.getElementById('messages-list');
  // Remove empty state if present
  const emptyState = container.querySelector('.empty-state');
  if (emptyState) emptyState.remove();
  const html = renderMessageBubble(msg, isSent);
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  container.appendChild(wrap.firstElementChild);
}

// ---- Socket Event Handlers ----
const app = {
  handleIncomingMessage(message) {
    const senderId = message.sender._id || message.sender;
    if (!STATE.messages[senderId]) STATE.messages[senderId] = [];
    STATE.messages[senderId].push(message);

    if (STATE.activeFriendId === senderId) {
      const friend = STATE.friends.find(f => f._id === senderId);
      const isSent = false;
      appendMessageToDOM(message, isSent);
      scrollToBottom();
      socketManager.markRead(senderId);
    } else {
      showToast(`New message from ${message.sender.username || 'someone'}`, 'info');
    }
    updateLastMsg(senderId, message.text || message.content);
  },

  handleTypingEvent(senderId, isTyping) {
    if (STATE.activeFriendId !== senderId) return;
    const indicator = document.getElementById('typing-indicator');
    const namEl = document.getElementById('typing-user-name');
    const friend = STATE.friends.find(f => f._id === senderId);
    if (friend) namEl.textContent = friend.username;
    indicator.classList.toggle('hidden', !isTyping);
    if (isTyping) scrollToBottom();
  },

  handleMessageDelivered(tempId, messageId) {
    // Find the message in state
    let foundMsg = null;
    for (const friendId in STATE.messages) {
      foundMsg = STATE.messages[friendId].find(m => m._id === tempId || m._id === messageId);
      if (foundMsg) {
        foundMsg._id = messageId; // Update ID
        foundMsg.status = 'delivered';
        break;
      }
    }
    
    // Update DOM
    if (foundMsg) {
      const row = document.getElementById(`msg-${tempId}`) || document.getElementById(`msg-${messageId}`);
      if (row) {
        row.id = `msg-${messageId}`;
        const statusEl = row.querySelector('.message-status');
        if (statusEl && !statusEl.classList.contains('read')) {
          statusEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 12 5 16 12 9"/><polyline points="9 12 13 16 20 9"/></svg>`;
        }
      }
    }
  },

  handleFriendOnline(userId, isOnline) {
    if (isOnline) STATE.onlineUsers.add(userId);
    else STATE.onlineUsers.delete(userId);

    // Update sidebar dot
    const item = document.getElementById(`chat-item-${userId}`);
    if (item) {
      const dot = item.querySelector('.status-dot');
      if (dot) { dot.className = `status-dot ${isOnline ? 'online' : 'offline'}`; }
    }
    // Update chat header if active
    if (STATE.activeFriendId === userId) updateChatStatus(userId, isOnline);
  },

  handleMessagesRead(readerId) {
    const msgs = STATE.messages[readerId] || [];
    msgs.forEach(m => { m.read = true; m.status = 'read'; });
    if (STATE.activeFriendId === readerId) {
      document.querySelectorAll('.message-status').forEach(el => {
        el.classList.add('read');
        el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="1 12 5 16 12 9"/><polyline points="9 12 13 16 20 9"/>
        </svg>`;
      });
    }
  }
};

// ---- User Search ----
let searchTimer = null;
async function searchUsers() {
  const query = document.getElementById('user-search-input').value.trim();
  const results = document.getElementById('search-results');
  if (!query) { results.innerHTML = ''; return; }

  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    results.innerHTML = `<div class="empty-state small"><span>Searching...</span></div>`;
    try {
      const res = await api.searchUsers(query);
      const users = (res.data || []).filter(u => u._id !== STATE.currentUser.id);
      if (!users.length) {
        results.innerHTML = `<div class="empty-state small"><p>No users found</p></div>`;
        return;
      }
      const friendIds = new Set(STATE.friends.map(f => f._id));
      results.innerHTML = users.map(u => `
        <div class="search-result-item">
          <div class="friend-avatar" style="${getAvatarGradient(u.username)}">${getInitial(u.username)}</div>
          <div class="search-result-info">
            <div class="search-result-name">${escapeHtml(u.username)}</div>
            <div class="search-result-email">${escapeHtml(u.email)}</div>
          </div>
          ${friendIds.has(u._id)
            ? `<button class="add-friend-btn sent" disabled>Friends</button>`
            : `<button class="add-friend-btn" id="add-btn-${u._id}" onclick="sendFriendReq('${u._id}')">Add</button>`
          }
        </div>
      `).join('');
    } catch (err) {
      results.innerHTML = `<div class="empty-state small"><p>${err.message}</p></div>`;
    }
  }, 350);
}

async function sendFriendReq(userId) {
  const btn = document.getElementById(`add-btn-${userId}`);
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
  try {
    await api.sendFriendRequest(userId);
    if (btn) { btn.textContent = 'Sent!'; btn.className = 'add-friend-btn sent'; }
    showToast('Friend request sent!', 'success');
  } catch (err) {
    if (btn) { btn.textContent = 'Add'; btn.disabled = false; }
    showToast(err.message, 'error');
  }
}

async function acceptRequest(requestId) {
  try {
    await api.acceptFriendRequest(requestId);
    showToast('Friend request accepted!', 'success');
    await loadFriends();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function rejectRequest(requestId) {
  try {
    await api.rejectFriendRequest(requestId);
    showToast('Friend request rejected.', 'info');
    document.getElementById(`req-${requestId}`)?.remove();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---- UI Helpers ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function switchTab(tab) {
  document.getElementById('login-form').classList.toggle('active', tab === 'login');
  document.getElementById('signup-form').classList.toggle('active', tab === 'signup');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
}

// ---- Sidebar Tabs ----
function switchSidebarTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`nav-${tab}`).classList.add('active');

  document.getElementById('chats-panel').classList.add('hidden');
  document.getElementById('friends-panel').classList.add('hidden');
  document.getElementById('requests-panel').classList.add('hidden');

  document.getElementById(`${tab}-panel`).classList.remove('hidden');
  
  if (tab === 'friends' || tab === 'requests') {
    loadFriends();
  }
}

function toggleSearch() {
  document.getElementById('search-panel').classList.toggle('hidden');
  if (!document.getElementById('search-panel').classList.contains('hidden')) {
    document.getElementById('user-search-input').focus();
  }
}

function closeSearch() {
  document.getElementById('search-panel').classList.add('hidden');
  document.getElementById('user-search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}

function closeChatMobile() {
  document.getElementById('sidebar').classList.remove('hidden-mobile');
  document.getElementById('chat-window').classList.add('hidden');
  document.getElementById('chat-empty').classList.remove('hidden');
  STATE.activeFriendId = null;
  closeContactProfile();
}

function openContactProfile() {
  if (!STATE.activeFriendId) return;
  const friend = STATE.friends.find(f => f._id === STATE.activeFriendId);
  if (!friend) return;

  const panel = document.getElementById('contact-profile');
  const avatarWrap = document.getElementById('contact-profile-avatar');
  
  if (friend.avatar) {
    avatarWrap.style.background = 'transparent';
    avatarWrap.innerHTML = `<img src="http://localhost:5001${friend.avatar}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
  } else {
    avatarWrap.textContent = getInitial(friend.username);
    avatarWrap.style.cssText = getAvatarGradient(friend.username);
  }
  
  document.getElementById('contact-profile-name').textContent = friend.username;
  document.getElementById('contact-profile-email').textContent = friend.email || 'No email available';

  panel.classList.remove('hidden');
}

function closeContactProfile() {
  document.getElementById('contact-profile').classList.add('hidden');
}

async function removeFriend() {
  if (!STATE.activeFriendId) return;
  const friend = STATE.friends.find(f => f._id === STATE.activeFriendId);
  if (!confirm(`Are you sure you want to remove ${friend.username} from your friends list?`)) return;

  try {
    const res = await api.removeFriend(STATE.activeFriendId);
    if (res.success) {
      showToast(`${friend.username} removed from friends`, 'info');
      closeContactProfile();
      closeChatMobile(); // Closes the chat window on desktop too (it resets state)
      document.getElementById('chat-empty').classList.remove('hidden');
      document.getElementById('chat-window').classList.add('hidden');
      await loadFriends();
    }
  } catch (err) {
    showToast('Could not remove friend', 'error');
  }
}

function updateChatStatus(friendId, isOnline) {
  const statusEl = document.getElementById('chat-header-status');
  if (statusEl) {
    statusEl.textContent = isOnline ? 'Online' : 'Offline';
    statusEl.className = `chat-header-status ${isOnline ? 'online' : ''}`;
  }
}

function updateLastMsg(friendId, content) {
  const el = document.getElementById(`last-msg-${friendId}`);
  if (el) el.textContent = content.length > 30 ? content.slice(0, 30) + '...' : content;
}

function scrollToBottom() {
  const container = document.getElementById('messages-container');
  setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-spinner').classList.toggle('hidden', !loading);
}

function shakeEl(el) {
  el.style.animation = 'shake 0.4s ease';
  setTimeout(() => { el.style.animation = ''; }, 400);
}

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ---- Toast Notifications ----
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Utilities ----
function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

const GRADIENTS = [
  'background: linear-gradient(135deg, #7c3aed, #4f46e5);',
  'background: linear-gradient(135deg, #ec4899, #8b5cf6);',
  'background: linear-gradient(135deg, #06b6d4, #3b82f6);',
  'background: linear-gradient(135deg, #f59e0b, #ef4444);',
  'background: linear-gradient(135deg, #10b981, #06b6d4);',
  'background: linear-gradient(135deg, #8b5cf6, #ec4899);',
];
function getAvatarGradient(name) {
  const idx = (name || '').charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// Shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }`;
document.head.appendChild(shakeStyle);

// ---- Lightbox Logic ----
function openLightbox(src) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-image');
  img.src = src;
  modal.classList.remove('hidden');
}

function closeLightbox(e) {
  // Only close if clicking the backdrop or the close button, not the image itself
  if (e && e.target.id === 'lightbox-image') return;
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('hidden');
  document.getElementById('lightbox-image').src = ''; // Clear src
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('lightbox-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closeLightbox();
    }
    const settingsDrawer = document.getElementById('settings-drawer');
    if (settingsDrawer && !settingsDrawer.classList.contains('hidden')) {
      closeSettingsDrawer();
    }
  }
});

// ---- Settings Drawer & Theme Logic ----
function openSettingsDrawer() {
  document.getElementById('settings-drawer').classList.remove('hidden');
  document.getElementById('settings-backdrop').classList.remove('hidden');
}

function closeSettingsDrawer() {
  document.getElementById('settings-drawer').classList.add('hidden');
  document.getElementById('settings-backdrop').classList.add('hidden');
}

function toggleTheme() {
  const isLight = document.getElementById('theme-toggle').checked;
  if (isLight) {
    document.body.classList.add('theme-light');
    localStorage.setItem('kapchat_theme', 'light');
  } else {
    document.body.classList.remove('theme-light');
    localStorage.setItem('kapchat_theme', 'dark');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('kapchat_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('theme-light');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.checked = true;
  }
});
