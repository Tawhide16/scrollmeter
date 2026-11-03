import React, { useState } from 'react';
import { ViewingEvent, Platform } from '../types/scrollmeter';
import { getTopCreators, formatDuration } from '../utils/analytics';
import { PlatformIcon } from './PlatformIcons';
import { PlatformTabs } from './PlatformTabs';
import { Search, Edit3, ArrowLeft, Check, Video, Clock } from 'lucide-react';

interface CreatorsViewProps {
  events: ViewingEvent[];
  onBack: () => void;
  onUpdateCreatorName: (oldName: string, newName: string) => void;
}

export function CreatorsView({ events, onBack, onUpdateCreatorName }: CreatorsViewProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [editingCreator, setEditingCreator] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');

  // Filter events before aggregating creators if platform filter is selected
  const filteredEvents = platformFilter === 'all'
    ? events
    : events.filter((e) => e.platform === platformFilter);

  const creators = getTopCreators(filteredEvents, 100);

  const displayedCreators = creators.filter((c) =>
    c.creatorName.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (currentName: string) => {
    setEditingCreator(currentName);
    setNewNameInput(currentName === 'Unknown creator' ? '' : currentName);
  };

  const handleSaveRename = (originalName: string) => {
    if (newNameInput.trim() && newNameInput.trim() !== originalName) {
      onUpdateCreatorName(originalName, newNameInput.trim());
    }
    setEditingCreator(null);
  };

  return (
    <div className="w-[380px] h-full max-h-full bg-[#101511] text-slate-100 rounded-3xl border border-[#233125] shadow-2xl overflow-hidden flex flex-col font-sans">
      {/* Header (Pinned) */}
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
            <h1 className="font-bold text-[17px] text-white">Top Creators</h1>
            <p className="text-[11px] text-slate-400">Ranked by watched shorts & reels</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#18231a] text-[#72f534] border border-[#2b3d2d]">
          {creators.length} creators
        </span>
      </div>

      {/* Search & Platform Filter (Pinned) */}
      <div className="p-4 space-y-3 border-b border-white/5 shrink-0 bg-[#101511]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search creator name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#172219] border border-[#263728] focus:border-[#72f534] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Platform tabs with smooth horizontal scroll into view */}
        <PlatformTabs
          selectedPlatform={platformFilter}
          onSelectPlatform={setPlatformFilter}
        />
      </div>

      {/* Creators List (Scrollable) */}
      <div className="flex-1 p-4 space-y-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {displayedCreators.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Video className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#72f534]" />
            <p className="text-xs">No creators found matching criteria.</p>
          </div>
        ) : (
          displayedCreators.map((creator, index) => (
            <div
              key={creator.creatorName}
              className="p-3 bg-[#172219] border border-[#263728] rounded-2xl flex items-center justify-between gap-3 hover:border-[#334b36] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank number */}
                <div className="w-5 text-center text-xs font-bold text-slate-500">
                  {index < 3 ? (
                    <span className="text-[#72f534]">#{index + 1}</span>
                  ) : (
                    `#${index + 1}`
                  )}
                </div>

                {/* Avatar */}
                <img
                  src={
                    creator.creatorAvatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
                  }
                  alt={creator.creatorName}
                  className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                />

                {/* Info or Edit Input */}
                <div className="min-w-0">
                  {editingCreator === creator.creatorName ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <input
                        type="text"
                        value={newNameInput}
                        onChange={(e) => setNewNameInput(e.target.value)}
                        placeholder="Creator name"
                        className="px-2 py-0.5 bg-[#0e1310] border border-[#72f534] rounded text-xs text-white focus:outline-none w-32"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(creator.creatorName)}
                        className="p-1 rounded bg-[#72f534] text-black hover:bg-[#86ff4d]"
                        title="Save correction"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate max-w-[140px]">
                        {creator.creatorName}
                      </span>
                      {creator.creatorName === 'Unknown creator' && (
                        <button
                          onClick={() => handleStartRename(creator.creatorName)}
                          className="text-[#72f534] hover:underline text-[10px] flex items-center gap-0.5"
                          title="Correct unknown creator"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          Fix
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    {/* Platform badges */}
                    <div className="flex -space-x-1">
                      {creator.platforms.map((p) => (
                        <PlatformIcon key={p} platform={p} className="w-3.5 h-3.5 shadow" />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Est. ~{formatDuration(creator.totalSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Views badge */}
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-[#72f534] block">
                  {creator.totalViews}
                </span>
                <span className="text-[10px] text-slate-400">
                  {creator.totalViews === 1 ? 'view' : 'reels'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
