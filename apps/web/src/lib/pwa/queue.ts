import { deletePendingMutation, getPendingMutations, putPendingMutation, updatePendingMutation } from "./idb";
import type { PendingMutation } from "./types";

export async function enqueueMutation(
  input: Omit<PendingMutation, "id" | "createdAt" | "retryCount" | "syncStatus">
) {
  const record: PendingMutation = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    syncStatus: "pending",
    ...input,
  };

  await putPendingMutation(record);
  return record;
}

export async function flushMutationQueue() {
  const rows = await getPendingMutations();

  for (const row of rows) {
    try {
      const res = await fetch(row.endpoint, {
        method: row.method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(row.payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      await deletePendingMutation(row.id);
    } catch (error) {
      row.retryCount += 1;
      row.syncStatus = "failed";
      row.lastError =
        error instanceof Error ? error.message : "Unknown sync failure";
      await updatePendingMutation(row);
    }
  }
}