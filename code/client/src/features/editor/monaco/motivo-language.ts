import type { Monaco } from '@monaco-editor/react';

import { registerMotivoCompletion } from './motivo-completion';

export const MOTIVO_LANGUAGE_ID = 'motivo';

export const MOTIVO_LANGUAGE_KEYWORDS = [
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
  'major',
  'minor',
] as const;

export const MOTIVO_INSTRUMENTS = ['piano', 'guitar', 'bass', 'violin', 'drums'] as const;
export const MOTIVO_DRUM_NOTES = ['kick', 'snare', 'hihat', 'crash', 'ride'] as const;
export const MOTIVO_BOOLEANS = ['true', 'false'] as const;

export function registerMotivoLanguage(monaco: Monaco) {
  monaco.languages.register({ id: MOTIVO_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(MOTIVO_LANGUAGE_ID, {
    keywords: [...MOTIVO_LANGUAGE_KEYWORDS],
    instruments: [...MOTIVO_INSTRUMENTS],
    drumNotes: [...MOTIVO_DRUM_NOTES],
    booleans: [...MOTIVO_BOOLEANS],

    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@blockComment'],
        [/\b[A-G][#b]?[0-9]\b/, 'note-literal'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [/\bvoice\b/, 'voice-keyword'],
        [/\brest\b/, 'rest-keyword'],
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
        [/[+\-*/%<>!=&|.:]+/, 'operator'],
        [/[{}();,\[\]]/, 'delimiter'],
      ],
      blockComment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  });

  registerMotivoCompletion(monaco);
}
