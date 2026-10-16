import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { enhancementErrors } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW20261015_008Product, beforeW20261015_008Raw } from './w20261015-008-history.mjs';

const photos = {
  'brc-am7': ['f466bcfc98dbfb18aa920674e70fc1661f4e82ae9a245dd6e939e95f9ec1c0f0', 17],
  'rm-ip10': ['e48ff7754b946ad0b0e5e61d9e88162d774bc798ec008a5ce5ff06e91ecef1bb', 5],
  'rm-ip500': ['1c0ab7e5cb7ebad4f8d12d5e857143761e59703a73c03b5b414747a6720c1968', 5],
};
const priorHashes = {
  'brc-am7': 'c6d2019bf264a98eb40e6b3cbbd7b41a73882b46ade73f72eca8a16e3041c0ff',
  'rm-ip10': '657a40d3a5cd81aefd063d2202ec64b9f6677e25e405fc707f8cf22557fdcd99',
  'rm-ip500': 'bdeef93205d24f7549369d4cd187bac45ba60cb698f0ed7c5002737a3032bcfa',
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const file = slug => `beta/site/detail/data/${slug}.json`;

test('Sony maps use the approved official rear photos and visible connector counts', () => {
  for (const [slug, [photoHash, count]] of Object.entries(photos)) {
    const product = JSON.parse(readFileSync(file(slug), 'utf8'));
    assert.deepEqual(enhancementErrors(product), [], slug);
    assert.equal(product.portMap.image, 'Rear', slug);
    assert.equal(product.portMap.items.length, count, slug);
    assert.deepEqual(product.portMap.items.map(item => item.n), Array.from({ length: count }, (_, index) => index + 1), slug);
    const image = product.images.find(row => row.role === 'Rear');
    assert.equal(product.portMap.measuredImage.file, image.file, slug);
    assert.equal(sha(readFileSync(`beta/site/detail/images/${image.file}`)), photoHash, slug);
    // W-012/W-015: absent y uses the cropped edge; explicit positions stay in crop.
    assert.ok(product.portMap.items.every(item => item.y === undefined || item.y >= product.portMap.crop.top), slug);
  }
  const brc = JSON.parse(readFileSync(file('brc-am7'), 'utf8'));
  assert.equal(brc.portMap.items.find(item => item.n === 10).label, 'OPTION');
  assert.match(brc.portMap.items.find(item => item.n === 10).desc, /기록 신호/);
  assert.deepEqual(JSON.parse(readFileSync(file('rm-ip10'), 'utf8')).portMap.items.map(item => item.label),
    ['LAN', 'VISCA RS-232C OUT', 'VISCA RS-422', 'TALLY/CONTACT', 'DC IN 12V']);
});

test('selective inverse restores exact pre-W-008 product bytes and exposes unrelated edits', () => {
  for (const slug of Object.keys(photos)) {
    const raw = readFileSync(file(slug), 'utf8');
    assert.equal(sha(beforeW20261015_008Raw(raw, slug)), priorHashes[slug], slug);
    const changed = JSON.parse(raw);
    changed.model = 'INVALID';
    assert.equal(beforeW20261015_008Product(changed, slug).model, 'INVALID', slug);
    changed.portMap.items[0].x1 += 1;
    assert.throws(() => beforeW20261015_008Product(changed, slug), /approved Sony map changed/);
  }
});
