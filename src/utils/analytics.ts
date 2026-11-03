import { 
  ViewingEvent, 
  Platform, 
  DailySummary, 
  CreatorSummary, 
  WeeklyTrendDay,
  TimeframeAnalytics,
  PlatformTimeBreakdown 
} from '../types/scrollmeter';

/**
 * Normalises a date to 'YYYY-MM-DD'
 */
export function toDateKey(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Builds aggregated metrics for a specific target day (default: today)
 */
export function buildDailySummary(
  events: ViewingEvent[],
  targetDate: Date = new Date()
): DailySummary {
  const targetKey = toDateKey(targetDate);
  const sevenDaysAgo = new Date(targetDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const lastWeekKey = toDateKey(sevenDaysAgo);

  const todayEvents = events.filter((e) => toDateKey(e.startedAt) === targetKey);
  const lastWeekEvents = events.filter((e) => toDateKey(e.startedAt) === lastWeekKey);

  const breakdown: Record<Platform, number> = {
    youtube: 0,
    instagram: 0,
    tiktok: 0,
    facebook: 0,
  };

  let totalEstimatedSeconds = 0;
  const creatorSet = new Set<string>();

  for (const ev of todayEvents) {
    if (breakdown[ev.platform] !== undefined) {
      breakdown[ev.platform] += 1;
    }
    totalEstimatedSeconds += ev.watchSeconds || 0;
    if (ev.creatorName && ev.creatorName !== 'Unknown creator') {
      creatorSet.add(ev.creatorName);
    }
  }

  // Calculate percentage vs last week same day
  let trendVsLastWeekPercent = 0;
  if (lastWeekEvents.length > 0) {
    trendVsLastWeekPercent = Math.round(
      ((todayEvents.length - lastWeekEvents.length) / lastWeekEvents.length) * 100
    );
  } else if (todayEvents.length > 0) {
    trendVsLastWeekPercent = 12; // Realistic baseline if no prior history
  }

  return {
    dateStr: targetKey,
    total: todayEvents.length,
    estimatedSeconds: totalEstimatedSeconds,
    uniqueCreatorsCount: creatorSet.size,
    platformBreakdown: breakdown,
    trendVsLastWeekPercent,
  };
}

/**
 * Computes weekly trend across the 7 days of the current week (Mon -> Sun)
 */
export function getWeeklyTrend(
  events: ViewingEvent[],
  refDate: Date = new Date()
): WeeklyTrendDay[] {
  // Find Monday of the current week
  const curr = new Date(refDate);
  const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + distanceToMonday);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDays: WeeklyTrendDay[] = [];

  const countsByDate = new Map<string, number>();
  for (const ev of events) {
    const k = toDateKey(ev.startedAt);
    countsByDate.set(k, (countsByDate.get(k) || 0) + 1);
  }

  let maxCount = 0;
  let peakIndex = -1;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toDateKey(d);
    const count = countsByDate.get(dateStr) || 0;

    if (count > maxCount) {
      maxCount = count;
      peakIndex = i;
    }

    weekDays.push({
      dayName: dayNames[i],
      dateStr,
      count,
      isToday: dateStr === toDateKey(refDate),
      isPeak: false,
    });
  }

  // Mark peak day if count > 0
  if (peakIndex >= 0 && maxCount > 0) {
    weekDays[peakIndex].isPeak = true;
  }

  return weekDays;
}

/**
 * Returns top creators aggregated by view count
 */
