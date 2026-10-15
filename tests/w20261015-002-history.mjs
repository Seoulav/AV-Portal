import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const changedFieldsHash = '2dd95f9f693d327de006d277e78a34359e10e9f938aec895643edaa9d9fd8887';
const oldNote = 'Diagram · 공식 제품 페이지 연결 그림, 후면 호스트·장치·제어 구획 확인';
const epsonSlugs = new Set(['eb-pq2213b', 'eb-pq2216b']);
const epsonMarkerHash = '14d089911b9a068816d1831d25b94f2e5c6f8ac0c2c75972a3b352d5cd626947';
const hash = value => createHash('sha256').update(value).digest('hex');

export function beforeW20261015_002Product(product, slug) {
  if (slug !== 'toggle-dock-2x1') return product;
  const diagram = product.images.find(image => image.role === 'Diagram');
  assert.ok(diagram, 'TOGGLE DOCK diagram must exist');
  assert.equal(hash(JSON.stringify({ note: diagram.note, crop: product.portMap.crop })), changedFieldsHash,
    'TOGGLE DOCK approved diagram crop changed');
  const copy = structuredClone(product);
  copy.images.find(image => image.role === 'Diagram').note = oldNote;
  copy.portMap.crop = { top: 155, bottom: 320 };
  return copy;
}

export function beforeW20261015_002Raw(raw, slug) {
  if (slug !== 'toggle-dock-2x1') return raw;
  return JSON.stringify(beforeW20261015_002Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeW20261015_002EpsonProduct(product, slug) {
  if (!epsonSlugs.has(slug)) return product;
  const marker = product.portMap.items.find(item => item.n === 2);
  assert.equal(hash(JSON.stringify(marker)), epsonMarkerHash, `${slug} HDMI 2 marker changed`);
  const copy = structuredClone(product);
  const oldMarker = copy.portMap.items.find(item => item.n === 2);
  oldMarker.x1 = 482;
  oldMarker.x2 = 492;
  return copy;
}

export function beforeW20261015_002EpsonRaw(raw, slug) {
  if (!epsonSlugs.has(slug)) return raw;
  return JSON.stringify(beforeW20261015_002EpsonProduct(JSON.parse(raw), slug), null, 2) + '\n';
}
