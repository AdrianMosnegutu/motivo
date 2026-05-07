import { Router } from 'express';

import { compileController } from '@/controllers/compile.controller';
import { asyncHandler } from '@/middleware/async-handler';
import { validate } from '@/middleware/validate';
import { compileSourceSchema } from '@/schemas/compile.schema';

const compileRouter = Router();

compileRouter.post('/', validate(compileSourceSchema), asyncHandler(compileController));

export default compileRouter;
