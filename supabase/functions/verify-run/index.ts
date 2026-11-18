// @ts-nocheck
// 별똥별 피하기: verify-run Edge Function
// The game sends only the player's position for every tick. This function replays the run with the
// server's seed using the same simulation as the game, checks the heartbeat timeline for slow motion,
// and records the score it computed itself.
// Built from src/verify-run.ts + src/sim.js by tools/build.py. Do not edit the generated copy.

// Deterministic game simulation, shared by the game page and the verify-run server function.
// The world is 400 units wide and `worldH` units tall and advances in fixed 1/60 s ticks.
// Only + - * /, Math.floor/min/max/abs and Math.imul are used here, so every JS engine
// (phone browsers and the server) produces bit-identical results for the same seed and inputs.
function createSim(seed, worldH) {
  const W = 400, H = worldH, DT = 1 / 60, MAX_STEP = 24;
  let s = seed >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rand = (a, b) => a + rng() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const ROCKS = {
    normal: { colors: ['#ff6a55', '#ff9a3c', '#ff5c8a'], size: [12, 20], speed: 1 },
    small: { colors: ['#4fd8ff'], size: [7, 10], speed: 1.45 },
    big: { colors: ['#9b7bff'], size: [26, 34], speed: 0.68 },
    zigzag: { colors: ['#7be06a'], size: [12, 16], speed: 0.95 },
  };
  const BOSS_COLOR = '#ff3d5e';

  const sim = {
    W, H, tick: 0, t: 0, score: 0, bonus: 0, level: 1, starCount: 0, storms: 0, dead: false,
    rocks: [], pickups: [], boss: null,
    player: { x: W / 2, y: H - Math.max(80, H * 0.14), r: 14 },
  };
  const P = sim.player;
  let spawnT = 0.6, starT = rand(2.5, 4), nextId = 1;

  function pickRockType(t) {
    const w = [
      ['normal', 6],
      ['small', t > 8 ? 2 + t / 20 : 0],
      ['big', t > 15 ? 1.5 + t / 40 : 0],
      ['zigzag', t > 30 ? 1.5 + t / 30 : 0],
    ];
    let total = 0;
    for (const [, v] of w) total += v;
    let roll = rng() * total;
    for (const [k, v] of w) { roll -= v; if (roll <= 0) return k; }
    return 'normal';
  }

  function spawnRock(t) {
    const type = pickRockType(t), def = ROCKS[type];
    const r = rand(def.size[0], def.size[1]);
    const base = Math.min(170 + t * 6 + t * t * 0.02, 950);
    const vy = base * def.speed * rand(0.85, 1.2);
    const slanted = t > 45 && type !== 'zigzag' && rng() < 0.3;
    const vx = slanted ? rand(-90, 90) : rand(-20, 20);
    const x = rand(r, W - r);
    const color = def.colors[Math.floor(rng() * def.colors.length)];
    const phase = rng();
    const amp = type === 'zigzag' ? rand(60, 110) : 0;
    sim.rocks.push({ id: nextId++, type, x, y: -r - 10, r, vx, vy, color, phase, amp });
  }

  function startBoss(ev) {
    sim.boss = { phase: 'warn', t: 2.2, rows: 0, total: 4 + Math.floor(sim.level / 10), gap: W / 2 };
    ev.push({ type: 'bossWarn' });
  }
  function bossSpeed() { return 240 + sim.level * 8; }
  function spawnRow() {
    const b = sim.boss, gw = Math.max(P.r * 5.4, 84);
    b.gap = clamp(b.gap + rand(-1, 1) * W * 0.3, gw / 2 + 6, W - gw / 2 - 6);
    const r = 13, gapStep = r * 2.3, vy = bossSpeed();
    for (let x = r; x < W; x += gapStep) {
      if (Math.abs(x - b.gap) < gw / 2 + r * 0.6) continue;
      sim.rocks.push({ id: nextId++, type: 'boss', x, y: -r - 10, r, vx: 0, vy, color: BOSS_COLOR, phase: 0, amp: 0 });
    }
  }
  function updateBoss(ev) {
    const b = sim.boss;
    b.t -= DT;
    if (b.t > 0) return;
    if (b.phase === 'warn') { b.phase = 'rows'; b.t = 0; return; }
    if (b.phase === 'rows') {
      if (b.rows < b.total) { spawnRow(); b.rows++; b.t = 1; }
      else { b.phase = 'tail'; b.t = (H + 60) / bossSpeed(); }
      return;
    }
    sim.storms++;
    sim.bonus += 200;
    sim.boss = null;
    spawnT = 0.8;
    ev.push({ type: 'bossClear' });
  }

  // One tick. `inputHalf` is where the player wants to be, in half world units (an integer).
  sim.step = function (inputHalf) {
    const ev = [];
    if (sim.dead) return ev;
    sim.tick++;
    const t = (sim.t = sim.tick / 60);

    const target = clamp(inputHalf / 2, P.r, W - P.r);
    P.x += clamp(target - P.x, -MAX_STEP, MAX_STEP);

    const lv = 1 + Math.floor(sim.tick / 900);
    if (lv !== sim.level) {
      sim.level = lv;
      if (lv % 5 === 0 && !sim.boss) startBoss(ev);
      else ev.push({ type: 'level', level: lv });
    }

    if (sim.boss) updateBoss(ev);
    else {
      spawnT -= DT;
      if (spawnT <= 0) {
        spawnRock(t);
        const extra = t > 20 ? Math.min(0.6, (t - 20) / 80) : 0;
        if (rng() < extra) spawnRock(t);
        if (t > 60 && rng() < Math.min(0.4, (t - 60) / 100)) spawnRock(t);
        spawnT = Math.max(0.1, 0.7 / (1 + 0.0155 * t + 0.00012 * t * t));
      }
      starT -= DT;
      if (starT <= 0) {
        sim.pickups.push({ id: nextId++, x: rand(20, W - 20), y: -20, r: 11, vy: 150 + t * 1.5 });
        starT = rand(3, 5.5);
      }
    }

    for (const m of sim.rocks) {
      m.y += m.vy * DT;
      if (m.type === 'zigzag') {
        m.phase += DT * 0.48;
        const f = m.phase - Math.floor(m.phase);
        m.x += (1 - 4 * Math.abs(f - 0.5)) * m.amp * 3 * DT;
      } else m.x += m.vx * DT;
      if (m.x < m.r || m.x > W - m.r) {
        if (m.type !== 'boss' && m.type !== 'zigzag') m.vx = -m.vx;
        m.x = clamp(m.x, m.r, W - m.r);
      }
    }
    const before = sim.rocks.length;
    sim.rocks = sim.rocks.filter((m) => m.y - m.r < H + 40);
    if (before > sim.rocks.length) ev.push({ type: 'dodge', n: before - sim.rocks.length });
    for (const p of sim.pickups) p.y += p.vy * DT;
    sim.pickups = sim.pickups.filter((p) => p.y - p.r < H + 40);

    for (const m of sim.rocks) {
      const dx = m.x - P.x, dy = m.y - P.y, rr = (m.r + P.r) * 0.78;
      if (dx * dx + dy * dy < rr * rr) {
        sim.dead = true;
        ev.push({ type: 'hit' });
        break;
      }
    }
    if (!sim.dead) {
      sim.pickups = sim.pickups.filter((p) => {
        const dx = p.x - P.x, dy = p.y - P.y, rr = p.r + P.r;
        if (dx * dx + dy * dy >= rr * rr) return true;
        sim.starCount++;
        sim.bonus += 50;
        ev.push({ type: 'star', x: p.x, y: p.y });
        return false;
      });
    }
    sim.score = Math.floor(sim.tick / 6) + sim.bonus;
    return ev;
  };

  // Visual-only drift after the player is hit (never used for scoring).
  sim.coast = function (dt) {
    for (const m of sim.rocks) { m.y += m.vy * dt; m.x += m.vx * dt; }
    for (const p of sim.pickups) p.y += p.vy * dt;
  };

  return sim;
}


