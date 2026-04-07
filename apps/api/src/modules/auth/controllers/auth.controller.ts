import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/async-handler.js";
import { AppError } from "../../../common/errors/app-error.js";
import { resolveTenantId } from "../../../common/utils/scope.js";
import { AuthService } from "../services/auth.service.js";
import {
  loginSchema,
  refreshSchema,
  registerEmployeeSchema
} from "../validators/auth.validator.js";

export class AuthController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid login payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const result = await AuthService.login(parsed.data);

    res.cookie("refreshToken", result.refreshToken, {
      ...AuthService.getCookieOptions(),
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    res.status(StatusCodes.OK).json({
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  });

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const payload = {
      refreshToken: req.body.refreshToken ?? req.cookies.refreshToken
    };
    const parsed = refreshSchema.safeParse(payload);

    if (!parsed.success) {
      throw new AppError("Invalid refresh payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const result = await AuthService.refresh(parsed.data.refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      ...AuthService.getCookieOptions(),
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    res.status(StatusCodes.OK).json({
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  });

  static me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, "UNAUTHORIZED");
    }

    const user = await AuthService.me(req.auth.userId);

    res.status(StatusCodes.OK).json({ data: user });
  });

  static registerEmployee = asyncHandler(async (req: Request, res: Response) => {
    const parsed = registerEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid register payload", StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", parsed.error.format());
    }

    const tenantId = resolveTenantId(req);

    const user = await AuthService.registerEmployee({
      ...parsed.data,
      tenantId,
      branchId: parsed.data.branchId ?? null
    });

    res.status(StatusCodes.CREATED).json({ data: user });
  });

  static logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("refreshToken", AuthService.getCookieOptions());
    res.status(StatusCodes.OK).json({ data: { success: true } });
  });
}
