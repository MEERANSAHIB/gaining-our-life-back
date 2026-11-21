# Gaining Our Life Back ⏳🌱

> **Social Media Detox Stopwatch & Behavioral Relapse Pattern Tracker**  
> Break free from mindless algorithmic scrolling. Reclaim your focus, sleep, and life with self-observation instead of guilt.

---

## 💡 The Philosophy: "Detox Laps" Over "Streaks"

Most habit trackers use an unforgiving "streak counter" that resets to zero upon any slip. This can trigger the **Abstinence Violation Effect** (Marlatt & Gordon), the "what-the-hell" feeling that turns one slip into a full binge and then quitting.

**Gaining Our Life Back** reframes digital detox into **"Laps"**:
* **Every hour is permanently banked**: A 36-hour lap followed by a 15-minute scroll is **36 hours of freedom won**, not zero.
* **No judgment, just data**: When you slip, logging a **Relapse Reflection** helps you notice *when* you failed, *why* you failed, and *how* you felt before vs. after.
* **Urge Surfing before caving**: Urges tend to rise, peak, and fade if you ride them out instead of acting on them. The built-in **Urge Surfer** gives you a guided 90-second pause (slow breathing plus a reality check from your own log) before you open an app.

---

## ✨ Features Tour

### ⏱️ 1. Live Detox Stopwatch
* Real-time Days, Hours, Minutes, and Seconds ticker.
* **Personal Best Benchmark**: Tracks progress against your longest lap (or an initial 24h milestone).
* **Backdating Drawer**: Started avoiding social media earlier today or yesterday? Adjust your streak start time without losing credit.

### 🌊 2. "Urge Surfing" 90-Second Lifeline
* **Emergency button**: Tap *"Having an urge? Ride the 90-second Wave"* when an impulse strikes.
* **Animated breathing ring**: 8-second cycle (*Inhale 3s ➔ Hold 2s ➔ Exhale 3s*).
* **Personalized reality check** built from your actual log, for example:  
  > *"In 75% of your past relapses, scrolling left you feeling **Regretful**."*
* **3 micro-habits** to do while the wave passes (cold water, stretch, look out a window).
* **Urges Surfed counter**.

### 🧠 3. Relapse Pattern Recognition & Analytics
* **Vulnerability Window**: Shows whether slips cluster in the *Morning, Afternoon, Evening,* or *Late Night*.
* **Pre-Relapse Triggers**: Ranks the situations that lead to slips (*Boredom, Phone Unlock Muscle Memory, Procrastination, In Bed*).
* **Emotional Shift**: Compares how you felt *before* vs. *after*, so you can see from your own data how often scrolling failed to deliver relief.
* The relapse form pre-selects nothing, so the numbers reflect what you actually chose.

### 🗓️ 4. 30-Day Activity Heatmap & Milestone Badges
* **Consistency Heatmap**: GitHub-style grid of the last 30 days showing clean hours per day.
* **Milestone badges** (based on your longest single clean streak):
  * 🥉 **Day One Hero**: 24 hours
  * 🥈 **Three-Day Reset**: 72 hours
  * 🥇 **One Week Warrior**: 168 hours
  * 💎 **Habit Breaker**: 336 hours
  * 👑 **Life Reclaimed**: 720 hours

### 📚 5. "Time Reclaimed" Calculator
Translates total clean hours into rough real-world equivalents:
* 📖 **Books read** (about 5 hours per 300-page book)
* 🏃 **Workouts / walks** (1-hour sessions)
* 🎯 **Deep focus blocks** (90 minutes each)
* 🛡️ **Urges surfed**

### 💾 6. Dual-Layer Storage & Backup Portability
* **Local first**: Everything is stored in `localStorage`, then synced to Firebase Firestore when it can connect. If Firebase fails to load, the stopwatch, journal, and analytics still work locally.
* **Export**: **CSV** (Excel/Google Sheets), **JSON** archive, or a text summary copied to the clipboard.
* **Restore**: Upload a previous JSON archive. Duplicate laps are skipped and every imported field is validated.

### 📲 7. Installable Progressive Web App (PWA)
* Add to your **iPhone or Android Home Screen** via `manifest.json`.
* A service worker (`sw.js`) caches the app shell, stylesheet and fonts for offline use.
* One-click *"Install App"* button on desktop and Android browsers.

---

## 🚀 Quickstart & Setup

### Option A: Run Locally
ES modules and service workers do not work from `file://` in most browsers, so serve the folder over HTTP:
```bash
git clone https://github.com/MEERANSAHIB/gaining-our-life-back.git
cd gaining-our-life-back
python3 -m http.server 8000
```
Then open `http://localhost:8000`. Styles and fonts are bundled in the repo; only Firebase loads from gstatic, and only when available.

To change the design, edit `css/input.css` or `tailwind.config.js`, then run `npm install` and `npm run build:css` to regenerate `css/app.css` (commit the result).

