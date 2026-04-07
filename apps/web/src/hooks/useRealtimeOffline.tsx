import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface OfflineAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Интернет холболт сэргэлээ!", {
        description: "Хүлээгдэж буй үйлдлүүд илгээгдэж байна...",
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Интернет холболт тасарлаа", {
        description:
          "Offline горимд ажиллаж байна. Өгөгдөл дараа синк хийгдэнэ.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineAction[]>(() => {
    try {
      const stored = localStorage.getItem("offline_queue");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("offline_queue", JSON.stringify(queue));
  }, [queue]);

  const addToQueue = useCallback((type: string, payload: unknown) => {
    const action: OfflineAction = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
    };
    setQueue((prev) => [...prev, action]);
    toast.info("Offline: Үйлдэл хадгалагдлаа", {
      description: "Интернет сэргэх үед автоматаар илгээгдэнэ.",
    });
    return action;
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem("offline_queue");
  }, []);

  const processQueue = useCallback(
    async (processor: (action: OfflineAction) => Promise<boolean>) => {
      const results: boolean[] = [];
      for (const action of queue) {
        const success = await processor(action);
        results.push(success);
      }
      if (results.every(Boolean)) {
        clearQueue();
        toast.success(
          `${queue.length} хүлээгдэж буй үйлдэл амжилттай илгээгдлээ!`,
        );
      }
    },
    [queue, clearQueue],
  );

  return { queue, addToQueue, clearQueue, processQueue };
}

export function useRealtimeSimulation<T>(initialData: T[], intervalMs = 15000) {
  const [data, setData] = useState<T[]>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate real-time data change by triggering re-render
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  const updateItem = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setData((prev) =>
        prev.map((item) => (predicate(item) ? updater(item) : item)),
      );
      setLastUpdate(new Date());
    },
    [],
  );

  const addItem = useCallback((item: T) => {
    setData((prev) => [...prev, item]);
    setLastUpdate(new Date());
  }, []);

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setData((prev) => prev.filter((item) => !predicate(item)));
    setLastUpdate(new Date());
  }, []);

  return { data, setData, lastUpdate, updateItem, addItem, removeItem };
}
