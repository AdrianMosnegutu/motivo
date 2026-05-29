import type { Monaco } from '@monaco-editor/react';
import type { editor, languages, Position } from 'monaco-editor';

import {
  MOTIVO_BOOLEANS,
  MOTIVO_DRUM_NOTES,
  MOTIVO_INSTRUMENTS,
  MOTIVO_LANGUAGE_ID,
  MOTIVO_LANGUAGE_KEYWORDS,
} from './motivo-language';

export type MotivoCompletionContext = 'instruments' | 'playables' | 'statements' | 'general';

const COMMON_PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const COMMON_OCTAVES = [2, 3, 4, 5] as const;

export const COMMON_NOTE_LITERALS = COMMON_OCTAVES.flatMap((octave) =>
  COMMON_PITCHES.map((pitch) => `${pitch}${octave}`),
);

const STATEMENT_KEYWORDS = [
  'play',
  'loop',
  'let',
  'voice',
  'pattern',
  'for',
  'if',
  'else',
  'rest',
] as const;

type SnippetSpec = {
  label: string;
  insertText: string;
  detail: string;
};

const SNIPPETS: SnippetSpec[] = [
  {
    label: 'track',
    insertText: 'track ${1:name} using ${2:piano} {\n\t$0\n}',
    detail: 'New track',
  },
  {
    label: 'pattern',
    insertText: 'pattern ${1:name}() {\n\t$0\n}',
    detail: 'Pattern definition',
  },
  {
    label: 'tempo',
    insertText: 'tempo ${1:120};',
    detail: 'Tempo (BPM)',
  },
  {
    label: 'signature',
    insertText: 'signature ${1:4}/${2:4};',
    detail: 'Time signature',
  },
  {
    label: 'play',
    insertText: 'play ${1:A4};',
    detail: 'Play note or chord',
  },
  {
    label: 'loop',
    insertText: 'loop (${1:4}) {\n\t$0\n}',
    detail: 'Repeat block',
  },
  {
    label: 'for',
    insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:16}; ${1:i} = ${1:i} + 1) {\n\t$0\n}',
    detail: 'For loop',
  },
  {
    label: 'voice',
    insertText: 'voice {\n\t$0\n}',
    detail: 'Voice block',
  },
  {
    label: 'if',
    insertText: 'if (${1:condition}) {\n\t$0\n}',
    detail: 'Conditional',
  },
];

function getLinePrefix(model: editor.ITextModel, position: Position): string {
  return model.getValueInRange({
    startLineNumber: position.lineNumber,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });
}

function getReplaceRange(model: editor.ITextModel, position: Position) {
  const word = model.getWordUntilPosition(position);
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
}

export function detectCompletionContext(linePrefix: string): MotivoCompletionContext {
  if (/\busing\s+[a-z_][a-z0-9_]*$/i.test(linePrefix) || /\busing\s*$/i.test(linePrefix)) {
    return 'instruments';
  }
  if (/\bplay\s+[^;]*$/i.test(linePrefix) || /\[\s*[^;\]]*$/i.test(linePrefix)) {
    return 'playables';
  }
  if (/[{;]\s*$/.test(linePrefix)) {
    return 'statements';
  }
  return 'general';
}

function keywordItems(
  monaco: Monaco,
  range: languages.CompletionItem['range'],
  labels: readonly string[],
): languages.CompletionItem[] {
  return labels.map((label) => ({
    label,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: label,
    range,
  }));
}

function valueItems(
  monaco: Monaco,
  range: languages.CompletionItem['range'],
  labels: readonly string[],
  kind: languages.CompletionItemKind,
): languages.CompletionItem[] {
  return labels.map((label) => ({
    label,
    kind,
    insertText: label,
    range,
  }));
}

function snippetItems(
  monaco: Monaco,
  range: languages.CompletionItem['range'],
  snippets: SnippetSpec[],
): languages.CompletionItem[] {
  return snippets.map((snippet) => ({
    label: snippet.label,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: snippet.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: snippet.detail,
    range,
  }));
}

export function buildMotivoCompletionItems(
  monaco: Monaco,
  model: editor.ITextModel,
  position: Position,
): languages.CompletionList {
  const linePrefix = getLinePrefix(model, position);
  const range = getReplaceRange(model, position);
  const context = detectCompletionContext(linePrefix);

  switch (context) {
    case 'instruments':
      return {
        suggestions: valueItems(
          monaco,
          range,
          MOTIVO_INSTRUMENTS,
          monaco.languages.CompletionItemKind.EnumMember,
        ),
      };
    case 'playables':
      return {
        suggestions: [
          ...valueItems(
            monaco,
            range,
            MOTIVO_DRUM_NOTES,
            monaco.languages.CompletionItemKind.EnumMember,
          ),
          ...valueItems(
            monaco,
            range,
            COMMON_NOTE_LITERALS,
            monaco.languages.CompletionItemKind.Value,
          ),
          ...keywordItems(monaco, range, ['rest']),
        ],
      };
    case 'statements':
      return {
        suggestions: [
          ...snippetItems(monaco, range, SNIPPETS),
          ...keywordItems(monaco, range, STATEMENT_KEYWORDS),
        ],
      };
    case 'general':
      return {
        suggestions: [
          ...snippetItems(monaco, range, SNIPPETS),
          ...keywordItems(monaco, range, MOTIVO_LANGUAGE_KEYWORDS),
          ...keywordItems(monaco, range, ['voice', 'rest']),
          ...valueItems(
            monaco,
            range,
            MOTIVO_INSTRUMENTS,
            monaco.languages.CompletionItemKind.EnumMember,
          ),
          ...valueItems(
            monaco,
            range,
            MOTIVO_DRUM_NOTES,
            monaco.languages.CompletionItemKind.EnumMember,
          ),
          ...valueItems(
            monaco,
            range,
            MOTIVO_BOOLEANS,
            monaco.languages.CompletionItemKind.Constant,
          ),
        ],
      };
  }
}

export function registerMotivoCompletion(monaco: Monaco) {
  return monaco.languages.registerCompletionItemProvider(MOTIVO_LANGUAGE_ID, {
    triggerCharacters: [' ', '[', ',', ':', '/'],
    provideCompletionItems(model: editor.ITextModel, position: Position) {
      return buildMotivoCompletionItems(monaco, model, position);
    },
  });
}
