import test from 'node:test';
import assert from 'node:assert/strict';
import { createViewingEvent, isDuplicateEvent } from './event-normaliser';
import { 
  buildDailySummary, 
  getWeeklyTrend, 
  getTopCreators, 
  formatDuration, 
  formatHoursAndMinutes,
  getTimeframeAnalytics,
  calculateWellbeingStreaks,
  getHourlyDistribution,
  calculateCreatorDiversityIndex,
  calculateSessionVelocity,
  calculateBurnoutRisk,
  toDateKey 
} from './analytics';
import { ViewingEvent } from '../types/scrollmeter';

test('createViewingEvent normalises attributes and handles unknown creator', () => {
  const ev1 = createViewingEvent({
    platform: 'youtube',
    contentId: 'abc123xyz',
    creatorName: 'MrBeast',
    watchSeconds: 15,
  });

  assert.equal(ev1.platform, 'youtube');
  assert.equal(ev1.contentType, 'short');
  assert.equal(ev1.creatorName, 'MrBeast');
  assert.equal(ev1.contentUrl, 'https://www.youtube.com/shorts/abc123xyz');
  assert.equal(ev1.watchSeconds, 15);

  const ev2 = createViewingEvent({
    platform: 'instagram',
    contentId: 'ig999',
    creatorName: '', // empty
    watchSeconds: 3,
  });
  assert.equal(ev2.creatorName, 'Unknown creator');
  assert.equal(ev2.contentType, 'reel');
  assert.equal(ev2.contentUrl, 'https://www.instagram.com/reel/ig999/');
});

test('isDuplicateEvent detects existing events within dedupe window', () => {
  const now = Date.now();
  const events: ViewingEvent[] = [
    createViewingEvent({
      platform: 'youtube',
      contentId: 'vid1',
      startedAt: now - 30000, // 30s ago
    }),
  ];

  // Duplicate candidate
  assert.equal(isDuplicateEvent(events, 'youtube', 'vid1', 60000), true);

  // Different platform
  assert.equal(isDuplicateEvent(events, 'tiktok', 'vid1', 60000), false);

  // Different ID
  assert.equal(isDuplicateEvent(events, 'youtube', 'vid2', 60000), false);

  // Outside dedupe window (10s window vs 30s old event)
  assert.equal(isDuplicateEvent(events, 'youtube', 'vid1', 10000), false);
});

test('buildDailySummary accurately calculates totals and platform breakdown', () => {
  const today = new Date();
  const todayMs = today.getTime();

  const events: ViewingEvent[] = [
    createViewingEvent({ platform: 'youtube', contentId: 'y1', creatorName: 'MrBeast', startedAt: todayMs, watchSeconds: 10 }),
    createViewingEvent({ platform: 'youtube', contentId: 'y2', creatorName: 'Dude Perfect', startedAt: todayMs, watchSeconds: 20 }),
    createViewingEvent({ platform: 'instagram', contentId: 'i1', creatorName: 'MrBeast', startedAt: todayMs, watchSeconds: 15 }),
    createViewingEvent({ platform: 'tiktok', contentId: 't1', creatorName: 'Zach King', startedAt: todayMs, watchSeconds: 5 }),
    createViewingEvent({ platform: 'facebook', contentId: 'f1', creatorName: 'Tasty', startedAt: todayMs, watchSeconds: 12 }),
  ];

  const summary = buildDailySummary(events, today);

  assert.equal(summary.total, 5);
  assert.equal(summary.platformBreakdown.youtube, 2);
  assert.equal(summary.platformBreakdown.instagram, 1);
  assert.equal(summary.platformBreakdown.tiktok, 1);
  assert.equal(summary.platformBreakdown.facebook, 1);
  assert.equal(summary.estimatedSeconds, 62);
  // Unique creators: MrBeast, Dude Perfect, Zach King, Tasty = 4
  assert.equal(summary.uniqueCreatorsCount, 4);
});

test('getTopCreators aggregates counts and sorts descending', () => {
  const events: ViewingEvent[] = [
    createViewingEvent({ platform: 'youtube', contentId: 'y1', creatorName: 'MrBeast' }),
    createViewingEvent({ platform: 'youtube', contentId: 'y2', creatorName: 'MrBeast' }),
    createViewingEvent({ platform: 'tiktok', contentId: 't1', creatorName: 'MrBeast' }),
    createViewingEvent({ platform: 'instagram', contentId: 'i1', creatorName: 'Tech Burner' }),
    createViewingEvent({ platform: 'youtube', contentId: 'y3', creatorName: 'Dude Perfect' }),
    createViewingEvent({ platform: 'youtube', contentId: 'y4', creatorName: 'Dude Perfect' }),
  ];

  const top = getTopCreators(events, 5);
  assert.equal(top[0].creatorName, 'MrBeast');
  assert.equal(top[0].totalViews, 3);
  assert.equal(top[1].creatorName, 'Dude Perfect');
  assert.equal(top[1].totalViews, 2);
  assert.equal(top[2].creatorName, 'Tech Burner');
  assert.equal(top[2].totalViews, 1);
});

