// A single 2K layer, based on the user's cross-card operating example.
// Not a device capacity calculator or a model of connectors within one card.
export const CAPACITY = 16;
const positions = { left: 120, span: 290, right: 490 };
export function scenario(mode) {
  const id = Object.hasOwn(positions, mode) ? mode : 'span';
  const x = positions[id], width = 260;
  const used = [[40, 420], [420, 800]].map(([start, end]) => Number(x < end && x + width > start));
  return { id, x, width, visibleLayers: 1, used, remaining: used.map(n => CAPACITY - n), totalConsumed: used.reduce((a, b) => a + b, 0) };
}
