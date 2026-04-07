import { nanoid } from "nanoid";
import type { NextFunction, Request, Response } from "express";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = req.header("x-request-id") ?? nanoid(12);
  res.setHeader("x-request-id", req.requestId);
  next();
};
