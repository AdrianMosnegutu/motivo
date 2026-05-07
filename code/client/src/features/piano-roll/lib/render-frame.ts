import { isBlackKey, KEY_STRIP_HEIGHT, NOTE_GAP, PIXELS_PER_SEC, TRACK_COLORS } from './piano';

type RenderNote = {
  midi: number;
  time: number;
  duration: number;
};

type RenderTrack = {
  notes: RenderNote[];
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface RenderFrameInput {
  ctx: CanvasRenderingContext2D;
  tracks: RenderTrack[];
  currentTime: number;
  width: number;
  height: number;
  minMidi: number;
  maxMidi: number;
  theme: string | undefined;
}

export function renderPianoRollFrame({
  ctx,
  tracks,
  currentTime,
  width,
  height,
  minMidi,
  maxMidi,
  theme,
}: RenderFrameInput) {
  const isDark = theme === 'dark';
  const noteRange = maxMidi - minMidi + 1;
  const columnWidth = width / noteRange;
  const keyStripY = height - KEY_STRIP_HEIGHT;
  const nowLineY = keyStripY;

  drawBackground(ctx, width, height, isDark);
  drawGrid(ctx, minMidi, maxMidi, columnWidth, keyStripY, isDark);
  const activeNotes = drawNotes(
    ctx,
    tracks,
    currentTime,
    minMidi,
    columnWidth,
    keyStripY,
    nowLineY,
  );
  drawNowLine(ctx, width, nowLineY, isDark);
  drawPianoKeys(ctx, {
    activeNotes,
    columnWidth,
    height,
    isDark,
    keyStripY,
    maxMidi,
    minMidi,
    width,
  });
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDark: boolean,
) {
  ctx.fillStyle = isDark ? '#0d0d0f' : '#ffffff';
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  minMidi: number,
  maxMidi: number,
  columnWidth: number,
  keyStripY: number,
  isDark: boolean,
) {
  ctx.strokeStyle = isDark ? '#1a1a2e' : '#f0f0f0';
  ctx.lineWidth = 1;
  for (let midi = minMidi; midi <= maxMidi; midi++) {
    if (midi % 12 !== 0) continue;
    const x = (midi - minMidi) * columnWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, keyStripY);
    ctx.stroke();
  }
}

function drawNotes(
  ctx: CanvasRenderingContext2D,
  tracks: RenderTrack[],
  currentTime: number,
  minMidi: number,
  columnWidth: number,
  keyStripY: number,
  nowLineY: number,
) {
  const activeNotes = new Map<number, string>();

  for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
    const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
    const track = tracks[trackIndex];

    for (const note of track.notes) {
      const noteTop = nowLineY - (note.time - currentTime) * PIXELS_PER_SEC;
      const noteBottom = nowLineY - (note.time + note.duration - currentTime) * PIXELS_PER_SEC;

      if (noteBottom > keyStripY || noteTop < 0) continue;

      const noteX = (note.midi - minMidi) * columnWidth;
      const noteWidth = Math.max(columnWidth - NOTE_GAP, 2);
      const clippedTop = Math.max(noteBottom, 0);
      const clippedHeight = Math.min(noteTop, keyStripY) - clippedTop;
      if (clippedHeight <= 0) continue;

      ctx.fillStyle = color;
      ctx.fillRect(noteX, clippedTop, noteWidth, clippedHeight);

      const capRadius = Math.min(noteWidth / 2, 3);
      const capY = Math.min(noteTop - capRadius, keyStripY - capRadius);
      if (capY >= clippedTop) {
        ctx.beginPath();
        ctx.arc(noteX + noteWidth / 2, capY, capRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (note.time <= currentTime && note.time + note.duration >= currentTime) {
        activeNotes.set(note.midi, color);
      }
    }
  }

  return activeNotes;
}

function drawNowLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  nowLineY: number,
  isDark: boolean,
) {
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, nowLineY);
  ctx.lineTo(width, nowLineY);
  ctx.stroke();
}

function drawPianoKeys(
  ctx: CanvasRenderingContext2D,
  input: {
    activeNotes: Map<number, string>;
    columnWidth: number;
    height: number;
    isDark: boolean;
    keyStripY: number;
    maxMidi: number;
    minMidi: number;
    width: number;
  },
) {
  const { activeNotes, columnWidth, isDark, keyStripY, maxMidi, minMidi, width } = input;
  const whiteKeyColor = isDark ? '#e8e8e8' : '#ffffff';
  const whiteKeyBorder = isDark ? '#333344' : '#d1d1d6';

  ctx.fillStyle = isDark ? '#111114' : '#f8f8f8';
  ctx.fillRect(0, keyStripY, width, KEY_STRIP_HEIGHT);
  ctx.strokeStyle = isDark ? '#2a2a3a' : '#e4e4e7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, keyStripY);
  ctx.lineTo(width, keyStripY);
  ctx.stroke();

  ctx.fillStyle = whiteKeyColor;
  ctx.fillRect(0, keyStripY + 1, width, KEY_STRIP_HEIGHT - 2);

  drawWhiteKeyHighlights(ctx, {
    activeNotes,
    columnWidth,
    keyStripY,
    maxMidi,
    minMidi,
    width,
  });
  drawWhiteKeySeparators(ctx, {
    columnWidth,
    keyStripY,
    maxMidi,
    minMidi,
    width,
    whiteKeyBorder,
  });
  drawBlackKeys(ctx, {
    activeNotes,
    columnWidth,
    isDark,
    keyStripY,
    maxMidi,
    minMidi,
  });
  drawKeyLabels(ctx, {
    activeNotes,
    columnWidth,
    isDark,
    keyStripY,
    maxMidi,
    minMidi,
  });
}

