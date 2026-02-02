# 🍉 Fruit Ninja CV

A browser-based Fruit Ninja clone controlled by **hand tracking** via webcam! Swipe through fruits with your finger - no touch screen required.

![Fruit Ninja CV](https://img.shields.io/badge/Made%20with-❤️-red) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🎮 Play Now

**[Play Live Demo →](https://fruit-ninja-cv.vercel.app)**

## ✨ Features

- 🖐️ **Hand Tracking** - Uses MediaPipe Hands for real-time finger detection
- 🍎 **7 Fruit Types** - Watermelon, orange, apple, banana, strawberry, peach, and more
- 💣 **Bombs** - Avoid slicing bombs or it's game over!
- 🔥 **Combo System** - Chain slices for bonus points
- 🎵 **Sound Effects** - Procedurally generated audio (no external files)
- 📱 **Responsive** - Works on desktop and mobile
- 🎯 **Touch/Mouse Fallback** - Works without camera too

## 🚀 Quick Start

### Play Online
Just visit the live demo link above. Allow camera access and start slicing!

### Run Locally
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/fruit-ninja-cv.git
cd fruit-ninja-cv

# Open in browser (any local server works)
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:8000` in Chrome.

## 🎯 How to Play

1. **Allow camera** when prompted
2. **Position your hand** in view of the webcam
3. **Swipe your index finger** across fruits to slice them
4. **Avoid bombs** - slicing one ends the game
5. **Don't miss fruits** - you have 3 lives

### Controls
- **Hand Gesture**: Swipe finger to slice
- **C Key**: Toggle camera preview
- **M Key**: Mute/unmute sounds
- **Space/Enter**: Start game or restart

## 🛠️ Tech Stack

- **MediaPipe Hands** - Hand detection
- **Canvas 2D** - Rendering
- **Web Audio API** - Sound effects
- **Vanilla JS** - No frameworks

## 📁 Project Structure

```
fruit-ninja-cv/
├── index.html           # Main page
├── css/
│   └── styles.css       # Styling
├── js/
│   ├── main.js          # Game loop
│   ├── handTracking.js  # MediaPipe integration
│   ├── game.js          # Game state
│   ├── fruit.js         # Fruit physics
│   ├── blade.js         # Slice trail
│   ├── particles.js     # Juice effects
│   └── audio.js         # Sound manager
├── vercel.json          # Deployment config
└── README.md
```

## 🌐 Deploy Your Own

### Vercel (Recommended)
1. Fork this repository
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repo
4. Click Deploy
5. Get your live URL!

### Other Options
- **Netlify**: Drag and drop the folder
- **GitHub Pages**: Enable in repo settings

## 📋 Browser Support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Full support |
| Edge | ✅ Full support |
| Firefox | ⚠️ Camera may need permission |
| Safari | ⚠️ Limited MediaPipe support |

## ⚠️ Requirements

- Modern browser with WebGL support
- Webcam (for hand tracking)
- HTTPS connection (for camera access)

## 📄 License

MIT License - Feel free to use and modify!

## 🙏 Credits

- [MediaPipe](https://mediapipe.dev/) - Hand tracking
- Inspired by [Fruit Ninja](https://fruitninja.com/) by Halfbrick Studios
