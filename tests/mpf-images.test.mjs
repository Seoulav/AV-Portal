import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { group1Images } from '../beta/group1-images.mjs';

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const slugs = ['mp008f', 'mp012f', 'mp016f'];
const pitches = ['0.84 mm', '1.26 mm', '1.68 mm'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('MPF cabinets have model-linked official Main photos while unverified LED cabinets remain imageless', () => {
  const catalog = read('beta/site/catalog.json');
  const imageHashes = [];
  for (const [index, slug] of slugs.entries()) {
    const detail = read(`beta/site/detail/data/${slug}.json`);
    const baseline = read(`tests/fixtures/w024-mpf-before/${slug}.json`);
    const card = catalog.find(item => item.slug === slug);
    const expectedSku = `lh${['008', '012', '016'][index]}mpfaaa-go`;
    assert.equal(detail.specifications.find(row => row.name === '픽셀 피치').value, pitches[index]);
    for (const field of ['specifications', 'io', 'keyFacts', 'portMap', 'features', 'documents'])
      assert.deepEqual(detail[field], baseline[field], `${slug}: ${field} remains unchanged`);
    assert.deepEqual(detail.io, []);
    assert.equal(detail.images.length, 1, `${slug}: Main 사진 1장`);
    assert.deepEqual(detail.images, group1Images[slug]);
    const image = detail.images[0];
    assert.equal(image.role, 'Main');
    assert.equal(image.file, `${slug}-main.webp`);
    assert.equal(image.model, detail.model);
    assert.equal(image.verificationStatus, 'FOUND');
    assert.equal(image.originalSize, '1920x1280');
    assert.equal(image.resolution, '1920x1280');
    assert.match(image.sourceUrl, new RegExp(`/us/${expectedSku}/gallery/`));
    assert.equal(card.card_image, image.file);
    assert.deepEqual(card.official_links, [`https://www.samsung.com/us/business/led-signage/indoor-led/mpf-the-wall-premium-indoor-led-display-sku-${expectedSku}/`]);
    const bytes = readFileSync(new URL(`../beta/site/detail/images/${image.file}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(bytes.toString('ascii', 12, 16), 'VP8X');
    assert.deepEqual([bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1], [1920, 1280]);
    imageHashes.push(sha256(bytes));
  }
  // Samsung's MP012F and MP016F galleries publish the same front image. Keep that fact visible in metadata.
  assert.notEqual(imageHashes[0], imageHashes[1]);
  assert.equal(imageHashes[1], imageHashes[2]);
  for (const slug of ['ie015a-e', 'ie020a-e', 'if015r-m']) {
    assert.deepEqual(read(`beta/site/detail/data/${slug}.json`).images, []);
  }
  const imageless = readdirSync(new URL('../beta/site/detail/data/', import.meta.url))
    .filter(file => file.endsWith('.json') && read(`beta/site/detail/data/${file}`).images.length === 0)
    .map(file => file.replace(/\.json$/, '')).sort();
  assert.deepEqual(imageless, ['ie015a-e', 'ie020a-e', 'if015r-m', 'lh65behhlbfxkr']);
});
