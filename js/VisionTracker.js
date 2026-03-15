/**
 * VisionTracker – real-time volleyball detection and zone-entry counting.
 *
 * Detection strategies (selectable):
 *   color    – HSV colour filter tuned to volleyball colours
 *   motion   – frame-differencing to find moving blobs
 *   combined – colour × motion intersection (best accuracy)
 *
 * The tracker runs on every video frame via requestAnimationFrame (driven by
 * VideoManager.onFrame). It writes annotated output to the tracking canvas
 * and calls back into OverlayManager when zone crossings are detected.
 */

// Volleyball colour presets (Hue 0–360 scale for readability; converted below)
const COLOR_PRESETS = {
  yellow:      { hMin: 35,  hMax: 75,  sMin: 80,  vMin: 80  },
  white:       { hMin: 0,   hMax: 360, sMin: 0,   vMin: 180 },
  'blue-white':{ hMin: 180, hMax: 260, sMin: 30,  vMin: 100 },
  orange:      { hMin: 10,  hMax: 35,  sMin: 100, vMin: 80  },
};

export class VisionTracker {
  /**
   * @param {HTMLCanvasElement}  trackingCanvas  – offscreen annotation layer
   * @param {VideoManager}       videoManager
   * @param {OverlayManager}     overlayManager
   * @param {object}             options
   */
  constructor(trackingCanvas, videoManager, overlayManager, options = {}) {
    this.canvas  = trackingCanvas;
    this.ctx     = trackingCanvas.getContext('2d');
    this.vm      = videoManager;
    this.om      = overlayManager;

    // ─── Config ───────────────────────────────────────────────────────────
    this.mode       = options.mode      || 'combined';   // color|motion|combined
    this.colorPreset = options.colorPreset || 'yellow';
    this.minRadius  = options.minRadius  || 10;
    this.maxRadius  = options.maxRadius  || 60;
    this.showDetection = true;
    this.showTrail  = true;

    // Custom HSV overrides
    this.customHSV = null;

    // ─── State ────────────────────────────────────────────────────────────
    this.active       = false;
    this.prevFrame    = null;   // ImageData for motion diff
    this.detections   = [];     // [{x,y,r}] last N frames
    this.trail        = [];     // [{x,y,ts}] for trajectory drawing
    this.MAX_TRAIL    = 30;

    // Zone crossing state: Map<zoneId, boolean> – was ball inside last frame?
    this._prevInside  = new Map();
    // Cooldown: Map<zoneId, timestamp> – min ms between counts
    this._cooldown    = new Map();
    this.COOLDOWN_MS  = 600;

    // ─── Perf metrics ─────────────────────────────────────────────────────
    this._fps         = 0;
    this._lastTs      = 0;
    this._frameCount  = 0;

    // Offscreen scratch canvases
    this._scratch1 = document.createElement('canvas');
    this._scratch2 = document.createElement('canvas');

    // Callbacks
    this.onDetection = null;   // ({x,y,r,inZones}) => void
    this.onCount     = null;   // (zone, total) => void
    this.onFPS       = null;   // (fps) => void
  }

  // ─────────────────────────────────────────────────────────── Public API ──

  start() { this.active = true; this.prevFrame = null; this.trail = []; }
  stop()  { this.active = false; this._clearCanvas(); }

  setMode(mode)        { this.mode = mode; }
  setColorPreset(name) { this.colorPreset = name; this.customHSV = null; }
  setCustomHSV(hsv)    { this.customHSV = hsv; }
  setMinRadius(r)      { this.minRadius = r; }
  setMaxRadius(r)      { this.maxRadius = r; }

  /**
   * Called every animation frame by VideoManager.
   * @param {HTMLVideoElement} video
   * @param {HTMLCanvasElement} canvas  (same as this.canvas)
   * @param {number} timestamp  (DOMHighResTimeStamp)
   */
  processFrame(video, canvas, timestamp) {
    if (!this.active) return;
    if (video.readyState < 2) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (!cw || !ch) return;

    // ── FPS counter ────────────────────────────────────────────────────────
    this._frameCount++;
    if (timestamp - this._lastTs >= 1000) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._lastTs = timestamp;
      if (this.onFPS) this.onFPS(this._fps);
    }

    // ── Capture current frame into scratch canvas ──────────────────────────
    const s1 = this._scratch1;
    s1.width  = cw;
    s1.height = ch;
    const s1ctx = s1.getContext('2d');
    s1ctx.drawImage(video, 0, 0, cw, ch);

    const currData = s1ctx.getImageData(0, 0, cw, ch);

