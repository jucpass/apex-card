import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { requireAdminUser, requireSupabaseAuth } from './auth/supabaseAuth';
import adminRouter from './routes/admin';
import healthRouter from './routes/health';
import metaRouter from './routes/meta';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const host = process.env.HOST || '127.0.0.1';

app.use(cors());
app.use(express.json());
app.use('/health', healthRouter);
app.use('/api/admin', requireSupabaseAuth, requireAdminUser, adminRouter);
app.use('/api/meta', requireSupabaseAuth, requireAdminUser, metaRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'api', environment: process.env.NODE_ENV || 'development' });
});

app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

app.use(
  (
    _error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  },
);

const server = app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://${host}:${port}`);
});

server.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('API failed to start', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});
