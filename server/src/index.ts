import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import notesRouter from './routes/notes.js';
import { apiLimiter, writeLimiter } from './middleware/rateLimit.js';
import { sanitizeInput } from './middleware/validation.js';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
        childSrc: ["'self'", 'blob:']
      }
    }
  }));

  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(sanitizeInput);

  app.use('/api', apiLimiter);
  app.use('/api', writeLimiter);
  app.use('/api/notes', notesRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

export function startServer(port: number = 3001): void {
  const app = createApp();
  app.listen(port, () => {
    console.log(`CipherVault server running on port ${port}`);
  });
}
