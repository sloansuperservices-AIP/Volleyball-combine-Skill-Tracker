/**
 * VideoManager – handles video upload, webcam, playback, and the critical
 * canvas-to-video alignment that keeps overlays pixel-perfect regardless of
 * container size or video aspect ratio.
 */
export class VideoManager {
  /**
   * @param {HTMLVideoElement} videoEl
   * @param {HTMLElement}      container   – the .video-container div
   * @param {HTMLCanvasElement} overlayCanvas
   * @param {HTMLCanvasElement} trackingCanvas
   * @param {object}           callbacks
   *   onReady(videoEl)          – video metadata loaded and canvas sized
   *   onFrame(videoEl, canvas)  – called each animation frame while playing
   *   onEnded()
   *   onError(msg)
   */
  constructor(videoEl, container, overlayCanvas, trackingCanvas, callbacks = {}) {
    this.video          = videoEl;
    this.container      = container;
    this.overlayCanvas  = overlayCanvas;
    this.trackingCanvas = trackingCanvas;
    this.cb             = callbacks;

    this._animFrame   = null;
    this._source      = null; // 'upload' | 'webcam'
    this._webcamStream = null;
    this._resizeObserver = null;

    this._bindVideoEvents();
    this._bindResizeObserver();
  }

  // ─────────────────────────────────────────────────────────── Video Events ──

  _bindVideoEvents() {
    const v = this.video;

    v.addEventListener('loadedmetadata', () => {
      this._syncCanvasSize();
      if (this.cb.onReady) this.cb.onReady(v);
    });

    v.addEventListener('play', () => this._startFrameLoop());
    v.addEventListener('pause', () => this._stopFrameLoop());
    v.addEventListener('ended', () => {
      this._stopFrameLoop();
      if (this.cb.onEnded) this.cb.onEnded();
    });

    v.addEventListener('error', () => {
      const msg = v.error ? v.error.message : 'Unknown video error';
      if (this.cb.onError) this.cb.onError(msg);
    });

    v.addEventListener('timeupdate', () => {
      if (this.cb.onTimeUpdate) this.cb.onTimeUpdate(v.currentTime, v.duration);
    });
  }

  // ──────────────────────────────────────────────────── Canvas Size Sync ─────
  /**
   * THE KEY FIX: align overlay canvas exactly to the rendered video frame.
   *
   * The <video> element may have a different aspect ratio than its container.
   * With object-fit:contain the browser letterboxes / pillarboxes the frame.
   * We must position the canvas over only the rendered frame, not the black bars.
   */
  _syncCanvasSize() {
    const v   = this.video;
    const con = this.container;

    if (!v.videoWidth || !v.videoHeight) return;

    const conRect   = con.getBoundingClientRect();
    const conW      = conRect.width;
    const conH      = conRect.height;
    const vidAspect = v.videoWidth / v.videoHeight;
    const conAspect = conW / conH;

    let rendW, rendH, offX, offY;

    if (vidAspect > conAspect) {
      // Video is wider → letterbox (black bars top/bottom)
      rendW = conW;
      rendH = conW / vidAspect;
      offX  = 0;
      offY  = (conH - rendH) / 2;
    } else {
      // Video is taller → pillarbox (black bars left/right)
      rendH = conH;
      rendW = conH * vidAspect;
      offX  = (conW - rendW) / 2;
      offY  = 0;
    }

    // Store for coordinate transforms used by OverlayManager & VisionTracker
    this.renderedRect = { x: offX, y: offY, width: rendW, height: rendH };

    // Size both canvases identically to the rendered video frame
    const applyToCanvas = (canvas) => {
      canvas.width         = Math.round(rendW);
      canvas.height        = Math.round(rendH);
      canvas.style.width   = `${rendW}px`;
      canvas.style.height  = `${rendH}px`;
      canvas.style.left    = `${offX}px`;
      canvas.style.top     = `${offY}px`;
      canvas.style.display = 'block';
    };

    applyToCanvas(this.overlayCanvas);
    applyToCanvas(this.trackingCanvas);

    if (this.cb.onResize) this.cb.onResize(this.renderedRect);
  }

