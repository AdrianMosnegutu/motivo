type DatabaseErrorShape = {
  readonly code?: string;
  readonly constraint?: string;
};

export function isDatabaseError(
  error: unknown,
  code: string,
  constraint?: string,
): error is Error & DatabaseErrorShape {
  if (!(error instanceof Error)) {
    return false;
  }

  const databaseError = error as Error & DatabaseErrorShape;

  return (
    databaseError.code === code &&
    (constraint === undefined || databaseError.constraint === constraint)
  );
}
