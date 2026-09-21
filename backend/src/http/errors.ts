export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new ApiError(400, 'VALIDATION_ERROR', message);
export const notFound = (code: string, message: string) => new ApiError(404, code, message);
