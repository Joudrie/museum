// Skill tracks: Fishing, Sailing, Exploring, Friendship (and cheap Foraging).
// Levels 1 to 20. Every level grants something; every even level also carries
// a perk that changes how the activity feels (data/skills.json).
import { TUNING } from './config.js';
import skillData from './data/skills.json' with { type: 'json' };
import { unlockAll } from '../measure/flags.js';

export const SKILLS = skillData;
export const skillIds = () => Object.keys(SKILLS);

export function skillXpToNext(id, level, T = TUNING) {
  const { A, B } = T.skills.curve[id];
  return Math.round(A * Math.pow(level, 1.5) + B);
}
const tables = {};
export function skillCum(id, level, T = TUNING) {
  const t = (tables[id] ||= [0, 0]);
  for (let i = t.length; i <= level; i++) t[i] = t[i - 1] + skillXpToNext(id, i - 1, T);
  return t[level];
}

/** { level, into, need, pct, maxed } for a skill's total XP. */
export function skillLevel(id, xp, T = TUNING) {
  const max = T.skills.maxLevel;
  let level = 1;
  while (level < max && xp >= skillCum(id, level + 1, T)) level++;
  if (level >= max) return { level: max, into: 0, need: 0, pct: 100, maxed: true };
  const into = xp - skillCum(id, level, T);
  const need = skillXpToNext(id, level, T);
  return { level, into, need, pct: (100 * into) / need, maxed: false };
}

export const levelFor = (state, id) => skillLevel(id, state.skills[id] || 0).level;

/** Adds skill XP; returns { levelsGained: [n…], before, after }. */
export function addSkillXp(state, id, amount, T = TUNING) {
  if (!SKILLS[id]) return { levelsGained: [] };
  const before = skillLevel(id, state.skills[id] || 0, T);
  state.skills[id] = (state.skills[id] || 0) + Math.max(0, Math.round(amount));
  const after = skillLevel(id, state.skills[id], T);
  const levelsGained = [];
  for (let l = before.level + 1; l <= after.level; l++) levelsGained.push(l);
  return { levelsGained, before, after };
}

/** Every perk this skill has unlocked at its current level. */
export function perksOf(state, id) {
  const lv = unlockAll() ? Infinity : levelFor(state, id); // (unlockAll: the ?progression=off strip test)
  return SKILLS[id].levels.filter((l) => l.level <= lv && l.perk).map((l) => l.perk);
}
/** All perk ids held, as "skill.perk" strings. */
export function perkSet(state) {
  const out = new Set();
  skillIds().forEach((id) => perksOf(state, id).forEach((p) => out.add(`${id}.${p}`)));
  return out;
}
export const hasPerk = (state, key) => {
  const [id, perk] = key.split('.');
  return !!SKILLS[id] && perksOf(state, id).includes(perk);
};
