import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_JSON", message: "Invalid JSON body" },
    });
    return;
  }

  if (err instanceof Error && err.message.includes("not allowed by CORS")) {
    res.status(403).json({
      success: false,
      error: { code: "CORS_ERROR", message: err.message },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}

export function success<T>(res: Response, data: T, status?: number): void {
  const code =
    status ?? (res.statusCode >= 200 && res.statusCode < 600 ? res.statusCode : 200);
  res.status(code).json({ success: true, data });
}
