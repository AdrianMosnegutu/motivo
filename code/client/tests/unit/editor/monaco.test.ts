import { describe, expect, it, vi } from 'vitest';

import { createErrorMarker } from '@/features/editor/monaco/markers';
import { DEFAULT_MOTIVO_SNIPPET, EDITOR_OPTIONS } from '@/features/editor/monaco/monaco-config';
import {
  MOTIVO_LANGUAGE_ID,
  MOTIVO_LANGUAGE_KEYWORDS,
  registerMotivoLanguage,
} from '@/features/editor/monaco/motivo-language';
import {
  MOTIVO_DARK_THEME,
  MOTIVO_SYNTAX_COLORS,
  registerMotivoThemes,
} from '@/features/editor/monaco/motivo-themes';

function createMonacoMock() {
  return {
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
      registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
      CompletionItemKind: {
        Keyword: 17,
        Snippet: 27,
        EnumMember: 13,
        Value: 12,
        Constant: 21,
      },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    },
    editor: {
      defineTheme: vi.fn(),
    },
  };
}

describe('Monaco Motivo configuration', () => {
  it('registers the Motivo language and tokenizer', () => {
    const monaco = createMonacoMock();

    registerMotivoLanguage(monaco as never);

    expect(monaco.languages.register).toHaveBeenCalledWith({ id: MOTIVO_LANGUAGE_ID });
    expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
      MOTIVO_LANGUAGE_ID,
      expect.objectContaining({
        keywords: [...MOTIVO_LANGUAGE_KEYWORDS],
        tokenizer: expect.objectContaining({
          root: expect.any(Array),
        }),
      }),
    );
    expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      MOTIVO_LANGUAGE_ID,
      expect.objectContaining({
        triggerCharacters: expect.arrayContaining([' ']),
        provideCompletionItems: expect.any(Function),
      }),
    );
  });

  it('registers the dark Motivo theme with distinct syntax colors', () => {
    const monaco = createMonacoMock();

    registerMotivoThemes(monaco as never);

    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      MOTIVO_DARK_THEME,
      expect.objectContaining({
        base: 'vs-dark',
        rules: expect.arrayContaining([
          expect.objectContaining({
            token: 'note-literal',
            foreground: MOTIVO_SYNTAX_COLORS.noteLiteral,
          }),
          expect.objectContaining({ token: 'number', foreground: MOTIVO_SYNTAX_COLORS.number }),
          expect.objectContaining({
            token: 'voice-keyword',
            foreground: MOTIVO_SYNTAX_COLORS.voiceKeyword,
          }),
          expect.objectContaining({
            token: 'rest-keyword',
            foreground: MOTIVO_SYNTAX_COLORS.restKeyword,
          }),
          expect.objectContaining({
            token: 'identifier',
            foreground: MOTIVO_SYNTAX_COLORS.identifier,
          }),
        ]),
      }),
    );
  });

  it('exports stable editor defaults', () => {
    expect(DEFAULT_MOTIVO_SNIPPET).toContain('tempo 120');
    expect(EDITOR_OPTIONS).toMatchObject({
      fontSize: 13,
      minimap: { enabled: false },
      quickSuggestions: { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
    });
  });

  it('creates Monaco error markers from diagnostics', () => {
    expect(createErrorMarker(3, 5, 'bad note', 8)).toEqual({
      startLineNumber: 3,
      startColumn: 5,
      endLineNumber: 3,
      endColumn: 6,
      message: 'bad note',
      severity: 8,
    });
  });
});
