import test from 'node:test';
import assert from 'node:assert/strict';
import { eventsToCsv, generateMarkdownReport } from './export-helpers';
import { ViewingEvent, DailySummary } from '../types/scrollmeter';

test('eventsToCsv formats events properly with valid CSV headers and escaped values', () => {
  const events: ViewingEvent[] = [
    {
      eventId: 'evt-1',
      platform: 'youtube',
      contentType: 'short',
      contentId: 'yt-123',
      creatorName: 'Tech Reviews, Inc.',
      watchSeconds: 45,
      startedAt: 1700000000000,
      detectionConfidence: 'high',
    },
    {
      eventId: 'evt-2',
      platform: 'instagram',
      contentType: 'reel',
      contentId: 'ig-456',
      creatorName: 'Chef "Gordon"',
      watchSeconds: 60,
      startedAt: 1700000050000,
      detectionConfidence: 'high',
    },
  ];

  const csv = eventsToCsv(events);
  const lines = csv.split('\n');

  assert.equal(lines.length, 3);
  assert.ok(lines[0].includes('Event ID,Platform,Content Type'));
  assert.ok(lines[1].includes('"Tech Reviews, Inc."'));
  assert.ok(lines[2].includes('"Chef ""Gordon"""'));
});

test('generateMarkdownReport produces formatted Markdown tables and summaries', () => {
  const events: ViewingEvent[] = [
    {
      eventId: 'evt-1',
      platform: 'youtube',
      contentType: 'short',
      contentId: 'yt-1',
      creatorName: 'Veritasium',
      watchSeconds: 120,
      startedAt: Date.now(),
      detectionConfidence: 'high',
    },
  ];

  const summary: DailySummary = {
    dateStr: '2026-11-10',
    total: 1,
    estimatedSeconds: 120,
    uniqueCreatorsCount: 1,
    platformBreakdown: {
      youtube: 1,
      instagram: 0,
      tiktok: 0,
      facebook: 0,
    },
    trendVsLastWeekPercent: 0,
  };

  const md = generateMarkdownReport(events, summary);
  assert.ok(md.includes('# 📱 ScrollMeter Digital Wellbeing Report'));
  assert.ok(md.includes('Veritasium'));
  assert.ok(md.includes('| YouTube | 1 |'));
  assert.ok(md.includes('Zero data leaves your device'));
});
