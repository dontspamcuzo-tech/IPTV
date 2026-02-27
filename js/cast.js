/**
 * Casting controller for Chromecast and AirPlay.
 */
const Cast = {
  _castSession: null,
  _airplayAvailable: false,
  _chromecastAvailable: false,

  init() {
    this._initAirPlay();
    this._initChromecast();
  },

  // ── AirPlay ──

  _initAirPlay() {
    const video = document.getElementById('video-player');

    // Check for WebKit AirPlay support (Safari)
    if (video.webkitShowPlaybackTargetPicker) {
      this._airplayAvailable = true;
      this._showButton('airplay-btn');
    }

    // Listen for AirPlay availability events
    if (window.WebKitPlaybackTargetAvailabilityEvent) {
      video.addEventListener('webkitplaybacktargetavailabilitychanged', (e) => {
        this._airplayAvailable = e.availability === 'available';
        if (this._airplayAvailable) {
          this._showButton('airplay-btn');
        } else {
          this._hideButton('airplay-btn');
        }
      });

      video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', () => {
        const btn = document.getElementById('airplay-btn');
        if (video.webkitCurrentPlaybackTargetIsWireless) {
          btn.classList.add('active');
          showToast('Connected to AirPlay device', 'success');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  },

  toggleAirPlay() {
    const video = document.getElementById('video-player');
    if (video.webkitShowPlaybackTargetPicker) {
      video.webkitShowPlaybackTargetPicker();
    } else {
      showToast('AirPlay is only available in Safari', 'error');
    }
  },

  // ── Chromecast ──

  _initChromecast() {
    // Wait for the Cast SDK to load
    window['__onGCastApiAvailable'] = (isAvailable) => {
      if (isAvailable) {
        this._setupChromecast();
      }
    };

    // If the SDK already loaded before our callback was set
    if (window.chrome && window.chrome.cast && window.chrome.cast.isAvailable) {
      this._setupChromecast();
    }
  },

  _setupChromecast() {
    const context = cast.framework.CastContext.getInstance();
    context.setOptions({
      receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    this._chromecastAvailable = true;
    this._showButton('cast-btn');

    // Listen for session state changes
    context.addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      (event) => {
        const btn = document.getElementById('cast-btn');
        switch (event.sessionState) {
          case cast.framework.SessionState.SESSION_STARTED:
          case cast.framework.SessionState.SESSION_RESUMED:
            this._castSession = context.getCurrentSession();
            btn.classList.add('active');
            showToast('Connected to Chromecast', 'success');
            this._castCurrentStream();
            break;
          case cast.framework.SessionState.SESSION_ENDED:
            this._castSession = null;
            btn.classList.remove('active');
            showToast('Chromecast disconnected', 'info');
            break;
        }
      }
    );
  },

  toggleChromecast() {
    if (!this._chromecastAvailable) {
      showToast('Chromecast not available — use Chrome browser', 'error');
      return;
    }

    const context = cast.framework.CastContext.getInstance();
    if (this._castSession) {
      this._castSession.endSession(true);
    } else {
      context.requestSession().catch(() => {
        // User cancelled the picker
      });
    }
  },

  /**
   * Send the current stream to the active Cast session.
   */
  _castCurrentStream() {
    if (!this._castSession) return;

    const channel = Player.getCurrentChannel();
    if (!channel) return;

    const mediaInfo = new chrome.cast.media.MediaInfo(channel.url, 'application/x-mpegurl');
    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = channel.name;
    mediaInfo.metadata.subtitle = channel.group || '';
    if (channel.logo) {
      mediaInfo.metadata.images = [new chrome.cast.Image(channel.logo)];
    }

    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    this._castSession.loadMedia(request).then(
      () => showToast(`Casting: ${channel.name}`, 'success'),
      (err) => showToast(`Cast error: ${err.description || 'Unknown'}`, 'error')
    );
  },

  /**
   * Called when the user switches channels while casting.
   */
  onChannelChange() {
    if (this._castSession) {
      this._castCurrentStream();
    }
  },

  // ── Helpers ──

  _showButton(id) {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = 'flex';
  },

  _hideButton(id) {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = 'none';
  },

  isAirPlayAvailable() {
    return this._airplayAvailable;
  },

  isChromecastAvailable() {
    return this._chromecastAvailable;
  },

  isCasting() {
    return !!this._castSession;
  }
};
