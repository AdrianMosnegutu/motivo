import { type IncomingHttpHeaders } from 'node:http';

import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/app';

import { useTestDatabase } from '@tests/helpers/database';

useTestDatabase();

type AuthUserResponse = {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly lastOpenedFileId: string | null;
  };
};

function getSetCookieHeader(headers: IncomingHttpHeaders) {
  const value = headers['set-cookie'];
  return Array.isArray(value) ? value.join(';') : (value ?? '');
}

describe('auth API contract', () => {
  it('registers a user and starts a session', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/auth/register')
      .send({ email: 'Ada@Example.com', password: 'correct horse battery staple' })
      .expect(201);

    const body = response.body as AuthUserResponse;

    expect(typeof body.user.id).toBe('string');
    expect(body.user.email).toBe('ada@example.com');
    expect(typeof body.user.createdAt).toBe('string');
    expect(typeof body.user.updatedAt).toBe('string');
    expect(body.user.lastOpenedFileId).toBeNull();
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(getSetCookieHeader(response.headers)).toContain('motivo_session=');

    const me = await agent.get('/auth/me').expect(200);
    expect((me.body as AuthUserResponse).user.email).toBe('ada@example.com');
  });

  it('rejects duplicate registrations case-insensitively', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'grace@example.com', password: 'correct horse battery staple' })
      .expect(201);

    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'GRACE@example.com', password: 'correct horse battery staple' })
      .expect(409);

    expect(response.body).toMatchObject({
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'email already registered',
      },
    });
  });

  it('logs in and logs out with an HTTP-only cookie session', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'login@example.com', password: 'correct horse battery staple' })
      .expect(201);

    const agent = request.agent(app);
    const login = await agent
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'correct horse battery staple' })
      .expect(200);

    expect(getSetCookieHeader(login.headers)).toContain('HttpOnly');
    expect((login.body as AuthUserResponse).user.email).toBe('login@example.com');

    await agent.post('/auth/logout').expect(204);

    const me = await agent.get('/auth/me').expect(200);
    expect(me.body).toEqual({ user: null });
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'missing@example.com', password: 'wrong password' })
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'invalid email or password',
      },
    });
  });

  it('returns null current user when unauthenticated', async () => {
    const response = await request(app).get('/auth/me').expect(200);
    expect(response.body).toEqual({ user: null });
  });
});
