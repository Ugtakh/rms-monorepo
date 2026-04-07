"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useRouter } from "next/navigation";
import type {
  BranchOption,
  SessionState,
  SessionUser,
  TenantOption
} from "@/types/auth";
import { apiClient } from "@/lib/api";

interface SessionContextValue {
  session: SessionState | null;
  loading: boolean;
  organizations: TenantOption[];
  branches: BranchOption[];
  activeTenantId: string | null;
  activeBranchId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  setActiveTenant: (tenantId: string | null) => Promise<void>;
  setActiveBranch: (branchId: string | null) => void;
  refreshContext: () => Promise<void>;
}

const STORAGE_KEY = "rms_session";
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [organizations, setOrganizations] = useState<TenantOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const persistSession = useCallback((nextSession: SessionState | null) => {
    setSession(nextSession);
    apiClient.setSession(nextSession);

    if (nextSession) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as SessionState;
        persistSession(parsed);

        const me = await apiClient.request<SessionUser>("/auth/me");
        const baseSession: SessionState = {
          accessToken: parsed.accessToken,
          user: me,
          activeTenantId: parsed.activeTenantId ?? me.tenantId,
          activeBranchId: parsed.activeBranchId ?? me.branchId
        };

        apiClient.setSession(baseSession);

        let nextSession = baseSession;
        if (baseSession.activeTenantId && !baseSession.activeBranchId) {
          const bootBranches = await apiClient
            .request<Array<{ id: string; code: string; name: string }>>("/branches")
            .catch(() => []);

          if (bootBranches.length > 0) {
            nextSession = {
              ...baseSession,
              activeBranchId: bootBranches[0].id
            };
          }
        }

        if (!cancelled) {
          persistSession(nextSession);
        }
      } catch {
        if (!cancelled) {
          persistSession(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [persistSession]);

  const refreshContext = useCallback(async () => {
    if (session === null) {
      setOrganizations([]);
      setBranches([]);
      return;
    }

    try {
      const tenantData = await apiClient.request<Array<{ id: string; code: string; name: string }>>("/tenants");
      setOrganizations(tenantData);
    } catch {
      setOrganizations(
        session.user.tenantId
          ? [{ id: session.user.tenantId, code: "CURRENT", name: "Current Organization" }]
          : []
      );
    }

    try {
      const tenantId = session.activeTenantId ?? session.user.tenantId;
      if (tenantId === null && session.user.isSuperAdmin) {
        setBranches([]);
        return;
      }

      const branchData = await apiClient.request<Array<{ id: string; code: string; name: string }>>("/branches");
      setBranches(branchData);

      if (!session.activeBranchId && branchData.length > 0) {
        persistSession({ ...session, activeBranchId: branchData[0].id });
      }
    } catch {
      setBranches(
        session.user.branchId
          ? [{ id: session.user.branchId, code: "CURRENT", name: "Current Branch" }]
          : []
      );
    }
  }, [session, persistSession]);

  useEffect(() => {
    if (session !== null && loading === false) {
      void refreshContext();
    }
  }, [session, loading, refreshContext]);

  const setActiveTenant = useCallback(
    async (tenantId: string | null) => {
      if (session === null) return;

      const nextSession = { ...session, activeTenantId: tenantId, activeBranchId: null };
      persistSession(nextSession);

      if (!tenantId) {
        setBranches([]);
        return;
      }

      try {
        const branchData = await apiClient.request<Array<{ id: string; code: string; name: string }>>("/branches");
        setBranches(branchData);
        persistSession({
          ...nextSession,
          activeBranchId: branchData[0]?.id ?? null
        });
      } catch {
        setBranches([]);
      }
    },
    [session, persistSession]
  );

  const setActiveBranch = useCallback(
    (branchId: string | null) => {
      if (session === null) return;
      persistSession({ ...session, activeBranchId: branchId });
    },
    [session, persistSession]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiClient.request<{ user: SessionUser; accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      let activeTenantId = data.user.tenantId;
      let activeBranchId = data.user.branchId;

      if (data.user.isSuperAdmin && activeTenantId === null) {
        apiClient.setSession({
          accessToken: data.accessToken,
          user: data.user,
          activeTenantId: null,
          activeBranchId: null
        });

        const tenants = await apiClient
          .request<Array<{ id: string; code: string; name: string }>>("/tenants")
          .catch(() => []);

        activeTenantId = tenants[0]?.id ?? null;
      }

      if (activeTenantId && !activeBranchId) {
        apiClient.setSession({
          accessToken: data.accessToken,
          user: data.user,
          activeTenantId,
          activeBranchId: null
        });

        const tenantBranches = await apiClient
          .request<Array<{ id: string; code: string; name: string }>>("/branches")
          .catch(() => []);

        activeBranchId = tenantBranches[0]?.id ?? null;
      }

      persistSession({
        accessToken: data.accessToken,
        user: data.user,
        activeTenantId,
        activeBranchId
      });

      router.push("/");
    },
    [persistSession, router]
  );

  const logout = useCallback(async () => {
    await apiClient
      .request<{ success: boolean }>("/auth/logout", { method: "POST" })
      .catch(() => ({ success: true }));

    persistSession(null);
    setOrganizations([]);
    setBranches([]);
    router.push("/login");
  }, [persistSession, router]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (session === null) return false;
      if (session.user.isSuperAdmin) return true;
      return (
        session.user.permissions.includes(permission) ||
        session.user.permissions.includes("super_admin:*")
      );
    },
    [session]
  );

  const value = useMemo(
    () => ({
      session,
      loading,
      organizations,
      branches,
      activeTenantId: session?.activeTenantId ?? null,
      activeBranchId: session?.activeBranchId ?? null,
      login,
      logout,
      hasPermission,
      setActiveTenant,
      setActiveBranch,
      refreshContext
    }),
    [
      session,
      loading,
      organizations,
      branches,
      login,
      logout,
      hasPermission,
      setActiveTenant,
      setActiveBranch,
      refreshContext
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);

  if (context === null) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
};
