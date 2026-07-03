import { openDB } from "idb";
import api from "@/lib/api";

const DB_NAME = "clutchd-offline";
const DB_VERSION = 1;
const STORE_NAME = "cache";
const QUEUE_KEY = "requestQueue";

let dbPromise = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

function isDBAvailable() {
  return typeof window !== "undefined" && !!window.indexedDB;
}

let idCounter = 0;

function generateId() {
  return `req_${Date.now()}_${++idCounter}`;
}

/**
 * Read all requests from IndexedDB.
 */
async function getQueue() {
  if (!isDBAvailable()) return [];
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, QUEUE_KEY);
    return entry?.data ?? [];
  } catch (e) {
    console.warn("Failed to read request queue:", e);
    return [];
  }
}

/**
 * Overwrite the queue in IndexedDB.
 */
async function saveQueue(requests) {
  if (!isDBAvailable()) return;
  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      key: QUEUE_KEY,
      data: requests,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn("Failed to save request queue:", e);
  }
}

/**
 * Enqueue a request for later submission when connectivity is restored.
 *
 * @param {string} type  - Request type (e.g. "SOS")
 * @param {object} payload - Payload to send when flushed
 * @returns {Promise<string>} The generated request id
 */
export async function enqueueRequest(type, payload) {
  const requests = await getQueue();
  const request = {
    id: generateId(),
    type,
    payload,
    createdAt: Date.now(),
    status: "pending", // pending | completed | failed
  };
  requests.push(request);
  await saveQueue(requests);
  return request.id;
}

/**
 * Return every request that hasn't been successfully submitted yet.
 */
export async function getPendingRequests() {
  const requests = await getQueue();
  return requests.filter((r) => r.status !== "completed");
}

/**
 * Mark a request as completed (successfully submitted).
 */
async function markCompleted(id) {
  const requests = await getQueue();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return;
  requests[idx].status = "completed";
  requests[idx].completedAt = Date.now();
  await saveQueue(requests);
}

/**
 * Mark a request as failed so it can be retried later.
 */
async function markFailed(id, error) {
  const requests = await getQueue();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return;
  requests[idx].status = "failed";
  requests[idx].lastError = error;
  requests[idx].lastAttemptAt = Date.now();
  await saveQueue(requests);
}

/**
 * Attempt to submit a single queued request.
 * Returns true on success, false on failure.
 */
async function submitRequest(request) {
  try {
    const { type, payload } = request;

    if (type === "SOS") {
      await api.post("/service/sos", payload);
    } else {
      console.warn("Unknown request type in queue:", type);
      return false;
    }

    await markCompleted(request.id);
    return true;
  } catch (e) {
    const reason = e?.response?.data?.detail || e?.message || "Unknown error";
    await markFailed(request.id, reason);
    return false;
  }
}

/**
 * Submit every pending and previously-failed request.
 * Successful ones are marked completed; failures retain the failed state.
 * Old completed entries (>24h) are pruned.
 *
 * @returns {Promise<{ submitted: number, failed: number }>}
 */
export async function flushQueue() {
  if (!isDBAvailable()) return { submitted: 0, failed: 0 };

  const requests = await getPendingRequests();
  let submitted = 0;
  let failed = 0;

  for (const request of requests) {
    const ok = await submitRequest(request);
    if (ok) submitted++;
    else failed++;
  }

  // Garbage-collect old completed entries
  await cleanupOldRequests();

  return { submitted, failed };
}

/**
 * Retry a single failed request by its id.
 *
 * @param {string} id
 * @returns {Promise<boolean>} Whether the retry succeeded
 */
export async function retryFailedRequest(id) {
  if (!isDBAvailable()) return false;

  const requests = await getQueue();
  const request = requests.find((r) => r.id === id && r.status === "failed");
  if (!request) return false;

  return await submitRequest(request);
}

/**
 * Remove completed entries that are older than 24 hours.
 */
async function cleanupOldRequests() {
  try {
    const requests = await getQueue();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = requests.filter(
      (r) => !(r.status === "completed" && r.completedAt < cutoff)
    );
    if (filtered.length !== requests.length) {
      await saveQueue(filtered);
    }
  } catch {
    // Best-effort; queue still works without cleanup
  }
}

/**
 * Register a listener that auto-flushes the queue when the browser
 * fires the `online` event.
 *
 * @returns {() => void} Cleanup function to remove the listener
 */
export function registerOnlineFlush() {
  const handler = () => {
    flushQueue();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("online", handler);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handler);
    }
  };
}
