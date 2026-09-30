export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION"
  | "UNAVAILABLE"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  VALIDATION: 422,
  UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
  get status() {
    return STATUS[this.code];
  }
}

export const notFound = (what = "Resource") => new ApiError("NOT_FOUND", `${what} not found`);
export const forbidden = (msg = "You do not have access to this resource") => new ApiError("FORBIDDEN", msg);
