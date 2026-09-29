# Electron Desktop Development Guide

## Purpose

This document records the current status of the Electron desktop version of **Football Highlight Editor**, explains what has already been completed, lists the next planned desktop tasks, and provides the commands needed to build and run the application.

The goal is to make it easy to return to the desktop work later without having to reconstruct the architecture or remember which steps were already completed.

## Current Desktop Goal

Original web flow:

```text
React
  ↓
HTTP upload
  ↓
Express + Multer
  ↓
Temporary uploaded video
  ↓
FFmpeg
```

Current Electron flow:

```text
React UI
  ↓
Electron preload bridge
  ↓
IPC
  ↓
Electron main process
  ↓
Existing highlightService
  ↓
FFmpeg
  ↓
Saved highlight
```

The main benefit is that large videos no longer need to be uploaded or copied through the Express server before FFmpeg processes them.

# Desktop Progress

## Phase 2A — Electron Shell — COMPLETE

Completed:

- Installed Electron.
- Added `electron/main.ts`.
- Added `electron/tsconfig.json`.
- Added Electron build scripts to the root `package.json`.
- Added `dist-electron/` to `.gitignore`.
- Electron can create a desktop `BrowserWindow`.
- Electron loads the React production build from `frontend/dist`.
- Added `base: "./"` to Vite so built frontend assets work with `file://` paths.

Build output:

```text
electron/main.ts
      ↓
TypeScript build
      ↓
dist-electron/main.js
```

## Phase 2B — Preload + IPC Bridge — COMPLETE

Completed:

- Added `electron/preload.ts`.
- Enabled the preload script in `BrowserWindow`.
- Kept `contextIsolation: true` and `nodeIntegration: false`.
- React communicates with privileged Electron functionality through a controlled API.
- Added TypeScript declarations in `frontend/src/electron.d.ts`.

Architecture:

```text
React Renderer
     ↓
window.electronAPI
     ↓
preload.ts
     ↓
ipcRenderer
     ↓
ipcMain
     ↓
Electron Main
```

## Phase 2C — Native Video Picker — COMPLETE

Completed:

- Added a native Electron file picker using `dialog.showOpenDialog`.
- Supported extensions: `.mp4`, `.mov`, `.mkv`, `.webm`.
- Electron returns:

```ts
{
  filePath: string;
  fileName: string;
  fileUrl: string;
}
```

Purpose:

```text
filePath → used by FFmpeg
fileName → displayed in the UI
fileUrl  → used for local preview
```

- React stores the selected desktop video path.
- Original video preview works in Electron.
- Video duration is read from `<video>` metadata.
- The web `<input type="file">` flow is still preserved.

Important validation fix: when the same desktop video is selected again, do not unnecessarily reset `videoDuration` to `null` if the source URL has not changed.

## Phase 2D — Direct Local FFmpeg Processing — COMPLETE

Completed:

- Added Electron IPC API for creating highlights.
- React sends `videoPath` and `segments` to Electron.
- Electron main reuses the existing compiled backend service:

```text
dist/services/highlightService.js
```

- FFmpeg reads the original local video directly from disk.
- Desktop processing no longer requires HTTP upload, Multer, copying the source into `input/`, or `MAX_UPLOAD_MB`.
- The original source video is never deleted.
- Temporary clip workspace cleanup still runs after processing.

## Phase 2E — Native Save Flow — COMPLETE

Completed:

- Added `dialog.showSaveDialog`.
- Added `selectSaveLocation()` to the Electron bridge.
- User can choose the final destination and filename.
- FFmpeg writes the final highlight directly to that output path.
- If `.mp4` is omitted, the app can append it.
- The app prevents overwriting the original source video.
- Canceling Save As does not run FFmpeg and does not produce an error.

Current user flow:

```text
Choose File
   ↓
Select local video
   ↓
Preview video
   ↓
Enter segments
   ↓
Create Highlight
   ↓
Save As...
   ↓
Choose destination
   ↓
FFmpeg creates highlight
   ↓
Preview result
```

## Phase 2F — Minimal Processing Feedback + Error Handling — COMPLETE

This phase was intentionally kept small so development can move to AI.

Completed:

- `isProcessing` is used while FFmpeg runs.
- Create button is disabled while processing.
- Button text changes while processing.
- Errors are displayed in the UI.
- Success message is displayed after highlight creation.
- `finally` resets `isProcessing`.
- Invalid timestamps are caught before FFmpeg starts.
- Canceling Save As exits cleanly.
- Desktop state is reset when starting a new highlight.

Deferred:

- detailed progress percentages
- progress bar
- per-segment progress events
- FFmpeg progress parsing
- advanced error classification

# Current Electron Files

```text
electron/
├── main.ts
├── preload.ts
└── tsconfig.json
```

