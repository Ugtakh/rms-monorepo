import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: req.requestId
      }
    });
    return;
  }

  const raw = error as Error;
  console.error(`[${req.requestId}]`, raw);

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
      requestId: req.requestId
    }
  });
};