  _bindResizeObserver() {
    if (!window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      if (this.video.videoWidth) this._syncCanvasSize();
    });
    this._resizeObserver.observe(this.container);
  }

  // ──────────────────────────────────────────────────────────── Frame Loop ──

  _startFrameLoop() {
    const loop = (ts) => {
      if (this.cb.onFrame) this.cb.onFrame(this.video, this.trackingCanvas, ts);
      this._animFrame = requestAnimationFrame(loop);
    };
    this._animFrame = requestAnimationFrame(loop);
  }

  _stopFrameLoop() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  // ─────────────────────────────────────────────────────── Public: Upload ──

  loadFile(file) {
    this._stopWebcam();
    this._source = 'upload';

    const url = URL.createObjectURL(file);
    this.video.src = url;
    this.video.load();

    // Clean up old object URL on next load
    this.video.addEventListener('loadedmetadata', () => {
      // keep reference for cleanup
      this._objectURL = url;
    }, { once: true });
  }

  clearVideo() {
    this._stopFrameLoop();
    this.video.pause();
    this.video.src = '';
    this.video.load();

    if (this._objectURL) {
      URL.revokeObjectURL(this._objectURL);
      this._objectURL = null;
    }

    this._clearCanvases();
    this.renderedRect = null;
  }

  // ─────────────────────────────────────────────────────── Public: Webcam ──

  async startWebcam(deviceId = null) {
    this._source = 'webcam';
    const constraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this._webcamStream = stream;
      this.video.srcObject = stream;
      await this.video.play();
      return true;
    } catch (err) {
      if (this.cb.onError) this.cb.onError(`Camera error: ${err.message}`);
      return false;
    }
  }

  stopWebcam() { this._stopWebcam(); }

  _stopWebcam() {
    if (this._webcamStream) {
      this._webcamStream.getTracks().forEach(t => t.stop());
      this._webcamStream = null;
    }
    if (this.video.srcObject) {
      this.video.srcObject = null;
    }
  }

  async listCameras() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  // ──────────────────────────────────────────────────── Public: Playback ──

  play()   { this.video.play(); }
  pause()  { this.video.pause(); }

  togglePlayPause() {
    if (this.video.paused) this.play();
    else this.pause();
  }

  get isPlaying() {
    return !this.video.paused && !this.video.ended;
  }

  seek(seconds) {
    if (isFinite(this.video.duration)) {
      this.video.currentTime = Math.max(0, Math.min(seconds, this.video.duration));
    }
  }

  seekFraction(fraction) {
    if (isFinite(this.video.duration)) {
      this.video.currentTime = fraction * this.video.duration;
    }
  }

  setSpeed(rate) {
    this.video.playbackRate = rate;
  }

  restart() {
    this.video.currentTime = 0;
    this.video.play();
  }

  // ───────────────────────────────────────────────────────── Coordinate ──
  /**
   * Convert a point on the container element to canvas coordinates.
   * Use this when handling mouse/touch events on the container.
   */
  containerToCanvas(containerX, containerY) {
    if (!this.renderedRect) return { x: containerX, y: containerY };
    const { x: ox, y: oy, width: rw, height: rh } = this.renderedRect;
    // Clamp to canvas bounds
    const cx = Math.max(0, Math.min(containerX - ox, rw));
    const cy = Math.max(0, Math.min(containerY - oy, rh));
    return { x: cx, y: cy };
  }

  /**
   * Convert canvas coordinates to video-natural-resolution coordinates.
   * Useful for normalizing stored zone coordinates.
   */
  canvasToNormalized(cx, cy) {
    const c = this.overlayCanvas;
    return { x: cx / c.width, y: cy / c.height };
  }

  normalizedToCanvas(nx, ny) {
    const c = this.overlayCanvas;
    return { x: nx * c.width, y: ny * c.height };
  }

  // ──────────────────────────────────────────────────────── Utilities ──

  _clearCanvases() {
    [this.overlayCanvas, this.trackingCanvas].forEach(c => {
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
    });
  }

  get videoNaturalSize() {
    return { width: this.video.videoWidth, height: this.video.videoHeight };
  }

  get source() { return this._source; }

  destroy() {
    this._stopFrameLoop();
    this._stopWebcam();
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }
}
