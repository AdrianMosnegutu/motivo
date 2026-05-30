import { type Request, type Response } from 'express';

import environment from '@/config';

const cookiePairDelimiter = /; */;

function getCookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: environment.session_cookie_secure,
  };
}

export function readSessionCookie(req: Request) {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  try {
    for (const cookie of cookieHeader.split(cookiePairDelimiter)) {
      const separatorIndex = cookie.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const name = decodeURIComponent(cookie.slice(0, separatorIndex).trim());

      if (name !== environment.session_cookie_name) {
        continue;
      }

      return decodeURIComponent(cookie.slice(separatorIndex + 1));
    }
  } catch (_error) {
    return null;
  }

  return null;
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(environment.session_cookie_name, token, {
    ...getCookieOptions(),
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(environment.session_cookie_name, getCookieOptions());
}
