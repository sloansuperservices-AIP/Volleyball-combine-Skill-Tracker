/**
 * Leaderboard – persists session results in localStorage and renders the table.
 */

const STORAGE_KEY = 'vb_leaderboard_v2';

export class Leaderboard {
  constructor() {
    this._entries = this._load();
  }

  // ─────────────────────────────────────────────────────────────── Data ──

  addEntry(entry) {
    // entry: { player, station, stationId, score, duration, zones, date }
    const rec = {
      id:        `lb_${Date.now()}`,
      player:    entry.player    || 'Anonymous',
      station:   entry.station   || 'Unknown',
      stationId: entry.stationId || 'custom',
      score:     entry.score     || 0,
      duration:  entry.duration  || 0,
      zones:     entry.zones     || [],
      date:      entry.date      || new Date().toISOString(),
    };

    this._entries.unshift(rec);
    // Keep top 200
    if (this._entries.length > 200) this._entries.length = 200;
    this._save();
    return rec;
  }

  removeEntry(id) {
    this._entries = this._entries.filter(e => e.id !== id);
    this._save();
  }

  clearAll() {
    this._entries = [];
    this._save();
  }

  getEntries(stationId = null) {
    if (!stationId || stationId === 'all') return [...this._entries];
    return this._entries.filter(e => e.stationId === stationId);
  }

  getTopEntries(stationId, limit = 10) {
    return this.getEntries(stationId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ─────────────────────────────────────────────────────── Rendering ──

  /**
   * Render the leaderboard into a <tbody> element.
   * @param {HTMLElement} tbody
   * @param {string}      stationId  'all' or specific id
   */
  render(tbody, stationId = 'all') {
    const entries = this.getEntries(stationId)
      .sort((a, b) => b.score - a.score);

    tbody.innerHTML = '';

    if (!entries.length) return false;

    entries.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      tr.className = idx < 3 ? `lb-row lb-row--top${idx + 1}` : 'lb-row';

      const medal = ['🥇', '🥈', '🥉'][idx] || '';
      const date  = new Date(entry.date).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const dur   = this._formatDuration(entry.duration);

      tr.innerHTML = `
        <td class="lb-rank">${medal || idx + 1}</td>
        <td class="lb-player">${this._esc(entry.player)}</td>
        <td class="lb-station"><span class="station-tag">${this._esc(entry.station)}</span></td>
        <td class="lb-score">${entry.score}</td>
        <td class="lb-duration">${dur}</td>
        <td class="lb-date">${date}</td>
        <td class="lb-actions">
          <button class="btn btn--ghost btn--xs" data-id="${entry.id}">✕</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    return true;
  }

  /**
   * Populate a <select> with station filter options.
   */
  populateStationFilter(select) {
    const stationIds = [...new Set(this._entries.map(e => e.stationId))];
    // Keep existing 'all' option
    const existing = Array.from(select.options).map(o => o.value);

    stationIds.forEach(id => {
      if (!existing.includes(id)) {
        const label = this._entries.find(e => e.stationId === id)?.station || id;
        const opt   = document.createElement('option');
        opt.value   = id;
        opt.textContent = label;
        select.appendChild(opt);
      }
    });
  }

  // ─────────────────────────────────────────────────────── Persistence ──

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._entries));
    } catch { /* quota exceeded – silently skip */ }
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // ─────────────────────────────────────────────────────── Helpers ──

  _formatDuration(secs) {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
