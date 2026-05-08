interface Environment {
  readonly port: number;
  readonly hostname: string;
  readonly compiler_binary: string;
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
};

export default environment;
