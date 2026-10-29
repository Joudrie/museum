// The lodge: rooms bought with gold once rank allows, an aquarium of the fish you have caught, and a
// wall for Trophy-sized catches. This is where a collection becomes something you can see.
import SHOP from './data/shop.json' with { type: 'json' };
import { speciesById } from './species.js';

export function installHouse(p) {
  const s = () => p.state;
  const owns = (id) => !!s().market.owned[id];
  const tankSize = () => {
    const sizes = SHOP.tanks;
    let best = owns('room:aquarium_room') ? sizes.small : 0;
    ['medium', 'large', 'huge'].forEach((k) => owns(`tank:${k}`) && (best = Math.max(best, sizes[k])));
    return best;
  };
  const mod = {
    name: 'house',
    install() {},
    rooms: () => [
      { id: 'porch', name: 'Porch', owned: true },
      { id: 'lounge', name: 'Lounge', owned: owns('room:lounge') },
      { id: 'aquarium_room', name: 'Aquarium room', owned: owns('room:aquarium_room') },
      { id: 'workshop', name: 'Workshop', owned: owns('room:workshop') },
    ],
    capacity: tankSize,
    aquarium: () => s().house.aquarium.filter((id) => speciesById(id)),
    /** Fish you can put in the tank: every species you have caught that is not already in it. */
    available: () => Object.entries(s().fish.species).filter(([id, r]) => r.n > 0 && !s().house.aquarium.includes(id) && speciesById(id)).map(([id]) => id),
    addFish(id) {
      const h = s().house;
      if (h.aquarium.length >= tankSize() || h.aquarium.includes(id) || !(s().fish.species[id]?.n > 0)) return false;
      h.aquarium.push(id);
      p.noteProgress();
      p.store.commit();
      return true;
    },
    removeFish(id) {
      const h = s().house;
      h.aquarium = h.aquarium.filter((x) => x !== id);
      p.store.commit();
    },
    mountCapacity: () => 2 + (owns('room:lounge') ? 4 : 0),
    mounted: () => s().house.mounts.map((i) => s().fish.trophies[i]).filter(Boolean),
    mount(i) {
      const h = s().house;
      if (h.mounts.includes(i) || h.mounts.length >= mod.mountCapacity() || !s().fish.trophies[i]) return false;
      h.mounts.push(i);
      p.store.commit();
      return true;
    },
    unmount(i) {
      s().house.mounts = s().house.mounts.filter((x) => x !== i);
      p.store.commit();
    },
    furniture: () => (owns('furn:set1') ? SHOP.furniture.set1 : []),
  };
  p.mods.house = mod;
  p.house = mod;
}
