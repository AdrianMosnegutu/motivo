import { type Response } from 'superagent';

function toBuffer(chunk: unknown): Buffer {
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
}

export const binaryParser = (
  res: Response,
  callback: (error: Error | null, body: Buffer) => void,
) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: unknown) => chunks.push(toBuffer(chunk)));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};
