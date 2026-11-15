# Gaining Our Life Back ⏳🌱

> **Social Media Detox Stopwatch & Behavioral Relapse Pattern Tracker**  
> Break free from mindless algorithmic scrolling. Reclaim your focus, sleep, and life with behavioral science instead of guilt.

---

## 💡 The Philosophy: "Detox Laps" Over "Streaks"

Most habit trackers use an unforgiving "streak counter" that resets to zero upon any slip. This triggers the **"What-the-Hell" Effect** (*the Abstinence Violation Effect*), leading users to binge and give up entirely.

**Gaining Our Life Back** reframes digital detox into **"Laps"**:
* **Every hour is permanently banked**: A 36-hour lap followed by a 15-minute scroll is **36 hours of freedom won**, not zero.
* **No judgment, just data**: When you slip, logging a **Relapse Reflection** breaks the subconscious dopamine loop by decoding *when* you failed, *why* you failed, and *how* you felt before vs. after.
* **Urge Surfing before caving**: Neuroscience shows cravings crest and subside within 60–90 seconds. The built-in **Urge Surfer** lifeline lets you ride out cravings before opening an app.

---

## ✨ Features Tour

### ⏱️ 1. Live Detox Stopwatch
* Real-time Days, Hours, Minutes, and Seconds ticker.
* **Personal Best Benchmark**: Dynamically tracks progress against your longest clean streak record (or initial 24h milestone).
* **Backdating Drawer**: Started avoiding social media earlier today or yesterday? Easily adjust your streak start time without losing credit.

### 🌊 2. "Urge Surfing" 90-Second Craving Lifeline
* **Emergency Panic Button**: Tap *"Craving an App Right Now?"* when an impulse strikes.
* **Animated Box-Breathing Ring**: 8-second breathing cycle (*Inhale 3s ➔ Hold 2s ➔ Exhale 3s*) that activates the parasympathetic nervous system.
* **Personalized Reality Check**: Uses your actual logged history:  
  > *"In 75% of your past slips, scrolling left you feeling **Regretful**. Your brain craves dopamine, but your own data proves the feed won't deliver."*
* **3 Tangible Micro-Habits**: Prompting quick replacement actions (drink cold water, stretch, look out a window).
* **Cravings Defeated Tracker**: Increments and celebrates every urge resisted.

### 🧠 3. Relapse Pattern Recognition & Analytics
* **Vulnerability Window (When do you fail?)**: Identifies whether your willpower drops in the *Morning, Afternoon, Evening,* or *Late Night* so you can schedule physical friction.
* **Pre-Relapse Triggers (Why do you fail?)**: Ranks situations that lead to slips (*Boredom, Phone Unlock Muscle Memory, Procrastination, Lying in Bed*).
* **The False Dopamine Promise (Emotional Shift)**: Proves statistically how rarely scrolling makes you feel recharged by comparing feelings *Before* (Bored, Anxious) vs *After* (Guilty, Drained, Numb).

### 🗓️ 4. 30-Day Activity Heatmap & Milestone Badges
* **Consistency Heatmap**: Visual GitHub-style activity grid of the last 30 days showing clean hours per day with color intensity.
* **Achievement Badges**:
  * 🥉 **Day One Hero**: 24 hours clean
  * 🥈 **Dopamine Reset**: 3 days clean (72h)
  * 🥇 **One Week Warrior**: 7 days clean (168h)
  * 💎 **Habit Breaker**: 14 days clean (336h)
  * 👑 **Life Reclaimed**: 30 days clean (720h)

### 📚 5. Tangible "Life Reclaimed" Calculator
Translates abstract hours into real-world living milestones:
* 📖 **Books Read Equivalent** (`~5 hours per 300-page book`)
* 🏃 **Active Workouts / Walks** (`1-hour sessions`)
* 🎯 **Deep Focus Cycles** (`90-min ultradian rhythm blocks`)
* 🛡️ **Total Urges Defeated**

### 💾 6. Dual-Layer Storage & Backup Portability
* **Offline-First Resilience**: Everything is stored in `localStorage` first, then synced to Firebase Firestore when online.
* **Export Options**: Download **CSV Spreadsheet** (for Excel/Google Sheets), **JSON Archive**, or copy a Markdown summary to clipboard.
* **Backup Restoration**: Upload and restore previous JSON archives with automatic conflict merging.

### 📲 7. Installable Progressive Web App (PWA)
* Add directly to your **iPhone or Android Home Screen** via `manifest.json`.
* Instant offline loading through the built-in Service Worker (`sw.js`).
* 1-Click *"Install App"* header button on desktop and Android browsers.

---

## 🚀 Quickstart & Setup

### Option A: Run Locally (Zero Build Tools Required)
1. Clone this repository:
   ```bash
   git clone https://github.com/MEERANSAHIB/gaining-our-life-back.git
   cd gaining-our-life-back
   ```
2. Simply double-click `index.html` to open it in any browser! All dependencies (Tailwind CSS, Google Fonts, Firebase SDK) load seamlessly from CDNs.

---

### Option B: Deploy to GitHub Pages (1-Click)
1. Push this repository to GitHub.
2. Go to **Settings ➔ Pages**.
3. Under **Build and deployment ➔ Branch**, select `main` and root (`/`).
4. Click **Save**. Your site will be live at `https://<your-username>.github.io/gaining-our-life-back/`.

---

## ☁️ Firebase Cloud Sync Configuration

The application is pre-configured with the `gaining-our-life-back` Firebase project. To enable multi-device synchronization and Google Sign-In:

1. **Enable Sign-in Methods** in [Firebase Console](https://console.firebase.google.com/):
   * Go to **Build ➔ Authentication ➔ Sign-in method**.
   * Enable **Google** and **Anonymous** providers.
2. **Publish Firestore Security Rules**:
   * Go to **Build ➔ Firestore Database ➔ Rules**.
   * Paste the following rules and click **Publish**:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /artifacts/{appId}/users/{userId}/{document=**} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
3. **Whitelist Your Live Domain**:
   * In **Authentication ➔ Settings ➔ Authorized domains**, add your hosted domain (e.g. `yourname.github.io` or `localhost`).

---

## 🛠️ Tech Stack
* **Core**: Vanilla HTML5, Modern ES Modules JavaScript
* **Styling**: Tailwind CSS (CDN) + Inter & JetBrains Mono typography
* **Cloud & Auth**: Google Firebase JS SDK v11.6.1 (Firebase Auth + Cloud Firestore)
* **PWA**: Web App Manifest (`manifest.json`) + Service Worker (`sw.js`)

---

## 📄 License
MIT License. Built for anyone seeking to gain their life, focus, and peace of mind back.
