import React from 'react';
import { motion } from 'motion/react';
import { 
  ViewingEvent, 
  UserSettings, 
  Platform 
} from '../types/scrollmeter';
import { 
  buildDailySummary, 
  getWeeklyTrend, 
  getTopCreators 
} from '../utils/analytics';
import { ScrollMeterLogo, PlatformIcon } from './PlatformIcons';
import { 
  Settings as SettingsIcon, 
  Eye, 
  TrendingUp, 
  Bell, 
  ChevronRight, 
  Home, 
  Users, 
  Clock, 
  ExternalLink 
} from 'lucide-react';

interface ExtensionPopupProps {
  events: ViewingEvent[];
  settings: UserSettings;
  activeTab: 'overview' | 'creators' | 'history' | 'settings';
  onTabChange: (tab: 'overview' | 'creators' | 'history' | 'settings') => void;
  onToggleTracking: () => void;
  onToggleDailyReport: () => void;
  onSelectPlatformFilter?: (platform: Platform | 'all') => void;
  onViewRecentPost?: (event: ViewingEvent) => void;
  onViewDetails?: () => void;
}

export function ExtensionPopup({
  events,
  settings,
  activeTab,
  onTabChange,
  onToggleTracking,
  onToggleDailyReport,
  onSelectPlatformFilter,
  onViewRecentPost,
  onViewDetails,
}: ExtensionPopupProps) {
  const summary = buildDailySummary(events);
  const weeklyTrend = getWeeklyTrend(events);
  const topCreators = getTopCreators(events, 3);
  const recentEvent = events.length > 0 ? events[0] : null;

  // Calculate relative time string for recent event
  const getRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const platformsActiveCount = Object.values(settings.enabledPlatforms).filter(Boolean).length;

  return (
    <div 
      className="w-[380px] h-full max-h-full bg-[#101511] text-slate-100 rounded-3xl border border-[#233125] shadow-2xl overflow-hidden flex flex-col font-sans select-none"
      data-testid="scrollmeter-popup"
    >
      {/* 1. Header (Pinned at top) */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#101511]">
        <div className="flex items-center gap-2.5">
          <ScrollMeterLogo className="w-6 h-6" />
          <span className="font-bold text-[17px] tracking-tight text-white">ScrollMeter</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Tracking status toggle button */}
          <button
            onClick={onToggleTracking}
            title={settings.trackingPaused ? "Click to resume tracking" : "Click to pause tracking"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18231a] hover:bg-[#1e2e21] border border-[#2b3d2d] transition-colors cursor-pointer text-xs"
            aria-label={settings.trackingPaused ? "Resume tracking" : "Pause tracking"}
          >
            <span 
              className={`w-2 h-2 rounded-full ${
                settings.trackingPaused 
                  ? 'bg-amber-400' 
                  : 'bg-[#72f534]'
              }`} 
            />
            <span className={`text-[12px] font-medium ${settings.trackingPaused ? 'text-amber-300' : 'text-[#72f534]'}`}>
              {settings.trackingPaused ? 'Tracking paused' : 'Tracking active'}
            </span>
          </button>

          {/* Settings icon */}
          <button
            onClick={() => onTabChange('settings')}
            className={`p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'text-[#72f534] bg-white/5' : ''
            }`}
            aria-label="Open settings"
          >
            <SettingsIcon className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Main Content Body (Scrollable) */}
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* Section title */}
        <div>
          <h2 className="text-[16px] font-semibold text-slate-200 tracking-tight">
            Your attention, in numbers
          </h2>
        </div>

        {/* Hero Card */}
        <div className="relative bg-[#172219] border border-[#263728] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Eye Icon Circle without glow */}
            <div className="w-12 h-12 rounded-full bg-[#203122] border border-[#2d4630] flex items-center justify-center text-[#72f534]">
              <Eye className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {summary.total}
                </span>
                <span className="text-sm font-medium text-slate-300">
                  Shorts watched
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                across {platformsActiveCount} platforms
              </p>
            </div>
          </div>

          {/* Delta Trend Badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-[#72f534] text-xs font-semibold bg-[#72f534]/10 px-2.5 py-1 rounded-full border border-[#72f534]/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{summary.trendVsLastWeekPercent}%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">vs last week</span>
          </div>
        </div>

        {/* Platform Breakdown 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* YouTube Shorts */}
          <button
            onClick={() => {
              if (onSelectPlatformFilter) onSelectPlatformFilter('youtube');
              onTabChange('history');
            }}
            className="flex items-center justify-between p-3 bg-[#172219] hover:bg-[#1d2b20] border border-[#263728] hover:border-[#38533b] rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PlatformIcon platform="youtube" className="w-6 h-6 shrink-0 shadow-sm" />
              <div className="truncate">
                <div className="text-[11px] text-slate-400 leading-tight">YouTube Shorts</div>
                <div className="text-lg font-bold text-white group-hover:text-[#72f534] transition-colors">
                  {summary.platformBreakdown.youtube}
                </div>
              </div>
            </div>
          </button>

          {/* Instagram Reels */}
          <button
            onClick={() => {
              if (onSelectPlatformFilter) onSelectPlatformFilter('instagram');
              onTabChange('history');
            }}
            className="flex items-center justify-between p-3 bg-[#172219] hover:bg-[#1d2b20] border border-[#263728] hover:border-[#38533b] rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PlatformIcon platform="instagram" className="w-6 h-6 shrink-0 shadow-sm" />
              <div className="truncate">
                <div className="text-[11px] text-slate-400 leading-tight">Instagram Reels</div>
                <div className="text-lg font-bold text-white group-hover:text-[#72f534] transition-colors">
                  {summary.platformBreakdown.instagram}
                </div>
              </div>
            </div>
          </button>

          {/* TikTok */}
          <button
            onClick={() => {
              if (onSelectPlatformFilter) onSelectPlatformFilter('tiktok');
              onTabChange('history');
            }}
            className="flex items-center justify-between p-3 bg-[#172219] hover:bg-[#1d2b20] border border-[#263728] hover:border-[#38533b] rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PlatformIcon platform="tiktok" className="w-6 h-6 shrink-0 shadow-sm" />
              <div className="truncate">
                <div className="text-[11px] text-slate-400 leading-tight">TikTok</div>
                <div className="text-lg font-bold text-white group-hover:text-[#72f534] transition-colors">
                  {summary.platformBreakdown.tiktok}
                </div>
              </div>
            </div>
          </button>

          {/* Facebook Reels */}
          <button
            onClick={() => {
              if (onSelectPlatformFilter) onSelectPlatformFilter('facebook');
              onTabChange('history');
            }}
            className="flex items-center justify-between p-3 bg-[#172219] hover:bg-[#1d2b20] border border-[#263728] hover:border-[#38533b] rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PlatformIcon platform="facebook" className="w-6 h-6 shrink-0 shadow-sm" />
              <div className="truncate">
                <div className="text-[11px] text-slate-400 leading-tight">Facebook Reels</div>
                <div className="text-lg font-bold text-white group-hover:text-[#72f534] transition-colors">
                  {summary.platformBreakdown.facebook}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Your Weekly Trend */}
        <div className="bg-[#172219] border border-[#263728] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-slate-200">
              Your Weekly Trend
            </span>
            <button
              onClick={() => {
                if (onViewDetails) {
                  onViewDetails();
                } else {
                  onTabChange('history');
                }
              }}
              className="text-xs font-medium text-[#72f534] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weekly Bars matching mockup */}
          <div className="flex items-end justify-between gap-2.5 h-24 px-1 pt-6">
            {weeklyTrend.map((day) => {
              const maxCount = Math.max(...weeklyTrend.map((d) => d.count), 70);
              const heightPercent = Math.max(18, Math.round((day.count / maxCount) * 100));

              return (
                <div key={day.dayName} className="flex-1 flex flex-col items-center relative group">
                  {/* Peak badge bubble (Wed 68 from mockup) */}
                  {day.isPeak && (
                    <div className="absolute -top-6 px-1.5 py-0.5 bg-[#72f534] text-[#0e1310] font-bold text-[10px] rounded-full whitespace-nowrap">
                      {day.count}
                    </div>
                  )}

                  {/* Hover tooltip for other days */}
                  {!day.isPeak && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 px-1.5 py-0.5 bg-black/80 text-white text-[10px] rounded transition-opacity pointer-events-none whitespace-nowrap">
                      {day.count}
                    </div>
                  )}

                  {/* Vertical bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[20px] rounded-md transition-all duration-300 ${
                      day.isPeak 
                        ? 'bg-[#72f534]' 
                        : (day.isToday ? 'bg-[#5cd427]' : 'bg-[#72f534]/80 group-hover:bg-[#72f534]')
                    }`}
                  />
                  <span className={`text-[11px] mt-2 ${day.isPeak ? 'text-[#72f534] font-bold' : 'text-slate-400'}`}>
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Creators */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-semibold text-slate-200">
              Top creators
            </span>
            <button
              onClick={() => onTabChange('creators')}
              className="text-xs font-medium text-[#72f534] hover:underline flex items-center gap-1 cursor-pointer"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {topCreators.map((creator) => (
              <button
                key={creator.creatorName}
                onClick={() => onTabChange('creators')}
                className="flex flex-col items-center p-2.5 bg-[#172219] hover:bg-[#1d2b20] border border-[#263728] rounded-xl transition-all cursor-pointer text-center group"
              >
                <img
                  src={creator.creatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face"}
                  alt={creator.creatorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#2b3e2e] group-hover:border-[#72f534] transition-colors mb-1.5"
                />
                <span className="text-xs font-semibold text-slate-200 truncate w-full group-hover:text-white">
                  {creator.creatorName}
                </span>
                <span className="text-[10px] text-slate-400">
                  {creator.totalViews} reels
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentEvent && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-slate-200">
                Recent activity
              </span>
              <span className="text-xs text-slate-400">
                {getRelativeTime(recentEvent.startedAt)}
              </span>
            </div>

            <button
              onClick={() => {
                if (onViewRecentPost) {
                  onViewRecentPost(recentEvent);
                } else if (onSelectPlatformFilter) {
                  onSelectPlatformFilter(recentEvent.platform);
                  onTabChange('history');
                }
              }}
              className="w-full p-2.5 bg-[#172219] hover:bg-[#1d2b20] border border-[#263728] rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PlatformIcon platform={recentEvent.platform} className="w-7 h-7 shrink-0 shadow-sm" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {recentEvent.creatorName || 'Unknown creator'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Watched a {recentEvent.platform === 'youtube' ? 'YouTube Short' : 'Reel'}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#72f534] transition-colors shrink-0" />
            </button>
          </div>
        )}

        {/* Daily Report Toggle */}
        <div className="bg-[#17261a] border border-[#273d2b] rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#203322] border border-[#2e4c30] flex items-center justify-center text-[#72f534]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Daily report</div>
              <div className="text-[11px] text-slate-400">{settings.dailyReportTime === '21:00' ? '9:00 PM' : settings.dailyReportTime}</div>
            </div>
          </div>

          <button
            onClick={onToggleDailyReport}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.dailyReportEnabled ? 'bg-[#72f534]' : 'bg-[#263328]'
            }`}
            aria-label="Toggle daily report notification"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#101511] shadow-lg ring-0 transition duration-200 ease-in-out ${
                settings.dailyReportEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Bottom Navigation Bar (Pinned) */}
      <div className="px-3 py-2 bg-[#0c110d] border-t border-white/5 flex items-center justify-around shrink-0">
        {/* Overview Tab */}
        <button
          onClick={() => onTabChange('overview')}
          className="flex-1 flex flex-col items-center py-1 relative cursor-pointer group"
        >
          <Home className={`w-5 h-5 transition-colors ${activeTab === 'overview' ? 'text-[#72f534]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[10px] mt-1 transition-colors ${activeTab === 'overview' ? 'text-[#72f534] font-semibold' : 'text-slate-400'}`}>
            Overview
          </span>
          {activeTab === 'overview' && (
            <motion.div
              layoutId="activeBottomNavIndicator"
              className="absolute -bottom-2 w-12 h-1 bg-[#72f534] rounded-t-full"
              transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
            />
          )}
        </button>

        {/* Creators Tab */}
        <button
          onClick={() => onTabChange('creators')}
          className="flex-1 flex flex-col items-center py-1 relative cursor-pointer group"
        >
          <Users className={`w-5 h-5 transition-colors ${activeTab === 'creators' ? 'text-[#72f534]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[10px] mt-1 transition-colors ${activeTab === 'creators' ? 'text-[#72f534] font-semibold' : 'text-slate-400'}`}>
            Creators
          </span>
          {activeTab === 'creators' && (
            <motion.div
              layoutId="activeBottomNavIndicator"
              className="absolute -bottom-2 w-12 h-1 bg-[#72f534] rounded-t-full"
              transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
            />
          )}
        </button>

        {/* History Tab */}
        <button
          onClick={() => onTabChange('history')}
          className="flex-1 flex flex-col items-center py-1 relative cursor-pointer group"
        >
          <Clock className={`w-5 h-5 transition-colors ${activeTab === 'history' ? 'text-[#72f534]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[10px] mt-1 transition-colors ${activeTab === 'history' ? 'text-[#72f534] font-semibold' : 'text-slate-400'}`}>
            History
          </span>
          {activeTab === 'history' && (
            <motion.div
              layoutId="activeBottomNavIndicator"
              className="absolute -bottom-2 w-12 h-1 bg-[#72f534] rounded-t-full"
              transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
            />
          )}
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => onTabChange('settings')}
          className="flex-1 flex flex-col items-center py-1 relative cursor-pointer group"
        >
          <SettingsIcon className={`w-5 h-5 transition-colors ${activeTab === 'settings' ? 'text-[#72f534]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[10px] mt-1 transition-colors ${activeTab === 'settings' ? 'text-[#72f534] font-semibold' : 'text-slate-400'}`}>
            Settings
          </span>
          {activeTab === 'settings' && (
            <motion.div
              layoutId="activeBottomNavIndicator"
              className="absolute -bottom-2 w-12 h-1 bg-[#72f534] rounded-t-full"
              transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
