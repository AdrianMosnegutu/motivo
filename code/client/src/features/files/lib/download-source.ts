import { ensureMotivoFileName } from './documents';

function createDownloadLink(blob: Blob, filename: string): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = ensureMotivoFileName(filename);
  anchor.style.display = 'none';
  return anchor;
}

export function downloadSource(filename: string, source: string) {
  const blob = new Blob([source], { type: 'text/plain;charset=utf-8' });
  const anchor = createDownloadLink(blob, filename);

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
}

export function downloadBlob(filename: string, blob: Blob) {
  const anchor = createDownloadLink(blob, filename);

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
}
