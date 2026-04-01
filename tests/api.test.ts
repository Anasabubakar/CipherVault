/**
 * Tests for API server endpoints.
 * Creates an in-memory Express app with SQLite for isolated testing.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';

// Inline the DB setup and routes for test isolation
function createTestApp(): { app: express.Application; db: Database.Database } {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');

  // Create schema inline
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

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Notes routes (inlined)
  const router = express.Router();

  router.get('/:siteHash', (req: express.Request, res: express.Response) => {
    try {
      const { siteHash } = req.params;
      if (!siteHash || !/^[A-Za-z0-9+/=]+$/.test(siteHash)) {
        return res.status(400).json({ error: 'Invalid site hash format' });
      }
      const note = db
        .prepare('SELECT * FROM notes WHERE site_hash = ?')
        .get(siteHash) as any;
      if (!note) {
        return res.json({ note: null });
      }
      res.json({
        note: {
          site_hash: note.site_hash,
          encrypted_blob: note.encrypted_blob,
          content_hash: note.content_hash,
          created_at: note.created_at,
          updated_at: note.updated_at
        }
      });
    } catch (error) {
      console.error('GET note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/:siteHash', (req: express.Request, res: express.Response) => {
    try {
      const { siteHash } = req.params;
      const { encrypted_blob, content_hash, expected_hash } = req.body;

      if (!siteHash || !/^[A-Za-z0-9+/=]+$/.test(siteHash)) {
        return res.status(400).json({ error: 'Invalid site hash format' });
      }
      if (!encrypted_blob || typeof encrypted_blob !== 'string') {
        return res.status(400).json({ error: 'encrypted_blob is required' });
      }
      if (!content_hash || typeof content_hash !== 'string') {
        return res.status(400).json({ error: 'content_hash is required' });
      }
      if (encrypted_blob.length > 10 * 1024 * 1024) {
        return res.status(413).json({ error: 'Payload too large (max 10MB)' });
      }

      if (expected_hash) {
        const existing = db
          .prepare('SELECT content_hash FROM notes WHERE site_hash = ?')
          .get(siteHash) as any;
        if (existing && existing.content_hash !== expected_hash) {
          return res.status(409).json({
            success: false,
            conflict: true,
            content_hash: existing.content_hash,
            error: 'Content hash mismatch'
          });
        }
      }

      const existing = db
        .prepare('SELECT site_hash FROM notes WHERE site_hash = ?')
        .get(siteHash);

      if (existing) {
        db.prepare(
          'UPDATE notes SET encrypted_blob = ?, content_hash = ?, updated_at = datetime(\'now\') WHERE site_hash = ?'
        ).run(encrypted_blob, content_hash, siteHash);
      } else {
        db.prepare(
          'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
        ).run(siteHash, encrypted_blob, content_hash);
      }

      res.json({ success: true, content_hash });
    } catch (error) {
      console.error('POST note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/:siteHash', (req: express.Request, res: express.Response) => {
    try {
      const { siteHash } = req.params;
      if (!siteHash || !/^[A-Za-z0-9+/=]+$/.test(siteHash)) {
        return res.status(400).json({ error: 'Invalid site hash format' });
      }
      const result = db
        .prepare('DELETE FROM notes WHERE site_hash = ?')
        .run(siteHash);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('DELETE note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.use('/api/notes', router);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return { app, db };
}

describe('API Server', () => {
  let app: express.Application;
  let db: Database.Database;

  beforeAll(() => {
    const testApp = createTestApp();
    app = testApp.app;
    db = testApp.db;
  });

  beforeEach(() => {
    db.exec('DELETE FROM notes');
  });

  describe('GET /api/notes/:siteHash', () => {
    it('should return null for non-existent note', async () => {
      const res = await request(app).get('/api/notes/YWJjMTIz');
      expect(res.status).toBe(200);
      expect(res.body.note).toBeNull();
    });

    it('should return note data for existing note', async () => {
      db.prepare(
        'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
      ).run('YWJjMTIz', 'encrypted-data', 'hash123');

      const res = await request(app).get('/api/notes/YWJjMTIz');
      expect(res.status).toBe(200);
      expect(res.body.note).toBeDefined();
      expect(res.body.note.site_hash).toBe('YWJjMTIz');
      expect(res.body.note.encrypted_blob).toBe('encrypted-data');
      expect(res.body.note.content_hash).toBe('hash123');
    });

    it('should return 400 for invalid site hash format', async () => {
      const res = await request(app).get('/api/notes/invalid!@#$%');
      expect(res.status).toBe(400);
    });

    it('should include timestamps', async () => {
      db.prepare(
        'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
      ).run('dGVzdHRpbWVz', 'data', 'hash');

      const res = await request(app).get('/api/notes/dGVzdHRpbWVz');
      expect(res.body.note).toBeDefined();
      expect(res.body.note.created_at).toBeDefined();
      expect(res.body.note.updated_at).toBeDefined();
    });
  });

  describe('POST /api/notes/:siteHash', () => {
    it('should create a new note', async () => {
      const res = await request(app)
        .post('/api/notes/bmV3bm90ZQ==')
        .send({ encrypted_blob: 'blob123', content_hash: 'hash456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.content_hash).toBe('hash456');
    });

    it('should update an existing note', async () => {
      db.prepare(
        'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
      ).run('ZXhpc3Rpbmc=', 'old-blob', 'old-hash');

      const res = await request(app)
        .post('/api/notes/ZXhpc3Rpbmc=')
        .send({ encrypted_blob: 'new-blob', content_hash: 'new-hash' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const note = db.prepare('SELECT * FROM notes WHERE site_hash = ?').get('ZXhpc3Rpbmc=') as any;
      expect(note.encrypted_blob).toBe('new-blob');
      expect(note.content_hash).toBe('new-hash');
    });

    it('should return 400 when encrypted_blob is missing', async () => {
      const res = await request(app)
        .post('/api/notes/dGVzdA==')
        .send({ content_hash: 'hash' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when content_hash is missing', async () => {
      const res = await request(app)
        .post('/api/notes/dGVzdA==')
        .send({ encrypted_blob: 'blob' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid site hash format', async () => {
      const res = await request(app)
        .post('/api/notes/invalid!@#')
        .send({ encrypted_blob: 'blob', content_hash: 'hash' });

      expect(res.status).toBe(400);
    });

    it('should detect content hash mismatch (overwrite protection)', async () => {
      db.prepare(
        'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
      ).run('Y29uZmxpY3Q=', 'old-blob', 'original-hash');

      const res = await request(app)
        .post('/api/notes/Y29uZmxpY3Q=')
        .send({
          encrypted_blob: 'new-blob',
          content_hash: 'new-hash',
          expected_hash: 'stale-hash'
        });

      expect(res.status).toBe(409);
      expect(res.body.conflict).toBe(true);
    });

    it('should allow save when expected_hash matches current', async () => {
      db.prepare(
        'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
      ).run('bm9jb25mbGljdA==', 'old-blob', 'current-hash');

      const res = await request(app)
        .post('/api/notes/bm9jb25mbGljdA==')
        .send({
          encrypted_blob: 'new-blob',
          content_hash: 'new-hash',
          expected_hash: 'current-hash'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle large payloads (up to 10MB)', async () => {
      const largeBlob = 'x'.repeat(1024 * 1024); // 1MB
      const res = await request(app)
        .post('/api/notes/bGFyZ2U=')
        .send({ encrypted_blob: largeBlob, content_hash: 'hash' });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/notes/:siteHash', () => {
    it('should delete an existing note', async () => {
      db.prepare(
        'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
      ).run('ZGVsZXRlbWU=', 'blob', 'hash');

      const res = await request(app).delete('/api/notes/ZGVsZXRlbWU=');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const note = db.prepare('SELECT * FROM notes WHERE site_hash = ?').get('ZGVsZXRlbWU=');
      expect(note).toBeUndefined();
    });

    it('should return 404 for non-existent note', async () => {
      const res = await request(app).delete('/api/notes/bm9uZXhpc3RlbnQ=');
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid site hash', async () => {
      const res = await request(app).delete('/api/notes/invalid!@#');
      expect(res.status).toBe(400);
    });
  });

  describe('Health check', () => {
    it('should return ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Database integrity', () => {
    it('should enforce primary key constraint', () => {
      db.prepare(
        'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
      ).run('cGt0ZXN0', 'blob1', 'hash1');

      expect(() => {
        db.prepare(
          'INSERT INTO notes (site_hash, encrypted_blob, content_hash) VALUES (?, ?, ?)'
        ).run('cGt0ZXN0', 'blob2', 'hash2');
      }).toThrow();
    });
  });
});
