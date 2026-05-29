import { Router } from 'express';

import {
  loginController,
  logoutController,
  meController,
  registerController,
} from '@/controllers/auth.controller';
import { asyncHandler } from '@/middleware/async-handler';
import { validate } from '@/middleware/validate';
import { authCredentialsSchema } from '@/schemas/auth.schema';

const router = Router();

router.post('/register', validate(authCredentialsSchema), asyncHandler(registerController));
router.post('/login', validate(authCredentialsSchema), asyncHandler(loginController));
router.post('/logout', asyncHandler(logoutController));
router.get('/me', asyncHandler(meController));

export default router;
