# ⚡ TaskPulse - Laptop Task & Change Tracker

An ultra-lightweight, high-speed task adder, completer, and changelog tracker built specifically for laptop development.

> **Total App Size: ~30 Kilobytes** (99.9% smaller than typical 150MB Electron or 40MB Flutter desktop apps, with zero npm dependencies).

---

## 🌐 Live Cloud Deployments

| Provider | Status / 1-Click Deploy |
| :--- | :--- |
| **GitHub Pages** | [asho1085.github.io/taskpulse-app](https://asho1085.github.io/taskpulse-app/) |
| **Render (Node.js)** | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/asho1085/taskpulse-app) |
| **Railway (Node.js)** | [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/asho1085/taskpulse-app) |
| **Vercel** | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/asho1085/taskpulse-app) |

---

## 🚀 How to Run Locally

You have three simple ways to run the app:

### 1. One-Click Native Desktop App (Recommended)
Double-click **`Launch-App.bat`** (or **`Launch-Silent.vbs`** for zero console flash).
- Launches TaskPulse in a dedicated, distraction-free desktop window (using native Windows Edge/Chrome App Mode).
- No browser address bar, no tabs — feels and behaves like a standalone native desktop app.
- Automatically launches the zero-dependency local server to sync changes directly with `data/tasks.json`.

### 2. Double-Click HTML (Offline Standalone)
Double-click **`index.html`** directly in any browser.
- Runs 100% offline with zero server required.
- Saves all your changes in browser `localStorage`.
- Includes 1-click **Export JSON** and **Import JSON** buttons for backups.

### 3. Node.js Terminal
```bash
npm start
# or
node server.js
```
Then visit: `http://127.0.0.1:4321`

---

## ✨ Features

- **Organize by App Name**:
  - Switch between apps with 1-click pills (`All Apps`, `TaskLaptop`, `MobileStoreApp`, etc.).
  - View completion progress and pending change counts per app.
  - Add, rename, or delete apps anytime.
- **Fast Change Adder**:
  - **Quick Add Bar**: Type what you want to change, select app & type, and hit `Enter`.
  - **Detailed Modal (`+ New Change`)**: Add notes, acceptance criteria, milestone version (e.g. `v1.2.0`), priority (`Urgent`, `High`, `Medium`, `Low`), and category.
  - Change categories: `🚀 Feature`, `🐛 Bug Fix`, `🎨 UI / UX`, `⚡ Performance`, `🛠️ Refactor`, `📝 Chore`.
- **Task Completer & Workflow**:
  - 1-click checkmark toggle with celebratory confetti particles and audio feedback.
  - Filter tabs: `All Changes`, `⏳ Pending`, `✅ Completed`.
  - Search bar (`Ctrl+F`) for instant real-time filtering across titles, notes, and versions.
- **Changelog Generator**:
  - Automatically compiles all completed changes for an app into a formatted Markdown document (`CHANGELOG.md`).
  - 1-click **Copy to Clipboard** or **Save directly to laptop disk**.
- **Dark & Light Modes**:
  - Clean GitHub-inspired dark developer UI by default with high contrast and smooth animations.
  - 1-click toggle to light mode.
- **Laptop Keyboard Shortcuts**:
  - `Ctrl + N`: Focus quick change input
  - `Ctrl + F`: Focus instant search bar
  - `Escape`: Close any open modal

---

## 📁 File Structure

```
c:\projects\TaskLaptop\
├── index.html          # Complete Single-Page Application (HTML + CSS + JS) (~25 KB)
├── server.js           # Zero-dependency local Node.js server (~3 KB)
├── data\
│   └── tasks.json      # Local persistent storage of all apps & changes
├── Launch-App.bat      # 1-click Windows native desktop launcher
├── Launch-Silent.vbs   # Silent launcher (no black CMD prompt)
├── package.json        # Metadata and npm scripts
└── README.md           # Documentation
```
