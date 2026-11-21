// =========================================================================
// Gaining Our Life Back: time-of-day theme
// Loaded in <head> before first paint so the page never flashes the wrong hour.
// Sets <html data-daypart="morning|afternoon|evening|night">; colours live in
// css/input.css. Mode is "auto" (follows the clock), "day" or "night".
// =========================================================================
(function () {
  var KEY = 'lifeback_theme_mode_v1';
  var MODES = ['auto', 'day', 'night'];
  var LABELS = { auto: 'Follows the hour', day: 'Always day', night: 'Always night' };

  function readMode() {
    try {
      var m = localStorage.getItem(KEY);
      return MODES.indexOf(m) >= 0 ? m : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function clockDaypart(date) {
    var h = (date || new Date()).getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 22) return 'evening';
    return 'night';
  }

  function resolve(mode) {
    var clock = clockDaypart();
    if (mode === 'night') return 'night';
    if (mode === 'day') return clock === 'morning' || clock === 'afternoon' ? clock : 'afternoon';
    return clock;
  }

  function apply() {
    var mode = readMode();
    var part = resolve(mode);
    var root = document.documentElement;
    root.setAttribute('data-daypart', part);
    root.setAttribute('data-theme-mode', mode);

    // Match the browser / installed-app chrome to the page.
    var ground = getComputedStyle(root).getPropertyValue('--c-ground').trim();
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && ground) meta.setAttribute('content', 'rgb(' + ground.split(/\s+/).join(',') + ')');

    var labelEls = document.querySelectorAll('[data-theme-label]');
    for (var i = 0; i < labelEls.length; i++) labelEls[i].textContent = LABELS[mode];
  }

  function cycle() {
    var next = MODES[(MODES.indexOf(readMode()) + 1) % MODES.length];
    try {
      localStorage.setItem(KEY, next);
    } catch (e) {
      /* storage can be blocked; the choice then lasts until reload */
    }
    apply();
    if (window.DetoxTheme && typeof window.DetoxTheme.onChange === 'function') {
      window.DetoxTheme.onChange(next);
    }
  }

  window.DetoxTheme = { apply: apply, cycle: cycle, clockDaypart: clockDaypart, readMode: readMode, onChange: null };

  // Set the attribute immediately (CSS may not be parsed yet, which is fine:
  // the variables resolve as soon as it is).
  document.documentElement.setAttribute('data-daypart', resolve(readMode()));

  document.addEventListener('DOMContentLoaded', function () {
    apply();
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', cycle);
    // Re-check the hour every few minutes so a long-open tab drifts into dusk.
    setInterval(apply, 5 * 60 * 1000);
  });
})();
