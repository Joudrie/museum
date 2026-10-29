// Test helper: the HUD keeps a few buttons; the rest (Today, Settings...) live in the Menu hub.
// await openHub(page) before clicking #daily-btn, #settings-btn, #hub-share or #hub-income.
async function openHub(p) {
  if (await p.isVisible('#hub.overlay:not(.hidden)').catch(() => false)) return;
  await p.click('#menu-btn');
  await p.waitForTimeout(350);
}
// The Journal opens on an overview of cards (each has data-jtab). Go to a page from anywhere in the journal.
async function jtab(p, id) {
  if (await p.isVisible('.journal-back').catch(() => false)) {
    await p.click('.journal-back');
    await p.waitForTimeout(250);
  }
  await p.click(`[data-jtab="${id}"]`);
}
module.exports = { openHub, jtab };
