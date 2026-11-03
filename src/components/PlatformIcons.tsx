import React from 'react';
import { Platform } from '../types/scrollmeter';

export function ScrollMeterLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="10" width="3.5" height="10" rx="1.75" fill="#72f534" />
      <rect x="9.5" y="4" width="3.5" height="16" rx="1.75" fill="#72f534" />
      <rect x="16" y="7" width="3.5" height="13" rx="1.75" fill="#72f534" />
    </svg>
  );
}

export function PlatformIcon({ platform, className = "w-4 h-4" }: { platform: Platform; className?: string }) {
  switch (platform) {
    case 'youtube':
      return (
        <div className={`flex items-center justify-center shrink-0 ${className}`}>
          {/* Authentic YouTube brand mark */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            <rect width="24" height="24" rx="6" fill="#FF0000" />
            <path d="M10 7.5L16 12L10 16.5V7.5Z" fill="white" />
          </svg>
        </div>
      );
    case 'instagram':
      return (
        <div className={`flex items-center justify-center shrink-0 ${className}`}>
          {/* Authentic Instagram brand mark with official multi-stop gradient */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            <defs>
              <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433" />
                <stop offset="25%" stopColor="#e6683c" />
                <stop offset="50%" stopColor="#dc2743" />
                <stop offset="75%" stopColor="#cc2366" />
                <stop offset="100%" stopColor="#bc1888" />
              </linearGradient>
            </defs>
            <rect width="24" height="24" rx="6.5" fill="url(#ig-grad)" />
            {/* Camera outline */}
            <rect x="5" y="5" width="14" height="14" rx="4" stroke="white" strokeWidth="1.8" />
            {/* Lens */}
            <circle cx="12" cy="12" r="3.2" stroke="white" strokeWidth="1.8" />
            {/* Flash dot */}
            <circle cx="15.8" cy="8.2" r="0.9" fill="white" />
          </svg>
        </div>
      );
    case 'tiktok':
      return (
        <div className={`flex items-center justify-center shrink-0 ${className}`}>
          {/* Authentic TikTok brand mark with cyan & magenta overlapping musical note */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            <rect width="24" height="24" rx="6" fill="#000000" />
            {/* Cyan layer */}
            <path
              d="M16.5 7.8c-.8-.5-1.5-1.2-1.8-2.1H12.5v9.1c0 1.2-1 2.2-2.2 2.2-1.2 0-2.2-1-2.2-2.2 0-1.2 1-2.2 2.2-2.2.3 0 .6.1.8.2v-2.3c-.3 0-.5-.1-.8-.1-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5V9.4c1 .7 2.1 1.1 3.4 1.1v-2.3c-.6 0-1.2-.2-1.7-.4z"
              fill="#25F4EE"
              transform="translate(-0.6, -0.6)"
            />
            {/* Magenta/Red layer */}
            <path
              d="M16.5 7.8c-.8-.5-1.5-1.2-1.8-2.1H12.5v9.1c0 1.2-1 2.2-2.2 2.2-1.2 0-2.2-1-2.2-2.2 0-1.2 1-2.2 2.2-2.2.3 0 .6.1.8.2v-2.3c-.3 0-.5-.1-.8-.1-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5V9.4c1 .7 2.1 1.1 3.4 1.1v-2.3c-.6 0-1.2-.2-1.7-.4z"
              fill="#FE2C55"
              transform="translate(0.6, 0.6)"
            />
            {/* White overlay */}
            <path
              d="M16.5 7.8c-.8-.5-1.5-1.2-1.8-2.1H12.5v9.1c0 1.2-1 2.2-2.2 2.2-1.2 0-2.2-1-2.2-2.2 0-1.2 1-2.2 2.2-2.2.3 0 .6.1.8.2v-2.3c-.3 0-.5-.1-.8-.1-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5V9.4c1 .7 2.1 1.1 3.4 1.1v-2.3c-.6 0-1.2-.2-1.7-.4z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
    case 'facebook':
      return (
        <div className={`flex items-center justify-center shrink-0 ${className}`}>
          {/* Authentic Facebook official blue brand mark with exact 'f' glyph */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            <rect width="24" height="24" rx="6" fill="#1877F2" />
            <path
              d="M16.5 12.8H14V21H10.5V12.8H8.8V9.8H10.5V7.7C10.5 6.2 11.4 4.5 14.1 4.5L16.5 4.5V7.4H14.8C14.1 7.4 14 7.7 14 8.2V9.8H16.6L16.5 12.8Z"
              fill="white"
            />
          </svg>
        </div>
      );
  }
}
