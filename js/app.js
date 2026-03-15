/**
 * app.js – Main entry point.  Wires together VideoManager, OverlayManager,
 * VisionTracker, StationManager, and Leaderboard.
 */

import { VideoManager }   from './VideoManager.js';
import { OverlayManager } from './OverlayManager.js';
import { VisionTracker }  from './VisionTracker.js';
import { StationManager } from './StationManager.js';
import { Leaderboard }    from './Leaderboard.js';

// ─────────────────────────────────────────────────────── DOM references ──

const $ = id => document.getElementById(id);

const videoEl          = $('mainVideo');
const videoContainer   = $('videoContainer');
const overlayCanvas    = $('overlayCanvas');
const trackingCanvas   = $('trackingCanvas');
const emptyState       = $('emptyState');
const videoControls    = $('videoControls');
const dropZone         = $('dropZone');
const videoFileInput   = $('videoFileInput');
const uploadedFileInfo = $('uploadedFileInfo');
const uploadedFileName = $('uploadedFileName');
const btnClearVideo    = $('btnClearVideo');
const btnPlayPause     = $('btnPlayPause');
const iconPlay         = $('iconPlay');
const iconPause        = $('iconPause');
const btnRestart       = $('btnRestart');
const progressBar      = $('progressBar');
const progressFill     = $('progressFill');
const progressHandle   = $('progressHandle');
const timeDisplay      = $('timeDisplay');
const speedControl     = $('speedControl');
const speedLabel       = $('speedLabel');
const stationSelect    = $('stationSelect');
const stationRules     = $('stationRules');
const playerName       = $('playerName');
const sessionDuration  = $('sessionDuration');
const btnStartSession  = $('btnStartSession');
const btnEndSession    = $('btnEndSession');
const sessionTimer     = $('sessionTimer');
const trackingDot      = $('trackingDot');
const trackingStatus   = $('trackingStatus');
const fpsDisplay       = $('fpsDisplay');
const detectionInfo    = $('detectionInfo');
const btnToggleTracking = $('btnToggleTracking');
const toolBtns         = document.querySelectorAll('.tool-btn');
const colorSwatches    = document.querySelectorAll('.swatch');
const zoneLabel        = $('zoneLabel');
const zoneRule         = $('zoneRule');
const zoneList         = $('zoneList');
const zoneCount        = $('zoneCount');
const btnClearZones    = $('btnClearZones');
const detectionMode    = $('detectionMode');
const ballColor        = $('ballColor');
const customHSVPanel   = $('customHSVPanel');
const hueMin           = $('hueMin');
const hueMax           = $('hueMax');
const satMin           = $('satMin');
const valMin           = $('valMin');
const minRadius        = $('minRadius');
const maxRadius        = $('maxRadius');
const minRadiusVal     = $('minRadiusVal');
const maxRadiusVal     = $('maxRadiusVal');
const showDetection    = $('showDetection');
const showTrail        = $('showTrail');
const statsGrid        = $('statsGrid');
const sourceTabs       = document.querySelectorAll('.source-tab');
const sourceUpload     = $('sourceUpload');
const sourceWebcam     = $('sourceWebcam');
const btnToggleWebcam  = $('btnToggleWebcam');
const cameraSelect     = $('cameraSelect');
const btnToggleLB      = $('btnToggleLeaderboard');
const lbModal          = $('leaderboardModal');
const lbTableBody      = $('lbTableBody');
const lbStationFilter  = $('lbStationFilter');
const btnClearLB       = $('btnClearLeaderboard');
const btnCloseLB       = $('btnCloseLeaderboard');
const emptyLb          = $('emptyLb');
const countdownOverlay = $('countdownOverlay');
const countdownNumber  = $('countdownNumber');

// ─────────────────────────────────────────────────────── Module instances ──

const vm  = new VideoManager(videoEl, videoContainer, overlayCanvas, trackingCanvas, {
  onReady:      handleVideoReady,
  onFrame:      handleFrame,
  onEnded:      handleVideoEnded,
  onError:      handleVideoError,
  onTimeUpdate: updateProgressBar,
  onResize:     () => om.onCanvasResize(),
});

const om  = new OverlayManager(overlayCanvas, vm);
const vt  = new VisionTracker(trackingCanvas, vm, om);
const sm  = new StationManager();
const lb  = new Leaderboard();

