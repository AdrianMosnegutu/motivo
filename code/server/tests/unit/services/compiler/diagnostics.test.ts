import { describe, expect, it } from 'vitest';

import { parseCompilerDiagnostics } from '@/services/compiler/diagnostics';

describe('parseCompilerDiagnostics', () => {
  it('strips ANSI codes and normalizes parse diagnostics to syntax', () => {
    const result = parseCompilerDiagnostics(
      '\u001B[31m/tmp/input.dsl: error: parse: 2:4: expected note\u001B[0m',
    );

    expect(result).toEqual({
      kind: 'diagnostics',
      diagnostics: [
        {
          severity: 'error',
          type: 'syntax',
          message: 'expected note',
          line: 2,
          column: 4,
        },
      ],
    });
  });

  it('parses warnings and notes with source locations', () => {
    const result = parseCompilerDiagnostics(
      [
        '/tmp/input.dsl: warning: semantic: 5:7: unused pattern',
        '/tmp/input.dsl: note: output: 8:1: generated fallback track',
      ].join('\n'),
    );

    expect(result.diagnostics).toEqual([
      {
        severity: 'warning',
        type: 'semantic',
        message: 'unused pattern',
        line: 5,
        column: 7,
      },
      {
        severity: 'note',
        type: 'output',
        message: 'generated fallback track',
        line: 8,
        column: 1,
      },
    ]);
  });

  it('falls back to internal diagnostics for unformatted stderr', () => {
    const result = parseCompilerDiagnostics('compiler crashed unexpectedly');

    expect(result.diagnostics).toEqual([
      {
        severity: 'error',
        type: 'internal',
        message: 'compiler crashed unexpectedly',
      },
    ]);
  });

  it('returns an unknown error diagnostic when stderr is empty', () => {
    const result = parseCompilerDiagnostics('');

    expect(result.diagnostics).toEqual([
      {
        severity: 'error',
        type: 'internal',
        message: 'unknown error',
      },
    ]);
  });
});
