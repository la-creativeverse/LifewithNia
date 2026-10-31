// Background Music Player supporting YouTube & Direct Audio streams with Auto-play
export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export class BackgroundMusicPlayer {
  constructor(notes, getActiveIndex) {
    this.notes = notes;
    this.getActiveIndex = getActiveIndex;
    this.isPlaying = false;
    this.isUserPaused = false; // Only pause if user explicitly paused once
    this.currentTrackIndex = -1;
    this.pendingTrackIndex = null;
    this.ytPlayer = null;
    this.htmlAudio = null;
    this.isYtReady = false;

    this.barEl = null;
    this.init();
  }

  init() {
    this.setupHtmlAudio();
    this.loadYouTubeIframeAPI();
    this.renderFloatingBar();
    this.setupAutoPlayOnOpen();
  }

  setupHtmlAudio() {
    this.htmlAudio = new Audio();
    this.htmlAudio.preload = 'auto';

    this.htmlAudio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updateUI();
    });

    this.htmlAudio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateUI();
    });

    this.htmlAudio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUI();
    });
  }

  loadYouTubeIframeAPI() {
    // In-viewport invisible container for YouTube Player
    const ytContainer = document.createElement('div');
    ytContainer.id = 'yt-bg-player-wrap';
    ytContainer.className = 'yt-bg-player-wrap';
    ytContainer.innerHTML = `<div id="yt-bg-player-iframe"></div>`;
    document.body.appendChild(ytContainer);

    // If API already loaded
    if (window.YT && window.YT.Player) {
      this.onYouTubeReady();
      return;
    }

    // Load YouTube script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      this.onYouTubeReady();
    };
  }

  onYouTubeReady() {
    try {
      this.ytPlayer = new window.YT.Player('yt-bg-player-iframe', {
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            this.isYtReady = true;
            try {
              const iframe = event.target.getIframe();
              if (iframe) {
                iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
              }
              if (typeof this.ytPlayer.unMute === 'function') {
                this.ytPlayer.unMute();
              }
              if (typeof this.ytPlayer.setVolume === 'function') {
                this.ytPlayer.setVolume(100);
              }
            } catch (_) {}

            this.updateUI();

            // Play active day's track
            const trackToPlay = this.pendingTrackIndex !== null ? this.pendingTrackIndex : this.getActiveIndex();
            this.pendingTrackIndex = null;
            if (!this.isUserPaused) {
              this.playTrack(trackToPlay);
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === window.YT.PlayerState.PLAYING) {
              this.isPlaying = true;
              this.updateUI();
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              this.isPlaying = false;
              this.updateUI();
            }
          },
          onError: (err) => {
            console.warn('YouTube Player error code:', err.data);
          }
        }
      });
    } catch (e) {
      console.warn('Error initializing YouTube Player', e);
    }
  }

  setupAutoPlayOnOpen() {
    const triggerStart = () => {
      if (!this.isPlaying && !this.isUserPaused) {
        if (this.ytPlayer && this.isYtReady) {
          try {
            if (typeof this.ytPlayer.unMute === 'function') this.ytPlayer.unMute();
            if (typeof this.ytPlayer.setVolume === 'function') this.ytPlayer.setVolume(100);
          } catch (_) {}
        }
        this.playTrack(this.getActiveIndex());
      }
    };

    // If browser autoplay policy holds sound until first gesture,
    // immediately unlock sound and play on first click, touch, or scroll
    const unlockGesture = () => {
      triggerStart();
      window.removeEventListener('pointerdown', unlockGesture);
      window.removeEventListener('click', unlockGesture);
      window.removeEventListener('scroll', unlockGesture);
      window.removeEventListener('wheel', unlockGesture);
      window.removeEventListener('keydown', unlockGesture);
      window.removeEventListener('touchstart', unlockGesture);
    };

    window.addEventListener('pointerdown', unlockGesture, { once: true, passive: true });
    window.addEventListener('click', unlockGesture, { once: true, passive: true });
    window.addEventListener('scroll', unlockGesture, { once: true, passive: true });
    window.addEventListener('wheel', unlockGesture, { once: true, passive: true });
    window.addEventListener('keydown', unlockGesture, { once: true, passive: true });
    window.addEventListener('touchstart', unlockGesture, { once: true, passive: true });
  }

  renderFloatingBar() {
    this.barEl = document.createElement('aside');
    this.barEl.className = 'ambient-music-bar';
    this.barEl.setAttribute('aria-label', 'Daily Song Player');

    this.barEl.innerHTML = `
      <div class="music-bar-inner">
        <button id="music-play-toggle-btn" class="music-ctrl-btn" aria-label="Play daily song" title="Play / Pause Daily Song">
          <span class="music-play-icon">▶</span>
        </button>

        <div class="music-info-pill">
          <span class="music-note-icon">♫</span>
          <div class="music-text-marquee">
            <span id="music-song-title" class="song-title">Daily Song</span>
            <span id="music-song-artist" class="song-artist">Reflection Music</span>
          </div>
        </div>

        <div class="music-sound-waves" id="music-sound-waves" aria-hidden="true">
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
        </div>

        <a id="music-yt-external-link" href="#" target="_blank" rel="noopener noreferrer" class="music-ext-link" title="Open Song" aria-label="Open Song">
          <span>↗</span>
        </a>
      </div>
    `;

    document.body.appendChild(this.barEl);

    // Event listeners
    const toggleBtn = this.barEl.querySelector('#music-play-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      const activeIdx = this.getActiveIndex();
      this.toggleTrack(activeIdx);
    });

    this.syncTrackForIndex(this.getActiveIndex(), false);
  }

  // Called when active section changes on scroll or navigation
  syncTrackForIndex(index) {
    const item = this.notes[index];
    if (!item) return;

    const titleEl = document.getElementById('music-song-title');
    const artistEl = document.getElementById('music-song-artist');
    const extLink = document.getElementById('music-yt-external-link');

    const songTitle = item.songTitle || item.youtubeTitle || `Day ${item.dayNumber} Song`;
    const songUrl = item.songUrl || item.audioUrl || item.youtubeUrl;

    if (titleEl) titleEl.textContent = songTitle;
    if (artistEl) artistEl.textContent = item.songArtist || item.title || 'Hymn & Reflection';
    if (extLink && songUrl) extLink.href = songUrl;

    // Transition track when user scrolls to a new day
    if (this.currentTrackIndex !== index) {
      if (!this.isUserPaused) {
        // Automatically start playing the new day's song!
        this.playTrack(index);
      } else {
        // Stay paused if user paused once, just update track info
        this.currentTrackIndex = index;
        this.updateUI();
      }
    }
  }

  toggleTrack(index) {
    if (this.currentTrackIndex === index && this.isPlaying) {
      this.pause(true); // User explicitly paused!
    } else {
      this.isUserPaused = false; // User explicitly resumed playback!
      if (this.ytPlayer && this.isYtReady) {
        try {
          if (typeof this.ytPlayer.unMute === 'function') this.ytPlayer.unMute();
          if (typeof this.ytPlayer.setVolume === 'function') this.ytPlayer.setVolume(100);
        } catch (_) {}
      }
      this.playTrack(index);
    }
  }

  playTrack(index) {
    const item = this.notes[index];
    if (!item) return;

    this.currentTrackIndex = index;
    const songUrl = item.songUrl || item.audioUrl || item.youtubeUrl;
    const ytId = extractYouTubeId(songUrl);

    // Check if it's a direct audio URL (e.g. .mp3, .m4a)
    const isDirectAudio = item.audioUrl || (songUrl && /\.(mp3|wav|m4a|aac)(\?.*)?$/i.test(songUrl));

    if (isDirectAudio) {
      // Pause YouTube if running
      if (this.ytPlayer && this.isYtReady && typeof this.ytPlayer.pauseVideo === 'function') {
        this.ytPlayer.pauseVideo();
      }
      this.htmlAudio.src = item.audioUrl || songUrl;
      this.htmlAudio.play().then(() => {
        this.isPlaying = true;
        this.updateUI();
      }).catch(e => console.warn('Audio play prevented', e));
    } else if (ytId) {
      // Pause HTML Audio
      this.htmlAudio.pause();
      if (this.ytPlayer && this.isYtReady) {
        try {
          if (typeof this.ytPlayer.unMute === 'function') this.ytPlayer.unMute();
          if (typeof this.ytPlayer.setVolume === 'function') this.ytPlayer.setVolume(100);
          this.ytPlayer.loadVideoById(ytId);
          this.ytPlayer.playVideo();
          this.isPlaying = true;
          this.updateUI();
        } catch (err) {
          console.warn('Failed to play YouTube track', err);
        }
      } else {
        // Player not ready yet, queue for when onReady fires
        this.pendingTrackIndex = index;
      }
    } else if (songUrl) {
      this.updateUI();
    }

    this.updateUI();
  }

  pause(userInitiated = false) {
    if (userInitiated) {
      this.isUserPaused = true;
    }
    this.isPlaying = false;
    if (this.htmlAudio) this.htmlAudio.pause();
    if (this.ytPlayer && this.isYtReady && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }
    this.updateUI();
  }

  updateUI() {
    const toggleBtn = document.getElementById('music-play-toggle-btn');
    const playIcon = toggleBtn ? toggleBtn.querySelector('.music-play-icon') : null;
    const waves = document.getElementById('music-sound-waves');
    const bar = document.querySelector('.ambient-music-bar');

    if (playIcon) {
      playIcon.textContent = this.isPlaying ? '❚❚' : '▶';
    }

    if (waves) {
      if (this.isPlaying) waves.classList.add('playing');
      else waves.classList.remove('playing');
    }

    if (bar) {
      if (this.isPlaying) bar.classList.add('is-active-playing');
      else bar.classList.remove('is-active-playing');
    }
  }
}