// ─────────────────────────────────────────────────────── Session State ──

let session = {
  active:    false,
  player:    '',
  startTime: null,
  limitSecs: 0,
  timerInterval: null,
  elapsedSecs: 0,
};

// ─────────────────────────────────────────────────────── Init ──

function init() {
  // Apply first station
  applyStation(stationSelect.value);

  // Render leaderboard filter
  lb.populateStationFilter(lbStationFilter);

  // Set tracking canvas visible only when tracking active
  trackingCanvas.classList.remove('hidden');

  om.onZonesChanged(updateZoneList);

  // VisionTracker callbacks
  vt.onDetection = ({ x, y, r, inZones }) => {
    detectionInfo.textContent = `Ball @ (${Math.round(x)}, ${Math.round(y)}) r=${Math.round(r)}px`;
  };

  vt.onCount = (zone, total) => {
    flashCount(zone, total);
    updateStats();
  };

  vt.onFPS = fps => {
    fpsDisplay.textContent = `${fps} fps`;
  };

  // Default tool = circle
  om.setTool('circle');
}

// ─────────────────────────────────────────────────────── Station ──

function applyStation(id) {
  const station = sm.setStation(id);
  stationRules.innerHTML = sm.getRulesHTML();

  // Load default zones for this station (only if no zones yet)
  if (om.zones.length === 0) {
    const defaults = sm.buildDefaultZones();
    om.zones = defaults;
    om.render();
    updateZoneList(defaults);
  }

  // Suggest ball color preset
  ballColor.value = station.ballColorHint;
  vt.setColorPreset(station.ballColorHint);

  // Suggest detection mode
  detectionMode.value = station.detectionMode;
  vt.setMode(station.detectionMode);
}

stationSelect.addEventListener('change', () => {
  om.clearAll();
  applyStation(stationSelect.value);
});

// ─────────────────────────────────────────────────────── Source Tabs ──

sourceTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sourceTabs.forEach(t => t.classList.remove('source-tab--active'));
    tab.classList.add('source-tab--active');

    const src = tab.dataset.source;
    sourceUpload.classList.toggle('hidden', src !== 'upload');
    sourceWebcam.classList.toggle('hidden', src !== 'webcam');
  });
});

// ─────────────────────────────────────────────────────── Video Upload ──

dropZone.addEventListener('click', () => videoFileInput.click());

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drop-zone--over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drop-zone--over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) loadVideoFile(file);
});

videoFileInput.addEventListener('change', () => {
  if (videoFileInput.files[0]) loadVideoFile(videoFileInput.files[0]);
});

btnClearVideo.addEventListener('click', clearVideoSource);

function loadVideoFile(file) {
  vm.loadFile(file);
  uploadedFileName.textContent = file.name;
  uploadedFileInfo.classList.remove('hidden');
  dropZone.classList.add('hidden');
  showVideoUI();
}

function clearVideoSource() {
  vm.clearVideo();
  uploadedFileInfo.classList.add('hidden');
  dropZone.classList.remove('hidden');
  videoFileInput.value = '';
  hideVideoUI();
  stopTracking();
}

// ─────────────────────────────────────────────────────── Webcam ──

let webcamActive = false;

btnToggleWebcam.addEventListener('click', async () => {
  if (webcamActive) {
    vm.stopWebcam();
    webcamActive = false;
    btnToggleWebcam.textContent = 'Start Camera';
    hideVideoUI();
    stopTracking();
  } else {
    // Enumerate cameras first
    const cameras = await vm.listCameras();
    if (cameras.length > 1) {
      cameraSelect.innerHTML = '';
      cameras.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.deviceId;
        opt.textContent = c.label || `Camera ${cameraSelect.options.length + 1}`;
        cameraSelect.appendChild(opt);
      });
    }

    const deviceId = cameraSelect.value || null;
    const ok = await vm.startWebcam(deviceId);
    if (ok) {
      webcamActive = true;
      btnToggleWebcam.textContent = 'Stop Camera';
      showVideoUI();
    }
  }
});

cameraSelect.addEventListener('change', async () => {
  if (webcamActive) {
    vm.stopWebcam();
    await vm.startWebcam(cameraSelect.value);
  }
});

// ─────────────────────────────────────────────────────── Video Ready ──

