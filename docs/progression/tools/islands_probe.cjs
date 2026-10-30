// What the progression layer's world actually places on each island, in the built game (a phone-sized browser):
// secrets, whether one is a legend's clue, and the named islanders standing there. Writes data/world_by_island.json.
//   npm run build && npx vite preview --port 4173 --base / &
//   node docs/progression/tools/islands_probe.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(URL + '?hour=13&weather=clear');
  await p.waitForTimeout(2500);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(2500);
  const out = [];
  for (const map of ['main', 'one', 'isle-1', 'exp-pirate', 'exp-wreck']) {
    await p.evaluate((m) => { __game.scene.stop('room'); __game.scene.getScene('island').scene.start('island', { map: m, ...(m.startsWith('exp-') ? { expedition: m.slice(4) } : {}) }); }, map);
    await p.waitForTimeout(3000);
    out.push(await p.evaluate(() => {
      const s = __game.scene.getScene('island');
      const w = s.world;
      return { map: s.mapId, regionKey: s.regionKey, secrets: w?.secrets?.length ?? null, clue: !!w?.secrets?.some((x) => x.clue), named: s.islanders.filter((x) => x.npcId).map((x) => x.npcId) };
    }));
  }
  const file = path.join(__dirname, '..', 'data', 'world_by_island.json');
  fs.writeFileSync(file, JSON.stringify({ generated: 'docs/progression/tools/islands_probe.cjs', when: new Date().toISOString(), note: 'regions.json has 12/6/12/6/5 secrets and a clue on every island, and npcs.json a named islander on each', islands: out }, null, 1) + '\n');
  console.log(out.map((o) => `${o.regionKey}: ${o.secrets} secrets, clue ${o.clue ? 'yes' : 'no'}, named ${o.named.join(', ') || 'none'}`).join('\n'));
  await b.close();
})();
