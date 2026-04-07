import { openDB } from "idb";
import type { MenuItem, PendingMutation } from "./types";

const DB_NAME = "rerp-pwa-db";
const DB_VERSION = 1;

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pendingMutations")) {
        db.createObjectStore("pendingMutations", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("menuCache")) {
        db.createObjectStore("menuCache", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    },
  });
}

export async function putPendingMutation(item: PendingMutation) {
  const db = await getDb();
  await db.put("pendingMutations", item);
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  const db = await getDb();
  return db.getAll("pendingMutations");
}

export async function deletePendingMutation(id: string) {
  const db = await getDb();
  await db.delete("pendingMutations", id);
}

export async function updatePendingMutation(item: PendingMutation) {
  const db = await getDb();
  await db.put("pendingMutations", item);
}

export async function saveMenuCache(items: MenuItem[]) {
  const db = await getDb();
  const tx = db.transaction("menuCache", "readwrite");
  await tx.store.clear();
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function getMenuCache(): Promise<MenuItem[]> {
  const db = await getDb();
  return db.getAll("menuCache");
}

export async function setMeta(key: string, value: unknown) {
  const db = await getDb();
  await db.put("meta", { key, value });
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.get("meta", key);
  return row?.value ?? null;
}