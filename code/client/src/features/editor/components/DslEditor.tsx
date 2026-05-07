'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import Editor, { type BeforeMount, type Monaco, type OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

import { DSL_LANGUAGE_ID, registerDslLanguage } from '../monaco/dsl-language';
import { getDslTheme, registerDslThemes } from '../monaco/dsl-themes';
import { createErrorMarker } from '../monaco/markers';
import {
  DEFAULT_DSL_SNIPPET,
  EDITOR_OPTIONS,
  EDITOR_PERSISTENCE_DELAY_MS,
  EDITOR_STORAGE_KEY,
} from '../monaco/monaco-config';

export interface DslEditorHandle {
  jumpTo: (line: number, column: number) => void;
  blur: () => void;
  setError: (line: number, column: number, message: string) => void;
  clearError: () => void;
}

export interface DslEditorProps {
  onChange?: (value: string) => void;
  onCompile?: () => void;
}

const DslEditor = forwardRef<DslEditorHandle, DslEditorProps>(function DslEditor(
  { onChange, onCompile },
  ref,
) {
  const { theme } = useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompileRef = useRef(onCompile);
  onCompileRef.current = onCompile;

  const editorInstanceRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current) {
      monacoRef.current.editor.setTheme(getDslTheme(theme));
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

      monaco.editor.setModelMarkers(model, DSL_LANGUAGE_ID, [
        createErrorMarker(line, column, message, monaco.MarkerSeverity.Error),
      ]);
    },
    clearError() {
      const editor = editorInstanceRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

      const model = editor.getModel();
      if (!model) return;

      monaco.editor.setModelMarkers(model, DSL_LANGUAGE_ID, []);
    },
  }));

  const handleBeforeMount: BeforeMount = useCallback((m) => {
    registerDslLanguage(m);
    registerDslThemes(m);
  }, []);

  const initialValue =
    (typeof window !== 'undefined' && localStorage.getItem(EDITOR_STORAGE_KEY)) ||
    DEFAULT_DSL_SNIPPET;

  const handleChange = useCallback(
    (value: string | undefined) => {
      const v = value ?? '';
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        localStorage.setItem(EDITOR_STORAGE_KEY, v);
      }, EDITOR_PERSISTENCE_DELAY_MS);
      onChange?.(v);
    },
    [onChange],
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleMount: OnMount = useCallback((editor, m) => {
    editorInstanceRef.current = editor;
    monacoRef.current = m;
    onChangeRef.current?.(editor.getValue());

    editor.addAction({
      id: 'dsl.compile',
      label: 'Compile',
      keybindings: [m.KeyMod.CtrlCmd | m.KeyCode.Enter],
      run: () => onCompileRef.current?.(),
    });
  }, []);

  return (
    <Editor
      height="100%"
      defaultLanguage={DSL_LANGUAGE_ID}
      defaultValue={initialValue}
      theme={getDslTheme(theme)}
      beforeMount={handleBeforeMount}
      onChange={handleChange}
      onMount={handleMount}
      options={EDITOR_OPTIONS}
    />
  );
});

export default DslEditor;
