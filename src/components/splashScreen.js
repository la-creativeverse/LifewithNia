import { audioManager } from './audioManager.js';

export class SplashScreen {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.container = null;
    this.peelNote = null;
    this.isDragging = false;
    this.hasTriggered = false;
    this.startY = 0;
    this.startX = 0;
    this.currentX = 0;
    this.currentY = 0;

    this.render();
  }

  render() {
    this.container = document.createElement('div');
    this.container.id = 'splash-screen-overlay';
    this.container.className = 'splash-screen-overlay';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-label', 'Surrender - Thy Will Be Done');

    this.container.innerHTML = `
      <!-- Ambient Holy Light Glow in Background -->
      <div class="splash-ambient-light" aria-hidden="true"></div>
      <div class="splash-paper-grain" aria-hidden="true"></div>

      <!-- Celestial Shockwave & Ray Blast Emitters -->
      <div class="splash-shockwave-container" aria-hidden="true">
        <div class="splash-shockwave-ring" id="splash-shockwave-ring"></div>
        <div class="splash-shockwave-secondary" id="splash-shockwave-secondary"></div>
        <div class="splash-celestial-rays" id="splash-celestial-rays"></div>
      </div>

      <!-- Sacred Splash Composition Stage -->
      <div class="splash-stage" id="splash-stage">
        <div class="splash-cross" aria-hidden="true">†</div>

        <div class="splash-title-block">
          <!-- The Dynamic Word Area: Underlying "Thy" + Peelable "My" Note -->
          <div class="splash-word-row">
            <div class="sacred-thy-word" id="sacred-thy-word">Thy</div>
            
            <!-- Sticky hand-torn scrap note with "My" -->
            <div class="peelable-my-note" id="peelable-my-note" role="button" tabindex="0" title="Pull or tap to surrender" aria-label="Pull off 'My' note to reveal 'Thy'">
              <div class="peel-washi-strip" aria-hidden="true"></div>
              <span class="peel-my-text">My</span>
              <div class="peel-curl-corner" aria-hidden="true"></div>
            </div>
          </div>

          <!-- The Rest of the Statement -->
          <div class="splash-will-be-done">Will Be Done</div>
          <div class="splash-latin-sub">Fiat Voluntas Tua</div>
        </div>

        <!-- Pull / Peel Gesture Hint -->
        <div class="splash-pull-hint" id="splash-pull-hint">
          <span class="hint-text">Pull off <em>"My"</em> to surrender</span>
        </div>
      </div>

      <!-- Full-Screen Radiant White Light Bloom Transition -->
      <div class="splash-holy-bloom" id="splash-holy-bloom" aria-hidden="true">
        <div class="bloom-inner-flare"></div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.peelNote = this.container.querySelector('#peelable-my-note');
    this.bindEvents();
  }

  bindEvents() {
    if (!this.peelNote) return;

    // Pointer events (handles Mouse, Touch, and Stylus identically)
    const onPointerDown = (e) => {
      if (this.hasTriggered) return;
      this.isDragging = true;
      this.startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      this.startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      this.currentX = 0;
      this.currentY = 0;
      this.peelNote.classList.add('is-peeling');
      audioManager.ensureContext();
      audioManager.playRustle(0.7);

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || this.hasTriggered) return;
      e.preventDefault();

      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      this.currentX = clientX - this.startX;
      this.currentY = clientY - this.startY;

      // Realistic paper peeling transforms: rotates, pulls down-right, lifts off with shadow
      const rotZ = Math.min(Math.max(this.currentX * 0.18, -25), 35);
      const rotX = Math.min(Math.max(-this.currentY * 0.15, -20), 40);
      const rotY = Math.min(Math.max(this.currentX * 0.12, -15), 30);
      const pullDist = Math.hypot(this.currentX, this.currentY);
      const scale = Math.max(0.85, 1 - pullDist * 0.001);

      this.peelNote.style.transform = `
        translate3d(${this.currentX}px, ${this.currentY}px, ${pullDist}px)
        rotateZ(${rotZ}deg)
        rotateX(${rotX}deg)
        rotateY(${rotY}deg)
        scale(${scale})
      `;

      if (pullDist > 15) {
        const hint = this.container.querySelector('#splash-pull-hint');
        if (hint) hint.style.opacity = '0';
      }

      // If pulled past threshold, trigger surrender!
      if (pullDist > 55 || this.currentY > 40 || this.currentX > 40) {
        this.triggerSurrender();
      }
    };

    const onPointerUp = () => {
      if (!this.isDragging || this.hasTriggered) return;
      this.isDragging = false;

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const pullDist = Math.hypot(this.currentX, this.currentY);

      // If user tapped or barely moved, trigger surrender directly
      if (pullDist < 10) {
        this.triggerSurrender();
      } else {
        // Snap back if released gently
        this.peelNote.classList.remove('is-peeling');
        this.peelNote.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        this.peelNote.style.transform = '';
        setTimeout(() => {
          if (this.peelNote) this.peelNote.style.transition = '';
        }, 400);
      }
    };

    this.peelNote.addEventListener('pointerdown', onPointerDown);

    // Keyboard accessibility (Space or Enter to surrender)
    this.peelNote.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.triggerSurrender();
      }
    });
  }

  triggerSurrender() {
    if (this.hasTriggered) return;
    this.hasTriggered = true;
    this.isDragging = false;

    audioManager.ensureContext();
    audioManager.playCrease(0.95);
    audioManager.playRustle(1.3);

    const hint = this.container.querySelector('#splash-pull-hint');
    if (hint) hint.style.opacity = '0';

    // 1. Peel Note flutters away dramatically
    this.peelNote.classList.add('fly-away');

    // 2. Underlying "Thy" illuminates in divine gold
    const thyWord = this.container.querySelector('#sacred-thy-word');
    if (thyWord) {
      thyWord.classList.add('revealed');
    }

    // 3. Shockwave & Celestial Energy Blast
    // Gives user deliberate time to absorb "Thy Will Be Done" before the celestial wave erupts
    setTimeout(() => {
      const stage = this.container.querySelector('#splash-stage');
      const ring1 = this.container.querySelector('#splash-shockwave-ring');
      const ring2 = this.container.querySelector('#splash-shockwave-secondary');
      const rays = this.container.querySelector('#splash-celestial-rays');

      if (stage) stage.classList.add('shockwave-pulse');
      if (ring1) ring1.classList.add('blast-active');
      if (ring2) ring2.classList.add('blast-active');
      if (rays) rays.classList.add('blast-active');

      // Sacred celestial harmonic blast & choral chime chord
      audioManager.playSacredBlast();
    }, 650);

    // 4. Gradual, blindingly bright white light fills the screen
    const bloom = this.container.querySelector('#splash-holy-bloom');
    setTimeout(() => {
      if (bloom) {
        bloom.classList.add('active');
      }
    }, 800);

    // 5. At the peak of radiant white light, transition into notes page
    setTimeout(() => {
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }, 2700);

    // 6. Dissolve white bloom gently, revealing the notes page
    setTimeout(() => {
      if (this.container) {
        this.container.classList.add('fade-out');
        setTimeout(() => {
          this.destroy();
        }, 1300);
      }
    }, 3100);
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}

