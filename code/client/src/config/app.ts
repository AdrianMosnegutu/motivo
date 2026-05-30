export const APP_TITLE = 'Motivo Studio';
export const APP_DESCRIPTION = 'Web editor for Motivo music programs';

export const API_ROUTES = {
  compile: '/api/compile',
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    register: '/api/auth/register',
  },
} as const;
