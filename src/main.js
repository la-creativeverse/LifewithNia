import './style.css';
import { initialNotes } from './data/notes.js';
import { OrigamiCanvas } from './components/origamiCanvas.js';
import { ScrapbookDOM } from './components/scrapbookDom.js';
import { TimelineNav } from './components/timelineNav.js';
import { audioManager } from './components/audioManager.js';
import { BackgroundMusicPlayer } from './components/musicPlayer.js';

class App {
  constructor() {
    this.notes = initialNotes;

    // Automatically detect today's date and naturally open to today's note
    const todayIndex = this.findTodayIndex();
    this.currentIndex = todayIndex;
    this.scrollProgress = todayIndex;
    this.targetScrollProgress = todayIndex;
    this.lastActiveIndex = todayIndex;

    this.isScrolling = false;
    this.lastScrollTime = 0;

    this.container = document.getElementById('app');
    this.init();
  }

  findTodayIndex() {
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${localYear}-${localMonth}-${localDay}`;

    const idx = this.notes.findIndex((n) => n.date === todayDateStr);
    return idx !== -1 ? idx : 0;
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

    // 3. Initialize Background Music Player
    this.musicPlayer = new BackgroundMusicPlayer(this.notes, () => this.currentIndex);

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

    // Initial render call
    this.updatePositions();
  }

  setupScrollInteractions() {
    let touchStartY = 0;
    let touchMoveY = 0;

    // Wheel listener (smooth normalized scroll)
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
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
      touchStartY = e.touches[0].clientY;
      audioManager.ensureContext();
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      touchMoveY = e.touches[0].clientY;
      const deltaY = touchStartY - touchMoveY;
      touchStartY = touchMoveY;

      const step = (deltaY / 300) * 0.55;
      this.targetScrollProgress = Math.max(0, Math.min(this.notes.length - 1, this.targetScrollProgress + step));
      audioManager.playRustle(0.8);
    }, { passive: true });

    // Animation Loop for butter-smooth 60-120fps lerp
    const lerpLoop = () => {
      const diff = this.targetScrollProgress - this.scrollProgress;

      if (Math.abs(diff) > 0.0005) {
        this.scrollProgress += diff * 0.12;
        this.updatePositions();
      }

      requestAnimationFrame(lerpLoop);
    };
    requestAnimationFrame(lerpLoop);
  }

  scrollToIndex(index) {
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

