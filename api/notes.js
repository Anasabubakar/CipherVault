// Simple in-memory notes API for Vercel serverless
const store = new Map();

module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = req.url || '/';
  const parts = url.split('?')[0].split('/').filter(Boolean);

  // Health
  if (parts[0] === 'api' && parts[1] === 'health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Notes: /api/notes/:hash
  if (parts[0] === 'api' && parts[1] === 'notes') {
    const hash = parts[2];
    res.setHeader('Content-Type', 'application/json');

    if (!hash) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'hash required' }));
      return;
    }

    if (req.method === 'GET') {
      const note = store.get(hash) || null;
      res.end(JSON.stringify({ note }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.encrypted_blob || !data.content_hash) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'missing fields' }));
            return;
          }
          const existing = store.get(hash);
          if (existing && existing.content_hash !== data.content_hash) {
            res.statusCode = 409;
            res.end(JSON.stringify({ error: 'hash mismatch' }));
            return;
          }
          const now = new Date().toISOString();
          store.set(hash, {
            encrypted_blob: data.encrypted_blob,
            content_hash: data.content_hash,
            created_at: existing?.created_at || now,
            updated_at: now
          });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      store.delete(hash);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method' }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
};
