import type { Request, Response } from "express";

export class HealthController {
  static status(_req: Request, res: Response): void {
    res.json({
      data: {
        service: "rms-api",
        status: "ok",
        timestamp: new Date().toISOString()
      }
    });
  }
}
