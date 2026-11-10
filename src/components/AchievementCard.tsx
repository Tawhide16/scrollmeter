import React from 'react';
import { WellbeingStreakSummary } from '../types/scrollmeter';
import { Flame, Award, HeartHandshake, Footprints, Sparkles, CheckCircle2 } from 'lucide-react';

interface AchievementCardProps {
  streakSummary: WellbeingStreakSummary;
}

export function AchievementCard({ streakSummary }: AchievementCardProps) {
  const getMilestoneIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints':
        return <Footprints className="w-4 h-4 text-[#72f534]" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-4 h-4 text-emerald-400" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      default:
        return <Award className="w-4 h-4 text-[#72f534]" />;
    }
  };

  return (
    <div className="bg-[#141a15] border border-[#233125] rounded-2xl p-4 text-slate-100 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#1e2a20] text-[#72f534] border border-[#2e4031]">
            <Flame className="w-5 h-5 fill-[#72f534]/20" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Mindful Streaks</h3>
            <p className="text-[11px] text-slate-400">Digital wellbeing & conscious habits</p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 text-right">
          <span className="text-2xl font-black text-[#72f534]">{streakSummary.currentStreakDays}</span>
          <span className="text-[11px] text-slate-400 font-medium">days</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 my-3">
        <div className="bg-[#101511] p-2.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] text-slate-400 block mb-0.5">Best Streak</span>
          <span className="text-sm font-bold text-slate-200">{streakSummary.longestStreakDays}d</span>
        </div>
        <div className="bg-[#101511] p-2.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] text-slate-400 block mb-0.5">Mindful Days</span>
          <span className="text-sm font-bold text-emerald-400">{streakSummary.mindfulDaysCount}d</span>
        </div>
        <div className="bg-[#101511] p-2.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] text-slate-400 block mb-0.5">Total Tracked</span>
          <span className="text-sm font-bold text-slate-200">{streakSummary.totalDaysMonitored}d</span>
        </div>
      </div>

      <div className="space-y-2 mt-3 pt-2 border-t border-white/5">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Milestones</span>
        <div className="grid grid-cols-2 gap-2">
          {streakSummary.milestones.map((m) => (
            <div
              key={m.id}
              className={`p-2 rounded-xl border transition-all ${
                m.unlocked
                  ? 'bg-[#18231a] border-[#2b3d2d] text-white'
                  : 'bg-[#101511]/70 border-white/5 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="p-1 rounded-lg bg-black/40">{getMilestoneIcon(m.icon)}</div>
                {m.unlocked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#72f534]" />
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">{m.progressPercent}%</span>
                )}
              </div>
              <h4 className="text-xs font-semibold truncate">{m.title}</h4>
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
