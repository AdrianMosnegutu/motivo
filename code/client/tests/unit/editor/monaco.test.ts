import { describe, expect, it, vi } from 'vitest';

import { createErrorMarker } from '@/features/editor/monaco/markers';
import { DEFAULT_MOTIVO_SNIPPET, EDITOR_OPTIONS } from '@/features/editor/monaco/monaco-config';
import {
  MOTIVO_LANGUAGE_ID,
  MOTIVO_LANGUAGE_KEYWORDS,
  registerMotivoLanguage,
} from '@/features/editor/monaco/motivo-language';
import {
  getMotivoTheme,
  MOTIVO_DARK_THEME,
  MOTIVO_LIGHT_THEME,
  registerMotivoThemes,
} from '@/features/editor/monaco/motivo-themes';

function createMonacoMock() {
  return {
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
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
  });

  it('registers light and dark Motivo themes', () => {
    const monaco = createMonacoMock();

    registerMotivoThemes(monaco as never);

    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      MOTIVO_DARK_THEME,
      expect.objectContaining({ base: 'vs-dark' }),
    );
    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      MOTIVO_LIGHT_THEME,
      expect.objectContaining({ base: 'vs' }),
    );
  });

  it('resolves theme names from the active app theme', () => {
    expect(getMotivoTheme('dark')).toBe(MOTIVO_DARK_THEME);
    expect(getMotivoTheme('light')).toBe(MOTIVO_LIGHT_THEME);
    expect(getMotivoTheme(undefined)).toBe(MOTIVO_LIGHT_THEME);
  });

  it('exports stable editor defaults', () => {
    expect(DEFAULT_MOTIVO_SNIPPET).toContain('tempo 120');
    expect(EDITOR_OPTIONS).toMatchObject({
      fontSize: 14,
      minimap: { enabled: false },
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
