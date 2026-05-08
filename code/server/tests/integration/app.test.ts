import { chmod, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import app from '@/app';

import { binaryParser } from '@tests/helpers/binary-parser';

const midiBytes = Buffer.from([0x4d, 0x54, 0x68, 0x64]);
const tempDirs: string[] = [];

type StandardErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

async function createFakeCompiler(source: string) {
  const directory = await mkdtemp(join(tmpdir(), 'motivo-server-test-'));
  tempDirs.push(directory);
  const binary = join(directory, 'motivoc');
  await writeFile(binary, source, 'utf8');
  await chmod(binary, 0o755);
  return binary;
}

afterEach(async () => {
  delete process.env.COMPILER_BIN;
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('app', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  it('rejects invalid compile payloads with the standard error shape', async () => {
    const response = await request(app).post('/compile').send({}).expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'request validation failed',
      },
    });
    expect((response.body as StandardErrorResponse).error).not.toHaveProperty('diagnostics');
  });

  it('returns MIDI bytes when the compiler writes output', async () => {
    process.env.COMPILER_BIN = await createFakeCompiler(`#!/usr/bin/env node
const { writeFileSync } = require("fs");
const sourcePath = process.argv[2];
const outPath = sourcePath.replace(/\\.motivo$/, ".mid");
writeFileSync(outPath, Buffer.from([0x4d, 0x54, 0x68, 0x64]));
`);

    const response = await request(app)
      .post('/compile')
      .send({ source: 'track main {}' })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/audio\/midi/);
    expect(response.body).toEqual(midiBytes);
  });

  it('returns compile-only diagnostics when the compiler reports Motivo errors', async () => {
    process.env.COMPILER_BIN = await createFakeCompiler(`#!/usr/bin/env node
const sourcePath = process.argv[2];
console.error(\`\${sourcePath}: error: semantic: 3:5: unknown identifier\`);
process.exit(1);
`);

    const response = await request(app).post('/compile').send({ source: 'bad' }).expect(400);

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

  it('returns a standard server error when the compiler binary is missing', async () => {
    process.env.COMPILER_BIN = join(tmpdir(), 'missing-motivoc');

    const response = await request(app)
      .post('/compile')
      .send({ source: 'track main {}' })
      .expect(500);

    expect(response.body).toEqual({
      error: {
        code: 'COMPILER_BINARY_NOT_FOUND',
        message: 'compiler binary not found',
      },
    });
  });
});
