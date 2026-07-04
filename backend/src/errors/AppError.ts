export type AppErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: number;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}
