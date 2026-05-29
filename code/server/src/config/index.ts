interface Environment {
  readonly port: number;
  readonly hostname: string;
  readonly compiler_binary: string;
  readonly database_url: string;
  readonly session_cookie_name: string;
  readonly session_cookie_secure: boolean;
  readonly session_secret: string;
  readonly session_ttl_seconds: number;
}

const environment: Environment = {
  get port() {
    return parseInt(process.env.PORT ?? '3001', 10);
  },
  get hostname() {
    return process.env.HOSTNAME ?? '0.0.0.0';
  },
  get compiler_binary() {
    return process.env.COMPILER_BIN ?? '/usr/local/bin/motivoc';
  },
  get database_url() {
    return process.env.DATABASE_URL ?? 'postgres://motivo:motivo@localhost:5432/motivo_studio';
  },
  get session_cookie_name() {
    return process.env.SESSION_COOKIE_NAME ?? 'motivo_session';
  },
  get session_cookie_secure() {
    const configured = process.env.SESSION_COOKIE_SECURE;

    if (configured !== undefined) {
      return configured === 'true';
    }

    return process.env.NODE_ENV === 'production';
  },
  get session_secret() {
    return process.env.SESSION_SECRET ?? 'dev-session-secret-change-me';
  },
  get session_ttl_seconds() {
    return parseInt(process.env.SESSION_TTL_SECONDS ?? '2592000', 10);
  },
};

export default environment;
