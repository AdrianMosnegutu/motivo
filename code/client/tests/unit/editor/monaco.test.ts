import { describe, expect, it, vi } from 'vitest';

import {
  DSL_LANGUAGE_ID,
  DSL_LANGUAGE_KEYWORDS,
  registerDslLanguage,
} from '@/features/editor/monaco/dsl-language';
import {
  DSL_DARK_THEME,
  DSL_LIGHT_THEME,
  getDslTheme,
  registerDslThemes,
} from '@/features/editor/monaco/dsl-themes';
import { createErrorMarker } from '@/features/editor/monaco/markers';
import {
  DEFAULT_DSL_SNIPPET,
  EDITOR_OPTIONS,
  EDITOR_STORAGE_KEY,
} from '@/features/editor/monaco/monaco-config';

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

describe('Monaco DSL configuration', () => {
  it('registers the DSL language and tokenizer', () => {
    const monaco = createMonacoMock();

    registerDslLanguage(monaco as never);

    expect(monaco.languages.register).toHaveBeenCalledWith({ id: DSL_LANGUAGE_ID });
    expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
      DSL_LANGUAGE_ID,
      expect.objectContaining({
        keywords: [...DSL_LANGUAGE_KEYWORDS],
        tokenizer: expect.objectContaining({
          root: expect.any(Array),
        }),
      }),
    );
  });

  it('registers light and dark DSL themes', () => {
    const monaco = createMonacoMock();

    registerDslThemes(monaco as never);

    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      DSL_DARK_THEME,
      expect.objectContaining({ base: 'vs-dark' }),
    );
    expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
      DSL_LIGHT_THEME,
      expect.objectContaining({ base: 'vs' }),
    );
  });

  it('resolves theme names from the active app theme', () => {
    expect(getDslTheme('dark')).toBe(DSL_DARK_THEME);
    expect(getDslTheme('light')).toBe(DSL_LIGHT_THEME);
    expect(getDslTheme(undefined)).toBe(DSL_LIGHT_THEME);
  });

  it('exports stable editor defaults', () => {
    expect(EDITOR_STORAGE_KEY).toBe('dsl-editor-content');
    expect(DEFAULT_DSL_SNIPPET).toContain('tempo 120');
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
