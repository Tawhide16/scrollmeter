import { ViewingEvent, Platform } from '../types/scrollmeter';

/**
 * Normalises raw platform inputs into the shared ScrollMeter ViewingEvent structure.
 * Complies with PDF Spec Section 4 (Event data model)
 */
export function createViewingEvent(params: {
  platform: Platform;
  contentId: string;
  creatorName?: string;
  creatorAvatar?: string;
  title?: string;
  contentUrl?: string;
  startedAt?: number;
  watchSeconds?: number;
  detectionConfidence?: 'high' | 'medium';
}): ViewingEvent {
  const platform = params.platform;
  const contentId = params.contentId.trim();
  
  // Safe canonical creator - do not guess unknown creators (PDF spec section 4)
  const cleanCreator = params.creatorName && params.creatorName.trim().length > 0
    ? params.creatorName.trim()
    : 'Unknown creator';

  const contentType = platform === 'youtube' 
    ? 'short' 
    : (platform === 'tiktok' ? 'video' : 'reel');

  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    platform,
    contentType,
    contentId,
    contentUrl: params.contentUrl || generateCanonicalUrl(platform, contentId),
    title: params.title || `${platform.toUpperCase()} ${contentType}`,
    creatorName: cleanCreator,
    creatorAvatar: params.creatorAvatar,
    startedAt: params.startedAt || Date.now(),
    watchSeconds: Math.max(1, Math.round(params.watchSeconds || 2)),
    detectionConfidence: params.detectionConfidence || 'high',
  };
}

/**
 * Produces canonical post URL if not explicitly captured
 */
export function generateCanonicalUrl(platform: Platform, contentId: string): string {
  switch (platform) {
    case 'youtube':
      return `https://www.youtube.com/shorts/${contentId}`;
    case 'instagram':
      return `https://www.instagram.com/reel/${contentId}/`;
    case 'tiktok':
      return `https://www.tiktok.com/@video/${contentId}`;
    case 'facebook':
      return `https://www.facebook.com/reel/${contentId}`;
  }
}

/**
 * Checks whether an incoming candidate event is a duplicate within the deduplication window (default: 5 minutes)
 */
export function isDuplicateEvent(
  existingEvents: ViewingEvent[],
  candidatePlatform: Platform,
  candidateContentId: string,
  dedupeWindowMs: number = 300000 // 5 minutes
): boolean {
  const now = Date.now();
  return existingEvents.some(
    (ev) =>
      ev.platform === candidatePlatform &&
      ev.contentId === candidateContentId &&
      now - ev.startedAt < dedupeWindowMs
  );
}
