import './style.css';
import { initialNotes } from './data/notes.js';
import { OrigamiCanvas } from './components/origamiCanvas.js';
import { ScrapbookDOM } from './components/scrapbookDom.js';
import { TimelineNav } from './components/timelineNav.js';
import { audioManager } from './components/audioManager.js';
import { BackgroundMusicPlayer } from './components/musicPlayer.js';
import { SplashScreen } from './components/splashScreen.js';

class App {
  constructor() {
    this.notes = initialNotes;

    // Detect today's target note index (or latest available entry)
    this.todayIndex = this.findTodayIndex();

    // The site always opens initially at Day 1 (index 0)
    this.currentIndex = 0;
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.lastActiveIndex = 0;

    this.isAutoScrolling = false;
    this.autoScrollRaf = null;
    this.isScrolling = false;
    this.lastScrollTime = 0;

    this.container = document.getElementById('app');
    this.init();
  }

  findTodayIndex() {
    if (!this.notes || this.notes.length === 0) return 0;

    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${localYear}-${localMonth}-${localDay}`;

    // 1. Exact date match for today
    const exactIdx = this.notes.findIndex((n) => n.date === todayDateStr);
    if (exactIdx !== -1) return exactIdx;

    // 2. Nearest note on or before today
    let latestPastIdx = -1;
    for (let i = 0; i < this.notes.length; i++) {
      if (this.notes[i].date && this.notes[i].date <= todayDateStr) {
        latestPastIdx = i;
      }
    }
    if (latestPastIdx !== -1) return latestPastIdx;

    // 3. Fallback to latest note
    return Math.max(0, this.notes.length - 1);
  }

  init() {
    // 1. Setup layout structure
    this.container.innerHTML = `
      <!-- Ambient Morning Holy Light Beams -->
      <div class="ambient-morning-light" aria-hidden="true"></div>
      
      <!-- Subtle Paper Grain SVG Filter Overlay -->
      <div class="paper-grain-overlay" aria-hidden="true"></div>

      <!-- 3D Three.js Origami Crane Background Stage -->
      <div id="origami-stage" class="origami-stage" aria-hidden="true"></div>

      <!-- Scrapbook Cards DOM Container -->
      <main id="scrapbook-track" class="scrapbook-track" role="main"></main>

      <!-- Quick Scroll Indicator / Hint (shown only when there is more than 1 page) -->
      ${this.notes.length > 1 ? `
      <div class="scroll-guidance-pill" id="scroll-guidance-pill" aria-hidden="true">
        <span class="guidance-crease">❖</span>
        <span class="guidance-text">Scroll or use keys to unfold days</span>
        <span class="guidance-arrow">↓</span>
      </div>
      ` : ''}
    `;

    // 2. Initialize Three.js Origami Crane Canvas
    const origamiStage = document.getElementById('origami-stage');
    this.origamiCanvas = new OrigamiCanvas(origamiStage);

    // 3. Initialize Background Music Player (waits for splash screen surrender)
    this.musicPlayer = new BackgroundMusicPlayer(this.notes, () => this.currentIndex, false);

    // 4. Initialize Scrapbook DOM Cards
    const scrapbookTrack = document.getElementById('scrapbook-track');
    this.scrapbookDOM = new ScrapbookDOM(scrapbookTrack, this.notes);

    // 5. Initialize Global Navigation & Timeline Ribbon Drawer
    this.timelineNav = new TimelineNav(
      this.notes,
      (targetIndex) => this.scrollToIndex(targetIndex),
      () => this.currentIndex
    );

    // 6. Setup Scroll Engine & Virtual Physics
    this.setupScrollInteractions();

    // 7. Initial render call (renders Day 1 initially)
    this.updatePositions();

    // 8. Launch Splash Screen: "My" -> "Thy Will Be Done" Surrender Interaction
    this.splashScreen = new SplashScreen(() => {
      // Called when user pulls off "My" and bright white light fills the screen
      if (this.musicPlayer) {
        this.musicPlayer.startPlayback();
      }

      // Quick auto scroll from Day 1 to current day note as the white veil opens
      setTimeout(() => {
        this.performAutoScrollToToday();
      }, 350);
    });
  }

  performAutoScrollToToday() {
    const targetIndex = this.findTodayIndex();
    this.todayIndex = targetIndex;

    // If targetIndex is Day 1 (0) or invalid, already in place
    if (targetIndex <= 0 || targetIndex >= this.notes.length) {
      return;
    }

    this.cancelAutoScroll();

    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.scrollProgress = targetIndex;
      this.targetScrollProgress = targetIndex;
      this.updatePositions();
      return;
    }

    this.isAutoScrolling = true;
    const startProgress = 0;
    const distance = targetIndex - startProgress;

    // Snappy, quick duration: ~350ms base + 220ms per day (capped between 650ms and 1500ms)
    const duration = Math.min(1500, Math.max(650, 350 + distance * 220));
    const startTime = performance.now();

    let lastRustleIndex = -1;

    // Smooth cubic easing (gentle start, quick sweep through notes, elegant ease-out into current day)
    const ease = (t) => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const step = (now) => {
      if (!this.isAutoScrolling) return;

      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const current = startProgress + distance * ease(t);

      this.scrollProgress = current;
      this.targetScrollProgress = current;
      this.updatePositions();

      // Tactile paper rustle as notes flip by
      const currentFloor = Math.floor(current);
      if (currentFloor !== lastRustleIndex && currentFloor < targetIndex) {
        lastRustleIndex = currentFloor;
        audioManager.playRustle(1.2);
      }

      if (t < 1) {
        this.autoScrollRaf = requestAnimationFrame(step);
      } else {
        this.isAutoScrolling = false;
        this.scrollProgress = targetIndex;
        this.targetScrollProgress = targetIndex;
        this.updatePositions();
        audioManager.playCrease(0.8);
      }
    };

    this.autoScrollRaf = requestAnimationFrame(step);
  }

  cancelAutoScroll() {
    if (this.isAutoScrolling) {
      this.isAutoScrolling = false;
      if (this.autoScrollRaf) {
        cancelAnimationFrame(this.autoScrollRaf);
        this.autoScrollRaf = null;
      }
      this.targetScrollProgress = this.scrollProgress;
    }
  }

  setupScrollInteractions() {
    let touchStartY = 0;
    let touchMoveY = 0;

    // Wheel listener (smooth normalized scroll)
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cancelAutoScroll();
      audioManager.ensureContext();

      // Normalize delta
      const delta = e.deltaY;
      const step = (delta / 450) * 0.45;

      this.targetScrollProgress = Math.max(0, Math.min(this.notes.length - 1, this.targetScrollProgress + step));

      // Audio feedback on fast scroll
      const velocity = Math.min(Math.abs(delta) / 100, 2.5);
      if (velocity > 0.4) {
        audioManager.playRustle(velocity);
      }
    }, { passive: false });

    // Touch support for mobile / tablets
    window.addEventListener('touchstart', (e) => {
      this.cancelAutoScroll();
      touchStartY = e.touches[0].clientY;
      audioManager.ensureContext();
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      this.cancelAutoScroll();
      touchMoveY = e.touches[0].clientY;
      const deltaY = touchStartY - touchMoveY;
      touchStartY = touchMoveY;

      const step = (deltaY / 300) * 0.55;
      this.targetScrollProgress = Math.max(0, Math.min(this.notes.length - 1, this.targetScrollProgress + step));
      audioManager.playRustle(0.8);
    }, { passive: true });

    // Animation Loop for butter-smooth 60-120fps lerp
    const lerpLoop = () => {
      if (!this.isAutoScrolling) {
        const diff = this.targetScrollProgress - this.scrollProgress;

        if (Math.abs(diff) > 0.0005) {
          this.scrollProgress += diff * 0.12;
          this.updatePositions();
        }
      }

      requestAnimationFrame(lerpLoop);
    };
    requestAnimationFrame(lerpLoop);
  }

  scrollToIndex(index) {
    this.cancelAutoScroll();
    audioManager.ensureContext();
    audioManager.playCrease(0.8);
    this.targetScrollProgress = Math.max(0, Math.min(this.notes.length - 1, index));
  }

  updatePositions() {
    const p = this.scrollProgress;
    const roundedIndex = Math.round(p);

    // Crossing day boundary
    if (roundedIndex !== this.currentIndex) {
      this.currentIndex = roundedIndex;
      audioManager.playCrease(0.5);
      this.timelineNav.updateActive(this.currentIndex);
      if (this.musicPlayer) {
        this.musicPlayer.syncTrackForIndex(this.currentIndex);
      }

      // Hide scroll hint once user started scrolling
      const hint = document.getElementById('scroll-guidance-pill');
      if (hint && this.currentIndex > 0) {
        hint.classList.add('faded');
      }
    }

    // Update Three.js 3D Origami Crane
    if (this.origamiCanvas) {
      const sectionProgress = p % 1;
      this.origamiCanvas.updateScroll(sectionProgress, Math.floor(p));
    }

    // Update Scrapbook DOM cards 3D origami transforms
    if (this.scrapbookDOM) {
      this.notes.forEach((_, i) => {
        const localProgress = p - i; // -1 to 1 relative to viewport center
        this.scrapbookDOM.updateCardTransform(i, localProgress);
      });
    }
  }
}

// Launch app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

