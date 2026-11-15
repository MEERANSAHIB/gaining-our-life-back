// =========================================================================
// Gaining Our Life Back — Application Constants & Configuration
// =========================================================================

window.DetoxConstants = {
  USER_FIREBASE_CONFIG: {
    apiKey: "AIzaSyDRteOAVEDDskM5SaPHujn2_nAPQi_KUwk",
    authDomain: "gaining-our-life-back.firebaseapp.com",
    projectId: "gaining-our-life-back",
    storageBucket: "gaining-our-life-back.firebasestorage.app",
    messagingSenderId: "528979959431",
    appId: "1:528979959431:web:9c0160224283c08ef52222",
    measurementId: "G-N7ZQJ369CN"
  },

  STANDALONE_APP_ID: "gaining-our-life-back-v1",

  LOCAL_STORAGE_KEYS: {
    TIMER: 'detox_pulse_timer_cache_v1',
    LAPS: 'detox_pulse_laps_cache_v1',
    STATS: 'detox_pulse_stats_v1',
    ACTIVE_TAB: 'detox_active_tab_v1'
  },

  PLATFORM_OPTIONS: [
    "Instagram",
    "YouTube / Shorts",
    "TikTok / Reels",
    "X / Twitter",
    "Reddit",
    "Facebook",
    "LinkedIn",
    "WhatsApp / Telegram",
    "Other"
  ],

  TRIGGER_OPTIONS: [
    "Boredom",
    "Muscle Memory / Phone Unlock",
    "Stuck on a Hard Task",
    "Procrastinating",
    "In Bed / Waking or Sleeping",
    "Notification",
    "Stress / Overwhelmed",
    "Lonely / Tired",
    "Waiting / In Transit"
  ],

  FEELING_BEFORE_OPTIONS: [
    "Anxious",
    "Restless",
    "Bored",
    "Brain-Fogged",
    "Stressed",
    "Curious",
    "Tired",
    "Urge / Craving"
  ],

  FEELING_AFTER_OPTIONS: [
    "Guilty",
    "Drained",
    "Regretful",
    "Numb",
    "Still Bored",
    "Distracted",
    "Relieved",
    "Motivated to Reset"
  ],

  RELAPSE_DURATION_OPTIONS: [
    "< 5 mins",
    "15 mins",
    "30 mins",
    "1+ hour"
  ],

  MILESTONES: [
    { id: 'm1', icon: '🥉', title: 'Day One Hero', targetHours: 24, desc: '24 hours social-free' },
    { id: 'm2', icon: '🥈', title: 'Dopamine Reset', targetHours: 72, desc: '3 full days clean' },
    { id: 'm3', icon: '🥇', title: 'One Week Warrior', targetHours: 168, desc: '7 days freedom' },
    { id: 'm4', icon: '💎', title: 'Habit Breaker', targetHours: 336, desc: '14 days mastered' },
    { id: 'm5', icon: '👑', title: 'Life Reclaimed', targetHours: 720, desc: '30 days transformed' }
  ],

  formatDurationCompact(ms) {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    return `${seconds}s`;
  },

  formatHoursLabel(ms) {
    const hrs = ms / (1000 * 60 * 60);
    if (hrs >= 48) return `${(hrs / 24).toFixed(1)} days (${hrs.toFixed(1)} hrs)`;
    return `${hrs.toFixed(2)} hrs`;
  },

  getTimeOfDayBucket(dateObj) {
    const hour = dateObj.getHours();
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 22) return "Evening";
    return "Late Night";
  },

  formatDateTimeReadable(epochMs) {
    if (!epochMs) return "";
    const d = new Date(epochMs);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
