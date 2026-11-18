// =========================================================================
// Gaining Our Life Back — Main Application Orchestrator
// =========================================================================

// Firebase is loaded lazily (see loadFirebase) instead of with static imports,
// so the stopwatch, journal and analytics keep working from localStorage even
// when the CDN is offline or blocked (airplane mode, Brave Shields, firewalls).
const FIREBASE_VERSION = "11.6.1";
let initializeApp,
  getAuth, signInAnonymously, signInWithCredential, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, linkWithPopup, signInWithRedirect,
  linkWithRedirect, getRedirectResult, signOut,
  getFirestore, doc, addDoc, setDoc, deleteDoc, onSnapshot, collection;

async function loadFirebase() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [appMod, authMod, fsMod] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`)
  ]);
  ({ initializeApp } = appMod);
  ({
    getAuth, signInAnonymously, signInWithCredential, onAuthStateChanged,
    GoogleAuthProvider, signInWithPopup, linkWithPopup, signInWithRedirect,
    linkWithRedirect, getRedirectResult, signOut
  } = authMod);
  ({ getFirestore, doc, addDoc, setDoc, deleteDoc, onSnapshot, collection } = fsMod);
}

// Application State
const state = {
  user: null,
  userId: null,
  isCloudConnected: false,
  usingFallbackEnvironment: false,
  appId: window.DetoxConstants.STANDALONE_APP_ID,

  timer: {
    isRunning: false,
    currentLapStartTime: null,
    accumulatedMs: 0,
    streakInitialStartTime: null
  },

  urgesDefeated: 0,
  laps: [],
  activeTab: 'stopwatch',

  pendingRelapse: {
    durationMs: 0,
    timestampMs: Date.now(),
    timeBucket: "Afternoon",
    selectedPlatform: null,
    selectedTriggers: [],
    selectedFeelingBefore: null,
    selectedFeelingAfter: null,
    selectedRelapseDuration: null
  },

  resetConfirmPending: false,
  deleteConfirmLapId: null,
  searchQuery: "",
  filterBucket: "ALL"
};

// DOM References Cache
let el = {};
let db = null;
let auth = null;
let unsubscribeTimer = null;
let unsubscribeLaps = null;

function queryElements() {
  el = {
    // Top Bar & Sync
    cloudStatusBadge: document.getElementById('cloudStatusBadge'),
    cloudStatusDot: document.getElementById('cloudStatusDot'),
    cloudStatusText: document.getElementById('cloudStatusText'),
    googleSignInBtn: document.getElementById('googleSignInBtn'),
    userProfileBar: document.getElementById('userProfileBar'),
    userAvatarImg: document.getElementById('userAvatarImg'),
    userDisplayName: document.getElementById('userDisplayName'),
    userEmailText: document.getElementById('userEmailText'),
    googleSignOutBtn: document.getElementById('googleSignOutBtn'),
    installAppBtn: document.getElementById('installAppBtn'),
    footerUserId: document.getElementById('footerUserId'),

    // Mobile Header Overflow Menu
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenuDropdown: document.getElementById('mobileMenuDropdown'),
    mobileSignInBtn: document.getElementById('mobileSignInBtn'),
    mobileCloudSetupBtn: document.getElementById('mobileCloudSetupBtn'),
    mobileBackupBtn: document.getElementById('mobileBackupBtn'),
    mobileInstallItem: document.getElementById('mobileInstallItem'),
    mobileInstallBtn: document.getElementById('mobileInstallBtn'),

    // Tab Navigation Buttons
    navTabs: document.querySelectorAll('[data-tab-target]'),
    viewStopwatch: document.getElementById('view-stopwatch'),
    viewAnalytics: document.getElementById('view-analytics'),
    viewJournal: document.getElementById('view-journal'),

    // Cloud Diagnostic Banner
    cloudDiagnosticBanner: document.getElementById('cloudDiagnosticBanner'),
    cloudDiagnosticTitle: document.getElementById('cloudDiagnosticTitle'),
    cloudDiagnosticMessage: document.getElementById('cloudDiagnosticMessage'),
    diagnosticOpenRulesBtn: document.getElementById('diagnosticOpenRulesBtn'),
    openRulesHelperBtn: document.getElementById('openRulesHelperBtn'),
    rulesHelperModal: document.getElementById('rulesHelperModal'),
    closeRulesHelperModalBtn: document.getElementById('closeRulesHelperModalBtn'),
    copyFirestoreRulesBtn: document.getElementById('copyFirestoreRulesBtn'),
    firestoreRulesCode: document.getElementById('firestoreRulesCode'),

    // Stopwatch Controls & Display
    streakLiveIndicator: document.getElementById('streakLiveIndicator'),
    streakPulseDot: document.getElementById('streakPulseDot'),
    streakStatusLabel: document.getElementById('streakStatusLabel'),
    currentLapNumberBadge: document.getElementById('currentLapNumberBadge'),
    cravingsDefeatedBadge: document.getElementById('cravingsDefeatedBadge'),
    cravingsDefeatedText: document.getElementById('cravingsDefeatedText'),
    timerDays: document.getElementById('timerDays'),
    timerHours: document.getElementById('timerHours'),
    timerMinutes: document.getElementById('timerMinutes'),
    timerSeconds: document.getElementById('timerSeconds'),
    currentLapTotalHours: document.getElementById('currentLapTotalHours'),
    lapStartedAtBadge: document.getElementById('lapStartedAtBadge'),
    pbProgressLabel: document.getElementById('pbProgressLabel'),
    pbProgressBar: document.getElementById('pbProgressBar'),
    toggleTimerBtn: document.getElementById('toggleTimerBtn'),
    toggleTimerText: document.getElementById('toggleTimerText'),
    relapseBtn: document.getElementById('relapseBtn'),
    resetTimerBtn: document.getElementById('resetTimerBtn'),
    resetTimerText: document.getElementById('resetTimerText'),
    openUrgeSurferBtn: document.getElementById('openUrgeSurferBtn'),

    // Backdate Drawer
    openBackdateBtn: document.getElementById('openBackdateBtn'),
    backdateDrawer: document.getElementById('backdateDrawer'),
    closeBackdateBtn: document.getElementById('closeBackdateBtn'),
    customStartTimeInput: document.getElementById('customStartTimeInput'),
    applyBackdateBtn: document.getElementById('applyBackdateBtn'),

    // KPIs & Reclaimed Life
    kpiTotalCleanTime: document.getElementById('kpiTotalCleanTime'),
    kpiTotalCleanSub: document.getElementById('kpiTotalCleanSub'),
    kpiLongestLap: document.getElementById('kpiLongestLap'),
    kpiLongestLapSub: document.getElementById('kpiLongestLapSub'),
    kpiAverageLap: document.getElementById('kpiAverageLap'),
    kpiAverageLapSub: document.getElementById('kpiAverageLapSub'),
    kpiTotalRelapses: document.getElementById('kpiTotalRelapses'),
    kpiTotalRelapsesSub: document.getElementById('kpiTotalRelapsesSub'),
    reclaimedTotalHoursText: document.getElementById('reclaimedTotalHoursText'),
    statBooksEquivalent: document.getElementById('statBooksEquivalent'),
    statWorkoutsEquivalent: document.getElementById('statWorkoutsEquivalent'),
    statDeepFocusCycles: document.getElementById('statDeepFocusCycles'),
    statUrgesDefeatedCount: document.getElementById('statUrgesDefeatedCount'),

    // Pattern Analytics
    vulnerabilitySummaryText: document.getElementById('vulnerabilitySummaryText'),
    timeOfDayBucketsContainer: document.getElementById('timeOfDayBucketsContainer'),
    vulnerabilityAdviceBox: document.getElementById('vulnerabilityAdviceBox'),
    topTriggersContainer: document.getElementById('topTriggersContainer'),
    topPlatformsContainer: document.getElementById('topPlatformsContainer'),
    emotionalPairsContainer: document.getElementById('emotionalPairsContainer'),
    emotionInsightText: document.getElementById('emotionInsightText'),
    loadDemoDataBtn: document.getElementById('loadDemoDataBtn'),

    // Consistency & Milestones
    consistencyHeatmapGrid: document.getElementById('consistencyHeatmapGrid'),
    milestonesContainer: document.getElementById('milestonesContainer'),

    // History & Search
    searchLapsInput: document.getElementById('searchLapsInput'),
    filterTimeBucketSelect: document.getElementById('filterTimeBucketSelect'),
    lapHistoryList: document.getElementById('lapHistoryList'),

    // Relapse Modal
    relapseModal: document.getElementById('relapseModal'),
    closeRelapseModalBtn: document.getElementById('closeRelapseModalBtn'),
    cancelRelapseModalBtn: document.getElementById('cancelRelapseModalBtn'),
    relapseForm: document.getElementById('relapseForm'),
    modalCapturedDurationText: document.getElementById('modalCapturedDurationText'),
    modalCapturedHoursDecimal: document.getElementById('modalCapturedHoursDecimal'),
    manualHoursOverride: document.getElementById('manualHoursOverride'),
    modalCapturedTimestampText: document.getElementById('modalCapturedTimestampText'),
    modalCapturedBucketBadge: document.getElementById('modalCapturedBucketBadge'),
    platformPillsContainer: document.getElementById('platformPillsContainer'),
    customPlatformContainer: document.getElementById('customPlatformContainer'),
    customPlatformInput: document.getElementById('customPlatformInput'),
    triggerPillsContainer: document.getElementById('triggerPillsContainer'),
    whatHappenedBeforeInput: document.getElementById('whatHappenedBeforeInput'),
    feelingBeforePillsContainer: document.getElementById('feelingBeforePillsContainer'),
    feelingBeforeNoteInput: document.getElementById('feelingBeforeNoteInput'),
    feelingAfterPillsContainer: document.getElementById('feelingAfterPillsContainer'),
    feelingAfterNoteInput: document.getElementById('feelingAfterNoteInput'),
    relapseDurationPillsContainer: document.getElementById('relapseDurationPillsContainer'),
    nextTimePlanInput: document.getElementById('nextTimePlanInput'),
    autoRestartNextLapCheckbox: document.getElementById('autoRestartNextLapCheckbox'),

    // Urge Surfer Modal
    urgeSurferModal: document.getElementById('urgeSurferModal'),
    closeUrgeSurferBtn: document.getElementById('closeUrgeSurferBtn'),
    urgeTimerDisplay: document.getElementById('urgeTimerDisplay'),
    urgeBreathingCue: document.getElementById('urgeBreathingCue'),
    urgeRealityCheckText: document.getElementById('urgeRealityCheckText'),
    urgeDefeatedBtn: document.getElementById('urgeDefeatedBtn'),
    urgeRelapsedBtn: document.getElementById('urgeRelapsedBtn'),

    // Backup & Export Modal
    openBackupModalBtn: document.getElementById('openBackupModalBtn'),
    backupModal: document.getElementById('backupModal'),
    closeBackupModalBtn: document.getElementById('closeBackupModalBtn'),
    backupModalCloudState: document.getElementById('backupModalCloudState'),
    backupModalLapCount: document.getElementById('backupModalLapCount'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    copyMarkdownReportBtn: document.getElementById('copyMarkdownReportBtn'),
    triggerImportJsonBtn: document.getElementById('triggerImportJsonBtn'),
    importJsonFileInput: document.getElementById('importJsonFileInput'),

    // Toast
    toastBanner: document.getElementById('toastBanner'),
    toastMessage: document.getElementById('toastMessage')
  };
}

// -------------------------------------------------------------------------
// Helpers & Notifications
// -------------------------------------------------------------------------
function showToast(message) {
  if (!el.toastMessage || !el.toastBanner) return;
  el.toastMessage.textContent = message;
  el.toastBanner.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.toastBanner.classList.add('hidden');
  }, 3200);
}

function triggerHaptic(type = 'start') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'start':
        navigator.vibrate(40);
        break;
      case 'pause':
        navigator.vibrate([40, 40, 40]);
        break;
      case 'relapse':
        navigator.vibrate(100);
        break;
      case 'success':
        navigator.vibrate([50, 40, 50, 40, 100]);
        break;
      case 'tap':
        navigator.vibrate(25);
        break;
    }
  } catch (err) {
    // Vibration ignored if unavailable or blocked
  }
}

function getElapsedMs() {
  const { isRunning, currentLapStartTime, accumulatedMs } = state.timer;
  if (isRunning && currentLapStartTime) {
    return Math.max(0, accumulatedMs + (Date.now() - currentLapStartTime));
  }
  return Math.max(0, accumulatedMs);
}

// -------------------------------------------------------------------------
// Tab Navigation Controller (Modular 3-View Experience)
// -------------------------------------------------------------------------
function switchTab(targetTab) {
  state.activeTab = targetTab;
  window.DetoxStorage.saveActiveTab(targetTab);

  const views = {
    stopwatch: el.viewStopwatch,
    analytics: el.viewAnalytics,
    journal: el.viewJournal
  };

  Object.entries(views).forEach(([tabName, viewEl]) => {
    if (!viewEl) return;
    if (tabName === targetTab) {
      viewEl.classList.remove('hidden');
    } else {
      viewEl.classList.add('hidden');
    }
  });

  // Update tab buttons styles (Both desktop segmented pills and mobile bottom bar)
  if (el.navTabs) {
    el.navTabs.forEach(btn => {
      const isTarget = btn.getAttribute('data-tab-target') === targetTab;
      if (btn.classList.contains('mobile-tab-btn')) {
        // Mobile bottom navigation bar item
        const icon = btn.querySelector('.tab-icon');
        if (isTarget) {
          btn.className = "mobile-tab-btn flex flex-col items-center justify-center gap-1 text-emerald-400 font-semibold cursor-pointer py-1 transition";
          if (icon) icon.className = "tab-icon w-5 h-5 text-emerald-400";
        } else {
          btn.className = "mobile-tab-btn flex flex-col items-center justify-center gap-1 text-slate-400 font-medium cursor-pointer py-1 transition";
          if (icon) icon.className = "tab-icon w-5 h-5 text-slate-400";
        }
      } else {
        // Desktop segmented button
        if (isTarget) {
          btn.className = "desktop-tab-btn px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40 transition cursor-pointer flex items-center gap-1.5";
        } else {
          btn.className = "desktop-tab-btn px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition cursor-pointer flex items-center gap-1.5";
        }
      }
    });
  }

  // Trigger render on switch
  renderAll();
}

// -------------------------------------------------------------------------
// Stopwatch Rendering & Ticker
// -------------------------------------------------------------------------
function renderStopwatchTick() {
  const elapsedMs = getElapsedMs();
  const totalSeconds = Math.floor(elapsedMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (el.timerDays) el.timerDays.textContent = String(days).padStart(2, '0');
  if (el.timerHours) el.timerHours.textContent = String(hours).padStart(2, '0');
  if (el.timerMinutes) el.timerMinutes.textContent = String(minutes).padStart(2, '0');
  if (el.timerSeconds) el.timerSeconds.textContent = String(seconds).padStart(2, '0');

  const totalHoursDecimal = (elapsedMs / (1000 * 60 * 60)).toFixed(2);
  if (el.currentLapTotalHours) el.currentLapTotalHours.textContent = `${totalHoursDecimal} hrs`;

  updatePersonalBestBar(elapsedMs);
}

function updatePersonalBestBar(currentElapsedMs) {
  if (!el.pbProgressBar || !el.pbProgressLabel) return;

  let maxPastLapMs = 0;
  state.laps.forEach(l => {
    if ((l.durationMs || 0) > maxPastLapMs) maxPastLapMs = l.durationMs;
  });

  if (maxPastLapMs <= 0) {
    const target24h = 24 * 3600 * 1000;
    const pct = Math.min(100, (currentElapsedMs / target24h) * 100);
    el.pbProgressBar.style.width = `${pct.toFixed(1)}%`;
    el.pbProgressLabel.textContent = `${pct.toFixed(1)}% of 24h Milestone`;
  } else if (currentElapsedMs >= maxPastLapMs) {
    el.pbProgressBar.style.width = `100%`;
    el.pbProgressLabel.textContent = `NEW PERSONAL BEST! (${window.DetoxConstants.formatDurationCompact(currentElapsedMs)})`;
  } else {
    const pct = Math.min(100, (currentElapsedMs / maxPastLapMs) * 100);
    el.pbProgressBar.style.width = `${pct.toFixed(1)}%`;
    el.pbProgressLabel.textContent = `${pct.toFixed(1)}% of Record (${window.DetoxConstants.formatDurationCompact(maxPastLapMs)})`;
  }
}

function renderStopwatchUI() {
  renderStopwatchTick();
  const nextLapNum = state.laps.length + 1;
  if (el.currentLapNumberBadge) el.currentLapNumberBadge.textContent = `Lap #${nextLapNum}`;

  if (el.streakStatusLabel) {
    if (state.timer.isRunning) {
      el.streakStatusLabel.textContent = "ACTIVE DETOX STREAK";
      if (el.streakPulseDot) el.streakPulseDot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-ping";
      if (el.streakLiveIndicator) el.streakLiveIndicator.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      if (el.toggleTimerText) el.toggleTimerText.textContent = "Pause Detox Timer";
      if (el.toggleTimerBtn) el.toggleTimerBtn.className = "flex-1 py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition cursor-pointer";
    } else {
      const hasElapsed = getElapsedMs() > 0;
      el.streakStatusLabel.textContent = hasElapsed ? "TIMER PAUSED" : "READY TO START";
      if (el.streakPulseDot) el.streakPulseDot.className = "w-2 h-2 rounded-full bg-amber-400";
      if (el.streakLiveIndicator) el.streakLiveIndicator.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30";
      if (el.toggleTimerText) el.toggleTimerText.textContent = hasElapsed ? "Resume Detox Lap" : "Start Detox Lap";
      if (el.toggleTimerBtn) el.toggleTimerBtn.className = "flex-1 py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/60 transition cursor-pointer";
    }
  }

  if (el.lapStartedAtBadge) {
    if (state.timer.streakInitialStartTime) {
      el.lapStartedAtBadge.textContent = `Streak started: ${window.DetoxConstants.formatDateTimeReadable(state.timer.streakInitialStartTime)}`;
    } else {
      el.lapStartedAtBadge.textContent = "Streak not started yet";
    }
  }
}

