"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setMounted(true);
    }, 0);

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(id);
    };
  }, []);

  if (!mounted) return null;
  if (!deferredPrompt) return null;

  return (
    <button
      onClick={async () => {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      }}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 1000,
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: 12,
        padding: "12px 16px",
        fontWeight: 700,
      }}
    >
      Install App
    </button>
  );
}
