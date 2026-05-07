import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { errorHandler } from '@/middleware/errors';
import { validate } from '@/middleware/validate';
import { compileSourceSchema } from '@/schemas/compile.schema';

type StandardErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function createValidationApp() {
  const app = express();
  app.use(express.json());
  app.post('/compile', validate(compileSourceSchema), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('validate', () => {
  it('returns the standard error shape for missing source', async () => {
    const response = await request(createValidationApp()).post('/compile').send({}).expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'request validation failed',
      },
    });
    expect((response.body as StandardErrorResponse).error).not.toHaveProperty('diagnostics');
  });

  it('returns the standard error shape for blank source', async () => {
    const response = await request(createValidationApp())
      .post('/compile')
      .send({ source: '   ' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: {
          issues: [
            {
              path: 'body.source',
              message: 'source is required',
            },
          ],
        },
      },
    });
  });
});
