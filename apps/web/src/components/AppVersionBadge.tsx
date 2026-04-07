"use client";

import { useEffect, useState } from "react";
import {
  getLocalVersion,
  getServerVersion,
  setLocalVersion,
} from "@/lib/pwa/version";

export default function AppVersionBadge() {
  const [version, setVersion] = useState("...");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const local = getLocalVersion();

      if (local) {
        if (mounted) setVersion(local);
        return;
      }

      const server = await getServerVersion();
      if (server) {
        setLocalVersion(server);
        if (mounted) setVersion(server);
        return;
      }

      if (mounted) setVersion("unknown");
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      style={{}}
      className="bg-gray-900 text-gray-200 border border-gray-700 rounded-md py-2 px-3 text-xs font-bold w-fit"
    >
      Version: {version}
    </div>
  );
}
