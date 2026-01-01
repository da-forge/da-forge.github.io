import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface AuthData {
  accessToken: string;
  tokenType: string;
  scope: string;
  createdAt: number;
}

interface CacheEntry {
  key: string;
  data: unknown;
  expiresAt: number;
}

interface GitHubFrontendDB extends DBSchema {
  auth: {
    key: string;
    value: AuthData;
  };
  cache: {
    key: string;
    value: CacheEntry;
    indexes: { "by-expiry": number };
  };
}

const DB_NAME = "github-frontend";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<GitHubFrontendDB>> | null = null;

function getDB(): Promise<IDBPDatabase<GitHubFrontendDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GitHubFrontendDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Auth store for tokens
        if (!db.objectStoreNames.contains("auth")) {
          db.createObjectStore("auth");
        }
        // Cache store for API responses
        if (!db.objectStoreNames.contains("cache")) {
          const cacheStore = db.createObjectStore("cache", { keyPath: "key" });
          cacheStore.createIndex("by-expiry", "expiresAt");
        }
        // Remove old PKCE store if upgrading from v1
        if (oldVersion < 2 && db.objectStoreNames.contains("pkce")) {
          db.deleteObjectStore("pkce");
        }
      },
    });
  }
  return dbPromise;
}

// ============ Auth Token Storage ============

export async function saveAuthToken(
  accessToken: string,
  tokenType: string = "bearer",
  scope: string = "",
): Promise<void> {
  const db = await getDB();
  const authData: AuthData = {
    accessToken,
    tokenType,
    scope,
    createdAt: Date.now(),
  };
  await db.put("auth", authData, "current");
}

export async function getAuthToken(): Promise<string | null> {
  const db = await getDB();
  const authData = await db.get("auth", "current");
  if (!authData) return null;
  return authData.accessToken;
}

export async function getAuthData(): Promise<AuthData | null> {
  const db = await getDB();
  return (await db.get("auth", "current")) || null;
}

export async function clearAuthToken(): Promise<void> {
  const db = await getDB();
  await db.delete("auth", "current");
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
}

// ============ API Cache Storage ============

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export async function cacheApiResponse(
  key: string,
  data: unknown,
  ttlMs: number = DEFAULT_TTL,
): Promise<void> {
  const db = await getDB();
  const entry: CacheEntry = {
    key,
    data,
    expiresAt: Date.now() + ttlMs,
  };
  await db.put("cache", entry);
}

export async function getCachedResponse<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const entry = await db.get("cache", key);

  if (!entry) return null;

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    await db.delete("cache", key);
    return null;
  }

  return entry.data as T;
}

export async function clearCache(): Promise<void> {
  const db = await getDB();
  await db.clear("cache");
}

export async function clearExpiredCache(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("cache", "readwrite");
  const index = tx.store.index("by-expiry");
  const now = Date.now();

  let cursor = await index.openCursor(IDBKeyRange.upperBound(now));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}
