// ============================================
// KapChat API Client
// ============================================

const API_BASE = 'http://localhost:5001/api';

const api = {
  // ---- Auth ----
  async signup(username, email, password) {
    return this._request('POST', '/auth/signup', { username, email, password });
  },

  async login(email, password) {
    return this._request('POST', '/auth/login', { email, password });
  },

  // ---- Users ----
  async searchUsers(query) {
    return this._request('GET', `/users/search?query=${encodeURIComponent(query)}`);
  },

  // ---- Friends ----
  async getFriends() {
    return this._request('GET', '/friends');
  },

  async getFriendRequests() {
    return this._request('GET', '/friends/requests');
  },

  async sendFriendRequest(receiverId) {
    return this._request('POST', '/friends/request', { receiverId });
  },

  async acceptFriendRequest(requestId) {
    return this._request('POST', '/friends/accept', { requestId });
  },

  async rejectFriendRequest(requestId) {
    return this._request('POST', '/friends/reject', { requestId });
  },

  async removeFriend(friendId) {
    return this._request('DELETE', `/friends/${friendId}`);
  },

  // ---- Messages ----
  async getMessages(friendId, page = 1, limit = 40) {
    return this._request('GET', `/messages/${friendId}?page=${page}&limit=${limit}`);
  },

  // ---- Uploads ----
  async uploadFile(file) {
    const token = localStorage.getItem('kapchat_token');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    return res.json();
  },

  // ---- Internal ----
  async _request(method, path, body = null) {
    const token = localStorage.getItem('kapchat_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers, cache: 'no-store' };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
      return data;
    } catch (err) {
      throw err;
    }
  }
};
