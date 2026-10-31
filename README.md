# Thy Will Be Done · Daily Scrapbook Journal

A minimal, scroll-based website where each screen represents one passing day, connected through a **Multi-facet 3D Origami Crane Fold transition**, scrapbook aesthetics, and mild Christian elements celebrating surrender and grace (*Fiat Voluntas Tua*).

---

## 🕊 Features

- **Multi-facet Origami Crane Fold Transitions**:
  - Each day exists as a textured scrapbook paper sheet.
  - As you scroll, the sheet creases along 3D diagonal origami folds, lifting and morphing while an authentic Three.js 3D Origami Crane takes flight with dynamic wing strokes and golden sacred dust motes.
  - The incoming day unfolds from a compact folded packet into a pristine sheet.
- **Scrapbook Design Language**:
  - Cotton rag paper texture with deckle edges.
  - Semi-translucent washi tape strips holding each day's card with natural angles.
  - Interactive **Embossed Wax Seal / YouTube Stamp**: links to each day's YouTube video reflection or hymn, featuring an embossed golden play button centered directly on the stamp, and a clean text-only floating `WATCH` cue.
  - Handwritten captions in the margin.
  - Beautiful editorial typography: *Cinzel*, *Cormorant Garamond*, and *Caveat*.
- **Daily Content & Dates**:
  - **Timeline Date**: e.g., `DAY 01 · October 31, 2026`, aligned cleanly to the top-right of the card.
  - **The Note in the Middle**: Centered reflection with decorative drop cap.
  - **Scripture Whisper**: Subtle Christian element at the foot of each note with a delicate Latin cross divider.
- **Daily Background Song Playback**:
  - Each day has its own song loaded via YouTube or direct audio link (`.mp3`).
  - Automatically begins playback on site opening, with an option to pause/play as needed.
  - Sits at the **bottom-right corner inline with the day navigation line**, showing the song title, artist, live audio equalizer waves, play/pause controls, and an external link `↗` to open the song on YouTube.
- **YouTube Stamp on Card**:
  - Clicking the **Stamp** on any card opens the video on YouTube in a new tab, marked with the clean text tag `WATCH`.
- **Global Navigation**:
  - Top header navigation bar with Day Counter (`Day 1 of 7`) and **"Today"** quick jump button.
  - Slide-out **Origami Timeline Drawer**: lists all dates, day numbers, titles, and verse snippets with real-time search.
  - Bottom interactive **Timeline Scrubber**: click or scrub through all dates.
  - Keyboard navigation (`ArrowDown`, `ArrowUp`, `PageDown`, `PageUp`, `Home`, `End`).
- **Tactile Paper Audio**:
  - Procedural Web Audio API synthesizer generating organic paper creases, page turns, and rustles on scroll.
  - Soft chime on date navigation and stamp interaction.

---

## 📁 How to Update Daily Notes

All notes are stored in and edited directly in:
```
src/data/notes.js
```

Each note has this simple, clean format:
```javascript
{
  id: "day-1",
  dayNumber: 1,
  date: "2026-10-30",
  dayOfWeek: "Saturday",
  timelineDate: "October 31, 2026",
  title: "Do Not be Afraid",
  note: "Your personal reflection note goes here...",
  scripture: "“Thy kingdom come, Thy will be done...” — Matthew 6:10",

  // Background Song (plays in the bottom-right song player card)
  songUrl: "https://www.youtube.com/watch?v=0k1WhFtVp0o",
  songTitle: "Peace Like a River · Contemplative Piano",

  // Reflection Video (opened by the wax stamp on the note card)
  videoUrl: "https://www.youtube.com/watch?v=0k1WhFtVp0o",
  videoTitle: "Morning Reflection & Prayer",

  caption: "Morning silence & open hands",
  tapeColor: "washi-gold", // 'washi-gold' | 'washi-linen' | 'washi-sage' | 'washi-kraft'
  tapeAngle: -2.5
}
```

---

## 🚀 Running the Project

```bash
# Start local development server
npm run dev

# Or build for production
npm run build
npm run preview
```

