import { type NextFunction, type Request, type Response } from 'express';

import { findUserBySessionToken, type UserDto } from '@/services/auth';
import { clearSessionCookie, readSessionCookie } from '@/services/auth/cookies';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserDto;
    sessionToken?: string;
  }
}

async function hydrateCurrentUser(req: Request, res: Response) {
  if (req.user) {
    return req.user;
  }

  const token = readSessionCookie(req);
  const user = await findUserBySessionToken(token);

  if (!user) {
    if (token) {
      clearSessionCookie(res);
    }

    return null;
  }

  req.user = user;
  req.sessionToken = token ?? undefined;
  return user;
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    await hydrateCurrentUser(req, res);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await hydrateCurrentUser(req, res);

    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'authentication required',
        },
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