function handleVideoReady(v) {
  showVideoUI();
  btnToggleTracking.disabled = false;
  setTrackingStatus('ready', 'Video ready – draw zones then start tracking');

  const natW = v.videoWidth;
  const natH = v.videoHeight;
  setStatus(`${natW}×${natH} — ${vm.source === 'webcam' ? 'Live camera' : 'Uploaded video'}`);
}

function handleVideoEnded() {
  stopTracking();
  setTrackingStatus('idle', 'Video ended');
}

function handleVideoError(msg) {
  setTrackingStatus('error', `Video error: ${msg}`);
}

// ─────────────────────────────────────────────────────── Frame Loop ──

function handleFrame(video, canvas, ts) {
  if (vt.active) {
    vt.processFrame(video, canvas, ts);
  }
  // Always re-render overlay (zones, drafts) on top
  om.render();
}

// ─────────────────────────────────────────────────────── Video Controls ──

btnPlayPause.addEventListener('click', () => vm.togglePlayPause());
btnRestart.addEventListener('click',   () => { vm.restart(); om.resetCounts(); vt.reset(); updateStats(); });

videoEl.addEventListener('play',  updatePlayIcon);
videoEl.addEventListener('pause', updatePlayIcon);

function updatePlayIcon() {
  const playing = vm.isPlaying;
  iconPlay.classList.toggle('hidden',  playing);
  iconPause.classList.toggle('hidden', !playing);
}

// Progress bar
progressBar.addEventListener('click', e => {
  const rect = progressBar.getBoundingClientRect();
  const frac = (e.clientX - rect.left) / rect.width;
  vm.seekFraction(Math.max(0, Math.min(1, frac)));
});

let progressDragging = false;
progressBar.addEventListener('mousedown', () => { progressDragging = true; });
document.addEventListener('mousemove', e => {
  if (!progressDragging) return;
  const rect = progressBar.getBoundingClientRect();
  const frac = (e.clientX - rect.left) / rect.width;
  vm.seekFraction(Math.max(0, Math.min(1, frac)));
});
document.addEventListener('mouseup', () => { progressDragging = false; });

function updateProgressBar(current, duration) {
  if (!isFinite(duration) || duration === 0) {
    progressFill.style.width   = '0%';
    progressHandle.style.left  = '0%';
    timeDisplay.textContent    = formatTime(current) + ' / ∞';
    return;
  }
  const pct = (current / duration) * 100;
  progressFill.style.width  = `${pct}%`;
  progressHandle.style.left = `${pct}%`;
  timeDisplay.textContent   = `${formatTime(current)} / ${formatTime(duration)}`;
}

speedControl.addEventListener('input', () => {
  const rate = parseFloat(speedControl.value);
  vm.setSpeed(rate);
  speedLabel.textContent = `${rate}×`;
});

// ─────────────────────────────────────────────────────── Drawing Tools ──

toolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toolBtns.forEach(b => b.classList.remove('tool-btn--active'));
    btn.classList.add('tool-btn--active');
    om.setTool(btn.dataset.tool);
  });
});

colorSwatches.forEach(s => {
  s.addEventListener('click', () => {
    colorSwatches.forEach(sw => sw.classList.remove('swatch--active'));
    s.classList.add('swatch--active');
    om.setColor(s.dataset.color);
  });
});

zoneLabel.addEventListener('input',  () => om.setLabel(zoneLabel.value));
zoneRule.addEventListener('change',  () => om.setRule(zoneRule.value));
btnClearZones.addEventListener('click', () => { om.clearAll(); updateStats(); });

// ─────────────────────────────────────────────────────── Zone List UI ──

function updateZoneList(zones) {
  zoneCount.textContent = zones.length;
  zoneList.innerHTML    = '';

  zones.forEach(zone => {
    const div = document.createElement('div');
    div.className = 'zone-item';
    div.innerHTML = `
      <span class="zone-item__dot" style="background:${zone.color}"></span>
      <span class="zone-item__name">${escHtml(zone.label)}</span>
      <span class="zone-item__count">${zone.count}</span>
      <span class="zone-item__rule">${zone.rule}</span>
      <button class="btn btn--ghost btn--xs zone-item__del" data-id="${zone.id}">✕</button>
    `;
    div.querySelector('.zone-item__del').addEventListener('click', () => {
      om.removeZone(zone.id);
      updateStats();
    });
    zoneList.appendChild(div);
  });

  updateStats();
}

