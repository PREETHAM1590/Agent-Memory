import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MemoryDatabase } from '../database/index.js';
import { Observation, Config, WebhookEvent } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class WorkerService {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private db: MemoryDatabase;
  private config: Config;
  private clients: Set<WebSocket> = new Set();
  private authToken: string | null;

  constructor(db: MemoryDatabase, config: Config) {
    this.db = db;
    this.config = config;
    this.authToken = config.authToken || process.env.AGENT_MEMORY_TOKEN || null;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (!this.authToken) {
      next();
      return;
    }
    const providedToken = req.headers['x-agent-memory-token'] || req.query.token;
    if (providedToken !== this.authToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')) {
          callback(null, true);
        } else if (this.authToken) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    }));
    this.app.use(express.json());
    this.app.use(express.static(resolve(__dirname, '..', '..', 'web')));
  }

  private setupRoutes(): void {
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), authRequired: !!this.authToken });
    });

    this.app.get('/api/stats', this.authMiddleware.bind(this), (req, res) => {
      const stats = this.db.getStats();
      res.json(stats);
    });

    this.app.get('/api/observations', this.authMiddleware.bind(this), (req, res) => {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const type = req.query.type as string;
      const projectId = req.query.projectId as string;

      const observations = this.db.searchObservations('', {
        type: type as any,
        projectId,
        limit,
        offset
      });

      res.json(observations);
    });

    this.app.get('/api/observations/:id', this.authMiddleware.bind(this), (req, res) => {
      const id = parseInt(req.params.id);
      const obs = this.db.getObservation(id);

      if (!obs) {
        res.status(404).json({ error: 'Observation not found' });
        return;
      }

      res.json(obs);
    });

    this.app.post('/api/observations', this.authMiddleware.bind(this), (req, res) => {
      const id = this.db.storeObservation(req.body);
      const obs = this.db.getObservation(id);

      this.broadcast({ type: 'observation.created', data: obs });
      this.triggerWebhooks('observation.created', obs);

      res.status(201).json(obs);
    });

    this.app.patch('/api/observations/:id', this.authMiddleware.bind(this), (req, res) => {
      const id = parseInt(req.params.id);
      const updated = this.db.updateObservation(id, req.body);

      if (!updated) {
        res.status(404).json({ error: 'Observation not found or no changes provided' });
        return;
      }

      const obs = this.db.getObservation(id);
      this.broadcast({ type: 'observation.updated', data: obs });

      res.json(obs);
    });

    this.app.get('/api/search', this.authMiddleware.bind(this), (req, res) => {
      const query = req.query.q as string;
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 20;

      const observations = this.db.searchObservations(query || '', {
        type: type as any,
        limit
      });

      res.json(observations);
    });

    this.app.get('/api/timeline/:id', this.authMiddleware.bind(this), (req, res) => {
      const id = parseInt(req.params.id);
      const depth = parseInt(req.query.depth as string) || 5;

      const observations = this.db.getTimeline(id, depth);
      res.json(observations);
    });

    this.app.get('/api/sessions', this.authMiddleware.bind(this), (req, res) => {
      res.json({ message: 'Query sessions via GET /api/observations?sessionId=xxx or use the database directly' });
    });

    this.app.get('/api/projects', this.authMiddleware.bind(this), (req, res) => {
      res.json({ message: 'Query projects via GET /api/observations?projectId=xxx or use the database directly' });
    });

    this.app.get('/api/patterns', this.authMiddleware.bind(this), (req, res) => {
      const patterns = this.db.getPatterns(50);
      res.json(patterns);
    });

    this.app.get('/api/conflicts', this.authMiddleware.bind(this), (req, res) => {
      const conflicts = this.db.getConflicts();
      res.json(conflicts);
    });

    this.app.post('/api/conflicts/:id/resolve', this.authMiddleware.bind(this), (req, res) => {
      const id = req.params.id;
      const { resolution } = req.body;

      this.db.resolveConflict(id, resolution);
      res.json({ success: true });
    });

    this.app.get('/api/export', this.authMiddleware.bind(this), (req, res) => {
      const format = (req.query.format as string) || 'json';
      const observations = this.db.searchObservations('', { limit: 10000 });

      switch (format) {
        case 'json':
          res.json(observations);
          break;
        case 'csv':
          const csv = this.toCSV(observations);
          res.header('Content-Type', 'text/csv');
          res.send(csv);
          break;
        case 'markdown':
          const md = this.toMarkdown(observations);
          res.header('Content-Type', 'text/markdown');
          res.send(md);
          break;
        default:
          res.status(400).json({ error: 'Invalid format' });
      }
    });

    this.app.post('/api/webhooks', this.authMiddleware.bind(this), (req, res) => {
      const { url, events, secret } = req.body;
      const id = this.db.createWebhook({
        url,
        events,
        secret,
        active: true
      });

      res.status(201).json({ id, url, events, active: true });
    });

    this.app.get('/api/webhooks', this.authMiddleware.bind(this), (req, res) => {
      const webhooks = this.db.getWebhooks();
      res.json(webhooks);
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);

      const stats = this.db.getStats();
      ws.send(JSON.stringify({ type: 'init', data: stats }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  private async triggerWebhooks(event: WebhookEvent, data: any): Promise<void> {
    const webhooks = this.db.getWebhooks();
    const matching = webhooks.filter((w: any) => w.events.includes(event));

    for (const webhook of matching) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Memory-Event': event,
            ...(webhook.secret ? { 'X-Agent-Memory-Signature': webhook.secret } : {})
          },
          body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
        });
      } catch (error) {
        console.error(`Webhook failed: ${webhook.url}`, error);
      }
    }
  }

  private toCSV(observations: Observation[]): string {
    const headers = ['id', 'type', 'title', 'content', 'tags', 'createdAt'];
    const rows = observations.map(obs =>
      [obs.id, obs.type, `"${obs.title.replace(/"/g, '""')}"`, `"${obs.content.replace(/"/g, '""')}"`, obs.tags.join(';'), obs.createdAt.toISOString()].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  private toMarkdown(observations: Observation[]): string {
    return observations.map(obs =>
      `## #${obs.id} - ${obs.title}\n\n**Type:** ${obs.type}\n**Date:** ${obs.createdAt.toISOString()}\n**Tags:** ${obs.tags.join(', ')}\n\n${obs.content}\n\n---\n`
    ).join('\n');
  }

  start(): void {
    this.server.listen(this.config.port, '127.0.0.1', () => {
      console.log(`Agent-Memory worker running at http://127.0.0.1:${this.config.port}`);
      if (this.authToken) {
        console.log(`   Auth token required: Set X-Agent-Memory-Token header or ?token query param`);
      }
    });
  }

  stop(): void {
    this.server.close();
    this.wss.close();
  }
}
