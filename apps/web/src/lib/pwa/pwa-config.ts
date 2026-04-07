import type { BranchConfig } from "./types";

const STORAGE_KEY = "rerp_branch_config_v1";

export const DEFAULT_BRANCH_CONFIG: BranchConfig = {
  branchApiBaseUrl: "http://localhost:3010",
  branchWsUrl: "ws://localhost:3010/ws",
  tenantId: "",
  branchId: "branch-001",
  restaurantId: "",
  station: "main",
  cashierId: "web-pos",
  cashierName: "Web POS",
};

export function loadBranchConfig(): BranchConfig {
  if (typeof window === "undefined") return DEFAULT_BRANCH_CONFIG;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRANCH_CONFIG;
    return { ...DEFAULT_BRANCH_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRANCH_CONFIG;
  }
}

export function saveBranchConfig(config: BranchConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}