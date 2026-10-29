// Player settings: lighting, day/night and sound. Stored in one object.
import { load, save } from './storage.js';

const SETTINGS_KEY = 'curation.settings';
export const DEFAULT_SETTINGS = { dayNight: true, lights: 'high', music: 0.7, sfx: 0.8, haptics: true, text: 'normal', reduceMotion: false, leftHanded: false, tips: true };
export const LIGHT_QUALITY = { high: 'High', low: 'Low', off: 'Off' };

export const settings = () => ({ ...DEFAULT_SETTINGS, ...load(SETTINGS_KEY, {}) });

export function setSetting(key, value) {
  save(SETTINGS_KEY, { ...load(SETTINGS_KEY, {}), [key]: value });
  window.dispatchEvent(new CustomEvent('settings', { detail: { key, value } }));
}

// The hour of day the museum is lit for (0-24). ?hour=21 pins it for testing.
export function hourNow() {
  const pinned = /[?&]hour=([\d.]+)/.exec(location.search);
  if (pinned) return Number(pinned[1]) % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}
