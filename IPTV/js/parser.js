/**
 * M3U/M3U8 playlist parser.
 * Parses EXTINF entries into channel objects.
 */
const M3UParser = {
  /**
   * Parse raw M3U text into an array of channel objects.
   * @param {string} text - Raw M3U playlist content
   * @returns {Array<{name: string, url: string, logo: string, group: string, id: string}>}
   */
  parse(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const channels = [];

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXTINF:')) continue;

      const info = lines[i];
      const url = lines[i + 1];

      if (!url || url.startsWith('#')) continue;

      const name = this._extractName(info);
      const logo = this._extractAttr(info, 'tvg-logo');
      const group = this._extractAttr(info, 'group-title') || 'Uncategorized';
      const id = this._extractAttr(info, 'tvg-id') || this._slugify(name);

      channels.push({ name, url, logo, group, id });
    }

    return channels;
  },

  /**
   * Extract the display name from an EXTINF line (text after the last comma).
   */
  _extractName(line) {
    const commaIdx = line.lastIndexOf(',');
    return commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : 'Unknown';
  },

  /**
   * Extract an attribute value from an EXTINF line.
   * e.g., tvg-logo="http://..." -> "http://..."
   */
  _extractAttr(line, attr) {
    const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
    const match = line.match(regex);
    return match ? match[1] : '';
  },

  /**
   * Create a URL-safe slug from a name.
   */
  _slugify(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },

  /**
   * Extract unique categories from a list of channels.
   * @param {Array} channels
   * @returns {string[]}
   */
  getCategories(channels) {
    const cats = new Set(channels.map(c => c.group));
    return Array.from(cats).sort();
  }
};
