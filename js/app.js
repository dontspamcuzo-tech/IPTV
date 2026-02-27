/**
 * Main application controller.
 */
(function () {
  let channels = [];
  let filteredChannels = [];
  let showingFavorites = false;

  const $ = (sel) => document.getElementById(sel);

  // ── Toast ──
  window.showToast = function (msg, type = 'info') {
    let toast = $('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `visible ${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = ''; }, 3000);
  };

  // ── Init ──
  function init() {
    Player.init();
    Cast.init();
    bindEvents();
    autoLoadPlaylist();
  }

  // ── Auto-load default playlist from config ──
  async function autoLoadPlaylist() {
    if (typeof IPTV_CONFIG === 'undefined' || !IPTV_CONFIG.autoLoad) return;

    const { server, username, password, format, output } = IPTV_CONFIG;
    const url = `${server}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=${format || 'm3u_plus'}&output=${output || 'ts'}`;

    $('player-overlay').querySelector('p').textContent = 'Loading playlist...';
    $('overlay-load-btn').style.display = 'none';

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      processPlaylist(text);
      $('player-overlay').querySelector('p').textContent = 'Select a channel to start watching';
      showToast('Playlist loaded successfully', 'success');
    } catch (err) {
      $('player-overlay').querySelector('p').textContent = 'Load a playlist to get started';
      $('overlay-load-btn').style.display = '';
      showToast(`Auto-load failed: ${err.message}`, 'error');
    }
  }

  // ── Events ──
  function bindEvents() {
    // Open modal
    $('load-btn').addEventListener('click', openModal);
    $('overlay-load-btn').addEventListener('click', openModal);

    // Close modal
    $('modal-close').addEventListener('click', closeModal);
    $('modal-overlay').addEventListener('click', (e) => {
      if (e.target === $('modal-overlay')) closeModal();
    });

    // Modal tabs
    document.querySelectorAll('.modal-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById(`tab-${target}`).classList.add('active');
      });
    });

    // Load from URL
    $('load-url-btn').addEventListener('click', loadFromURL);
    $('playlist-url').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadFromURL();
    });

    // Load from file
    $('playlist-file').addEventListener('change', loadFromFile);

    // Drag and drop
    const dropZone = document.getElementById('file-drop-zone');
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--accent)';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    });

    // Search
    $('search-input').addEventListener('input', applyFilters);

    // Category filter
    $('category-select').addEventListener('change', applyFilters);

    // Favorites toggle
    $('favorites-toggle').addEventListener('click', () => {
      showingFavorites = !showingFavorites;
      $('favorites-toggle').classList.toggle('active', showingFavorites);
      applyFilters();
    });

    // Favorite button (now-playing)
    $('fav-btn').addEventListener('click', () => {
      const ch = Player.getCurrentChannel();
      if (!ch) return;
      const isFav = Favorites.toggle(ch.id);
      $('fav-btn').classList.toggle('active', isFav);
      showToast(isFav ? 'Added to favorites' : 'Removed from favorites', 'success');
      renderChannels();
    });

    // Casting
    $('airplay-btn').addEventListener('click', () => Cast.toggleAirPlay());
    $('cast-btn').addEventListener('click', () => Cast.toggleChromecast());

    // Picture-in-Picture
    $('pip-btn').addEventListener('click', () => Player.togglePiP());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      switch (e.key) {
        case '/':
          e.preventDefault();
          $('search-input').focus();
          break;
        case 'Escape':
          closeModal();
          $('search-input').blur();
          break;
      }
    });
  }

  // ── Modal ──
  function openModal() {
    $('modal-overlay').classList.remove('hidden');
  }

  function closeModal() {
    $('modal-overlay').classList.add('hidden');
  }

  // ── Load playlist ──
  async function loadFromURL() {
    const url = $('playlist-url').value.trim();
    if (!url) {
      showToast('Please enter a playlist URL', 'error');
      return;
    }

    $('load-url-btn').innerHTML = '<span class="loading"></span>';
    $('load-url-btn').disabled = true;

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      processPlaylist(text);
      closeModal();
      showToast('Playlist loaded successfully', 'success');
    } catch (err) {
      showToast(`Failed to load: ${err.message}`, 'error');
    } finally {
      $('load-url-btn').textContent = 'Load';
      $('load-url-btn').disabled = false;
    }
  }

  function loadFromFile(e) {
    const file = e.target.files[0];
    if (file) readFile(file);
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      processPlaylist(e.target.result);
      closeModal();
      showToast(`Loaded ${file.name}`, 'success');
    };
    reader.onerror = () => showToast('Failed to read file', 'error');
    reader.readAsText(file);
  }

  function processPlaylist(text) {
    channels = M3UParser.parse(text);

    if (channels.length === 0) {
      showToast('No channels found in playlist', 'error');
      return;
    }

    // Populate categories
    const categories = M3UParser.getCategories(channels);
    const select = $('category-select');
    select.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    applyFilters();
  }

  // ── Filter & render ──
  function applyFilters() {
    const search = $('search-input').value.toLowerCase().trim();
    const category = $('category-select').value;
    const favIds = Favorites.getAll();

    filteredChannels = channels.filter((ch) => {
      if (showingFavorites && !favIds.includes(ch.id)) return false;
      if (category !== 'all' && ch.group !== category) return false;
      if (search && !ch.name.toLowerCase().includes(search)) return false;
      return true;
    });

    renderChannels();
    $('channel-count').textContent = `${filteredChannels.length} channel${filteredChannels.length !== 1 ? 's' : ''}`;
  }

  function renderChannels() {
    const list = $('channel-list');
    const currentChannel = Player.getCurrentChannel();
    const favIds = Favorites.getAll();

    if (filteredChannels.length === 0) {
      list.innerHTML = '<div class="empty-state">No channels found</div>';
      return;
    }

    list.innerHTML = filteredChannels.map((ch) => {
      const isActive = currentChannel && currentChannel.id === ch.id ? ' active' : '';
      const isFav = favIds.includes(ch.id);
      const logoContent = ch.logo
        ? `<img src="${escapeAttr(ch.logo)}" alt="" loading="lazy" onerror="this.parentElement.textContent='${escapeHTML(ch.name.charAt(0).toUpperCase())}';">`
        : ch.name.charAt(0).toUpperCase();

      return `
        <div class="channel-item${isActive}" data-id="${escapeAttr(ch.id)}">
          <div class="channel-logo">${logoContent}</div>
          <div class="channel-info">
            <div class="channel-name">${escapeHTML(ch.name)}</div>
            <div class="channel-category">${escapeHTML(ch.group)}</div>
          </div>
          ${isFav ? '<span class="channel-fav">★</span>' : ''}
        </div>
      `;
    }).join('');

    // Click handlers
    list.querySelectorAll('.channel-item').forEach((el) => {
      el.addEventListener('click', () => {
        const ch = filteredChannels.find(c => c.id === el.dataset.id);
        if (ch) {
          Player.play(ch);
          Cast.onChannelChange();
          renderChannels(); // Re-render to update active state
        }
      });
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Start ──
  document.addEventListener('DOMContentLoaded', init);
})();
