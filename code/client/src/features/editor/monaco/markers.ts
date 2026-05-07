export function createErrorMarker(line: number, column: number, message: string, severity: number) {
  return {
    startLineNumber: line,
    startColumn: column,
    endLineNumber: line,
    endColumn: column + 1,
    message,
    severity,
  };
}
