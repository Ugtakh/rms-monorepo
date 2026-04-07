export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  tenantId: string | null;
  branchId: string | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface SessionState {
  accessToken: string;
  user: SessionUser;
  activeTenantId: string | null;
  activeBranchId: string | null;
}

export interface TenantOption {
  id: string;
  code: string;
  name: string;
}

export interface BranchOption {
  id: string;
  code: string;
  name: string;
}
