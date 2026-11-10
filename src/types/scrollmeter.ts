export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'facebook';

export interface ViewingEvent {
  eventId: string;
  platform: Platform;
  contentType: 'short' | 'reel' | 'video';
  contentId: string;
  contentUrl?: string;
  title?: string;
  creatorId?: string;
  creatorName: string;
  creatorAvatar?: string;
  thumbnailUrl?: string;
  startedAt: number; // timestamp ms
  watchSeconds: number;
  detectionConfidence: 'high' | 'medium';
}

export interface UserSettings {
  trackingPaused: boolean;
  enabledPlatforms: Record<Platform, boolean>;
  viewThresholdSeconds: number; // default: 2
  dailyReportEnabled: boolean;
  dailyReportTime: string; // "21:00"
  inPageIndicatorEnabled: boolean;
  inPageIndicatorPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  retentionDays: number; // 7, 30, 90, 0 (forever)
  storageBackend: 'indexeddb' | 'chrome_storage_local';
  encryptionEnabled: boolean;
  cloudSyncEnabled: boolean; // default: false (strictly opt-in)
  encryptionPassphraseSet?: boolean;
  lastExportDate?: string;
}

export interface DailySummary {
  dateStr: string; // YYYY-MM-DD
  total: number;
  estimatedSeconds: number;
  uniqueCreatorsCount: number;
  platformBreakdown: Record<Platform, number>;
  trendVsLastWeekPercent: number;
}

export interface CreatorSummary {
  creatorName: string;
  creatorAvatar?: string;
  totalViews: number;
  totalSeconds: number;
  platforms: Platform[];
  recentTitle?: string;
  latestWatchedAt: number;
}

export interface WeeklyTrendDay {
  dayName: string; // 'Mon', 'Tue', 'Wed', etc.
  dateStr: string;
  count: number;
  isToday?: boolean;
  isPeak?: boolean;
}

export interface PlatformTimeBreakdown {
  platform: Platform;
  label: string;
  count: number;
  seconds: number;
  hours: number;
  percentage: number;
}

export interface TimeframeAnalytics {
  timeframe: 'day' | 'week' | 'month';
  title: string;
  subtitle: string;
  totalSeconds: number;
  totalHours: number;
  totalReels: number;
  hoursLostText: string;
  watchTimeFormatted: string;
  wakingHoursLostPercent: number;
  avgDailySeconds: number;
  avgDailyHours: number;
  avgDailyFormatted: string;
  avgDailyReels: number;
  activeDaysCount: number;
  equivalentActivity: {
    podcasts: number;
    bookPages: number;
    workouts: number;
  };
  platformBreakdown: PlatformTimeBreakdown[];
  peakDay?: {
    dayName: string;
    dateStr: string;
    count: number;
    hours: number;
    formattedTime: string;
  };
  lowestDay?: {
    dayName: string;
    dateStr: string;
    count: number;
    hours: number;
    formattedTime: string;
  };
  weeklyDays?: {
    dayName: string;
    dateStr: string;
    count: number;
    seconds: number;
    hours: number;
    isToday: boolean;
    isPeak: boolean;
  }[];
  monthlyWeeks?: {
    weekLabel: string;
    count: number;
    seconds: number;
    hours: number;
  }[];
  trendVsPreviousPercent: number;
}

export interface WellbeingMilestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progressPercent: number;
}

export interface WellbeingStreakSummary {
  currentStreakDays: number;
  longestStreakDays: number;
  totalDaysMonitored: number;
  mindfulDaysCount: number;
  milestones: WellbeingMilestone[];
}


