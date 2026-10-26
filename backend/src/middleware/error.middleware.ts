import type { ErrorRequestHandler, RequestHandler } from "express";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode =
    typeof error?.statusCode === "number"
      ? error.statusCode
      : error?.message === "Not allowed by CORS"
        ? 403
        : 500;

  if (statusCode >= 500) {
    console.error("Unhandled request error:", error);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : error?.message || "Request failed",
  });
};