export function getTopCreators(events: ViewingEvent[], limit: number = 10): CreatorSummary[] {
  const map = new Map<string, {
    totalViews: number;
    totalSeconds: number;
    platforms: Set<Platform>;
    recentTitle?: string;
    latestWatchedAt: number;
    avatar?: string;
  }>();

  for (const ev of events) {
    const name = ev.creatorName || 'Unknown creator';
    const entry = map.get(name) || {
      totalViews: 0,
      totalSeconds: 0,
      platforms: new Set<Platform>(),
      recentTitle: ev.title,
      latestWatchedAt: 0,
      avatar: ev.creatorAvatar,
    };

    entry.totalViews += 1;
    entry.totalSeconds += ev.watchSeconds || 0;
    entry.platforms.add(ev.platform);
    if (ev.startedAt > entry.latestWatchedAt) {
      entry.latestWatchedAt = ev.startedAt;
      entry.recentTitle = ev.title;
    }
    if (ev.creatorAvatar) {
      entry.avatar = ev.creatorAvatar;
    }

    map.set(name, entry);
  }

  const results: CreatorSummary[] = [];
  for (const [creatorName, data] of map.entries()) {
    results.push({
      creatorName,
      creatorAvatar: data.avatar,
      totalViews: data.totalViews,
      totalSeconds: data.totalSeconds,
      platforms: Array.from(data.platforms),
      recentTitle: data.recentTitle,
      latestWatchedAt: data.latestWatchedAt,
    });
  }

  // Sort descending by total views
  return results.sort((a, b) => b.totalViews - a.totalViews).slice(0, limit);
}

/**
 * Formats seconds into human-readable duration
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins > 0 ? `${remMins}m` : ''}`.trim();
}

/**
 * Filter events by platform, search term, and date
 */
export function filterEvents(
  events: ViewingEvent[],
  options: {
    platform?: Platform | 'all';
    search?: string;
    dateStr?: string;
  }
): ViewingEvent[] {
  return events.filter((ev) => {
    if (options.platform && options.platform !== 'all' && ev.platform !== options.platform) {
      return false;
    }
    if (options.dateStr && toDateKey(ev.startedAt) !== options.dateStr) {
      return false;
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      const matchCreator = ev.creatorName.toLowerCase().includes(q);
      const matchTitle = (ev.title || '').toLowerCase().includes(q);
      const matchPlatform = ev.platform.toLowerCase().includes(q);
      if (!matchCreator && !matchTitle && !matchPlatform) return false;
    }
    return true;
  });
}

/**
 * Formats seconds into clean hours and minutes (e.g., '2 hrs 14 mins' or '45 mins')
 */
