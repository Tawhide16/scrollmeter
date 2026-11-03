import React from 'react';
import { DailySummary } from '../types/scrollmeter';
import { ScrollMeterLogo } from './PlatformIcons';
import { formatDuration } from '../utils/analytics';
import { X, ExternalLink, Bell } from 'lucide-react';

interface NotificationToastProps {
  summary: DailySummary;
  onClose: () => void;
  onOpenDetails: () => void;
}

export function NotificationToast({ summary, onClose, onOpenDetails }: NotificationToastProps) {
  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#141d16] border border-[#2b442e] rounded-2xl shadow-2xl p-4 text-slate-100 animate-slide-down">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#223524] border border-[#345237] flex items-center justify-center text-[#72f534]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>ScrollMeter</span>
              <span className="text-[10px] text-[#72f534] bg-[#72f534]/10 px-1.5 py-0.2 rounded font-normal">
                Daily report
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Scheduled Notification (9:00 PM)</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-300">
        <p className="font-medium text-white">
          Today you watched <b>{summary.total} short videos</b> across {Object.values(summary.platformBreakdown).filter((v) => v > 0).length} platforms.
        </p>

        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5">
          <span>YouTube: <b>{summary.platformBreakdown.youtube}</b></span>
          <span>•</span>
          <span>Instagram: <b>{summary.platformBreakdown.instagram}</b></span>
          <span>•</span>
          <span>TikTok: <b>{summary.platformBreakdown.tiktok}</b></span>
          <span>•</span>
          <span>Facebook: <b>{summary.platformBreakdown.facebook}</b></span>
        </div>

        <div className="text-[11px] text-slate-400 pt-1">
          Unique creators: <b>{summary.uniqueCreatorsCount}</b> · Est. watch time: <b>{formatDuration(summary.estimatedSeconds)}</b>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={() => {
            onOpenDetails();
            onClose();
          }}
          className="text-xs text-[#72f534] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>Open ScrollMeter to view details</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        <button
          onClick={onClose}
          className="text-[11px] text-slate-400 hover:text-slate-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
