// The standard set of modules, in the order they subscribe (order is the order rewards are queued:
// the catch first, then what it moved).
import { installFish } from './fishevents.js';
import { installActivity } from './activity.js';
import { installFriendship } from './friendship.js';
import { installRequests } from './requests.js';
import { installTasks } from './tasks.js';
import { installGoals } from './goals.js';

export const CORE = [
  { name: 'fish', install: installFish },
  { name: 'activity', install: installActivity },
  { name: 'friendship-m', install: installFriendship },
  { name: 'requests-m', install: installRequests },
  { name: 'tasks-m', install: installTasks },
  { name: 'goals-m', install: installGoals },
];
export function standardModules() {
  return [...CORE];
}
