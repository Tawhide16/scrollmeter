import { ViewingEvent, DailySummary } from '../types/scrollmeter';
import { formatHoursAndMinutes, getTopCreators } from './analytics';

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
};

/**
 * Escapes values for safe CSV export
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts viewing events array into standard CSV format
 */
export function eventsToCsv(events: ViewingEvent[]): string {
  const headers = [
    'Event ID',
    'Platform',
    'Content Type',
    'Content ID',
    'Creator Name',
    'Watch Seconds',
    'Started Timestamp',
    'Date ISO',
    'Confidence',
  ];

  const rows = events.map((e) => [
    escapeCsvValue(e.eventId),
    escapeCsvValue(e.platform),
    escapeCsvValue(e.contentType),
    escapeCsvValue(e.contentId),
    escapeCsvValue(e.creatorName || 'Unknown'),
    escapeCsvValue(e.watchSeconds || 0),
    escapeCsvValue(e.startedAt),
    escapeCsvValue(new Date(e.startedAt).toISOString()),
    escapeCsvValue(e.detectionConfidence),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates an executive Markdown digital wellbeing report
 */
export function generateMarkdownReport(
  events: ViewingEvent[],
  summary: DailySummary
): string {
  const totalSeconds = events.reduce((acc, e) => acc + (e.watchSeconds || 0), 0);
  const formattedDuration = formatHoursAndMinutes(totalSeconds);
  const topCreators = getTopCreators(events, 5);

  let md = `# 📱 ScrollMeter Digital Wellbeing Report\n\n`;
  md += `**Report Generated:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
  md += `## 📊 Overview\n\n`;
  md += `- **Total Monitored Videos:** ${events.length}\n`;
  md += `- **Estimated Time Spent:** ${formattedDuration} (${totalSeconds} seconds)\n`;
  md += `- **Daily Total Videos:** ${summary.total}\n\n`;

  md += `## 🌐 Platform Breakdown\n\n`;
  md += `| Platform | Video Count |\n`;
  md += `| :--- | :--- |\n`;
  for (const [platform, count] of Object.entries(summary.platformBreakdown)) {
    const label = PLATFORM_LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
    md += `| ${label} | ${count} |\n`;
  }
  md += `\n`;

  if (topCreators.length > 0) {
    md += `## 🏆 Top Creators\n\n`;
    md += `| Creator | Total Views | Total Time |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const c of topCreators) {
      md += `| ${c.creatorName} | ${c.totalViews} | ${formatHoursAndMinutes(c.totalSeconds)} |\n`;
    }
    md += `\n`;
  }

  md += `---\n*Generated locally and securely by [ScrollMeter](https://github.com/Tawhide16/scrollmeter). Zero data leaves your device.*\n`;
  return md;
}

/**
 * Triggers a client-side file download using Blob API
 */
export function triggerFileDownload(
  fileName: string,
  content: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Filters viewing events by a predefined date range
 */
export function filterEventsByDateRange(
  events: ViewingEvent[],
  range: 'all' | '7d' | '30d' | '90d',
  refDate: Date = new Date()
): ViewingEvent[] {
  if (range === 'all') return events;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = refDate.getTime() - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => e.startedAt >= cutoff);
}

export interface ImportValidationResult {
  isValid: boolean;
  isEncrypted?: boolean;
  error?: string;
  count: number;
  data?: ViewingEvent[];
}

const ALLOWED_PLATFORMS = new Set(['youtube', 'instagram', 'tiktok', 'facebook']);

/**
 * Validates the schema and integrity of an imported JSON backup payload
 */
export function validateImportPayload(raw: unknown): ImportValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, error: 'Invalid backup format: payload must be a JSON object or array', count: 0 };
  }

  // Handle Encrypted Payload format
  const record = raw as Record<string, unknown>;
  if (record.isEncrypted) {
    const enc = record.encryptedData as Record<string, unknown> | undefined;
    if (!enc || typeof enc !== 'object' || !enc.ciphertext || !enc.iv || !enc.salt) {
      return { isValid: false, error: 'Encrypted backup is missing cryptographic components (ciphertext, iv, or salt)', count: 0 };
    }
    const total = typeof record.totalRecords === 'number' ? record.totalRecords : 0;
    return { isValid: true, isEncrypted: true, count: total };
  }

  // Determine candidate array
  let list: unknown[] | null = null;
  if (Array.isArray(raw)) {
    list = raw;
  } else if (Array.isArray(record.events)) {
    list = record.events;
  }

  if (!list) {
    return { isValid: false, error: 'Invalid backup: missing "events" array in payload', count: 0 };
  }

  if (list.length === 0) {
    return { isValid: true, count: 0, data: [] };
  }

  const validEvents: ViewingEvent[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== 'object') {
      return { isValid: false, error: `Corrupted record at index ${i}: not an object`, count: 0 };
    }
    const e = item as Record<string, unknown>;
    if (!e.platform || typeof e.platform !== 'string' || !ALLOWED_PLATFORMS.has(e.platform.toLowerCase())) {
      return { isValid: false, error: `Invalid platform at record index ${i}: "${String(e.platform)}"`, count: 0 };
    }
    const startedAt = typeof e.startedAt === 'number' ? e.startedAt : Number(e.startedAt);
    if (!startedAt || isNaN(startedAt)) {
      return { isValid: false, error: `Invalid startedAt timestamp at record index ${i}`, count: 0 };
    }

    validEvents.push({
      eventId: typeof e.eventId === 'string' ? e.eventId : `import-${Date.now()}-${i}`,
      platform: e.platform.toLowerCase() as ViewingEvent['platform'],
      contentType: (typeof e.contentType === 'string' ? e.contentType : 'short') as ViewingEvent['contentType'],
      contentId: typeof e.contentId === 'string' ? e.contentId : `imported-${i}`,
      creatorName: typeof e.creatorName === 'string' ? e.creatorName : 'Unknown',
      watchSeconds: typeof e.watchSeconds === 'number' ? Math.max(0, e.watchSeconds) : 0,
      startedAt,
      detectionConfidence: e.detectionConfidence === 'high' ? 'high' : 'medium',
      contentUrl: typeof e.contentUrl === 'string' ? e.contentUrl : undefined,
    });
  }

  return {
    isValid: true,
    count: validEvents.length,
    data: validEvents,
  };
}


