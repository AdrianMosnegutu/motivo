import { describe, expect, it } from 'vitest';

import { findFirstErrorDiagnostic, groupDiagnosticsByType } from '@/features/compile/diagnostics';
import type { Diagnostic } from '@/features/compile/types';

const diagnostics: Diagnostic[] = [
  { severity: 'warning', type: 'syntax', message: 'first warning' },
  {
    severity: 'error',
    type: 'semantic',
    message: 'missing note',
    line: 4,
    column: 7,
  },
  { severity: 'error', type: 'semantic', message: 'later error' },
];

describe('diagnostics helpers', () => {
  it('groups diagnostics by type', () => {
    expect(groupDiagnosticsByType(diagnostics)).toEqual({
      syntax: [diagnostics[0]],
      semantic: [diagnostics[1], diagnostics[2]],
    });
  });

  it('finds the first jumpable error', () => {
    expect(findFirstErrorDiagnostic(diagnostics)).toBe(diagnostics[1]);
  });
});
