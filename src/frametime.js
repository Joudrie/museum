// How long the last frame really took, in seconds. Phaser smooths its delta and, for a while after a
// slow frame, hands scenes a full-speed 16.7 ms however long frames really take; right after a scene
// starts (pictures being drawn) that made you walk at half speed for the first steps. The real time
// (loop.rawDelta) keeps walking at one speed. Capped (`cap` ms) so a long stall is not one huge step.
export const frameDt = (scene, dtMs, cap = 50) => Math.min(Math.max(dtMs, scene.game.loop.rawDelta || 0), cap) / 1000;
