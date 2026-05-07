import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { type CompileService, createCompileController } from '@/controllers/compile.controller';
import { asyncHandler } from '@/middleware/async-handler';
import { errorHandler } from '@/middleware/errors';

import { binaryParser } from '@tests/helpers/binary-parser';

function createControllerApp(compileService: CompileService) {
  const app = express();
  app.use(express.json());
  app.post('/compile', asyncHandler(createCompileController(compileService)));
  app.use(errorHandler);
  return app;
}

describe('compileController', () => {
  it('maps successful compilation to an audio/midi response', async () => {
    const compileService: CompileService = () =>
      Promise.resolve({
        kind: 'success',
        midi: Buffer.from([0x4d, 0x54, 0x68, 0x64]),
      });

    const response = await request(createControllerApp(compileService))
      .post('/compile')
      .send({ source: 'track main {}' })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/audio\/midi/);
    expect(response.body).toEqual(Buffer.from([0x4d, 0x54, 0x68, 0x64]));
  });

  it('maps compiler diagnostics to the compile-only error shape', async () => {
    const compileService: CompileService = () =>
      Promise.resolve({
        kind: 'diagnostics',
        diagnostics: [
          {
            severity: 'error',
            type: 'semantic',
            message: 'unknown identifier',
            line: 3,
            column: 5,
          },
        ],
      });

    const response = await request(createControllerApp(compileService))
      .post('/compile')
      .send({ source: 'bad' })
      .expect(400);

    expect(response.body).toEqual({
      kind: 'error',
      diagnostics: [
        {
          severity: 'error',
          type: 'semantic',
          message: 'unknown identifier',
          line: 3,
          column: 5,
        },
      ],
    });
  });

  it('maps compiler infrastructure failures to the standard error shape', async () => {
    const compileService: CompileService = () =>
      Promise.resolve({
        kind: 'infrastructure_error',
        code: 'COMPILER_OUTPUT_MISSING',
        message: 'output file not generated',
      });

    const response = await request(createControllerApp(compileService))
      .post('/compile')
      .send({ source: 'track main {}' })
      .expect(500);

    expect(response.body).toEqual({
      error: {
        code: 'COMPILER_OUTPUT_MISSING',
        message: 'output file not generated',
      },
    });
  });
});
