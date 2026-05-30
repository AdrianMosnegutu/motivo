export const MOTIVO_LANGUAGE_ID = 'motivo';

export const MOTIVO_TYPE_KEYWORDS = ['int', 'double', 'bool', 'note', 'seq', 'chord'] as const;

export const MOTIVO_LANGUAGE_KEYWORDS = [
  'tempo',
  'signature',
  'track',
  'pattern',
  'play',
  'for',
  'loop',
  'if',
  'else',
  'voice',
  'using',
  'from',
  'rest',
] as const;

export const MOTIVO_INSTRUMENTS = ['piano', 'guitar', 'bass', 'violin', 'drums'] as const;
export const MOTIVO_DRUM_NOTES = ['kick', 'snare', 'hihat', 'crash', 'ride'] as const;
export const MOTIVO_BOOLEANS = ['true', 'false'] as const;

export const MOTIVO_STATEMENT_KEYWORDS = [
  'play',
  'loop',
  'voice',
  'pattern',
  'for',
  'if',
  'else',
  'rest',
  ...MOTIVO_TYPE_KEYWORDS,
] as const;