// -------------------------------------------------------------------------
// Dashboard & Analytics Coordinator
// -------------------------------------------------------------------------
function renderKPIsAndAnalytics() {
  const laps = state.laps;
  const currentElapsedMs = getElapsedMs();

  // 1. Total Clean Time
  const pastTotalMs = laps.reduce((acc, l) => acc + (Number(l.durationMs) || 0), 0);
  const grandTotalMs = pastTotalMs + currentElapsedMs;
  if (el.kpiTotalCleanTime) el.kpiTotalCleanTime.textContent = window.DetoxConstants.formatHoursLabel(grandTotalMs);
  if (el.kpiTotalCleanSub) el.kpiTotalCleanSub.textContent = `${(pastTotalMs / 3600000).toFixed(1)}h past laps + ${(currentElapsedMs / 3600000).toFixed(1)}h current`;

  // 2. Longest Lap
  const maxPastMs = laps.reduce((max, l) => Math.max(max, Number(l.durationMs) || 0), 0);
  const longestOverallMs = Math.max(maxPastMs, currentElapsedMs);
  if (el.kpiLongestLap) el.kpiLongestLap.textContent = window.DetoxConstants.formatDurationCompact(longestOverallMs);
  if (el.kpiLongestLapSub) el.kpiLongestLapSub.textContent = `${(longestOverallMs / 3600000).toFixed(2)} hours record`;

  // 3. Average Lap Duration
  if (el.kpiAverageLap) {
    if (laps.length > 0) {
      const avgMs = pastTotalMs / laps.length;
      el.kpiAverageLap.textContent = window.DetoxConstants.formatDurationCompact(avgMs);
      if (el.kpiAverageLapSub) el.kpiAverageLapSub.textContent = `Avg ${(avgMs / 3600000).toFixed(2)} hrs before relapse`;
    } else {
      el.kpiAverageLap.textContent = "—";
      if (el.kpiAverageLapSub) el.kpiAverageLapSub.textContent = "Complete 1 lap to calculate";
    }
  }

  // 4. Total Relapses Logged
  if (el.kpiTotalRelapses) el.kpiTotalRelapses.textContent = String(laps.length);
  if (el.backupModalLapCount) el.backupModalLapCount.textContent = String(laps.length);

  // 5. Cravings Defeated Badge
  if (el.cravingsDefeatedText) el.cravingsDefeatedText.textContent = `${state.urgesDefeated} Urges Surfed`;

  // 6. Tangible Life Reclaimed Calculator
  const totalHoursNum = grandTotalMs / (1000 * 60 * 60);
  if (el.reclaimedTotalHoursText) el.reclaimedTotalHoursText.textContent = totalHoursNum.toFixed(1);
  if (el.statBooksEquivalent) el.statBooksEquivalent.textContent = (totalHoursNum / 5.0).toFixed(1);
  if (el.statWorkoutsEquivalent) el.statWorkoutsEquivalent.textContent = String(Math.floor(totalHoursNum));
  if (el.statDeepFocusCycles) el.statDeepFocusCycles.textContent = String(Math.floor(totalHoursNum / 1.5));
  if (el.statUrgesDefeatedCount) el.statUrgesDefeatedCount.textContent = String(state.urgesDefeated);

  // 7. Behavioral Pattern Cards
  window.DetoxAnalytics.renderVulnerabilityWindow(laps, el.timeOfDayBucketsContainer, el.vulnerabilitySummaryText, el.vulnerabilityAdviceBox);
  window.DetoxAnalytics.renderTopTriggersAndPlatforms(laps, el.topTriggersContainer, el.topPlatformsContainer);
  window.DetoxAnalytics.renderEmotionalLoop(laps, el.emotionalPairsContainer, el.emotionInsightText);

  // 8. Heatmap & Milestones
  window.DetoxAnalytics.renderConsistencyHeatmap(state.timer, laps, el.consistencyHeatmapGrid);
  // Milestones are about a single clean streak (as the badges and README describe),
  // not cumulative time across laps.
  window.DetoxAnalytics.renderMilestones(longestOverallMs, el.milestonesContainer);
}

