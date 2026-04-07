export async function getServerVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?ts=${Date.now()}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.version ?? null;
  } catch {
    return null;
  }
}

export function getLocalVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rerp_pwa_version");
}

export function setLocalVersion(version: string) {
  localStorage.setItem("rerp_pwa_version", version);
}