    // ── Build detection mask ───────────────────────────────────────────────
    let mask;
    if (this.mode === 'color') {
      mask = this._colorMask(currData);
    } else if (this.mode === 'motion') {
      mask = this._motionMask(currData);
    } else {
      // combined: AND of both masks
      const cm = this._colorMask(currData);
      const mm = this._motionMask(currData);
      mask = new Uint8Array(cw * ch);
      for (let i = 0; i < mask.length; i++) mask[i] = cm[i] & mm[i];
    }

    this.prevFrame = currData;

    // ── Find largest connected blob (simple bounding circle) ──────────────
    const blob = this._findBestBlob(mask, cw, ch);

    // ── Clear overlay ─────────────────────────────────────────────────────
    this._clearCanvas();

    if (blob) {
      const { x, y, r } = blob;

      // ── Trail ────────────────────────────────────────────────────────────
      this.trail.push({ x, y, ts: timestamp });
      if (this.trail.length > this.MAX_TRAIL) this.trail.shift();

      // ── Zone crossing detection ───────────────────────────────────────────
      const zones = this.om.zones;
      const inZones = [];

      for (const zone of zones) {
        const nowInside = this.om.pointInZone(zone, x, y);
        const wasInside = this._prevInside.get(zone.id) || false;

        if (zone.rule === 'enter' && nowInside && !wasInside) {
          this._triggerCount(zone, timestamp);
        } else if (zone.rule === 'exit' && !nowInside && wasInside) {
          this._triggerCount(zone, timestamp);
        } else if (zone.rule === 'dwell' && nowInside) {
          // dwell: count once per COOLDOWN_MS while ball remains
          this._triggerCount(zone, timestamp);
        }
        // 'cross' handled by line intersection below
        if (zone.rule === 'cross') {
          if (wasInside !== nowInside) this._triggerCount(zone, timestamp);
        }

        this._prevInside.set(zone.id, nowInside);
        if (nowInside) inZones.push(zone.id);
      }

      // ── Draw detection ───────────────────────────────────────────────────
      if (this.showDetection) this._drawDetection(x, y, r, inZones.length > 0);
      if (this.showTrail)     this._drawTrail();

      if (this.onDetection) this.onDetection({ x, y, r, inZones });
    } else {
      // No ball – keep prevInside state for smooth exit detection
      this.trail = [];
    }
  }

  // ─────────────────────────────────────────────────────── Color Mask ──
  _colorMask(imgData) {
    const { data, width: w, height: h } = imgData;
    const mask = new Uint8Array(w * h);
    const preset = this.customHSV || COLOR_PRESETS[this.colorPreset] || COLOR_PRESETS.yellow;

    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const [hue, sat, val] = this._rgbToHsv(r, g, b);

      let hMatch;
      if (preset.hMin <= preset.hMax) {
        hMatch = hue >= preset.hMin && hue <= preset.hMax;
      } else {
        // Wrap-around (e.g. red hues 340–20)
        hMatch = hue >= preset.hMin || hue <= preset.hMax;
      }

      mask[i] = (hMatch && sat >= preset.sMin && val >= preset.vMin) ? 1 : 0;
    }
    return mask;
  }

  _rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d   = max - min;
    let h = 0;
    if (d > 0) {
      if      (max === r) h = ((g - b) / d % 6) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else                h = ((r - g) / d + 4) * 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : (d / max) * 255;
    const v = max * 255;
    return [h, s, v];
  }

  // ─────────────────────────────────────────────────────── Motion Mask ──
  _motionMask(imgData) {
    const { data, width: w, height: h } = imgData;
    const mask = new Uint8Array(w * h);
    if (!this.prevFrame) return mask;

    const prev = this.prevFrame.data;
    const THRESH = 30;

    for (let i = 0; i < w * h; i++) {
      const pi = i * 4;
      const dr = Math.abs(data[pi]   - prev[pi]);
      const dg = Math.abs(data[pi+1] - prev[pi+1]);
      const db = Math.abs(data[pi+2] - prev[pi+2]);
      mask[i] = (dr + dg + db > THRESH) ? 1 : 0;
    }

    return this._erode(this._dilate(mask, w, h, 2), w, h, 1);
  }

  // ─────────────────────────────────────────── Morphological Ops ──────
  _dilate(mask, w, h, r) {
    const out = new Uint8Array(w * h);
    for (let y = r; y < h - r; y++) {
      for (let x = r; x < w - r; x++) {
        let found = false;
        outer: for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (mask[(y + dy) * w + (x + dx)]) { found = true; break outer; }
          }
        }
        out[y * w + x] = found ? 1 : 0;
      }
    }
    return out;
  }

  _erode(mask, w, h, r) {
    const out = new Uint8Array(w * h);
    for (let y = r; y < h - r; y++) {
      for (let x = r; x < w - r; x++) {
        let all = true;
        outer: for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (!mask[(y + dy) * w + (x + dx)]) { all = false; break outer; }
          }
        }
        out[y * w + x] = all ? 1 : 0;
      }
    }
    return out;
  }

  // ─────────────────────────────────────────────────────── Blob Finding ──
  /**
   * Simple connected-components via flood-fill on a downsampled grid.
   * Returns the blob closest to a volleyball (circular, in radius range).
   */
  _findBestBlob(mask, w, h) {
    // Downsample 4× for speed
    const SCALE = 4;
    const dw = Math.floor(w / SCALE);
    const dh = Math.floor(h / SCALE);
    const down = new Uint8Array(dw * dh);

    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        // Check if any pixel in the SCALE×SCALE block is set
        let found = false;
        for (let dy = 0; dy < SCALE && !found; dy++) {
          for (let dx = 0; dx < SCALE && !found; dx++) {
            if (mask[(y * SCALE + dy) * w + (x * SCALE + dx)]) found = true;
          }
        }
        down[y * dw + x] = found ? 1 : 0;
      }
    }

    // Find connected components with BFS
    const visited = new Uint8Array(dw * dh);
    const blobs   = [];

    for (let i = 0; i < dw * dh; i++) {
      if (!down[i] || visited[i]) continue;

      const queue = [i];
      visited[i] = 1;
      let minX = dw, maxX = 0, minY = dh, maxY = 0, count = 0;

      while (queue.length) {
        const idx = queue.pop();
        const px  = idx % dw;
        const py  = Math.floor(idx / dw);
        count++;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;

        const neighbors = [
          idx - 1, idx + 1, idx - dw, idx + dw,
        ];
        for (const n of neighbors) {
          if (n >= 0 && n < dw * dh && down[n] && !visited[n]) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }

      // Scale back to full resolution
      const cx = ((minX + maxX) / 2) * SCALE;
      const cy = ((minY + maxY) / 2) * SCALE;
      const rw = ((maxX - minX + 1) * SCALE) / 2;
      const rh = ((maxY - minY + 1) * SCALE) / 2;
      const r  = (rw + rh) / 2;

      blobs.push({ x: cx, y: cy, r, rw, rh, area: count });
    }

    // Filter by radius
    const valid = blobs.filter(b =>
      b.r >= this.minRadius && b.r <= this.maxRadius
    );

    if (!valid.length) return null;

    // Pick blob with highest area (most pixels) that passes circularity
    valid.sort((a, b) => b.area - a.area);

    // Prefer round blobs: circularity = area / (π r²) close to 1
    const best = valid.find(b => {
      const circ = b.area / (Math.PI * b.r * b.r / (SCALE * SCALE));
      return circ > 0.3;
    }) || valid[0];

    return best;
  }

  // ─────────────────────────────────────────────────────── Zone Trigger ──
  _triggerCount(zone, ts) {
    const lastTs = this._cooldown.get(zone.id) || 0;
    if (ts - lastTs < this.COOLDOWN_MS) return;

    this._cooldown.set(zone.id, ts);
    this.om.incrementZoneCount(zone.id);

    if (this.onCount) this.onCount(zone, this.om.getTotalCount());
  }

  // ─────────────────────────────────────────────────────── Drawing ──
  _drawDetection(x, y, r, inZone) {
    const ctx = this.ctx;
    ctx.save();

    // Outer glow
    const grad = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.6);
    grad.addColorStop(0, inZone ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Detection circle
    ctx.strokeStyle = inZone ? '#22c55e' : '#3b82f6';
    ctx.lineWidth   = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Cross-hair
    ctx.strokeStyle = inZone ? '#22c55e' : '#3b82f6';
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x - r - 8, y); ctx.lineTo(x + r + 8, y);
    ctx.moveTo(x, y - r - 8); ctx.lineTo(x, y + r + 8);
    ctx.stroke();

    // Label
    ctx.setLineDash([]);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`(${Math.round(x)}, ${Math.round(y)})`, x + r + 4, y - 4);

    ctx.restore();
  }

  _drawTrail() {
    if (this.trail.length < 2) return;
    const ctx = this.ctx;
    ctx.save();

    for (let i = 1; i < this.trail.length; i++) {
      const alpha = i / this.trail.length;
      const { x: x1, y: y1 } = this.trail[i - 1];
      const { x: x2, y: y2 } = this.trail[i];

      ctx.strokeStyle = `rgba(251,191,36,${alpha * 0.8})`;
      ctx.lineWidth   = alpha * 3;
      ctx.lineCap     = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  _clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ─────────────────────────────────────────────────────── State reset ──
  reset() {
    this.trail      = [];
    this.prevFrame  = null;
    this._prevInside.clear();
    this._cooldown.clear();
    this._clearCanvas();
  }

  get fps() { return this._fps; }
}
