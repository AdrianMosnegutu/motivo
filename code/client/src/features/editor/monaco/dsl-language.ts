import type { Monaco } from '@monaco-editor/react';

export const DSL_LANGUAGE_ID = 'dsl';

export const DSL_LANGUAGE_KEYWORDS = [
  'tempo',
  'signature',
  'key',
  'track',
  'pattern',
  'play',
  'for',
  'loop',
  'if',
  'else',
  'let',
  'using',
  'from',
  'rest',
  'major',
  'minor',
] as const;

export const DSL_INSTRUMENTS = ['piano', 'guitar', 'bass', 'violin', 'drums'] as const;
export const DSL_DRUM_NOTES = ['kick', 'snare', 'hihat', 'crash', 'ride'] as const;
export const DSL_BOOLEANS = ['true', 'false'] as const;

export function registerDslLanguage(monaco: Monaco) {
  monaco.languages.register({ id: DSL_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(DSL_LANGUAGE_ID, {
    keywords: [...DSL_LANGUAGE_KEYWORDS],
    instruments: [...DSL_INSTRUMENTS],
    drumNotes: [...DSL_DRUM_NOTES],
    booleans: [...DSL_BOOLEANS],

    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@blockComment'],
        [/\b[A-G][#b]?[0-9]\b/, 'note-literal'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [
          /\b[a-z_][a-zA-Z0-9_]*\b/,
          {
            cases: {
              '@keywords': 'keyword',
              '@instruments': 'instrument',
              '@drumNotes': 'drum-note',
              '@booleans': 'boolean-literal',
              '@default': 'identifier',
            },
          },
        ],
        [/[+\-*/%<>!=&|]+/, 'operator'],
        [/[{}();,]/, 'delimiter'],
      ],
      blockComment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  });
}
