/**
 * Favorites manager using localStorage.
 */
const Favorites = {
  _key: 'iptv_favorites',

  _load() {
    try {
      return JSON.parse(localStorage.getItem(this._key)) || [];
    } catch {
      return [];
    }
  },

  _save(ids) {
    localStorage.setItem(this._key, JSON.stringify(ids));
  },

  /**
   * Check if a channel is in favorites.
   * @param {string} id
   * @returns {boolean}
   */
  isFavorite(id) {
    return this._load().includes(id);
  },

  /**
   * Toggle a channel's favorite status.
   * @param {string} id
   * @returns {boolean} New favorite state
   */
  toggle(id) {
    const favs = this._load();
    const idx = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
    } else {
      favs.splice(idx, 1);
    }
    this._save(favs);
    return idx === -1;
  },

  /**
   * Get all favorite IDs.
   * @returns {string[]}
   */
  getAll() {
    return this._load();
  }
};
