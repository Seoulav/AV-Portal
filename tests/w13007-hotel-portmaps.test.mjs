import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW13007HotelProduct } from './w13007-hotel-history.mjs';
import { beforeW16015SamsungHotelPlacementProduct } from './w16015-samsung-hotel-placement-history.mjs';

const sizes = ['43', '50', '55', '65', '75', '85'];
const root = new URL('../', import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');

test('six U800F hotel TVs use the applicable Korean manual diagram and ten physical marker groups', () => {
  const hashes = [];
  for (const size of sizes) {
    const slug = `hg${size}u800fnfxkr`;
    const product = JSON.parse(readFileSync(new URL(`beta/site/detail/data/${slug}.json`, root)));
    const file = `${slug}-diagram.webp`;
    const diagram = product.images.find(image => image.role === 'Diagram');
    assert.equal(diagram?.file, file, slug);
    assert.equal(diagram.model, product.model);
    assert.equal(diagram.verificationStatus, 'VERIFIED');
    assert.deepEqual(product.portMap.measuredImage, { file, width: 900, height: 1120 });
    assert.equal(product.portMap.image, 'Diagram');
    assert.equal(product.portMap.items.length, 10);
    assert.deepEqual(product.portMap.items.map(item => item.n), [1,2,3,4,5,6,7,8,9,10]);
    assert.ok(product.portMap.items.some(item => item.label === 'HDMI 입력 1–3'));
    assert.ok(product.portMap.items.every(item => !/HP-ID|HEADPHONE|SERVICE|RJ12/.test(item.label)));
    assert.ok(prepareEnhancements(product).portMap, slug);
    hashes.push(sha(readFileSync(new URL(`beta/site/detail/images/${file}`, root))));
  }
  assert.equal(new Set(hashes).size, 1, 'the six model variants share the same manual panel drawing');
});

test('hotel history inverse restores only approved map/image fields and exposes unrelated changes', () => {
  const slug='hg43u800fnfxkr';
  const current=JSON.parse(readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root)));
  const prior=beforeW16015SamsungHotelPlacementProduct(current,slug);
  const restored=beforeW13007HotelProduct(prior,slug);
  assert.equal(restored.portMap,undefined);
  assert.equal(restored.images.length,1);
  assert.equal(restored.imageStatuses.some(x=>x.role==='Diagram'),false);
  const bad=structuredClone(current);bad.portMap.items[0].y1++;
  assert.throws(()=>beforeW16015SamsungHotelPlacementProduct(bad,slug),/unexpected W-015 Samsung hotel Port Map placement change/);
  const other=structuredClone(current);other.io[0].quantity='99';
  assert.equal(beforeW13007HotelProduct(beforeW16015SamsungHotelPlacementProduct(other,slug),slug).io[0].quantity,'99');
});
