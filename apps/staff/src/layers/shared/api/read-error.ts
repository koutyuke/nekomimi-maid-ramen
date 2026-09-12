export class ReadError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const isAccessDenied = (error: unknown) =>
  error instanceof ReadError && (error.status === 401 || error.status === 403);
