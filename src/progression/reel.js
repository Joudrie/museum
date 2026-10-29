// The catch minigame: after the hook, keep the hook zone on the fish. Hold to
// lift the zone, let go to let it sink. Progress fills while the fish is inside,
// drains when it is not. Harder with rarity. A catch that never lost the fish
// for long is "perfect". Pure, so the sim can drive it with a bot.
import { TUNING } from './config.js';

export function makeReel({ rarity = 1, zone = 0.26, rng, legend = false, forgiving = false, T = TUNING } = {}) {
  const hard = T.fishing.reel.perRarityHardness[rarity] ?? 1;
  const r = {
    t: 0,
    fish: 0.5,
    fishTarget: 0.5,
    nextDart: 0.6,
    zone: 0.3, // centre of the hook zone, 0 (bottom) to 1 (top)
    vel: 0,
    size: Math.min(0.5, zone * (forgiving ? 1.5 : 1)) * (legend ? 0.85 : 1),
    progress: 0.35,
    inside: 0,
    outside: 0,
    over: false,
    won: false,
    perfect: false,
    hard,
    legend,
    fill: 0.17 + 0.05 * (1 - hard), // per second while inside
    drain: 0.11 * hard,
    runs: legend ? 2 : 0,
    runAt: legend ? [0.4, 0.75].map((x) => x * 6) : [],
  };
  r.step = (dt, holding) => {
    if (r.over) return r;
    r.t += dt;
    // the fish darts to a new spot now and then, faster and wilder when it is rarer
    r.nextDart -= dt;
    if (r.nextDart <= 0) {
      const wild = 0.18 + 0.28 * hard;
      r.fishTarget = Math.min(0.92, Math.max(0.08, r.fish + (rng() - 0.5) * 2 * wild + (rng() - 0.5) * 0.3));
      r.nextDart = (0.75 - 0.35 * Math.min(1, hard)) * (0.6 + rng() * 0.8);
    }
    // legend fish also make a hard run: the target slams to one end
    for (let i = 0; i < r.runAt.length; i++) {
      if (r.t >= r.runAt[i]) {
        r.runAt.splice(i, 1);
        r.fishTarget = rng() < 0.5 ? 0.9 : 0.1;
        r.nextDart = 1.1;
        break;
      }
    }
    const speed = 0.55 + 0.7 * hard;
    const d = r.fishTarget - r.fish;
    r.fish += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
    // the zone: hold lifts it, release lets it fall (a little bounce at the bottom)
    r.vel += (holding ? 2.2 : -1.9) * dt;
    r.vel = Math.max(-1.1, Math.min(1.1, r.vel));
    r.zone += r.vel * dt;
    const half = r.size / 2;
    if (r.zone < half) {
      r.zone = half;
      r.vel = Math.abs(r.vel) * 0.25;
    }
    if (r.zone > 1 - half) {
      r.zone = 1 - half;
      r.vel = -Math.abs(r.vel) * 0.2;
    }
    const inside = Math.abs(r.fish - r.zone) <= half;
    if (inside) {
      r.progress = Math.min(1, r.progress + r.fill * dt);
      r.inside += dt;
    } else {
      r.progress = Math.max(0, r.progress - r.drain * dt);
      r.outside += dt;
    }
    if (r.t >= T.fishing.reel.maxSeconds && !r.over) {
      // a long fight ends: a fish that is mostly reeled in tires out and comes in, otherwise it slips the hook
      r.over = true;
      r.won = r.progress >= 0.6;
      return r;
    }
    if (r.progress >= 1) {
      r.over = r.won = true;
      r.perfect = r.outside / Math.max(0.001, r.t) <= 0.3;
    } else if (r.progress <= 0) r.over = true;
    return r;
  };
  return r;
}

/**
 * A scripted player for tests and the sim. `skill` 0..1 sets reaction lag and
 * steadiness; the bot holds when the zone is below the fish.
 */
export function playBot(reel, skill, rng, dtMs = 16) {
  const dt = dtMs / 1000;
  const lag = Math.round(((1 - skill) * 260) / dtMs) + 1; // frames of reaction delay
  const seen = [];
  let holding = false;
  let guard = 0;
  while (!reel.over && guard++ < 6000) {
    seen.push([reel.fish, reel.zone, reel.vel]);
    const [f, z, v] = seen.length > lag ? seen[seen.length - 1 - lag] : seen[0];
    // aim a little above the fish to cancel the sink, with noise that shrinks with skill
    const err = f - z + (rng() - 0.5) * (1 - skill) * 0.25 - v * 0.12;
    holding = err > 0.02;
    reel.step(dt, holding);
  }
  return reel;
}
