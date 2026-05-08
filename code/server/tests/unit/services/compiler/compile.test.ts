import type * as FsPromises from 'fs/promises';
import { chmod, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { compile } from '@/services/compiler';

const tempDirs: string[] = [];

async function createFakeCompiler(source: string, mode = 0o755) {
  const directory = await mkdtemp(join(tmpdir(), 'motivo-compiler-service-test-'));
  tempDirs.push(directory);
  const binary = join(directory, 'motivoc');
  await writeFile(binary, source, 'utf8');
  await chmod(binary, mode);
  return binary;
}

afterEach(async () => {
  delete process.env.COMPILER_BIN;
  vi.doUnmock('fs/promises');
  vi.resetModules();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('compile', () => {
  it('returns success when the compiler writes MIDI output', async () => {
    process.env.COMPILER_BIN = await createFakeCompiler(`#!/usr/bin/env node
const { writeFileSync } = require("fs");
const sourcePath = process.argv[2];
const outPath = sourcePath.replace(/\\.motivo$/, ".mid");
writeFileSync(outPath, Buffer.from([0x4d, 0x54, 0x68, 0x64]));
`);

    const result = await compile('track main {}');

    expect(result).toEqual({
      kind: 'success',
      midi: Buffer.from([0x4d, 0x54, 0x68, 0x64]),
    });
  });

  it('returns compiler diagnostics for normal compiler failures', async () => {
    process.env.COMPILER_BIN = await createFakeCompiler(`#!/usr/bin/env node
const sourcePath = process.argv[2];
console.error(\`\${sourcePath}: error: semantic: 4:2: bad track\`);
process.exit(1);
`);

    const result = await compile('bad');

    expect(result).toEqual({
      kind: 'diagnostics',
      diagnostics: [
        {
          severity: 'error',
          type: 'semantic',
          message: 'bad track',
          line: 4,
          column: 2,
        },
      ],
    });
  });

  it('returns an infrastructure error when the compiler binary is missing', async () => {
    process.env.COMPILER_BIN = join(tmpdir(), 'missing-motivoc');

    await expect(compile('track main {}')).resolves.toEqual({
      kind: 'infrastructure_error',
      code: 'COMPILER_BINARY_NOT_FOUND',
      message: 'compiler binary not found',
    });
  });

  it('returns an infrastructure error when the compiler cannot be executed', async () => {
    process.env.COMPILER_BIN = await createFakeCompiler('#!/usr/bin/env node\n', 0o644);

    await expect(compile('track main {}')).resolves.toEqual({
      kind: 'infrastructure_error',
      code: 'COMPILER_EXECUTION_FAILED',
      message: 'compiler process failed to start',
    });
  });

  it('returns an infrastructure error when the compiler does not write output', async () => {
    process.env.COMPILER_BIN = await createFakeCompiler(`#!/usr/bin/env node
process.exit(0);
`);

    await expect(compile('track main {}')).resolves.toEqual({
      kind: 'infrastructure_error',
      code: 'COMPILER_OUTPUT_MISSING',
      message: 'output file not generated',
    });
  });

  it('returns an infrastructure error when compiler IO cannot be processed', async () => {
    vi.resetModules();
    vi.doMock('fs/promises', async (importOriginal) => {
      const actual = await importOriginal<typeof FsPromises>();

      return {
        ...actual,
        writeFile: vi.fn().mockRejectedValue(new Error('write failed')),
      };
    });

    const { compile: compileWithWriteFailure } = await import('@/services/compiler');

    await expect(compileWithWriteFailure('track main {}')).resolves.toEqual({
      kind: 'infrastructure_error',
      code: 'COMPILER_IO_ERROR',
      message: 'compiler input or output could not be processed',
    });
  });
});
