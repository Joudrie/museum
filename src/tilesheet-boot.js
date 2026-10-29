// Entry for the tile sheet page: waits for art dropped in public/swap, then starts.
import { swapReady } from './swap.js';

swapReady.then(() => import('./tilesheet.js'));
