'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { findFirstErrorDiagnostic } from '@/features/compile/diagnostics';
import type { LogEntry } from '@/features/compile/types';
import { useCompileMutation } from '@/features/compile/useCompileMutation';
import type { MotivoEditorHandle } from '@/features/editor/components/MotivoEditor';
import { useMidi } from '@/features/midi/MidiContext';

export function useIdeCompile(editorRef: RefObject<MotivoEditorHandle | null>, source = '') {
  const { setMidiBytes } = useMidi();
  const { compile, compiling } = useCompileMutation();
  const [log, setLog] = useState<LogEntry | null>(null);
  const sourceRef = useRef(source);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  const handleEditorChange = useCallback((value: string) => {
    sourceRef.current = value;
  }, []);

  const handleCompile = useCallback(async () => {
    const currentSource = editorRef.current?.getValue() ?? sourceRef.current;
    const result = await compile(currentSource);
    if (!result) return;

    setLog(null);
    setMidiBytes(null);
    editorRef.current?.clearError();

    if (result.kind === 'success') {
      setMidiBytes(result.midiBytes);
      setLog({ kind: 'success', timestamp: new Date() });
      editorRef.current?.blur();
      return;
    }

    setLog({
      kind: 'error',
      diagnostics: result.diagnostics,
      timestamp: new Date(),
    });

    const firstError = findFirstErrorDiagnostic(result.diagnostics);
    if (firstError) {
      editorRef.current?.setError(firstError.line, firstError.column, firstError.message);
      editorRef.current?.jumpTo(firstError.line, firstError.column);
    }
  }, [compile, editorRef, setMidiBytes]);

  const handleJumpToError = useCallback(
    (line: number, column: number) => {
      editorRef.current?.jumpTo(line, column);
    },
    [editorRef],
  );

  return {
    compiling,
    log,
    setLog,
    handleCompile,
    handleEditorChange,
    handleJumpToError,
  };
}
