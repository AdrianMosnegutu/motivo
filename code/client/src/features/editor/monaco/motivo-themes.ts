import type { Monaco } from '@monaco-editor/react';

export const MOTIVO_DARK_THEME = 'motivo-dark';

/** Syntax colors aligned with the Motivo Studio dark IDE palette. */
export const MOTIVO_SYNTAX_COLORS = {
  keyword: '#c084fc',
  typeKeyword: '#67e8f9',
  voiceKeyword: '#c084fc',
  restKeyword: '#38bdf8',
  noteLiteral: '#a6e3a1',
  number: '#fb923c',
  instrument: '#38bdf8',
  boolean: '#4ade80',
  string: '#86efac',
  comment: '#64748b',
  operator: '#38bdf8',
  identifier: '#ffffff',
  delimiter: '#94a3b8',
} as const;

export function registerMotivoThemes(monaco: Monaco) {
  monaco.editor.defineTheme(MOTIVO_DARK_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: MOTIVO_SYNTAX_COLORS.keyword, fontStyle: 'bold' },
      {
        token: 'type-keyword',
        foreground: MOTIVO_SYNTAX_COLORS.typeKeyword,
        fontStyle: 'bold',
      },
      { token: 'voice-keyword', foreground: MOTIVO_SYNTAX_COLORS.voiceKeyword, fontStyle: 'bold' },
      { token: 'rest-keyword', foreground: MOTIVO_SYNTAX_COLORS.restKeyword },
      { token: 'note-literal', foreground: MOTIVO_SYNTAX_COLORS.noteLiteral },
      { token: 'number', foreground: MOTIVO_SYNTAX_COLORS.number },
      { token: 'instrument', foreground: MOTIVO_SYNTAX_COLORS.instrument },
      { token: 'drum-note', foreground: MOTIVO_SYNTAX_COLORS.noteLiteral },
      { token: 'boolean-literal', foreground: MOTIVO_SYNTAX_COLORS.boolean },
      { token: 'string', foreground: MOTIVO_SYNTAX_COLORS.string },
      { token: 'comment', foreground: MOTIVO_SYNTAX_COLORS.comment, fontStyle: 'italic' },
      { token: 'operator', foreground: MOTIVO_SYNTAX_COLORS.operator },
      { token: 'identifier', foreground: MOTIVO_SYNTAX_COLORS.identifier },
      { token: 'delimiter', foreground: MOTIVO_SYNTAX_COLORS.delimiter },
    ],
    colors: {
      'editor.background': '#0b0e14',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#ffffff',
      'editor.selectionBackground': '#1e2532',
      'editor.lineHighlightBackground': '#1e2532',
      'editorGutter.background': '#151921',
    },
  });
}
