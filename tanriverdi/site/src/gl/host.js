// SceneHost: owns one <canvas> and one WebGL renderer for one 3D scene.
// It starts the scene only when its element is near the viewport, renders
// only while it is on screen and the tab is visible, adapts resolution to the
// device, and falls back to the poster image underneath when WebGL is missing,
// lost, or the visitor prefers reduced motion.
import * as THREE from 'three';

const hosts = new Set();
let rafId = 0;
let last = 0;

function tick(now) {
  rafId = requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  for (const h of hosts) h._frame(now / 1000, dt);
}

function ensureLoop() {
  if (!rafId) {
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  }
}

function stopLoopIfIdle() {
  if (rafId && ![...hosts].some((h) => h.running)) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  } else if ([...hosts].some((h) => h.running)) {
    ensureLoop();
  }
});

export function detectQuality() {
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (mem <= 2 || cores <= 2) return 'low';
  if (small || coarse || mem <= 4 || cores <= 4) return 'mid';
  return 'high';
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const DPR_CAP = { high: 2, mid: 1.5, low: 1 };

export class SceneHost {
  /**
   * @param {HTMLElement} el      container; gets a <canvas> appended
   * @param {() => Promise<{default: Function}>} load  dynamic import of the scene module
   * @param {object} [opts]
   * @param {string}  [opts.quality]        'high' | 'mid' | 'low'
   * @param {boolean} [opts.reducedMotion]
   * @param {number|null} [opts.fixedTime]  freeze the clock (lab / poster rendering)
   * @param {string}  [opts.rootMargin]     how early to start, IntersectionObserver syntax
   * @param {boolean} [opts.eager]          start immediately instead of waiting for visibility
   * @param {object}  [opts.params]         initial free-form values passed to the scene
   */
  constructor(el, load, opts = {}) {
    this.el = el;
    this.load = load;
    this.quality = opts.quality || detectQuality();
    this.reducedMotion = opts.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.fixedTime = opts.fixedTime ?? null;
    this.rootMargin = opts.rootMargin || '60% 0px 60% 0px';
    this.progress = 0;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.spin = { angle: 0, velocity: 0 };
    this.params = { ...(opts.params || {}) };
    this.frame = null;
    this.visible = false;
    this.running = false;
    this.started = false;
    this.failed = false;
    this.needsRender = true;
    this._frameMs = [];
    this._scale = 1;
    this._onLost = this._onLost.bind(this);
    this._onRestored = this._onRestored.bind(this);

    this._near = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        this._near.unobserve(this.el);
        this.start();
      }
    }, { rootMargin: this.rootMargin });

    this._onscreen = new IntersectionObserver((entries) => {
      this.visible = entries[entries.length - 1].isIntersecting;
      this._sync();
    }, { rootMargin: '5% 0px 5% 0px' });

    // Far from the viewport the scene is torn down and its WebGL context
    // released, so only the stages around the visitor hold GPU memory.
    this._far = new IntersectionObserver((entries) => {
      const near = entries[entries.length - 1].isIntersecting;
      if (!near && this.started && !this.failed) this.sleep();
    }, { rootMargin: '220% 0px 220% 0px' });

    if (opts.eager) this.start();
    else this._near.observe(el);
    this._onscreen.observe(el);
    this._far.observe(el);
  }

  /** Release the scene and its context; it starts again when it comes near. */
  sleep() {
    this.el.classList.remove('is-live');
    this.running = false;
    this._teardown();
    this.started = false;
    this._near.observe(this.el);
  }

  /** Stop or resume self-running motion (the scene still follows scroll and params). */
  setStill(still) {
    this.reducedMotion = still;
    this.api?.setStill?.(still);
    this.needsRender = true;
    this._sync();
  }

  // When the loop is not running (motion stopped, reduced motion, lab stills)
  // a change still has to reach the screen: draw one frame on the next tick.
  _invalidate() {
    this.needsRender = true;
    if (this.running || !this.api || this._queued) return;
    this._queued = true;
    requestAnimationFrame(() => {
      this._queued = false;
      if (!this.running && this.needsRender) this._render(this.fixedTime ?? performance.now() / 1000, 0);
    });
  }

  setProgress(p) {
    const v = Math.min(1, Math.max(0, p));
    if (v !== this.progress) {
      this.progress = v;
      this._invalidate();
    }
  }

  setPointer(x, y) {
    this.pointer.tx = x;
    this.pointer.ty = y;
  }

  /**
   * Ask the scene to draw its subject inside part of the canvas instead of
   * filling it. `rect` is { x, y, w, h } as fractions of the canvas (origin
   * top left), or null for the whole canvas.
   */
  setFrame(rect) {
    this.frame = rect;
    this._invalidate();
  }

  /** Free-form values a scene understands (for example which dish is selected). */
  setParam(key, value) {
    if (this.params[key] !== value) {
      this.params[key] = value;
      this._invalidate();
    }
  }

  /** Add rotation from a drag gesture, in radians; velocity keeps it coasting. */
  addSpin(delta) {
    this.spin.angle += delta;
    this.spin.velocity = delta * 60;
    this._invalidate();
  }

  async start() {
    if (this.started || this.failed) return;
    this.started = true;
    if (!webglAvailable()) return this._fail('no-webgl');
    try {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'gl-canvas';
      this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: this.quality !== 'low',
        powerPreference: 'high-performance',
        stencil: false,
      });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.setClearColor(0x000000, 0);
      canvas.addEventListener('webglcontextlost', this._onLost);
      canvas.addEventListener('webglcontextrestored', this._onRestored);

      const { default: create } = await this.load();
      const size = this._size();
      this.renderer.setPixelRatio(this._pixelRatio());
      this.renderer.setSize(size.w, size.h, false);
      this.api = await create({
        THREE,
        renderer: this.renderer,
        canvas,
        quality: this.quality,
        reducedMotion: this.reducedMotion,
        size,
      });
      if (!this.started) {
        // Put to sleep while the scene was still loading: let go of it again.
        this._teardown();
        return;
      }
      this.api.resize?.(size.w, size.h);
      this.el.appendChild(canvas);

      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this.el);
      hosts.add(this);
      this._sync();
      // First frame, then reveal over the poster.
      this._render(this.fixedTime ?? performance.now() / 1000, 0);
      requestAnimationFrame(() => {
        this.el.classList.add('is-live');
        this.el.dispatchEvent(new CustomEvent('scene:live', { bubbles: true }));
      });
    } catch (err) {
      console.warn('[scene] could not start', err);
      this._fail('error');
    }
  }

  _fail(reason) {
    this.failed = true;
    this.running = false;
    this.el.classList.add('no-gl');
    this.el.dataset.glFallback = reason;
    this._teardown();
  }

  _size() {
    const r = this.el.getBoundingClientRect();
    return { w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) };
  }

  _pixelRatio() {
    return Math.min(window.devicePixelRatio || 1, DPR_CAP[this.quality]) * this._scale;
  }

  _resize() {
    if (!this.renderer || !this.api) return;
    const { w, h } = (this._cssSize = this._size());
    this.renderer.setPixelRatio(this._pixelRatio());
    this.renderer.setSize(w, h, false);
    this.api.resize?.(w, h);
    this.needsRender = true;
    if (!this.running) this._render(this.fixedTime ?? performance.now() / 1000, 0);
  }

  _sync() {
    const animate = this.fixedTime == null && !this.reducedMotion;
    const shouldRun = !!this.api && !this.failed && this.visible && animate;
    if (shouldRun !== this.running) {
      this.running = shouldRun;
      if (shouldRun) ensureLoop();
      else stopLoopIfIdle();
    }
    // Static modes still need a frame when they come on screen or change.
    if (this.api && !animate && this.visible && this.needsRender) {
      this._render(this.fixedTime ?? 0, 0);
    }
  }

  _frame(time, dt) {
    if (!this.running) return;
    const t0 = performance.now();
    this._render(time, dt);
    this._adapt(performance.now() - t0, dt);
  }

  _render(time, dt) {
    if (!this.api || !this.renderer) return;
    // With motion stopped the clock stands still, so nothing drifts between
    // frames that are drawn only because the visitor scrolled.
    if (this.fixedTime == null && this.reducedMotion) {
      if (this._frozen == null) this._frozen = time;
      time = this._frozen;
      dt = 0;
    } else {
      this._frozen = null;
    }
    const p = this.pointer;
    const k = dt ? 1 - Math.exp(-dt * 6) : 1;
    p.x += (p.tx - p.x) * k;
    p.y += (p.ty - p.y) * k;
    if (dt) {
      this.spin.angle += this.spin.velocity * dt;
      this.spin.velocity *= Math.exp(-dt * 2.2);
    }
    this.api.update({
      time,
      dt,
      progress: this.progress,
      pointer: p,
      spin: this.spin.angle,
      params: this.params,
      frame: this.frame,
      size: this._cssSize || (this._cssSize = this._size()),
      visible: this.visible,
    });
    if (this.api.render) this.api.render(this.renderer);
    else this.renderer.render(this.api.scene, this.api.camera);
    this.needsRender = false;
  }

  // Dynamic resolution: drop pixel ratio when frames are slow, restore when fast.
  _adapt(renderMs, dt) {
    const ms = Math.max(renderMs, dt * 1000);
    const f = this._frameMs;
    f.push(ms);
    if (f.length < 45) return;
    const avg = f.reduce((a, b) => a + b, 0) / f.length;
    f.length = 0;
    const before = this._scale;
    if (avg > 26 && this._scale > 0.55) this._scale = Math.max(0.55, this._scale - 0.15);
    else if (avg < 17.5 && this._scale < 1) this._scale = Math.min(1, this._scale + 0.1);
    if (this._scale !== before) this._resize();
  }

  _onLost(e) {
    e.preventDefault();
    this.running = false;
    this.el.classList.remove('is-live');
    stopLoopIfIdle();
  }

  _onRestored() {
    // Simplest robust recovery: rebuild from scratch.
    this._teardown();
    this.started = false;
    this.failed = false;
    this.start();
  }

  _teardown() {
    this._ro?.disconnect();
    hosts.delete(this);
    try {
      this.api?.dispose?.();
    } catch {
      /* already gone */
    }
    this.api = null;
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this._onLost);
      this.canvas.removeEventListener('webglcontextrestored', this._onRestored);
      this.canvas.remove();
    }
    this.renderer?.dispose();
    this.renderer = null;
    this.canvas = null;
    stopLoopIfIdle();
  }

  destroy() {
    this._near.disconnect();
    this._onscreen.disconnect();
    this._far.disconnect();
    this._teardown();
  }
}
