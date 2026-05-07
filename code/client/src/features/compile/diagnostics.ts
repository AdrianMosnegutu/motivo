import type { Diagnostic } from './types';

export const NETWORK_ERROR_DIAGNOSTIC: Diagnostic = {
  severity: 'error',
  type: 'internal',
  message: 'Network error: could not reach backend',
};

export function groupDiagnosticsByType(diagnostics: Diagnostic[]) {
  return diagnostics.reduce<Record<string, Diagnostic[]>>((groups, diagnostic) => {
    const type = diagnostic.type;
    groups[type] ??= [];
    groups[type].push(diagnostic);
    return groups;
  }, {});
}

export function findFirstErrorDiagnostic(
  diagnostics: Diagnostic[],
): (Diagnostic & { line: number; column: number }) | undefined {
  return diagnostics.find(
    (diagnostic) =>
      diagnostic.severity === 'error' && diagnostic.line != null && diagnostic.column != null,
  ) as (Diagnostic & { line: number; column: number }) | undefined;
}

export function createInternalDiagnostic(message: string): Diagnostic {
  return {
    severity: 'error',
    type: 'internal',
    message,
  };
}
