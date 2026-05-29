import { createHmac, randomBytes } from 'node:crypto';

import environment from '@/config';

const sessionTokenBytes = 32;

export function createSessionToken() {
  return randomBytes(sessionTokenBytes).toString('base64url');
}

export function hashSessionToken(token: string) {
  return createHmac('sha256', environment.session_secret).update(token).digest('hex');
}

export function createSessionExpiry() {
  return new Date(Date.now() + environment.session_ttl_seconds * 1000);
}