// -------------------------------------------------------------------------
// Lap History Timeline & Journal
// -------------------------------------------------------------------------
function renderLapHistory() {
  if (!el.lapHistoryList) return;

  const query = (state.searchQuery || "").toLowerCase().trim();
  const bucketFilter = state.filterBucket || "ALL";

  const totalCount = state.laps.length;
  const numberedLaps = state.laps.map((lap, index) => ({
    ...lap,
    lapNumber: totalCount - index
  }));

  const filtered = numberedLaps.filter(lap => {
    if (bucketFilter !== 'ALL' && lap.timeOfDayBucket !== bucketFilter) return false;
    if (!query) return true;
    const haystack = [
      lap.platform,
      ...(lap.triggers || []),
      lap.whatHappenedBefore,
      lap.feelingBefore,
      lap.feelingBeforeNote,
      lap.feelingAfter,
      lap.feelingAfterNote,
      lap.timeOfDayBucket
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  if (filtered.length === 0) {
    el.lapHistoryList.innerHTML = `
      <div class="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
        <p class="text-sm font-semibold text-slate-300">No relapse reflections match your current view</p>
        <p class="text-xs text-slate-500 mt-1">Keep your current detox stopwatch running, or click "+ Load Sample Relapse Logs" in the Analytics tab to preview insights.</p>
      </div>
    `;
    return;
  }

  el.lapHistoryList.innerHTML = filtered.map(lap => {
    const isConfirmingDelete = state.deleteConfirmLapId === lap.id;
    const triggersHtml = (lap.triggers || []).map(t => `
      <span class="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/25 text-[11px] font-medium">
        ${window.DetoxConstants.escapeHtml(t)}
      </span>
    `).join('');

    return `
      <div class="bg-slate-950/75 hover:bg-slate-950 border border-slate-800/90 rounded-2xl p-4 sm:p-5 transition">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-slate-300">
              Lap #${lap.lapNumber}
            </span>
            <span class="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 font-mono text-xs sm:text-sm font-bold text-emerald-300">
              Avoided: ${window.DetoxConstants.formatDurationCompact(lap.durationMs)} (${Number(lap.hoursAvoided || 0).toFixed(2)} hrs)
            </span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-xs font-medium">
              ${window.DetoxConstants.escapeHtml(lap.platform || 'Social Media')}
            </span>
            ${lap.relapseDuration ? `<span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-mono">Relapse: ${window.DetoxConstants.escapeHtml(lap.relapseDuration)}</span>` : ''}
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-2.5 text-xs text-slate-400">
            <span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
              ${window.DetoxConstants.escapeHtml(lap.timeOfDayBucket || 'Day')}
            </span>
            <span>${window.DetoxConstants.formatDateTimeReadable(lap.relapsedAtMs)}</span>
            <button
              type="button"
              data-delete-lap="${window.DetoxConstants.escapeHtml(lap.id)}"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                isConfirmingDelete
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800'
              }"
            >
              ${isConfirmingDelete ? 'Confirm Delete?' : 'Delete'}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 text-xs">
          <div class="space-y-2">
            <div class="text-slate-400 font-medium">What happened before failing (Triggers):</div>
            <div class="flex flex-wrap gap-1.5">${triggersHtml}</div>
            ${lap.whatHappenedBefore ? `<p class="text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 italic">"${window.DetoxConstants.escapeHtml(lap.whatHappenedBefore)}"</p>` : ''}
          </div>

          <div class="space-y-2">
            <div class="text-slate-400 font-medium">Emotional Shift (Before ➔ After):</div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                Before: ${window.DetoxConstants.escapeHtml(lap.feelingBefore || 'N/A')}
              </span>
              <span class="text-slate-500 font-bold">➔</span>
              <span class="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                After: ${window.DetoxConstants.escapeHtml(lap.feelingAfter || 'N/A')}
              </span>
            </div>
            ${(lap.feelingBeforeNote || lap.feelingAfterNote || lap.nextTimePlan) ? `
              <div class="text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                ${lap.feelingBeforeNote ? `<div><span class="text-amber-400 font-medium">Before note:</span> ${window.DetoxConstants.escapeHtml(lap.feelingBeforeNote)}</div>` : ''}
                ${lap.feelingAfterNote ? `<div><span class="text-indigo-400 font-medium">After note:</span> ${window.DetoxConstants.escapeHtml(lap.feelingAfterNote)}</div>` : ''}
                ${lap.nextTimePlan ? `<div><span class="text-emerald-400 font-medium">Next plan:</span> ${window.DetoxConstants.escapeHtml(lap.nextTimePlan)}</div>` : ''}
              </div>` : ''
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAll() {
  renderStopwatchUI();
  renderKPIsAndAnalytics();
  renderLapHistory();
}

// -------------------------------------------------------------------------
// Stopwatch Actions
// -------------------------------------------------------------------------
function toggleStopwatch() {
  const now = Date.now();
  if (state.timer.isRunning) {
    state.timer.accumulatedMs += Math.max(0, now - (state.timer.currentLapStartTime || now));
    state.timer.currentLapStartTime = null;
    state.timer.isRunning = false;
    triggerHaptic('pause');
    showToast("Detox timer paused • State saved locally & cloud");
  } else {
    if (state.timer.accumulatedMs === 0) {
      state.timer.streakInitialStartTime = now;
    }
    state.timer.currentLapStartTime = now;
    state.timer.isRunning = true;
    triggerHaptic('start');
    showToast("Detox streak active • Live timer running");
  }
  saveTimerStateToCloud();
}

function handleResetClick() {
  if (!state.resetConfirmPending) {
    state.resetConfirmPending = true;
    triggerHaptic('tap');
    if (el.resetTimerText) el.resetTimerText.textContent = "Confirm Reset?";
    if (el.resetTimerBtn) el.resetTimerBtn.classList.add('border-rose-500', 'text-rose-300');
    clearTimeout(window.__resetConfirmTimeout);
    window.__resetConfirmTimeout = setTimeout(() => {
      state.resetConfirmPending = false;
      if (el.resetTimerText) el.resetTimerText.textContent = "Reset";
      if (el.resetTimerBtn) el.resetTimerBtn.classList.remove('border-rose-500', 'text-rose-300');
    }, 3500);
    return;
  }

  state.resetConfirmPending = false;
  triggerHaptic('relapse');
  if (el.resetTimerText) el.resetTimerText.textContent = "Reset";
  if (el.resetTimerBtn) el.resetTimerBtn.classList.remove('border-rose-500', 'text-rose-300');

  const now = Date.now();
  state.timer = {
    isRunning: true,
    currentLapStartTime: now,
    accumulatedMs: 0,
    streakInitialStartTime: now
  };
  saveTimerStateToCloud();
  showToast("Stopwatch reset to 00:00:00");
}

function startStopwatchIfFirstVisit() {
  if (!state.timer.isRunning && state.timer.accumulatedMs === 0) {
    const now = Date.now();
    state.timer.isRunning = true;
    state.timer.currentLapStartTime = now;
    state.timer.streakInitialStartTime = now;
    window.DetoxStorage.saveTimer(state.timer);
  }
}

// -------------------------------------------------------------------------
// Relapse Reflection Modal Logic
// -------------------------------------------------------------------------
function openRelapseModal() {
  const capturedMs = getElapsedMs();
  const now = Date.now();
  const bucket = window.DetoxConstants.getTimeOfDayBucket(new Date(now));

  state.pendingRelapse = {
    durationMs: capturedMs,
    timestampMs: now,
    timeBucket: bucket,
    // Nothing is pre-selected: pre-filled answers would skew the pattern analytics.
    selectedPlatform: null,
    selectedTriggers: [],
    selectedFeelingBefore: null,
    selectedFeelingAfter: null,
    selectedRelapseDuration: null
  };

  const hoursDecimal = (capturedMs / (1000 * 60 * 60)).toFixed(2);
  if (el.modalCapturedDurationText) el.modalCapturedDurationText.textContent = window.DetoxConstants.formatDurationCompact(capturedMs);
  if (el.modalCapturedHoursDecimal) el.modalCapturedHoursDecimal.textContent = `(${hoursDecimal} hrs)`;
  if (el.manualHoursOverride) el.manualHoursOverride.value = hoursDecimal;
  if (el.modalCapturedTimestampText) el.modalCapturedTimestampText.textContent = window.DetoxConstants.formatDateTimeReadable(now);
  if (el.modalCapturedBucketBadge) el.modalCapturedBucketBadge.textContent = bucket;
  const nextLapNumberEl = document.getElementById('nextLapNumberText');
  if (nextLapNumberEl) nextLapNumberEl.textContent = String(state.laps.length + 2);

  if (el.whatHappenedBeforeInput) el.whatHappenedBeforeInput.value = "";
  if (el.feelingBeforeNoteInput) el.feelingBeforeNoteInput.value = "";
  if (el.feelingAfterNoteInput) el.feelingAfterNoteInput.value = "";
  if (el.nextTimePlanInput) el.nextTimePlanInput.value = "";
  if (el.customPlatformInput) el.customPlatformInput.value = "";
  if (el.customPlatformContainer) el.customPlatformContainer.classList.add('hidden');

  renderModalPills();
  if (el.relapseModal) el.relapseModal.classList.remove('hidden');
}

function closeRelapseModal() {
  if (el.relapseModal) el.relapseModal.classList.add('hidden');
}

function renderModalPills() {
  if (!el.platformPillsContainer) return;

  el.platformPillsContainer.innerHTML = window.DetoxConstants.PLATFORM_OPTIONS.map(plat => {
    const active = state.pendingRelapse.selectedPlatform === plat;
    return `
      <button type="button" data-platform="${plat}" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition active:scale-95 cursor-pointer touch-manipulation ${
        active
          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-sm'
          : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
      }">
        ${plat}
      </button>
    `;
  }).join('');

  if (el.customPlatformContainer) {
    if (state.pendingRelapse.selectedPlatform === 'Other') {
      el.customPlatformContainer.classList.remove('hidden');
      if (el.customPlatformInput && document.activeElement !== el.customPlatformInput) {
        setTimeout(() => el.customPlatformInput.focus(), 50);
      }
    } else {
      el.customPlatformContainer.classList.add('hidden');
    }
  }

  el.triggerPillsContainer.innerHTML = window.DetoxConstants.TRIGGER_OPTIONS.map(trig => {
    const active = state.pendingRelapse.selectedTriggers.includes(trig);
    return `
      <button type="button" data-trigger="${trig}" class="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition active:scale-95 cursor-pointer touch-manipulation ${
        active
          ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-sm'
          : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
      }">
        ${active ? '✓ ' : ''}${trig}
      </button>
    `;
  }).join('');

  el.feelingBeforePillsContainer.innerHTML = window.DetoxConstants.FEELING_BEFORE_OPTIONS.map(feel => {
    const active = state.pendingRelapse.selectedFeelingBefore === feel;
    return `
      <button type="button" data-before="${feel}" class="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition active:scale-95 cursor-pointer touch-manipulation ${
        active
          ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
          : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
      }">
        ${feel}
      </button>
    `;
  }).join('');

  el.feelingAfterPillsContainer.innerHTML = window.DetoxConstants.FEELING_AFTER_OPTIONS.map(feel => {
    const active = state.pendingRelapse.selectedFeelingAfter === feel;
    return `
      <button type="button" data-after="${feel}" class="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition active:scale-95 cursor-pointer touch-manipulation ${
        active
          ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200 shadow-sm'
          : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
      }">
        ${feel}
      </button>
    `;
  }).join('');

  if (el.relapseDurationPillsContainer) {
    el.relapseDurationPillsContainer.innerHTML = window.DetoxConstants.RELAPSE_DURATION_OPTIONS.map(dur => {
      const active = state.pendingRelapse.selectedRelapseDuration === dur;
      return `
        <button type="button" data-relapse-duration="${dur}" class="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition active:scale-95 cursor-pointer touch-manipulation ${
          active
            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-sm'
            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
        }">
          ${dur}
        </button>
      `;
    }).join('');
  }
}

async function handleRelapseFormSubmit(e) {
  e.preventDefault();

  const missing = [];
  if (!state.pendingRelapse.selectedPlatform) missing.push('the app or site');
  if (!state.pendingRelapse.selectedFeelingBefore) missing.push('how you felt before');
  if (!state.pendingRelapse.selectedFeelingAfter) missing.push('how you feel now');
  if (missing.length > 0) {
    showToast(`Please choose ${missing.join(', ')}`);
    return;
  }

  const overrideVal = parseFloat(el.manualHoursOverride.value);
  const originalHours = parseFloat((state.pendingRelapse.durationMs / (1000 * 60 * 60)).toFixed(2));
  let finalDurationMs = state.pendingRelapse.durationMs;

  if (!isNaN(overrideVal) && overrideVal >= 0 && Math.abs(overrideVal - originalHours) > 0.01) {
    finalDurationMs = Math.round(overrideVal * 3600 * 1000);
  }

  const finalHours = Number((finalDurationMs / (1000 * 60 * 60)).toFixed(2));
  const now = Date.now();

  let chosenPlatform = state.pendingRelapse.selectedPlatform || "Other";
  if (chosenPlatform === "Other" && el.customPlatformInput && el.customPlatformInput.value.trim()) {
    chosenPlatform = el.customPlatformInput.value.trim();
  }

  const lapRecord = {
    durationMs: finalDurationMs,
    hoursAvoided: finalHours,
    startedAtMs: state.timer.streakInitialStartTime || (now - finalDurationMs),
    relapsedAtMs: state.pendingRelapse.timestampMs || now,
    timeOfDayBucket: state.pendingRelapse.timeBucket,
    platform: chosenPlatform,
    triggers: state.pendingRelapse.selectedTriggers.length > 0 ? state.pendingRelapse.selectedTriggers : ["Unspecified"],
    whatHappenedBefore: el.whatHappenedBeforeInput ? el.whatHappenedBeforeInput.value.trim() : "",
    feelingBefore: state.pendingRelapse.selectedFeelingBefore,
    feelingBeforeNote: el.feelingBeforeNoteInput ? el.feelingBeforeNoteInput.value.trim() : "",
    feelingAfter: state.pendingRelapse.selectedFeelingAfter,
    feelingAfterNote: el.feelingAfterNoteInput ? el.feelingAfterNoteInput.value.trim() : "",
    relapseDuration: state.pendingRelapse.selectedRelapseDuration || "",
    nextTimePlan: el.nextTimePlanInput ? el.nextTimePlanInput.value.trim() : ""
  };

  closeRelapseModal();
  triggerHaptic('relapse');

  const shouldAutoRestart = el.autoRestartNextLapCheckbox ? el.autoRestartNextLapCheckbox.checked : true;
  state.timer = {
    isRunning: shouldAutoRestart,
    currentLapStartTime: shouldAutoRestart ? now : null,
    accumulatedMs: 0,
    streakInitialStartTime: shouldAutoRestart ? now : null
  };

  await Promise.all([
    addLapRecordToCloud(lapRecord),
    saveTimerStateToCloud()
  ]);

  showToast(`Logged Lap (${window.DetoxConstants.formatDurationCompact(finalDurationMs)} avoided) & started next streak!`);
}

// -------------------------------------------------------------------------
// Urge Surfer Integration
// -------------------------------------------------------------------------
function openUrgeSurfer() {
  window.DetoxUrgeSurfer.startSession(state.laps, {
    timerDisplay: el.urgeTimerDisplay,
    breathingCue: el.urgeBreathingCue,
    realityCheckText: el.urgeRealityCheckText,
    defeatedBtn: el.urgeDefeatedBtn
  });
  if (el.urgeSurferModal) el.urgeSurferModal.classList.remove('hidden');
}

function closeUrgeSurfer() {
  window.DetoxUrgeSurfer.stopSession();
  if (el.urgeSurferModal) el.urgeSurferModal.classList.add('hidden');
}

async function handleUrgeDefeated() {
  closeUrgeSurfer();
  triggerHaptic('success');
  state.urgesDefeated = (state.urgesDefeated || 0) + 1;
  window.DetoxStorage.saveStats(state.urgesDefeated);
  renderKPIsAndAnalytics();
  saveTimerStateToCloud();
  showToast(`🌊 Urge defeated! You have surfed ${state.urgesDefeated} cravings so far!`);
}

function handleUrgeRelapsed() {
  closeUrgeSurfer();
  triggerHaptic('tap');
  openRelapseModal();
}

// -------------------------------------------------------------------------
// Firebase Cloud Synchronization
// -------------------------------------------------------------------------
function updateCloudBadge(status, label) {
  if (!el.cloudStatusText || !el.cloudStatusDot) return;
  el.cloudStatusText.textContent = label;
  el.cloudStatusDot.className = "w-2 h-2 rounded-full ";
  if (status === 'online') {
    el.cloudStatusDot.classList.add('bg-emerald-400');
    if (el.backupModalCloudState) {
      el.backupModalCloudState.textContent = "Connected & Synced (Live)";
      el.backupModalCloudState.className = "font-semibold text-emerald-400";
    }
  } else if (status === 'syncing') {
    el.cloudStatusDot.classList.add('bg-amber-400', 'animate-pulse');
  } else {
    el.cloudStatusDot.classList.add('bg-rose-400');
    if (el.backupModalCloudState) {
      el.backupModalCloudState.textContent = "Offline / Local Storage Mode";
      el.backupModalCloudState.className = "font-semibold text-amber-400";
    }
  }
}

function updateAuthUI(user) {
  if (!el.googleSignInBtn || !el.userProfileBar) return;

  const isGoogleLinked = user && !user.isAnonymous && (
    (user.providerData && user.providerData.some(p => p.providerId === 'google.com')) ||
    user.displayName ||
    user.email
  );

  if (isGoogleLinked) {
    el.googleSignInBtn.classList.add('hidden');
    el.userProfileBar.classList.remove('hidden');
    el.userProfileBar.classList.add('flex');

    const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Google Account');
    const email = user.email || 'Cloud Synced';
    const initials = encodeURIComponent(displayName.charAt(0).toUpperCase());
    if (el.userAvatarImg) el.userAvatarImg.src = user.photoURL || `https://placehold.co/32x32/10b981/070b14?text=${initials}`;
    if (el.userDisplayName) el.userDisplayName.textContent = displayName;
    if (el.userEmailText) el.userEmailText.textContent = email;
  } else {
    el.googleSignInBtn.classList.remove('hidden');
    el.userProfileBar.classList.add('hidden');
    el.userProfileBar.classList.remove('flex');
  }
}

async function saveTimerStateToCloud() {
  window.DetoxStorage.saveTimer(state.timer);
  renderStopwatchUI();
  if (!state.user || !db) return;
  try {
    updateCloudBadge('syncing', 'Syncing...');
    const timerDocRef = doc(db, 'artifacts', state.appId, 'users', state.userId, 'detox_state', 'active_timer');
    await setDoc(timerDocRef, {
      isRunning: state.timer.isRunning,
      currentLapStartTime: state.timer.currentLapStartTime,
      accumulatedMs: state.timer.accumulatedMs,
      streakInitialStartTime: state.timer.streakInitialStartTime,
      urgesDefeated: state.urgesDefeated,
      updatedAt: Date.now()
    });
    updateCloudBadge('online', 'Cloud Synced • Live');
  } catch (err) {
    console.error("Failed to save timer state:", err);
    updateCloudBadge('offline', 'Cached Locally');
  }
}

async function addLapRecordToCloud(lapRecord) {
  if (!state.user || !db) {
    state.laps.unshift({ id: 'local-' + Date.now(), ...lapRecord });
    window.DetoxStorage.saveLaps(state.laps);
    renderAll();
    return;
  }
  try {
    updateCloudBadge('syncing', 'Saving Lap...');
    const lapsColRef = collection(db, 'artifacts', state.appId, 'users', state.userId, 'detox_laps');
    const docRef = await addDoc(lapsColRef, lapRecord);
    if (!state.laps.some(l => l.relapsedAtMs === lapRecord.relapsedAtMs)) {
      state.laps.unshift({ id: docRef.id, ...lapRecord });
    }
    window.DetoxStorage.saveLaps(state.laps);
    updateCloudBadge('online', 'Cloud Synced • Live');
  } catch (err) {
    console.error("Failed to add lap record:", err);
    state.laps.unshift({ id: 'local-' + Date.now(), ...lapRecord });
    window.DetoxStorage.saveLaps(state.laps);
    renderAll();
    updateCloudBadge('offline', 'Saved Locally');
  }
}

async function deleteLapFromCloud(lapId) {
  state.laps = state.laps.filter(l => l.id !== lapId);
  window.DetoxStorage.saveLaps(state.laps);
  renderAll();
  if (!state.user || !db || String(lapId).startsWith('local-')) {
    showToast("Deleted lap entry from local storage");
    return;
  }
  try {
    updateCloudBadge('syncing', 'Deleting...');
    const lapDocRef = doc(db, 'artifacts', state.appId, 'users', state.userId, 'detox_laps', lapId);
    await deleteDoc(lapDocRef);
    updateCloudBadge('online', 'Cloud Synced • Live');
    showToast("Deleted lap entry from cloud");
  } catch (err) {
    console.error("Failed to delete lap:", err);
  }
}

function setupFirestoreListeners() {
  if (!state.user || !db) return;

  if (typeof unsubscribeTimer === 'function') unsubscribeTimer();
  if (typeof unsubscribeLaps === 'function') unsubscribeLaps();

  const timerDocRef = doc(db, 'artifacts', state.appId, 'users', state.userId, 'detox_state', 'active_timer');
  unsubscribeTimer = onSnapshot(
    timerDocRef,
    (docSnap) => {
      if (el.cloudDiagnosticBanner) el.cloudDiagnosticBanner.classList.add('hidden');
      if (docSnap.exists()) {
        const data = docSnap.data();
        state.timer = {
          isRunning: Boolean(data.isRunning),
          currentLapStartTime: data.currentLapStartTime || null,
          accumulatedMs: Number(data.accumulatedMs || 0),
          streakInitialStartTime: data.streakInitialStartTime || data.currentLapStartTime || Date.now()
        };
        if (data.urgesDefeated !== undefined) {
          state.urgesDefeated = Math.max(state.urgesDefeated, Number(data.urgesDefeated || 0));
          window.DetoxStorage.saveStats(state.urgesDefeated);
        }
        window.DetoxStorage.saveTimer(state.timer);
      } else {
        const hasExisting = state.timer.isRunning || state.timer.accumulatedMs > 0;
        if (!hasExisting) {
          const now = Date.now();
          state.timer = {
            isRunning: true,
            currentLapStartTime: now,
            accumulatedMs: 0,
            streakInitialStartTime: now
          };
        }
        saveTimerStateToCloud();
      }
      renderStopwatchUI();
      renderKPIsAndAnalytics();
    },
    (error) => {
      console.error("Error listening to timer state:", error);
      updateCloudBadge('offline', 'Rules Setup Needed');
      startStopwatchIfFirstVisit();
      renderAll();
    }
  );

  const lapsColRef = collection(db, 'artifacts', state.appId, 'users', state.userId, 'detox_laps');
  unsubscribeLaps = onSnapshot(
    lapsColRef,
    (querySnapshot) => {
      const loadedLaps = [];
      querySnapshot.forEach((docItem) => {
        loadedLaps.push({ id: docItem.id, ...docItem.data() });
      });

      const localOnlyLaps = state.laps.filter(l => String(l.id).startsWith('local-'));
      for (const localLap of localOnlyLaps) {
        if (!loadedLaps.some(cl => cl.relapsedAtMs === localLap.relapsedAtMs)) {
          const { id, ...lapData } = localLap;
          addDoc(lapsColRef, lapData).catch(e => console.error("Sync error:", e));
          loadedLaps.push(localLap);
        }
      }

      loadedLaps.sort((a, b) => (b.relapsedAtMs || 0) - (a.relapsedAtMs || 0));
      state.laps = loadedLaps;
      window.DetoxStorage.saveLaps(state.laps);
      renderAll();
    },
    (error) => {
      console.error("Error listening to laps:", error);
    }
  );
}

async function executeGoogleRedirect(provider) {
  updateCloudBadge('syncing', 'Connecting to Google...');
  showToast("Opening Google Sign-In...");
  
  // Persist local state securely before leaving page
  window.DetoxStorage.saveTimer(state.timer);
  window.DetoxStorage.saveLaps(state.laps);
  window.DetoxStorage.saveStats(state.urgesDefeated);
  window.DetoxStorage.saveActiveTab(state.activeTab);

  if (auth.currentUser && auth.currentUser.isAnonymous) {
    await linkWithRedirect(auth.currentUser, provider);
  } else {
    await signInWithRedirect(auth, provider);
  }
}

async function handleGoogleSignIn(forceRedirect = false) {
  if (!auth) {
    showToast("Cloud authentication initializing or unavailable. Click 'Cloud Setup' for help.");
    return;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // 1. Proactive Detection: Brave Shields & Mobile browsers block popups by default
  let isBrave = false;
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    try {
      isBrave = await navigator.brave.isBrave();
    } catch (e) {
      isBrave = false;
    }
  }
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // If Brave, mobile device, or explicitly requested redirect, route directly to zero-popup redirect
  if (forceRedirect || isBrave || isMobile) {
    try {
      await executeGoogleRedirect(provider);
      return;
    } catch (rErr) {
      console.error("Direct redirect sign-in error:", rErr);
      if (rErr.code === 'auth/unauthorized-domain') {
        showToast("Domain unauthorized: Add meeransahib.github.io to Firebase Authorized Domains");
        if (el.rulesHelperModal) el.rulesHelperModal.classList.remove('hidden');
      } else {
        showToast(`Google Sign-In: ${rErr.message}`);
      }
      return;
    }
  }

  // 2. Standard Desktop Browsers: Attempt popup first for instant in-page auth
  try {
    updateCloudBadge('syncing', 'Signing in with Google...');
    let resultUser = null;

    if (auth.currentUser && auth.currentUser.isAnonymous) {
      try {
        const linkResult = await linkWithPopup(auth.currentUser, provider);
        resultUser = linkResult.user;
        showToast(`Linked session to ${resultUser.displayName || resultUser.email}!`);
      } catch (linkErr) {
        if (
          linkErr.code === 'auth/credential-already-in-use' ||
          linkErr.code === 'auth/email-already-in-use'
        ) {
          const signInResult = await signInWithPopup(auth, provider);
          resultUser = signInResult.user;
          showToast(`Signed in as ${resultUser.displayName || resultUser.email}!`);
        } else {
          throw linkErr;
        }
      }
    } else {
      const signInResult = await signInWithPopup(auth, provider);
      resultUser = signInResult.user;
      showToast(`Signed in as ${resultUser.displayName || resultUser.email}!`);
    }

    if (resultUser) {
      state.user = resultUser;
      state.userId = resultUser.uid;
      state.isCloudConnected = true;
      if (el.footerUserId) el.footerUserId.textContent = state.userId;
      updateAuthUI(resultUser);
      updateCloudBadge('online', 'Google Cloud Synced');
      setupFirestoreListeners();
    }
  } catch (err) {
    console.warn("Popup sign-in note:", err);

    // 3. Seamless Silent Fallback: If ANY browser/extension blocks the popup, fall back immediately to redirect without alarming the user
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      try {
        await executeGoogleRedirect(provider);
        return;
      } catch (fallbackErr) {
        console.error("Silent redirect fallback error:", fallbackErr);
        if (fallbackErr.code === 'auth/unauthorized-domain') {
          showToast("Domain unauthorized: Add meeransahib.github.io to Firebase Authorized Domains");
          if (el.rulesHelperModal) el.rulesHelperModal.classList.remove('hidden');
          return;
        }
      }
    }

    updateCloudBadge('offline', 'Session Mode');

    if (err.code === 'auth/unauthorized-domain') {
      showToast("Domain unauthorized: Add meeransahib.github.io to Firebase Console > Auth > Settings > Authorized Domains");
      if (el.rulesHelperModal) el.rulesHelperModal.classList.remove('hidden');
      return;
    }

    if (err.code !== 'auth/popup-closed-by-user') {
      showToast(`Google Sign-In: ${err.message || 'Cancelled'}`);
    }
  }
}

async function handleGoogleSignOut() {
  if (!auth) return;
  try {
    updateCloudBadge('syncing', 'Signing out...');
    await signOut(auth);
    state.user = null;
    updateAuthUI(null);
    try {
      await signInAnonymously(auth);
    } catch (e) {
      state.userId = "guest-" + crypto.randomUUID().slice(0, 8);
      if (el.footerUserId) el.footerUserId.textContent = state.userId;
      updateCloudBadge('offline', 'Guest Session');
    }
    showToast("Signed out of Google account.");
  } catch (err) {
    console.error("Sign-out error:", err);
  }
}

async function initCloudSync() {
  try {
    await loadFirebase();
    const app = initializeApp(window.DetoxConstants.USER_FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);

    updateCloudBadge('syncing', 'Connecting Cloud...');

    // Process redirect sign-in completion (when returning from Google without popups)
    try {
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult && redirectResult.user) {
        state.user = redirectResult.user;
        state.userId = redirectResult.user.uid;
        state.isCloudConnected = true;
        if (el.footerUserId) el.footerUserId.textContent = state.userId;
        updateAuthUI(redirectResult.user);
        updateCloudBadge('online', 'Google Cloud Synced');
        showToast(`Signed in as ${redirectResult.user.displayName || redirectResult.user.email}!`);
        setupFirestoreListeners();
      }
    } catch (redirectErr) {
      console.warn("Redirect check error:", redirectErr);
      if (redirectErr.code === 'auth/credential-already-in-use') {
        const credential = GoogleAuthProvider.credentialFromError(redirectErr);
        if (credential) {
          try {
            const credRes = await signInWithCredential(auth, credential);
            state.user = credRes.user;
            state.userId = credRes.user.uid;
            state.isCloudConnected = true;
            if (el.footerUserId) el.footerUserId.textContent = state.userId;
            updateAuthUI(credRes.user);
            updateCloudBadge('online', 'Google Cloud Synced');
            showToast(`Signed in as ${credRes.user.displayName || credRes.user.email}!`);
            setupFirestoreListeners();
          } catch (credErr) {
            console.error("Sign-in with credential error:", credErr);
          }
        }
      } else if (redirectErr.code === 'auth/unauthorized-domain') {
        showToast("Domain unauthorized: Add meeransahib.github.io to Firebase Authorized Domains");
        if (el.rulesHelperModal) el.rulesHelperModal.classList.remove('hidden');
      }
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        state.user = user;
        state.userId = user.uid;
        state.isCloudConnected = true;
        if (el.footerUserId) el.footerUserId.textContent = state.userId;
        updateAuthUI(user);
        updateCloudBadge('online', user.isAnonymous ? 'Cloud Synced • Guest' : 'Google Cloud Synced');
        setupFirestoreListeners();
      } else {
        updateAuthUI(null);
      }
    });

    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (anonErr) {
        state.userId = "guest-click-google-signin";
        if (el.footerUserId) el.footerUserId.textContent = "Sign in to sync";
        updateCloudBadge('offline', 'Sign in with Google to Sync');
        startStopwatchIfFirstVisit();
        renderAll();
      }
    }
  } catch (err) {
    console.warn("Firebase init note:", err);
    state.userId = "session-" + crypto.randomUUID().slice(0, 8);
    if (el.footerUserId) el.footerUserId.textContent = state.userId;
    updateCloudBadge('offline', 'Local Storage Mode');
    startStopwatchIfFirstVisit();
    renderAll();
  }
}

// -------------------------------------------------------------------------
// Backup & JSON File Import
// -------------------------------------------------------------------------
// Imported files are untrusted: coerce every field to a safe type and length.
function sanitizeImportedLap(lap) {
  const str = (v, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');
  const num = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : fallback);
  const validBuckets = ["Morning", "Afternoon", "Evening", "Late Night"];

  const now = Date.now();
  const durationMs = num(lap.durationMs, 0);
  const relapsedAtMs = num(lap.relapsedAtMs, now);

  return {
    durationMs,
    hoursAvoided: Number((durationMs / 3600000).toFixed(2)),
    startedAtMs: num(lap.startedAtMs, relapsedAtMs - durationMs),
    relapsedAtMs,
    timeOfDayBucket: validBuckets.includes(lap.timeOfDayBucket)
      ? lap.timeOfDayBucket
      : window.DetoxConstants.getTimeOfDayBucket(new Date(relapsedAtMs)),
    platform: str(lap.platform, 60) || "Other",
    triggers: Array.isArray(lap.triggers)
      ? lap.triggers.map(t => str(t, 60)).filter(Boolean).slice(0, 12)
      : ["Unspecified"],
    whatHappenedBefore: str(lap.whatHappenedBefore),
    feelingBefore: str(lap.feelingBefore, 40) || "Unspecified",
    feelingBeforeNote: str(lap.feelingBeforeNote),
    feelingAfter: str(lap.feelingAfter, 40) || "Unspecified",
    feelingAfterNote: str(lap.feelingAfterNote),
    relapseDuration: str(lap.relapseDuration, 20),
    nextTimePlan: str(lap.nextTimePlan)
  };
}

function handleJsonFileImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const rawLaps = Array.isArray(data) ? data : (Array.isArray(data.laps) ? data.laps : null);
      if (!rawLaps) {
        showToast("Invalid JSON backup: missing laps array.");
        return;
      }

      let newCount = 0;
      for (const lap of rawLaps) {
        const exists = state.laps.some(existing =>
          (lap.id && existing.id === lap.id) ||
          (lap.relapsedAtMs && existing.relapsedAtMs === lap.relapsedAtMs)
        );
        if (!exists) {
          const importedRecord = sanitizeImportedLap(lap);
          await addLapRecordToCloud(importedRecord);
          newCount++;
        }
      }

      if (data.currentStreakTimer && (!state.timer.isRunning && state.timer.accumulatedMs === 0)) {
        state.timer = {
          isRunning: Boolean(data.currentStreakTimer.isRunning),
          currentLapStartTime: data.currentStreakTimer.currentLapStartTime || null,
          accumulatedMs: Number(data.currentStreakTimer.accumulatedMs || 0),
          streakInitialStartTime: data.currentStreakTimer.streakInitialStartTime || null
        };
        saveTimerStateToCloud();
      }

      window.DetoxStorage.saveLaps(state.laps);
      renderAll();
      if (el.backupModal) el.backupModal.classList.add('hidden');
      showToast(`Successfully imported ${newCount} new lap(s)!`);
    } catch (err) {
      console.error("JSON restore error:", err);
      showToast("Failed to parse JSON backup file.");
    } finally {
      if (el.importJsonFileInput) el.importJsonFileInput.value = "";
    }
  };
  reader.readAsText(file);
}

