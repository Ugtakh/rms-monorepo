"use client";

import Icon from "@/components/idea02/AppIcon";
import { loadOfflineQueue } from "@/lib/idea02/kds-bridge";
import { useEffect, useRef, useState } from "react";

interface ConnectionStatusBannerProps {
  isOnline: boolean;
  isReconnecting: boolean;
  subscriptionStatus?: "connecting" | "connected" | "disconnected";
}

export default function KDSConnectionStatusBanner({
  isOnline,
  isReconnecting,
  subscriptionStatus
}: ConnectionStatusBannerProps) {
  const [queueCount, setQueueCount] = useState(0);
  const [showSynced, setShowSynced] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      const syncQueueCount = () => setQueueCount(loadOfflineQueue().length);
      const immediate = window.setTimeout(syncQueueCount, 0);
      const interval = window.setInterval(syncQueueCount, 1000);
      return () => {
        window.clearTimeout(immediate);
        window.clearInterval(interval);
      };
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      wasOfflineRef.current = false;
      const showTimer = window.setTimeout(() => setShowSynced(true), 0);
      const hideTimer = window.setTimeout(() => setShowSynced(false), 4000);
      return () => {
        window.clearTimeout(showTimer);
        window.clearTimeout(hideTimer);
      };
    }
  }, [isOnline]);

  if (isOnline && subscriptionStatus === "connected" && !showSynced) return null;

  if (showSynced) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
        <Icon name="CheckCircleIcon" size={13} className="text-emerald-500" variant="solid" />
        Back online — offline changes synced
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
        <Icon name="ExclamationTriangleIcon" size={13} className="text-amber-500" variant="solid" />
        Offline mode — {queueCount > 0 ? `${queueCount} action${queueCount > 1 ? "s" : ""} queued` : "changes will sync on reconnect"}
      </div>
    );
  }

  if (subscriptionStatus === "connecting" || subscriptionStatus === "disconnected" || isReconnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        {subscriptionStatus === "connecting" ? "Connecting to live updates…" : "Reconnecting to live updates…"}
      </div>
    );
  }

  return null;
}
