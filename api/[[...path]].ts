import type { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbDir = process.env.DB_DIR || '/tmp';
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = process.env.DB_PATH || join(dbDir, 'ciphervault.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        site_hash TEXT PRIMARY KEY,
        encrypted_blob TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
    `);
  }
  return db;
}

interface NoteRow {
  site_hash: string;
  encrypted_blob: string;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body) return body;
  const sanitized = { ...body };
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = (sanitized[key] as string).replace(/\0/g, '');
    }
  }
  return sanitized;
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Content-Type', 'application/json');

  const path = req.query.path as string[] | undefined;
  const pathStr = path ? path.join('/') : '';

  if (pathStr === 'health') {
    if (req.method === 'GET') {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
      return;
    }
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const notesMatch = pathStr.match(/^notes\/(.+)$/);
  if (!notesMatch) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const siteHash = decodeURIComponent(notesMatch[1]);

  if (!siteHash || !/^[A-Za-z0-9+/=]+$/.test(siteHash)) {
    res.status(400).json({ error: 'Invalid site hash format' });
    return;
  }

  try {
    switch (req.method) {
      case 'GET': {
        const note = getDb()
          .prepare('SELECT * FROM notes WHERE site_hash = ?')
          .get(siteHash) as NoteRow | undefined;

        if (!note) {
          res.status(200).json({ note: null });
          return;
        }

        res.status(200).json({
          note: {
            site_hash: note.site_hash,
            encrypted_blob: note.encrypted_blob,
            content_hash: note.content_hash,
            created_at: note.created_at,
            updated_at: note.updated_at
          }
        });
        return;
      }

      case 'POST': {
        const body = sanitizeBody(req.body || {});
        const { encrypted_blob, content_hash, expected_hash } = body;

        if (!encrypted_blob || typeof encrypted_blob !== 'string') {
          res.status(400).json({ error: 'encrypted_blob is required' });
          return;
        }

        if (!content_hash || typeof content_hash !== 'string') {
          res.status(400).json({ error: 'content_hash is required' });
          return;
        }

        if ((encrypted_blob as string).length > 10 * 1024 * 1024) {
          res.status(413).json({ error: 'Payload too large (max 10MB)' });
          return;
        }

        const database = getDb();

        if (expected_hash) {
          const existing = database
            .prepare('SELECT content_hash FROM notes WHERE site_hash = ?')
            .get(siteHash) as { content_hash: string } | undefined;

          if (existing && existing.content_hash !== expected_hash) {
            res.status(409).json({
              success: false,
              conflict: true,
              content_hash: existing.content_hash,
              error: 'Content hash mismatch. Another edit was made since you last loaded.'
            });
            return;
          }
        }

        const existingNote = database
          .prepare('SELECT site_hash FROM notes WHERE site_hash = ?')
          .get(siteHash);

        if (existingNote) {
          database
            .prepare(
              "UPDATE notes SET encrypted_blob = ?, content_hash = ?, updated_at = datetime('now') WHERE site_hash = ?"
            )
            .run(encrypted_blob, content_hash, siteHash);
        } else {
          database
            .prepare('INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)')
            .run(siteHash, encrypted_blob, content_hash);
        }

        res.status(200).json({ success: true, content_hash });
        return;
      }

      case 'DELETE': {
        const result = getDb()
          .prepare('DELETE FROM notes WHERE site_hash = ?')
          .run(siteHash);

        if (result.changes === 0) {
          res.status(404).json({ error: 'Note not found' });
          return;
        }

        res.status(200).json({ success: true });
        return;
      }

      default:
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
