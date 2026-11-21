/** Design tokens live in css/input.css as CSS variables (one set per time of day).
 *  Tailwind only maps them to class names, so `bg-lamp/20` etc. keep working. */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ground: token('ground'),   // page background
        surface: token('surface'), // quiet panels, inputs
        raised: token('raised'),   // sheets, menus
        line: token('line'),       // rules and borders
        ink: token('ink'),         // primary text
        mute: token('mute'),       // secondary text
        faint: token('faint'),     // hints (still passes 4.5:1)
        lamp: token('lamp'),       // banked time + primary action (fill)
        'lamp-ink': token('lamp-ink'),
        'lamp-text': token('lamp-text'),
        tide: token('tide'),       // urges and the 90-second wave (fill)
        'tide-ink': token('tide-ink'),
        'tide-text': token('tide-text'),
        ember: token('ember'),     // slips only (fill)
        'ember-ink': token('ember-ink'),
        'ember-text': token('ember-text'),
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Archivo"', '"Arial Narrow"', 'Impact', 'sans-serif'],
      },
      borderRadius: {
        control: '14px',
        sheet: '26px',
      },
      keyframes: {
        'sheet-in': { from: { transform: 'translateY(24px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        'toast-in': { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        'live-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.35' } },
        // 3s inhale, 2s hold, 3s exhale: matches the cue text in urgeSurfer.js
        breathe: {
          '0%': { transform: 'scale(.78)' },
          '37.5%': { transform: 'scale(1.06)' },
          '62.5%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(.78)' },
        },
        'wave-drift': { from: { backgroundPositionX: '0' }, to: { backgroundPositionX: '-240px' } },
      },
      animation: {
        'sheet-in': 'sheet-in .28s cubic-bezier(.2,.8,.2,1)',
        'toast-in': 'toast-in .22s ease-out',
        'live-pulse': 'live-pulse 2.4s ease-in-out infinite',
        breathe: 'breathe 8s ease-in-out infinite',
        'wave-drift': 'wave-drift 9s linear infinite',
      },
    },
  },
  plugins: [],
};
