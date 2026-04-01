import { Request, Response, NextFunction } from 'express';

export function validateSiteHash(req: Request, res: Response, next: NextFunction): void {
  const { siteHash } = req.params;

  if (!siteHash) {
    res.status(400).json({ error: 'siteHash parameter is required' });
    return;
  }

  if (!/^[A-Za-z0-9+/=]+$/.test(siteHash)) {
    res.status(400).json({ error: 'Invalid site hash format' });
    return;
  }

  if (siteHash.length > 256) {
    res.status(400).json({ error: 'Site hash too long' });
    return;
  }

  next();
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/\0/g, '');
      }
    }
  }
  next();
}
