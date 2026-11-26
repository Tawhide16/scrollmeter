import test from 'node:test';
import assert from 'node:assert/strict';
import { eventsToCsv, generateMarkdownReport, filterEventsByDateRange, validateImportPayload } from './export-helpers';
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

test('filterEventsByDateRange accurately filters events by date range cutoff', () => {
  const refDate = new Date('2026-11-18T12:00:00Z');
  const now = refDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const events: ViewingEvent[] = [
    {
      eventId: 'evt-today',
      platform: 'youtube',
      contentType: 'short',
      contentId: 'yt-1',
      creatorName: 'A',
      watchSeconds: 10,
      startedAt: now - 1 * dayMs,
      detectionConfidence: 'high',
    },
    {
      eventId: 'evt-10d',
      platform: 'instagram',
      contentType: 'reel',
      contentId: 'ig-1',
      creatorName: 'B',
      watchSeconds: 20,
      startedAt: now - 10 * dayMs,
      detectionConfidence: 'high',
    },
    {
      eventId: 'evt-40d',
      platform: 'tiktok',
      contentType: 'video',
      contentId: 'tt-1',
      creatorName: 'C',
      watchSeconds: 30,
      startedAt: now - 40 * dayMs,
      detectionConfidence: 'high',
    },
  ];

  assert.equal(filterEventsByDateRange(events, 'all', refDate).length, 3);
  assert.equal(filterEventsByDateRange(events, '7d', refDate).length, 1);
  assert.equal(filterEventsByDateRange(events, '30d', refDate).length, 2);
  assert.equal(filterEventsByDateRange(events, '90d', refDate).length, 3);
});

test('validateImportPayload validates valid JSON backup and rejects invalid schemas', () => {
  // 1. Valid plaintext payload array
  const validArray = [
    { platform: 'youtube', startedAt: 1700000000000, watchSeconds: 30, creatorName: 'Test' },
    { platform: 'instagram', startedAt: 1700000050000, watchSeconds: 60, creatorName: 'Test2' },
  ];
  const resArray = validateImportPayload(validArray);
  assert.equal(resArray.isValid, true);
  assert.equal(resArray.count, 2);
  assert.equal(resArray.data?.length, 2);

  // 2. Valid payload object format with events array
  const validObject = {
    privacyMode: 'local-first',
    events: validArray,
  };
  const resObj = validateImportPayload(validObject);
  assert.equal(resObj.isValid, true);
  assert.equal(resObj.count, 2);

  // 3. Valid encrypted payload format
  const validEncrypted = {
    isEncrypted: true,
    totalRecords: 15,
    encryptedData: {
      ciphertext: 'abc==',
      iv: 'def==',
      salt: 'ghi==',
    },
  };
  const resEnc = validateImportPayload(validEncrypted);
  assert.equal(resEnc.isValid, true);
  assert.equal(resEnc.isEncrypted, true);
  assert.equal(resEnc.count, 15);

  // 4. Invalid non-object
  assert.equal(validateImportPayload(null).isValid, false);
  assert.equal(validateImportPayload('random string').isValid, false);

  // 5. Missing events or corrupted platform
  const invalidPlatform = [{ platform: 'unknown-platform', startedAt: 123456 }];
  const resInvalidPlatform = validateImportPayload(invalidPlatform);
  assert.equal(resInvalidPlatform.isValid, false);
  assert.ok(resInvalidPlatform.error?.includes('Invalid platform'));

  // 6. Corrupted encrypted payload missing salt
  const corruptedEnc = {
    isEncrypted: true,
    encryptedData: { ciphertext: 'abc==' },
  };
  assert.equal(validateImportPayload(corruptedEnc).isValid, false);
});



