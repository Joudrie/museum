// Little pictures over people's heads, in the museum and out on the islands:
// a heart, a "!", a clover traded in a chat, a sweat drop. The icons are baked in
// art.js (makeEmotes); this file decides who shows what, pops it over a head that
// follows them, and runs the short wordless chats two people have when they meet.
import { makeEmotes } from './art.js';
import { headY } from './focus.js';

// Which emotes each kind of person tends to show on their own.
export const EMOTES = {
  fanboy: ['heart', 'star', 'heart', 'sparkle'],
  kid: ['bang', 'q', 'heart', 'star', 'smile'],
  grump: ['zzz', 'q', 'anger', 'sweat'],
  snob: ['q', 'zzz', 'star', 'dots'],
  nerd: ['bang', 'star', 'q', 'clover'],
  casual: ['heart', 'note', 'star', 'smile'],
  tourist: ['bang', 'star', 'heart', 'smile'],
  artist: ['heart', 'star', 'bang', 'sparkle'],
  influencer: ['star', 'heart', 'note', 'sparkle'],
  couple: ['heart', 'heart', 'note', 'smile'],
  historian: ['bang', 'q', 'star', 'dots'],
  student: ['q', 'bang', 'zzz', 'note', 'confused'],
  elder: ['heart', 'note', 'heart', 'clover'],
  famous: ['star', 'heart', 'bang', 'note'],
};

// What a person says to a friend, without words.
const TALK = {
  kid: ['star', 'sparkle', 'smile', 'heart', 'note', 'bang'],
  grump: ['anger', 'dots', 'sweat', 'q', 'frown'],
  snob: ['dots', 'q', 'sparkle', 'star'],
  nerd: ['bang', 'q', 'star', 'clover', 'dots'],
  elder: ['heart', 'note', 'smile', 'clover'],
  artist: ['sparkle', 'heart', 'star', 'note'],
  student: ['q', 'bang', 'smile', 'note', 'confused'],
};
const TALK_ANY = ['heart', 'star', 'clover', 'note', 'smile', 'sparkle'];
const GOODBYE = ['heart', 'smile', 'note', 'star'];
export const SEASON_EMOTE = { autumn: 'leaf', winter: 'snow', summer: 'sun', spring: 'clover' };

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// A bubble over someone's head (`who.s` is their sprite). It follows them, pops in,
// floats a touch and fades. One at a time per person.
export function popEmote(scene, who, id, { hold = 1500, lift = 5 } = {}) {
  const s = who.s;
  if (!s?.active) return null;
  makeEmotes(scene);
  const key = `emote_${id}`;
  if (!scene.textures.exists(key)) return null;
  who.emoteImg?.destroy();
  const off = { v: 0 };
  const img = scene.add.image(s.x, headY(s) - lift, key).setOrigin(0.5, 1).setDepth(5000).setScale(0);
  who.emoteImg = img;
  const follow = () => {
    if (!s.active) return img.destroy();
    img.setPosition(s.x, headY(s) - lift + off.v);
  };
  scene.events.on('update', follow);
  img.once('destroy', () => scene.events.off('update', follow));
  scene.tweens.add({ targets: img, scale: 1, duration: 180, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: off, v: -3, duration: hold, ease: 'Sine.easeOut' });
  // pop in, hold, pop out
  scene.tweens.add({ targets: img, scale: 0, delay: hold, duration: 160, ease: 'Back.easeIn', onComplete: () => img.destroy() });
  return img;
}

// Two people stop, turn to each other and trade pictures for a few seconds.
//   a, b: { s: sprite, kind, talking?, chatting? }     (anyone with a sprite)
//   face(a, b): turn a to look at b     sound(speaker): a quiet blip, if wanted
//   season: 'autumn' etc, adds a seasonal picture to what they say
// Ends early if either is spoken to or goes away. Returns false if either is busy.
export function startChat(scene, a, b, { face, sound, beats, season, onEnd } = {}) {
  if (a.chatting || b.chatting || a.talking || b.talking) return false;
  const pool = [...new Set([...(TALK[a.kind] || TALK_ANY), ...(TALK[b.kind] || TALK_ANY)])];
  if (season && SEASON_EMOTE[season] && Math.random() < 0.5) pool.push(SEASON_EMOTE[season]);
  const n = beats || 3 + Math.floor(Math.random() * 3);
  a.chatting = b;
  b.chatting = a;
  face?.(a, b);
  face?.(b, a);
  let i = 0;
  let speaker = Math.random() < 0.5 ? a : b;
  let ev = null;
  const end = () => {
    ev?.remove();
    if (a.chatting !== b) return;
    a.chatting = b.chatting = null;
    a.chat = b.chat = null;
    onEnd?.(a, b);
  };
  const step = () => {
    if (!a.s.active || !b.s.active || a.talking || b.talking) return end();
    if (i >= n) {
      // a last friendly picture from both, then back to what they were doing
      popEmote(scene, a, pick(GOODBYE), { hold: 900 });
      popEmote(scene, b, pick(GOODBYE), { hold: 900 });
      ev = scene.time.delayedCall(1200, end);
      return;
    }
    const other = speaker === a ? b : a;
    face?.(other, speaker);
    popEmote(scene, speaker, pick(pool), { hold: 1000 });
    scene.tweens.add({ targets: speaker.s, y: speaker.s.y - 1.5, duration: 90, yoyo: true });
    sound?.(speaker);
    speaker = other;
    i += 1;
    ev = scene.time.delayedCall(1050 + Math.random() * 500, step);
  };
  a.chat = b.chat = { cancel: end };
  step();
  return true;
}
