import { ViewingEvent, UserSettings, Platform } from '../types/scrollmeter';
import { DEFAULT_USER_SETTINGS, generateSeedEvents } from './mock-data';
import {
  loadEventsFromIndexedDB,
  saveEventsToIndexedDB,
  clearAllEventsFromIndexedDB,
  purgeEventsOlderThan,
  purgeEventsByPlatform,
} from './indexed-db';
import { encryptData, decryptData, EncryptedPayload } from './crypto';

const STORAGE_KEY_SETTINGS = 'scrollmeter_settings_v3';
const STORAGE_KEY_EVENTS_CACHE = 'scrollmeter_events_cache_v3';
const STORAGE_KEY_CRYPTO_VERIFICATION = 'scrollmeter_crypto_verification_v3';

/**
 * Checks if running inside an actual Chrome Extension environment
 * with chrome.storage.local permissions
 */
export function hasChromeStorageLocal(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.storage &&
    !!chrome.storage.local
  );
}

/**
 * Load User Settings using Chrome Storage Local (with localStorage fallback)
 */
export function loadStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings', err);
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Asynchronously loads settings from Chrome Storage Local if available
 */
export async function loadSettingsFromChromeStorage(): Promise<UserSettings> {
  if (hasChromeStorageLocal()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY_SETTINGS], (result) => {
        if (result && result[STORAGE_KEY_SETTINGS]) {
          resolve({ ...DEFAULT_USER_SETTINGS, ...result[STORAGE_KEY_SETTINGS] });
        } else {
          resolve(loadStoredSettings());
        }
      });
    });
  }
  return loadStoredSettings();
}

/**
 * Save User Settings using Chrome Storage Local and localStorage mirror
 */
export function saveStoredSettings(settings: UserSettings): void {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, serialized);

    if (hasChromeStorageLocal()) {
      chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: settings }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Chrome storage local set error:', chrome.runtime.lastError);
        }
      });
    }
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

/**
 * Synchronous initial event loading for instant UI render
 * Loads from localStorage cache or seed data while IndexedDB initializes
 */
export function loadStoredEventsSync(): ViewingEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS_CACHE);
    if (!raw) {
      const initial = generateSeedEvents();
      saveStoredEvents(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const fresh = generateSeedEvents();
    saveStoredEvents(fresh);
    return fresh;
  } catch (err) {
    console.error('Failed to load events from cache', err);
    return generateSeedEvents();
  }
}

/**
 * Asynchronously loads viewing events directly from IndexedDB
 */
export async function loadStoredEventsFromIndexedDB(): Promise<ViewingEvent[]> {
  try {
    const events = await loadEventsFromIndexedDB();
    if (events && events.length > 0) {
      // Update local cache
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS_CACHE, JSON.stringify(events.slice(0, 500)));
      } catch (_) {}
      return events;
    }
    // If IndexedDB empty, seed it with initial demo data
    const seed = generateSeedEvents();
    await saveEventsToIndexedDB(seed);
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS_CACHE, JSON.stringify(seed.slice(0, 500)));
    } catch (_) {}
    return seed;
  } catch (err) {
    console.warn('IndexedDB load fallback to sync storage:', err);
    return loadStoredEventsSync();
  }
}

/**
 * Dual-persists viewing events into IndexedDB (primary) and localStorage (fast cache)
 */
export function saveStoredEvents(events: ViewingEvent[], retentionDays?: number): void {
  try {
    let toSave = events;
    if (retentionDays && retentionDays > 0) {
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      toSave = events.filter((e) => e.startedAt >= cutoff);
    }

    // 1. Primary: Save to local IndexedDB
    saveEventsToIndexedDB(toSave, retentionDays).catch((err) => {
      console.warn('IndexedDB write deferred/failed:', err);
    });

    // 2. Cache top 400 events to localStorage for immediate next-load paint
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS_CACHE, JSON.stringify(toSave.slice(0, 400)));
    } catch (quotaErr) {
      // If quota exceeded, reduce cache size
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS_CACHE, JSON.stringify(toSave.slice(0, 100)));
      } catch (_) {}
    }
  } catch (err) {
    console.error('Failed to save events to storage', err);
  }
}

/**
 * Permanently wipes all viewing activity from IndexedDB and local caches
 */
export async function permanentlyDeleteAllLocalData(): Promise<void> {
  await clearAllEventsFromIndexedDB();
  localStorage.removeItem(STORAGE_KEY_EVENTS_CACHE);
}

/**
 * Purges events older than a specified number of days
 */
export async function purgeDataOlderThanDays(days: number): Promise<number> {
  const count = await purgeEventsOlderThan(days);
  return count;
}

/**
 * Purges events for a specific platform from local IndexedDB
 */
export async function purgeDataForPlatform(platform: Platform): Promise<number> {
  const count = await purgeEventsByPlatform(platform);
  return count;
}

/**
 * Exports data as JSON with local privacy metadata
 */
export function exportEventsAsJson(
  events: ViewingEvent[],
  settings: UserSettings,
  encryptedPayload?: EncryptedPayload
): string {
  const exportPayload = {
    scrollmeterVersion: '1.0.0',
    exportFormatVersion: 2,
    exportedAt: new Date().toISOString(),
    privacyMode: 'local-first',
    cloudSyncStatus: 'disabled (local-only)',
    isEncrypted: !!encryptedPayload,
    totalRecords: events.length,
    settings: {
      ...settings,
      cloudSyncEnabled: false,
    },
    encryptedData: encryptedPayload || null,
    events: encryptedPayload ? [] : events,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Exports data as CSV format for local spreadsheet inspection
 */
export function exportEventsAsCsv(events: ViewingEvent[]): string {
  const headers = [
    'EventID',
    'Platform',
    'ContentType',
    'ContentID',
    'CreatorName',
    'StartedAtISO',
    'TimestampMS',
    'WatchSeconds',
    'DetectionConfidence',
    'ContentURL',
  ];

  const rows = events.map((e) => [
    e.eventId,
    e.platform,
    e.contentType,
    e.contentId,
    `"${(e.creatorName || '').replace(/"/g, '""')}"`,
    new Date(e.startedAt).toISOString(),
    e.startedAt,
    e.watchSeconds,
    e.detectionConfidence,
    `"${(e.contentUrl || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Imports viewing events from a JSON backup file
 */
export function importEventsFromJson(jsonString: string): ViewingEvent[] | null {
  try {
    const parsed = JSON.parse(jsonString);
    const candidateList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.events)
      ? parsed.events
      : null;

    if (!candidateList) return null;

    const validEvents: ViewingEvent[] = [];
    for (const item of candidateList) {
      if (item.platform && item.contentId) {
        validEvents.push({
          eventId: item.eventId || `imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          platform: item.platform,
          contentType: item.contentType || 'short',
          contentId: item.contentId,
          contentUrl: item.contentUrl,
          title: item.title,
          creatorName: item.creatorName || 'Unknown creator',
          creatorAvatar: item.creatorAvatar,
          startedAt: item.startedAt || Date.now(),
          watchSeconds: item.watchSeconds || 2,
          detectionConfidence: item.detectionConfidence || 'high',
        });
      }
    }
    return validEvents;
  } catch (err) {
    console.error('Import parse error:', err);
    return null;
  }
}
