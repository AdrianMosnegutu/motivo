import { query } from '@/db/pool';
import { type UserRow } from '@/db/users';

export type SessionRow = {
  readonly id: string;
  readonly user_id: string;
  readonly token_hash: string;
  readonly expires_at: Date | string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
};

export async function createSession(userId: string, tokenHash: string, expiresAt: Date) {
  const result = await query<SessionRow>(
    `
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, token_hash, expires_at, created_at, updated_at
    `,
    [userId, tokenHash, expiresAt],
  );

  return result.rows[0];
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

export async function deleteExpiredSessions() {
  await query('DELETE FROM sessions WHERE expires_at <= now()');
}

export async function findUserBySessionTokenHash(tokenHash: string) {
  const result = await query<UserRow>(
    `
      SELECT u.id, u.email, u.password_hash, u.last_opened_file_id, u.created_at, u.updated_at
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}