// -------------------------------------------------------------------------
// Event Listeners Binding
// -------------------------------------------------------------------------
function bindEvents() {
  // Navigation Tabs (Stopwatch / Patterns / Journal)
  if (el.navTabs) {
    el.navTabs.forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const target = tabBtn.getAttribute('data-tab-target');
        switchTab(target);
      });
    });
  }

  // Google Sign-In & Out
  if (el.googleSignInBtn) el.googleSignInBtn.addEventListener('click', handleGoogleSignIn);
  if (el.googleSignOutBtn) el.googleSignOutBtn.addEventListener('click', handleGoogleSignOut);

  // Stopwatch Controls
  if (el.toggleTimerBtn) el.toggleTimerBtn.addEventListener('click', toggleStopwatch);
  if (el.relapseBtn) el.relapseBtn.addEventListener('click', openRelapseModal);
  if (el.resetTimerBtn) el.resetTimerBtn.addEventListener('click', handleResetClick);

  // Urge Surfer Lifeline
  if (el.openUrgeSurferBtn) el.openUrgeSurferBtn.addEventListener('click', openUrgeSurfer);
  if (el.closeUrgeSurferBtn) el.closeUrgeSurferBtn.addEventListener('click', closeUrgeSurfer);
  if (el.urgeDefeatedBtn) el.urgeDefeatedBtn.addEventListener('click', handleUrgeDefeated);
  if (el.urgeRelapsedBtn) el.urgeRelapsedBtn.addEventListener('click', handleUrgeRelapsed);

  // Backdate Start Time
  if (el.openBackdateBtn) el.openBackdateBtn.addEventListener('click', () => el.backdateDrawer.classList.toggle('hidden'));
  if (el.closeBackdateBtn) el.closeBackdateBtn.addEventListener('click', () => el.backdateDrawer.classList.add('hidden'));
  if (el.applyBackdateBtn) {
    el.applyBackdateBtn.addEventListener('click', () => {
      const val = el.customStartTimeInput.value;
      if (!val) {
        showToast("Please pick a valid start date and time");
        return;
      }
      const chosenMs = new Date(val).getTime();
      if (isNaN(chosenMs) || chosenMs > Date.now()) {
        showToast("Start time must be in the past");
        return;
      }
      state.timer = {
        isRunning: true,
        currentLapStartTime: chosenMs,
        accumulatedMs: 0,
        streakInitialStartTime: chosenMs
      };
      el.backdateDrawer.classList.add('hidden');
      saveTimerStateToCloud();
      showToast("Updated streak start time!");
    });
  }

  // Relapse Modal
  if (el.closeRelapseModalBtn) el.closeRelapseModalBtn.addEventListener('click', closeRelapseModal);
  if (el.cancelRelapseModalBtn) el.cancelRelapseModalBtn.addEventListener('click', closeRelapseModal);
  if (el.relapseForm) el.relapseForm.addEventListener('submit', handleRelapseFormSubmit);

  if (el.platformPillsContainer) {
    el.platformPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-platform]');
      if (!btn) return;
      state.pendingRelapse.selectedPlatform = btn.getAttribute('data-platform');
      renderModalPills();
    });
  }

  if (el.triggerPillsContainer) {
    el.triggerPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-trigger]');
      if (!btn) return;
      const trig = btn.getAttribute('data-trigger');
      const list = state.pendingRelapse.selectedTriggers;
      if (list.includes(trig)) {
        state.pendingRelapse.selectedTriggers = list.filter(item => item !== trig);
      } else {
        state.pendingRelapse.selectedTriggers.push(trig);
      }
      renderModalPills();
    });
  }

  if (el.feelingBeforePillsContainer) {
    el.feelingBeforePillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-before]');
      if (!btn) return;
      state.pendingRelapse.selectedFeelingBefore = btn.getAttribute('data-before');
      renderModalPills();
    });
  }

  if (el.feelingAfterPillsContainer) {
    el.feelingAfterPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-after]');
      if (!btn) return;
      state.pendingRelapse.selectedFeelingAfter = btn.getAttribute('data-after');
      renderModalPills();
    });
  }

  if (el.relapseDurationPillsContainer) {
    el.relapseDurationPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-relapse-duration]');
      if (!btn) return;
      state.pendingRelapse.selectedRelapseDuration = btn.getAttribute('data-relapse-duration');
      renderModalPills();
    });
  }

  // Cloud Diagnostics Modal
  const openRulesModal = () => el.rulesHelperModal && el.rulesHelperModal.classList.remove('hidden');
  const closeRulesModal = () => el.rulesHelperModal && el.rulesHelperModal.classList.add('hidden');
  if (el.openRulesHelperBtn) el.openRulesHelperBtn.addEventListener('click', openRulesModal);
  if (el.cloudStatusBadge) el.cloudStatusBadge.addEventListener('click', openRulesModal);
  if (el.diagnosticOpenRulesBtn) el.diagnosticOpenRulesBtn.addEventListener('click', openRulesModal);
  if (el.closeRulesHelperModalBtn) el.closeRulesHelperModalBtn.addEventListener('click', closeRulesModal);
  if (el.copyFirestoreRulesBtn && el.firestoreRulesCode) {
    el.copyFirestoreRulesBtn.addEventListener('click', () => {
      const ta = document.createElement('textarea');
      ta.value = el.firestoreRulesCode.textContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast("Copied Firestore Security Rules!");
    });
  }

  // Search & Filter in Journal Tab
  if (el.searchLapsInput) {
    el.searchLapsInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderLapHistory();
    });
  }
  if (el.filterTimeBucketSelect) {
    el.filterTimeBucketSelect.addEventListener('change', (e) => {
      state.filterBucket = e.target.value;
      renderLapHistory();
    });
  }

  // Delete Lap Action
  if (el.lapHistoryList) {
    el.lapHistoryList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delete-lap]');
      if (!btn) return;
      const lapId = btn.getAttribute('data-delete-lap');
      if (state.deleteConfirmLapId === lapId) {
        state.deleteConfirmLapId = null;
        deleteLapFromCloud(lapId);
      } else {
        state.deleteConfirmLapId = lapId;
        renderLapHistory();
        clearTimeout(window.__deleteLapTimeout);
        window.__deleteLapTimeout = setTimeout(() => {
          state.deleteConfirmLapId = null;
          renderLapHistory();
        }, 3500);
      }
    });
  }

  // Demo Data Loader
  if (el.loadDemoDataBtn) {
    el.loadDemoDataBtn.addEventListener('click', async () => {
      const sample = window.DetoxStorage.getSampleLogs();
      for (const item of sample) {
        await addLapRecordToCloud(item);
      }
      showToast("Loaded 3 sample relapse logs!");
    });
  }

  // Backup Modal & Exports
  if (el.openBackupModalBtn) el.openBackupModalBtn.addEventListener('click', () => el.backupModal.classList.remove('hidden'));
  if (el.closeBackupModalBtn) el.closeBackupModalBtn.addEventListener('click', () => el.backupModal.classList.add('hidden'));
  if (el.exportCsvBtn) {
    el.exportCsvBtn.addEventListener('click', () => {
      const ok = window.DetoxStorage.exportCSV(state.laps);
      if (ok) showToast("Downloaded CSV Spreadsheet!");
      else showToast("No laps to export yet.");
    });
  }
  if (el.exportJsonBtn) {
    el.exportJsonBtn.addEventListener('click', () => {
      window.DetoxStorage.exportJSON(state.timer, state.laps, state.urgesDefeated);
      showToast("Downloaded JSON Backup!");
    });
  }
  if (el.copyMarkdownReportBtn) {
    el.copyMarkdownReportBtn.addEventListener('click', () => {
      window.DetoxStorage.copySummaryReport(getElapsedMs(), state.laps, state.urgesDefeated);
      showToast("Copied Summary Report to Clipboard!");
    });
  }

  if (el.triggerImportJsonBtn && el.importJsonFileInput) {
    el.triggerImportJsonBtn.addEventListener('click', () => el.importJsonFileInput.click());
    el.importJsonFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleJsonFileImport(e.target.files[0]);
      }
    });
  }

  // PWA Install Prompt Handler
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (el.installAppBtn) {
      el.installAppBtn.classList.remove('hidden');
      el.installAppBtn.classList.add('inline-flex');
    }
    if (el.mobileInstallItem) {
      el.mobileInstallItem.classList.remove('hidden');
    }
  });

  if (el.installAppBtn) {
    el.installAppBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast("LifeBack added to home screen! 📲");
          el.installAppBtn.classList.add('hidden');
          if (el.mobileInstallItem) el.mobileInstallItem.classList.add('hidden');
        }
        deferredInstallPrompt = null;
      } else {
        showToast("To install on iOS: tap Share (↑) and select 'Add to Home Screen'.");
      }
    });
  }

  // Mobile Header Overflow Menu Actions
  if (el.mobileMenuBtn && el.mobileMenuDropdown) {
    el.mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.mobileMenuDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!el.mobileMenuDropdown.classList.contains('hidden') && !el.mobileMenuDropdown.contains(e.target) && e.target !== el.mobileMenuBtn) {
        el.mobileMenuDropdown.classList.add('hidden');
      }
    });
  }
  if (el.mobileSignInBtn) {
    el.mobileSignInBtn.addEventListener('click', () => {
      if (el.mobileMenuDropdown) el.mobileMenuDropdown.classList.add('hidden');
      handleGoogleSignIn();
    });
  }
  if (el.mobileCloudSetupBtn) {
    el.mobileCloudSetupBtn.addEventListener('click', () => {
      if (el.mobileMenuDropdown) el.mobileMenuDropdown.classList.add('hidden');
      if (el.rulesHelperModal) el.rulesHelperModal.classList.remove('hidden');
    });
  }
  if (el.mobileBackupBtn) {
    el.mobileBackupBtn.addEventListener('click', () => {
      if (el.mobileMenuDropdown) el.mobileMenuDropdown.classList.add('hidden');
      if (el.backupModal) el.backupModal.classList.remove('hidden');
    });
  }
  if (el.mobileInstallBtn) {
    el.mobileInstallBtn.addEventListener('click', () => {
      if (el.mobileMenuDropdown) el.mobileMenuDropdown.classList.add('hidden');
      if (el.installAppBtn) el.installAppBtn.click();
    });
  }

  // Backdrop click dismiss for all modals
  [el.relapseModal, el.backupModal, el.rulesHelperModal, el.urgeSurferModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal === el.urgeSurferModal) {
          closeUrgeSurfer();
        } else {
          modal.classList.add('hidden');
        }
      }
    });
  });

  // Swipe gesture navigation between tabs
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    // Don't intercept when touching inputs, sliders, scrollable pre, or open modals
    if (e.target.closest('input, textarea, select, pre, button, .overflow-y-auto, .overflow-x-auto, #backdateDrawer, #relapseModal, #backupModal, #rulesHelperModal, #urgeSurferModal')) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    if (e.target.closest('input, textarea, select, pre, button, .overflow-y-auto, .overflow-x-auto, #backdateDrawer, #relapseModal, #backupModal, #rulesHelperModal, #urgeSurferModal')) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStartX;
    const deltaY = t.clientY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;

    if (deltaTime < 500 && Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const tabs = ['stopwatch', 'analytics', 'journal'];
      const currentIndex = tabs.indexOf(state.activeTab);
      if (deltaX < 0 && currentIndex < tabs.length - 1) {
        triggerHaptic('tap');
        switchTab(tabs[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        triggerHaptic('tap');
        switchTab(tabs[currentIndex - 1]);
      }
    }
  }, { passive: true });
}

// -------------------------------------------------------------------------
// PWA Service Worker & Initial Boot
// -------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  queryElements();
  bindEvents();

  // Load from local storage immediately (Zero delay)
  const cached = window.DetoxStorage.loadLocalState();
  if (cached.timer) {
    state.timer = {
      isRunning: Boolean(cached.timer.isRunning),
      currentLapStartTime: cached.timer.currentLapStartTime || null,
      accumulatedMs: Number(cached.timer.accumulatedMs || 0),
      streakInitialStartTime: cached.timer.streakInitialStartTime || null
    };
  } else {
    startStopwatchIfFirstVisit();
  }
  if (cached.laps && cached.laps.length > 0) state.laps = cached.laps;
  state.urgesDefeated = cached.urgesDefeated || 0;

  // Restore active tab or default to stopwatch
  switchTab(cached.activeTab || 'stopwatch');

  // Connect Firebase in background
  initCloudSync();

  // Start real-time 1-second ticker
  setInterval(() => {
    renderStopwatchTick();
  }, 1000);
});
