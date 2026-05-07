import {
  type CompileDiagnostics,
  type Diagnostic,
  type DiagnosticSeverity,
  type DiagnosticType,
} from '@/services/compiler/types';

const ANSI_RE = new RegExp(String.raw`\x1B\[[0-9;]*m`, 'g');
const DIAGNOSTIC_RE =
  /:\s+(error|warning|note):\s+(lexical|syntax|parse|parsing|semantic|lowering|output):\s+(?:(.+?):\s+)?(.+)$/i;

function normalizeDiagnosticType(type: string): DiagnosticType {
  const normalized = type.toLowerCase();
  return normalized === 'parse' || normalized === 'parsing'
    ? 'syntax'
    : (normalized as DiagnosticType);
}

export function parseCompilerDiagnostics(raw: string): CompileDiagnostics {
  const text = raw.replace(ANSI_RE, '').trim();
  const diagnostics: Diagnostic[] = [];

  for (const line of text.split('\n')) {
    const match = line.match(DIAGNOSTIC_RE);

    if (match) {
      const [, severity, type, locStr, message] = match;
      let lineNum: number | undefined;
      let colNum: number | undefined;

      if (locStr) {
        const startMatch = locStr.match(/(\d+):(\d+)/);
        if (startMatch) {
          lineNum = parseInt(startMatch[1], 10);
          colNum = parseInt(startMatch[2], 10);
        }
      }

      diagnostics.push({
        severity: severity.toLowerCase() as DiagnosticSeverity,
        type: normalizeDiagnosticType(type),
        message: message.trim(),
        line: lineNum,
        column: colNum,
      });
    } else if (line.trim()) {
      diagnostics.push({
        severity: 'error',
        type: 'internal',
        message: line.trim(),
      });
    }
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      severity: 'error',
      type: 'internal',
      message: text || 'unknown error',
    });
  }

  return { kind: 'diagnostics', diagnostics };
}
