// TaskPulse Backend Server with Zero-Dependency User Authentication & Multi-Device Sync
// Pure Node.js (http, fs, path, url, crypto, os)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 4321;
const DATA_DIR = path.join(__dirname, 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');
const BACKUP_FILE = path.join(DATA_DIR, 'tasks.backup.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure directories exist
[DATA_DIR, BACKUPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Helper: Get Local Network IPs for Phone Connection
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

// In-Memory Storage loaded from disk
let db = {
  users: [],
  apps: [],
  tasks: []
};
let sessions = {};

// Load database safely
function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db.users = Array.isArray(parsed.users) ? parsed.users : [];
      db.apps = Array.isArray(parsed.apps) ? parsed.apps : [];
      db.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      console.log(`[DB] Loaded: ${db.users.length} users, ${db.apps.length} apps, ${db.tasks.length} tasks.`);
    } else {
      saveDatabaseSync();
    }
  } catch (err) {
    console.error('[DB Error] Failed to read tasks.json:', err);
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        db = parsed;
        console.log('[DB] Restored from backup file.');
      } catch (e) {
        console.error('[DB Error] Failed to restore backup:', e);
      }
    }
  }
}

// Load sessions safely
function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
    }
  } catch (e) {
    sessions = {};
  }
}

function saveSessions() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Session Error] Failed to save sessions:', e);
  }
}

// Atomic & Safe File Write with Zero-Data-Loss Guarantee
function saveDatabaseSync() {
  const payload = JSON.stringify(db, null, 2);
  const tmpFile = path.join(DATA_DIR, `tasks.json.tmp.${Date.now()}`);

  try {
    // 1. Write to temp file first
    fs.writeFileSync(tmpFile, payload, 'utf-8');

    // 2. Keep immediate backup file
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }

    // 3. Atomically replace data file
    fs.renameSync(tmpFile, DATA_FILE);

    // 4. Timestamped rolling backup (max 10 backups)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(BACKUPS_DIR, `tasks-${stamp}.json`);
    fs.writeFileSync(snapshotPath, payload, 'utf-8');

    // Prune old rolling backups
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('tasks-') && f.endsWith('.json'))
      .sort();
    if (files.length > 10) {
      for (let i = 0; i < files.length - 10; i++) {
        fs.unlinkSync(path.join(BACKUPS_DIR, files[i]));
      }
    }
    return true;
  } catch (err) {
    console.error('[Save Error] Failed atomic save:', err);
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch (e) {}
    }
    return false;
  }
}

// Crypto Helpers
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, hash) {
  const candidateHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(hash, 'hex'));
}

function createSession(userId, username) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days
  sessions[token] = { userId, username, createdAt: new Date().toISOString(), expiresAt };
  saveSessions();
  return token;
}

function getSessionUser(req) {
  const authHeader = req.headers['authorization'] || '';
  const match = authHeader.match(/^Bearer\s+([a-zA-Z0-9_-]+)$/i);
  if (!match) return null;
  const token = match[1];
  const session = sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    delete sessions[token];
    saveSessions();
    return null;
  }
  const user = db.users.find(u => u.id === session.userId);
  return user ? { id: user.id, username: user.username, token } : null;
}

