import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW13007BehhlGuideCatalog, beforeW13007BehhlGuideProduct } from './w13007-behhl-guide-history.mjs';

const sizes = [43, 50, 55, 65, 75, 85];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const product = slug => JSON.parse(read(`beta/site/detail/data/${slug}.json`));
const labels = ['USB', 'LAN', 'HDMI (eARC)', 'ANT', 'HDMI'];

test('six BEHX-H variants map only the five connector icons in the common guide', () => {
  const hashes = [];
  const reference = product('lh43behhlbfxkr');
  for (const size of sizes) {
    const slug = `lh${size}behhlbfxkr`;
    const current = product(slug);
    const file = `${slug}-diagram.webp`;
    const image = current.images.find(entry => entry.role === 'Diagram');
    assert.equal(image?.file, file);
    assert.match(image.note, /연결 안내 범례/);
    assert.match(image.note, /세 번째 위치는 미표기/);
    assert.equal(current.imageStatuses.find(entry => entry.role === 'Diagram')?.status, 'VERIFIED');
    assert.deepEqual(current.portMap.measuredImage, { file, width: 1120, height: 624 });
    assert.deepEqual(current.portMap.items.map(item => item.label), labels);
    assert.deepEqual(current.portMap.items.map(item => item.n), [1, 2, 3, 4, 5]);
    assert.deepEqual(current.portMap.items, reference.portMap.items);
    assert.equal(current.io.find(row => row.connector === 'HDMI 입력')?.quantity, '3');
    assert.ok(prepareEnhancements(current).portMap, slug);
    hashes.push(sha(read(`beta/site/detail/images/${file}`)));
  }
  assert.equal(new Set(hashes).size, 1, 'six size variants share identical guide pixels');
  assert.equal(sha(read('beta/site/manuals/samsung-behx-h-installation-guide-ko.pdf')), '83e0ea88db6e5a212ee971d8f96362c93b47cff58292e7e19e7eda2367bbd479');
  const catalog = JSON.parse(read('beta/site/catalog.json'));
  const card = catalog.find(entry => entry.slug === 'lh65behhlbfxkr');
  assert.equal(card.card_image, 'lh65behhlbfxkr-diagram.webp');
  assert.equal(beforeW13007BehhlGuideCatalog(catalog).find(entry => entry.slug === card.slug).card_image, undefined);
});

test('BEHX-H history inverse removes only the approved guide map and catches tampering', () => {
  for (const size of sizes) {
    const slug = `lh${size}behhlbfxkr`;
    const current = product(slug);
    const previous = beforeW13007BehhlGuideProduct(current, slug);
    assert.equal(previous.portMap, undefined);
    assert.equal(previous.images.some(image => image.role === 'Diagram'), false);
    const bad = structuredClone(current);
    bad.portMap.items[0].y1++;
    assert.throws(() => beforeW13007BehhlGuideProduct(bad, slug), /unexpected W-007 BEHHL portMap change/);
    const unrelated = structuredClone(current);
    unrelated.io[0].quantity = '99';
    assert.equal(beforeW13007BehhlGuideProduct(unrelated, slug).io[0].quantity, '99');
  }
});
