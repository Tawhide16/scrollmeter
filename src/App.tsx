import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ViewingEvent, 
  UserSettings, 
  Platform 
} from './types/scrollmeter';
import { 
  loadStoredEventsSync, 
  loadStoredEventsFromIndexedDB,
  saveStoredEvents, 
  loadStoredSettings, 
  saveStoredSettings 
} from './utils/storage';
import { 
  buildDailySummary, 
  toDateKey 
} from './utils/analytics';
import { createViewingEvent, isDuplicateEvent } from './utils/event-normaliser';
import { generateSeedEvents } from './utils/mock-data';
import { ExtensionPopup } from './components/ExtensionPopup';
import { CreatorsView } from './components/CreatorsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { FeedSimulator } from './components/FeedSimulator';
import { ExtensionPackagerModal } from './components/ExtensionPackagerModal';
import { LaunchGuideModal } from './components/LaunchGuideModal';
import { NotificationToast } from './components/NotificationToast';
import { ScrollMeterLogo, PlatformIcon } from './components/PlatformIcons';
import { downloadExtensionZip } from './utils/extension-generator';
import { 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Lock, 
  Star, 
  MoreVertical, 
  Download, 
  Maximize2, 
  Smartphone, 
  Layers, 
  Home, 
  Compass, 
  History, 
  Tv, 
  Clock, 
  ThumbsUp, 
  Folder,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [events, setEvents] = useState<ViewingEvent[]>(() => loadStoredEventsSync());
  const [settings, setSettings] = useState<UserSettings>(() => loadStoredSettings());
  const [activeTab, setActiveTab] = useState<'overview' | 'creators' | 'history' | 'settings'>('overview');
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [simulatorPlatform, setSimulatorPlatform] = useState<Platform>('youtube');
  const [historyPlatformFilter, setHistoryPlatformFilter] = useState<Platform | 'all'>('all');
  const [historySubTab, setHistorySubTab] = useState<'analytics' | 'log'>('analytics');
  const [isPackagerOpen, setIsPackagerOpen] = useState(false);
  const [isLaunchGuideOpen, setIsLaunchGuideOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState(false);
  const [viewMode, setViewMode] = useState<'browser' | 'popup-only'>('browser');

  // Load from Local-First IndexedDB on initial mount
  useEffect(() => {
    loadStoredEventsFromIndexedDB().then((idbEvents) => {
      if (idbEvents && idbEvents.length > 0) {
        setEvents(idbEvents);
      }
    });
  }, []);

  // Sync state to local-first IndexedDB and local storage cache
  useEffect(() => {
    saveStoredEvents(events, settings.retentionDays);
  }, [events, settings.retentionDays]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  const summary = buildDailySummary(events);
  const todayKey = toDateKey(new Date());
  const todayEvents = events.filter((e) => toDateKey(e.startedAt) === todayKey);

  // Toggle tracking active/paused
  const handleToggleTracking = () => {
    setSettings((prev) => ({
      ...prev,
      trackingPaused: !prev.trackingPaused,
    }));
  };

  // Toggle daily report
  const handleToggleDailyReport = () => {
    setSettings((prev) => ({
      ...prev,
      dailyReportEnabled: !prev.dailyReportEnabled,
    }));
  };

  // Record a view event from simulator
  const handleRecordViewEvent = (params: {
    platform: Platform;
    contentId: string;
    creatorName: string;
    title: string;
    watchSeconds: number;
    avatar?: string;
  }) => {
    if (settings.trackingPaused) return;
    if (!settings.enabledPlatforms[params.platform]) return;

    // Check duplicate
    if (isDuplicateEvent(events, params.platform, params.contentId)) {
      return;
    }

    const newEvent = createViewingEvent({
      platform: params.platform,
      contentId: params.contentId,
      creatorName: params.creatorName,
      title: params.title,
      watchSeconds: params.watchSeconds,
      creatorAvatar: params.avatar,
      startedAt: Date.now(),
      detectionConfidence: 'high',
    });

    setEvents((prev) => [newEvent, ...prev]);
  };

  // Delete individual event
  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.eventId !== eventId));
  };

  // Clear all history
  const handleClearAllHistory = () => {
    setEvents([]);
  };

  // Reset seed data
  const handleResetSeedData = () => {
    const fresh = generateSeedEvents();
    setEvents(fresh);
  };

  // Correct or rename creator
  const handleUpdateCreatorName = (oldName: string, newName: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.creatorName === oldName ? { ...e, creatorName: newName } : e
      )
    );
  };

  // Trigger test notification
  const handleTriggerTestNotification = () => {
    setActiveNotification(true);
    // Also try standard Web Notification API if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('ScrollMeter — Your daily report', {
          body: `You watched ${summary.total} short videos today across ${Object.values(summary.platformBreakdown).filter(v => v > 0).length} platforms.`,
          icon: '/public/assets/aistudio/ScrollMeter__Your_Attention_in_Numbers_78d573da.png'
        });
      } catch (_) {}
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // URL matching simulated platform
  const getSimulatedUrl = () => {
    switch (simulatorPlatform) {
      case 'youtube':
        return 'https://www.youtube.com/shorts';
      case 'instagram':
        return 'https://www.instagram.com/reels';
      case 'tiktok':
        return 'https://www.tiktok.com/foryou';
      case 'facebook':
        return 'https://www.facebook.com/reel';
    }
  };

  const renderPopupContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ExtensionPopup
            events={events}
            settings={settings}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onToggleTracking={handleToggleTracking}
            onToggleDailyReport={handleToggleDailyReport}
            onViewDetails={() => {
              setHistorySubTab('analytics');
              setActiveTab('history');
            }}
            onSelectPlatformFilter={(p) => {
              setHistoryPlatformFilter(p);
              setHistorySubTab('log');
              setActiveTab('history');
            }}
          />
        );
      case 'creators':
        return (
          <CreatorsView
            events={events}
            onBack={() => setActiveTab('overview')}
            onUpdateCreatorName={handleUpdateCreatorName}
          />
        );
      case 'history':
        return (
          <HistoryView
            events={events}
            selectedPlatformFilter={historyPlatformFilter}
            initialSubTab={historySubTab}
            onBack={() => setActiveTab('overview')}
            onDeleteEvent={handleDeleteEvent}
            onClearAll={handleClearAllHistory}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            events={events}
            onBack={() => setActiveTab('overview')}
            onUpdateSettings={setSettings}
            onImportEvents={(newEvts) => setEvents(newEvts)}
            onResetSeedData={handleResetSeedData}
            onClearAllData={handleClearAllHistory}
            onTriggerTestNotification={handleTriggerTestNotification}
            onOpenExtensionExport={() => setIsPackagerOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-slate-100 flex flex-col font-sans selection:bg-[#72f534]/30 selection:text-[#72f534]">
      {/* Top Application Bar */}
      <header className="px-4 py-2.5 bg-[#101612] border-b border-[#202d22] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ScrollMeterLogo className="w-5 h-5" />
            <span className="font-bold text-sm tracking-tight text-white">ScrollMeter</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Cross-platform Short-form Video Tracker
          </span>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex bg-[#162118] border border-[#263728] rounded-xl p-0.5 text-[11px] relative">
            <button
              onClick={() => setViewMode('browser')}
              className={`relative px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'browser'
                  ? 'text-black font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'browser' && (
                <motion.div
                  layoutId="activeAppViewMode"
                  className="absolute inset-0 bg-[#72f534] rounded-lg shadow"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
                />
              )}
              <span className="relative z-10">Browser Mockup Mode</span>
            </button>
            <button
              onClick={() => setViewMode('popup-only')}
              className={`relative px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'popup-only'
                  ? 'text-black font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'popup-only' && (
                <motion.div
                  layoutId="activeAppViewMode"
                  className="absolute inset-0 bg-[#72f534] rounded-lg shadow"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
                />
              )}
              <span className="relative z-10">Popup Only Mode</span>
            </button>
          </div>

          {/* Launch & Test Guide Button */}
          <button
            onClick={() => setIsLaunchGuideOpen(true)}
            className="px-3.5 py-1.5 bg-[#72f534] hover:bg-[#86ff4d] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>🚀 Launch & Test</span>
          </button>

          {/* Download Extension (.zip) */}
          <button
            onClick={() => setIsPackagerOpen(true)}
            className="px-3 py-1.5 bg-[#1f3022] hover:bg-[#28402c] border border-[#345339] text-[#72f534] font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Extension Files & ZIP</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {viewMode === 'popup-only' ? (
          /* Standalone Extension Popup Centered View */
          <div className="w-full max-w-[400px] flex flex-col items-center">
            <div className="mb-3 text-center">
              <span className="text-xs text-slate-400">Standard 380px Chrome Extension Popup Container</span>
            </div>

            <div className="w-[380px] h-[580px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.99 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="h-full"
                >
                  {renderPopupContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Full Desktop Browser Shell (matching the user's mockup image!) */
          <div className="w-full max-w-6xl h-[86vh] bg-[#0f0f0f] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden relative">
            {/* macOS Chrome Titlebar */}
            <div className="bg-[#1f1f1f] px-4 py-2.5 flex items-center justify-between border-b border-black select-none">
              <div className="flex items-center gap-3">
                {/* 3 Mac dots */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>

                {/* Active Tab */}
                <div className="flex items-center gap-2 bg-[#2d2d2d] px-3.5 py-1.5 rounded-t-lg text-xs text-white max-w-[200px] border-t border-white/10">
                  <PlatformIcon platform={simulatorPlatform} className="w-3.5 h-3.5" />
                  <span className="capitalize font-medium truncate">
                    {simulatorPlatform === 'youtube' ? 'YouTube' : simulatorPlatform}
                  </span>
                  <span className="text-slate-400 text-xs ml-1 hover:text-white cursor-pointer">×</span>
                </div>
                <span className="text-slate-500 hover:text-white text-xs cursor-pointer pl-1">+</span>
              </div>

              {/* Omnibox / Address Bar */}
              <div className="flex-1 max-w-md mx-4 flex items-center gap-2 bg-[#121212] px-3 py-1.5 rounded-full text-xs text-slate-300 border border-white/10">
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate font-mono">{getSimulatedUrl()}</span>
              </div>

              {/* Browser Toolbar Icons & Extension Badge */}
              <div className="flex items-center gap-2.5">
                <button className="text-slate-400 hover:text-white p-1">
                  <Star className="w-4 h-4" />
                </button>

                {/* ScrollMeter Extension Pin Icon in Browser Toolbar! */}
                <button
                  onClick={() => setIsPopupOpen(!isPopupOpen)}
                  title="Toggle ScrollMeter Extension Popup"
                  className={`relative p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isPopupOpen
                      ? 'bg-[#72f534]/15 border-[#72f534] text-[#72f534]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label="Toggle ScrollMeter popup"
                >
                  <ScrollMeterLogo className="w-4 h-4" />
                  {/* Badge with today's count */}
                  <span className="absolute -top-1 -right-1 px-1 bg-[#72f534] text-black text-[9px] font-extrabold rounded-full min-w-[15px] text-center shadow">
                    {summary.total}
                  </span>
                </button>

                {/* User Avatar 'T' */}
                <div 
                  className="w-6 h-6 rounded-full bg-[#1b5e20] text-white text-[11px] font-bold flex items-center justify-center border border-white/20"
                  title="tawhideh.b10@gmail.com"
                >
                  T
                </div>

                <button className="text-slate-400 hover:text-white p-0.5">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Second Row: Navigation controls & Platform Switcher */}
            <div className="bg-[#181818] px-4 py-1.5 flex items-center justify-between border-b border-white/5 text-xs text-slate-300 select-none">
              <div className="flex items-center gap-2">
                <button className="p-1 hover:text-white text-slate-500"><ArrowLeft className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-white text-slate-500"><ArrowRight className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-white text-slate-400"><RotateCw className="w-3.5 h-3.5" /></button>
                <span className="text-slate-600 pl-2">|</span>
                <span className="text-[11px] text-slate-400 pl-2">Social Feed Simulator:</span>
                
                {/* Platform switcher tabs with smooth sliding animation */}
                <div className="flex items-center gap-1 ml-2 relative">
                  {(['youtube', 'instagram', 'tiktok', 'facebook'] as const).map((p) => {
                    const labels = {
                      youtube: 'YouTube Shorts',
                      instagram: 'Instagram Reels',
                      tiktok: 'TikTok Feed',
                      facebook: 'Facebook Reels',
                    };
                    const isSelected = simulatorPlatform === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setSimulatorPlatform(p)}
                        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activeSimulatorPlatform"
                            className="absolute inset-0 bg-white/15 rounded-lg shadow-sm"
                            transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <PlatformIcon platform={p} className="w-3 h-3" />
                          <span>{labels[p]}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>View threshold: <b className="text-[#72f534]">{settings.viewThresholdSeconds}s</b></span>
                <span>•</span>
                <span>Logged today: <b className="text-white">{todayEvents.length}</b></span>
              </div>
            </div>

            {/* Browser Body Area */}
            <div className="flex-1 flex overflow-hidden relative bg-[#0f0f0f]">
              {/* Left YouTube Navigation Drawer */}
              <div className="w-56 border-r border-white/5 p-3 hidden md:flex flex-col space-y-4 text-xs text-slate-300 bg-[#0f0f0f] select-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-4 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5">
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </div>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-xl bg-white/10 text-white font-semibold">
                    <Compass className="w-4 h-4 text-[#ff0000]" />
                    <span>Shorts</span>
                  </div>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5">
                    <Tv className="w-4 h-4" />
                    <span>Subscriptions</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-1">
                  <span className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    You &gt;
                  </span>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5">
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </div>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5">
                    <Clock className="w-4 h-4" />
                    <span>Watch later</span>
                  </div>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Liked videos</span>
                  </div>
                </div>

                {/* Status card in sidebar */}
                <div className="mt-auto p-3 bg-[#141b15] border border-[#233125] rounded-xl text-[11px] space-y-1">
                  <div className="font-bold text-[#72f534] flex items-center gap-1.5">
                    <ScrollMeterLogo className="w-3.5 h-3.5" />
                    ScrollMeter Active
                  </div>
                  <p className="text-slate-400 leading-tight">
                    Tracking viewing events and time locally in your browser.
                  </p>
                </div>
              </div>

              {/* Center Feed Area with Interactive Video Simulator */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto relative bg-[#0a0d0b]">
                <FeedSimulator
                  currentPlatform={simulatorPlatform}
                  onPlatformChange={setSimulatorPlatform}
                  settings={settings}
                  todayCount={todayEvents.length}
                  allPlatformsCount={events.length}
                  onRecordViewEvent={handleRecordViewEvent}
                />
              </div>

              {/* Floating Extension Popup Overlay (matching the user's mockup placement!) */}
              {isPopupOpen && (
                <div className="absolute top-2.5 right-4 bottom-2.5 z-40 flex flex-col shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.99 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="h-full"
                    >
                      {renderPopupContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Real Chrome Extension Manifest V3 Packager Modal */}
      <ExtensionPackagerModal
        isOpen={isPackagerOpen}
        onClose={() => setIsPackagerOpen(false)}
      />

      {/* Interactive Launch & Testing Guide Modal */}
      <LaunchGuideModal
        isOpen={isLaunchGuideOpen}
        onClose={() => setIsLaunchGuideOpen(false)}
        onDownloadZip={downloadExtensionZip}
        onSimulateWatch={() => {
          handleRecordViewEvent({
            platform: simulatorPlatform,
            contentId: `manual_test_${Date.now()}`,
            creatorName: simulatorPlatform === 'youtube' ? 'MrBeast' : simulatorPlatform === 'instagram' ? 'Tech Burner' : simulatorPlatform === 'tiktok' ? 'Zach King' : 'Veritasium',
            title: 'Interactive Test Reel',
            watchSeconds: 8,
          });
        }}
        onSwitchPlatform={(p) => setSimulatorPlatform(p)}
        onOpenTab={(tab) => {
          setActiveTab(tab);
          setIsPopupOpen(true);
        }}
      />

      {/* Simulated Scheduled Daily Notification Toast */}
      {activeNotification && (
        <NotificationToast
          summary={summary}
          onClose={() => setActiveNotification(false)}
          onOpenDetails={() => {
            setIsPopupOpen(true);
            setActiveTab('overview');
          }}
        />
      )}
    </div>
  );
}