// MIME Types for Web Static Delivery
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Initialize Data
loadDatabase();
loadSessions();

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers for seamless cross-device mobile support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper JSON responders
  const sendJson = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const readBody = (callback) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        callback(null, parsed);
      } catch (err) {
        callback(err);
      }
    });
  };

  // API: Network / Connect Phone Info
  if (req.method === 'GET' && pathname === '/api/network-info') {
    sendJson(200, {
      port: PORT,
      ips: getLocalIps(),
      timestamp: new Date().toISOString()
    });
    return;
  }

  // API: Register New Account
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    readBody((err, body) => {
      if (err || !body.username || !body.password) {
        return sendJson(400, { error: 'Username and password are required' });
      }

      const username = body.username.trim().toLowerCase();
      if (username.length < 2) {
        return sendJson(400, { error: 'Username must be at least 2 characters long' });
      }
      if (body.password.length < 4) {
        return sendJson(400, { error: 'Password must be at least 4 characters long' });
      }

      if (db.users.some(u => u.username.toLowerCase() === username)) {
        return sendJson(409, { error: 'An account with this username already exists' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(body.password, salt);
      const newUser = {
        id: 'usr-' + Date.now(),
        username: body.username.trim(),
        salt,
        passwordHash,
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);

      // ZERO-DATA-LOSS GUARANTEE:
      // Automatically link any existing unassigned tasks/apps to this user!
      let claimedApps = 0;
      let claimedTasks = 0;
      db.apps.forEach(app => {
        if (!app.userId) {
          app.userId = newUser.id;
          claimedApps++;
        }
      });
      db.tasks.forEach(task => {
        if (!task.userId) {
          task.userId = newUser.id;
          claimedTasks++;
        }
      });

      saveDatabaseSync();
      const token = createSession(newUser.id, newUser.username);

      console.log(`[Auth] Registered user "${newUser.username}". Claimed ${claimedApps} apps & ${claimedTasks} existing tasks.`);
      sendJson(200, {
        success: true,
        token,
        user: { id: newUser.id, username: newUser.username },
        claimedExisting: { apps: claimedApps, tasks: claimedTasks }
      });
    });
    return;
  }

  // API: Login to Existing Account
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    readBody((err, body) => {
      if (err || !body.username || !body.password) {
        return sendJson(400, { error: 'Username and password are required' });
      }

      const username = body.username.trim().toLowerCase();
      const user = db.users.find(u => u.username.toLowerCase() === username);

      if (!user || !verifyPassword(body.password, user.salt, user.passwordHash)) {
        return sendJson(401, { error: 'Invalid username or password' });
      }

      // Also claim any unassigned tasks if applicable
      db.apps.forEach(a => { if (!a.userId) a.userId = user.id; });
      db.tasks.forEach(t => { if (!t.userId) t.userId = user.id; });
      saveDatabaseSync();

      const token = createSession(user.id, user.username);
      console.log(`[Auth] User "${user.username}" logged in.`);
      sendJson(200, {
        success: true,
        token,
        user: { id: user.id, username: user.username }
      });
    });
    return;
  }

  // API: Get Current Authenticated User
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const authUser = getSessionUser(req);
    if (!authUser) {
      return sendJson(401, { authenticated: false, totalRegisteredUsers: db.users.length });
    }
    sendJson(200, {
      authenticated: true,
      user: authUser,
      networkIps: getLocalIps(),
      port: PORT
    });
    return;
  }

  // API: Logout
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const authHeader = req.headers['authorization'] || '';
    const match = authHeader.match(/^Bearer\s+([a-zA-Z0-9_-]+)$/i);
    if (match && sessions[match[1]]) {
      delete sessions[match[1]];
      saveSessions();
    }
    sendJson(200, { success: true });
    return;
  }

  // API: Fetch Tasks and Apps
  if (req.method === 'GET' && pathname === '/api/data') {
    const authUser = getSessionUser(req);

    let userApps = [];
    let userTasks = [];

    if (authUser) {
      // Return user-specific data
      userApps = db.apps.filter(a => a.userId === authUser.id || !a.userId);
      userTasks = db.tasks.filter(t => t.userId === authUser.id || !t.userId);
    } else {
      // If no users registered yet, allow access to initial unassigned data
      if (db.users.length === 0) {
        userApps = db.apps;
        userTasks = db.tasks;
      } else {
        // Require login if users exist
        return sendJson(401, {
          error: 'Authentication required to view tasks',
          requiresAuth: true
        });
      }
    }

    sendJson(200, {
      apps: userApps,
      tasks: userTasks,
      hasUsers: db.users.length > 0,
      user: authUser || null,
      updatedAt: new Date().toISOString()
    });
    return;
  }

  // API: Save Tasks and Apps
  if (req.method === 'POST' && pathname === '/api/data') {
    readBody((err, body) => {
      if (err || !Array.isArray(body.apps) || !Array.isArray(body.tasks)) {
        return sendJson(400, { error: 'Invalid data format: apps and tasks arrays required' });
      }

      const authUser = getSessionUser(req);

      if (authUser) {
        // Tag incoming items with userId
        const incomingApps = body.apps.map(a => ({ ...a, userId: authUser.id }));
        const incomingTasks = body.tasks.map(t => ({ ...t, userId: authUser.id }));

        // Retain other users' items in DB
        const otherApps = db.apps.filter(a => a.userId && a.userId !== authUser.id);
        const otherTasks = db.tasks.filter(t => t.userId && t.userId !== authUser.id);

        db.apps = [...otherApps, ...incomingApps];
        db.tasks = [...otherTasks, ...incomingTasks];
      } else {
        if (db.users.length > 0) {
          return sendJson(401, { error: 'Authentication required to save tasks' });
        }
        // Legacy/initial save before users exist
        db.apps = body.apps;
        db.tasks = body.tasks;
      }

      const success = saveDatabaseSync();
      if (!success) {
        return sendJson(500, { error: 'Failed to write data safely to disk' });
      }

      sendJson(200, {
        success: true,
        count: body.tasks.length,
        updatedAt: new Date().toISOString()
      });
    });
    return;
  }

  // API: Export Changelog
  if (req.method === 'POST' && pathname === '/api/export-changelog') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid request' });
      const safeName = (body.appName || 'app').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `CHANGELOG-${safeName}.md`;
      const filePath = path.join(__dirname, filename);
      fs.writeFileSync(filePath, body.content || '', 'utf-8');
      sendJson(200, { success: true, file: filename });
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIps();
  console.log(`===================================================`);
  console.log(`🚀 TaskPulse Multi-Device Sync Backend is ACTIVE!`);
  console.log(`📍 Laptop URL: http://127.0.0.1:${PORT}`);
  ips.forEach(ip => {
    console.log(`📱 Phone URL:  http://${ip}:${PORT}`);
  });
  console.log(`🔒 Authentication & Zero-Data-Loss enabled.`);
  console.log(`💾 Data: ${DATA_FILE}`);
  console.log(`===================================================`);
});
