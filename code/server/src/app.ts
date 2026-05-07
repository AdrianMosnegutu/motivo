import cors from 'cors';
import express from 'express';

import { errorHandler } from '@/middleware/errors';
import { registerRoutes } from '@/routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '512kb' }));

registerRoutes(app);

app.use(errorHandler);

export default app;