// ─────────────────────────────────────────────────────── Vision Settings ──

detectionMode.addEventListener('change', () => vt.setMode(detectionMode.value));

ballColor.addEventListener('change', () => {
  const val = ballColor.value;
  customHSVPanel.classList.toggle('hidden', val !== 'custom');
  if (val !== 'custom') vt.setColorPreset(val);
});

function applyCustomHSV() {
  vt.setCustomHSV({
    hMin: +hueMin.value, hMax: +hueMax.value,
    sMin: +satMin.value,
    vMin: +valMin.value,
  });
}
[hueMin, hueMax, satMin, valMin].forEach(el => el.addEventListener('input', applyCustomHSV));

minRadius.addEventListener('input', () => {
  vt.setMinRadius(+minRadius.value);
  minRadiusVal.textContent = `${minRadius.value} px`;
});
maxRadius.addEventListener('input', () => {
  vt.setMaxRadius(+maxRadius.value);
  maxRadiusVal.textContent = `${maxRadius.value} px`;
});

showDetection.addEventListener('change', () => { vt.showDetection = showDetection.checked; });
showTrail.addEventListener('change',     () => { vt.showTrail     = showTrail.checked; });

// ─────────────────────────────────────────────────────── Tracking Toggle ──

btnToggleTracking.addEventListener('click', () => {
  if (vt.active) stopTracking();
  else           startTracking();
});

function startTracking() {
  vt.start();
  trackingCanvas.classList.remove('hidden');
  btnToggleTracking.textContent = 'Stop Tracking';
  btnToggleTracking.classList.add('btn--danger');
  btnToggleTracking.classList.remove('btn--secondary');
  setTrackingStatus('active', 'Tracking active');

  if (!vm.isPlaying) vm.play();
}

function stopTracking() {
  vt.stop();
  trackingCanvas.classList.add('hidden');
  btnToggleTracking.textContent = 'Start Tracking';
  btnToggleTracking.classList.remove('btn--danger');
  btnToggleTracking.classList.add('btn--secondary');
  setTrackingStatus('idle', 'Tracking stopped');
  detectionInfo.textContent = 'No detection';
}

// ─────────────────────────────────────────────────────── Session ──

btnStartSession.addEventListener('click', startSession);
btnEndSession.addEventListener('click',   endSession);

function startSession() {
  const name = playerName.value.trim();
  if (!name) {
    playerName.focus();
    playerName.style.outline = '2px solid #ef4444';
    setTimeout(() => playerName.style.outline = '', 2000);
    return;
  }

  const limitSecs = parseInt(sessionDuration.value) || 0;
  const countdown = Math.min(3, limitSecs || 3);

  // Reset counts
  om.resetCounts();
  vt.reset();

  // Run countdown then start
  runCountdown(countdown, () => {
    session.active    = true;
    session.player    = name;
    session.startTime = Date.now();
    session.limitSecs = limitSecs;
    session.elapsedSecs = 0;

    btnStartSession.disabled = true;
    btnEndSession.disabled   = false;
    playerName.disabled      = true;
    sessionDuration.disabled = true;
    stationSelect.disabled   = true;

    startTracking();
    if (!vm.isPlaying) vm.play();

    session.timerInterval = setInterval(tickSession, 1000);
  });
}

function tickSession() {
  session.elapsedSecs++;
  updateSessionTimer(session.elapsedSecs);

  if (session.limitSecs > 0 && session.elapsedSecs >= session.limitSecs) {
    endSession();
  }
}

function endSession() {
  if (!session.active) return;

  clearInterval(session.timerInterval);
  session.active = false;

  stopTracking();
  vm.pause();

  // Save to leaderboard
  const station  = sm.current;
  const score    = om.getTotalCount();
  const duration = session.elapsedSecs;

  lb.addEntry({
    player:    session.player,
    station:   station.name,
    stationId: station.id,
    score,
    duration,
    zones:     om.zones.map(z => ({ label: z.label, count: z.count })),
  });

  // Re-enable UI
  btnStartSession.disabled = false;
  btnEndSession.disabled   = true;
  playerName.disabled      = false;
  sessionDuration.disabled = false;
  stationSelect.disabled   = false;

  setTrackingStatus('idle', `Session ended — Score: ${score}`);

  // Open leaderboard
  openLeaderboard();
}

