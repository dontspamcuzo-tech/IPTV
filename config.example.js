/**
 * IPTV Player Configuration
 * Copy this file to config.js and fill in your credentials.
 * config.js is gitignored to protect your credentials.
 */
const IPTV_CONFIG = {
  // Xtream Codes / M3U provider settings
  server: 'http://your-server.com',
  username: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD',

  // Auto-load playlist on startup
  autoLoad: true,

  // Playlist format: 'm3u_plus' or 'm3u'
  format: 'm3u_plus',

  // Output type: 'ts' or 'mpegts'
  output: 'ts',
};
