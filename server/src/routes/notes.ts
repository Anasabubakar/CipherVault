import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

interface NoteRow {
  site_hash: string;
  encrypted_blob: string;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

router.get('/:siteHash', (req: Request, res: Response) => {
  try {
    const { siteHash } = req.params;

    if (!siteHash || !/^[A-Za-z0-9+/=]+$/.test(siteHash)) {
      return res.status(400).json({ error: 'Invalid site hash format' });
    }

    const db = getDb();
    const note = db
      .prepare('SELECT * FROM notes WHERE site_hash = ?')
      .get(siteHash) as NoteRow | undefined;

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

router.post('/:siteHash', (req: Request, res: Response) => {
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

    const db = getDb();

    if (expected_hash) {
      const existing = db
        .prepare('SELECT content_hash FROM notes WHERE site_hash = ?')
        .get(siteHash) as { content_hash: string } | undefined;

      if (existing && existing.content_hash !== expected_hash) {
        return res.status(409).json({
          success: false,
          conflict: true,
          content_hash: existing.content_hash,
          error: 'Content hash mismatch. Another edit was made since you last loaded.'
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

router.delete('/:siteHash', (req: Request, res: Response) => {
  try {
    const { siteHash } = req.params;

    if (!siteHash || !/^[A-Za-z0-9+/=]+$/.test(siteHash)) {
      return res.status(400).json({ error: 'Invalid site hash format' });
    }

    const db = getDb();
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

export default router;
