import { 
  ViewingEvent, 
  Platform, 
  DailySummary, 
  CreatorSummary, 
  WeeklyTrendDay,
  TimeframeAnalytics,
  PlatformTimeBreakdown,
  WellbeingMilestone,
  WellbeingStreakSummary,
  HourlyActivityPoint,
  DiversityMetrics,
  SessionVelocityMetrics,
  BurnoutRiskMetrics,
  PlatformParityRatio
} from '../types/scrollmeter';

const dateKeyCache = new Map<number, string>();
const MAX_DATE_KEY_CACHE = 1000;

/**
 * Normalises a date to 'YYYY-MM-DD' with caching for numeric timestamps
 */
export function toDateKey(date: Date | number): string {
  if (typeof date === 'number') {
    const cached = dateKeyCache.get(date);
    if (cached) return cached;
  }
  const d = typeof date === 'number' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const result = `${year}-${month}-${day}`;

  if (typeof date === 'number') {
    if (dateKeyCache.size >= MAX_DATE_KEY_CACHE) {
      dateKeyCache.clear();
    }
    dateKeyCache.set(date, result);
  }
  return result;
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

    // Pre-index events by day to avoid O(N * 7) scanning
    const eventsByDay = new Map<string, ViewingEvent[]>();
    for (const e of events) {
      const key = toDateKey(e.startedAt);
      const list = eventsByDay.get(key);
      if (list) {
        list.push(e);
      } else {
        eventsByDay.set(key, [e]);
      }
    }

    let maxDayCount = -1;
    let minDayCount = Infinity;
    let peakDayIdx = 0;
    let lowestDayIdx = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const k = toDateKey(d);

      const dayEvents = eventsByDay.get(k) || [];
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

/**
 * Computes wellbeing streak metrics and unlocked milestone badges
 */
export function calculateWellbeingStreaks(
  events: ViewingEvent[],
  refDate: Date = new Date(),
  dailyGoalSeconds: number = 1800 // default 30 min limit
): WellbeingStreakSummary {
  const dayMap = new Map<string, number>();

  for (const e of events) {
    const k = toDateKey(e.startedAt);
    dayMap.set(k, (dayMap.get(k) || 0) + (e.watchSeconds || 0));
  }

  const sortedDates = Array.from(dayMap.keys()).sort();
  const totalDaysMonitored = sortedDates.length;

  let mindfulDaysCount = 0;
  for (const [, secs] of dayMap.entries()) {
    if (secs <= dailyGoalSeconds) {
      mindfulDaysCount++;
    }
  }

  let currentStreakDays = 0;
  let checkDate = new Date(refDate);

  const todayKey = toDateKey(checkDate);
  if (!dayMap.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (dayMap.has(toDateKey(checkDate))) {
    currentStreakDays++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let longestStreakDays = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);

    if (prevDate) {
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    if (tempStreak > longestStreakDays) {
      longestStreakDays = tempStreak;
    }
    prevDate = currentDate;
  }

  longestStreakDays = Math.max(longestStreakDays, currentStreakDays);

  const milestones: WellbeingMilestone[] = [
    {
      id: 'first-step',
      title: 'First Step',
      description: 'Logged your first monitored short-form session',
      icon: 'Footprints',
      unlocked: totalDaysMonitored >= 1,
      progressPercent: Math.min(100, Math.round((totalDaysMonitored / 1) * 100)),
    },
    {
      id: 'mindful-starter',
      title: 'Mindful Starter',
      description: '3 days keeping scroll time under 30 minutes',
      icon: 'HeartHandshake',
      unlocked: mindfulDaysCount >= 3,
      progressPercent: Math.min(100, Math.round((mindfulDaysCount / 3) * 100)),
    },
    {
      id: 'habit-builder',
      title: 'Habit Builder',
      description: 'Maintained a 7-day tracking streak',
      icon: 'Flame',
      unlocked: longestStreakDays >= 7,
      progressPercent: Math.min(100, Math.round((longestStreakDays / 7) * 100)),
    },
    {
      id: 'zen-master',
      title: 'Zen Master',
      description: 'Accumulated 10 mindful days under daily goal',
      icon: 'Sparkles',
      unlocked: mindfulDaysCount >= 10,
      progressPercent: Math.min(100, Math.round((mindfulDaysCount / 10) * 100)),
    },
  ];

  return {
    currentStreakDays,
    longestStreakDays,
    totalDaysMonitored,
    mindfulDaysCount,
    milestones,
  };
}

/**
 * Calculates distribution of viewing events across 24 hours of the day
 */
export function getHourlyDistribution(events: ViewingEvent[]): HourlyActivityPoint[] {
  const totalSeconds = events.reduce((acc, e) => acc + (e.watchSeconds || 0), 0);
  const hoursMap = Array.from({ length: 24 }, () => ({ count: 0, seconds: 0 }));

  for (const e of events) {
    const d = new Date(e.startedAt);
    const hour = d.getHours();
    if (hour >= 0 && hour < 24) {
      hoursMap[hour].count++;
      hoursMap[hour].seconds += e.watchSeconds || 0;
    }
  }

  return hoursMap.map((data, hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const label = `${displayHour} ${period}`;
    const percentage = totalSeconds > 0 ? Number(((data.seconds / totalSeconds) * 100).toFixed(1)) : 0;

    return {
      hour,
      label,
      count: data.count,
      seconds: data.seconds,
      percentage,
    };
  });
}

/**
 * Computes creator diversity index measuring content breadth vs binge-watching
 */
export function calculateCreatorDiversityIndex(events: ViewingEvent[]): DiversityMetrics {
  if (events.length === 0) {
    return {
      score: 100,
      totalCreators: 0,
      dominantCreator: null,
      dominantCreatorShare: 0,
      assessment: 'High (Broad discovery)',
    };
  }

  const creatorMap = new Map<string, number>();
  for (const e of events) {
    const name = e.creatorName || 'Unknown';
    creatorMap.set(name, (creatorMap.get(name) || 0) + 1);
  }

  const total = events.length;
  let dominantCreator: string | null = null;
  let maxCount = 0;
  let sumSquaredShares = 0;

  for (const [name, count] of creatorMap.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantCreator = name;
    }
    const share = count / total;
    sumSquaredShares += share * share;
  }

  // Simpson's Index of Diversity (1 - D): 1 = infinite diversity, 0 = no diversity
  // Normalize to 0 - 100 scale
  const rawScore = Math.max(0, Math.min(100, Math.round((1 - sumSquaredShares) * 100)));
  const dominantShare = Number(((maxCount / total) * 100).toFixed(1));

  let assessment: DiversityMetrics['assessment'] = 'Moderate (Balanced mix)';
  if (rawScore >= 75) {
    assessment = 'High (Broad discovery)';
  } else if (rawScore < 45) {
    assessment = 'Low (Deep binge-watching)';
  }

  return {
    score: rawScore,
    totalCreators: creatorMap.size,
    dominantCreator,
    dominantCreatorShare: dominantShare,
    assessment,
  };
}

/**
 * Evaluates binge-watching sessions and viewing velocity (reels/hour)
 */
export function calculateSessionVelocity(
  events: ViewingEvent[],
  sessionGapMinutes: number = 10
): SessionVelocityMetrics {
  if (events.length === 0) {
    return {
      totalSessions: 0,
      avgSessionSeconds: 0,
      longestSessionSeconds: 0,
      reelsPerHourVelocity: 0,
    };
  }

  const sorted = [...events].sort((a, b) => a.startedAt - b.startedAt);
  const gapMs = sessionGapMinutes * 60 * 1000;

  const sessionDurations: number[] = [];
  let currentSessionSeconds = sorted[0].watchSeconds || 0;
  let lastEventTime = sorted[0].startedAt;

  for (let i = 1; i < sorted.length; i++) {
    const ev = sorted[i];
    const diff = ev.startedAt - lastEventTime;

    if (diff <= gapMs) {
      currentSessionSeconds += ev.watchSeconds || 0;
    } else {
      sessionDurations.push(currentSessionSeconds);
      currentSessionSeconds = ev.watchSeconds || 0;
    }
    lastEventTime = ev.startedAt;
  }
  sessionDurations.push(currentSessionSeconds);

  const totalSessions = sessionDurations.length;
  const totalWatchSec = sessionDurations.reduce((acc, s) => acc + s, 0);
  const avgSessionSeconds = Math.round(totalWatchSec / totalSessions);
  const longestSessionSeconds = Math.max(...sessionDurations);

  const totalHours = totalWatchSec / 3600;
  const reelsPerHourVelocity =
    totalHours > 0 ? Number((events.length / totalHours).toFixed(1)) : 0;

  return {
    totalSessions,
    avgSessionSeconds,
    longestSessionSeconds,
    reelsPerHourVelocity,
  };
}

/**
 * Calculates digital wellbeing burnout risk score based on night-time use, velocity, and duration
 */
export function calculateBurnoutRisk(events: ViewingEvent[]): BurnoutRiskMetrics {
  if (events.length === 0) {
    return {
      score: 0,
      level: 'Low',
      nightOwlMinutes: 0,
      factors: ['No short-form video consumption recorded.'],
    };
  }

  let totalWatchSec = 0;
  let nightWatchSec = 0;
  const factors: string[] = [];

  for (const e of events) {
    const sec = e.watchSeconds || 0;
    totalWatchSec += sec;
    const hour = new Date(e.startedAt).getHours();
    if (hour >= 23 || hour < 5) {
      nightWatchSec += sec;
    }
  }

  const totalHours = totalWatchSec / 3600;
  const nightOwlMinutes = Math.round(nightWatchSec / 60);

  let score = 0;

  if (totalHours > 3) {
    score += 40;
    factors.push('High volume (>3 hours total watch time)');
  } else if (totalHours > 1.5) {
    score += 25;
    factors.push('Moderate volume (>1.5 hours total watch time)');
  } else {
    score += 10;
  }

  if (nightOwlMinutes > 45) {
    score += 40;
    factors.push(`Significant night doomscrolling (${nightOwlMinutes}m between 11PM-5AM)`);
  } else if (nightOwlMinutes > 15) {
    score += 20;
    factors.push(`Late night browsing detected (${nightOwlMinutes}m)`);
  }

  if (events.length > 50) {
    score += 20;
    factors.push('Excessive rapid video switching (>50 videos)');
  } else if (events.length > 25) {
    score += 10;
  }

  score = Math.min(100, score);

  let level: BurnoutRiskMetrics['level'] = 'Low';
  if (score >= 75) {
    level = 'Severe';
  } else if (score >= 50) {
    level = 'High';
  } else if (score >= 25) {
    level = 'Moderate';
  }

  if (factors.length === 0) {
    factors.push('Healthy, controlled viewing patterns.');
  }

  return {
    score,
    level,
    nightOwlMinutes,
    factors,
  };
}

/**
 * Calculates platform parity ratio (how balanced viewing time is across platforms).
 * Returns a score (0-100), dominant platform, dominant share %, and status classification.
 */
export function calculatePlatformParity(events: ViewingEvent[]): PlatformParityRatio {
  if (!events || events.length === 0) {
    return {
      score: 100,
      dominantPlatform: null,
      dominantPlatformShare: 0,
      status: 'Balanced',
    };
  }

  const platformSeconds: Record<Platform, number> = {
    youtube: 0,
    instagram: 0,
    tiktok: 0,
    facebook: 0,
  };

  let totalSeconds = 0;
  for (const e of events) {
    const p = e.platform || 'youtube';
    const s = Math.max(1, e.watchSeconds || 1);
    platformSeconds[p] = (platformSeconds[p] || 0) + s;
    totalSeconds += s;
  }

  if (totalSeconds === 0) {
    return {
      score: 100,
      dominantPlatform: null,
      dominantPlatformShare: 0,
      status: 'Balanced',
    };
  }

  let dominantPlatform: Platform = 'youtube';
  let maxSeconds = 0;

  for (const [platform, sec] of Object.entries(platformSeconds) as [Platform, number][]) {
    if (sec > maxSeconds) {
      maxSeconds = sec;
      dominantPlatform = platform;
    }
  }

  const dominantPlatformShare = Math.round((maxSeconds / totalSeconds) * 100);
  const score = Math.max(0, Math.min(100, Math.round(100 - (Math.max(0, dominantPlatformShare - 25) / 75) * 100)));

  let status: PlatformParityRatio['status'] = 'Balanced';
  if (score < 35) {
    status = 'Monopolized';
  } else if (score < 75) {
    status = 'Moderate Skew';
  }

  return {
    score,
    dominantPlatform,
    dominantPlatformShare,
    status,
  };
}






