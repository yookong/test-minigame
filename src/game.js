(() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = { amber: '#ffc45c', coral: '#ff6a55', ink: '#f4efe4', deep: '#080f27', boss: '#ff3d5e' };
  const DT = 1 / 60;
  const BUILD = '__BUILD__';
  const isDev = /\/dev\//.test(location.pathname);

  // ================= catalog =================
  const TABS = [['skin', '색깔'], ['hat', '모자'], ['face', '표정'], ['trail', '꼬리'], ['bg', '배경']];
  const ITEMS = {
    skin: [
      { id: 'sun', name: '햇살', price: 0, color: '#ffc45c' },
      { id: 'mint', name: '민트', price: 8, color: '#6fe3c1' },
      { id: 'peach', name: '복숭아', price: 12, color: '#ffab8c' },
      { id: 'sakura', name: '벚꽃', price: 15, color: '#ffa3c8' },
      { id: 'sky', name: '하늘', price: 20, color: '#8ec5ff' },
      { id: 'lilac', name: '라일락', price: 25, color: '#c7abff' },
      { id: 'snow', name: '눈송이', price: 30, color: '#eef3ff' },
      { id: 'gold', name: '황금', price: 45, color: '#ffd84a' },
      { id: 'rainbow', name: '무지개', price: 60, color: null },
    ],
    hat: [
      { id: 'none', name: '없음', price: 0 },
      { id: 'ribbon', name: '리본', price: 10 },
      { id: 'flower', name: '꽃핀', price: 15 },
      { id: 'party', name: '고깔모자', price: 20 },
      { id: 'crown', name: '왕관', price: 35 },
      { id: 'wizard', name: '마법사 모자', price: 45 },
    ],
    face: [
      { id: 'basic', name: '기본', price: 0 },
      { id: 'smile', name: '방긋', price: 8 },
      { id: 'wink', name: '윙크', price: 12 },
      { id: 'wow', name: '깜짝', price: 12 },
      { id: 'cat', name: '고양이', price: 20 },
      { id: 'shades', name: '선글라스', price: 30 },
    ],
    trail: [
      { id: 'none', name: '없음', price: 0 },
      { id: 'sparkle', name: '반짝이', price: 20 },
      { id: 'bubble', name: '비눗방울', price: 25 },
      { id: 'heart', name: '하트', price: 30 },
      { id: 'rainbow', name: '무지개', price: 50 },
    ],
    bg: [
      { id: 'night', name: '밤하늘', price: 0 },
      { id: 'dusk', name: '노을', price: 20 },
      { id: 'deepsea', name: '깊은 바다', price: 30 },
      { id: 'nebula', name: '성운', price: 35 },
      { id: 'aurora', name: '오로라', price: 40 },
    ],
  };
  const findItem = (cat, id) => ITEMS[cat].find((i) => i.id === id) || ITEMS[cat][0];

  const ACH = [
    { id: 'first', name: '첫 비행', desc: '게임을 한 판 끝내기', title: '새내기 별', reward: 2, test: (r, s) => s.runs >= 1 },
    { id: 't30', name: '버티기', desc: '한 판에 30초 버티기', title: '끈기 있는 별', reward: 3, test: (r) => r.time >= 30 },
    { id: 't60', name: '곡예 비행', desc: '한 판에 60초 버티기', title: '운석 곡예사', reward: 5, test: (r) => r.time >= 60 },
    { id: 't120', name: '불멸', desc: '한 판에 120초 버티기', title: '불사조', reward: 12, test: (r) => r.time >= 120 },
    { id: 's1000', name: '천 점', desc: '한 판에 1,000점 넘기기', title: '천점 돌파', reward: 3, test: (r) => r.score >= 1000 },
    { id: 's3000', name: '삼천 점', desc: '한 판에 3,000점 넘기기', title: '고득점 사냥꾼', reward: 8, test: (r) => r.score >= 3000 },
    { id: 'rs5', name: '별 줍기', desc: '한 판에 별 5개 모으기', title: '별 수집가', reward: 3, test: (r) => r.stars >= 5 },
    { id: 'boss1', name: '폭풍 돌파', desc: '운석 폭풍을 1번 통과하기', title: '폭풍 돌파자', reward: 5, test: (r) => r.boss >= 1 },
    { id: 'boss2', name: '폭풍의 눈', desc: '한 판에 운석 폭풍을 2번 통과하기', title: '폭풍의 지배자', reward: 15, test: (r) => r.boss >= 2 },
    { id: 'dodge500', name: '회피 연습', desc: '운석을 누적 500개 피하기', title: '회피의 달인', reward: 5, test: (r, s) => s.dodged >= 500, prog: (s) => [s.dodged, 500] },
    { id: 'stars100', name: '은하 저금통', desc: '별을 누적 100개 모으기', title: '은하 부자', reward: 10, test: (r, s) => s.totalStars >= 100, prog: (s) => [s.totalStars, 100] },
    { id: 'runs20', name: '단골', desc: '20판 플레이하기', title: '단골 손님', reward: 5, test: (r, s) => s.runs >= 20, prog: (s) => [s.runs, 20] },
    { id: 'buy1', name: '첫 쇼핑', desc: '상점에서 처음으로 사기', title: '멋쟁이', reward: 2, test: (r, s) => s.buys >= 1 },
    { id: 'own10', name: '옷장 가득', desc: '상점 아이템 10개 사기', title: '패셔니스타', reward: 8, test: (r, s) => s.buys >= 10, prog: (s) => [s.buys, 10] },
  ];

  // ================= save data =================
  const SAVE_KEY = 'meteor-dodge-save-v1';
  const fresh = () => ({
    best: 0, stars: 0, owned: [],
    equip: { skin: 'sun', hat: 'none', face: 'basic', trail: 'none', bg: 'night' },
    ach: [], title: '', stats: { runs: 0, totalStars: 0, dodged: 0, buys: 0 },
    settings: { sfx: true, music: true, vibe: true },
    daily: { last: '', streak: 0 }, challenge: null, onboarded: false, ownerKey: '',
  });
  let save = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw) {
      const d = fresh();
      save = { ...d, ...raw, equip: { ...d.equip, ...(raw.equip || {}) }, stats: { ...d.stats, ...(raw.stats || {}) },
        settings: { ...d.settings, ...(raw.settings || {}) }, ach: raw.ach || [] };
      if (!raw.stats) save.stats.buys = save.owned.filter((o) => findItem(o.split(':')[0], o.split(':')[1]).price > 0).length;
    } else save.best = Number(localStorage.getItem('meteor-dodge-best')) || 0;
  } catch (e) {}
  if (!/^[A-Za-z0-9-]{16,64}$/.test(save.device || '')) {
    save.device = (crypto.randomUUID ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''));
  }
  save.nickname = save.nickname || '';
  save.onboarded = save.onboarded || save.stats.runs > 0 || !!save.nickname;
  if (/^#owner-[A-Za-z0-9]{8,64}$/.test(location.hash)) {
    save.ownerKey = location.hash.slice(7);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };
  persist();
  const buzz = (ms) => { if (save.settings.vibe) try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  const owns = (cat, id) => findItem(cat, id).price === 0 || save.owned.includes(cat + ':' + id);

  const scoreEl = $('score'), lvEl = $('lv'), walletEl = $('wallet'), bestEl = $('best');
  const overlay = $('overlay'), pauseBtn = $('pauseBtn');
  const screens = {};
  for (const id of ['home', 'welcome', 'attend', 'settings', 'help', 'install', 'maint', 'gate', 'admin', 'over', 'shop', 'ach', 'pause', 'rank']) screens[id] = $(id);
  const hud = $('hud');
  function refreshHud() {
    walletEl.textContent = save.stars; bestEl.textContent = save.best;
    for (const el of document.querySelectorAll('[data-title]')) { el.hidden = !save.title; el.textContent = save.title; }
    $('homeName').textContent = save.nickname || '이름 없는 별';
    $('homeStars').textContent = save.stars;
    $('homeBest').textContent = save.best;
  }

  // ================= sound =================
  const Sound = (() => {
    let ac = null, sfxG, musG, noiseBuf, timer = null, mode = 'off', nextT = 0, step = 0;
    const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ac = new AC();
        const master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
        sfxG = ac.createGain(); sfxG.connect(master);
        musG = ac.createGain(); musG.connect(master);
        applySettings();
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        if (mode !== 'off') startLoop();
      } catch (e) { ac = null; }
    }
    function applySettings() {
      if (!ac) return;
      sfxG.gain.value = save.settings.sfx ? 0.6 : 0;
      musG.gain.value = save.settings.music ? 0.3 : 0;
    }
    function tone(freq, start, dur, type, vol, dest, glide) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, start);
      if (glide) o.frequency.exponentialRampToValueAtTime(glide, start + dur);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g); g.connect(dest); o.start(start); o.stop(start + dur + 0.03);
    }
    function noise(start, dur, vol, freq, dest) {
      const s = ac.createBufferSource(); s.buffer = noiseBuf;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
      const g = ac.createGain(); g.gain.setValueAtTime(vol, start); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      s.connect(f); f.connect(g); g.connect(dest); s.start(start); s.stop(start + dur + 0.03);
    }
    const seq = (notes, gap, dur, type, vol) => { const t = ac.currentTime; notes.forEach((m, i) => tone(mf(m), t + i * gap, dur, type, vol, sfxG)); };
    const SFX = {
      star: () => seq([84, 91], 0.06, 0.14, 'sine', 0.25),
      hit: () => { const t = ac.currentTime; noise(t, 0.5, 0.7, 900, sfxG); tone(170, t, 0.55, 'sine', 0.5, sfxG, 40); },
      level: () => seq([72, 76, 79, 84], 0.07, 0.16, 'triangle', 0.22),
      warn: () => { const t = ac.currentTime; for (let i = 0; i < 3; i++) tone(420, t + i * 0.55, 0.4, 'square', 0.1, sfxG, 840); },
      clear: () => seq([67, 72, 76, 79, 84], 0.09, 0.28, 'triangle', 0.25),
      buy: () => seq([88, 93], 0.08, 0.2, 'square', 0.1),
      ach: () => seq([79, 83, 86, 91], 0.07, 0.32, 'sine', 0.22),
      click: () => seq([76], 0, 0.05, 'triangle', 0.14),
      tick: () => seq([81], 0, 0.12, 'sine', 0.22),
      go: () => seq([88], 0, 0.25, 'sine', 0.25),
    };
    function play(name) { if (ac && save.settings.sfx) try { SFX[name](); } catch (e) {} }

    const SONGS = {
      normal: { bpm: 116, chords: [[45, [57, 60, 64]], [41, [57, 60, 65]], [48, [60, 64, 67]], [43, [59, 62, 67]]] },
      boss: { bpm: 152, chords: [[45, [57, 60, 64]], [45, [57, 60, 64]], [41, [57, 60, 65]], [40, [56, 59, 64]]] },
    };
    const ARP = [0, 1, 2, 1, 0, 2, 1, 2];
    function schedule() {
      if (!ac || mode === 'off') return;
      const song = SONGS[mode], sd = 60 / song.bpm / 2;
      if (nextT < ac.currentTime) nextT = ac.currentTime + 0.02;
      while (nextT < ac.currentTime + 0.15) {
        const bar = Math.floor(step / 8) % 4, s = step % 8, [root, tones] = song.chords[bar];
        if (mode === 'boss' ? s % 2 === 0 : s === 0 || s === 4) tone(mf(root), nextT, sd * (mode === 'boss' ? 1.6 : 3.6), 'triangle', 0.5, musG);
        tone(mf(tones[ARP[s]] + 12), nextT, sd * 0.85, 'square', 0.06, musG);
        if (s % 2 === 1) noise(nextT, 0.04, 0.1, 7000, musG);
        nextT += sd; step++;
      }
    }
    function startLoop() { if (!timer) { nextT = ac.currentTime + 0.05; timer = setInterval(schedule, 25); } }
    function music(m) {
      if (m === mode) return;
      mode = m; step = 0;
      if (!ac) return;
      if (m === 'off') { clearInterval(timer); timer = null; } else startLoop();
    }
    return {
      init, play, music, applySettings,
      suspend: () => { if (ac) ac.suspend().catch(() => {}); },
      resume: () => { if (ac) ac.resume().catch(() => {}); },
    };
  })();

  function renderToggles() {
    for (const b of document.querySelectorAll('[data-setting]')) {
      const on = save.settings[b.dataset.setting];
      b.setAttribute('aria-pressed', String(on));
      b.textContent = { sfx: '효과음 ', music: '배경음 ', vibe: '진동 ' }[b.dataset.setting] + (on ? '켜짐' : '꺼짐');
    }
  }
  for (const b of document.querySelectorAll('[data-setting]')) {
    b.addEventListener('click', () => {
      const k = b.dataset.setting;
      save.settings[k] = !save.settings[k];
      persist(); Sound.applySettings(); renderToggles();
      if (k === 'vibe' && save.settings.vibe) buzz(40);
    });
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('button')) return;
    Sound.init();
    Sound.play('click');
  }, true);

  // ================= helpers =================
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };
  let clock = 0;
  const skinColor = (id, time) => id === 'rainbow' ? `hsl(${(time * 90) % 360},90%,72%)` : findItem('skin', id).color;

  function starPath(c, x, y, r, rot, points = 5, inner = 0.45) {
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rr = i % 2 ? r * inner : r;
      const a = rot + i * Math.PI / points - Math.PI / 2;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  }
  function heartPath(c, x, y, s) {
    y -= s * 0.5;
    c.beginPath();
    c.moveTo(x, y + s * 0.3);
    c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    c.closePath();
  }
  const rrect = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

  // ================= backgrounds =================
  const BGS = {
    night: ['#080f27', '#13224a'],
    dusk: ['#150d31', '#4a2150'],
    deepsea: ['#021620', '#053448'],
    nebula: ['#0a0820', '#1c1140'],
    aurora: ['#04121c', '#0b2733'],
  };
  function makeDots(w, h, n) {
    return Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, s: rand(0.4, 1.6), v: rand(6, 22) }));
  }
  function stepDots(dots, dt, w, h, bg) {
    const up = bg === 'deepsea';
    for (const s of dots) {
      s.y += (up ? -s.v * 1.4 : s.v) * dt;
      if (!up && s.y > h) { s.y = -2; s.x = Math.random() * w; }
      if (up && s.y < -4) { s.y = h + 2; s.x = Math.random() * w; }
    }
  }
  function drawBg(c, w, h, bg, time, dots) {
    const [top, bot] = BGS[bg] || BGS.night;
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (bg === 'dusk') {
      const rg = c.createRadialGradient(w * 0.5, h * 1.05, 0, w * 0.5, h * 1.05, Math.max(w, h) * 0.7);
      rg.addColorStop(0, 'rgba(255,140,90,0.32)'); rg.addColorStop(1, 'rgba(255,140,90,0)');
      c.fillStyle = rg; c.fillRect(0, 0, w, h);
    } else if (bg === 'nebula') {
      const blobs = [[0.25, 0.3, '255,92,170'], [0.75, 0.55, '90,140,255'], [0.4, 0.8, '160,100,255']];
      for (const [bx, by, col] of blobs) {
        const rg = c.createRadialGradient(w * bx, h * by, 0, w * bx, h * by, Math.max(w, h) * 0.4);
        rg.addColorStop(0, `rgba(${col},0.22)`); rg.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = rg; c.fillRect(0, 0, w, h);
      }
    } else if (bg === 'aurora') {
      const cols = ['rgba(90,255,180,0.13)', 'rgba(80,200,255,0.10)', 'rgba(170,120,255,0.08)'];
      cols.forEach((col, k) => {
        const base = h * (0.16 + k * 0.09), amp = h * 0.04;
        c.beginPath(); c.moveTo(0, base);
        for (let x = 0; x <= w + 10; x += 10) c.lineTo(x, base + Math.sin(x / w * 5 + time * (0.6 + k * 0.25) + k) * amp);
        for (let x = w + 10; x >= 0; x -= 10) c.lineTo(x, base + h * 0.12 + Math.sin(x / w * 4 + time * 0.5 + k * 2) * amp);
        c.closePath(); c.fillStyle = col; c.fill();
      });
    } else if (bg === 'deepsea') {
      c.fillStyle = 'rgba(140,230,255,0.05)';
      for (let k = 0; k < 4; k++) {
        const x0 = w * (0.1 + k * 0.26) + Math.sin(time * 0.3 + k) * 12;
        c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + w * 0.08, 0); c.lineTo(x0 + w * 0.22, h); c.lineTo(x0 + w * 0.1, h); c.closePath(); c.fill();
      }
    }
    if (bg === 'deepsea') {
      c.strokeStyle = 'rgba(190,240,255,0.35)'; c.lineWidth = 1;
      for (const s of dots) { c.beginPath(); c.arc(s.x, s.y, s.s * 1.6, 0, Math.PI * 2); c.stroke(); }
    } else {
      c.fillStyle = 'rgba(244,239,228,0.55)';
      for (const s of dots) c.fillRect(s.x, s.y, s.s, s.s);
    }
  }

  // ================= character =================
  function drawHat(c, x, y, r, hat) {
    if (hat === 'ribbon') {
      const cx = x + r * 0.45, cy = y - r * 0.8;
      c.fillStyle = '#ff5c8a';
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - r * 0.6, cy - r * 0.38); c.lineTo(cx - r * 0.55, cy + r * 0.38); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + r * 0.6, cy - r * 0.38); c.lineTo(cx + r * 0.55, cy + r * 0.38); c.closePath(); c.fill();
      c.fillStyle = '#ff8fb0'; c.beginPath(); c.arc(cx, cy, r * 0.17, 0, Math.PI * 2); c.fill();
    } else if (hat === 'flower') {
      const cx = x - r * 0.5, cy = y - r * 0.75;
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        c.beginPath(); c.arc(cx + Math.cos(a) * r * 0.24, cy + Math.sin(a) * r * 0.24, r * 0.2, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#ffc45c'; c.beginPath(); c.arc(cx, cy, r * 0.16, 0, Math.PI * 2); c.fill();
    } else if (hat === 'party') {
      c.fillStyle = '#4fd8ff';
      c.beginPath(); c.moveTo(x - r * 0.5, y - r * 0.8); c.lineTo(x + r * 0.5, y - r * 0.8); c.lineTo(x + r * 0.12, y - r * 2.05); c.closePath(); c.fill();
      c.fillStyle = '#ff5c8a';
      c.beginPath(); c.arc(x - r * 0.05, y - r * 1.15, r * 0.1, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + r * 0.2, y - r * 1.45, r * 0.08, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + r * 0.12, y - r * 2.05, r * 0.17, 0, Math.PI * 2); c.fill();
    } else if (hat === 'crown') {
      const b = y - r * 0.72, h = r * 0.75, w = r * 0.62;
      c.fillStyle = '#ffd84a';
      c.beginPath();
      c.moveTo(x - w, b); c.lineTo(x - w, b - h); c.lineTo(x - w * 0.5, b - h * 0.5); c.lineTo(x, b - h * 1.1);
      c.lineTo(x + w * 0.5, b - h * 0.5); c.lineTo(x + w, b - h); c.lineTo(x + w, b); c.closePath(); c.fill();
      c.strokeStyle = '#c9951c'; c.lineWidth = Math.max(1, r * 0.06); c.stroke();
      c.fillStyle = '#ff5c8a'; c.beginPath(); c.arc(x, b - h * 0.3, r * 0.11, 0, Math.PI * 2); c.fill();
    } else if (hat === 'wizard') {
      c.fillStyle = '#6b4bd6';
      c.beginPath(); c.ellipse(x, y - r * 0.8, r * 0.95, r * 0.22, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x - r * 0.55, y - r * 0.85); c.lineTo(x + r * 0.55, y - r * 0.85); c.lineTo(x + r * 0.55, y - r * 2.45); c.closePath(); c.fill();
      c.fillStyle = '#ffd84a'; starPath(c, x + r * 0.05, y - r * 1.35, r * 0.2, 0); c.fill();
    }
  }

  function drawFace(c, x, y, r, face) {
    const ex = r * 0.32, ey = y - r * 0.12, er = r * 0.13;
    c.fillStyle = C.deep; c.strokeStyle = C.deep;
    c.lineWidth = Math.max(1.2, r * 0.09); c.lineCap = 'round';
    const dot = (dx, rr = er) => { c.beginPath(); c.arc(x + dx, ey, rr, 0, Math.PI * 2); c.fill(); };
    const happy = (dx) => { c.beginPath(); c.arc(x + dx, ey + r * 0.05, r * 0.14, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); };
    const smile = () => { c.beginPath(); c.arc(x, y + r * 0.12, r * 0.2, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); };
    if (face === 'smile') { happy(-ex); happy(ex); smile(); }
    else if (face === 'wink') { dot(-ex); happy(ex); smile(); }
    else if (face === 'wow') { dot(-ex, er * 1.25); dot(ex, er * 1.25); c.beginPath(); c.ellipse(x, y + r * 0.32, r * 0.1, r * 0.13, 0, 0, Math.PI * 2); c.fill(); }
    else if (face === 'cat') {
      dot(-ex); dot(ex);
      c.beginPath(); c.arc(x - r * 0.1, y + r * 0.2, r * 0.1, 0, Math.PI); c.arc(x + r * 0.1, y + r * 0.2, r * 0.1, 0, Math.PI); c.stroke();
      c.lineWidth = Math.max(1, r * 0.05);
      for (const sx of [-1, 1]) for (const dy of [-0.06, 0.08]) {
        c.beginPath(); c.moveTo(x + sx * r * 0.45, y + r * (0.15 + dy)); c.lineTo(x + sx * r * 0.9, y + r * (0.1 + dy * 2)); c.stroke();
      }
    } else if (face === 'shades') {
      c.fillStyle = '#10131f';
      rrect(c, x - r * 0.72, ey - r * 0.16, r * 0.6, r * 0.34, r * 0.1); c.fill();
      rrect(c, x + r * 0.12, ey - r * 0.16, r * 0.6, r * 0.34, r * 0.1); c.fill();
      c.fillRect(x - r * 0.15, ey - r * 0.08, r * 0.3, r * 0.07);
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(x - r * 0.62, ey - r * 0.1, r * 0.14, r * 0.06); c.fillRect(x + r * 0.22, ey - r * 0.1, r * 0.14, r * 0.06);
      c.strokeStyle = C.deep; c.lineWidth = Math.max(1.2, r * 0.09);
      c.beginPath(); c.moveTo(x - r * 0.15, y + r * 0.35); c.lineTo(x + r * 0.2, y + r * 0.3); c.stroke();
    } else { dot(-ex); dot(ex); }
    if (face !== 'shades') {
      c.fillStyle = 'rgba(255,92,138,0.35)';
      c.beginPath(); c.ellipse(x - r * 0.55, y + r * 0.2, r * 0.17, r * 0.1, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + r * 0.55, y + r * 0.2, r * 0.17, r * 0.1, 0, 0, Math.PI * 2); c.fill();
    }
  }

  function drawHero(c, x, y, r, look, time) {
    const col = skinColor(look.skin, time);
    c.save();
    c.shadowColor = col; c.shadowBlur = r * 1.5;
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.restore();
    drawFace(c, x, y, r, look.face);
    drawHat(c, x, y, r, look.hat);
  }

  function emitTrail(list, kind, x, y, r, scale, time) {
    if (kind === 'none') return;
    const p = { x: x + rand(-r * 0.5, r * 0.5), y: y + r * 0.6, vx: rand(-20, 20) * scale, vy: rand(70, 130) * scale, life: 0.7, max: 0.7, kind, s: r };
    if (kind === 'rainbow') { p.x = x; p.y = y + r * 0.3; p.vx = 0; p.vy = 170 * scale; p.life = p.max = 0.45; p.hue = (time * 240) % 360; }
    if (kind === 'bubble') { p.vy *= 0.6; p.life = p.max = 1; }
    list.push(p);
  }
  function drawTrail(c, list) {
    for (const p of list) {
      const k = clamp(p.life / p.max, 0, 1);
      c.globalAlpha = k;
      if (p.kind === 'sparkle') {
        c.fillStyle = Math.random() < 0.5 ? '#fff6c8' : '#ffffff';
        starPath(c, p.x, p.y, p.s * 0.28, 0, 4, 0.35); c.fill();
      } else if (p.kind === 'heart') {
        c.fillStyle = '#ff7aa8'; heartPath(c, p.x, p.y, p.s * 0.55); c.fill();
      } else if (p.kind === 'bubble') {
        c.strokeStyle = '#bfe8ff'; c.lineWidth = Math.max(1, p.s * 0.07);
        c.beginPath(); c.arc(p.x, p.y, p.s * (0.15 + (1 - k) * 0.3), 0, Math.PI * 2); c.stroke();
      } else if (p.kind === 'rainbow') {
        c.fillStyle = `hsl(${p.hue},90%,65%)`;
        c.beginPath(); c.arc(p.x, p.y, p.s * 0.7 * k, 0, Math.PI * 2); c.fill();
      }
    }
    c.globalAlpha = 1;
  }
  function stepTrail(list, dt) {
    for (const p of list) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    return list.filter((p) => p.life > 0);
  }

  // ================= notes (achievement toasts) =================
  const noteEl = $('note'); const noteQueue = []; let noteBusy = false;
  function note(text) { noteQueue.push(text); if (!noteBusy) nextNote(); }
  function nextNote() {
    const text = noteQueue.shift();
    if (!text) { noteBusy = false; noteEl.hidden = true; return; }
    noteBusy = true; noteEl.textContent = text; noteEl.hidden = false;
    setTimeout(nextNote, 2300);
  }

  // ================= achievements =================
  let runAch = [];
  function checkAch(run) {
    for (const a of ACH) {
      if (save.ach.includes(a.id) || !a.test(run, save.stats)) continue;
      save.ach.push(a.id); save.stars += a.reward; runAch.push(a);
      note(`업적 달성! ${a.name} · ★+${a.reward}`);
      Sound.play('ach');
      walletEl.textContent = save.stars;
    }
  }
  const idleRun = () => ({ time: 0, score: 0, stars: 0, boss: 0 });

  function renderAch() {
    $('achCount').textContent = `${save.ach.length} / ${ACH.length}`;
    const list = $('achList'); list.textContent = '';
    for (const a of ACH) {
      const done = save.ach.includes(a.id);
      const row = document.createElement('div'); row.className = 'ach' + (done ? ' done' : '');
      const ic = document.createElement('div'); ic.className = 'ic'; ic.textContent = done ? '✓' : '·'; row.appendChild(ic);
      const mid = document.createElement('div');
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = a.name; mid.appendChild(nm);
      const ds = document.createElement('div'); ds.className = 'ds'; ds.textContent = a.desc; mid.appendChild(ds);
      const tt = document.createElement('div'); tt.className = 'tt'; tt.textContent = '칭호 「' + a.title + '」'; mid.appendChild(tt);
      row.appendChild(mid);
      const side = document.createElement('div'); side.className = 'side';
      const rw = document.createElement('span'); rw.textContent = '★ ' + a.reward; side.appendChild(rw);
      if (done) {
        const b = document.createElement('button'); b.type = 'button';
        const using = save.title === a.title;
        b.textContent = using ? '사용중' : '칭호 달기';
        if (using) b.className = 'using';
        b.addEventListener('click', () => { save.title = using ? '' : a.title; persist(); refreshHud(); renderAch(); });
        side.appendChild(b);
      } else if (a.prog) {
        const [cur, goal] = a.prog(save.stats);
        const pg = document.createElement('span'); pg.textContent = `${Math.min(cur, goal)}/${goal}`; side.appendChild(pg);
      }
      row.appendChild(side);
      list.appendChild(row);
    }
  }

  // ================= ranking (Supabase) =================
  const RANK_API = { url: 'https://tupljvsqfhvbrkkjffrx.supabase.co', key: 'sb_publishable_JfXZOw0mpDAoCPigCzR7sQ_FZY9uHfM' };
  async function rpc(name, args, keepalive) {
    const res = await fetch(`${RANK_API.url}/rest/v1/rpc/${name}`, {
      method: 'POST', keepalive: !!keepalive,
      headers: { apikey: RANK_API.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { const err = new Error((data && data.message) || 'HTTP ' + res.status); err.server = true; throw err; }
    return data;
  }
  async function verifyRun(body) {
    const res = await fetch(`${RANK_API.url}/functions/v1/verify-run`, {
      method: 'POST',
      headers: { apikey: RANK_API.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { const err = new Error((data && (data.error || data.message)) || 'HTTP ' + res.status); err.server = true; throw err; }
    return data;
  }
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const rankError = (e) => {
    if (!e || !e.server) return '랭킹 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요. Claude 링크에서는 랭킹이 동작하지 않으니 GitHub Pages 주소에서 해주세요.';
    const m = e.message || '';
    if (/nickname/.test(m)) return '닉네임은 1~12자로 정해 주세요.';
    if (/too many runs/.test(m)) return '짧은 시간에 너무 많이 시작했어요. 잠시 뒤에 다시 해주세요.';
    if (/too slow|heartbeat|paused|missing/.test(m)) return '게임이 중간에 멈추거나 느려져서 이번 판은 랭킹에 올리지 못했어요. 인터넷이 안정적인 곳에서 다시 해보세요.';
    if (/too many pauses/.test(m)) return '일시정지를 너무 많이 해서 이번 판은 랭킹에 올리지 못했어요.';
    return '기록을 확인하지 못해서 랭킹에 올리지 못했어요.';
  };
  const cleanNick = (s) => s.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12);

  // net = { id, queue } while the current run is ranked, otherwise null
  let net = null, pauseCount = 0;
  function beat(paused) {
    if (!net) return;
    const n = net, args = { p_run: n.id, p_device: save.device, p_tick: sim.tick, p_paused: paused };
    n.queue = n.queue.then(() => rpc('heartbeat', args, true).catch(() => rpc('heartbeat', args, true)).catch(() => {}));
  }

  let pendingRun = null;
  const rankBox = $('rankBox'), rankMsg = $('rankMsg'), nickForm = $('nickForm'), nickInput = $('nickInput');

  async function submitRun(run) {
    rankBox.hidden = false; nickForm.hidden = true;
    rankMsg.className = 'msg'; rankMsg.textContent = '기록을 확인하는 중…';
    try {
      if (!run.net) throw new Error('offline');
      await run.net.queue;
      const deltas = new Array(run.inputs.length);
      let prev = 0;
      for (let i = 0; i < run.inputs.length; i++) { deltas[i] = run.inputs[i] - prev; prev = run.inputs[i]; }
      const res = await verifyRun({
        run: run.net.id, device: save.device, nickname: save.nickname, title: save.title,
        look: { skin: save.equip.skin, hat: save.equip.hat, face: save.equip.face }, inputs: deltas,
      });
      pendingRun = null;
      rankMsg.textContent = res.score >= res.best ? `전체 ${res.rank}위에 올랐어요!` : `전체 ${res.rank}위 · 내 최고 ${res.best}점`;
    } catch (e) {
      rankMsg.className = 'msg err';
      rankMsg.textContent = run.net ? rankError(e) : '랭킹 서버에 연결하지 못한 채로 시작해서 이번 판은 랭킹에 올라가지 않아요.';
      if (e && e.server && /nickname/.test(e.message)) nickForm.hidden = false;
    }
  }

  function rankAfterRun(run) {
    pendingRun = null;
    if (run.score <= 0) { rankBox.hidden = true; return; }
    if (!run.net) {
      rankBox.hidden = false; nickForm.hidden = true;
      rankMsg.className = 'msg err'; rankMsg.textContent = '랭킹 서버에 연결하지 못한 채로 시작해서 이번 판은 랭킹에 올라가지 않아요.';
      return;
    }
    if (save.nickname) { submitRun(run); return; }
    pendingRun = run;
    rankBox.hidden = false; nickForm.hidden = false;
    rankMsg.className = 'msg'; rankMsg.textContent = '닉네임을 정하면 랭킹에 올라가요';
    nickInput.value = '';
  }
  nickForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nick = cleanNick(nickInput.value);
    if (!nick) { rankMsg.textContent = '닉네임을 입력해 주세요'; return; }
    save.nickname = nick; persist();
    nickInput.blur();
    if (pendingRun) submitRun(pendingRun);
  });

  function lookIcon(look, size) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = size * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const l = { skin: findItem('skin', look && look.skin).id, hat: findItem('hat', look && look.hat).id, face: findItem('face', look && look.face).id };
    drawHero(g, size / 2, size * (l.hat === 'none' ? 0.5 : 0.62), size * (l.hat === 'none' ? 0.3 : 0.26), l, 0);
    return c;
  }

  let rankReq = 0;
  async function loadRank() {
    const list = $('rankList'), state = $('rankState'), mine = $('myRank');
    $('nickInput2').value = save.nickname;
    list.textContent = ''; mine.hidden = true; $('rankPlayers').textContent = '';
    state.hidden = false; state.textContent = '불러오는 중…';
    const req = ++rankReq;
    try {
      const data = await rpc('get_leaderboard', { p_device: save.device });
      if (req !== rankReq) return;
      $('rankPlayers').textContent = `${data.players}명`;
      if (!data.top.length) { state.textContent = '아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!'; return; }
      state.hidden = true;
      for (const r of data.top) {
        const row = document.createElement('div');
        row.className = 'rk' + (data.me && data.me.rank === r.rank && data.me.score === r.score && data.me.nickname === r.nickname ? ' me' : '');
        const no = document.createElement('div'); no.className = 'no'; no.textContent = r.rank; row.appendChild(no);
        row.appendChild(lookIcon(r.look, 40));
        const who = document.createElement('div'); who.className = 'who';
        const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = r.nickname; who.appendChild(nm);
        if (r.title) { const tt = document.createElement('div'); tt.className = 'tt'; tt.textContent = r.title; who.appendChild(tt); }
        row.appendChild(who);
        const sc = document.createElement('div'); sc.className = 'sc'; sc.textContent = r.score;
        const sm = document.createElement('small'); sm.textContent = `${Number(r.time).toFixed(1)}초`; sc.appendChild(sm);
        row.appendChild(sc);
        list.appendChild(row);
      }
      if (data.me) { mine.hidden = false; mine.textContent = `내 순위 ${data.me.rank}위 · ${data.me.score}점`; }
    } catch (e) {
      if (req !== rankReq) return;
      state.textContent = rankError(e);
    }
  }
  $('nickForm2').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nick = cleanNick($('nickInput2').value), state = $('rankState');
    $('nickInput2').blur();
    if (!nick) return;
    save.nickname = nick; persist();
    try { await rpc('set_nickname', { p_device: save.device, p_nickname: nick }); loadRank(); }
    catch (err) { state.hidden = false; state.textContent = rankError(err); }
  });

  // ================= game state =================
  // The simulation (src/sim.js) runs in a 400-unit-wide world; `view` maps it onto the screen.
  let W = 0, H = 0, worldH = 680;
  const view = { s: 1, ox: 0, oy: 0 };
  let sim = createSim(1, worldH);
  let state = 'ready'; // ready | starting | play | paused | countdown | dying | over
  let acc = 0, inputs = [], desiredX = 200, runStars = 0, dyingT = 0, countdown = 0, achT = 0, trailT = 0;
  let banner = { text: '', t: 0, color: C.amber };
  let sparks = [], dots = [], trail = [];
  const showBanner = (text, color = C.amber, dur = 1.6) => { banner = { text, t: dur, color }; };
  let shownLevel = '';
  function renderLevel() {
    const key = sim.level + (runTest ? 't' : '');
    if (key === shownLevel) return;
    shownLevel = key;
    lvEl.textContent = 'Lv.' + sim.level;
    if (runTest) { const t = document.createElement('span'); t.className = 'test'; t.textContent = ' · 테스트'; lvEl.appendChild(t); }
  }
  const runInfo = () => ({ time: sim.t, score: sim.score, stars: runStars, boss: sim.storms });
  // same rounding the server uses for the leaderboard
  const secs = () => (Math.round(sim.tick / 6) / 10).toFixed(1);

  const fitWorldH = () => Math.round(clamp(400 * H / Math.max(W, 1), 560, 900));
  function updateView() {
    view.s = Math.min(W / 400, H / worldH);
    view.ox = (W - 400 * view.s) / 2;
    view.oy = (H - worldH * view.s) / 2;
  }

  function resize() {
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state === 'ready') { worldH = fitWorldH(); sim = createSim(1, worldH); }
    updateView();
    dots = makeDots(W, H, Math.round(W * H / 5000));
    if (!screens.shop.hidden) sizePreview();
  }

  let runTest = false;
  const testOpts = { invincible: false, startLevel: 1, speed: 1 };
  async function start(test) {
    test = test === true;
    if (state === 'starting') return;
    Sound.init();
    const prevState = state;
    state = 'starting';
    for (const b of [$('startBtn'), $('againBtn')]) { b.disabled = true; b.dataset.label = b.dataset.label || b.textContent; b.textContent = '준비 중…'; }
    worldH = fitWorldH(); updateView();
    net = null; pauseCount = 0;
    let seed = Math.floor(Math.random() * 2147483646) + 1;
    if (test) {
      for (const b of [$('startBtn'), $('againBtn')]) { b.disabled = false; b.textContent = b.dataset.label; }
      begin(seed, { invincible: testOpts.invincible, startLevel: testOpts.startLevel });
      return;
    }
    try {
      const args = { p_device: save.device, p_h: worldH };
      if (save.ownerKey) args.p_key = save.ownerKey;
      const r = await withTimeout(rpc('start_run', args), 3500);
      net = { id: r.id, queue: Promise.resolve() };
      seed = Number(r.seed);
    } catch (e) {
      net = null;
      if (e.server && /maintenance/.test(e.message)) {
        for (const b of [$('startBtn'), $('againBtn')]) { b.disabled = false; b.textContent = b.dataset.label; }
        state = prevState;
        checkStatus();
        return;
      }
    }
    for (const b of [$('startBtn'), $('againBtn')]) { b.disabled = false; b.textContent = b.dataset.label; }
    begin(seed);
  }

  function begin(seed, opts) {
    runTest = !!opts;
    sim = createSim(seed, worldH, opts);
    inputs = []; desiredX = sim.player.x; acc = 0;
    runStars = 0; runAch = []; achT = 0; banner.t = 0;
    sparks = []; trail = [];
    state = 'play';
    overlay.hidden = true; pauseBtn.hidden = false; hud.hidden = false;
    noteEl.classList.remove('mid');
    scoreEl.textContent = '0'; renderLevel();
    Sound.music('normal');
    if (runTest) note(`테스트 판 · 랭킹 제외${testOpts.invincible ? ' · 무적' : ''}${testOpts.speed !== 1 ? ` · ${testOpts.speed}배속` : ''}`);
    else if (!net) note('랭킹 서버에 연결하지 못해서 이번 판은 연습 판이에요');
  }

  function pause() {
    if (state !== 'play' && state !== 'countdown') return;
    if (state === 'play') {
      beat(true);
      if (net && ++pauseCount > 8) { net = null; note('일시정지를 8번 넘게 해서 이번 판은 연습 판이 됐어요'); }
    }
    state = 'paused'; pauseBtn.hidden = true; dragId = null;
    Sound.music('off');
    $('pauseInfo').textContent = `${secs()}초 · Lv.${sim.level} · ${sim.score}점`;
    persist();
    show('pause');
  }
  function resume() {
    overlay.hidden = true; pauseBtn.hidden = false;
    state = 'countdown'; countdown = 3; Sound.play('tick');
  }

  function toScreen(x, y) { return [view.ox + x * view.s, view.oy + y * view.s]; }

  function handle(events) {
    for (const e of events) {
      if (e.type === 'star') {
        runStars++;
        if (!runTest) { save.stars++; save.stats.totalStars++; challengeAdd('stars', 1); }
        walletEl.textContent = save.stars;
        Sound.play('star');
        for (let i = 0; i < 12; i++) {
          const a = rand(0, Math.PI * 2), sp = rand(40, 160);
          sparks.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, max: 0.5, c: C.ink });
        }
        buzz(20);
      } else if (e.type === 'dodge') {
        if (!runTest) { save.stats.dodged += e.n; challengeAdd('dodged', e.n); }
      } else if (e.type === 'level') {
        showBanner(`Lv.${e.level} 속도 UP!`); Sound.play('level');
      } else if (e.type === 'bossWarn') {
        showBanner('운석 폭풍 경보!', C.boss, 2.2); Sound.play('warn'); Sound.music('boss');
      } else if (e.type === 'bossClear') {
        runStars += 3;
        if (!runTest) { save.stars += 3; save.stats.totalStars += 3; }
        walletEl.textContent = save.stars;
        showBanner('폭풍 통과! +200 ★+3', C.amber, 2); Sound.play('clear'); Sound.music('normal');
      } else if (e.type === 'hit') {
        die();
      }
    }
  }

  function die() {
    state = 'dying'; dyingT = 0.8; pauseBtn.hidden = true;
    beat(true);
    Sound.music('off'); Sound.play('hit');
    const col = skinColor(save.equip.skin, clock), p = sim.player;
    for (let i = 0; i < 36; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(60, 320);
      sparks.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 1), max: 1,
        c: Math.random() < 0.6 ? col : C.coral });
    }
    buzz(150);
  }

  function finishRun(quit) {
    if (quit) beat(true);
    state = 'over'; pauseBtn.hidden = true;
    Sound.music('off');
    if (!runTest) {
      save.stats.runs++;
      checkAch(runInfo());
      challengeAdd('runs', 1);
      challengeRun(runInfo());
    }
    const score = sim.score, isNew = !runTest && score > save.best;
    if (isNew) save.best = score;
    persist(); refreshHud();
    $('overHead').textContent = quit ? '여기까지 했어요' : '운석에 맞았어요';
    $('final').textContent = score;
    $('newbest').hidden = !isNew;
    $('gain').textContent = runTest ? `테스트 판 · 별 ${runStars}개 (보유 별에는 안 들어가요)`
      : runStars ? `별 ${runStars}개 획득 · 보유 ★${save.stars}` : `보유 ★${save.stars}`;
    $('overInfo').textContent = `버틴 시간 ${secs()}초 · Lv.${sim.level}${sim.storms ? ` · 폭풍 ${sim.storms}번 통과` : ''} · 최고 ${save.best}`;
    const na = $('newAch');
    na.hidden = !runAch.length;
    na.textContent = '';
    for (const a of runAch) { const d = document.createElement('div'); d.textContent = `새 업적 「${a.name}」 ★+${a.reward}`; na.appendChild(d); }
    show('over');
    if (runTest) {
      rankBox.hidden = false; nickForm.hidden = true;
      rankMsg.className = 'msg err'; rankMsg.textContent = '테스트 판이라 랭킹에 올리지 않았어요.';
    } else rankAfterRun({ net, inputs, score });
    net = null;
    if (nickForm.hidden) $('againBtn').focus({ preventScroll: true });
  }

  let returnTo = 'home';
  function show(name) {
    for (const k in screens) screens[k].hidden = k !== name;
    overlay.hidden = false;
    overlay.dataset.screen = name;
    noteEl.classList.toggle('mid', name === 'home');
    hud.hidden = state === 'ready' || state === 'starting';
    if (name === 'home') renderHome();
    if (name === 'settings') { $('nickInput4').value = save.nickname; $('nickNote4').textContent = ''; resetArm = 0; renderReset(); }
    if (name === 'attend') renderAttend();
    if (name === 'admin') renderAdmin();
    if (name === 'shop') openShop();
    if (name === 'ach') renderAch();
    if (name === 'rank') loadRank();
    if (name === 'home' || name === 'over') returnTo = name;
  }

  // ================= input =================
  let dragId = null, lastX = 0;
  const keys = { left: false, right: false };
  const steering = () => state === 'play' || state === 'countdown';
  cv.addEventListener('pointerdown', (e) => {
    if (!steering()) return;
    dragId = e.pointerId; lastX = e.clientX;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragId || !steering()) return;
    desiredX = clamp(desiredX + (e.clientX - lastX) * 1.25 / view.s, sim.player.r, 400 - sim.player.r);
    lastX = e.clientX;
  });
  const endDrag = (e) => { if (e.pointerId === dragId) dragId = null; };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'p' || e.key === 'Escape') { if (steering()) pause(); else if (state === 'paused') resume(); }
  });
  addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });
  $('startBtn').addEventListener('click', () => start(false));
  $('againBtn').addEventListener('click', () => start(runTest));
  pauseBtn.addEventListener('click', pause);
  $('resumeBtn').addEventListener('click', resume);
  $('quitBtn').addEventListener('click', () => finishRun(true));
  $('homeBtn').addEventListener('click', goHome);
  for (const b of document.querySelectorAll('[data-open]')) b.addEventListener('click', () => show(b.dataset.open));
  for (const b of document.querySelectorAll('[data-back]')) b.addEventListener('click', () => show(returnTo));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); Sound.suspend(); } else Sound.resume();
  });
  addEventListener('blur', pause);
  addEventListener('resize', resize);
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // ================= update =================
  function update(dt) {
    clock += dt;
    if (state === 'paused') return;
    stepDots(dots, dt, W, H, save.equip.bg);
    if (banner.t > 0) banner.t -= dt;

    if (state === 'countdown') {
      const before = Math.ceil(countdown);
      countdown -= dt;
      if (countdown <= 0) {
        state = 'play'; acc = 0; beat(false);
        Sound.play('go'); Sound.music(sim.boss ? 'boss' : 'normal');
      } else if (Math.ceil(countdown) !== before) Sound.play('tick');
      return;
    }

    if (state === 'play') {
      if (keys.left) desiredX -= 420 * dt;
      if (keys.right) desiredX += 420 * dt;
      desiredX = clamp(desiredX, sim.player.r, 400 - sim.player.r);
      acc += dt * (runTest ? testOpts.speed : 1);
      while (acc >= DT && state === 'play') {
        acc -= DT;
        const input = Math.round(desiredX * 2);
        inputs.push(input);
        handle(sim.step(input));
        if (state === 'play' && sim.tick % 300 === 0) beat(false);
      }
      scoreEl.textContent = sim.score;
      renderLevel();
      trailT -= dt;
      if (trailT <= 0) { emitTrail(trail, save.equip.trail, sim.player.x, sim.player.y, sim.player.r, 1, clock); trailT = 1 / 40; }
      achT -= dt;
      if (achT <= 0 && state === 'play' && !runTest) { checkAch(runInfo()); challengeRun(runInfo()); achT = 0.5; }
    }
    if (state === 'dying') {
      sim.coast(dt);
      dyingT -= dt;
      if (dyingT <= 0) finishRun(false);
    }

    trail = stepTrail(trail, dt);
    for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt; }
    sparks = sparks.filter((p) => p.life > 0);
  }

  // ================= draw =================
  function draw() {
    drawBg(ctx, W, H, save.equip.bg, clock, dots);

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.s, view.s);
    const WH = sim.H;

    if (sim.boss && sim.boss.phase === 'warn' && (reduceMotion || Math.floor(clock * 4) % 2 === 0)) {
      const g = ctx.createLinearGradient(0, 0, 0, WH * 0.3);
      g.addColorStop(0, rgba(C.boss, 0.35)); g.addColorStop(1, rgba(C.boss, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 400, WH * 0.3);
    }

    for (const s of sim.pickups) {
      const a = clock * 3 + s.id;
      const pulse = reduceMotion ? 1 : 1 + Math.sin(a * 2) * 0.12;
      ctx.save();
      ctx.shadowColor = C.ink; ctx.shadowBlur = 14; ctx.fillStyle = C.ink;
      starPath(ctx, s.x, s.y, s.r * pulse, a * 0.4); ctx.fill();
      ctx.restore();
    }

    for (const m of sim.rocks) {
      let vx = m.vx;
      if (m.type === 'zigzag') { const f = m.phase - Math.floor(m.phase); vx = (1 - 4 * Math.abs(f - 0.5)) * m.amp * 3; }
      const sp = Math.hypot(vx, m.vy) || 1, len = m.r * 4.5;
      const nx = -vx / sp, ny = -m.vy / sp;
      const tail = ctx.createLinearGradient(m.x, m.y, m.x + nx * len, m.y + ny * len);
      tail.addColorStop(0, rgba(m.color, 0.55)); tail.addColorStop(1, rgba(m.color, 0));
      ctx.strokeStyle = tail; ctx.lineWidth = m.r * 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + nx * len, m.y + ny * len); ctx.stroke();
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      const spin = clock * 2 + m.id;
      ctx.fillStyle = 'rgba(8,15,39,0.28)';
      ctx.beginPath(); ctx.arc(m.x + Math.cos(spin) * m.r * 0.35, m.y + Math.sin(spin) * m.r * 0.35, m.r * 0.28, 0, Math.PI * 2); ctx.fill();
    }

    const p = sim.player;
    if (state !== 'ready' && state !== 'starting') drawTrail(ctx, trail);
    if (state !== 'dying' && state !== 'over' && state !== 'ready' && state !== 'starting') drawHero(ctx, p.x, p.y, p.r, save.equip, clock);

    for (const s of sparks) {
      ctx.globalAlpha = clamp(s.life / s.max, 0, 1);
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (state === 'ready' || state === 'starting') drawHomeScene();

    // wide screens: shade the area outside the play field
    if (view.ox > 1 && state !== 'ready' && state !== 'starting') {
      ctx.fillStyle = 'rgba(4,8,20,0.55)';
      ctx.fillRect(0, 0, view.ox, H); ctx.fillRect(W - view.ox, 0, view.ox, H);
      ctx.strokeStyle = 'rgba(163,173,208,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(view.ox, 0); ctx.lineTo(view.ox, H); ctx.moveTo(W - view.ox, 0); ctx.lineTo(W - view.ox, H); ctx.stroke();
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = view.s;
    if (banner.t > 0 && (state === 'play' || state === 'countdown')) {
      ctx.globalAlpha = clamp(banner.t, 0, 1);
      ctx.fillStyle = banner.color;
      ctx.font = `${Math.round(30 * fs)}px Jua, "Apple SD Gothic Neo", sans-serif`;
      ctx.fillText(banner.text, W / 2, view.oy + WH * 0.36 * view.s);
      ctx.globalAlpha = 1;
    }
    if (state === 'countdown') {
      ctx.fillStyle = C.ink;
      ctx.font = `${Math.round(84 * fs)}px Jua, "Apple SD Gothic Neo", sans-serif`;
      ctx.fillText(String(Math.ceil(countdown)), W / 2, view.oy + WH * 0.5 * view.s);
    }
  }

  // ================= shop =================
  const pv = $('preview'), pctx = pv.getContext('2d');
  let pW = 0, pH = 0, pTrail = [], pTrailT = 0, pDots = [];
  let tab = 'skin', picked = null;
  const previewLook = () => ({ ...save.equip, ...(picked ? { [tab]: picked } : {}) });

  const tabsEl = $('tabs');
  for (const [id, label] of TABS) {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = id; b.textContent = label;
    b.addEventListener('click', () => { tab = id; picked = null; $('toast').textContent = ''; renderShop(); });
    tabsEl.appendChild(b);
  }

  function sizePreview() {
    const r = pv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    pW = r.width; pH = r.height;
    pv.width = Math.round(pW * dpr); pv.height = Math.round(pH * dpr);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pDots = makeDots(pW, pH, 40);
  }

  function drawPreview(dt) {
    if (screens.shop.hidden || overlay.hidden || !pW) return;
    const look = previewLook();
    const r = 24, x = pW / 2 + (reduceMotion ? 0 : Math.sin(clock * 1.6) * 40), y = pH * 0.58;
    pTrailT -= dt;
    if (pTrailT <= 0) { emitTrail(pTrail, look.trail, x, y, r, 0.8, clock); pTrailT = 1 / 40; }
    pTrail = stepTrail(pTrail, dt);
    stepDots(pDots, dt, pW, pH, look.bg);
    pctx.save();
    rrect(pctx, 0, 0, pW, pH, 16); pctx.clip();
    drawBg(pctx, pW, pH, look.bg, clock, pDots);
    drawTrail(pctx, pTrail);
    drawHero(pctx, x, y, r, look, clock);
    pctx.restore();
  }

  function itemIcon(cat, item) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = 46 * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (cat === 'trail') {
      if (item.id !== 'none') {
        const list = [];
        for (let i = 0; i < 7; i++) {
          const k = i / 6;
          list.push({ kind: item.id, x: 23 + Math.sin(i * 1.3) * 8, y: 10 + k * 30, s: 14, life: 1 - k * 0.7, max: 1, hue: i * 50 });
        }
        drawTrail(g, list);
      } else {
        g.strokeStyle = 'rgba(163,173,208,0.6)'; g.lineWidth = 2;
        g.beginPath(); g.arc(23, 23, 12, 0, Math.PI * 2); g.moveTo(15, 31); g.lineTo(31, 15); g.stroke();
      }
    } else if (cat === 'bg') {
      rrect(g, 1, 1, 44, 44, 10); g.clip();
      drawBg(g, 46, 46, item.id, 1.2, makeDots(46, 46, 8));
    } else {
      const look = { ...save.equip, hat: 'none', face: 'basic', [cat]: item.id };
      const hat = cat === 'hat';
      drawHero(g, 23, hat ? 30 : 23, hat ? 12 : 15, look, 0);
    }
    return c;
  }

  function renderShop() {
    $('purse').textContent = save.stars;
    for (const b of tabsEl.children) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    const box = $('items');
    box.textContent = '';
    for (const it of ITEMS[tab]) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'item';
      b.setAttribute('aria-pressed', String(it.id === (picked || save.equip[tab])));
      b.appendChild(itemIcon(tab, it));
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = it.name; b.appendChild(nm);
      const st = document.createElement('span'); st.className = 'st';
      if (save.equip[tab] === it.id) { st.textContent = '장착중'; st.classList.add('on'); }
      else if (owns(tab, it.id)) st.textContent = '보유';
      else { st.textContent = '★ ' + it.price; st.classList.add('price'); }
      b.appendChild(st);
      b.addEventListener('click', () => { picked = it.id; $('toast').textContent = ''; renderShop(); });
      box.appendChild(b);
    }
    const id = picked || save.equip[tab], it = findItem(tab, id), act = $('actBtn');
    if (save.equip[tab] === id) { act.textContent = '장착중'; act.disabled = true; }
    else if (owns(tab, id)) { act.textContent = '장착하기'; act.disabled = false; }
    else if (save.stars >= it.price) { act.textContent = `★${it.price}로 사기`; act.disabled = false; }
    else { act.textContent = `별이 ${it.price - save.stars}개 더 필요해요`; act.disabled = true; }
  }

  $('actBtn').addEventListener('click', () => {
    const id = picked || save.equip[tab], it = findItem(tab, id);
    if (!owns(tab, id)) {
      if (save.stars < it.price) return;
      save.stars -= it.price; save.owned.push(tab + ':' + id); save.stats.buys++;
      $('toast').textContent = `${it.name}을(를) 샀어요!`;
      Sound.play('buy');
      buzz(30);
      checkAch(idleRun());
    } else {
      $('toast').textContent = `${it.name} 장착!`;
    }
    save.equip[tab] = id; picked = null;
    persist(); refreshHud(); renderShop();
  });

  function openShop() {
    picked = null; pTrail = []; $('toast').textContent = '';
    renderShop();
    requestAnimationFrame(sizePreview);
  }

  // ================= home =================
  // Decorative meteors and the player's character floating in the empty middle of the home screen.
  let homeRocks = [], homeLast = 0;
  const HOME_COLORS = ['#ff6a55', '#ff9a3c', '#ff5c8a', '#4fd8ff', '#9b7bff', '#7be06a'];
  function drawHomeScene() {
    const dt = Math.min(clock - homeLast, 0.05); homeLast = clock;
    if (homeRocks.length < Math.max(6, W / 50) && Math.random() < dt * 2.2) {
      const r = rand(6, 16);
      homeRocks.push({ x: rand(0, W), y: -30, r, vy: rand(50, 110), vx: rand(-12, 12), c: HOME_COLORS[Math.floor(Math.random() * HOME_COLORS.length)] });
    }
    for (const m of homeRocks) {
      if (!reduceMotion) { m.y += m.vy * dt; m.x += m.vx * dt; }
      const len = m.r * 4;
      const tail = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.3, m.y - len);
      tail.addColorStop(0, rgba(m.c, 0.45)); tail.addColorStop(1, rgba(m.c, 0));
      ctx.strokeStyle = tail; ctx.lineWidth = m.r * 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.3, m.y - len); ctx.stroke();
      ctx.globalAlpha = 0.85; ctx.fillStyle = m.c;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    homeRocks = homeRocks.filter((m) => m.y < H + 40);
    if (screens.home.hidden || overlay.hidden) return;
    const st = $('homeStage').getBoundingClientRect(), gr = cv.getBoundingClientRect();
    if (st.height < 40) return;
    const r = clamp(Math.min(st.height * 0.24, 44), 18, 44);
    const x = st.left - gr.left + st.width / 2 + (reduceMotion ? 0 : Math.sin(clock * 0.9) * 26);
    const y = st.top - gr.top + st.height * 0.55 + (reduceMotion ? 0 : Math.sin(clock * 1.8) * 8);
    trailT -= dt;
    if (trailT <= 0) { emitTrail(trail, save.equip.trail, x, y, r, 1.4, clock); trailT = 1 / 30; }
    drawTrail(ctx, trail);
    drawHero(ctx, x, y, r, save.equip, clock);
  }

  function goHome() {
    state = 'ready'; pauseBtn.hidden = true; hud.hidden = true;
    worldH = fitWorldH(); sim = createSim(1, worldH); updateView();
    trail = []; sparks = [];
    show('home');
  }

  async function refreshMyRank() {
    try {
      const data = await rpc('get_leaderboard', { p_device: save.device });
      $('homeRankWrap').hidden = !data.me;
      if (data.me) $('homeRank').textContent = data.me.rank + '위';
    } catch (e) { /* offline: keep the home screen as is */ }
  }

  function renderHome() {
    refreshHud();
    $('devBadge').hidden = !isDev;
    $('adminBtn').hidden = !isOwner;
    renderChallenge();
    renderInstall();
    refreshMyRank();
  }

  // ================= dates =================
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

  // ================= daily challenge =================
  const CHALLENGES = [
    { id: 'stars3', text: '한 판에 별 3개 모으기', goal: 3, run: (r) => r.stars },
    { id: 't30', text: '한 판에 30초 버티기', goal: 30, run: (r) => Math.floor(r.time) },
    { id: 's500', text: '한 판에 500점 넘기기', goal: 500, run: (r) => r.score },
    { id: 't45', text: '한 판에 45초 버티기', goal: 45, run: (r) => Math.floor(r.time) },
    { id: 'dodge150', text: '오늘 운석 150개 피하기', goal: 150, sum: 'dodged' },
    { id: 'runs3', text: '오늘 3판 플레이하기', goal: 3, sum: 'runs' },
    { id: 'star8', text: '오늘 별 8개 모으기', goal: 8, sum: 'stars' },
  ];
  const CHALLENGE_REWARD = 5;
  function todayChallenge() {
    const key = dayKey();
    if (!save.challenge || save.challenge.date !== key) {
      let h = 0;
      for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      save.challenge = { date: key, id: CHALLENGES[h % CHALLENGES.length].id, prog: 0, claimed: false, noted: false };
      persist();
    }
    const def = CHALLENGES.find((c) => c.id === save.challenge.id) || CHALLENGES[0];
    return { st: save.challenge, def };
  }
  function challengeProgress(value) {
    const { st, def } = todayChallenge();
    if (value <= st.prog) return;
    st.prog = Math.min(value, def.goal);
    if (st.prog >= def.goal && !st.noted) { st.noted = true; note(`오늘의 도전 달성! 홈에서 ★${CHALLENGE_REWARD} 받기`); Sound.play('ach'); }
  }
  function challengeAdd(kind, n) {
    const { st, def } = todayChallenge();
    if (def.sum === kind) challengeProgress(st.prog + n);
  }
  function challengeRun(run) {
    const { def } = todayChallenge();
    if (def.run) challengeProgress(def.run(run));
  }
  function renderChallenge() {
    const { st, def } = todayChallenge(), done = st.prog >= def.goal;
    $('dailyName').textContent = def.text;
    $('dailyReward').textContent = CHALLENGE_REWARD;
    $('dailyBar').style.width = `${Math.round(st.prog / def.goal * 100)}%`;
    $('dailyBox').className = 'daily' + (st.claimed ? ' claimed' : done ? ' done' : '');
    $('dailyClaim').hidden = !done || st.claimed;
    $('dailyProg').hidden = done && !st.claimed;
    $('dailyProg').textContent = st.claimed ? '받았어요' : `${st.prog} / ${def.goal}`;
  }
  $('dailyClaim').addEventListener('click', () => {
    const { st, def } = todayChallenge();
    if (st.prog < def.goal || st.claimed) return;
    st.claimed = true; save.stars += CHALLENGE_REWARD;
    persist(); Sound.play('buy'); buzz(30);
    note(`오늘의 도전 보상 ★+${CHALLENGE_REWARD}`);
    renderHome();
  });

  // ================= attendance =================
  const ATTEND = [2, 2, 3, 3, 4, 4, 10];
  const attendDue = () => save.daily.last !== dayKey();
  const nextStreak = () => (save.daily.last === yesterdayKey() ? save.daily.streak % 7 + 1 : 1);
  function renderAttend() {
    const next = nextStreak(), grid = $('attendGrid');
    $('attendText').textContent = next === 1 && save.daily.streak > 0 && save.daily.last !== yesterdayKey()
      ? '하루를 쉬어서 1일차부터 다시 시작해요.' : `${next}일째 출석이에요! 7일을 채우면 큰 보상이 있어요.`;
    grid.textContent = '';
    ATTEND.forEach((reward, i) => {
      const cell = document.createElement('div');
      cell.className = 'attend-cell' + (i + 1 < next ? ' got' : '') + (i + 1 === next ? ' today' : '') + (i === 6 ? ' big' : '');
      const d = document.createElement('span'); d.textContent = `${i + 1}일`; cell.appendChild(d);
      const b = document.createElement('b'); b.textContent = `★${reward}`; cell.appendChild(b);
      grid.appendChild(cell);
    });
    $('attendBtn').textContent = `★${ATTEND[next - 1]} 받기`;
  }
  $('attendBtn').addEventListener('click', () => {
    if (!attendDue()) { show('home'); return; }
    const next = nextStreak();
    save.daily = { last: dayKey(), streak: next };
    save.stars += ATTEND[next - 1];
    persist(); Sound.play('buy'); buzz(30);
    show('home');
    note(`출석 ${next}일째 · ★+${ATTEND[next - 1]}`);
  });

  // ================= welcome =================
  $('nickForm3').addEventListener('submit', (e) => { e.preventDefault(); $('nickInput3').blur(); });
  $('welcomeBtn').addEventListener('click', () => {
    const nick = cleanNick($('nickInput3').value);
    if (nick) save.nickname = nick;
    save.onboarded = true; persist();
    afterHome();
  });

  // ================= settings =================
  $('nickForm4').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nick = cleanNick($('nickInput4').value), noteEl4 = $('nickNote4');
    $('nickInput4').blur();
    if (!nick) { noteEl4.textContent = '닉네임을 입력해 주세요.'; return; }
    save.nickname = nick; persist(); refreshHud();
    noteEl4.textContent = '저장했어요.';
    try { await rpc('set_nickname', { p_device: save.device, p_nickname: nick }); noteEl4.textContent = '저장했어요. 랭킹에도 바뀐 이름으로 보여요.'; }
    catch (err) { /* offline: the new name is used from the next ranked run */ }
  });
  let resetArm = 0, resetTimer = null;
  function renderReset() {
    $('resetBtn').textContent = resetArm ? '정말 지울까요? 한 번 더 누르면 지워져요' : '이 기기의 기록 초기화';
  }
  $('resetBtn').addEventListener('click', () => {
    if (!resetArm) {
      resetArm = 1; renderReset();
      clearTimeout(resetTimer); resetTimer = setTimeout(() => { resetArm = 0; renderReset(); }, 4000);
      return;
    }
    clearTimeout(resetTimer); resetArm = 0;
    const keep = { device: save.device, nickname: save.nickname, settings: save.settings, ownerKey: save.ownerKey, onboarded: true };
    save = { ...fresh(), ...keep };
    persist(); refreshHud(); renderReset();
    $('nickNote4').textContent = '';
    note('이 기기의 기록을 지웠어요');
  });

  // ================= install (PWA, GitHub Pages only) =================
  const onPages = location.protocol === 'https:' && location.hostname.endsWith('github.io') && !isDev;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installPrompt = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; renderInstall(); });
  addEventListener('appinstalled', () => { installPrompt = null; renderInstall(); note('앱으로 설치했어요!'); });
  function renderInstall() {
    const can = onPages && !standalone && (installPrompt || isIOS);
    for (const el of document.querySelectorAll('[data-install]')) el.hidden = !can;
    for (const el of document.querySelectorAll('[data-install-group]')) el.hidden = !can;
  }
  for (const b of document.querySelectorAll('[data-install]')) {
    b.addEventListener('click', async () => {
      if (installPrompt) {
        installPrompt.prompt();
        try { await installPrompt.userChoice; } catch (e) {}
        installPrompt = null; renderInstall();
      } else show('install');
    });
  }
  if (onPages && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

  // ================= maintenance =================
  let maintenance = false, isOwner = false, lastStatus = null, statusKnown = false;
  async function checkStatus() {
    try {
      const st = await withTimeout(rpc('get_status', { p_key: save.ownerKey || null }), 3500);
      lastStatus = st;
      isOwner = !!st.owner;
      maintenance = !!st.maintenance && !st.owner;
      $('adminBadge').hidden = !(st.maintenance && st.owner);
      if (st.message) $('maintMsg').textContent = st.message;
    } catch (e) {
      lastStatus = null;
      maintenance = false; // server unreachable or not set up: let people play (unranked)
    }
    statusKnown = true;
    $('adminBtn').hidden = !isOwner;
    const idle = state === 'ready' || state === 'over';
    if (isDev && !isOwner) {
      if (idle) { state = 'ready'; pauseBtn.hidden = true; show('gate'); }
    } else if (maintenance) {
      if (idle) { state = 'ready'; pauseBtn.hidden = true; show('maint'); }
    } else if (!screens.maint.hidden || !screens.gate.hidden) { goHome(); afterHome(); }
    return maintenance;
  }
  $('gateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = $('gateKey').value.trim().replace(/^.*#owner-/, ''), gateNote = $('gateNote');
    $('gateKey').blur();
    if (!/^[A-Za-z0-9]{8,64}$/.test(key)) { gateNote.textContent = '키 형식이 맞지 않아요. 영문과 숫자만 입력해 주세요.'; return; }
    gateNote.textContent = '확인하는 중…';
    const prev = save.ownerKey;
    save.ownerKey = key;
    await checkStatus();
    if (isOwner) { persist(); $('gateKey').value = ''; note('관리자로 등록했어요'); return; }
    save.ownerKey = prev;
    gateNote.textContent = statusKnown && lastStatus ? '키가 맞지 않아요. 다시 확인해 주세요.' : '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.';
  });
  $('maintRetry').addEventListener('click', async () => {
    $('maintRetry').disabled = true; $('maintRetry').textContent = '확인 중…';
    await checkStatus();
    $('maintRetry').disabled = false; $('maintRetry').textContent = '다시 확인하기';
  });

  // ================= admin menu (owner key only) =================
  let adminPane = 'version';
  const adminRpc = (name, args = {}) => rpc(name, { p_key: save.ownerKey, ...args });
  for (const b of $('adminTabs').children) b.addEventListener('click', () => { adminPane = b.dataset.pane; renderAdmin(); });
  function renderAdmin() {
    for (const b of $('adminTabs').children) b.setAttribute('aria-selected', String(b.dataset.pane === adminPane));
    for (const el of document.querySelectorAll('.admin-pane')) el.hidden = el.dataset.pane !== adminPane;
    $('adminChannel').textContent = isDev ? 'dev 버전' : '정식 버전';
    if (adminPane === 'version') {
      $('verText').textContent = isDev
        ? '지금 dev 브랜치 버전을 보고 있어요. 아직 다른 사람들에게는 안 보이는 버전이에요.'
        : '지금 정식 버전이에요. dev 버전에서 아직 배포 안 한 새 기능을 확인할 수 있어요.';
      $('verLink').href = isDev ? '../' : './dev/';
      $('verLink').textContent = isDev ? '정식 버전으로 가기' : 'dev 버전 열기';
      $('verBuild').textContent = BUILD.startsWith('__') ? '' : `이 버전: ${BUILD}`;
    }
    if (adminPane === 'game') renderTest();
    if (adminPane === 'maint') renderMaint();
    if (adminPane === 'rank') loadAdminScores();
  }

  // rewards and screens (this device only)
  const adminNote = (t) => { $('adminNote').textContent = t; };
  for (const b of document.querySelectorAll('[data-act]')) {
    b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'stars10' || a === 'stars100') { save.stars += a === 'stars10' ? 10 : 100; adminNote(`별을 넣었어요. 보유 ★${save.stars}`); }
      if (a === 'unlock') {
        for (const cat in ITEMS) for (const it of ITEMS[cat]) if (it.price > 0 && !owns(cat, it.id)) save.owned.push(cat + ':' + it.id);
        adminNote('상점 아이템을 모두 열었어요.');
      }
      if (a === 'attend') { save.daily.last = yesterdayKey(); persist(); show('attend'); return; }
      if (a === 'welcome') { show('welcome'); return; }
      if (a === 'chDone') { const { st, def } = todayChallenge(); st.prog = def.goal; st.claimed = false; adminNote(`오늘의 도전을 달성 상태로 바꿨어요: ${def.text}`); }
      if (a === 'chReset') { save.challenge = null; todayChallenge(); adminNote('오늘의 도전 진행도를 0으로 돌렸어요.'); }
      if (a === 'achReset') { save.ach = []; save.title = ''; adminNote('업적과 칭호를 초기화했어요.'); }
      persist(); refreshHud();
    });
  }

  // test runs
  function renderTest() {
    const inv = $('tInvincible');
    inv.setAttribute('aria-pressed', String(testOpts.invincible));
    inv.textContent = testOpts.invincible ? '무적 켜짐' : '무적 꺼짐';
    for (const b of $('tLevel').children) b.setAttribute('aria-pressed', String(Number(b.dataset.v) === testOpts.startLevel));
    for (const b of $('tSpeed').children) b.setAttribute('aria-pressed', String(Number(b.dataset.v) === testOpts.speed));
  }
  $('tInvincible').addEventListener('click', () => { testOpts.invincible = !testOpts.invincible; renderTest(); });
  for (const b of $('tLevel').children) b.addEventListener('click', () => { testOpts.startLevel = Number(b.dataset.v); renderTest(); });
  for (const b of $('tSpeed').children) b.addEventListener('click', () => { testOpts.speed = Number(b.dataset.v); renderTest(); });
  $('testStart').addEventListener('click', () => start(true));

  // maintenance switch
  async function renderMaint(st) {
    const el = $('maintState');
    if (!st) { el.textContent = '확인 중…'; el.className = 'maint-state'; await checkStatus(); st = lastStatus; }
    if (!st) { el.textContent = '서버에 연결하지 못했어요.'; return; }
    el.textContent = st.maintenance ? '지금 점검 중이에요' : '지금 정상 운영 중이에요';
    el.className = 'maint-state' + (st.maintenance ? ' on' : '');
    if (!$('maintText').value) $('maintText').value = st.message || '';
  }
  async function setMaint(on) {
    const el = $('maintState');
    try {
      const st = await adminRpc('admin_set_maintenance', { p_on: on, p_message: $('maintText').value.trim() || null });
      lastStatus = st;
      $('adminBadge').hidden = !st.maintenance;
      renderMaint(st);
      note(on ? '점검 모드를 켰어요' : '점검 모드를 껐어요');
    } catch (e) { el.textContent = '바꾸지 못했어요: ' + (e.message || ''); }
  }
  $('maintForm').addEventListener('submit', (e) => { e.preventDefault(); $('maintText').blur(); });
  $('maintOn').addEventListener('click', () => setMaint(true));
  $('maintOff').addEventListener('click', () => setMaint(false));

  // ranking management
  const armed = new Map();
  function twoStep(btn, label, confirmLabel, action) {
    if (armed.get(btn)) { armed.delete(btn); action(); return; }
    armed.set(btn, true); btn.textContent = confirmLabel;
    setTimeout(() => { if (armed.get(btn)) { armed.delete(btn); btn.textContent = label; } }, 3500);
  }
  async function loadAdminScores() {
    const box = $('adminScores');
    box.textContent = '불러오는 중…';
    try {
      const rows = await adminRpc('admin_list_scores');
      box.textContent = '';
      if (!rows.length) { box.textContent = '기록이 없어요.'; return; }
      for (const r of rows) {
        const row = document.createElement('div'); row.className = 'arow' + (r.hidden ? ' hid' : '');
        const top = document.createElement('div'); top.className = 'top';
        const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = r.nickname + (r.hidden ? ' (숨김)' : '');
        const sc = document.createElement('b'); sc.textContent = r.score;
        top.append(nm, sc);
        const meta = document.createElement('div'); meta.className = 'meta';
        const d = new Date(r.at * 1000);
        meta.textContent = `${Number(r.time).toFixed(1)}초 · ${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · 플레이어 ${r.player}`;
        const acts = document.createElement('div'); acts.className = 'acts';
        const act = (label, fn, danger, confirm) => {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
          if (danger) b.className = 'danger';
          b.addEventListener('click', () => (confirm ? twoStep(b, label, confirm, fn) : fn()));
          acts.appendChild(b);
        };
        const run = (p) => p.then(loadAdminScores).catch((e) => { meta.textContent = '실패: ' + (e.message || ''); });
        act(r.hidden ? '보이기' : '숨기기', () => run(adminRpc('admin_hide_score', { p_id: r.id, p_hidden: !r.hidden, p_whole_player: false })));
        act(r.hidden ? '이 사람 전부 보이기' : '이 사람 전부 숨기기', () => run(adminRpc('admin_hide_score', { p_id: r.id, p_hidden: !r.hidden, p_whole_player: true })));
        act('삭제', () => run(adminRpc('admin_delete_score', { p_id: r.id })), true, '정말 삭제?');
        row.append(top, meta, acts);
        box.appendChild(row);
      }
    } catch (e) {
      box.textContent = e.server ? '불러오지 못했어요: ' + e.message : '서버에 연결하지 못했어요.';
    }
  }
  $('rankReset').addEventListener('click', () => {
    const b = $('rankReset');
    twoStep(b, '랭킹 전체 초기화', '정말 모든 랭킹 기록을 지울까요? 한 번 더 누르세요', async () => {
      b.textContent = '랭킹 전체 초기화';
      try { await adminRpc('admin_reset_ranking'); note('랭킹을 초기화했어요'); loadAdminScores(); }
      catch (e) { $('adminScores').textContent = '초기화하지 못했어요: ' + (e.message || ''); }
    });
  });

  // first screen after home: onboarding, then the daily attendance reward
  function afterHome() {
    if (isDev && !isOwner) { show('gate'); return; }
    if (maintenance) { show('maint'); return; }
    if (!save.onboarded) { show('welcome'); return; }
    if (attendDue()) { show('attend'); return; }
    show('home');
  }

  // ================= loop =================
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    update(dt);
    draw();
    drawPreview(Math.min(dt, 0.05));
    requestAnimationFrame(frame);
  }

  refreshHud(); renderToggles();
  resize();
  show('home');
  afterHome();
  checkStatus();
  requestAnimationFrame(frame);
})();
