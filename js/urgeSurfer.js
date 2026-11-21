// =========================================================================
// Gaining Our Life Back — Urge Surfer 90-Second Craving Lifeline
// =========================================================================

window.DetoxUrgeSurfer = {
  intervalId: null,
  remainingSeconds: 90,

  startSession(laps, elements) {
    this.remainingSeconds = 90;
    if (elements.defeatedBtn) elements.defeatedBtn.classList.remove('animate-pulse');
    this.updateDisplay(elements);

    // 1. Generate dynamic reality check from actual user data
    if (elements.realityCheckText) {
      if (laps && laps.length > 0) {
        const negativeAfterFeelings = window.DetoxConstants.NEGATIVE_AFTER_FEELINGS;
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
            In <strong class="text-ink">${negPct}% of your past slips</strong>, scrolling left you feeling <strong class="text-ink">${window.DetoxConstants.escapeHtml(topFeel)}</strong>. Your own log shows scrolling usually doesn't deliver the relief it promises.
          `;
        } else {
          elements.realityCheckText.innerHTML = `
            Your brain is seeking quick comfort, but scrolling has consistently interrupted your momentum. Ride this wave for 90 seconds.
          `;
        }
      } else {
        elements.realityCheckText.innerHTML = `
          Urges tend to rise, peak and fade like a wave when you observe them instead of acting on them. Give this one 90 seconds before you decide. Protect your streak.
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
          elements.breathingCue.textContent = "The wave has passed. Well done.";
          elements.breathingCue.className = "cue cue-done mt-2";
        }
        if (elements.defeatedBtn) {
          elements.defeatedBtn.classList.add('dot-live');
        }
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
        elements.breathingCue.textContent = "Breathe in slowly";
        elements.breathingCue.className = "cue mt-2";
      } else if (cyclePos < 5) {
        elements.breathingCue.textContent = "Hold gently";
        elements.breathingCue.className = "cue mt-2";
      } else {
        elements.breathingCue.textContent = "Breathe out fully";
        elements.breathingCue.className = "cue mt-2";
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
