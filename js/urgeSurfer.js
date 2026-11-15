// =========================================================================
// Gaining Our Life Back — Urge Surfer 90-Second Craving Lifeline
// =========================================================================

window.DetoxUrgeSurfer = {
  intervalId: null,
  remainingSeconds: 90,

  startSession(laps, elements, onComplete) {
    this.remainingSeconds = 90;
    this.updateDisplay(elements);

    // 1. Generate dynamic reality check from actual user data
    if (elements.realityCheckText) {
      if (laps && laps.length > 0) {
        const negativeAfterFeelings = ["Regretful", "Brain-Fogged", "Still Bored", "Guilty", "Drained", "Anxious", "Numb"];
        const counts = {};
        let totalNeg = 0;

        laps.forEach(l => {
          const feel = l.feelingAfter;
          if (feel && negativeAfterFeelings.includes(feel)) {
            counts[feel] = (counts[feel] || 0) + 1;
            totalNeg++;
          }
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topFeel = sorted.length > 0 ? sorted[0][0] : null;
        const negPct = Math.round((totalNeg / laps.length) * 100);

        if (topFeel && negPct > 0) {
          elements.realityCheckText.innerHTML = `
            In <strong class="text-amber-300 font-bold">${negPct}% of your past relapses</strong>, scrolling left you feeling <strong class="text-white font-bold underline">${window.DetoxConstants.escapeHtml(topFeel)}</strong>. Your brain craves quick dopamine, but your own data proves scrolling will only leave you depleted.
          `;
        } else {
          elements.realityCheckText.innerHTML = `
            Your brain is seeking quick comfort, but scrolling has consistently interrupted your momentum. Ride this wave for 90 seconds.
          `;
        }
      } else {
        elements.realityCheckText.innerHTML = `
          Behavioral studies prove that cravings spike like a wave and naturally recede within 60–90 seconds if you observe them without touching your phone. Protect your streak!
        `;
      }
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.remainingSeconds--;
      this.updateDisplay(elements);

      if (this.remainingSeconds <= 0) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        if (elements.breathingCue) {
          elements.breathingCue.textContent = "Wave Passed! You did it! 🎉";
          elements.breathingCue.className = "text-xs uppercase tracking-wider text-amber-300 font-bold mt-1";
        }
        if (elements.defeatedBtn) {
          elements.defeatedBtn.classList.add('animate-pulse');
        }
        if (typeof onComplete === 'function') onComplete();
      }
    }, 1000);
  },

  updateDisplay(elements) {
    const sec = Math.max(0, this.remainingSeconds);
    const m = Math.floor(sec / 60);
    const s = sec % 60;

    if (elements.timerDisplay) {
      elements.timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    if (elements.breathingCue) {
      const cyclePos = (90 - sec) % 8;
      if (cyclePos < 3) {
        elements.breathingCue.textContent = "Inhale Slowly... (3s)";
        elements.breathingCue.className = "text-xs uppercase tracking-wider text-emerald-300 font-semibold mt-1";
      } else if (cyclePos < 5) {
        elements.breathingCue.textContent = "Hold Gently... (2s)";
        elements.breathingCue.className = "text-xs uppercase tracking-wider text-sky-300 font-semibold mt-1";
      } else {
        elements.breathingCue.textContent = "Exhale Completely... (3s)";
        elements.breathingCue.className = "text-xs uppercase tracking-wider text-amber-300 font-semibold mt-1";
      }
    }
  },

  stopSession() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};
