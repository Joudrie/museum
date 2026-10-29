// Entry for the game page: waits for art dropped in public/swap (src/swap.js), then starts.
import { swapReady } from './swap.js';

swapReady.then(() => import('./main.js'));