const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const MAX_TICKS = 60 * 60 * 20; // 20 minutes
const MAX_PAUSES = 8;

const DB_URL = Deno.env.get('SUPABASE_URL');
let KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!KEY) {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    KEY = keys.default || Object.values(keys)[0];
  } catch (_) { /* no secret keys */ }
}

async function rpc(name, args) {
  const headers = { apikey: KEY, 'Content-Type': 'application/json' };
  if (!KEY.startsWith('sb_')) headers.Authorization = `Bearer ${KEY}`;
  const res = await fetch(`${DB_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(args) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Reject((data && data.message) || 'db error', 500);
  return data;
}

class Reject extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Heartbeats arrive every 5 s of play, on pause, on resume and at the end (stamped with the server clock).
// While paused, the tick must not move. While running, game time must keep pace with the server clock:
// for each uninterrupted stretch we track drift = (server time elapsed) - (game time elapsed).
// Network jitter makes drift wobble but not grow; slow motion makes it grow steadily.
const DRIFT_SLACK = 3; // seconds of jitter/latency allowed
const DRIFT_RATE = 0.05; // plus 5% for frame hitches on slow phones
function checkTimeline(run, ticks) {
  const beats = [{ tick: 0, paused: false, at: run.started }, ...run.beats];
  const last = beats[beats.length - 1];
  if (last.tick < ticks - 360) throw new Reject('missing heartbeats');
  if (ticks / 60 > run.now - run.started + 2) throw new Reject('too fast');
  let pauses = 0, seg = beats[0], minDrift = 0, maxDrift = 0;
  for (let i = 1; i < beats.length; i++) {
    const a = beats[i - 1], b = beats[i];
    if (b.tick < a.tick || b.tick > ticks || b.at < a.at) throw new Reject('bad heartbeat');
    if (b.paused && !a.paused && i < beats.length - 1) pauses++;
    if (a.paused) {
      if (b.tick !== a.tick) throw new Reject('moved while paused');
      seg = b; minDrift = 0; maxDrift = 0;
      continue;
    }
    if (b.at - a.at > 30) throw new Reject('heartbeat gap');
    const span = b.at - seg.at, drift = span - (b.tick - seg.tick) / 60;
    minDrift = Math.min(minDrift, drift);
    maxDrift = Math.max(maxDrift, drift);
    if (drift < -DRIFT_SLACK) throw new Reject('too fast');
    if (maxDrift - minDrift > DRIFT_SLACK + DRIFT_RATE * span) throw new Reject('too slow');
  }
  if (pauses > MAX_PAUSES) throw new Reject('too many pauses');
}

function decodeInputs(deltas) {
  if (!Array.isArray(deltas) || deltas.length < 1 || deltas.length > MAX_TICKS) throw new Reject('bad inputs');
  const xs = new Array(deltas.length);
  let x = 0;
  for (let i = 0; i < deltas.length; i++) {
    const d = deltas[i];
    if (!Number.isInteger(d) || d < -2000 || d > 2000) throw new Reject('bad inputs');
    x += d;
    xs[i] = x;
  }
  return xs;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.run !== 'string' || typeof body.device !== 'string') throw new Reject('bad request');

    const run = await rpc('get_run_check', { p_run: body.run });
    if (!run || run.device !== body.device) throw new Reject('unknown run');
    if (run.finished) throw new Reject('already submitted');

    const xs = decodeInputs(body.inputs);
    const sim = createSim(Number(run.seed), run.h);
    for (let i = 0; i < xs.length && !sim.dead; i++) sim.step(xs[i]);
    // The game stops sending inputs the tick it is hit; surviving longer than that means a tampered client.
    if (sim.dead && sim.tick < xs.length) throw new Reject('replay mismatch');

    checkTimeline(run, sim.tick);

    const look = body.look && typeof body.look === 'object' ? body.look : {};
    const result = await rpc('finalize_run', {
      p_run: body.run,
      p_device: body.device,
      p_nickname: String(body.nickname || ''),
      p_title: String(body.title || ''),
      p_look: { skin: String(look.skin || ''), hat: String(look.hat || ''), face: String(look.face || '') },
      p_score: sim.score,
      p_time: Math.round(sim.tick / 6) / 10,
      p_stars: sim.starCount,
      p_storms: sim.storms,
    });
    return reply({ ...result, score: sim.score, time: Math.round(sim.tick / 6) / 10 });
  } catch (e) {
    const msg = e instanceof Reject ? e.message : 'server error';
    if (/nickname/.test(String(e && e.message))) return reply({ error: 'bad nickname' }, 400);
    return reply({ error: msg }, e instanceof Reject ? e.status : 500);
  }
});
