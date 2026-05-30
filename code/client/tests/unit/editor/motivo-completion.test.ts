import { describe, expect, it } from 'vitest';

import {
  buildMotivoCompletionItems,
  detectCompletionContext,
} from '@/features/editor/monaco/motivo-completion';
import { MOTIVO_TYPE_KEYWORDS } from '@/features/editor/monaco/motivo-keywords';

describe('detectCompletionContext', () => {
  it('suggests instruments after using', () => {
    expect(detectCompletionContext('track t using ')).toBe('instruments');
    expect(detectCompletionContext('track t using pi')).toBe('instruments');
  });

  it('suggests playables after play or inside chords', () => {
    expect(detectCompletionContext('    play ')).toBe('playables');
    expect(detectCompletionContext('    play [A4, ')).toBe('playables');
    expect(detectCompletionContext('    play kick')).toBe('playables');
  });

  it('suggests statements after block openings or blank indented lines', () => {
    expect(detectCompletionContext('track t {')).toBe('statements');
    expect(detectCompletionContext('    play A4;')).toBe('statements');
    expect(detectCompletionContext('    ')).toBe('statements');
  });

  it('suggests types in for-init and pattern parameter lists', () => {
    expect(detectCompletionContext('for (')).toBe('types');
    expect(detectCompletionContext('for (i')).toBe('types');
    expect(detectCompletionContext('pattern foo(')).toBe('types');
    expect(detectCompletionContext('pattern foo(int a, ')).toBe('types');
  });

  it('falls back to general elsewhere', () => {
    expect(detectCompletionContext('tempo 12')).toBe('general');
  });
});

describe('buildMotivoCompletionItems', () => {
  const monaco = {
    languages: {
      CompletionItemKind: {
        Keyword: 17,
        Snippet: 27,
        EnumMember: 13,
        Value: 12,
        Constant: 21,
        TypeParameter: 22,
      },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    },
  };

  function createModel(line: string) {
    return {
      getValueInRange: () => line,
      getWordUntilPosition: () => ({
        startColumn: line.length + 1,
        endColumn: line.length + 1,
      }),
    };
  }

  it('includes type keywords in general and statement completions', () => {
    const general = buildMotivoCompletionItems(
      monaco as never,
      createModel('') as never,
      { lineNumber: 1, column: 1 } as never,
    );
    const statements = buildMotivoCompletionItems(
      monaco as never,
      createModel('    ') as never,
      { lineNumber: 2, column: 5 } as never,
    );

    for (const typeKeyword of MOTIVO_TYPE_KEYWORDS) {
      expect(general.suggestions.some((item) => item.label === typeKeyword)).toBe(true);
      expect(statements.suggestions.some((item) => item.label === typeKeyword)).toBe(true);
    }
  });

  it('offers only type keywords inside pattern parameter lists', () => {
    const suggestions = buildMotivoCompletionItems(
      monaco as never,
      createModel('pattern foo(') as never,
      { lineNumber: 1, column: 13 } as never,
    ).suggestions;

    expect(suggestions.map((item) => item.label)).toEqual([...MOTIVO_TYPE_KEYWORDS]);
  });
});
