import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/app';

import { registerAndLogin } from '@tests/helpers/auth';
import { useTestDatabase } from '@tests/helpers/database';

useTestDatabase();

type FileResponseBody = {
  readonly file: {
    readonly id: string;
    readonly name: string;
    readonly source: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly lastOpenedAt: string | null;
  };
};

type FileListResponseBody = {
  readonly files: Array<{
    readonly id: string;
    readonly source?: string;
  }>;
};

type MeResponseBody = {
  readonly user: {
    readonly lastOpenedFileId: string | null;
  };
};

describe('file storage API contract', () => {
  it('requires authentication for file routes', async () => {
    const response = await request(app).get('/files').expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'authentication required',
      },
    });
  });

  it('creates, lists, opens, autosaves, renames, downloads, and deletes a user file', async () => {
    const { agent } = await registerAndLogin('files@example.com');

    const created = await agent
      .post('/files')
      .send({ name: 'First Song.motivo', source: 'tempo 120;' })
      .expect(201);
    const createdFile = (created.body as FileResponseBody).file;

    expect(createdFile.id).toEqual(expect.any(String));
    expect(createdFile.name).toBe('First Song.motivo');
    expect(createdFile.source).toBe('tempo 120;');
    expect(createdFile.createdAt).toEqual(expect.any(String));
    expect(createdFile.updatedAt).toEqual(expect.any(String));
    expect(createdFile.lastOpenedAt).toBeNull();

    const fileId = createdFile.id;
    const listed = await agent.get('/files').expect(200);
    const listedFiles = (listed.body as FileListResponseBody).files;
    expect(listedFiles).toHaveLength(1);
    expect(listedFiles[0]).not.toHaveProperty('source');

    const opened = await agent.get(`/files/${fileId}`).expect(200);
    const openedFile = (opened.body as FileResponseBody).file;
    expect(openedFile.source).toBe('tempo 120;');
    expect(openedFile.lastOpenedAt).toEqual(expect.any(String));

    const autosaved = await agent
      .patch(`/files/${fileId}`)
      .send({ source: 'tempo 140;' })
      .expect(200);
    expect((autosaved.body as FileResponseBody).file.source).toBe('tempo 140;');

    const renamed = await agent
      .patch(`/files/${fileId}`)
      .send({ name: 'Renamed Song.motivo' })
      .expect(200);
    expect((renamed.body as FileResponseBody).file.name).toBe('Renamed Song.motivo');

    const download = await agent.get(`/files/${fileId}/download`).expect(200);
    expect(download.headers['content-type']).toMatch(/text\/plain/);
    expect(download.headers['content-disposition']).toContain('Renamed Song.motivo');
    expect(download.text).toBe('tempo 140;');

    await agent.delete(`/files/${fileId}`).expect(204);
    await agent.get(`/files/${fileId}`).expect(404);
  });

  it('rejects duplicate file names per user case-insensitively', async () => {
    const { agent } = await registerAndLogin('duplicates@example.com');

    await agent.post('/files').send({ name: 'Loop.motivo', source: 'tempo 120;' }).expect(201);
    const second = await agent
      .post('/files')
      .send({ name: 'Second.motivo', source: 'tempo 90;' })
      .expect(201);

    const response = await agent
      .post('/files')
      .send({ name: 'loop.motivo', source: 'tempo 90;' })
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: 'FILE_NAME_CONFLICT',
        message: 'file name already exists',
      },
    });

    const rename = await agent
      .patch(`/files/${(second.body as FileResponseBody).file.id}`)
      .send({ name: 'LOOP.motivo' })
      .expect(409);

    expect(rename.body).toEqual({
      error: {
        code: 'FILE_NAME_CONFLICT',
        message: 'file name already exists',
      },
    });
  });

  it('prevents access to files owned by another account', async () => {
    const owner = await registerAndLogin('owner@example.com');
    const other = await registerAndLogin('other@example.com');

    const created = await owner.agent
      .post('/files')
      .send({ name: 'Private.motivo', source: 'tempo 120;' })
      .expect(201);
    const fileId = (created.body as FileResponseBody).file.id;

    await other.agent.get(`/files/${fileId}`).expect(404);
    await other.agent.patch(`/files/${fileId}`).send({ source: 'tempo 60;' }).expect(404);
    await other.agent.delete(`/files/${fileId}`).expect(404);
    await other.agent.get(`/files/${fileId}/download`).expect(404);
  });

  it('lists files by most recently updated first', async () => {
    const { agent } = await registerAndLogin('sorting@example.com');

    const older = await agent
      .post('/files')
      .send({ name: 'Older.motivo', source: 'tempo 120;' })
      .expect(201);
    const newer = await agent
      .post('/files')
      .send({ name: 'Newer.motivo', source: 'tempo 130;' })
      .expect(201);

    await agent
      .patch(`/files/${(older.body as FileResponseBody).file.id}`)
      .send({ source: 'tempo 140;' })
      .expect(200);

    const listed = await agent.get('/files').expect(200);
    expect((listed.body as FileListResponseBody).files.map((file) => file.id)).toEqual([
      (older.body as FileResponseBody).file.id,
      (newer.body as FileResponseBody).file.id,
    ]);
  });

  it('tracks last opened file on the current user', async () => {
    const { agent } = await registerAndLogin('last-opened@example.com');

    const created = await agent
      .post('/files')
      .send({ name: 'Active.motivo', source: 'tempo 120;' })
      .expect(201);
    const fileId = (created.body as FileResponseBody).file.id;

    await agent.get(`/files/${fileId}`).expect(200);

    const me = await agent.get('/auth/me').expect(200);
    expect((me.body as MeResponseBody).user.lastOpenedFileId).toBe(fileId);
  });
});