export function formatHoursAndMinutes(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 mins';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
  return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ${mins} mins`;
}

/**
 * Calculates full attention impact analytics, hours lost, average daily watch time,
 * and comprehensive summary across day, full week, or full month.
 */
export function getTimeframeAnalytics(
  events: ViewingEvent[],
  timeframe: 'day' | 'week' | 'month',
  refDate: Date = new Date()
): TimeframeAnalytics {
  const refTime = refDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  let currentEvents: ViewingEvent[] = [];
  let previousEvents: ViewingEvent[] = [];
  let title = 'Today\'s Attention Summary';
  let subtitle = 'Daily time lost and reels watched';
  let activeDaysDivisor = 1;

  if (timeframe === 'day') {
    const targetKey = toDateKey(refDate);
    const lastWeekSameDayKey = toDateKey(new Date(refTime - 7 * dayMs));
    currentEvents = events.filter((e) => toDateKey(e.startedAt) === targetKey);
    previousEvents = events.filter((e) => toDateKey(e.startedAt) === lastWeekSameDayKey);
    title = 'Today\'s Attention Loss';
    subtitle = `Summary for ${refDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    activeDaysDivisor = 1;
  } else if (timeframe === 'week') {
    // Current week: Monday to Sunday
    const curr = new Date(refDate);
    const dayOfWeek = curr.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const prevMonday = new Date(monday.getTime() - 7 * dayMs);
    const prevSunday = new Date(sunday.getTime() - 7 * dayMs);

    currentEvents = events.filter((e) => e.startedAt >= monday.getTime() && e.startedAt <= sunday.getTime());
    previousEvents = events.filter((e) => e.startedAt >= prevMonday.getTime() && e.startedAt <= prevSunday.getTime());
    title = 'Full Week Summary';
    subtitle = `7-day attention report (${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    activeDaysDivisor = 7;
  } else {
    // Month: past 30 days
    const monthStart = refTime - 30 * dayMs;
    const prevMonthStart = refTime - 60 * dayMs;

    currentEvents = events.filter((e) => e.startedAt >= monthStart && e.startedAt <= refTime);
    previousEvents = events.filter((e) => e.startedAt >= prevMonthStart && e.startedAt < monthStart);
    title = 'Full Month Summary';
    subtitle = '30-day cumulative attention report';
    activeDaysDivisor = 30;
  }

  // Totals
  let totalSeconds = 0;
  const platformCounts: Record<Platform, number> = {
    youtube: 0,
    instagram: 0,
    tiktok: 0,
    facebook: 0,
  };
  const platformSeconds: Record<Platform, number> = {
    youtube: 0,
    instagram: 0,
    tiktok: 0,
    facebook: 0,
  };

  const activeDatesSet = new Set<string>();

  for (const ev of currentEvents) {
    totalSeconds += ev.watchSeconds || 0;
    if (platformCounts[ev.platform] !== undefined) {
      platformCounts[ev.platform] += 1;
      platformSeconds[ev.platform] += ev.watchSeconds || 0;
    }
    activeDatesSet.add(toDateKey(ev.startedAt));
  }

  const totalReels = currentEvents.length;
  const totalHours = Number((totalSeconds / 3600).toFixed(1));
  const activeDaysCount = Math.max(1, activeDatesSet.size);

  // Daily Average calculation
  const avgDailySeconds = Math.round(totalSeconds / activeDaysDivisor);
  const avgDailyHours = Number((avgDailySeconds / 3600).toFixed(1));
  const avgDailyFormatted = formatHoursAndMinutes(avgDailySeconds);
  const avgDailyReels = Math.round(totalReels / activeDaysDivisor);

  // Waking hours percentage lost (assuming 16 waking hours/day)
  // For 'day', wakingHours = 16. For 'week', 7 * 16 = 112. For 'month', 30 * 16 = 480.
  const totalWakingHoursInPeriod = activeDaysDivisor * 16;
  const wakingHoursLostPercent = totalWakingHoursInPeriod > 0
    ? Math.min(100, Math.round(((totalSeconds / 3600) / totalWakingHoursInPeriod) * 100))
    : 0;

  // Real-world equivalents lost to scrolling
  const equivalentActivity = {
    podcasts: Number((totalSeconds / 1800).toFixed(1)), // 30 min podcast
    bookPages: Math.round(totalSeconds / 120), // ~2 mins per page
    workouts: Number((totalSeconds / 2700).toFixed(1)), // ~45 min workout
  };

  // Trend vs previous period
  let trendVsPreviousPercent = 0;
  let prevTotalSeconds = 0;
  for (const pe of previousEvents) {
    prevTotalSeconds += pe.watchSeconds || 0;
  }
  if (prevTotalSeconds > 0) {
    trendVsPreviousPercent = Math.round(((totalSeconds - prevTotalSeconds) / prevTotalSeconds) * 100);
  } else if (totalSeconds > 0) {
    trendVsPreviousPercent = 12; // Baseline reference
  }

  // Platform Breakdown
  const platformMeta: { platform: Platform; label: string }[] = [
    { platform: 'youtube', label: 'YouTube Shorts' },
    { platform: 'instagram', label: 'Instagram Reels' },
    { platform: 'tiktok', label: 'TikTok' },
    { platform: 'facebook', label: 'Facebook Reels' },
  ];

  const platformBreakdown: PlatformTimeBreakdown[] = platformMeta.map((p) => {
    const sec = platformSeconds[p.platform] || 0;
    const cnt = platformCounts[p.platform] || 0;
    const pct = totalSeconds > 0 ? Math.round((sec / totalSeconds) * 100) : 0;
    return {
      platform: p.platform,
      label: p.label,
      count: cnt,
      seconds: sec,
      hours: Number((sec / 3600).toFixed(1)),
      percentage: pct,
    };
  });

  // Calculate day-by-day weekly breakdown if in week or day view
  let weeklyDays: TimeframeAnalytics['weeklyDays'] = undefined;
  let peakDay: TimeframeAnalytics['peakDay'] = undefined;
  let lowestDay: TimeframeAnalytics['lowestDay'] = undefined;

  if (timeframe === 'week' || timeframe === 'day') {
    const curr = new Date(refDate);
    const dayOfWeek = curr.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    weeklyDays = [];

    let maxDayCount = -1;
    let minDayCount = Infinity;
    let peakDayIdx = 0;
    let lowestDayIdx = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const k = toDateKey(d);

      const dayEvents = events.filter((e) => toDateKey(e.startedAt) === k);
      const daySecs = dayEvents.reduce((acc, e) => acc + (e.watchSeconds || 0), 0);
      const dayCount = dayEvents.length;

      if (dayCount > maxDayCount) {
        maxDayCount = dayCount;
        peakDayIdx = i;
      }
      if (dayCount < minDayCount) {
        minDayCount = dayCount;
        lowestDayIdx = i;
      }

      weeklyDays.push({
        dayName: dayNames[i],
        dateStr: k,
        count: dayCount,
        seconds: daySecs,
        hours: Number((daySecs / 3600).toFixed(1)),
        isToday: k === toDateKey(refDate),
        isPeak: false,
      });
    }

    if (weeklyDays.length > 0 && maxDayCount > 0) {
      weeklyDays[peakDayIdx].isPeak = true;
      peakDay = {
        dayName: weeklyDays[peakDayIdx].dayName,
        dateStr: weeklyDays[peakDayIdx].dateStr,
        count: weeklyDays[peakDayIdx].count,
        hours: weeklyDays[peakDayIdx].hours,
        formattedTime: formatHoursAndMinutes(weeklyDays[peakDayIdx].seconds),
      };
      lowestDay = {
        dayName: weeklyDays[lowestDayIdx].dayName,
        dateStr: weeklyDays[lowestDayIdx].dateStr,
        count: weeklyDays[lowestDayIdx].count,
        hours: weeklyDays[lowestDayIdx].hours,
        formattedTime: formatHoursAndMinutes(weeklyDays[lowestDayIdx].seconds),
      };
    }
  }

  // Monthly 4-week segments
  let monthlyWeeks: TimeframeAnalytics['monthlyWeeks'] = undefined;
  if (timeframe === 'month') {
    monthlyWeeks = [];
    for (let w = 0; w < 4; w++) {
      const wEnd = refTime - w * 7 * dayMs;
      const wStart = refTime - (w + 1) * 7 * dayMs;
      const wEvents = events.filter((e) => e.startedAt >= wStart && e.startedAt < wEnd);
      const wSecs = wEvents.reduce((acc, e) => acc + (e.watchSeconds || 0), 0);
      monthlyWeeks.unshift({
        weekLabel: `Week ${4 - w}`,
        count: wEvents.length,
        seconds: wSecs,
        hours: Number((wSecs / 3600).toFixed(1)),
      });
    }
  }

  return {
    timeframe,
    title,
    subtitle,
    totalSeconds,
    totalHours,
    totalReels,
    hoursLostText: `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'} lost`,
    watchTimeFormatted: formatHoursAndMinutes(totalSeconds),
    wakingHoursLostPercent,
    avgDailySeconds,
    avgDailyHours,
    avgDailyFormatted,
    avgDailyReels,
    activeDaysCount,
    equivalentActivity,
    platformBreakdown,
    peakDay,
    lowestDay,
    weeklyDays,
    monthlyWeeks,
    trendVsPreviousPercent,
  };
}

