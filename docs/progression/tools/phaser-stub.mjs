// Stands in for Phaser so game modules that import it (fishing.js) load in Node for the models.
const Curves = { QuadraticBezier: class { draw() {} } };
const Math_ = { Vector2: class { constructor(x, y) { this.x = x; this.y = y; } } };
export default { Curves, Math: Math_, Scene: class {} };
