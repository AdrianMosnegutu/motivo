export type DiagnosticType = 'lexical' | 'syntax' | 'semantic' | 'lowering' | 'output' | 'internal';

export type DiagnosticSeverity = 'error' | 'warning' | 'note';

export type Diagnostic = {
  type: DiagnosticType;
  severity: DiagnosticSeverity;
  message: string;
  line?: number;
  column?: number;
};

export type CompileSuccess = {
  kind: 'success';
  midi: Buffer;
};
export type CompileDiagnostics = {
  kind: 'diagnostics';
  diagnostics: Diagnostic[];
};
export type CompilerInfrastructureErrorCode =
  | 'COMPILER_BINARY_NOT_FOUND'
  | 'COMPILER_EXECUTION_FAILED'
  | 'COMPILER_OUTPUT_MISSING'
  | 'COMPILER_IO_ERROR';
export type CompilerInfrastructureError = {
  kind: 'infrastructure_error';
  code: CompilerInfrastructureErrorCode;
  message: string;
};
export type CompileResult = CompileSuccess | CompileDiagnostics | CompilerInfrastructureError;
