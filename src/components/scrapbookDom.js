import { audioManager } from './audioManager.js';

export class ScrapbookDOM {
  constructor(container, notes) {
    this.container = container;
    this.notes = notes;
    this.sections = [];
    this.cards = [];

    this.render();
  }

  render() {
    this.container.innerHTML = '';

    this.notes.forEach((item, index) => {
      const section = document.createElement('section');
      section.className = 'day-section';
      section.id = `section-day-${item.dayNumber}`;
      section.dataset.index = index;

      const tapeColor = item.tapeColor || item.scrapbook?.tapeColor || 'washi-gold';
      const tapeAngle = item.tapeAngle ?? item.scrapbook?.tapeAngle ?? -2;
      const caption = item.caption || item.scrapbook?.caption || item.scrapbook?.polaroidCaption || '';

      // Card structure with 3D origami facets & scrapbook elements
      section.innerHTML = `
        <div class="origami-viewport">
          <div class="origami-sheet-card" id="card-${index}">
            <!-- Origami Crease Background Guidelines (Subtle Watermark) -->
            <div class="origami-crease-watermark" aria-hidden="true">
              <svg viewBox="0 0 400 500" class="crease-svg">
                <line x1="0" y1="0" x2="400" y2="500" class="crease-line valley" />
                <line x1="400" y1="0" x2="0" y2="500" class="crease-line valley" />
                <line x1="200" y1="0" x2="200" y2="500" class="crease-line mountain" />
                <line x1="0" y1="250" x2="400" y2="250" class="crease-line mountain" />
                <circle cx="200" cy="250" r="160" class="sacred-watermark-circle" />
                <text x="200" y="255" text-anchor="middle" class="sacred-watermark-cross">†</text>
              </svg>
            </div>

            <!-- Scrapbook Tape Header -->
            <div class="washi-tape ${tapeColor}" style="--tape-angle: ${tapeAngle}deg;" aria-hidden="true">
              <span class="washi-texture"></span>
            </div>

            <!-- Header: Day Count & Date on Left, Day of Week on Right -->
            <div class="card-date-header">
              <div class="timeline-date-stamp">
                <span class="stamp-pill">DAY ${String(item.dayNumber).padStart(2, '0')}</span>
                <span class="timeline-date-val">${item.timelineDate}</span>
              </div>
              <div class="timeline-day-wrap">
                <span class="timeline-day-val">${item.dayOfWeek}</span>
              </div>
            </div>

            <!-- Card Body: Note in the middle -->
            <div class="card-content-body">
              <h2 class="card-title">${item.title}</h2>

              <div class="card-note-text">
                <p class="note-paragraph">
                  <span class="drop-cap">${item.note.charAt(0)}</span>${item.note.slice(1)}
                </p>
              </div>

              <!-- Sacred Scripture Whisper (Mild Christian Element) -->
              <div class="scripture-whisper">
                <div class="sacred-cross-divider" aria-hidden="true">
                  <span class="line"></span>
                  <span class="cross">†</span>
                  <span class="line"></span>
                </div>
                <blockquote class="scripture-quote">${item.scripture}</blockquote>
              </div>
            </div>

            <!-- Scrapbook Bottom Accents: Wax Seal linking to YouTube & Handwritten Marginalia -->
            <div class="card-footer-accents">
              ${caption ? `
                <div class="handwritten-caption">
                  <span class="caption-pin">📌</span>
                  <span class="caption-text">${caption}</span>
                </div>
              ` : '<div></div>'}

              <a href="${item.videoUrl || item.youtubeUrl || '#'}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="embossed-seal video-seal"
                 title="${item.videoTitle || item.youtubeTitle ? `Watch: ${item.videoTitle || item.youtubeTitle}` : 'Watch reflection on YouTube'}"
                 aria-label="${item.videoTitle || item.youtubeTitle ? `Watch ${item.videoTitle || item.youtubeTitle}` : 'Watch reflection on YouTube'}">
                <div class="seal-inner">
                  <span class="seal-center-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" class="seal-center-play-svg">
                      <polygon points="9,6 19,12 9,18" fill="currentColor"/>
                    </svg>
                  </span>
                </div>
                <span class="seal-video-pill" aria-hidden="true">Watch</span>
              </a>
            </div>

            <!-- 3D Origami Facet Fold Flaps for realistic paper creasing on scroll -->
            <div class="origami-fold-facet facet-top-left" aria-hidden="true"></div>
            <div class="origami-fold-facet facet-top-right" aria-hidden="true"></div>
            <div class="origami-fold-facet facet-bottom-left" aria-hidden="true"></div>
            <div class="origami-fold-facet facet-bottom-right" aria-hidden="true"></div>
            <div class="crease-shadow-overlay" aria-hidden="true"></div>
          </div>
        </div>
      `;

      this.container.appendChild(section);
      this.sections.push(section);
      this.cards.push(section.querySelector('.origami-sheet-card'));
    });

    // Add audio chime when opening YouTube video
    this.container.querySelectorAll('.video-seal').forEach((seal) => {
      seal.addEventListener('click', () => {
        audioManager.playChime(660);
      });
    });
  }

