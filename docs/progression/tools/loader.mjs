export async function resolve(specifier, context, next) {
  if (specifier === 'phaser') return { url: new URL('./phaser-stub.mjs', import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
