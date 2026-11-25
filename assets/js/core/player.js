/* DSA Lab · core/player.js — frame recorder + playback controls.
   An operation runs eagerly and records a snapshot ("frame") at each step.
   The player then lets the student play, pause and step backwards/forwards. */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U;

  class Recorder {
    constructor(S) { this.S = S; this.frames = []; this.a = null; this.v = null; this.t = null; }
    algo(name) { this.a = name; return this; }
    /* fn returns the variables shown in the Variables panel at each step */
    vars(fn) { this.v = fn; return this; }
    /* fn returns {head, rows, hi} for the trace table */
    table(fn) { this.t = fn; return this; }
    step(line, msg, hl, extra) {
      const f = { st: U.clone(this.S), line: line == null ? null : line, msg: msg || '', hl: hl ? U.clone(hl) : {}, algo: this.a };
      if (this.v) f.vars = this.v();
      if (this.t) f.table = U.clone(this.t());
      if (extra) Object.assign(f, U.clone(extra));
      this.frames.push(f);
      if (this.frames.length > 6000) U.fail('That input needs too many steps to animate — try a smaller one.');
      return f;
    }
    last() { return this.frames[this.frames.length - 1]; }
  }
  DSA.Recorder = Recorder;

  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5];

  class Player {
    constructor(el, o) {
      this.o = o || {};
      this.frames = []; this.i = 0; this.playing = false; this.timer = 0;
      this.speed = U.store.get('speed', 1);
      if (!SPEEDS.includes(this.speed)) this.speed = 1;
      el.classList.add('player');
      el.innerHTML = `
        <div class="pbtns">
          <button type="button" class="pb" data-a="first" title="Back to the first step (Home)" aria-label="First step">${U.icon('first')}</button>
          <button type="button" class="pb" data-a="prev" title="Step back (←)" aria-label="Previous step">${U.icon('prev')}</button>
          <button type="button" class="pb play" data-a="play" title="Play / pause (Space)" aria-label="Play">${U.icon('play')}</button>
          <button type="button" class="pb" data-a="next" title="Step forward (→)" aria-label="Next step">${U.icon('next')}</button>
          <button type="button" class="pb" data-a="last" title="Jump to the end (End)" aria-label="Last step">${U.icon('last')}</button>
        </div>
        <input class="scrub" type="range" min="0" max="0" value="0" aria-label="Step">
        <span class="count" aria-live="off">1 / 1</span>
        <label class="speed" title="Animation speed"><span>Speed</span>
          <select aria-label="Speed">${SPEEDS.map((s) => `<option value="${s}">${s}×</option>`).join('')}</select>
        </label>`;
      this.el = el;
      this.btn = {};
      U.$$('[data-a]', el).forEach((b) => { this.btn[b.dataset.a] = b; b.addEventListener('click', () => this.act(b.dataset.a)); });
      this.scrub = U.$('.scrub', el);
      this.count = U.$('.count', el);
      this.sel = U.$('select', el);
      this.sel.value = String(this.speed);
      this.sel.addEventListener('change', () => { this.speed = Number(this.sel.value); U.store.set('speed', this.speed); if (this.playing) this.tick(); });
      this.scrub.addEventListener('input', () => { this.pause(); this.go(Number(this.scrub.value), false); });
    }
    act(a) {
      if (a === 'first') { this.pause(); this.go(0); }
      else if (a === 'prev') { this.pause(); this.go(this.i - 1); }
      else if (a === 'next') { this.pause(); this.go(this.i + 1); }
      else if (a === 'last') { this.pause(); this.go(this.frames.length - 1); }
      else if (a === 'play') this.toggle();
    }
    interval() { return 1150 / this.speed; }
    tweenMs() { return Math.round(Math.min(540, this.interval() * 0.62)); }
    load(frames, o) {
      o = o || {};
      this.pause();
      this.frames = frames && frames.length ? frames : [{ st: {}, msg: '' }];
      this.scrub.max = String(this.frames.length - 1);
      this.go(o.at || 0, o.animate !== false);
      if (o.autoplay && this.frames.length > 1) this.play(true);
    }
    go(i, anim) {
      i = U.clamp(i | 0, 0, this.frames.length - 1);
      const changed = i !== this.i;
      this.i = i;
      if (this.o.onFrame) this.o.onFrame(this.frames[i], i, anim !== false && (changed || anim === true));
      this.sync();
    }
    toggle() { this.playing ? this.pause() : this.play(); }
    play(keep) {
      if (this.frames.length < 2) return;
      if (!keep && this.i >= this.frames.length - 1) this.go(0, false);
      this.playing = true; this.sync(); this.tick();
    }
    tick() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (!this.playing) return;
        if (this.i >= this.frames.length - 1) { this.pause(); if (this.o.onEnd) this.o.onEnd(); return; }
        this.go(this.i + 1);
        if (this.i >= this.frames.length - 1) { this.pause(); if (this.o.onEnd) this.o.onEnd(); return; }
        this.tick();
      }, this.interval());
    }
    pause() { this.playing = false; clearTimeout(this.timer); this.sync(); }
    sync() {
      const n = this.frames.length;
      if (!this.btn.play) return;
      this.btn.play.innerHTML = U.icon(this.playing ? 'pause' : 'play');
      this.btn.play.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
      this.btn.play.classList.toggle('on', this.playing);
      this.btn.prev.disabled = this.btn.first.disabled = this.i <= 0;
      this.btn.next.disabled = this.btn.last.disabled = this.i >= n - 1;
      this.btn.play.disabled = n < 2;
      this.scrub.value = String(this.i);
      this.scrub.style.setProperty('--pct', n > 1 ? (this.i / (n - 1)) * 100 + '%' : '100%');
      this.count.textContent = `${this.i + 1} / ${n}`;
    }
    destroy() { this.pause(); }
  }
  DSA.Player = Player;
})(typeof window !== 'undefined' ? window : globalThis);
