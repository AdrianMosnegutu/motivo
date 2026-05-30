export class FileNotFoundError extends Error {
  constructor() {
    super('file not found');
  }
}

export class FileNameConflictError extends Error {
  constructor() {
    super('file name already exists');
  }
}
