import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import type { AuthUser, JwtClaims, PermissionCode, RoleKey } from "@rms/shared";
import dayjs from "dayjs";
import { env } from "../../../config/env.js";
import { AppError } from "../../../common/errors/app-error.js";
import { hashPassword, verifyPassword } from "../../../common/utils/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../../../common/utils/jwt.js";
import { AuthRepository } from "../repositories/auth.repository.js";

const hashToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

const parseUser = (user: Awaited<ReturnType<typeof AuthRepository.findUserByEmail>>): AuthUser => {
  if (!user) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
  }

  const roles = user.userRoles.map((entry) => entry.role.name as RoleKey);
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((entry) =>
        entry.role.rolePermissions.map((permissionEntry) => permissionEntry.permission.code as PermissionCode)
      )
    )
  );

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    tenantId: user.tenantId,
    branchId: user.branchId,
    roles,
    permissions,
    isSuperAdmin: user.isSuperAdmin
  };
};

const buildClaims = (user: AuthUser): JwtClaims => ({
  sub: user.id,
  email: user.email,
  tenantId: user.tenantId,
  branchId: user.branchId,
  roles: user.roles,
  permissions: user.permissions,
  isSuperAdmin: user.isSuperAdmin
});

export class AuthService {
  static async login(input: { email: string; password: string }) {
    const user = await AuthRepository.findUserByEmail(input.email.toLowerCase());

    if (!user || !user.isActive) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    const matched = await verifyPassword(input.password, user.passwordHash);

    if (!matched) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    const authUser = parseUser(user);
    const claims = buildClaims(authUser);

    const accessToken = signAccessToken(claims);
    const refreshToken = signRefreshToken(claims);

    const refreshHash = hashToken(refreshToken);
    await AuthRepository.createRefreshToken(
      authUser.id,
      refreshHash,
      dayjs().add(7, "day").toDate()
    );

    return {
      user: authUser,
      accessToken,
      refreshToken
    };
  }

  static async refresh(refreshToken: string) {
    let claims: JwtClaims;

    try {
      claims = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
    }

    const tokenHash = hashToken(refreshToken);
    const existing = await AuthRepository.findRefreshToken(tokenHash);

    if (!existing) {
      throw new AppError("Refresh token revoked or expired", StatusCodes.UNAUTHORIZED, "REFRESH_EXPIRED");
    }

    const user = await AuthRepository.findUserById(claims.sub);
    const authUser = parseUser(user);

    const newClaims = buildClaims(authUser);
    const nextAccessToken = signAccessToken(newClaims);
    const nextRefreshToken = signRefreshToken(newClaims);

    await AuthRepository.revokeRefreshToken(tokenHash);
    await AuthRepository.createRefreshToken(
      authUser.id,
      hashToken(nextRefreshToken),
      dayjs().add(7, "day").toDate()
    );

    return {
      user: authUser,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    };
  }

  static async me(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    return parseUser(user);
  }

  static async registerEmployee(input: {
    tenantId: string;
    branchId: string | null;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    roleName: "ORG_ADMIN" | "MANAGER" | "CASHIER" | "CHEF" | "WAITER";
  }) {
    const branchBoundRoles = new Set(["CASHIER", "CHEF", "WAITER"]);
    if (branchBoundRoles.has(input.roleName) && !input.branchId) {
      throw new AppError(
        `branchId is required for role ${input.roleName}`,
        StatusCodes.BAD_REQUEST,
        "BRANCH_REQUIRED_FOR_ROLE"
      );
    }

    const passwordHash = await hashPassword(input.password);

    let created: Awaited<ReturnType<typeof AuthRepository.createEmployee>>;
    try {
      created = await AuthRepository.createEmployee({
        tenantId: input.tenantId,
        branchId: input.branchId,
        email: input.email.toLowerCase(),
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        roleName: input.roleName
      });
    } catch (error) {
      throw new AppError(
        (error as Error).message,
        StatusCodes.BAD_REQUEST,
        "EMPLOYEE_CREATE_FAILED"
      );
    }

    return parseUser(created);
  }

  static getCookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: env.NODE_ENV === "production"
    };
  }
}
