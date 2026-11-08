export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest = (message = "Bad request", details?: unknown) => new ApiError(400, message, details);
  static unauthorized = (message = "Authentication required") => new ApiError(401, message);
  static forbidden = (message = "You do not have permission to perform this action") => new ApiError(403, message);
  static notFound = (resource = "Resource") => new ApiError(404, `${resource} not found`);
  static conflict = (message: string) => new ApiError(409, message);
  static paymentRequired = (message: string) => new ApiError(402, message);
  static unavailable = (message: string) => new ApiError(503, message);
}