test('formatDuration formats seconds accurately', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(45), '45s');
  assert.equal(formatDuration(120), '2m');
  assert.equal(formatDuration(1860), '31m');
  assert.equal(formatDuration(3665), '1h 1m');
});

test('formatHoursAndMinutes formats hours and minutes clearly', () => {
  assert.equal(formatHoursAndMinutes(0), '0 mins');
  assert.equal(formatHoursAndMinutes(1800), '30 mins');
  assert.equal(formatHoursAndMinutes(3600), '1 hr');
  assert.equal(formatHoursAndMinutes(7200), '2 hrs');
  assert.equal(formatHoursAndMinutes(8640), '2 hrs 24 mins');
});

test('getTimeframeAnalytics correctly computes hours lost and averages across day, week and month', () => {
  const refDate = new Date();
  const now = refDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const events: ViewingEvent[] = [
    // Today: 2 YouTube events (total 3600s = 1 hr)
    createViewingEvent({ platform: 'youtube', contentId: 'today1', creatorName: 'MrBeast', startedAt: now, watchSeconds: 1800 }),
    createViewingEvent({ platform: 'instagram', contentId: 'today2', creatorName: 'Khaby Lame', startedAt: now, watchSeconds: 1800 }),
    // 2 days ago: 1 TikTok event (1800s)
    createViewingEvent({ platform: 'tiktok', contentId: 'past1', creatorName: 'Zach King', startedAt: now - 2 * dayMs, watchSeconds: 1800 }),
    // 15 days ago: 1 Facebook event (3600s)
    createViewingEvent({ platform: 'facebook', contentId: 'past2', creatorName: 'Tasty', startedAt: now - 15 * dayMs, watchSeconds: 3600 }),
  ];

  // 1. Day timeframe
  const dayAnalytics = getTimeframeAnalytics(events, 'day', refDate);
  assert.equal(dayAnalytics.totalReels, 2);
  assert.equal(dayAnalytics.totalSeconds, 3600);
  assert.equal(dayAnalytics.totalHours, 1.0);
  assert.equal(dayAnalytics.hoursLostText, '1 hour lost');
  assert.equal(dayAnalytics.avgDailySeconds, 3600);

  // 2. Month timeframe (all 4 events fall in 30d)
  const monthAnalytics = getTimeframeAnalytics(events, 'month', refDate);
  assert.equal(monthAnalytics.totalReels, 4);
  assert.equal(monthAnalytics.totalSeconds, 9000);
  assert.equal(monthAnalytics.totalHours, 2.5);
  assert.equal(monthAnalytics.platformBreakdown.length, 4);
});

test('calculateWellbeingStreaks accurately evaluates current streaks and milestone completion', () => {
  const refDate = new Date();
  const now = refDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const events: ViewingEvent[] = [
    // Today: 600s
    createViewingEvent({ platform: 'youtube', contentId: 's1', creatorName: 'CreatorA', startedAt: now, watchSeconds: 600 }),
    // Yesterday: 900s
    createViewingEvent({ platform: 'instagram', contentId: 's2', creatorName: 'CreatorB', startedAt: now - 1 * dayMs, watchSeconds: 900 }),
    // 2 days ago: 1200s
    createViewingEvent({ platform: 'tiktok', contentId: 's3', creatorName: 'CreatorC', startedAt: now - 2 * dayMs, watchSeconds: 1200 }),
  ];

  const streaks = calculateWellbeingStreaks(events, refDate, 1800);
  assert.equal(streaks.currentStreakDays, 3);
  assert.equal(streaks.longestStreakDays, 3);
  assert.equal(streaks.mindfulDaysCount, 3);
  assert.equal(streaks.totalDaysMonitored, 3);

  // Check milestones
  const firstStep = streaks.milestones.find((m) => m.id === 'first-step');
  assert.equal(firstStep?.unlocked, true);

  const mindfulStarter = streaks.milestones.find((m) => m.id === 'mindful-starter');
  assert.equal(mindfulStarter?.unlocked, true);
});

test('getHourlyDistribution returns 24 bins and properly aggregates activity', () => {
  const d = new Date();
  d.setHours(14, 30, 0, 0); // 2:30 PM
  const time14 = d.getTime();

  d.setHours(20, 15, 0, 0); // 8:15 PM
  const time20 = d.getTime();

  const events: ViewingEvent[] = [
    createViewingEvent({ platform: 'youtube', contentId: 'h1', creatorName: 'A', startedAt: time14, watchSeconds: 100 }),
    createViewingEvent({ platform: 'youtube', contentId: 'h2', creatorName: 'B', startedAt: time14, watchSeconds: 300 }),
    createViewingEvent({ platform: 'tiktok', contentId: 'h3', creatorName: 'C', startedAt: time20, watchSeconds: 400 }),
  ];

  const hourly = getHourlyDistribution(events);
  assert.equal(hourly.length, 24);
  assert.equal(hourly[14].count, 2);
  assert.equal(hourly[14].seconds, 400);
  assert.equal(hourly[14].label, '2 PM');
  assert.equal(hourly[20].count, 1);
  assert.equal(hourly[20].seconds, 400);
  assert.equal(hourly[20].label, '8 PM');
  assert.equal(hourly[14].percentage, 50);
  assert.equal(hourly[20].percentage, 50);
});

