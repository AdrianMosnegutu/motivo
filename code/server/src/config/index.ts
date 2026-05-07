interface Environment {
  readonly port: number;
  readonly compiler_binary: string;
}

const environment: Environment = {
  get port() {
    return parseInt(process.env.PORT ?? '3001', 10);
  },
  get compiler_binary() {
    return process.env.COMPILER_BIN ?? '/usr/local/bin/dslrc';
  },
};

export default environment;
