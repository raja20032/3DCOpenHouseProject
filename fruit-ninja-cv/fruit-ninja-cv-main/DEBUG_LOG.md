# Fruit Ninja CV - Debug Log

## Session: 2026-01-22

---

### Issue #1: Camera Panel Glitching & START GAME Not Clickable ✅ FIXED

**Problem Identified:**
- The `CameraFeed` component was using a broken ref callback pattern
- Video element was being recreated on every render
- The `showCamera` dependency in useEffect caused re-initialization of MediaPipe
- Hidden video element wasn't properly detached from DOM

**Root Cause:**
1. Setting `el.srcObject = videoRef.current.srcObject` in a ref callback creates infinite updates
2. The useEffect had `showCamera` as a dependency, causing camera re-init on toggle
3. `h-30` is invalid Tailwind (should be `h-[7.5rem]`)
4. Video element wasn't appended to DOM properly for MediaPipe

**Solution Applied:**
1. Created stable initialization with `initStartedRef` to prevent re-init
2. Separated display video from tracking video - tracking video hidden off-screen
3. Used proper `useEffect` for stream cloning instead of ref callbacks  
4. Added `cameraReady` state to track when stream is available
5. Fixed styling with inline styles for precise dimensions
6. Added loading spinner for camera preview

**Result:** Camera toggle works, START GAME button is clickable, no more glitching!

---

## Research Summary

### GitHub Repository: raja20032/3DCOpenHouseProject
**What it is:** A Python/TensorFlow project for controlling games with hand gestures
**What it does:** Maps camera gestures → keyboard inputs for Mario, Dinosaur, Temple Run, Car Racing
**NOT for this project because:**
- Requires Python backend (Flask)
- Uses TensorFlow (heavy)
- Designed for desktop games, not web
- Cannot deploy to Vercel as static site

### Better Open-Source Resources Found:

| Project | Tech | Assets | Use For |
|---------|------|--------|---------|
| `verma-anushka/Fruit-Ninja` | p5.js | images + sounds | Complete reference |
| `jaredly/fruit-ninja-assets` | Sprites only | Full sprite set | Authentic visuals |
| `thepmsquare/fruit-ninja` | Vanilla JS | audio + fonts | Sound effects |
| `mohamedamine99/Ninja-Fruit-Like-Game` | MediaPipe + Python | CV logic | Hand tracking ref |

---

## A-Z Guide: Creating Fruit Ninja CV

### 1. Architecture Options

**Option A: Pure Browser (Current - Recommended for Vercel)**
```
Frontend Only → MediaPipe JS → Canvas → Deploy to Vercel
- No backend needed
- No database needed
- Works on any HTTPS URL
- Camera runs client-side
```

**Option B: Python Backend (Like 3DCOpenHouseProject)**
```
Python + OpenCV + TensorFlow → Flask → Cannot deploy to Vercel easily
- Requires server (Heroku, Railway, etc.)
- More processing power
- More complex setup
```

### 2. Deployment Guide

**Vercel (Best for this project):**
1. Push code to GitHub (use "Export to GitHub" in Lovable)
2. Go to vercel.com → Import project
3. Framework: Vite
4. Deploy → Get shareable URL

**Why no database needed:**
- High scores stored in localStorage (browser)
- No user accounts
- No multiplayer
- All game logic runs client-side

**When you'd need a database:**
- Global leaderboards
- User accounts
- Multiplayer
- Cloud save

### 3. Asset Sources (Legal)

| Asset Type | Source | License |
|------------|--------|---------|
| Fruit sprites | AI-generated (current) | Original |
| Sounds | freesound.org | CC0/CC-BY |
| Fonts | Google Fonts | Open |
| Background | AI-generated | Original |

### 4. Code Quality Notes

The code is written to be:
- Human-readable with clear variable names
- Modular (separate files for each concern)
- Well-commented where logic is complex
- Following React best practices

---

## Lessons Learned

1. **MediaPipe initialization:** Only initialize once, track with ref
2. **Video streams:** Can be cloned to multiple video elements
3. **Canvas performance:** Use requestAnimationFrame, not setInterval
4. **Touch events:** Need `passive: true` for smooth scrolling prevention

---

## What Would Fruit Ninja Creator Want?
- Instant playability (no setup)
- Smooth 60fps animations
- Satisfying slice feedback
- Progressive difficulty
- "One more game" addiction loop

## What Would NVIDIA CEO Do?
- Optimize for GPU (Canvas/WebGL)
- Parallel processing where possible
- Efficient memory management
- Focus on user experience over technical perfection
