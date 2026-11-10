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
