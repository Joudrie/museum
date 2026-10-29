// The standard set of modules, in the order they subscribe (order is the order
// rewards are queued: the catch first, then what it moved).
import { installFish } from './fishevents.js';

export const CORE = [{ name: 'fish', install: installFish }];
export function standardModules() {
  return [...CORE];
}
