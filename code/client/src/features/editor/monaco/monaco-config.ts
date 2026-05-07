import type { EditorProps } from '@monaco-editor/react';

export const EDITOR_STORAGE_KEY = 'dsl-editor-content';

export const DEFAULT_DSL_SNIPPET = `tempo 120;
signature 4/4;
key C major;

track {

}
`;

export const EDITOR_OPTIONS: EditorProps['options'] = {
  fontSize: 14,
  fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  padding: { top: 16, bottom: 16 },
  overviewRulerLanes: 0,
};

export const EDITOR_PERSISTENCE_DELAY_MS = 300;
