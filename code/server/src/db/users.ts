import { query } from '@/db/pool';

export type UserRow = {
  readonly id: string;
  readonly email: string;
  readonly password_hash: string;
  readonly last_opened_file_id: string | null;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
};

export type UserDto = {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastOpenedFileId: string | null;
};

export function toUserDto(user: UserRow): UserDto {
  return {
    id: user.id,
    email: user.email,
    createdAt: new Date(user.created_at).toISOString(),
    updatedAt: new Date(user.updated_at).toISOString(),
    lastOpenedFileId: user.last_opened_file_id,
  };
}

export async function createUser(email: string, passwordHash: string) {
  const result = await query<UserRow>(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash, last_opened_file_id, created_at, updated_at
    `,
    [email, passwordHash],
  );

  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  const result = await query<UserRow>(
    `
      SELECT id, email, password_hash, last_opened_file_id, created_at, updated_at
      FROM users
      WHERE email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await query<UserRow>(
    `
      SELECT id, email, password_hash, last_opened_file_id, created_at, updated_at
      FROM users
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
