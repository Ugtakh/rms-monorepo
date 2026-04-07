"use client";

import { usePWAUpdate } from "@/hooks/usePWAUpdate";

export default function PWAUpdateToast() {
  const { updateAvailable, applyUpdate } = usePWAUpdate();

  if (!updateAvailable) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 1000,
        background: "#0f172a",
        color: "#e2e8f0",
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 16,
        width: 320,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>
        New version available
      </div>
      <div style={{ color: "#94a3b8", marginBottom: 12 }}>
        A new POS/KDS version has been deployed.
      </div>
      <button
        onClick={applyUpdate}
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 10,
          padding: "10px 14px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Refresh now
      </button>
    </div>
  );
}
