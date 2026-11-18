// @ts-nocheck
// 별똥별 피하기: verify-run Edge Function
// The game sends only the player's position for every tick. This function replays the run with the
// server's seed using the same simulation as the game, checks the heartbeat timeline for slow motion,
// and records the score it computed itself.
// Built from src/verify-run.ts + src/sim.js by tools/build.py. Do not edit the generated copy.

/*__SIM__*/

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
