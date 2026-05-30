export function midiFilenameFromDocumentName(documentName?: string): string {
  const trimmed = documentName?.trim();
  if (!trimmed) return 'output.mid';
  const base = trimmed.replace(/\.motivo$/i, '') || 'output';
  return `${base}.mid`;
}

export function downloadMidi(bytes: Uint8Array, filename = 'output.mid') {
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
