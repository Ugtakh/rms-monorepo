"use client";

import { useEffect } from "react";
import { flushMutationQueue } from "@/lib/pwa/queue";

export function usePendingMutationSync() {
  useEffect(() => {
    let running = false;

    const run = async () => {
      if (running) return;
      running = true;

      try {
        await flushMutationQueue();
      } finally {
        running = false;
      }
    };

    run();
    const timer = window.setInterval(run, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);
}