import request from 'supertest';

import app from '@/app';

type AuthUser = {
  readonly id: string;
  readonly email: string;
};

export async function registerAndLogin(
  email = `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
) {
  const agent = request.agent(app);
  const password = 'correct horse battery staple';

  const response = await agent.post('/auth/register').send({ email, password }).expect(201);

  return {
    agent,
    user: (response.body as { user: AuthUser }).user,
    email,
    password,
  };
}
