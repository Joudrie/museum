// node --import ./docs/progression/tools/register.mjs ...  (loads the shim and maps 'phaser' to a stub)
import { register } from 'node:module';
import './shim.mjs';
register(new URL('./loader.mjs', import.meta.url));
