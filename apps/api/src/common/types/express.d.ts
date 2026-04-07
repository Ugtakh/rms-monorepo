import type { TenantContext } from "@rms/shared";

declare global {
  namespace Express {
    interface Request {
      auth?: TenantContext & {
        email: string;
        roles: string[];
      };
      requestId?: string;
    }
  }
}

export {};
