/**
 * StationManager – defines skill station configurations and rule enforcement.
 *
 * Each station declares:
 *   - Default zones to suggest to the user
 *   - Scoring logic
 *   - Display rules / hints
 */

export const STATIONS = {
  setting: {
    id:    'setting',
    name:  'Setting Station',
    description: 'Count each time a set ball passes through the target zone.',
    icon:  '🏐',
    defaultZones: [
      {
        shape: 'circle',
        label: 'Setting Target',
        rule:  'enter',
        color: '#3b82f6',
        data:  { cx: 0.5, cy: 0.35, rx: 0.12, ry: 0.12 },
      }
    ],
    scoringHint: 'Each entry = 1 point. Aim for consistency!',
    ballColorHint: 'yellow',
    detectionMode: 'combined',
  },

  serving: {
    id:    'serving',
    name:  'Serving Station',
    description: 'Count serves that land in the target court zone.',
    icon:  '💪',
    defaultZones: [
      {
        shape: 'rect',
        label: 'Target Zone',
        rule:  'enter',
        color: '#22c55e',
        data:  { x: 0.55, y: 0.55, w: 0.35, h: 0.35 },
      }
    ],
    scoringHint: 'Serve into the target zone to score.',
    ballColorHint: 'white',
    detectionMode: 'combined',
  },

  passing: {
    id:    'passing',
    name:  'Passing Station',
    description: 'Track passes that reach the target setter zone.',
    icon:  '🤝',
    defaultZones: [
      {
        shape: 'circle',
        label: 'Setter Zone',
        rule:  'enter',
        color: '#f59e0b',
        data:  { cx: 0.5, cy: 0.3, rx: 0.15, ry: 0.10 },
      }
    ],
    scoringHint: 'Each accurate pass to the setter zone scores a point.',
    ballColorHint: 'yellow',
    detectionMode: 'combined',
  },

  hitting: {
    id:    'hitting',
    name:  'Hitting Station',
    description: 'Count successful hits that cross the net line.',
    icon:  '⚡',
    defaultZones: [
      {
        shape: 'line',
        label: 'Net Line',
        rule:  'cross',
        color: '#ef4444',
        data:  { points: [{ x: 0.1, y: 0.45 }, { x: 0.9, y: 0.45 }] },
      },
      {
        shape: 'rect',
        label: 'Court Target',
        rule:  'enter',
        color: '#a855f7',
        data:  { x: 0.5, y: 0.55, w: 0.4, h: 0.35 },
      }
    ],
    scoringHint: 'Score when the ball crosses the net AND lands in target.',
    ballColorHint: 'yellow',
    detectionMode: 'motion',
  },

  custom: {
    id:    'custom',
    name:  'Custom Station',
    description: 'Define your own zones and counting rules.',
    icon:  '⚙️',
    defaultZones: [],
    scoringHint:  'Draw zones and select rules on the right panel.',
    ballColorHint: 'yellow',
    detectionMode: 'combined',
  },
};

export class StationManager {
  constructor() {
    this._current = STATIONS.setting;
  }

  get current()     { return this._current; }
  get stationList() { return Object.values(STATIONS); }

  setStation(id) {
    this._current = STATIONS[id] || STATIONS.custom;
    return this._current;
  }

  /**
   * Build ready-to-use zone objects with IDs from the station's default zones.
   */
  buildDefaultZones() {
    return this._current.defaultZones.map(z => ({
      ...z,
      id:    `zone_default_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      count: 0,
    }));
  }

  getRulesHTML() {
    const s = this._current;
    return `
      <div class="rule-card">
        <span class="rule-card__icon">${s.icon}</span>
        <p class="rule-card__name">${s.name}</p>
        <p class="rule-card__desc">${s.description}</p>
        <p class="rule-card__hint"><strong>Scoring:</strong> ${s.scoringHint}</p>
      </div>
    `;
  }
}
