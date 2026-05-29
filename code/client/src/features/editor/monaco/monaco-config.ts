import type { EditorProps } from '@monaco-editor/react';

export const DEFAULT_MOTIVO_SNIPPET = `tempo 120;
signature 4/4;

track hello_world {
    play [A3, B3, C4, C#4, D4];
}
`;

export const EDITOR_OPTIONS: EditorProps['options'] = {
  fontSize: 13,
  fontFamily: 'var(--font-fira-code), ui-monospace, monospace',
  lineHeight: 22,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  padding: { top: 16, bottom: 16 },
  overviewRulerLanes: 0,
  quickSuggestions: { other: true, comments: false, strings: false },
  suggestOnTriggerCharacters: true,
  tabCompletion: 'on',
  wordBasedSuggestions: 'off',
};
