import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory store for serverless (resets on cold start — production should use a real DB)
const store = new Map<string, { encrypted_blob: string; content_hash: string; created_at: string; updated_at: string }>();

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.query.path as string[] | undefined;
  const route = path?.[0] || '';

  // Health check
  if (route === 'health') {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Notes API
  if (route === 'notes') {
    const siteHash = path?.[1];
    
    if (!siteHash) {
      return res.status(400).json({ error: 'Site hash required' });
    }

    if (req.method === 'GET') {
      const note = store.get(siteHash);
      return res.json({ note: note || null });
    }

    if (req.method === 'POST') {
      const { encrypted_blob, content_hash } = req.body || {};
      if (!encrypted_blob || !content_hash) {
        return res.status(400).json({ error: 'encrypted_blob and content_hash required' });
      }

      const existing = store.get(siteHash);
      if (existing && existing.content_hash !== content_hash) {
        return res.status(409).json({ error: 'Content hash mismatch', current_hash: existing.content_hash });
      }

      const now = new Date().toISOString();
      const note = {
        encrypted_blob,
        content_hash,
        created_at: existing?.created_at || now,
        updated_at: now
      };
      store.set(siteHash, note);
      return res.json({ success: true, content_hash });
    }

    if (req.method === 'DELETE') {
      if (!store.has(siteHash)) {
        return res.status(404).json({ error: 'Note not found' });
      }
      store.delete(siteHash);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Default: API not found
  return res.status(404).json({ error: 'API endpoint not found' });
}
