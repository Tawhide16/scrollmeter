import React, { useState, useEffect, useRef } from 'react';
import { Platform, ViewingEvent, UserSettings } from '../types/scrollmeter';
import { PlatformIcon, ScrollMeterLogo } from './PlatformIcons';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FeedSimulatorProps {
  currentPlatform: Platform;
  onPlatformChange: (p: Platform) => void;
  settings: UserSettings;
  todayCount: number;
  allPlatformsCount: number;
  onRecordViewEvent: (eventParams: {
    platform: Platform;
    contentId: string;
    creatorName: string;
    title: string;
    watchSeconds: number;
    avatar?: string;
  }) => void;
}

interface SimulatedShort {
  id: string;
  title: string;
  creator: string;
  creatorHandle: string;
  avatar: string;
  views: string;
  likes: string;
  comments: string;
  bgGradient: string;
  videoBadge: string;
  durationSeconds: number;
  previewImage: string;
}

const SIMULATED_VIDEOS: Record<Platform, SimulatedShort[]> = {
  youtube: [
    {
      id: 'yt_desert_1',
      title: 'Surviving 24 Hours in a Desert With No Water!',
      creator: 'MrBeast',
      creatorHandle: '@MrBeast',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      views: '14.2M',
      likes: '1.2M',
      comments: '42.8K',
      bgGradient: 'from-amber-900 via-stone-900 to-black',
      videoBadge: 'YouTube Short',
      durationSeconds: 38,
      previewImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&h=900&fit=crop',
    },
    {
      id: 'yt_trickshot_2',
      title: 'Impossible Ping Pong Trick Shot 100ft Drop!',
      creator: 'Dude Perfect',
      creatorHandle: '@DudePerfect',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face',
      views: '8.4M',
      likes: '740K',
      comments: '18.1K',
      bgGradient: 'from-blue-900 via-slate-900 to-black',
      videoBadge: 'YouTube Short',
      durationSeconds: 32,
      previewImage: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&h=900&fit=crop',
    },
    {
      id: 'yt_cat_3',
      title: 'The moment my cat realized cucumbers are scary',
      creator: 'CutePetClub',
      creatorHandle: '@CutePetClub',
      avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face',
      views: '2.1M',
      likes: '380K',
      comments: '9.2K',
      bgGradient: 'from-emerald-950 via-neutral-900 to-black',
      videoBadge: 'YouTube Short',
      durationSeconds: 15,
      previewImage: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&h=900&fit=crop',
    },
  ],
  instagram: [
    {
      id: 'ig_tech_1',
      title: 'Future transparent smartphone concept in real life 📱',
      creator: 'Tech Burner',
      creatorHandle: '@techburner',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      views: '5.8M',
      likes: '512K',
      comments: '12.4K',
      bgGradient: 'from-purple-950 via-slate-900 to-black',
      videoBadge: 'Instagram Reel',
      durationSeconds: 24,
      previewImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=900&fit=crop',
    },
    {
      id: 'ig_khaby_2',
      title: 'Why make life complicated when you can just open it? 🤷‍♂️',
      creator: 'Khaby Lame',
      creatorHandle: '@khaby00',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      views: '32.1M',
      likes: '3.4M',
      comments: '78.9K',
      bgGradient: 'from-orange-950 via-zinc-900 to-black',
      videoBadge: 'Instagram Reel',
      durationSeconds: 14,
      previewImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=900&fit=crop',
    },
  ],
  tiktok: [
    {
      id: 'tt_magic_1',
      title: 'Don’t blink or you’ll miss where the coffee went! ☕✨',
      creator: 'Zach King',
      creatorHandle: '@zachking',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face',
      views: '19.4M',
      likes: '2.1M',
      comments: '23.4K',
      bgGradient: 'from-cyan-950 via-neutral-900 to-black',
      videoBadge: 'TikTok',
      durationSeconds: 18,
      previewImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=900&fit=crop',
    },
    {
      id: 'tt_dance_2',
      title: 'POV: Listening to this beat for the 500th time today 🎶',
      creator: 'BeatCraft',
      creatorHandle: '@beatcraft',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      views: '4.7M',
      likes: '489K',
      comments: '5.2K',
      bgGradient: 'from-pink-950 via-neutral-900 to-black',
      videoBadge: 'TikTok',
      durationSeconds: 22,
      previewImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=900&fit=crop',
    },
  ],
  facebook: [
    {
      id: 'fb_science_1',
      title: 'What happens when you drop liquid nitrogen into hot water?',
      creator: 'Veritasium',
      creatorHandle: '@veritasium',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face',
      views: '3.9M',
      likes: '190K',
      comments: '8.4K',
      bgGradient: 'from-blue-950 via-stone-900 to-black',
      videoBadge: 'Facebook Reel',
      durationSeconds: 45,
      previewImage: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&h=900&fit=crop',
    },
  ],
};