### Option B: Deploy to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings ➔ Pages**.
3. Under **Build and deployment ➔ Branch**, select `main` and root (`/`).
4. Click **Save**. Your site will be live at `https://<your-username>.github.io/gaining-our-life-back/`.

---

## ☁️ Firebase Cloud Sync Configuration

The app is configured for the `gaining-our-life-back` Firebase project. To use your own project, replace the config in `js/constants.js`. Firebase web API keys are not secrets, so your **security rules are what protect the data**.

1. **Enable sign-in methods** in the [Firebase Console](https://console.firebase.google.com/): **Build ➔ Authentication ➔ Sign-in method ➔ Google** and **Anonymous**.
2. **Publish Firestore rules** (**Build ➔ Firestore Database ➔ Rules**). These restrict each user to their own data and validate field names, types, and sizes:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /artifacts/{appId}/users/{userId} {
         function isOwner() {
           return request.auth != null && request.auth.uid == userId;
         }
         function shortStr(v, n) {
           return v is string && v.size() <= n;
         }

         match /detox_state/active_timer {
           allow read, delete: if isOwner();
           allow create, update: if isOwner()
             && request.resource.data.keys().hasOnly([
               'isRunning', 'currentLapStartTime', 'accumulatedMs',
               'streakInitialStartTime', 'urgesDefeated', 'updatedAt'])
             && request.resource.data.isRunning is bool
             && request.resource.data.accumulatedMs is number
             && request.resource.data.urgesDefeated is number;
         }

         match /detox_laps/{lapId} {
           allow read, delete: if isOwner();
           allow create, update: if isOwner()
             && request.resource.data.keys().hasOnly([
               'durationMs', 'hoursAvoided', 'startedAtMs', 'relapsedAtMs',
               'timeOfDayBucket', 'platform', 'triggers', 'whatHappenedBefore',
               'feelingBefore', 'feelingBeforeNote', 'feelingAfter',
               'feelingAfterNote', 'relapseDuration', 'nextTimePlan'])
             && request.resource.data.durationMs is number
             && request.resource.data.relapsedAtMs is number
             && shortStr(request.resource.data.platform, 100)
             && request.resource.data.triggers is list
             && request.resource.data.triggers.size() <= 12
             && shortStr(request.resource.data.whatHappenedBefore, 500)
             && shortStr(request.resource.data.feelingBeforeNote, 500)
             && shortStr(request.resource.data.feelingAfterNote, 500)
             && shortStr(request.resource.data.nextTimePlan, 500);
         }
       }
     }
   }
   ```
   Test them in the console's **Rules Playground** before publishing. If you add a field in the app, add it to the `hasOnly` list too.
3. **Authorize your domain** under **Authentication ➔ Settings ➔ Authorized domains** (for example `yourname.github.io`). `localhost` is authorized by default.
4. *(Recommended)* Turn on **Firebase App Check** to limit abuse of your public API key.

---

## 🛠️ Tech Stack & Architecture

```text
gaining-our-life-back/
├── css/
│   ├── input.css           # Design tokens per time of day + component classes (source)
│   └── app.css             # Built stylesheet (Tailwind CLI, committed)
├── fonts/                  # Archivo (numerals, headings) and Instrument Sans (body), self-hosted
├── js/
│   ├── theme.js            # Time-of-day theme (morning / afternoon / evening / night, with manual override)
│   ├── constants.js        # Firebase config, storage keys, option lists, formatting utilities
│   ├── storage.js          # LocalStorage, CSV/JSON export, sample data
│   ├── analytics.js        # Vulnerability window, triggers, emotional shift, heatmap, milestones
│   ├── urgeSurfer.js       # 90-second session, breathing cues, reality check
│   └── app.js              # Orchestrator: tabs, stopwatch, relapse form, import, lazy-loaded Firebase sync
├── index.html              # 3-tab interface (Today, Patterns, Journal)
├── manifest.json           # Web App Manifest
├── sw.js                   # Service worker (app shell cache)
├── icon.svg                # App icon
├── LICENSE                 # MIT
└── README.md
```

* **Core**: Vanilla HTML5 and JavaScript; the only build step is the CSS
* **Styling**: Tailwind CSS 3 built locally, colours as CSS variables that change with the hour of day; Archivo and Instrument Sans, self-hosted
* **Design**: the app takes its tint from the clock. Gold means time banked, blue means urges, red means slips and nothing else
* **Cloud & Auth**: Firebase JS SDK v11.6.1 (Auth + Firestore), loaded on demand
* **PWA**: Web App Manifest and service worker

---

## ⚠️ Known Limitations

* `css/app.css` is generated; rebuild it after changing classes in `index.html` or `js/*.js`.
* Anonymous sessions are tied to the browser. Sign in with Google to keep your data across devices, and export a JSON backup regularly.
* There is no automated test suite yet.
* The "Time Reclaimed" and milestone figures are motivational estimates, not clinical measures.

---

## 📄 License
MIT License. See [LICENSE](LICENSE).
