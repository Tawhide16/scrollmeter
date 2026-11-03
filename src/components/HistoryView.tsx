import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewingEvent, Platform } from '../types/scrollmeter';
import { 
  filterEvents, 
  formatDuration, 
  toDateKey,
  getTimeframeAnalytics 
} from '../utils/analytics';
import { PlatformIcon } from './PlatformIcons';
import { PlatformTabs } from './PlatformTabs';
import { 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Trash2, 
  Calendar, 
  Clock, 
  BarChart3,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Headphones,
  Dumbbell,
  Layers,
  ChevronRight,
  Flame,
  PieChart
} from 'lucide-react';

interface HistoryViewProps {
  events: ViewingEvent[];
  selectedPlatformFilter?: Platform | 'all';
  initialSubTab?: 'analytics' | 'log';
  onBack: () => void;
  onDeleteEvent: (eventId: string) => void;
  onClearAll: () => void;
}

export function HistoryView({
  events,
  selectedPlatformFilter = 'all',
  initialSubTab = 'analytics',
  onBack,
  onDeleteEvent,
  onClearAll,
}: HistoryViewProps) {
  const [subTab, setSubTab] = useState<'analytics' | 'log'>(initialSubTab);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [platform, setPlatform] = useState<Platform | 'all'>(selectedPlatformFilter);
  const [search, setSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute rich attention & time lost analytics for the selected timeframe
  const analytics = getTimeframeAnalytics(events, timeframe);

  // Filter events for the chronological log view
  const filteredEvents = filterEvents(events, {
    platform,
    search,
  });

  // Group log events by day
  const groupedByDay: { [dateStr: string]: ViewingEvent[] } = {};
  for (const ev of filteredEvents) {
    const k = toDateKey(ev.startedAt);
    if (!groupedByDay[k]) groupedByDay[k] = [];
    groupedByDay[k].push(ev);
  }

  const todayKey = toDateKey(new Date());

  const formatDayHeader = (dateStr: string) => {
    if (dateStr === todayKey) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === toDateKey(yesterday)) return 'Yesterday';
    return dateStr;
  };

  return (
    <div className="w-[380px] h-full max-h-full bg-[#101511] text-slate-100 rounded-3xl border border-[#233125] shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      {/* 1. Header (Pinned) */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#101511]">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-[17px] text-white">Attention & History</h1>
            <p className="text-[11px] text-slate-400">Watch time, hours lost & video log</p>
          </div>
        </div>

        {subTab === 'log' && events.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* 2. Top Segmented Navigation: Analytics vs Video Log (Pinned) */}
      <div className="px-5 pt-3 pb-2 border-b border-white/5 shrink-0 bg-[#101511]">
        <div className="flex bg-[#162118] border border-[#263728] rounded-xl p-1 text-xs relative">
          <button
            type="button"
            onClick={() => setSubTab('analytics')}
            className={`relative flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'analytics'
                ? 'text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {subTab === 'analytics' && (
              <motion.div
                layoutId="activeHistorySubTab"
                className="absolute inset-0 bg-[#72f534] rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Attention & Hours Lost</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('log')}
            className={`relative flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'log'
                ? 'text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {subTab === 'log' && (
              <motion.div
                layoutId="activeHistorySubTab"
                className="absolute inset-0 bg-[#72f534] rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Video Log ({events.length})</span>
            </span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Banner */}
      {showClearConfirm && (
        <div className="bg-rose-950/80 border-b border-rose-800/60 p-3 text-xs flex items-center justify-between shrink-0">
          <span className="text-rose-200">Clear all local viewing history?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearAll();
                setShowClearConfirm(false);
              }}
              className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-500 cursor-pointer"
            >
              Yes, Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[11px] hover:bg-white/20 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Body */}
      <AnimatePresence mode="wait">
        {subTab === 'analytics' ? (
          /* Analytics & Attention Loss View */
          <motion.div
            key="subtab-analytics"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex-1 p-5 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
          >
            {/* Timeframe Selector Pills with smooth sliding animation */}
            <div className="flex bg-[#162118] border border-[#263728] rounded-xl p-1 text-xs relative">
              {[
                { id: 'day', label: 'Today' },
                { id: 'week', label: 'Full Week (7d)' },
                { id: 'month', label: 'Full Month (30d)' },
              ].map((tf) => {
                const isSelected = timeframe === tf.id;
                return (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id as 'day' | 'week' | 'month')}
                    className={`relative flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                      isSelected ? 'text-[#72f534] font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeTimeframeTab"
                        className="absolute inset-0 bg-[#253928] border border-[#3b593f] rounded-lg shadow-sm"
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
                      />
                    )}
                    <span className="relative z-10">{tf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Subtitle */}
            <div className="text-[11px] text-slate-400">
              {analytics.subtitle}
            </div>

            {/* Timeframe Card Body with Smooth Animated Transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={timeframe}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Hero Card: Hours Lost in a Day / Period */}
                <div className="bg-[#172219] border border-[#263728] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                {timeframe === 'day' ? 'Hours Lost in a Day' : 'Total Attention Lost'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60">
                {analytics.wakingHoursLostPercent}% of waking time
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {analytics.hoursLostText}
                </div>
                <div className="text-xs text-[#72f534] mt-0.5 font-medium flex items-center gap-1">
                  <span>⏱️ Watch Time: {analytics.watchTimeFormatted}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-slate-200">
                  {analytics.totalReels}
                </div>
                <div className="text-[11px] text-slate-400">
                  reels watched
                </div>
              </div>
            </div>

            {/* Attention Equivalent Perspectives */}
            <div className="pt-2.5 border-t border-white/5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                What you could have done instead:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#111812] border border-[#233125] rounded-xl p-2 text-center">
                  <BookOpen className="w-3.5 h-3.5 text-[#72f534] mx-auto mb-1" />
                  <span className="text-xs font-bold text-white block">~{analytics.equivalentActivity.bookPages}</span>
                  <span className="text-[9px] text-slate-400">book pages</span>
                </div>
                <div className="bg-[#111812] border border-[#233125] rounded-xl p-2 text-center">
                  <Headphones className="w-3.5 h-3.5 text-sky-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-white block">~{analytics.equivalentActivity.podcasts}</span>
                  <span className="text-[9px] text-slate-400">podcasts</span>
                </div>
                <div className="bg-[#111812] border border-[#233125] rounded-xl p-2 text-center">
                  <Dumbbell className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-white block">~{analytics.equivalentActivity.workouts}</span>
                  <span className="text-[9px] text-slate-400">workouts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Average Daily Watch Time */}
          <div className="bg-[#172219] border border-[#263728] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#72f534]" />
                Average Daily Watch Time
              </span>
              <span className="text-[11px] text-[#72f534] font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {analytics.trendVsPreviousPercent >= 0 ? `+${analytics.trendVsPreviousPercent}%` : `${analytics.trendVsPreviousPercent}%`}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div>
                <span className="text-2xl font-extrabold text-white">
                  {analytics.avgDailyFormatted}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ day</span>
              </div>
              <div className="text-right text-xs text-slate-300">
                <span className="font-bold text-white">{analytics.avgDailyReels}</span> reels / day
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Healthy focus guideline:</span>
              <span className="text-slate-300 font-medium">&lt; 45 mins / day</span>
            </div>
          </div>

          {/* Card 3: Full Week Summary or Full Month Summary */}
          {timeframe === 'week' && analytics.weeklyDays && (
            <div className="bg-[#172219] border border-[#263728] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#72f534]" />
                  Full Week Summary
                </span>
                {analytics.peakDay && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e2e20] text-[#72f534] border border-[#2f4a33]">
                    Peak: {analytics.peakDay.dayName} ({analytics.peakDay.count} reels)
                  </span>
                )}
              </div>

              {/* 7-Day Bar Graph */}
              <div className="flex items-end justify-between gap-2 h-24 px-1 pt-4">
                {analytics.weeklyDays.map((d) => {
                  const maxCount = Math.max(...(analytics.weeklyDays?.map((x) => x.count) || [50]), 70);
                  const heightPercent = Math.max(16, Math.round((d.count / maxCount) * 100));

                  return (
                    <div key={d.dayName} className="flex-1 flex flex-col items-center group relative">
                      {d.isPeak && (
                        <div className="absolute -top-6 px-1.5 py-0.5 bg-[#72f534] text-black font-bold text-[9px] rounded-full whitespace-nowrap">
                          {d.count}
                        </div>
                      )}
                      {!d.isPeak && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-6 px-1.5 py-0.5 bg-black/90 text-white text-[9px] rounded pointer-events-none whitespace-nowrap transition-opacity">
                          {d.count}
                        </div>
                      )}

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[18px] rounded-md transition-all ${
                          d.isPeak
                            ? 'bg-[#72f534]'
                            : (d.isToday ? 'bg-[#5cd427]' : 'bg-[#72f534]/70 group-hover:bg-[#72f534]')
                        }`}
                      />
                      <span className={`text-[10px] mt-1.5 ${d.isPeak ? 'text-[#72f534] font-bold' : 'text-slate-400'}`}>
                        {d.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Week total watch time:</span>
                <span className="font-semibold text-white">{analytics.watchTimeFormatted} ({analytics.hoursLostText})</span>
              </div>
            </div>
          )}

          {timeframe === 'month' && analytics.monthlyWeeks && (
            <div className="bg-[#172219] border border-[#263728] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#72f534]" />
                  Full Month Summary (4 Weeks)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {analytics.totalReels} reels total
                </span>
              </div>

              <div className="space-y-2">
                {analytics.monthlyWeeks.map((mw) => (
                  <div key={mw.weekLabel} className="bg-[#111812] border border-[#233125] rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">{mw.weekLabel}</span>
                      <span className="text-[10px] text-slate-400">{mw.count} reels watched</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#72f534] block">{mw.hours} hrs lost</span>
                      <span className="text-[10px] text-slate-500">~{formatDuration(mw.seconds)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Projected annual loss:</span>
                <span className="font-bold text-amber-300">
                  ~{Math.round((analytics.totalHours / 30) * 365)} hours / year
                </span>
              </div>
            </div>
          )}

          {/* Card 4: How Many Times They Watch Video Reels (Platform Breakdown) */}
          <div className="bg-[#172219] border border-[#263728] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[#72f534]" />
                Video Reels Watched by Platform
              </span>
              <span className="text-[10px] text-slate-400">
                {analytics.totalReels} total
              </span>
            </div>

            <div className="space-y-2.5">
              {analytics.platformBreakdown.map((p) => (
                <div key={p.platform} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={p.platform} className="w-4 h-4 shadow-sm" />
                      <span className="font-medium text-slate-200">{p.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">{p.count} reels</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">({p.hours}h · {p.percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-[#111812] rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.max(4, p.percentage)}%` }}
                      className="h-full bg-[#72f534] rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Button to inspect full video log */}
          <button
            type="button"
            onClick={() => setSubTab('log')}
            className="w-full py-2.5 px-4 bg-[#1a291d] hover:bg-[#233827] border border-[#2c4731] hover:border-[#72f534] rounded-2xl text-xs font-semibold text-[#72f534] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Inspect individual video records ({filteredEvents.length} videos)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Chronological Watched Video Log View */
          <motion.div
            key="subtab-log"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Filter and Search Bar (Pinned) */}
          <div className="p-4 space-y-3 border-b border-white/5 shrink-0 bg-[#101511]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search title, creator, or platform..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#172219] border border-[#263728] focus:border-[#72f534] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Platform Tabs with smooth right-to-left and left-to-right scrolling */}
            <PlatformTabs
              selectedPlatform={platform}
              onSelectPlatform={setPlatform}
            />
          </div>

          {/* Timeline List (Scrollable) */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {Object.keys(groupedByDay).length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#72f534]" />
                <p className="text-xs font-semibold text-slate-300">No watch events recorded yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">Scroll short videos in the feed simulator to log view events!</p>
              </div>
            ) : (
              Object.entries(groupedByDay).map(([dayKey, dayEvents]) => (
                <div key={dayKey} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-1">
                    <Calendar className="w-3.5 h-3.5 text-[#72f534]" />
                    <span>{formatDayHeader(dayKey)}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({dayEvents.length} videos · ~{formatDuration(dayEvents.reduce((a, b) => a + (b.watchSeconds || 0), 0))})
                    </span>
                  </div>

                  {dayEvents.map((event) => {
                    const timeString = new Date(event.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={event.eventId}
                        className="p-3 bg-[#172219] border border-[#263728] rounded-2xl flex items-center justify-between gap-3 hover:border-[#38533b] transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black flex items-center justify-center">
                            <img
                              src={
                                event.creatorAvatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
                              }
                              alt={event.creatorName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 right-0 p-0.5">
                              <PlatformIcon platform={event.platform} className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                                {event.title || 'Short Video'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {event.creatorName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                              <span>{timeString}</span>
                              <span>•</span>
                              <span className="text-[#72f534]">~{formatDuration(event.watchSeconds)}</span>
                              <span>•</span>
                              <span className="capitalize">{event.platform}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {event.contentUrl && (
                            <a
                              href={event.contentUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Open original video"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteEvent(event.eventId)}
                            title="Delete this view record"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}
