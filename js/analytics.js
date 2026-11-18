// =========================================================================
// Gaining Our Life Back — Behavioral Analytics & Visual Heatmap
// =========================================================================

window.DetoxAnalytics = {
  renderVulnerabilityWindow(laps, containerEl, summaryEl, adviceEl) {
    if (!containerEl) return;

    const buckets = [
      { key: "Morning", label: "Morning (6am–12pm)", count: 0 },
      { key: "Afternoon", label: "Afternoon (12pm–5pm)", count: 0 },
      { key: "Evening", label: "Evening (5pm–10pm)", count: 0 },
      { key: "Late Night", label: "Late Night (10pm–6am)", count: 0 }
    ];

    laps.forEach(l => {
      const found = buckets.find(b => b.key === l.timeOfDayBucket);
      if (found) found.count += 1;
    });

    const total = laps.length || 1;
    let peakBucket = buckets[0];
    buckets.forEach(b => {
      if (b.count > peakBucket.count) peakBucket = b;
    });

    if (laps.length === 0) {
      if (summaryEl) summaryEl.textContent = "Your clean streak is running. When you complete a lap, your peak danger window will appear here.";
      if (adviceEl) adviceEl.innerHTML = `<span class="font-semibold text-emerald-400">Momentum:</span> You haven't relapsed yet — that's real progress. Keep the streak alive!`;
    } else {
      const peakPct = Math.round((peakBucket.count / laps.length) * 100);
      if (summaryEl) {
        summaryEl.innerHTML = `<span class="text-amber-300 font-semibold">${peakPct}% of your relapses</span> happen during the <span class="text-white font-semibold">${peakBucket.key}</span> window.`;
      }
      if (adviceEl) {
        adviceEl.innerHTML = `<span class="font-semibold text-amber-300">Actionable Fix:</span> Your highest danger zone is <span class="text-white font-semibold">${peakBucket.label}</span>. Put your phone in another room or enable strict app blockers during this window.`;
      }
    }

    containerEl.innerHTML = buckets.map(b => {
      const pct = laps.length > 0 ? Math.round((b.count / total) * 100) : 0;
      const isPeak = laps.length > 0 && b.key === peakBucket.key && b.count > 0;
      return `
        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="${isPeak ? 'text-amber-300 font-semibold' : 'text-slate-300'}">${b.label}</span>
            <span class="font-mono text-slate-400">${b.count} (${pct}%)</span>
          </div>
          <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div class="h-full rounded-full transition-all duration-500 ${isPeak ? 'bg-amber-400' : 'bg-slate-600'}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTopTriggersAndPlatforms(laps, triggersEl, platformsEl) {
    if (!triggersEl) return;

    if (laps.length === 0) {
      triggersEl.innerHTML = `
        <div class="text-xs text-slate-400 py-6 px-3 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <p class="font-semibold text-slate-300">Clean streak running</p>
          <p class="text-slate-500 mt-1">If you slip up, honest logging reveals your top habit triggers.</p>
        </div>
      `;
      if (platformsEl) platformsEl.innerHTML = `<span class="text-xs text-slate-500">None logged yet</span>`;
      return;
    }

    const triggerCounts = {};
    const platformCounts = {};

    laps.forEach(l => {
      (l.triggers || []).forEach(t => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      });
      if (l.platform) {
        platformCounts[l.platform] = (platformCounts[l.platform] || 0) + 1;
      }
    });

    const sortedTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    triggersEl.innerHTML = sortedTriggers.map(([trig, count], idx) => {
      const pct = Math.round((count / laps.length) * 100);
      return `
        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="${idx === 0 ? 'text-rose-300 font-semibold' : 'text-slate-300'}">${idx + 1}. ${window.DetoxConstants.escapeHtml(trig)}</span>
            <span class="font-mono text-slate-400">${count}x (${pct}%)</span>
          </div>
          <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div class="h-full rounded-full ${idx === 0 ? 'bg-rose-500' : 'bg-rose-500/50'}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');

    if (platformsEl) {
      const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
      platformsEl.innerHTML = sortedPlatforms.map(([plat, count]) => `
        <span class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 font-medium">
          ${window.DetoxConstants.escapeHtml(plat)} <span class="text-rose-400 font-mono ml-1">${count}</span>
        </span>
      `).join('');
    }
  },

  renderEmotionalLoop(laps, containerEl, insightEl) {
    if (!containerEl) return;

    if (laps.length === 0) {
      containerEl.innerHTML = `
        <div class="text-xs text-slate-400 py-6 px-3 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <p class="font-semibold text-slate-300">Emotional shift loop</p>
          <p class="text-slate-500 mt-1">Tracks how algorithmic feeds promise relief but leave regret.</p>
        </div>
      `;
      return;
    }

    const pairCounts = {};
    let negativeAfterCount = 0;
    const negativeFeelings = ["Regretful", "Brain-Fogged", "Still Bored", "Guilty", "Drained", "Anxious", "Numb"];

    laps.forEach(l => {
      const before = l.feelingBefore || "Unspecified";
      const after = l.feelingAfter || "Unspecified";
      const key = `${before}___${after}`;
      pairCounts[key] = (pairCounts[key] || 0) + 1;
      if (negativeFeelings.includes(after)) {
        negativeAfterCount += 1;
      }
    });

    const sortedPairs = Object.entries(pairCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    containerEl.innerHTML = sortedPairs.map(([key, count]) => {
      const [before, after] = key.split('___');
      const pct = Math.round((count / laps.length) * 100);
      return `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">${window.DetoxConstants.escapeHtml(before)}</span>
            <span class="text-slate-500 font-bold">➔</span>
            <span class="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">${window.DetoxConstants.escapeHtml(after)}</span>
          </div>
          <span class="font-mono text-slate-400 shrink-0 ml-2">${count}x (${pct}%)</span>
        </div>
      `;
    }).join('');

    if (insightEl) {
      const negPct = Math.round((negativeAfterCount / laps.length) * 100);
      insightEl.innerHTML = `
        <span class="font-semibold text-indigo-300">Pattern Proof:</span> In <span class="text-white font-bold">${negPct}% of your relapses</span>, scrolling left you feeling regretful, brain-fogged, or still bored afterward. Remember this next time the urge hits!
      `;
    }
  },

  renderConsistencyHeatmap(timer, laps, gridEl) {
    if (!gridEl) return;

    const now = new Date();
    const daySlots = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStartMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
      const dayEndMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      let cleanMsForDay = 0;

      // Current running streak
      const { isRunning, streakInitialStartTime } = timer;
      if (streakInitialStartTime && streakInitialStartTime <= dayEndMs) {
        const streakEnd = isRunning ? Date.now() : (timer.currentLapStartTime || Date.now());
        const overlapStart = Math.max(dayStartMs, streakInitialStartTime);
        const overlapEnd = Math.min(dayEndMs, streakEnd);
        if (overlapEnd > overlapStart) {
          cleanMsForDay += (overlapEnd - overlapStart);
        }
      }

      // Past laps
      laps.forEach(lap => {
        const lStart = lap.startedAtMs || (lap.relapsedAtMs - (lap.durationMs || 0));
        const lEnd = lap.relapsedAtMs;
        if (lStart <= dayEndMs && lEnd >= dayStartMs) {
          const oStart = Math.max(dayStartMs, lStart);
          const oEnd = Math.min(dayEndMs, lEnd);
          if (oEnd > oStart) {
            cleanMsForDay += (oEnd - oStart);
          }
        }
      });

      cleanMsForDay = Math.min(86400000, cleanMsForDay);
      const hours = cleanMsForDay / (1000 * 60 * 60);

      daySlots.push({
        date: d,
        dateStr: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        dayName: d.toLocaleDateString([], { weekday: 'narrow' }),
        dayNum: d.getDate(),
        hours: hours
      });
    }

    gridEl.innerHTML = daySlots.map(slot => {
      let bgStyle = "bg-slate-900 border-slate-800 text-slate-500";
      if (slot.hours >= 16) {
        bgStyle = "bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-950/40";
      } else if (slot.hours >= 8) {
        bgStyle = "bg-emerald-700/80 border-emerald-500/60 text-emerald-100";
      } else if (slot.hours > 0) {
        bgStyle = "bg-emerald-950/70 border-emerald-800/40 text-emerald-300";
      }

      const isToday = slot.date.toDateString() === now.toDateString();

      return `
        <div class="p-2 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 select-none relative ${bgStyle} ${isToday ? 'ring-2 ring-emerald-400' : ''}" title="${slot.dateStr}: ${slot.hours.toFixed(1)} hrs clean">
          <span class="text-[9px] uppercase tracking-wider opacity-75">${slot.dayName}</span>
          <span class="text-xs font-mono font-bold leading-tight">${slot.dayNum}</span>
          <span class="text-[9px] font-mono mt-0.5">${slot.hours > 0 ? slot.hours.toFixed(0) + 'h' : '—'}</span>
        </div>
      `;
    }).join('');
  },

  renderMilestones(grandTotalMs, containerEl) {
    if (!containerEl) return;

    const totalHours = grandTotalMs / (1000 * 60 * 60);
    const milestones = window.DetoxConstants.MILESTONES;

    containerEl.innerHTML = milestones.map(m => {
      const isUnlocked = totalHours >= m.targetHours;
      const pct = Math.min(100, Math.round((totalHours / m.targetHours) * 100));

      if (isUnlocked) {
        return `
          <div class="bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/40 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg shadow-emerald-950/30">
            <div class="flex items-center justify-between">
              <span class="text-2xl">${m.icon}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">UNLOCKED ✓</span>
            </div>
            <div class="mt-2">
              <div class="text-xs font-bold text-white">${m.title}</div>
              <div class="text-[11px] text-emerald-400 mt-0.5">${m.desc}</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between opacity-70 hover:opacity-100 transition">
            <div class="flex items-center justify-between">
              <span class="text-2xl grayscale">${m.icon}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">${pct}%</span>
            </div>
            <div class="mt-2">
              <div class="text-xs font-semibold text-slate-300">${m.title}</div>
              <div class="text-[10px] text-slate-500 mt-0.5">${(m.targetHours - totalHours).toFixed(1)}h remaining</div>
              <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div class="h-full bg-emerald-500/50 rounded-full" style="width: ${pct}%"></div>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');
  }
};
