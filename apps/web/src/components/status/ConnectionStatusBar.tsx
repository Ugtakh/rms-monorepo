import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react";
import {
  useConnectionStatus,
  useOfflineQueue,
} from "@/hooks/useRealtimeOffline";

export default function ConnectionStatusBar() {
  const isOnline = useConnectionStatus();
  const { queue } = useOfflineQueue();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Connection indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-xl border ${
          isOnline
            ? "bg-success/10 border-success/20 text-success"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>Онлайн</span>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Офлайн</span>
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          </>
        )}
      </motion.div>

      {/* Offline queue indicator */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-warning/10 border border-warning/20 text-warning backdrop-blur-xl"
          >
            {isOnline ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudOff className="w-3.5 h-3.5" />
            )}
            <span>{queue.length} хүлээгдэж буй</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
