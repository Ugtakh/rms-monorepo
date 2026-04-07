import type { PermissionCode, RoleKey } from "./constants.js";

export interface JwtClaims {
  sub: string;
  tenantId: string | null;
  branchId: string | null;
  roles: RoleKey[];
  permissions: PermissionCode[];
  isSuperAdmin: boolean;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  tenantId: string | null;
  branchId: string | null;
  roles: RoleKey[];
  permissions: PermissionCode[];
  isSuperAdmin: boolean;
}

export interface TenantContext {
  tenantId: string | null;
  branchId: string | null;
  userId: string;
  permissions: PermissionCode[];
  isSuperAdmin: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}