  // Update card 3D origami transforms according to scroll progress (-1 to 1)
  // progress = 0 means card is active in viewport center
  // progress < 0 means scrolling down towards it (entering from bottom)
  // progress > 0 means scrolling past it (exiting to top)
  updateCardTransform(cardIndex, localProgress) {
    const card = this.cards[cardIndex];
    if (!card) return;

    const p = localProgress; // e.g. -1 (below), 0 (center), +1 (above)
    const absP = Math.abs(p);

    if (absP > 1.3) {
      card.style.visibility = 'hidden';
      card.style.transform = 'translate3d(0, 0, -200px) scale(0.7)';
      return;
    }

    card.style.visibility = 'visible';

    // Multi-facet Origami Crane Fold Mechanics:
    // When p is near 0: sheet is flat, pristine, relaxed
    // When p exits (> 0): folds along diagonal creases, hinges inward, shadows deepen
    // When p enters (< 0): unfolds outward from folded diamond packet
    if (p > 0) {
      // Exiting (folding away like paper crane into flight)
      const foldAngle = Math.min(p * 85, 90);
      const liftZ = p * 180;
      const rotateX = p * 35;
      const rotateY = p * -25;
      const scale = 1 - p * 0.22;
      const opacity = Math.max(0, 1 - p * 1.4);

      card.style.transform = `perspective(1200px) translate3d(0, ${-p * 70}px, ${liftZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = opacity;

      // Facet dynamic fold shading
      const shadowOverlay = card.querySelector('.crease-shadow-overlay');
      if (shadowOverlay) {
        shadowOverlay.style.opacity = Math.min(p * 1.5, 0.7);
      }

      // Corner origami flaps fold in
      const tl = card.querySelector('.facet-top-left');
      const tr = card.querySelector('.facet-top-right');
      const bl = card.querySelector('.facet-bottom-left');
      const br = card.querySelector('.facet-bottom-right');

      if (tl) tl.style.transform = `rotate3d(1, 1, 0, ${-foldAngle * 0.9}deg)`;
      if (tr) tr.style.transform = `rotate3d(-1, 1, 0, ${foldAngle * 0.9}deg)`;
      if (bl) bl.style.transform = `rotate3d(1, -1, 0, ${foldAngle * 0.8}deg)`;
      if (br) br.style.transform = `rotate3d(-1, -1, 0, ${-foldAngle * 0.8}deg)`;
    } else {
      // Entering (unfolding from a folded letter into the viewport)
      const unp = Math.abs(p);
      const foldAngle = Math.min(unp * 75, 85);
      const liftZ = -unp * 120;
      const rotateX = -unp * 25;
      const rotateY = unp * 15;
      const scale = 1 - unp * 0.25;
      const opacity = Math.max(0, 1 - unp * 1.5);

      card.style.transform = `perspective(1200px) translate3d(0, ${unp * 80}px, ${liftZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = opacity;

      const shadowOverlay = card.querySelector('.crease-shadow-overlay');
      if (shadowOverlay) {
        shadowOverlay.style.opacity = Math.min(unp * 1.2, 0.6);
      }

      const tl = card.querySelector('.facet-top-left');
      const tr = card.querySelector('.facet-top-right');
      const bl = card.querySelector('.facet-bottom-left');
      const br = card.querySelector('.facet-bottom-right');

      if (tl) tl.style.transform = `rotate3d(1, 1, 0, ${-foldAngle * 0.8}deg)`;
      if (tr) tr.style.transform = `rotate3d(-1, 1, 0, ${foldAngle * 0.8}deg)`;
      if (bl) bl.style.transform = `rotate3d(1, -1, 0, ${foldAngle * 0.7}deg)`;
      if (br) br.style.transform = `rotate3d(-1, -1, 0, ${-foldAngle * 0.7}deg)`;
    }
  }
}

