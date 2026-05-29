'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import Editor, { type BeforeMount, type Monaco, type OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

import { createErrorMarker } from '../monaco/markers';
import { DEFAULT_MOTIVO_SNIPPET, EDITOR_OPTIONS } from '../monaco/monaco-config';
import { MOTIVO_LANGUAGE_ID, registerMotivoLanguage } from '../monaco/motivo-language';
import { getMotivoTheme, registerMotivoThemes } from '../monaco/motivo-themes';

export interface MotivoEditorHandle {
  jumpTo: (line: number, column: number) => void;
  blur: () => void;
  setError: (line: number, column: number, message: string) => void;
  clearError: () => void;
}

export interface MotivoEditorProps {
  documentId?: string;
  onChange?: (value: string) => void;
  onCompile?: () => void;
  readOnly?: boolean;
  value?: string;
}

const MotivoEditor = forwardRef<MotivoEditorHandle, MotivoEditorProps>(function MotivoEditor(
  { documentId = 'scratch', onChange, onCompile, readOnly = false, value },
  ref,
) {
  const { theme } = useTheme();
  const onCompileRef = useRef(onCompile);
  onCompileRef.current = onCompile;

  const editorInstanceRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current) {
      monacoRef.current.editor.setTheme(getMotivoTheme(theme));
    }
  }, [theme]);

  useImperativeHandle(ref, () => ({
    jumpTo(line: number, column: number) {
      const editor = editorInstanceRef.current;
      if (!editor) return;
      const pos = { lineNumber: line, column: column };
      editor.setPosition(pos);
      editor.revealPositionInCenter(pos);
      editor.focus();
    },
    blur() {
      const editor = editorInstanceRef.current;
      if (!editor) return;
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    setError(line: number, column: number, message: string) {
      const editor = editorInstanceRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

      const model = editor.getModel();
      if (!model) return;

      monaco.editor.setModelMarkers(model, MOTIVO_LANGUAGE_ID, [
        createErrorMarker(line, column, message, monaco.MarkerSeverity.Error),
      ]);
    },
    clearError() {
      const editor = editorInstanceRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

      const model = editor.getModel();
      if (!model) return;

      monaco.editor.setModelMarkers(model, MOTIVO_LANGUAGE_ID, []);
    },
  }));

  const handleBeforeMount: BeforeMount = useCallback((m) => {
    registerMotivoLanguage(m);
    registerMotivoThemes(m);
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (readOnly) return;
      const v = value ?? '';
      onChange?.(v);
    },
    [onChange, readOnly],
  );

  const handleMount: OnMount = useCallback((editor, m) => {
    editorInstanceRef.current = editor;
    monacoRef.current = m;

    editor.addAction({
      id: 'motivo.compile',
      label: 'Compile',
      keybindings: [m.KeyMod.CtrlCmd | m.KeyCode.Enter],
      run: () => onCompileRef.current?.(),
    });
  }, []);

  return (
    <Editor
      height="100%"
      defaultLanguage={MOTIVO_LANGUAGE_ID}
      path={documentId}
      value={value ?? DEFAULT_MOTIVO_SNIPPET}
      theme={getMotivoTheme(theme)}
      beforeMount={handleBeforeMount}
      onChange={handleChange}
      onMount={handleMount}
      options={{ ...EDITOR_OPTIONS, readOnly }}
    />
  );
});

export default MotivoEditor;
