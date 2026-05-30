import { type Request, type Response } from 'express';

import { type AuthCredentialsSchema } from '@/schemas/auth.schema';
import {
  AuthError,
  endSession,
  findUserBySessionToken,
  loginUser,
  registerUser,
  startSession,
} from '@/services/auth';
import { clearSessionCookie, readSessionCookie, setSessionCookie } from '@/services/auth/cookies';

function sendAuthError(res: Response, error: AuthError) {
  const statusCode = error.code === 'EMAIL_ALREADY_REGISTERED' ? 409 : 401;

  res.status(statusCode).json({
    error: {
      code: error.code,
      message: error.message,
    },
  });
}

export async function registerController(req: Request, res: Response) {
  const { email, password } = req.body as AuthCredentialsSchema;

  try {
    const user = await registerUser(email, password);
    const session = await startSession(user.id);

    setSessionCookie(res, session.token, session.expiresAt);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      sendAuthError(res, error);
      return;
    }

    throw error;
  }
}

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body as AuthCredentialsSchema;

  try {
    const user = await loginUser(email, password);
    const session = await startSession(user.id);

    setSessionCookie(res, session.token, session.expiresAt);
    res.json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      sendAuthError(res, error);
      return;
    }

    throw error;
  }
}

export async function logoutController(req: Request, res: Response) {
  await endSession(readSessionCookie(req));
  clearSessionCookie(res);
  res.status(204).send();
}

export async function meController(req: Request, res: Response) {
  const token = readSessionCookie(req);
  const user = await findUserBySessionToken(token);

  if (!user && token) {
    clearSessionCookie(res);
  }

  res.json({ user });
}
