/**
 * OverlayManager – canvas drawing tools for defining tracking zones.
 * Zones are always stored in NORMALIZED coordinates (0–1) so they survive
 * canvas resizes.  Rendering re-projects them each frame.
 *
 * Supported zone shapes:  circle | rect | polygon | line
 * Supported tools:        select | circle | rect | polygon | line | erase
 */

const HANDLE_R = 7;     // selection handle radius px
const HIT_R    = 10;    // hit-test tolerance px

export class OverlayManager {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {VideoManager}      videoManager
   */
  constructor(canvas, videoManager) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.vm     = videoManager;

    this.zones        = [];   // array of Zone objects
    this.activeTool   = 'circle';
    this.activeColor  = '#3b82f6';
    this.zoneLabel    = 'Zone';
    this.zoneRule     = 'enter';

    this._drawing     = false;
    this._draft       = null;   // zone being drawn
    this._selected    = null;   // selected zone id
    this._dragState   = null;   // { zoneId, handle, startPt }
    this._polyPoints  = [];     // in-progress polygon points (canvas coords)

    this._onZonesChanged = null;  // callback(zones)

    this._bindEvents();
  }

  // ─────────────────────────────────────────────────────── Public API ──

  setTool(tool)   { this.activeTool = tool;   this._cancelDraft(); }
  setColor(color) { this.activeColor = color; this._rerender(); }
  setLabel(label) { this.zoneLabel = label; }
  setRule(rule)   { this.zoneRule = rule; }

  onZonesChanged(fn) { this._onZonesChanged = fn; }

  clearAll() {
    this.zones    = [];
    this._draft   = null;
    this._selected = null;
    this._polyPoints = [];
    this._rerender();
    this._emitZones();
  }

  removeZone(id) {
    this.zones = this.zones.filter(z => z.id !== id);
    if (this._selected === id) this._selected = null;
    this._rerender();
    this._emitZones();
  }

  /**
   * Called by VideoManager when canvas is resized.  Zones stay in normalized
   * coords so nothing needs updating here – just redraw.
   */
  onCanvasResize() {
    this._rerender();
  }

  // ─────────────────────────────────────────────────────── Event Binding ──

  _bindEvents() {
    const c = this.canvas;

    c.addEventListener('mousedown',  e => this._onDown(e));
    c.addEventListener('mousemove',  e => this._onMove(e));
    c.addEventListener('mouseup',    e => this._onUp(e));
    c.addEventListener('mouseleave', e => this._onUp(e));
    c.addEventListener('dblclick',   e => this._onDblClick(e));

    // Touch support
    c.addEventListener('touchstart',  e => { e.preventDefault(); this._onDown(this._touchToMouse(e)); }, { passive: false });
    c.addEventListener('touchmove',   e => { e.preventDefault(); this._onMove(this._touchToMouse(e)); }, { passive: false });
    c.addEventListener('touchend',    e => { e.preventDefault(); this._onUp(this._touchToMouse(e));   }, { passive: false });
  }

  _touchToMouse(e) {
    const t = e.touches[0] || e.changedTouches[0];
    return { clientX: t.clientX, clientY: t.clientY, preventDefault: () => {} };
  }

  // ─────────────────────────────────────────────────────── Mouse Handlers ──

  _onDown(e) {
    const pt = this._eventToCanvas(e);

    if (this.activeTool === 'select') {
      this._trySelect(pt);
      if (this._selected) {
        this._dragState = { zoneId: this._selected, startPt: pt, handle: this._hitHandle(pt) };
      }
      return;
    }

    if (this.activeTool === 'erase') {
      const z = this._hitZone(pt);
      if (z) this.removeZone(z.id);
      return;
    }

    if (this.activeTool === 'polygon' || this.activeTool === 'line') {
      this._polyPoints.push(pt);
      this._rerender();
      return;
    }

    // circle / rect – start drag
    this._drawing  = true;
    this._draft    = { tool: this.activeTool, start: pt, end: pt };
  }

  _onMove(e) {
    const pt = this._eventToCanvas(e);

    // Update cursor
    this._updateCursor(pt);

    if (this._dragState && this._selected) {
      this._handleDrag(pt);
      return;
    }

    if (this._drawing && this._draft) {
      this._draft.end = pt;
      this._rerender();
      return;
    }

    if ((this.activeTool === 'polygon' || this.activeTool === 'line') && this._polyPoints.length > 0) {
      // Show rubber-band segment
      this._draft = { tool: this.activeTool, rubberbandPt: pt };
      this._rerender();
    }
  }

  _onUp(e) {
    if (this._dragState) {
      this._dragState = null;
      this._emitZones();
      return;
    }

    if (!this._drawing || !this._draft) return;
    this._drawing = false;

    const pt = this._eventToCanvas(e);
    this._draft.end = pt;

    const zone = this._draftToZone(this._draft);
    if (zone) {
      this.zones.push(zone);
      this._selected = zone.id;
      this._emitZones();
    }

    this._draft = null;
    this._rerender();
  }

  _onDblClick(e) {
    // Finish polygon / line on double-click
    if (this.activeTool === 'polygon' && this._polyPoints.length >= 3) {
      const zone = this._finishPolygon();
      if (zone) { this.zones.push(zone); this._selected = zone.id; this._emitZones(); }
    }
    if (this.activeTool === 'line' && this._polyPoints.length >= 2) {
      const zone = this._finishLine();
      if (zone) { this.zones.push(zone); this._selected = zone.id; this._emitZones(); }
    }
    this._polyPoints = [];
    this._draft = null;
    this._rerender();
  }

  // ─────────────────────────────────────────────────────── Draft → Zone ──

  _draftToZone(draft) {
    const { start, end } = draft;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return null;  // too small

    const w = this.canvas.width;
    const h = this.canvas.height;

    if (draft.tool === 'circle') {
      const cx = (start.x + end.x) / 2 / w;
      const cy = (start.y + end.y) / 2 / h;
      const rx = Math.abs(dx) / 2 / w;
      const ry = Math.abs(dy) / 2 / h;
      return this._makeZone('circle', { cx, cy, rx, ry });
    }

    if (draft.tool === 'rect') {
      const x = Math.min(start.x, end.x) / w;
      const y = Math.min(start.y, end.y) / h;
      const rw = Math.abs(dx) / w;
      const rh = Math.abs(dy) / h;
      return this._makeZone('rect', { x, y, w: rw, h: rh });
    }

    return null;
  }

  _finishPolygon() {
    const pts = this._polyPoints.map(p => ({ x: p.x / this.canvas.width, y: p.y / this.canvas.height }));
    return this._makeZone('polygon', { points: pts });
  }

  _finishLine() {
    const pts = this._polyPoints.map(p => ({ x: p.x / this.canvas.width, y: p.y / this.canvas.height }));
    return this._makeZone('line', { points: pts });
  }

  _makeZone(shape, data) {
    return {
      id:    `zone_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      shape,
      label: this.zoneLabel || shape,
      rule:  this.zoneRule,
      color: this.activeColor,
      count: 0,
      data,
    };
  }

  // ─────────────────────────────────────────────────────── Rendering ──

  render() { this._rerender(); }

  _rerender() {
    const ctx = this.ctx;
    const cw  = this.canvas.width;
    const ch  = this.canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Draw committed zones
    for (const zone of this.zones) {
      this._drawZone(ctx, zone, zone.id === this._selected);
    }

    // Draw in-progress draft
    if (this._draft) {
      this._drawDraft(ctx);
    }

    // Draw polygon-in-progress points
    if ((this.activeTool === 'polygon' || this.activeTool === 'line') && this._polyPoints.length > 0) {
      this._drawPolyProgress(ctx);
    }
  }

  _drawZone(ctx, zone, selected) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const alpha = selected ? 0.35 : 0.18;

    ctx.save();
    ctx.strokeStyle = zone.color;
    ctx.lineWidth   = selected ? 3 : 2;
    ctx.fillStyle   = zone.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.setLineDash(selected ? [] : [6, 3]);

    if (zone.shape === 'circle') {
      const { cx, cy, rx, ry } = zone.data;
      const px = cx * cw, py = cy * ch;
      const prx = rx * cw, pry = ry * ch;

      ctx.beginPath();
      ctx.ellipse(px, py, prx, pry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label
      this._drawZoneLabel(ctx, zone, px, py - pry - 8);

      // Selection handles
      if (selected) {
        this._drawHandle(ctx, zone.color, px + prx, py);
        this._drawHandle(ctx, zone.color, px - prx, py);
        this._drawHandle(ctx, zone.color, px, py + pry);
        this._drawHandle(ctx, zone.color, px, py - pry);
        this._drawHandle(ctx, zone.color, px, py);  // center
      }
    }

    else if (zone.shape === 'rect') {
      const { x, y, w, h } = zone.data;
      const px = x * cw, py = y * ch;
      const pw = w * cw, ph = h * ch;

      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.fill();
      ctx.stroke();

      this._drawZoneLabel(ctx, zone, px + pw / 2, py - 8);

      if (selected) {
        // Corners + midpoints
        [[px, py], [px + pw, py], [px + pw, py + ph], [px, py + ph],
         [px + pw / 2, py], [px + pw, py + ph / 2], [px + pw / 2, py + ph], [px, py + ph / 2]
        ].forEach(([hx, hy]) => this._drawHandle(ctx, zone.color, hx, hy));
      }
    }

    else if (zone.shape === 'polygon') {
      const pts = zone.data.points;
      if (pts.length < 2) { ctx.restore(); return; }

      ctx.beginPath();
      ctx.moveTo(pts[0].x * cw, pts[0].y * ch);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * cw, pts[i].y * ch);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length * cw;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length * ch;
      this._drawZoneLabel(ctx, zone, cx, cy);

      if (selected) pts.forEach(p => this._drawHandle(ctx, zone.color, p.x * cw, p.y * ch));
    }

    else if (zone.shape === 'line') {
      const pts = zone.data.points;
      if (pts.length < 2) { ctx.restore(); return; }

      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x * cw, pts[0].y * ch);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * cw, pts[i].y * ch);
      ctx.stroke();

      const mx = (pts[0].x + pts[pts.length - 1].x) / 2 * cw;
      const my = (pts[0].y + pts[pts.length - 1].y) / 2 * ch;
      this._drawZoneLabel(ctx, zone, mx, my - 10);

      if (selected) pts.forEach(p => this._drawHandle(ctx, zone.color, p.x * cw, p.y * ch));
    }

    // Count badge on zone
    this._drawCountBadge(ctx, zone, cw, ch);

    ctx.restore();
  }

  _drawZoneLabel(ctx, zone, x, y) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const txt = zone.label;
    const tw  = ctx.measureText(txt).width;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - tw / 2 - 4, y - 16, tw + 8, 18);

    ctx.fillStyle = '#fff';
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  _drawCountBadge(ctx, zone, cw, ch) {
    let bx, by;

    if (zone.shape === 'circle') {
      bx = zone.data.cx * cw + zone.data.rx * cw;
      by = zone.data.cy * ch - zone.data.ry * ch;
    } else if (zone.shape === 'rect') {
      bx = (zone.data.x + zone.data.w) * cw;
      by = zone.data.y * ch;
    } else if (zone.shape === 'polygon' || zone.shape === 'line') {
      const pts = zone.data.points;
      bx = Math.max(...pts.map(p => p.x)) * cw;
      by = Math.min(...pts.map(p => p.y)) * ch;
    } else {
      return;
    }

    ctx.save();
    ctx.setLineDash([]);
    const r = 14;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = zone.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle   = '#fff';
    ctx.font        = `bold ${zone.count > 99 ? 9 : 11}px system-ui`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(zone.count), bx, by);
    ctx.restore();
  }

  _drawHandle(ctx, color, x, y) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle   = '#fff';
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(x, y, HANDLE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawDraft(ctx) {
    if (!this._draft) return;
    const { start, end, rubberbandPt } = this._draft;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.save();
    ctx.strokeStyle = this.activeColor;
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillStyle   = this.activeColor + '33';

    if (this._draft.tool === 'circle' && start && end) {
      const px  = (start.x + end.x) / 2;
      const py  = (start.y + end.y) / 2;
      const prx = Math.abs(end.x - start.x) / 2;
      const pry = Math.abs(end.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(px, py, prx, pry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (this._draft.tool === 'rect' && start && end) {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
    }

    // Rubber-band for polygon / line
    if (rubberbandPt && this._polyPoints.length > 0) {
      const last = this._polyPoints[this._polyPoints.length - 1];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(rubberbandPt.x, rubberbandPt.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawPolyProgress(ctx) {
    ctx.save();
    ctx.strokeStyle = this.activeColor;
    ctx.fillStyle   = this.activeColor + '44';
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 3]);

    ctx.beginPath();
    ctx.moveTo(this._polyPoints[0].x, this._polyPoints[0].y);
    for (let i = 1; i < this._polyPoints.length; i++) {
      ctx.lineTo(this._polyPoints[i].x, this._polyPoints[i].y);
    }
    ctx.stroke();

    this._polyPoints.forEach(p => this._drawHandle(ctx, this.activeColor, p.x, p.y));

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────── Hit Testing ──

  _hitZone(pt) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      if (this._pointInZone(pt, z, cw, ch)) return z;
    }
    return null;
  }

  _hitHandle(pt) {
    if (!this._selected) return null;
    const z = this.zones.find(z => z.id === this._selected);
    if (!z) return null;
    // (simplified – returns 'body' for now)
    return 'body';
  }

  _trySelect(pt) {
    const hit = this._hitZone(pt);
    this._selected = hit ? hit.id : null;
    this._rerender();
  }

  /**
   * Called each tracker frame to test whether a point (canvas coords) is
   * inside a zone.  Used by VisionTracker.
   */
  pointInZone(zone, canvasX, canvasY) {
    return this._pointInZone({ x: canvasX, y: canvasY }, zone, this.canvas.width, this.canvas.height);
  }

  _pointInZone(pt, zone, cw, ch) {
    const d = zone.data;

    if (zone.shape === 'circle') {
      const dx = (pt.x / cw - d.cx) / d.rx;
      const dy = (pt.y / ch - d.cy) / d.ry;
      return dx * dx + dy * dy <= 1;
    }

    if (zone.shape === 'rect') {
      const nx = pt.x / cw, ny = pt.y / ch;
      return nx >= d.x && nx <= d.x + d.w && ny >= d.y && ny <= d.y + d.h;
    }

    if (zone.shape === 'polygon') {
      return this._pointInPolygon(pt.x / cw, pt.y / ch, d.points);
    }

    return false;
  }

  _pointInPolygon(px, py, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y;
      const xj = pts[j].x, yj = pts[j].y;
      const intersect = ((yi > py) !== (yj > py)) &&
                        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // ─────────────────────────────────────────────────────── Drag ──

  _handleDrag(pt) {
    if (!this._dragState) return;
    const z = this.zones.find(z => z.id === this._dragState.zoneId);
    if (!z) return;

    const dx = (pt.x - this._dragState.startPt.x) / this.canvas.width;
    const dy = (pt.y - this._dragState.startPt.y) / this.canvas.height;

    if (z.shape === 'circle') {
      z.data.cx += dx;
      z.data.cy += dy;
    } else if (z.shape === 'rect') {
      z.data.x += dx;
      z.data.y += dy;
    } else if (z.shape === 'polygon' || z.shape === 'line') {
      z.data.points.forEach(p => { p.x += dx; p.y += dy; });
    }

    this._dragState.startPt = pt;
    this._rerender();
  }

  // ─────────────────────────────────────────────────────── Helpers ──

  _eventToCanvas(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  _cancelDraft() {
    this._drawing    = false;
    this._draft      = null;
    this._polyPoints = [];
    this._rerender();
  }

  _updateCursor(pt) {
    const cursors = {
      select:  'default',
      circle:  'crosshair',
      rect:    'crosshair',
      polygon: 'crosshair',
      line:    'crosshair',
      erase:   'not-allowed',
    };
    this.canvas.style.cursor = cursors[this.activeTool] || 'default';
  }

  _emitZones() {
    if (this._onZonesChanged) this._onZonesChanged([...this.zones]);
  }

  // ─────────────────────────────────────────────────────── Zone Count ──

  incrementZoneCount(zoneId) {
    const z = this.zones.find(z => z.id === zoneId);
    if (z) {
      z.count++;
      this._rerender();
    }
  }

  resetCounts() {
    this.zones.forEach(z => z.count = 0);
    this._rerender();
  }

  getTotalCount() {
    return this.zones.reduce((s, z) => s + z.count, 0);
  }
}