export function FeedSimulator({
  currentPlatform,
  onPlatformChange,
  settings,
  todayCount,
  allPlatformsCount,
  onRecordViewEvent,
}: FeedSimulatorProps) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [hasRecordedCurrent, setHasRecordedCurrent] = useState(false);
  const [inPageDismissed, setInPageDismissed] = useState(false);

  const playlist = SIMULATED_VIDEOS[currentPlatform] || SIMULATED_VIDEOS.youtube;
  const currentShort = playlist[videoIndex % playlist.length];

  // Timer loop simulating playback and checking threshold rule (PDF Section 4)
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackSeconds((prev) => {
          const next = prev + 0.5;
          if (next >= currentShort.durationSeconds) {
            return 0;
          }
          return next;
        });
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentShort.durationSeconds]);

  // Effect to trigger view event once threshold is reached
  useEffect(() => {
    if (
      !hasRecordedCurrent &&
      !settings.trackingPaused &&
      settings.enabledPlatforms[currentPlatform] &&
      playbackSeconds >= settings.viewThresholdSeconds
    ) {
      setHasRecordedCurrent(true);
      onRecordViewEvent({
        platform: currentPlatform,
        contentId: currentShort.id,
        creatorName: currentShort.creator,
        title: currentShort.title,
        watchSeconds: Math.round(playbackSeconds),
        avatar: currentShort.avatar,
      });

      // Trigger gentle celebratory confetti on milestone
      try {
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.85, x: 0.8 },
          colors: ['#72f534', '#ffffff', '#22c55e'],
        });
      } catch (_) {}
    }
  }, [
    playbackSeconds,
    hasRecordedCurrent,
    settings.trackingPaused,
    settings.enabledPlatforms,
    settings.viewThresholdSeconds,
    currentPlatform,
    currentShort,
    onRecordViewEvent,
  ]);

  const handleNextVideo = () => {
    setVideoIndex((prev) => (prev + 1) % playlist.length);
    setPlaybackSeconds(0);
    setHasRecordedCurrent(false);
  };

  const handlePrevVideo = () => {
    setVideoIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setPlaybackSeconds(0);
    setHasRecordedCurrent(false);
  };

  const thresholdProgress = Math.min(
    100,
    (playbackSeconds / settings.viewThresholdSeconds) * 100
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      {/* Video Feed Box */}
      <div className="relative w-full max-w-[360px] h-[580px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col select-none">
        {/* Background Image / Simulation */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentShort.previewImage}
            alt={currentShort.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? 'scale-105 filter brightness-95' : 'scale-100 filter brightness-75'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
        </div>

        {/* Top of Reel: Active Tracker with Play Icon & Reels Count Badge */}
        <div className="relative z-10 px-3.5 pt-3.5 flex items-center justify-between gap-2">
          {!settings.trackingPaused ? (
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101612]/92 backdrop-blur-md border border-[#2c402f] text-white shadow-md select-none"
              title="ScrollMeter is active: tracking watched reels"
            >
              <div className="w-4 h-4 rounded-full bg-[#72f534] text-black flex items-center justify-center shrink-0">
                <Play className="w-2.5 h-2.5 fill-black ml-0.5" />
              </div>
              <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                <b className="text-[#72f534] font-bold">{todayCount}</b> Reels Watched
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs select-none">
              <Pause className="w-3 h-3" />
              <span>Tracking Paused</span>
            </div>
          )}

          {/* Platform Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shrink-0">
            <PlatformIcon platform={currentPlatform} className="w-3.5 h-3.5" />
            <span>{currentShort.videoBadge}</span>
          </div>
        </div>

        {/* Play/Pause Center Tap Area */}
        <div
          onClick={() => setIsPlaying(!isPlaying)}
          className="relative z-10 flex-1 flex items-center justify-center cursor-pointer group"
        >
          {!isPlaying && (
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-white ml-1" />
            </div>
          )}
        </div>

        {/* Video Info (bottom left) & Social actions (bottom right) */}
        <div className="relative z-10 p-4 flex items-end justify-between gap-3">
          {/* Left: Creator info & title */}
          <div className="space-y-2 min-w-0 flex-1">
            {/* View threshold detection pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-200 w-fit">
              <span className={`w-1.5 h-1.5 rounded-full ${hasRecordedCurrent ? 'bg-[#72f534]' : 'bg-amber-400'}`} />
              <span>{hasRecordedCurrent ? '✓ View logged (>2s)' : `Counting (${playbackSeconds.toFixed(1)}s / ${settings.viewThresholdSeconds}s)`}</span>
            </div>

            <div className="flex items-center gap-2">
              <img
                src={currentShort.avatar}
                alt={currentShort.creator}
                className="w-9 h-9 rounded-full border border-white/30 object-cover shadow"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{currentShort.creator}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#72f534]" />
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {currentShort.creatorHandle}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-100 font-medium line-clamp-2 drop-shadow">
              {currentShort.title}
            </p>

            <div className="text-[10px] text-slate-300 flex items-center gap-2">
              <span>{currentShort.views} views</span>
              <span>•</span>
              <span>~{Math.round(playbackSeconds)}s / {currentShort.durationSeconds}s</span>
            </div>
          </div>

          {/* Right: Vertical short action buttons */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <button className="flex flex-col items-center text-white/90 hover:text-white transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/60">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5">{currentShort.likes}</span>
            </button>

            <button className="flex flex-col items-center text-white/90 hover:text-white transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/60">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5">{currentShort.comments}</span>
            </button>

            <button
              onClick={handleNextVideo}
              className="flex flex-col items-center text-white/90 hover:text-[#72f534] transition-colors cursor-pointer"
              title="Next short (Scroll feed)"
            >
              <div className="w-10 h-10 rounded-full bg-[#72f534]/20 border border-[#72f534]/50 flex items-center justify-center text-[#72f534] hover:bg-[#72f534] hover:text-black transition-all">
                <ChevronDown className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 font-semibold">Scroll</span>
            </button>
          </div>
        </div>

        {/* Playback progress bar with 2-second marker */}
        <div className="relative z-10 w-full h-1.5 bg-white/20">
          <div
            style={{ width: `${(playbackSeconds / currentShort.durationSeconds) * 100}%` }}
            className={`h-full transition-all duration-300 ${
              hasRecordedCurrent ? 'bg-[#72f534]' : 'bg-white'
            }`}
          />
          {/* Threshold pip */}
          <div
            style={{ left: `${(settings.viewThresholdSeconds / currentShort.durationSeconds) * 100}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
            title={`View recorded after ${settings.viewThresholdSeconds}s`}
          />
        </div>
      </div>

      {/* Optional In-Page Floating Pill Indicator (PDF Page 3 & Section 15) */}
      {settings.inPageIndicatorEnabled && !inPageDismissed && (
        <div
          onClick={() => {}}
          className={`absolute z-30 transition-all ${
            settings.inPageIndicatorPosition === 'top-left'
              ? 'top-8 left-8'
              : settings.inPageIndicatorPosition === 'top-right'
              ? 'top-8 right-8'
              : settings.inPageIndicatorPosition === 'bottom-left'
              ? 'bottom-8 left-8'
              : 'bottom-8 right-8'
          }`}
        >
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#111612]/95 backdrop-blur-md border border-[#2b3d2d] rounded-full shadow-lg text-xs text-slate-100 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#72f534]" />
            <span>
              <b>Shorts today: {todayCount}</b> · All platforms: {allPlatformsCount}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setInPageDismissed(true);
              }}
              className="text-slate-500 hover:text-white text-xs pl-1 cursor-pointer"
              title="Dismiss in-page indicator"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Simulator Quick Controls under the video card */}
      <div className="mt-4 flex items-center gap-2 bg-[#141b15] px-3 py-2 rounded-2xl border border-white/10 text-xs">
        <button
          onClick={handlePrevVideo}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Previous video"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          onClick={handleNextVideo}
          className="px-3 py-1 rounded-lg bg-[#72f534] hover:bg-[#86ff4d] text-black font-semibold flex items-center gap-1"
        >
          <span>Next Video</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] text-slate-400 pl-2">
          Video {videoIndex + 1} of {playlist.length}
        </span>
      </div>
    </div>
  );
}
