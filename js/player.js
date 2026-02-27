/**
 * Video player controller using HLS.js for stream playback.
 */
const Player = {
  _video: null,
  _hls: null,
  _currentChannel: null,

  init() {
    this._video = document.getElementById('video-player')
  },

  /**
   * Wrap an HTTP URL through our server-side proxy when on HTTPS.
   */
  _proxyUrl(url) {
    if (location.protocol === 'https:' && url.startsWith('http://')) {
      return '/api/proxy?url=' + encodeURIComponent(url)
    }
    return url
  },

  /**
   * Play a channel's stream URL.
   * @param {object} channel - Channel object with url property
   */
  play(channel) {
    this._currentChannel = channel;
    const url = channel.url;

    // Destroy previous HLS instance
    if (this._hls) {
      this._hls.destroy();
      this._hls = null;
    }

    // Hide overlay
    document.getElementById('player-overlay').classList.remove('visible');

    const proxiedUrl = this._proxyUrl(url)

    if (this._isHLS(url) && Hls.isSupported()) {
      const self = this
      this._hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferSize: 120 * 1000 * 1000,
        capLevelToPlayerSize: false,
        autoStartLoad: true,
        startLevel: -1,
        xhrSetup(xhr, xhrUrl) {
          // Route all sub-requests (segments, sub-manifests) through proxy
          const rewritten = self._proxyUrl(xhrUrl)
          if (rewritten !== xhrUrl) {
            xhr.open('GET', rewritten, true)
          }
        },
      })
      this._hls.loadSource(proxiedUrl)
      this._hls.attachMedia(this._video)
      this._hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        if (data.levels && data.levels.length > 0) {
          const highest = data.levels.reduce((max, level, i) =>
            (level.height > (data.levels[max]?.height || 0)) ? i : max, 0)
          this._hls.currentLevel = highest
        }
        this._video.play().catch(() => {})
      })
      this._hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              showToast('Network error — retrying...', 'error')
              this._hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              showToast('Media error — recovering...', 'error')
              this._hls.recoverMediaError()
              break
            default:
              showToast('Stream unavailable', 'error')
              this._hls.destroy()
              break
          }
        }
      })
    } else if (this._video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari) — proxy rewrites M3U8 URLs server-side
      this._video.src = proxiedUrl
      this._video.addEventListener('loadedmetadata', () => {
        this._video.play().catch(() => {})
      }, { once: true })
    } else {
      // Direct URL (MP4, etc.)
      this._video.src = proxiedUrl
      this._video.play().catch(() => {})
    }

    // Update now-playing
    document.getElementById('now-playing-name').textContent = channel.name;
    document.getElementById('now-playing-category').textContent = channel.group;

    // Update favorite button state
    const favBtn = document.getElementById('fav-btn');
    if (Favorites.isFavorite(channel.id)) {
      favBtn.classList.add('active');
    } else {
      favBtn.classList.remove('active');
    }
  },

  /**
   * Toggle Picture-in-Picture mode.
   */
  async togglePiP() {
    if (!this._video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (this._video.readyState >= 1) {
        await this._video.requestPictureInPicture();
      }
    } catch (err) {
      showToast('Picture-in-Picture not supported', 'error');
    }
  },

  getCurrentChannel() {
    return this._currentChannel;
  },

  _isHLS(url) {
    return /\.m3u8?(\?|$)/i.test(url);
  }
};
