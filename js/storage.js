// =========================================================================
// Gaining Our Life Back — Offline-First Storage & Data Portability
// =========================================================================

window.DetoxStorage = {
  loadLocalState() {
    const keys = window.DetoxConstants.LOCAL_STORAGE_KEYS;
    const result = {
      timer: null,
      laps: [],
      urgesDefeated: 0,
      activeTab: 'stopwatch'
    };

    try {
      const cachedTimer = localStorage.getItem(keys.TIMER);
      if (cachedTimer) {
        result.timer = JSON.parse(cachedTimer);
      }

      const cachedLaps = localStorage.getItem(keys.LAPS);
      if (cachedLaps) {
        const parsed = JSON.parse(cachedLaps);
        if (Array.isArray(parsed)) result.laps = parsed;
      }

      const cachedStats = localStorage.getItem(keys.STATS);
      if (cachedStats) {
        const parsed = JSON.parse(cachedStats);
        result.urgesDefeated = Number(parsed.urgesDefeated || 0);
      }

      const cachedTab = localStorage.getItem(keys.ACTIVE_TAB);
      if (cachedTab) {
        result.activeTab = cachedTab;
      }
    } catch (e) {
      console.warn("Error reading from localStorage:", e);
    }

    return result;
  },

  saveTimer(timer) {
    try {
      const keys = window.DetoxConstants.LOCAL_STORAGE_KEYS;
      localStorage.setItem(keys.TIMER, JSON.stringify({
        ...timer,
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.warn("Error saving timer:", e);
    }
  },

  saveLaps(laps) {
    try {
      const keys = window.DetoxConstants.LOCAL_STORAGE_KEYS;
      localStorage.setItem(keys.LAPS, JSON.stringify(laps));
    } catch (e) {
      console.warn("Error saving laps:", e);
    }
  },

  saveStats(urgesDefeated) {
    try {
      const keys = window.DetoxConstants.LOCAL_STORAGE_KEYS;
      localStorage.setItem(keys.STATS, JSON.stringify({
        urgesDefeated,
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.warn("Error saving stats:", e);
    }
  },

  saveActiveTab(tabName) {
    try {
      const keys = window.DetoxConstants.LOCAL_STORAGE_KEYS;
      localStorage.setItem(keys.ACTIVE_TAB, tabName);
    } catch (e) {
      console.warn("Error saving active tab:", e);
    }
  },

  exportCSV(laps) {
    if (!laps || laps.length === 0) return false;

    const headers = [
      "Lap_Number",
      "Hours_Avoided",
      "Duration_Formatted",
      "Relapsed_At",
      "Time_Of_Day_Bucket",
      "Platform",
      "Triggers",
      "What_Happened_Before",
      "Feeling_Before",
      "Feeling_Before_Note",
      "Feeling_After",
      "Feeling_After_Note",
      "Relapse_Duration",
      "Next_Time_Plan"
    ];

    // Quote every text cell, double embedded quotes, and neutralize leading
    // =, +, -, @ so spreadsheets don't treat user text as a formula.
    const cell = (value) => {
      let s = String(value ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };

    const total = laps.length;
    const rows = laps.map((l, idx) => [
      total - idx,
      Number(l.hoursAvoided) || 0,
      cell(window.DetoxConstants.formatDurationCompact(l.durationMs)),
      cell(new Date(l.relapsedAtMs).toISOString()),
      cell(l.timeOfDayBucket),
      cell(l.platform),
      cell((l.triggers || []).join('; ')),
      cell(l.whatHappenedBefore),
      cell(l.feelingBefore),
      cell(l.feelingBeforeNote),
      cell(l.feelingAfter),
      cell(l.feelingAfterNote),
      cell(l.relapseDuration),
      cell(l.nextTimePlan)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detox-pulse-laps-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  exportJSON(timer, laps, urgesDefeated) {
    const payload = {
      exportedAt: new Date().toISOString(),
      currentStreakTimer: timer,
      urgesDefeated: urgesDefeated || 0,
      laps: laps || []
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detox-pulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  copySummaryReport(currentElapsedMs, laps, urgesDefeated) {
    const elapsed = window.DetoxConstants.formatDurationCompact(currentElapsedMs);
    const lines = [
      `=== SOCIAL MEDIA DETOX & RELAPSE PATTERN REPORT ===`,
      `Current Clean Streak: ${elapsed}`,
      `Total Relapses Logged: ${laps.length}`,
      `Urges Surfed / Defeated: ${urgesDefeated || 0}`,
      ``,
      `--- RECENT LAPS ---`,
      ...laps.slice(0, 10).map((l, i) =>
        `Lap #${laps.length - i}: Avoided ${window.DetoxConstants.formatDurationCompact(l.durationMs)} (${l.hoursAvoided}h) | Failed in ${l.timeOfDayBucket} on ${l.platform} | Trigger: ${(l.triggers || []).join(', ')} | Felt ${l.feelingBefore} -> ${l.feelingAfter}`
      )
    ];

    const textarea = document.createElement('textarea');
    textarea.value = lines.join('\n');
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  },

  getSampleLogs() {
    const now = Date.now();
    const hr = 3600 * 1000;

    return [
      {
        durationMs: 6.5 * hr,
        hoursAvoided: 6.5,
        startedAtMs: now - 52 * hr,
        relapsedAtMs: now - 45.5 * hr,
        timeOfDayBucket: "Late Night",
        platform: "Instagram",
        triggers: ["In Bed / Waking or Sleeping", "Lonely / Tired", "Muscle Memory / Phone Unlock"],
        whatHappenedBefore: "Brought phone to bed to set alarm, thumb automatically tapped Instagram.",
        feelingBefore: "Tired",
        feelingBeforeNote: "Exhausted after long day, wanted 5 mins of distraction.",
        feelingAfter: "Regretful",
        feelingAfterNote: "Scrolled reels for 45 mins and lost sleep.",
        relapseDuration: "30 mins",
        nextTimePlan: "Put phone on charging desk across the bedroom."
      },
      {
        durationMs: 14.2 * hr,
        hoursAvoided: 14.2,
        startedAtMs: now - 44 * hr,
        relapsedAtMs: now - 29.8 * hr,
        timeOfDayBucket: "Afternoon",
        platform: "YouTube / Shorts",
        triggers: ["Stuck on a Hard Task", "Procrastinating"],
        whatHappenedBefore: "Hit a roadblock on a difficult task and opened a new browser tab.",
        feelingBefore: "Stressed",
        feelingBeforeNote: "Felt mentally blocked and wanted quick relief.",
        feelingAfter: "Brain-Fogged",
        feelingAfterNote: "Task was still waiting for me, plus my focus was scattered.",
        relapseDuration: "15 mins",
        nextTimePlan: "Take a 5-minute walk outside instead of opening new tabs."
      },
      {
        durationMs: 19.75 * hr,
        hoursAvoided: 19.75,
        startedAtMs: now - 29 * hr,
        relapsedAtMs: now - 9.25 * hr,
        timeOfDayBucket: "Late Night",
        platform: "Reddit",
        triggers: ["Boredom", "Lonely / Tired"],
        whatHappenedBefore: "Finished dinner and sat on the couch without a plan for the evening.",
        feelingBefore: "Bored",
        feelingBeforeNote: "Restless and under-stimulated.",
        feelingAfter: "Still Bored",
        feelingAfterNote: "Mindlessly refreshed threads and didn't even enjoy it.",
        relapseDuration: "1+ hour",
        nextTimePlan: "Pick up a physical book immediately after eating dinner."
      }
    ];
  }
};