test('calculateCreatorDiversityIndex properly computes diversity score and dominant creator', () => {
  // Scenario 1: Deep binge watching (single creator)
  const bingeEvents: ViewingEvent[] = [
    createViewingEvent({ platform: 'youtube', contentId: 'b1', creatorName: 'MrBeast', startedAt: Date.now() }),
    createViewingEvent({ platform: 'youtube', contentId: 'b2', creatorName: 'MrBeast', startedAt: Date.now() }),
    createViewingEvent({ platform: 'youtube', contentId: 'b3', creatorName: 'MrBeast', startedAt: Date.now() }),
    createViewingEvent({ platform: 'youtube', contentId: 'b4', creatorName: 'MrBeast', startedAt: Date.now() }),
  ];

  const bingeMetrics = calculateCreatorDiversityIndex(bingeEvents);
  assert.equal(bingeMetrics.totalCreators, 1);
  assert.equal(bingeMetrics.dominantCreator, 'MrBeast');
  assert.equal(bingeMetrics.dominantCreatorShare, 100);
  assert.equal(bingeMetrics.score, 0);
  assert.equal(bingeMetrics.assessment, 'Low (Deep binge-watching)');

  // Scenario 2: Broad discovery (diverse creators)
  const diverseEvents: ViewingEvent[] = [
    createViewingEvent({ platform: 'youtube', contentId: 'd1', creatorName: 'Creator 1', startedAt: Date.now() }),
    createViewingEvent({ platform: 'instagram', contentId: 'd2', creatorName: 'Creator 2', startedAt: Date.now() }),
    createViewingEvent({ platform: 'tiktok', contentId: 'd3', creatorName: 'Creator 3', startedAt: Date.now() }),
    createViewingEvent({ platform: 'facebook', contentId: 'd4', creatorName: 'Creator 4', startedAt: Date.now() }),
  ];

  const diverseMetrics = calculateCreatorDiversityIndex(diverseEvents);
  assert.equal(diverseMetrics.totalCreators, 4);
  assert.equal(diverseMetrics.score, 75);
  assert.equal(diverseMetrics.assessment, 'High (Broad discovery)');
});

test('calculateSessionVelocity correctly computes sessions, duration, and velocity', () => {
  const baseTime = 1700000000000;
  const events: ViewingEvent[] = [
    // Session 1: 3 reels back-to-back (2m apart)
    createViewingEvent({ platform: 'youtube', contentId: 'v1', creatorName: 'A', startedAt: baseTime, watchSeconds: 60 }),
    createViewingEvent({ platform: 'youtube', contentId: 'v2', creatorName: 'B', startedAt: baseTime + 2 * 60 * 1000, watchSeconds: 120 }),
    createViewingEvent({ platform: 'youtube', contentId: 'v3', creatorName: 'C', startedAt: baseTime + 4 * 60 * 1000, watchSeconds: 60 }),
    // Gap: 30 minutes later (Session 2)
    createViewingEvent({ platform: 'tiktok', contentId: 'v4', creatorName: 'D', startedAt: baseTime + 35 * 60 * 1000, watchSeconds: 60 }),
  ];

  const metrics = calculateSessionVelocity(events, 10);
  assert.equal(metrics.totalSessions, 2);
  assert.equal(metrics.longestSessionSeconds, 240); // 60 + 120 + 60
  assert.equal(metrics.avgSessionSeconds, 150); // (240 + 60) / 2
  assert.ok(metrics.reelsPerHourVelocity > 0);
});

test('calculateBurnoutRisk evaluates late-night scrolling and classifies severity', () => {
  const dNight = new Date();
  dNight.setHours(2, 0, 0, 0); // 2:00 AM
  const nightTime = dNight.getTime();

  // Create severe night-time doomscrolling profile
  const nightEvents: ViewingEvent[] = Array.from({ length: 30 }, (_, i) =>
    createViewingEvent({
      platform: 'tiktok',
      contentId: `night_${i}`,
      creatorName: 'CreatorX',
      startedAt: nightTime + i * 2 * 60 * 1000,
      watchSeconds: 120, // 30 * 120s = 60 minutes
    })
  );

  const risk = calculateBurnoutRisk(nightEvents);
  assert.ok(risk.nightOwlMinutes >= 50);
  assert.ok(risk.score >= 50);
  assert.ok(risk.level === 'High' || risk.level === 'Severe');
  assert.ok(risk.factors.length > 0);
});





