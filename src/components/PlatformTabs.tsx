import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Platform } from '../types/scrollmeter';
import { PlatformIcon } from './PlatformIcons';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface PlatformTabsProps {
  selectedPlatform: Platform | 'all';
  onSelectPlatform: (platform: Platform | 'all') => void;
  className?: string;
}

const PLATFORMS: { id: Platform | 'all'; label: string }[] = [
  { id: 'all', label: 'All Platforms' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
];

export function PlatformTabs({ selectedPlatform, onSelectPlatform, className = '' }: PlatformTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll bounds to update arrow/gradient indicators
  const updateScrollBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  // Smoothly center or scroll target tab into view
  const scrollToTab = useCallback((tabId: string) => {
    const container = containerRef.current;
    const tab = tabRefs.current[tabId];
    if (!container || !tab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    // Calculate position relative to container
    const relativeLeft = tabRect.left - containerRect.left + container.scrollLeft;
    // Calculate scroll offset to position tab centered or nicely in view
    const targetScrollLeft = relativeLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);

    container.scrollTo({
      left: Math.max(0, Math.min(targetScrollLeft, container.scrollWidth - container.clientWidth)),
      behavior: 'smooth',
    });
  }, []);

  // Trigger smooth scroll when selected platform changes
  useEffect(() => {
    scrollToTab(selectedPlatform);
    // Re-check bounds after animation
    const t = setTimeout(updateScrollBounds, 350);
    return () => clearTimeout(t);
  }, [selectedPlatform, scrollToTab, updateScrollBounds]);

  // Initial bounds check on mount & resize
  useEffect(() => {
    updateScrollBounds();
    window.addEventListener('resize', updateScrollBounds);
    return () => window.removeEventListener('resize', updateScrollBounds);
  }, [updateScrollBounds]);

  const handleTabClick = (p: Platform | 'all') => {
    onSelectPlatform(p);
    scrollToTab(p);
  };

  const scrollByAmount = (delta: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
      setTimeout(updateScrollBounds, 350);
    }
  };

  // Convert mouse wheel vertically into horizontal tab scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (containerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      containerRef.current.scrollBy({ left: e.deltaY, behavior: 'auto' });
      updateScrollBounds();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Left Scroll Arrow Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-110)}
          aria-label="Scroll tabs left"
          className="absolute -left-1 z-20 w-6 h-6 rounded-full bg-[#162218] hover:bg-[#203223] border border-[#2e4732] text-slate-200 hover:text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Scrollable Container with smooth scrolling */}
      <div
        ref={containerRef}
        onScroll={updateScrollBounds}
        onWheel={handleWheel}
        className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-1 scrollbar-none w-full select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PLATFORMS.map((item) => {
          const isSelected = selectedPlatform === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[item.id] = el;
              }}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isSelected
                  ? 'text-[#0e1310] font-bold'
                  : 'text-slate-300 hover:text-white bg-[#172219] hover:bg-[#1f2f22] border border-[#243426]'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activePlatformPill"
                  className="absolute inset-0 bg-[#72f534] rounded-full shadow-sm"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {item.id === 'all' ? (
                  <Layers className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-[#72f534]'}`} />
                ) : (
                  <PlatformIcon platform={item.id} className="w-3.5 h-3.5" />
                )}
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
        {/* End spacer to ensure Facebook is never clipped at the right margin */}
        <div className="shrink-0 w-8 h-4 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Right Scroll Arrow Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(110)}
          aria-label="Scroll tabs right"
          className="absolute -right-1 z-20 w-6 h-6 rounded-full bg-[#162218] hover:bg-[#203223] border border-[#2e4732] text-slate-200 hover:text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
