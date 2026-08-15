import type { SyncQueueItem } from "./types";

const QUEUE_KEY = "clinpharm-sync-queue";

function readQueue(): SyncQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as SyncQueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(items: SyncQueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function queueItemStatus(item: SyncQueueItem) {
  if (item.id.includes("conflict")) return "conflict" as const;
  if (item.lastError) return "failed" as const;
  return "pending" as const;
}

export function resolveConflict<T extends { updated_at?: string }>(local: T, remote: T) {
  const localTime = local.updated_at ? Date.parse(local.updated_at) : 0;
  const remoteTime = remote.updated_at ? Date.parse(remote.updated_at) : 0;
  return localTime >= remoteTime ? local : remote;
}

export const syncQueue = {
  list: readQueue,
  enqueue(item: Omit<SyncQueueItem, "createdAt" | "attempts">) {
    const current = readQueue();
    if (current.some((entry) => entry.id === item.id)) return current;
    const next = [...current, { ...item, attempts: 0, createdAt: Date.now() }];
    writeQueue(next);
    return next;
  },
  remove(id: string) {
    const next = readQueue().filter((item) => item.id !== id);
    writeQueue(next);
    return next;
  },
  fail(id: string, error: string) {
    const next = readQueue().map((item) => item.id === id ? { ...item, attempts: item.attempts + 1, lastError: error } : item);
    writeQueue(next);
    return next;
  },
  async flush(executor: (item: SyncQueueItem) => Promise<void>) {
    const current = readQueue();
    for (const item of current) {
      try {
        await executor(item);
        this.remove(item.id);
      } catch (error) {
        this.fail(item.id, error instanceof Error ? error.message : "Sync failed");
      }
    }
    return readQueue();
  },
  clear() {
    writeQueue([]);
  },
};
