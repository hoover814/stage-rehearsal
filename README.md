# 🎭 Shrek Rehearsal Studio

An interactive script rehearsal app for **Shrek the Musical KIDS**. Your daughter can choose her role, and the app will read all the other parts aloud — pausing at the right moment so she can say her own lines.

## Features

- **Choose your role** — Pick any character from the full cast list
- **Scene selection** — Rehearse one scene at a time, or run the full show
- **Text-to-speech** — The app reads all other characters' lines aloud
- **Your line pause** — A countdown timer gives her time to say her lines (adjustable from 3–20 seconds)
- **Full script view** — Toggle the complete script and click any line to jump to it
- **Stage directions** — Displayed clearly so she knows what's happening on stage
- **Scene jump sidebar** — Quickly skip between scenes during full-show rehearsal

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)

### Install & Run

```bash
# Install dependencies
npm install

# Start the app
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `build/` folder that you can deploy to any static host (GitHub Pages, Netlify, Vercel, etc.).

## How to Use

1. **Pick your role** — Search or scroll to find your character, then click it
2. **Choose a scene** — Scenes where your character appears are highlighted with your line count
3. **Start rehearsing** — Hit ▶ Start Rehearsal
   - Other characters' lines are read aloud by the app
   - When it's your turn, a **gold countdown timer** appears
   - Say your line, then the app continues automatically
4. **Adjust the pause** — Use the slider in the header to give yourself more or less time for your lines
5. **Navigate** — Use ⏮ / ⏭ to skip back/forward one line, or click any line in the full script view

## Deploying to GitHub Pages

1. Add `"homepage": "https://YOUR-USERNAME.github.io/shrek-rehearsal-app"` to `package.json`
2. Install gh-pages: `npm install --save-dev gh-pages`
3. Add to `package.json` scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```
4. Run: `npm run deploy`

## Tech Stack

- **React 18** — UI framework
- **Web Speech API** — Built-in browser text-to-speech (no API key needed)
- **CSS3** — Custom animations and swamp-themed design
- **No external dependencies** beyond React

## Script Coverage

All 8 scenes from Shrek the Musical KIDS are included:

| Scene | Title |
|-------|-------|
| 1 | The Ogre's Bog – Shrek's Childhood |
| 2 | Shrek's Swamp – The Fairy-Tale Creatures Arrive |
| 3 | On the Road – Shrek Meets Donkey |
| 4 | Duloc – Lord Farquaad's Kingdom |
| 5 | Fiona's Tower – The Princess Waits |
| 6 | The Dragon's Keep & Fiona's Tower |
| 7 | The Next Morning – Feelings & Freak Flag |
| 8 | Duloc Cathedral – The Wedding & True Love |

---

*Built with ❤️ for a star performer. Break a leg! 🌟*
