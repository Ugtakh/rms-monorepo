import { API_BASE_URL } from "./config";
import type { SessionState } from "@/types/auth";

export class ApiClient {
  private readonly baseUrl: string;
  private session: SessionState | null;
  private refreshPromise: Promise<boolean> | null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.session = null;
    this.refreshPromise = null;
  }

  setSession(session: SessionState | null) {
    this.session = session;
  }

  private buildHeaders(init: RequestInit): Headers {
    const headers = new Headers(init.headers);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.session) {
      headers.set("Authorization", "Bearer " + this.session.accessToken);

      const tenantId = this.session.activeTenantId ?? this.session.user.tenantId;
      const branchId = this.session.activeBranchId ?? this.session.user.branchId;

      if (tenantId) headers.set("x-tenant-id", tenantId);
      if (branchId) headers.set("x-branch-id", branchId);
    }

    return headers;
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const response = await fetch(this.baseUrl + "/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        this.session = null;
        return false;
      }

      const body = await response.json().catch(() => ({}));
      const refreshed = body?.data as
        | {
            accessToken: string;
            user: SessionState["user"];
          }
        | undefined;

      if (!refreshed?.accessToken || !refreshed.user) {
        this.session = null;
        return false;
      }

      this.session = {
        accessToken: refreshed.accessToken,
        user: refreshed.user,
        activeTenantId: this.session?.activeTenantId ?? refreshed.user.tenantId,
        activeBranchId: this.session?.activeBranchId ?? refreshed.user.branchId
      };

      return true;
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const doFetch = async (): Promise<Response> =>
      fetch(this.baseUrl + path, {
        ...init,
        headers: this.buildHeaders(init),
        credentials: "include"
      });

    let response = await doFetch();

    if (response.status === 401 && this.session) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await doFetch();
      }
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body?.error?.message ?? "Request failed");
    }

    return body.data as T;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
