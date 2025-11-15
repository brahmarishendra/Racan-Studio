import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import templateRoutes from './routes/templates.js';
import projectRoutes from './routes/projects.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(cookieParser());
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000';
  const origins = corsOrigin.split(',').map(o => o.trim()).filter(Boolean);
  const corsConfig: cors.CorsOptions = {
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman/cURL
      try {
        const url = new URL(origin);
        const host = url.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        if (isLocal) return callback(null, true);
      } catch {}
      if (origins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: Origin not allowed'));
    },
  };
  app.use(cors(corsConfig));
  app.options('*', cors(corsConfig));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Simple image proxy to avoid client-side CORS taint during export
  app.get('/proxy/image', async (req, res) => {
    try {
      const url = String((req.query as any).url || '');
      if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Invalid url' });
      const r = await fetch(url);
      if (!r.ok) return res.status(502).json({ error: 'Upstream fetch failed' });
      const ct = r.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const buf = Buffer.from(await r.arrayBuffer());
      res.end(buf);
    } catch (e) {
      res.status(500).json({ error: 'Proxy error' });
    }
  });

  app.use('/auth', authRoutes);
  app.use('/templates', templateRoutes);
  app.use('/projects', projectRoutes);

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    // Basic CORS error shape for preflight failures
    if (String(err?.message || '').includes('CORS')) {
      return res.status(403).json({ error: 'CORS Forbidden' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
