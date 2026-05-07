import { type Express } from 'express';

import compileRouter from '@/routes/compile';
import healthRouter from '@/routes/health';

export function registerRoutes(app: Express) {
  app.use('/health', healthRouter);
  app.use('/compile', compileRouter);
}
