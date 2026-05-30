import { type Express } from 'express';

import authRouter from '@/routes/auth';
import compileRouter from '@/routes/compile';
import filesRouter from '@/routes/files';
import healthRouter from '@/routes/health';

export function registerRoutes(app: Express) {
  app.use('/auth', authRouter);
  app.use('/health', healthRouter);
  app.use('/compile', compileRouter);
  app.use('/files', filesRouter);
}
