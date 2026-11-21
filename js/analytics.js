// =========================================================================
// Gaining Our Life Back: behavioral Analytics & Visual Heatmap
// =========================================================================

window.DetoxAnalytics = {
  renderVulnerabilityWindow(laps, containerEl, summaryEl, adviceEl) {
    if (!containerEl) return;

    const buckets = [
      { key: "Morning", label: "Morning (6am to 12pm)", count: 0 },
      { key: "Afternoon", label: "Afternoon (12pm to 5pm)", count: 0 },
      { key: "Evening", label: "Evening (5pm to 10pm)", count: 0 },
      { key: "Late Night", label: "Late night (10pm to 6am)", count: 0 }
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
      if (summaryEl) summaryEl.textContent = "Your streak is running. When you finish a lap, your riskiest time of day shows up here.";
      if (adviceEl) adviceEl.innerHTML = `<span class="font-semibold text-ink">Momentum:</span> <span class="text-mute">You haven't slipped yet. Keep it going.</span>`;
    } else {
      const peakPct = Math.round((peakBucket.count / laps.length) * 100);
      if (summaryEl) {
        summaryEl.innerHTML = `<span class="text-ink font-semibold">${peakPct}% of your slips</span> happen in the <span class="text-ink font-semibold">${peakBucket.label.toLowerCase()}</span>.`;
      }
      if (adviceEl) {
        adviceEl.innerHTML = `<span class="font-semibold text-ink">Plan:</span> <span class="text-mute">your riskiest window is ${peakBucket.label.toLowerCase()}. Put your phone in another room or turn on a strict app blocker then.</span>`;
      }
    }

    containerEl.innerHTML = buckets.map(b => {
      const pct = laps.length > 0 ? Math.round((b.count / total) * 100) : 0;
      const isPeak = laps.length > 0 && b.key === peakBucket.key && b.count > 0;
      return `
        <div>
          <div class="flex items-baseline justify-between text-sm mb-1.5">
            <span class="${isPeak ? 'text-ink font-semibold' : 'text-mute'}">${b.label}</span>
            <span class="tabular-nums ${isPeak ? 'text-ember-text font-semibold' : 'text-mute'}">${b.count} (${pct}%)</span>
          </div>
          <div class="meter"><div class="${isPeak ? '!bg-ember' : '!bg-faint/60'}" style="width: ${pct}%"></div></div>
        </div>
      `;
    }).join('');
  },

  renderTopTriggersAndPlatforms(laps, triggersEl, platformsEl) {
    if (!triggersEl) return;

    if (laps.length === 0) {
      triggersEl.innerHTML = `<p class="text-mute text-sm">No slips yet. If one happens, honest logging shows what sets it off.</p>`;
      if (platformsEl) platformsEl.innerHTML = `<span class="text-mute text-sm">None logged yet</span>`;
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
          <div class="flex items-baseline justify-between gap-3 text-sm mb-1.5">
            <span class="${idx === 0 ? 'text-ink font-semibold' : 'text-mute'}">${window.DetoxConstants.escapeHtml(trig)}</span>
            <span class="tabular-nums shrink-0 ${idx === 0 ? 'text-ember-text font-semibold' : 'text-mute'}">${count}x (${pct}%)</span>
          </div>
          <div class="meter"><div class="${idx === 0 ? '!bg-ember' : '!bg-faint/60'}" style="width: ${pct}%"></div></div>
        </div>
      `;
    }).join('');

    if (platformsEl) {
      const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
      platformsEl.innerHTML = sortedPlatforms.map(([plat, count]) => `
        <span class="tag">${window.DetoxConstants.escapeHtml(plat)} <span class="text-ember-text font-semibold ml-1.5 tabular-nums">${count}</span></span>
      `).join('');
    }
  },

  renderEmotionalLoop(laps, containerEl, insightEl) {
    if (!containerEl) return;

    if (laps.length === 0) {
      containerEl.innerHTML = `<p class="text-mute text-sm">Nothing logged yet. This shows how feeds promise relief and leave regret.</p>`;
      return;
    }

    const pairCounts = {};
    let negativeAfterCount = 0;
    const negativeFeelings = window.DetoxConstants.NEGATIVE_AFTER_FEELINGS;

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
      const esc = window.DetoxConstants.escapeHtml;
      return `
        <div class="flex items-baseline justify-between gap-3 text-sm pb-3 border-b border-line last:border-b-0">
          <span class="text-mute"><span class="text-ink font-medium">${esc(before)}</span> before, <span class="text-ink font-medium">${esc(after)}</span> after</span>
          <span class="tabular-nums text-mute shrink-0">${count}x (${pct}%)</span>
        </div>
      `;
    }).join('');

    if (insightEl) {
      const negPct = Math.round((negativeAfterCount / laps.length) * 100);
      insightEl.innerHTML = `
        <span class="font-semibold text-ink">${negPct}% of your slips</span> left you regretful, foggy or still bored. Remember that the next time the urge hits.
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
      // The streak's end is derived from the same elapsed time the stopwatch shows,
      // so a paused timer stops accruing clean time on the heatmap too.
      const { isRunning, streakInitialStartTime } = timer;
      if (streakInitialStartTime && streakInitialStartTime <= dayEndMs) {
        const runningMs = isRunning && timer.currentLapStartTime
          ? Math.max(0, Date.now() - timer.currentLapStartTime)
          : 0;
        const streakEnd = streakInitialStartTime + Math.max(0, Number(timer.accumulatedMs) || 0) + runningMs;
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
      let bgStyle = "bg-line text-faint";
      if (slot.hours >= 16) {
        bgStyle = "bg-lamp text-lamp-ink";
      } else if (slot.hours >= 8) {
        bgStyle = "bg-lamp/65 text-ink";
      } else if (slot.hours > 0) {
        bgStyle = "bg-lamp/30 text-ink";
      }

      const isToday = slot.date.toDateString() === now.toDateString();

      return `
        <div class="py-2 rounded-xl flex flex-col items-center justify-center text-center select-none ${bgStyle} ${isToday ? 'ring-2 ring-tide-text ring-offset-2 ring-offset-ground' : ''}" title="${slot.dateStr}: ${slot.hours.toFixed(1)} hrs clean">
          <span class="text-[10px] opacity-80">${slot.dayName}</span>
          <span class="text-sm font-semibold tabular-nums leading-tight">${slot.dayNum}</span>
          <span class="text-[10px] tabular-nums">${slot.hours > 0 ? slot.hours.toFixed(0) + 'h' : '-'}</span>
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
      const days = m.targetHours >= 48 ? Math.round(m.targetHours / 24) : null;
      const big = days ? days + 'd' : m.targetHours + 'h';

      return `
        <div class="${isUnlocked ? '' : 'opacity-80'}">
          <div class="numeral text-[3rem] ${isUnlocked ? 'text-lamp-text' : 'text-faint'}">${big}</div>
          <div class="text-ink font-semibold mt-2">${m.title}</div>
          <div class="text-mute text-sm">${m.desc}</div>
          ${isUnlocked
            ? `<div class="status status-live mt-2"><span class="dot"></span>Unlocked</div>`
            : `<div class="meter mt-3"><div style="width: ${pct}%"></div></div>
               <div class="text-mute text-sm mt-1.5 tabular-nums">${(m.targetHours - totalHours).toFixed(1)}h to go</div>`}
        </div>
      `;
    }).join('');
  }
};
