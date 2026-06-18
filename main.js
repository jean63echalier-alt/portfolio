/* ══════════════════════════════════════════════════════════
   Jean Echalier — Expérience immersive
   WebGL morphing particles (Three.js) + GSAP + WebAudio
   ══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const body   = document.body;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasTHREE = typeof window.THREE !== 'undefined';

  /* ── Données chapitres : forme + couleur + interaction ── */
  const CHAPTERS = [
    { shape: 'wave',    color: 0x1b1a17, mode: 'repel'  }, // 01 LSDJ — pulse
    { shape: 'sphere',  color: 0x2a2017, mode: 'attract'}, // 02 Mes Convictions — chorus
    { shape: 'lattice', color: 0x14140f, mode: 'order'  }, // 03 MyThèse — architecture
    { shape: 'routes',  color: 0x3a2a18, mode: 'flow'   }, // 04 Beeclou — trajectories
  ];
  const LAST = CHAPTERS.length - 1;

  let stage = 'intro';      // intro | experience | outro
  let current = 0;
  let busy = false;

  /* ──────────────────────────────────────────────────────────
     WebGL : système de particules morphable
     ────────────────────────────────────────────────────────── */
  const GL = (() => {
    if (!hasTHREE) return null;

    const canvas = document.getElementById('gl');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 4000);
    camera.position.z = 700;

    // taille du monde visible au plan z=0
    let halfH = Math.tan((45 * Math.PI / 180) / 2) * 700;
    let aspect = 1, halfW = halfH;

    const COUNT = (isCoarse || DPR < 1.5) ? 4800 : 7400;

    const cur = new Float32Array(COUNT * 3);   // positions affichées
    const tgt = new Float32Array(COUNT * 3);   // cibles (forme courante)
    const vel = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);      // bruit/identité
    const sizes = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // scatter initial : nuage sphérique
      const r = 260 * Math.cbrt(Math.random());
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      cur[i*3]   = r * Math.sin(ph) * Math.cos(th);
      cur[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      cur[i*3+2] = r * Math.cos(ph);
      seed[i]    = Math.random();
      sizes[i]   = 1.1 + Math.random() * 2.2;
      alphas[i]  = 0.35 + Math.random() * 0.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(CHAPTERS[0].color) },
        uSize:  { value: isCoarse ? 1.4 : 1.0 },
      },
      vertexShader: `
        attribute float aSize; attribute float aAlpha;
        varying float vA; uniform float uSize;
        void main(){
          vA = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uSize * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        precision mediump float;
        varying float vA; uniform vec3 uColor;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.12, d);
          if (a <= 0.0) discard;
          gl_FragColor = vec4(uColor, a * vA);
        }`,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ── générateurs de formes ── */
    function setShape(name) {
      const W = halfW * 1.9, H = halfH * 1.7;
      for (let i = 0; i < COUNT; i++) {
        const s = seed[i]; let x, y, z;
        switch (name) {
          case 'wave': { // bande d'onde horizontale (pulse)
            x = (i / COUNT - 0.5) * W * 1.1;
            const k = x * 0.012;
            y = Math.sin(k) * 70 + Math.sin(k * 2.7 + 1.3) * 34 + Math.sin(k * 5.1) * 16
                + (s - 0.5) * 70;
            z = (s - 0.5) * 160 + Math.sin(k * 1.7) * 40;
            break;
          }
          case 'sphere': { // sphère de Fibonacci (chœur de voix)
            const gold = Math.PI * (3 - Math.sqrt(5));
            const yy = 1 - (i / (COUNT - 1)) * 2;
            const rad = Math.sqrt(1 - yy * yy);
            const ph = gold * i;
            const R = 235 + (s - 0.5) * 26;
            x = Math.cos(ph) * rad * R;
            y = yy * R;
            z = Math.sin(ph) * rad * R;
            break;
          }
          case 'lattice': { // grille 3D ordonnée (architecture)
            const gx = 26, gy = 18, gz = 16;
            const idx = i % (gx * gy * gz);
            const ix = idx % gx;
            const iy = Math.floor(idx / gx) % gy;
            const iz = Math.floor(idx / (gx * gy)) % gz;
            x = (ix / (gx - 1) - 0.5) * W * 0.9;
            y = (iy / (gy - 1) - 0.5) * H * 0.78;
            z = (iz / (gz - 1) - 0.5) * 300;
            break;
          }
          case 'routes': { // faisceaux de trajectoires (mobilité)
            const ROUTES = 16;
            const r = i % ROUTES;
            const t = ((i / ROUTES) % (COUNT / ROUTES)) / (COUNT / ROUTES); // 0..1
            const ay = (r / (ROUTES - 1) - 0.5) * H * 0.95;
            const curv = Math.sin(r * 1.7) * 90;
            x = (t - 0.5) * W * 1.05;
            y = ay + Math.sin(t * Math.PI * 2 + r) * (40 + curv * 0.3) + curv * (t - 0.5);
            z = Math.cos(t * Math.PI * 1.3 + r) * 70 + (s - 0.5) * 30;
            break;
          }
          default: x = (s-0.5)*W; y = (s-0.5)*H; z = (s-0.5)*200;
        }
        tgt[i*3] = x; tgt[i*3+1] = y; tgt[i*3+2] = z;
      }
    }
    setShape(CHAPTERS[0].shape);

    /* ── souris ── */
    const mouse = { x: 1e6, y: 1e6, px: 1e6, py: 1e6, vx: 0, vy: 0, active: false };
    function toWorld(clientX, clientY) {
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = -(clientY / window.innerHeight) * 2 + 1;
      return { x: nx * halfW, y: ny * halfH };
    }
    function onMove(e) {
      const p = (e.touches ? e.touches[0] : e);
      if (!p) return;
      const w = toWorld(p.clientX, p.clientY);
      mouse.vx = w.x - mouse.x; mouse.vy = w.y - mouse.y;
      mouse.x = w.x; mouse.y = w.y; mouse.active = true;
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove',  onMove, { passive: true });
    window.addEventListener('pointerout', () => { mouse.active = false; });

    /* ── resize ── */
    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      halfH = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
      halfW = halfH * aspect;
      setShape(CHAPTERS[current].shape);
    }
    window.addEventListener('resize', resize);
    resize();

    /* ── boucle ── */
    let t = 0;
    let curMode = CHAPTERS[0].mode;
    const SPRING = 0.018, DAMP = 0.86, R = 150;

    function frame() {
      t += 0.01;
      const m = mouse;
      const interactive = (stage === 'experience') && m.active;

      for (let i = 0; i < COUNT; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;
        // ressort vers la cible
        let fx = (tgt[ix] - cur[ix]) * SPRING;
        let fy = (tgt[iy] - cur[iy]) * SPRING;
        let fz = (tgt[iz] - cur[iz]) * SPRING;

        // dérive vivante
        const sd = seed[i] * 6.28;
        fx += Math.sin(t * 0.7 + sd) * 0.05;
        fy += Math.cos(t * 0.6 + sd * 1.3) * 0.05;

        // interaction souris
        if (interactive) {
          const dx = cur[ix] - m.x, dy = cur[iy] - m.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < R*R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R);
            switch (curMode) {
              case 'repel': { // agiter le flux
                fx += (dx/d) * f * 9; fy += (dy/d) * f * 9;
                fx += (-dy/d) * f * 5; fy += (dx/d) * f * 5; // tourbillon
                break;
              }
              case 'attract': { // rassembler les voix
                fx -= (dx/d) * f * 7; fy -= (dy/d) * f * 7;
                break;
              }
              case 'order': { // mettre en ordre : snap renforcé vers la cible
                fx += (tgt[ix] - cur[ix]) * f * 0.22;
                fy += (tgt[iy] - cur[iy]) * f * 0.22;
                fz += (tgt[iz] - cur[iz]) * f * 0.22;
                fx += (dx/d) * f * 2.2; fy += (dy/d) * f * 2.2;
                break;
              }
              case 'flow': { // diriger les trajectoires
                fx += m.vx * f * 0.55; fy += m.vy * f * 0.55;
                fx += (-dy/d) * f * 3; fy += (dx/d) * f * 3;
                break;
              }
            }
          }
        }

        vel[ix] = (vel[ix] + fx) * DAMP;
        vel[iy] = (vel[iy] + fy) * DAMP;
        vel[iz] = (vel[iz] + fz) * DAMP;
        cur[ix] += vel[ix]; cur[iy] += vel[iy]; cur[iz] += vel[iz];
      }

      // amortir la vitesse souris
      mouse.vx *= 0.85; mouse.vy *= 0.85;

      // rotation lente d'ambiance
      points.rotation.y = Math.sin(t * 0.15) * 0.18;
      points.rotation.x = Math.cos(t * 0.1) * 0.06;

      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      goShape(idx) {
        setShape(CHAPTERS[idx].shape);
        curMode = CHAPTERS[idx].mode;
        if (hasGSAP) {
          const c = new THREE.Color(CHAPTERS[idx].color);
          gsap.to(mat.uniforms.uColor.value, { r: c.r, g: c.g, b: c.b, duration: 1.2, ease: 'power2.out' });
        } else {
          mat.uniforms.uColor.value.set(CHAPTERS[idx].color);
        }
      }
    };
  })();

  /* ──────────────────────────────────────────────────────────
     Audio ambiant (WebAudio) — pad doux, démarre muet
     ────────────────────────────────────────────────────────── */
  const Audio = (() => {
    let ctx, master, lp, melodyTimer = null, started = false, on = false;
    // gamme pentatonique douce (La mineur) pour une mélodie agréable
    const SCALE = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    function playNote() {
      if (!on || !ctx) return;
      const base = SCALE[Math.floor(Math.random() * SCALE.length)];
      const f = base * (Math.random() < 0.3 ? 2 : 1);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; o2.detune.value = 6;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      o.connect(g); o2.connect(g); g.connect(lp);
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.7);            // attaque douce
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);     // longue traîne
      o.start(t); o2.start(t); o.stop(t + 4.8); o2.stop(t + 4.8);
    }
    function build() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      // réverb légère (delay en feedback) → sensation d'espace
      const delay = ctx.createDelay(2); delay.delayTime.value = 0.5;
      const fb = ctx.createGain(); fb.gain.value = 0.32; delay.connect(fb); fb.connect(delay);
      const wet = ctx.createGain(); wet.gain.value = 0.45; delay.connect(wet); wet.connect(master);
      // filtre chaud
      lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 950; lp.Q.value = 0.4;
      lp.connect(master); lp.connect(delay);
      // pad : accord La mineur 7 (A C E G), grave et enveloppant
      [110, 130.81, 164.81, 196.00].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle';
        o.frequency.value = f; o.detune.value = (i - 1.5) * 4;
        const g = ctx.createGain(); g.gain.value = 0.10 / (i * 0.4 + 1);
        o.connect(g); g.connect(lp); o.start();
      });
      // LFO lent sur le filtre → mouvement organique
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
      const lg = ctx.createGain(); lg.gain.value = 300;
      lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      started = true; return true;
    }
    return {
      toggle() {
        if (!started && !build()) return false;
        if (ctx.state === 'suspended') ctx.resume();
        on = !on;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(on ? 0.42 : 0.0001, ctx.currentTime + 0.9);
        clearInterval(melodyTimer);
        if (on) { setTimeout(playNote, 600); melodyTimer = setInterval(playNote, 4300); }
        return on;
      },
      get on() { return on; }
    };
  })();

  /* ──────────────────────────────────────────────────────────
     UI / Navigation
     ────────────────────────────────────────────────────────── */
  const chaptersEls = Array.from(document.querySelectorAll('.chapter'));
  const dots = Array.from(document.querySelectorAll('#chapter-nav .dot'));
  const skipBtn = document.getElementById('skip-btn');

  // adapter les instructions au tactile
  if (isCoarse) {
    document.querySelectorAll('[data-instructions]').forEach(el => {
      el.textContent = el.textContent
        .replace(/Bougez le curseur/i, 'Maintenez et glissez')
        .replace(/Approchez le curseur/i, 'Maintenez près des voix')
        .replace(/Déplacez le curseur/i, 'Maintenez et glissez')
        .replace(/Guidez le curseur/i, 'Glissez le doigt');
    });
  }

  function animateChapterText(el) {
    if (!hasGSAP || reduced) return;
    const it = el.querySelector('.t-italic');
    const mn = el.querySelector('.t-main');
    const subs = el.querySelectorAll('[data-subtitle]');
    const ins = el.querySelector('[data-instructions]');
    const kick = el.querySelector('.chapter-kicker');
    gsap.killTweensOf([it, mn, subs, ins, kick]);
    gsap.set([kick, it, mn, ins], { opacity: 0, y: 26 });
    gsap.set(subs, { opacity: 0, y: 18 });
    const tl = gsap.timeline();
    tl.to(kick, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' })
      .to(it,   { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=0.35')
      .to(mn,   { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, '-=0.5')
      .to(subs, { opacity: 1, y: 0, duration: .7, stagger: .28, ease: 'power2.out' }, '-=0.3')
      .to(ins,  { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, '-=0.2');
  }

  // met en pause toutes les vidéos YouTube des chapitres (lecture inactive par défaut)
  function pauseAllVideos() {
    document.querySelectorAll('.chapter iframe[src*="youtube.com/embed"]').forEach(f => {
      try { f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); } catch (e) {}
    });
  }

  function showChapter(idx) {
    pauseAllVideos();                            // coupe toute vidéo en cours avant de changer
    chaptersEls.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    if (GL) GL.goShape(idx);
    animateChapterText(chaptersEls[idx]);
    skipBtn.textContent = idx === LAST ? 'Terminer →' : 'Chapitre suivant →';
  }

  function enterExperience() {
    if (stage === 'experience') return;
    body.dataset.stage = 'experience';
    stage = 'experience';
    current = 0;
    showChapter(0);
    armIdle();
  }

  // Boucle : retour direct au chapitre 1, en un clic (sans repasser par l'intro)
  function loopToStart() {
    body.dataset.stage = 'experience';
    stage = 'experience';
    window.scrollTo(0, 0);
    current = -1;            // force showChapter à rejouer le chapitre 0
    goChapter(0);
    armIdle();
  }

  function goChapter(idx) {
    if (busy || idx === current) return;
    idx = Math.max(0, Math.min(LAST, idx));
    busy = true; setTimeout(() => busy = false, 650);
    current = idx;
    showChapter(idx);
  }

  function nextStep() {
    if (current < LAST) goChapter(current + 1);
    else goOutro();
  }
  function prevStep() { if (current > 0) goChapter(current - 1); }

  function goOutro() {
    body.dataset.stage = 'outro';
    stage = 'outro';
    window.scrollTo(0, 0);
    revealObserve();
    armIdle();
  }

  /* ── Boucle automatique : retour au début après inactivité ── */
  const IDLE_MS = 35000;
  let idleTimer = null;
  function armIdle() {
    clearTimeout(idleTimer);
    if (reduced) return;                       // respecte prefers-reduced-motion
    idleTimer = setTimeout(() => {
      if (stage === 'intro') return;
      if (infoPanel.classList.contains('open')) { armIdle(); return; }
      const ae = document.activeElement;
      if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) { armIdle(); return; }
      loopToStart();                           // « revient au début tout seul »
    }, IDLE_MS);
  }
  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev =>
    window.addEventListener(ev, () => { if (stage !== 'intro') armIdle(); }, { passive: true }));

  /* ── Intro ── */
  function introIn() {
    if (!hasGSAP || reduced) return;
    const els = ['.js-intro-eyebrow', '.js-intro-the', '.js-intro-main',
                 '.js-intro-tagline', '.js-enter-experience', '.js-intro-hint']
                 .map(s => document.querySelector(s));
    gsap.set(els, { opacity: 0, y: 30 });
    gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: .16, ease: 'power3.out', delay: .2 });
  }

  /* ── Reveal au scroll (dossier) ── */
  let io;
  function revealObserve() {
    if (io) return;
    const els = document.querySelectorAll('.reveal');
    if (typeof IntersectionObserver === 'undefined') {   // fallback : tout révéler
      els.forEach(el => el.classList.add('in')); io = true; return;
    }
    io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
  }

  /* ── Panneau info ── */
  const infoPanel = document.getElementById('info-panel');
  const infoScrim = document.getElementById('info-scrim');
  const infoBtn = document.getElementById('info-btn');
  function openInfo(o) {
    infoPanel.classList.toggle('open', o);
    infoScrim.classList.toggle('open', o);
    infoBtn.setAttribute('aria-expanded', String(o));
    infoPanel.setAttribute('aria-hidden', String(!o));
  }

  /* ── Bindings ── */
  document.querySelector('.js-enter-experience')?.addEventListener('click', () => {
    enterExperience();
    if (!Audio.on) { const r = Audio.toggle(); updateAudioBtn(r); } // démarre le son à l'entrée
  });
  skipBtn.addEventListener('click', nextStep);
  dots.forEach(d => d.addEventListener('click', () => goChapter(+d.dataset.go)));
  document.querySelector('.js-restart')?.addEventListener('click', loopToStart);      // CTA outro
  document.querySelector('.js-restart-loop')?.addEventListener('click', loopToStart); // bouton persistant

  infoBtn.addEventListener('click', () => openInfo(!infoPanel.classList.contains('open')));
  document.getElementById('info-close').addEventListener('click', () => openInfo(false));
  infoScrim.addEventListener('click', () => openInfo(false));

  // audio button
  const audioBtn = document.getElementById('audio-btn');
  function updateAudioBtn(on) {
    audioBtn.classList.toggle('muted', !on);
    audioBtn.setAttribute('aria-pressed', String(on));
    audioBtn.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
  }
  audioBtn.addEventListener('click', () => updateAudioBtn(Audio.toggle()));

  // clavier + molette en mode expérience
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') openInfo(false);
    if (stage === 'intro') {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); enterExperience(); }
      return;
    }
    if (stage !== 'experience') return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); nextStep(); }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prevStep(); }
  });
  let wheelLock = false;
  window.addEventListener('wheel', (e) => {
    if (wheelLock || Math.abs(e.deltaY) < 24) return;
    // sur l'accueil : faire défiler vers le bas entre dans l'expérience
    if (stage === 'intro') {
      if (e.deltaY > 0) { wheelLock = true; setTimeout(() => wheelLock = false, 850); enterExperience(); }
      return;
    }
    if (stage !== 'experience') return;
    wheelLock = true; setTimeout(() => wheelLock = false, 850);
    e.deltaY > 0 ? nextStep() : prevStep();
  }, { passive: true });

  /* ── Démarrage ── */
  window.addEventListener('load', () => {
    setTimeout(() => {
      body.classList.remove('is-loading');
      introIn();
    }, reduced ? 0 : 500);
  });
  // filet de sécurité si 'load' tarde
  setTimeout(() => { if (body.classList.contains('is-loading')) { body.classList.remove('is-loading'); introIn(); } }, 2600);

})();
