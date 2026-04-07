"use client";

import { useEffect, useState } from "react";
import { getLocalVersion, getServerVersion, setLocalVersion } from "@/lib/pwa/version";

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serverVersion, setServerVersionState] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const remote = await getServerVersion();
      if (!mounted || !remote) return;

      const local = getLocalVersion();

      if (!local) {
        setLocalVersion(remote);
        return;
      }

      if (local !== remote) {
        setServerVersionState(remote);
        setUpdateAvailable(true);
      }
    };

    check();
    const timer = window.setInterval(check, 30000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const applyUpdate = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.update();
      }
    }

    if (serverVersion) {
      setLocalVersion(serverVersion);
    }

    window.location.reload();
  };

  return {
    updateAvailable,
    applyUpdate,
  };
}