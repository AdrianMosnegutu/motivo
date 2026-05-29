import { query, withDatabaseClient } from '@/db';
import { FileNameConflictError } from '@/services/files/errors';
import {
  type CreateFileInput,
  type MotivoFile,
  type UpdateFileInput,
} from '@/services/files/types';

interface FileRow {
  readonly id: string;
  readonly owner_id: string;
  readonly name: string;
  readonly source: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly last_opened_at: Date | string | null;
}

const fileFields = `
  id,
  owner_id,
  name,
  source,
  created_at,
  updated_at,
  last_opened_at
`;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function mapFile(row: FileRow): MotivoFile {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    source: row.source,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    lastOpenedAt: row.last_opened_at === null ? null : toDate(row.last_opened_at),
  };
}

function isFileNameConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    String(error.constraint).includes('motivo_files_owner_name')
  );
}

export async function listFilesByOwner(ownerId: string): Promise<MotivoFile[]> {
  const result = await query<FileRow>(
    `
      SELECT ${fileFields}
      FROM motivo_files
      WHERE owner_id = $1
      ORDER BY updated_at DESC, created_at DESC
    `,
    [ownerId],
  );

  return result.rows.map(mapFile);
}

export async function createFile(ownerId: string, input: CreateFileInput): Promise<MotivoFile> {
  try {
    const result = await query<FileRow>(
      `
        INSERT INTO motivo_files (owner_id, name, source)
        VALUES ($1, $2, $3)
        RETURNING ${fileFields}
      `,
      [ownerId, input.name, input.source],
    );

    return mapFile(result.rows[0]);
  } catch (error) {
    if (isFileNameConflict(error)) {
      throw new FileNameConflictError();
    }

    throw error;
  }
}

export async function findFileByOwner(ownerId: string, fileId: string): Promise<MotivoFile | null> {
  const result = await query<FileRow>(
    `
      SELECT ${fileFields}
      FROM motivo_files
      WHERE owner_id = $1 AND id = $2
    `,
    [ownerId, fileId],
  );

  return result.rows[0] ? mapFile(result.rows[0]) : null;
}

export async function updateFileByOwner(
  ownerId: string,
  fileId: string,
  input: UpdateFileInput,
): Promise<MotivoFile | null> {
  const updates: string[] = [];
  const values: unknown[] = [ownerId, fileId];

  if (input.name !== undefined) {
    values.push(input.name);
    updates.push(`name = $${values.length}`);
  }

  if (input.source !== undefined) {
    values.push(input.source);
    updates.push(`source = $${values.length}`);
  }

  values.push(new Date().toISOString());
  updates.push(`updated_at = $${values.length}`);

  try {
    const result = await query<FileRow>(
      `
        UPDATE motivo_files
        SET ${updates.join(', ')}
        WHERE owner_id = $1 AND id = $2
        RETURNING ${fileFields}
      `,
      values,
    );

    return result.rows[0] ? mapFile(result.rows[0]) : null;
  } catch (error) {
    if (isFileNameConflict(error)) {
      throw new FileNameConflictError();
    }

    throw error;
  }
}

export async function deleteFileByOwner(ownerId: string, fileId: string): Promise<boolean> {
  const result = await query(
    `
      DELETE FROM motivo_files
      WHERE owner_id = $1 AND id = $2
    `,
    [ownerId, fileId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function openFileByOwner(ownerId: string, fileId: string): Promise<MotivoFile | null> {
  return withDatabaseClient(async (client) => {
    await client.query('BEGIN');

    try {
      const openedAt = new Date().toISOString();
      const fileResult = await client.query<FileRow>(
        `
          UPDATE motivo_files
          SET last_opened_at = $3
          WHERE owner_id = $1 AND id = $2
          RETURNING ${fileFields}
        `,
        [ownerId, fileId, openedAt],
      );

      const file = fileResult.rows[0] ? mapFile(fileResult.rows[0]) : null;

      if (!file) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query(
        `
          UPDATE users
          SET last_opened_file_id = $2
          WHERE id = $1
        `,
        [ownerId, fileId],
      );

      await client.query('COMMIT');
      return file;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}
