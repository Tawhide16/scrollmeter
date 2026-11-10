/**
 * Local-First IndexedDB Architecture for ScrollMeter
 * 
 * Complies with Core Privacy Requirements:
 * 1. All user activity stored locally on the user's computer via IndexedDB.
 * 2. 100% offline functionality.
 * 3. Zero external telemetry or remote server dependencies.
 * 4. Supports permanent deletion, date-range purge, platform purge.
 */

import { ViewingEvent, UserSettings, Platform } from '../types/scrollmeter';

const DB_NAME = 'scrollmeter_local_db';
const DB_VERSION = 1;
const STORE_EVENTS = 'viewing_events';
const STORE_SETTINGS = 'user_settings';
const STORE_CRYPTO = 'crypto_meta';

let dbInstance: IDBDatabase | null = null;

function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function openLocalDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Viewing Events Store
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        const eventsStore = db.createObjectStore(STORE_EVENTS, { keyPath: 'eventId' });
        eventsStore.createIndex('startedAt', 'startedAt', { unique: false });
        eventsStore.createIndex('platform', 'platform', { unique: false });
        eventsStore.createIndex('creatorName', 'creatorName', { unique: false });
      }

      // 2. User Settings Store
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }

      // 3. Web Crypto Encryption Metadata Store
      if (!db.objectStoreNames.contains(STORE_CRYPTO)) {
        db.createObjectStore(STORE_CRYPTO, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Loads all viewing events from local IndexedDB
 */
export async function loadEventsFromIndexedDB(): Promise<ViewingEvent[]> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readonly');
      const store = transaction.objectStore(STORE_EVENTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result || []) as ViewingEvent[];
        // Sort descending by startedAt
        results.sort((a, b) => b.startedAt - a.startedAt);
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not load from IndexedDB, falling back to localStorage cache', err);
    return [];
  }
}

/**
 * Saves or updates viewing events into IndexedDB
 */
export async function saveEventsToIndexedDB(
  events: ViewingEvent[],
  retentionDays?: number
): Promise<void> {
  try {
    const db = await openLocalDatabase();
    let toSave = events;

    if (retentionDays && retentionDays > 0) {
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      toSave = events.filter((e) => e.startedAt >= cutoff);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readwrite');
      const store = transaction.objectStore(STORE_EVENTS);

      // Clear existing records to keep in sync with active list
      store.clear();

      for (const ev of toSave) {
        store.put(ev);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error saving events to IndexedDB:', err);
  }
}

/**
 * Adds a single viewing event to IndexedDB
 */
export async function addEventToIndexedDB(event: ViewingEvent): Promise<void> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readwrite');
      const store = transaction.objectStore(STORE_EVENTS);
      const request = store.put(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error adding event to IndexedDB:', err);
  }
}

/**
 * Deletes a single event from IndexedDB
 */
export async function deleteEventFromIndexedDB(eventId: string): Promise<void> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readwrite');
      const store = transaction.objectStore(STORE_EVENTS);
      const request = store.delete(eventId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error deleting event from IndexedDB:', err);
  }
}

/**
 * Permanently deletes all events from IndexedDB
 */
export async function clearAllEventsFromIndexedDB(): Promise<void> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readwrite');
      const store = transaction.objectStore(STORE_EVENTS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error clearing IndexedDB:', err);
  }
}

/**
 * Purges events older than a given number of days
 */
export async function purgeEventsOlderThan(days: number): Promise<number> {
  try {
    const db = await openLocalDatabase();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readwrite');
      const store = transaction.objectStore(STORE_EVENTS);
      const index = store.index('startedAt');
      const range = IDBKeyRange.upperBound(cutoff, true);
      const request = index.openCursor(range);
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error purging old events:', err);
    return 0;
  }
}

/**
 * Purges events for a specific platform
 */
export async function purgeEventsByPlatform(platform: Platform): Promise<number> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readwrite');
      const store = transaction.objectStore(STORE_EVENTS);
      const index = store.index('platform');
      const request = index.openCursor(IDBKeyRange.only(platform));
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error purging events by platform:', err);
    return 0;
  }
}

/**
 * Saves and loads encryption metadata in IndexedDB
 */
export async function saveCryptoMetaToIndexedDB(key: string, value: unknown): Promise<void> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_CRYPTO], 'readwrite');
      const store = transaction.objectStore(STORE_CRYPTO);
      const request = store.put({ id: key, value, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error saving crypto meta to IndexedDB:', err);
  }
}

export async function loadCryptoMetaFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_CRYPTO], 'readonly');
      const store = transaction.objectStore(STORE_CRYPTO);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value as T);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error loading crypto meta from IndexedDB:', err);
    return null;
  }
}

/**
 * High-throughput batch insertion for viewing events in chunks
 */
export async function bulkAddEventsToIndexedDB(
  newEvents: ViewingEvent[],
  chunkSize: number = 250
): Promise<number> {
  if (!newEvents || newEvents.length === 0) return 0;
  try {
    const db = await openLocalDatabase();
    let totalInserted = 0;

    for (let i = 0; i < newEvents.length; i += chunkSize) {
      const chunk = newEvents.slice(i, i + chunkSize);
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_EVENTS], 'readwrite');
        const store = transaction.objectStore(STORE_EVENTS);

        for (const ev of chunk) {
          store.put(ev);
        }

        transaction.oncomplete = () => {
          totalInserted += chunk.length;
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
    }

    return totalInserted;
  } catch (err) {
    console.error('Error during bulk insertion to IndexedDB:', err);
    return 0;
  }
}
