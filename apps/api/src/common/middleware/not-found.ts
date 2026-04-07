import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      requestId: req.requestId
    }
  });
};
