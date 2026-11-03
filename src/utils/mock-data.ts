import { ViewingEvent, UserSettings } from '../types/scrollmeter';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  trackingPaused: false,
  enabledPlatforms: {
    youtube: true,
    instagram: true,
    tiktok: true,
    facebook: true,
  },
  viewThresholdSeconds: 2,
  dailyReportEnabled: true,
  dailyReportTime: '21:00', // 9:00 PM
  inPageIndicatorEnabled: true,
  inPageIndicatorPosition: 'bottom-right',
  retentionDays: 30,
  storageBackend: 'indexeddb',
  encryptionEnabled: false,
  cloudSyncEnabled: false, // Core privacy requirement: Cloud sync strictly OFF by default
};

// Seed dataset perfectly aligned with user's mockup:
// 42 total today: 18 YouTube, 12 Instagram, 8 TikTok, 4 Facebook
// Top creators: MrBeast (8), Dude Perfect (6), Tech Burner (5), etc.
export function generateSeedEvents(): ViewingEvent[] {
  const now = Date.now();
  const events: ViewingEvent[] = [];

  const creators = [
    { name: 'MrBeast', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face' },
    { name: 'Dude Perfect', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face' },
    { name: 'Tech Burner', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
    { name: 'Khaby Lame', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
    { name: 'Zach King', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face' },
    { name: 'Veritasium', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face' },
    { name: 'MKBHD', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' },
  ];

  // Helper to generate events
  let idCounter = 1;
  const addEvent = (
    platform: 'youtube' | 'instagram' | 'tiktok' | 'facebook',
    creatorIndex: number,
    offsetMinsAgo: number,
    title: string,
    watchSecs: number = 22
  ) => {
    const creator = creators[creatorIndex % creators.length];
    const timestamp = now - offsetMinsAgo * 60 * 1000;
    events.push({
      eventId: `seed_${idCounter++}`,
      platform,
      contentType: platform === 'youtube' ? 'short' : (platform === 'tiktok' ? 'video' : 'reel'),
      contentId: `reel_${platform}_${idCounter}`,
      contentUrl: platform === 'youtube' 
        ? `https://www.youtube.com/shorts/sample_${idCounter}`
        : `https://www.instagram.com/reel/sample_${idCounter}/`,
      title,
      creatorName: creator.name,
      creatorAvatar: creator.avatar,
      startedAt: timestamp,
      watchSeconds: watchSecs,
      detectionConfidence: 'high',
    });
  };

  // Recent activity: 2 minutes ago - YouTube Short by MrBeast
  addEvent('youtube', 0, 2, 'Surviving 24 Hours in a Desert', 34);

  // Remaining YouTube Shorts (17 more to reach 18)
  // MrBeast 7 more to get 8 total
  for (let i = 0; i < 7; i++) {
    addEvent('youtube', 0, 15 + i * 20, `MrBeast Extreme Challenge #${i + 1}`, 28);
  }
  // Dude Perfect 5 YouTube shorts
  for (let i = 0; i < 5; i++) {
    addEvent('youtube', 1, 60 + i * 25, `Dude Perfect Trick Shots Vol ${i + 1}`, 35);
  }
  // Tech Burner 3 YouTube shorts
  for (let i = 0; i < 3; i++) {
    addEvent('youtube', 2, 120 + i * 30, `Crazy Tech Gadget You Never Knew #${i + 1}`, 24);
  }
  // Others to reach 18 total for YouTube
  addEvent('youtube', 5, 200, 'The Physics of Impossible Things', 45);
  addEvent('youtube', 6, 240, 'Smartphone Mystery Feature Revealed', 18);

  // Instagram Reels (12 total)
  // Dude Perfect 1 reel (total 6)
  addEvent('instagram', 1, 30, 'Basketball Bottle Flip', 20);
  // Tech Burner 2 reels (total 5)
  addEvent('instagram', 2, 50, 'Smart Ring Review in 30 Seconds', 26);
  addEvent('instagram', 2, 90, 'Transparent TV Demonstration', 30);
  // Khaby Lame 5 reels
  for (let i = 0; i < 5; i++) {
    addEvent('instagram', 3, 110 + i * 20, `Simple Life Hack Reaction #${i + 1}`, 15);
  }
  // Zach King 4 reels
  for (let i = 0; i < 4; i++) {
    addEvent('instagram', 4, 180 + i * 25, `Illusion Magic Trick #${i + 1}`, 19);
  }

  // TikTok (8 total)
  for (let i = 0; i < 4; i++) {
    addEvent('tiktok', 3, 40 + i * 30, `Khaby TikTok Compilation #${i + 1}`, 12);
  }
  for (let i = 0; i < 4; i++) {
    addEvent('tiktok', 4, 140 + i * 30, `Zach King VFX Magic Drop #${i + 1}`, 16);
  }

  // Facebook Reels (4 total)
  addEvent('facebook', 5, 75, 'Science Experiment at Home', 40);
  addEvent('facebook', 6, 115, 'Retro Tech Restoration', 32);
  addEvent('facebook', 2, 165, 'Futuristic Concept Car Preview', 28);
  addEvent('facebook', 1, 210, 'Epic Ping Pong Trick Shot', 22);

  // Also seed other days of the week to populate "Your Weekly Trend" (Mon: 34, Tue: 48, Wed: 68, Thu: 52, Fri: 45, Sat: 55, Sun: 42)
  const d = new Date();
  const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDate = new Date(d);
  mondayDate.setDate(d.getDate() + distanceToMon);
  mondayDate.setHours(12, 0, 0, 0);

  const pastDayCounts = [34, 48, 68, 52, 45, 55, 42]; // Mon to Sun, with Wed at 68 (matches mockup badge!)
  
  for (let dayIdx = 0; dayIdx < 30; dayIdx++) {
    const targetDay = new Date(d);
    targetDay.setDate(d.getDate() - dayIdx);
    targetDay.setHours(14, 0, 0, 0);

    // Skip day 0 (today) so today's exact 42 items are preserved
    if (dayIdx === 0) continue;

    // Use specific mockup counts for the recent week days, and pseudo-random realistic counts for earlier days
    let countForDay = 45;
    if (dayIdx < 7) {
      countForDay = pastDayCounts[dayIdx % 7];
    } else {
      countForDay = 38 + ((dayIdx * 7) % 25); // 38 to 62
    }

    for (let c = 0; c < countForDay; c++) {
      const plat: 'youtube' | 'instagram' | 'tiktok' | 'facebook' = 
        c % 4 === 0 ? 'youtube' : (c % 4 === 1 ? 'instagram' : (c % 4 === 2 ? 'tiktok' : 'facebook'));
      
      const creator = creators[(c + dayIdx) % creators.length];
      const eventTime = targetDay.getTime() - (c * 18 * 60 * 1000);
      events.push({
        eventId: `hist_${dayIdx}_${c}`,
        platform: plat,
        contentType: plat === 'youtube' ? 'short' : (plat === 'tiktok' ? 'video' : 'reel'),
        contentId: `hist_reel_${dayIdx}_${c}`,
        contentUrl: plat === 'youtube' 
          ? `https://www.youtube.com/shorts/hist_${dayIdx}_${c}` 
          : `https://www.instagram.com/reel/hist_${dayIdx}_${c}/`,
        title: `${creator.name} Viral Clip #${c + 1}`,
        creatorName: creator.name,
        creatorAvatar: creator.avatar,
        startedAt: eventTime,
        watchSeconds: 22 + ((c * 3) % 45),
        detectionConfidence: 'high',
      });
    }
  }

  return events;
}