function runCountdown(n, cb) {
  if (n <= 0) { cb(); return; }
  countdownOverlay.classList.remove('hidden');
  let remaining = n;

  const tick = () => {
    countdownNumber.textContent = remaining;
    remaining--;
    if (remaining < 0) {
      countdownOverlay.classList.add('hidden');
      cb();
    } else {
      setTimeout(tick, 1000);
    }
  };
  tick();
}

function updateSessionTimer(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  sessionTimer.textContent = `${m}:${s}`;
}

// ─────────────────────────────────────────────────────── Stats Panel ──

function updateStats() {
  const zones = om.zones;
  if (!zones.length) {
    statsGrid.innerHTML = '<p class="stats-empty">No zones defined</p>';
    return;
  }

  statsGrid.innerHTML = zones.map(z => `
    <div class="stat-cell">
      <span class="stat-cell__dot" style="background:${z.color}"></span>
      <span class="stat-cell__label">${escHtml(z.label)}</span>
      <span class="stat-cell__value">${z.count}</span>
    </div>
  `).join('') + `
    <div class="stat-cell stat-cell--total">
      <span class="stat-cell__label">Total</span>
      <span class="stat-cell__value">${om.getTotalCount()}</span>
    </div>
  `;
}

// ─────────────────────────────────────────────────────── Leaderboard ──

btnToggleLB.addEventListener('click', openLeaderboard);
btnCloseLB.addEventListener('click',  () => lbModal.classList.add('hidden'));
lbModal.addEventListener('click', e => { if (e.target === lbModal) lbModal.classList.add('hidden'); });

lbStationFilter.addEventListener('change', renderLeaderboard);
btnClearLB.addEventListener('click', () => {
  if (confirm('Clear all leaderboard entries?')) {
    lb.clearAll();
    renderLeaderboard();
  }
});

lbTableBody.addEventListener('click', e => {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  lb.removeEntry(btn.dataset.id);
  renderLeaderboard();
});

function openLeaderboard() {
  lb.populateStationFilter(lbStationFilter);
  renderLeaderboard();
  lbModal.classList.remove('hidden');
}

function renderLeaderboard() {
  const filt  = lbStationFilter.value;
  const hasRows = lb.render(lbTableBody, filt);
  emptyLb.classList.toggle('hidden', hasRows);
}

// ─────────────────────────────────────────────────────── UI Helpers ──

function showVideoUI() {
  emptyState.classList.add('hidden');
  videoContainer.classList.remove('hidden');
  videoControls.classList.remove('hidden');
}

function hideVideoUI() {
  emptyState.classList.remove('hidden');
  videoContainer.classList.add('hidden');
  videoControls.classList.add('hidden');
}

function setTrackingStatus(state, msg) {
  trackingStatus.textContent = msg;
  trackingDot.className = `status-dot status-dot--${state}`;
}

function setStatus(msg) {
  trackingStatus.textContent = msg;
}

function flashCount(zone, total) {
  // Flash the zone badge count
  const badge = document.createElement('div');
  badge.className   = 'flash-badge';
  badge.textContent = `+1 ${zone.label}`;
  badge.style.cssText = `position:fixed;top:20%;left:50%;transform:translate(-50%,-50%);
    background:${zone.color};color:#fff;font-size:1.4rem;font-weight:700;
    padding:0.5rem 1.5rem;border-radius:2rem;pointer-events:none;z-index:9999;
    animation:flashIn 0.8s ease forwards;`;
  document.body.appendChild(badge);
  setTimeout(() => badge.remove(), 900);

  // Update stats live
  updateStats();
  updateZoneList(om.zones);
}

// ─────────────────────────────────────────────────────── Utilities ──

function formatTime(secs) {
  if (!isFinite(secs)) return '∞';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────────────── Keyboard ──

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') { e.preventDefault(); vm.togglePlayPause(); }
  if (e.key  === 't')    { btnToggleTracking.click(); }
  if (e.key  === 'r')    { btnRestart.click(); }
  if (e.key  === 'Escape') { lbModal.classList.add('hidden'); }
});

// ─────────────────────────────────────────────────────── Start ──
init();
