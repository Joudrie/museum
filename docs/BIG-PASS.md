# Big pass log

A long autonomous polish-and-features pass. Each phase ships as its own PR.

## How to test
```
npm run build && npx vite preview --port 4173 --base / &
PW=/opt/node-tools/node_modules/playwright node tests/smoke.cjs   # every flow
PW=/opt/node-tools/node_modules/playwright node tests/gaps.cjs    # wall gaps, 54 room shapes
```

## Phase 1: Bug sweep
- Added `tests/smoke.cjs`, which plays through:
  - fresh save, tutorial, cleaning, buying the main hall
  - break room and office doors, staff board
  - building 4 room types; talking to everyone
  - Customize (theme, resize, reorder, character), placing an item, Collect all
  - HUD at huge numbers, reload, cameras, robbery
  - an old pre-entrance save and a corrupt save
- In every room it also checks that the player can move from every free spot and that no NPC ends up inside a wall.
- Added `tests/gaps.cjs` (the wall-gap check, now in the repo).
- Fixed:
  - NPCs could walk through columns, handrails and other thin blockers (only the end of a walk was checked). The whole path is checked now.
  - NPCs walked through each other. Now they wait for the way to clear and turn back if it stays blocked.
  - A corrupt save (bad items, rooms or decor) crashed the game. Loading now validates shapes and drops junk.
  - The wall-spot menu said "In room 2" for paintings in the main hall; it now uses room names.
  - Placing an item with a museum-wide max read a removed office perk (closet leftovers).
