import { isDatabaseError } from '@/db/errors';
import {
  createSession,
  deleteExpiredSessions,
  deleteSessionByTokenHash,
  findUserBySessionTokenHash,
} from '@/db/sessions';
import { createUser, findUserByEmail, toUserDto, type UserDto } from '@/db/users';
import { hashPassword, verifyPassword } from '@/services/auth/passwords';
import {
  createSessionExpiry,
  createSessionToken,
  hashSessionToken,
} from '@/services/auth/sessions';

export type { UserDto } from '@/db/users';

export type AuthErrorCode = 'EMAIL_ALREADY_REGISTERED' | 'INVALID_CREDENTIALS';

const authErrorMessages: Record<AuthErrorCode, string> = {
  EMAIL_ALREADY_REGISTERED: 'email already registered',
  INVALID_CREDENTIALS: 'invalid email or password',
};

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(authErrorMessages[code]);
  }
}

export type SessionCredentials = {
  readonly token: string;
  readonly expiresAt: Date;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerUser(email: string, password: string): Promise<UserDto> {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  try {
    return toUserDto(await createUser(normalizedEmail, passwordHash));
  } catch (error) {
    if (isDatabaseError(error, '23505', 'users_email_key')) {
      throw new AuthError('EMAIL_ALREADY_REGISTERED');
    }

    throw error;
  }
}

export async function loginUser(email: string, password: string): Promise<UserDto> {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AuthError('INVALID_CREDENTIALS');
  }

  return toUserDto(user);
}

export async function startSession(userId: string): Promise<SessionCredentials> {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = createSessionExpiry();

  await deleteExpiredSessions();
  await createSession(userId, tokenHash, expiresAt);

  return { token, expiresAt };
}

export async function endSession(token: string | null) {
  if (!token) {
    return;
  }

  await deleteSessionByTokenHash(hashSessionToken(token));
}

export async function findUserBySessionToken(token: string | null): Promise<UserDto | null> {
  if (!token) {
    return null;
  }

  const user = await findUserBySessionTokenHash(hashSessionToken(token));

  return user ? toUserDto(user) : null;
}
