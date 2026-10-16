import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w20261016-015-b4-portmap-history.json', import.meta.url), 'utf8'));
export const w20261016_015B4Slugs = new Set(Object.keys(fixture));
const hash = value => createHash('sha256').update(value).digest('hex');
const layout = map => ({crop:map.crop??null,items:map.items.map(item=>({n:item.n,side:item.side,...Object.fromEntries(['x','x1','x2','y','y1','y2','via'].filter(k=>Object.hasOwn(item,k)).map(k=>[k,item[k]]))}))});
const stableMap = map => map && ({ image: map.image, measuredImage: map.measuredImage, items: map.items.map(({ n, label, desc }) => ({ n, label, desc })) });
const jsonBytes = product => JSON.stringify(product, null, 2) + '\n';

export function beforeW20261016_015B4Product(current, slug, { allowHistorical = false } = {}) {
  const prior = fixture[slug];
  if (!prior) return current;
  if (!current.portMap || JSON.stringify(stableMap(current.portMap)) !== JSON.stringify(stableMap(prior.portMap))) {
    if (allowHistorical) return current;
    throw new Error(slug + ': unexpected W-015 bundle 4 non-layout Port Map change');
  }
  if (JSON.stringify(current.portMap) === JSON.stringify(prior.portMap)) return current;
  if (hash(JSON.stringify(layout(current.portMap))) !== prior.approvedLayoutSha256) {
    if (allowHistorical) return current;
    throw new Error(slug + ': unexpected W-015 bundle 4 layout change');
  }
  const restored = structuredClone(current);
  restored.portMap = structuredClone(prior.portMap);
  return restored;
}

export function beforeW20261016_015B4Raw(raw, slug, options = {}) {
  if (!fixture[slug]) return raw;
  const restored = beforeW20261016_015B4Product(JSON.parse(raw), slug, options);
  const result = jsonBytes(restored);
  return result;
}