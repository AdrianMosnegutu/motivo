import type { Monaco } from '@monaco-editor/react';

export const DSL_DARK_THEME = 'dsl-dark';
export const DSL_LIGHT_THEME = 'dsl-light';

export function getDslTheme(theme: string | undefined) {
  return theme === 'dark' ? DSL_DARK_THEME : DSL_LIGHT_THEME;
}

export function registerDslThemes(monaco: Monaco) {
  monaco.editor.defineTheme(DSL_DARK_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'c792ea', fontStyle: 'bold' },
      { token: 'note-literal', foreground: 'f78c6c' },
      { token: 'instrument', foreground: '89ddff' },
      { token: 'drum-note', foreground: '89ddff' },
      { token: 'boolean-literal', foreground: 'ff5370' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'comment', foreground: '94a2a8', fontStyle: 'italic' },
      { token: 'operator', foreground: '89ddff' },
      { token: 'identifier', foreground: 'eeffff' },
    ],
    colors: {
      'editor.background': '#0d0d0f',
      'editor.foreground': '#eeffff',
      'editorLineNumber.foreground': '#8a8a8a',
      'editorLineNumber.activeForeground': '#ffffff',
      'editor.selectionBackground': '#1a2a3a',
      'editor.lineHighlightBackground': '#12121a',
    },
  });

  monaco.editor.defineTheme(DSL_LIGHT_THEME, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'note-literal', foreground: 'ea580c' },
      { token: 'instrument', foreground: '0891b2' },
      { token: 'drum-note', foreground: '0891b2' },
      { token: 'boolean-literal', foreground: 'dc2626' },
      { token: 'string', foreground: '16a34a' },
      { token: 'number', foreground: 'ea580c' },
      { token: 'comment', foreground: '52525b', fontStyle: 'italic' },
      { token: 'operator', foreground: '0891b2' },
      { token: 'identifier', foreground: '#09090b' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#09090b',
      'editorLineNumber.foreground': '#71717a',
      'editorLineNumber.activeForeground': '#18181b',
      'editor.selectionBackground': '#e4e4e7',
      'editor.lineHighlightBackground': '#f4f4f5',
    },
  });
}