function drawWhiteKeyHighlights(
  ctx: CanvasRenderingContext2D,
  input: {
    activeNotes: Map<number, string>;
    columnWidth: number;
    keyStripY: number;
    maxMidi: number;
    minMidi: number;
    width: number;
  },
) {
  const { activeNotes, columnWidth, keyStripY, maxMidi, minMidi, width } = input;

  for (let midi = minMidi; midi <= maxMidi; midi++) {
    if (isBlackKey(midi)) continue;
    const activeColor = activeNotes.get(midi);
    if (!activeColor) continue;

    const { xStart, xEnd } = getWhiteKeyBounds(midi, minMidi, columnWidth);
    const x = Math.max(0, xStart);
    const w = Math.min(width, xEnd) - x;

    ctx.fillStyle = activeColor;
    ctx.fillRect(x + 0.5, keyStripY + 1, w - 1, KEY_STRIP_HEIGHT - 2);
  }
}

function drawWhiteKeySeparators(
  ctx: CanvasRenderingContext2D,
  input: {
    columnWidth: number;
    keyStripY: number;
    maxMidi: number;
    minMidi: number;
    width: number;
    whiteKeyBorder: string;
  },
) {
  const { columnWidth, keyStripY, maxMidi, minMidi, width, whiteKeyBorder } = input;
  ctx.strokeStyle = whiteKeyBorder;
  ctx.lineWidth = 0.5;

  for (let midi = minMidi; midi <= maxMidi; midi++) {
    const isNextBlack = midi < 127 && isBlackKey(midi + 1);
    const isThisBlack = isBlackKey(midi);
    let lineX: number | null = null;

    if (!isThisBlack && !isNextBlack && midi < maxMidi) {
      lineX = (midi + 1 - minMidi) * columnWidth;
    } else if (isThisBlack) {
      lineX = (midi - minMidi) * columnWidth + columnWidth / 2;
    }

    if (lineX !== null && lineX > 0 && lineX < width) {
      ctx.beginPath();
      ctx.moveTo(lineX, keyStripY + 1);
      ctx.lineTo(lineX, keyStripY + KEY_STRIP_HEIGHT - 1);
      ctx.stroke();
    }
  }
}

function drawBlackKeys(
  ctx: CanvasRenderingContext2D,
  input: {
    activeNotes: Map<number, string>;
    columnWidth: number;
    isDark: boolean;
    keyStripY: number;
    maxMidi: number;
    minMidi: number;
  },
) {
  const { activeNotes, columnWidth, isDark, keyStripY, maxMidi, minMidi } = input;

  for (let midi = minMidi; midi <= maxMidi; midi++) {
    if (!isBlackKey(midi)) continue;
    const x = (midi - minMidi) * columnWidth;
    const activeColor = activeNotes.get(midi);
    const blackKeyColor = activeColor ?? (isDark ? '#1a1a1a' : '#2c2c2e');
    const keyWidth = Math.max(columnWidth * 0.7, 1);
    const keyX = x + (columnWidth - keyWidth) / 2;

    ctx.fillStyle = blackKeyColor;
    ctx.fillRect(keyX, keyStripY + 1, keyWidth, KEY_STRIP_HEIGHT * 0.6);

    if (isDark && !activeColor) {
      ctx.strokeStyle = '#333344';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(keyX, keyStripY + 1, keyWidth, KEY_STRIP_HEIGHT * 0.6);
    }
  }
}

function drawKeyLabels(
  ctx: CanvasRenderingContext2D,
  input: {
    activeNotes: Map<number, string>;
    columnWidth: number;
    isDark: boolean;
    keyStripY: number;
    maxMidi: number;
    minMidi: number;
  },
) {
  const { activeNotes, columnWidth, isDark, keyStripY, maxMidi, minMidi } = input;
  ctx.font = 'bold 9px ui-monospace, monospace';
  ctx.textAlign = 'center';

  for (let midi = minMidi; midi <= maxMidi; midi++) {
    if (isBlackKey(midi) || columnWidth <= 12) continue;

    const activeColor = activeNotes.get(midi);
    const { xStart, xEnd } = getWhiteKeyBounds(midi, minMidi, columnWidth);
    const centerX = (xStart + xEnd) / 2;
    const octave = Math.floor(midi / 12) - 1;
    const label = `${NOTE_NAMES[midi % 12]}${octave}`;
    const bottomPartTop = keyStripY + KEY_STRIP_HEIGHT * 0.6;

    ctx.fillStyle = activeColor
      ? 'rgba(255,255,255,0.9)'
      : isDark
        ? 'rgba(0,0,0,0.45)'
        : 'rgba(0,0,0,0.3)';
    ctx.fillText(label, centerX, bottomPartTop + (KEY_STRIP_HEIGHT * 0.4) / 2 + 4);
  }
}

function getWhiteKeyBounds(midi: number, minMidi: number, columnWidth: number) {
  let xStart = (midi - minMidi) * columnWidth;
  let xEnd = xStart + columnWidth;

  if (midi > 0 && isBlackKey(midi - 1)) xStart -= columnWidth / 2;
  if (midi < 127 && isBlackKey(midi + 1)) xEnd += columnWidth / 2;

  return { xStart, xEnd };
}
