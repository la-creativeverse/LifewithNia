import { audioManager } from './audioManager.js';

export class TimelineNav {
  constructor(notes, onSelectDate, getActiveIndex) {
    this.notes = notes;
    this.onSelectDate = onSelectDate;
    this.getActiveIndex = getActiveIndex;
    this.isOpen = false;

    this.container = null;
    this.drawer = null;
    this.ribbonTrigger = null;
    this.progressFill = null;
    this.counterEl = null;

    this.render();
  }

  render() {
    // Header Navigation Bar
    const navBar = document.createElement('header');
    navBar.className = 'top-nav-bar';
    navBar.setAttribute('role', 'banner');

    navBar.innerHTML = `
      <div class="nav-brand">
        <span class="sacred-cross-mark" aria-hidden="true">†</span>
        <div class="brand-text">
          <span class="brand-title">Thy Will Be Done</span>
          <span class="brand-sub">Fiat Voluntas Tua</span>
        </div>
      </div>

      <div class="nav-actions">
        <button id="jump-today-btn" class="nav-pill-btn jump-btn" title="Jump to Today's Section">
          <span class="btn-icon">❖</span>
          <span>Today</span>
        </button>

        <button id="timeline-toggle-btn" class="nav-pill-btn timeline-btn" aria-expanded="false" aria-controls="timeline-drawer">
          <span class="btn-icon">☰</span>
          <span id="nav-day-counter">Day ${this.getActiveIndex() + 1} of ${this.notes.length}</span>
        </button>
      </div>
    `;

    document.body.appendChild(navBar);

    // Global Origami Timeline Drawer (Scrapbook Accordion)
    this.drawer = document.createElement('aside');
    this.drawer.id = 'timeline-drawer';
    this.drawer.className = 'timeline-drawer';
    this.drawer.setAttribute('aria-hidden', 'true');

    this.drawer.innerHTML = `
      <div class="drawer-backdrop" id="drawer-backdrop"></div>
      <div class="drawer-panel">
        <div class="drawer-header">
          <div class="drawer-header-title">
            <span class="sacred-divider">†</span>
            <h3>Timeline of Days</h3>
            <p>Every step folded in grace and surrender</p>
          </div>
          <button id="close-drawer-btn" class="drawer-close-btn" aria-label="Close timeline">✕</button>
        </div>

        <div class="drawer-search-wrap">
          <input type="text" id="timeline-search-input" placeholder="Search days, dates, or reflections..." aria-label="Search timeline" />
        </div>

        <div class="timeline-items-list" id="timeline-items-list" role="list">
          ${this.renderTimelineItems(this.notes)}
        </div>

        <div class="drawer-footer">
          <span class="footer-blessing">“In His hands are the depths of the earth, and the mountain peaks belong to Him.”</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.drawer);

    // Bottom minimal scrub bar & floating controls
    const bottomControls = document.createElement('div');
    bottomControls.className = 'bottom-scrub-controls';
    bottomControls.innerHTML = `
      <button id="prev-day-btn" class="scrub-step-btn" title="Previous Day (Arrow Up / Left)">
        <span>‹</span> Day
      </button>

      <div class="scrub-track-container" id="scrub-track-container" title="Drag or click to scrub through dates">
        <div class="scrub-track">
          <div class="scrub-fill" id="scrub-fill"></div>
          <div class="scrub-nodes" id="scrub-nodes">
            ${this.notes.map((n, i) => `
              <div class="scrub-node ${i === 0 ? 'active' : ''}" data-index="${i}" title="${n.timelineDate}: ${n.title}">
                <span class="node-dot"></span>
                <span class="node-tooltip">${n.timelineDate}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <button id="next-day-btn" class="scrub-step-btn" title="Next Day (Arrow Down / Right)">
        Day <span>›</span>
      </button>
    `;
    document.body.appendChild(bottomControls);

    this.attachEventListeners();
    this.updateActive(this.getActiveIndex());
  }

  renderTimelineItems(notesList) {
    const activeIdx = this.getActiveIndex();
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${localYear}-${localMonth}-${localDay}`;

    const hasTodayEntry = notesList.some(n => n.date === todayDateStr);

    return notesList.map((item, index) => {
      const isToday = item.date === todayDateStr || (!hasTodayEntry && index === 0);
      const isActive = index === activeIdx;

      return `
        <div class="timeline-card ${isActive ? 'is-active' : ''} ${isToday ? 'is-today' : ''}" data-index="${index}" role="listitem" tabindex="0">
          <div class="timeline-card-ribbon"></div>
          <div class="timeline-card-header">
            <span class="timeline-card-day">DAY ${String(item.dayNumber).padStart(2, '0')}</span>
            <span class="timeline-date-val">${item.timelineDate}</span>
            ${isToday ? '<span class="today-tag">TODAY</span>' : ''}
          </div>
          <div class="timeline-card-title">${item.title}</div>
          <div class="timeline-card-snippet">${item.note.slice(0, 80)}...</div>
          <div class="timeline-card-verse">${item.scripture.split('—')[0].slice(0, 60)}...</div>
        </div>
      `;
    }).join('');
  }

  attachEventListeners() {
    const toggleBtn = document.getElementById('timeline-toggle-btn');
    const closeBtn = document.getElementById('close-drawer-btn');
    const backdrop = document.getElementById('drawer-backdrop');
    const jumpTodayBtn = document.getElementById('jump-today-btn');
    const prevBtn = document.getElementById('prev-day-btn');
    const nextBtn = document.getElementById('next-day-btn');
    const searchInput = document.getElementById('timeline-search-input');
    const listEl = document.getElementById('timeline-items-list');

    // Toggle drawer
    const openDrawer = () => {
      this.isOpen = true;
      this.drawer.classList.add('open');
      this.drawer.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      audioManager.playRustle(1.2);
      this.updateActiveItem();
    };

    const closeDrawer = () => {
      this.isOpen = false;
      this.drawer.classList.remove('open');
      this.drawer.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      audioManager.playCrease(0.4);
    };

    toggleBtn.addEventListener('click', () => {
      if (this.isOpen) closeDrawer();
      else openDrawer();
    });

    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    // Jump today (finds matching date or closest recent day)
    jumpTodayBtn.addEventListener('click', () => {
      const now = new Date();
      const localYear = now.getFullYear();
      const localMonth = String(now.getMonth() + 1).padStart(2, '0');
      const localDay = String(now.getDate()).padStart(2, '0');
      const todayDateStr = `${localYear}-${localMonth}-${localDay}`;

      const todayIdx = this.notes.findIndex((n) => n.date === todayDateStr);
      let targetIdx = todayIdx !== -1 ? todayIdx : -1;

      if (targetIdx === -1) {
        for (let i = 0; i < this.notes.length; i++) {
          if (this.notes[i].date && this.notes[i].date <= todayDateStr) {
            targetIdx = i;
          }
        }
      }
      if (targetIdx === -1) targetIdx = Math.max(0, this.notes.length - 1);

      this.onSelectDate(targetIdx);
      audioManager.playChime(640);
      if (this.isOpen) closeDrawer();
    });

    // Prev / Next day
    prevBtn.addEventListener('click', () => {
      const curr = this.getActiveIndex();
      if (curr > 0) this.onSelectDate(curr - 1);
    });

    nextBtn.addEventListener('click', () => {
      const curr = this.getActiveIndex();
      if (curr < this.notes.length - 1) this.onSelectDate(curr + 1);
    });

    // Item selection from drawer
    listEl.addEventListener('click', (e) => {
      const card = e.target.closest('.timeline-card');
      if (card) {
        const idx = parseInt(card.dataset.index, 10);
        this.onSelectDate(idx);
        audioManager.playChime(580);
        closeDrawer();
      }
    });

    // Keyboard support on list items
    listEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.timeline-card');
        if (card) {
          e.preventDefault();
          const idx = parseInt(card.dataset.index, 10);
          this.onSelectDate(idx);
          closeDrawer();
        }
      }
    });

    // Search filter
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const cards = listEl.querySelectorAll('.timeline-card');
      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        if (!term || text.includes(term)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });

    // Scrub bar click/drag
    const track = document.getElementById('scrub-track-container');
    track.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const targetIdx = Math.round(pct * (this.notes.length - 1));
      this.onSelectDate(targetIdx);
    });

    // Keyboard navigation shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
        const curr = this.getActiveIndex();
        if (curr < this.notes.length - 1) {
          e.preventDefault();
          this.onSelectDate(curr + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        const curr = this.getActiveIndex();
        if (curr > 0) {
          e.preventDefault();
          this.onSelectDate(curr - 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.onSelectDate(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.onSelectDate(this.notes.length - 1);
      } else if (e.key === 'Escape' && this.isOpen) {
        closeDrawer();
      }
    });
  }

  updateActive(index) {
    const counter = document.getElementById('nav-day-counter');
    if (counter) {
      counter.textContent = `Day ${index + 1} of ${this.notes.length}`;
    }

    // Update bottom scrub fill & nodes
    const fill = document.getElementById('scrub-fill');
    if (fill && this.notes.length > 1) {
      const pct = (index / (this.notes.length - 1)) * 100;
      fill.style.width = `${pct}%`;
    }

    const nodes = document.querySelectorAll('.scrub-node');
    nodes.forEach((n, i) => {
      if (i === index) n.classList.add('active');
      else n.classList.remove('active');
    });

    this.updateActiveItem();
  }

  updateActiveItem() {
    const listEl = document.getElementById('timeline-items-list');
    if (!listEl) return;
    const activeIdx = this.getActiveIndex();
    const cards = listEl.querySelectorAll('.timeline-card');
    cards.forEach((card, i) => {
      if (i === activeIdx) {
        card.classList.add('is-active');
        if (this.isOpen) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        card.classList.remove('is-active');
      }
    });
  }
}