Frontend Electron typing:

```text
frontend/src/electron.d.ts
```

Relevant frontend files:

```text
frontend/src/App.tsx
frontend/src/App.css
frontend/vite.config.ts
```

Shared processing services:

```text
src/services/videoService.ts
src/services/highlightService.ts
src/validators/segmentValidator.ts
src/utils/time.ts
```

# Current Timestamp Behavior

Current format:

```text
M:SS
```

Examples:

```text
0:20
15:30
70:20
93:30
```

Minutes may exceed `59`. `H:MM:SS` support is intentionally deferred.

# Prerequisites

Current desktop development requires:

- Node.js
- npm
- FFmpeg
- ffprobe

Verify:

```powershell
node --version
npm --version
ffmpeg -version
ffprobe -version
```

FFmpeg is **not bundled yet**.

# First-Time Setup

From the project root:

```powershell
npm install
```

Install frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

If needed:

```powershell
Copy-Item .env.example .env
```

# Build the Entire Application

From the project root:

```powershell
npm run build
```

This runs:

```text
build:backend
      ↓
build:frontend
      ↓
build:electron
```

Expected Electron output:

```text
dist-electron/
├── main.js
└── preload.js
```

# Run the Electron Desktop App

After building:

```powershell
npm run electron
```

Electron loads:

```text
frontend/dist/index.html
```

For the current workflow, after Electron or frontend changes:

```powershell
npm run build
npm run electron
```

# Run the Web Version

Build:

```powershell
npm run build
```

Start Express:

```powershell
npm start
```

Open:

```text
http://localhost:3000
```

For Vite development:

Terminal 1:

```powershell
npm run build:backend
npm start
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

# Run Tests

From project root:

```powershell
npm test
```

Recommended checks before a major commit:

```powershell
npm test
npm run build
```

# Git Workflow

Desktop work currently uses:

```text
feature/desktop-app
```

Typical commands:

```powershell
git status
git add .
git commit -m "your commit message"
git push
```

`dist-electron/` should remain ignored.

# Known Current Limitations

## 1. FFmpeg must be installed separately

The current app calls system FFmpeg. If FFmpeg is not in PATH, processing fails.

## 2. No packaged Windows installer yet

The app currently runs with:

```powershell
npm run electron
```

## 3. Timestamp format is still M:SS

`H:MM:SS` is deferred.

## 4. Processing progress is basic

No detailed per-segment or percentage progress yet.

## 5. Electron Content Security Policy warning may appear in development

This should be addressed before final packaging.

## 6. Web-only backend code still exists

Express, Multer, web upload, and related code remain because the web version is still preserved.

# Planned Desktop Work After AI Development

## Phase 2G — Desktop Architecture Cleanup

Possible tasks:

- Decide whether the final product still needs the web server.
- Separate desktop-only and web-only responsibilities more clearly.
- Remove obsolete web upload code only if the web version is no longer needed.
- Clean up temporary/output behavior.
- Refactor shared types.

## Phase 2H — Package as a Windows Application

Goal:

```text
VideoHighlightEditor-Setup.exe
```

Likely packaging tool:

- electron-builder

Tasks:

- application name
- icon
- package metadata
- Windows installer
- production resource paths
- clean-machine testing

## Phase 2I — Bundle FFmpeg

Goal: the user should **not need to install FFmpeg manually**.

Desired experience:

```text
Download installer
      ↓
Install app
      ↓
Open app
      ↓
Choose video
      ↓
Create highlight
```

The package should include FFmpeg/ffprobe and resolve their paths internally.

Licensing and redistribution requirements should be reviewed before distribution.

## Phase 2J — Desktop MVP Complete

Desktop MVP is complete when a normal user can:

```text
Install application
      ↓
Open application
      ↓
Choose local video
      ↓
Preview video
      ↓
Enter highlight segments
      ↓
Choose output location
      ↓
Create highlight
      ↓
Use saved video
```

without:

- installing Node.js
- running terminal commands
- installing FFmpeg separately
- manually configuring environment variables

# Deferred Improvements

- `H:MM:SS` timestamp support
- detailed processing progress
- progress bar
- improved UI/UX
- keyboard shortcuts
- drag-and-drop input
- recent files
- better error categories
- automatic updates
- packaged application logs

# Current Checkpoint

```text
Manual Web Highlight MVP       ✅
Electron shell                 ✅
Secure preload / IPC bridge    ✅
Native local video picker      ✅
Direct local FFmpeg processing ✅
Native Save As flow            ✅
Basic processing feedback      ✅

Windows installer              ⏳
Bundled FFmpeg                 ⏳
Desktop architecture cleanup   ⏳
Detailed progress UI           deferred
H:MM:SS                        deferred

Next major focus:
AI highlight generation
```
