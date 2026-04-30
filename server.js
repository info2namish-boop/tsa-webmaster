
const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'resources.json');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());                        // allow requests from any origin
app.use(express.json());                // parse JSON request bodies
app.use(express.static(__dirname));     // serve index.html + assets from same folder

// ── Helpers ──────────────────────────────────────────────────────────────────
function readDB() {
  try {
    if (!fs.existsSync(DB)) return [];
    return JSON.parse(fs.readFileSync(DB, 'utf8'));
  } catch {
    return [];
  }
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2), 'utf8');
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET all submitted resources
app.get('/api/resources', (req, res) => {
  res.json(readDB());
});

// POST a new resource
app.post('/api/resources', (req, res) => {
  const resource = req.body;
  if (!resource || !resource.name || !resource.category) {
    return res.status(400).json({ error: 'Missing required fields: name, category' });
  }
  // Assign a server-side ID so all clients see the same ID
  resource.id = Date.now();
  const all = readDB();
  all.push(resource);
  writeDB(all);
  res.status(201).json(resource);   // return the saved resource (with its server ID)
});

// DELETE a resource by ID (admin only — password checked client-side)
app.delete('/api/resources/:id', (req, res) => {
  const id  = parseInt(req.params.id, 10);
  const all = readDB();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Resource not found' });
  all.splice(idx, 1);
  writeDB(all);
  res.json({ success: true });
});

// Catch-all: serve index.html for any unmatched route (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Apex Resource Hub running at http://localhost:${PORT}`);
  console.log(`📁  Resources stored in: ${DB}`);
});
