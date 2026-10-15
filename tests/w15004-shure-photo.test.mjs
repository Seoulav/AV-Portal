import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW15004Product, beforeW15004ImageSha } from './w15004-shure-photo-history.mjs';

const read = slug => JSON.parse(readFileSync(new URL('../beta/site/detail/data/' + slug + '.json', import.meta.url), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const proof = JSON.parse(readFileSync(new URL('./fixtures/w15004-shure-photo-history.json', import.meta.url)));

test('Shure photo inverse restores only approved image metadata and rejects drift', () => {
  for (const slug of Object.keys(proof.products)) {
    const current = read(slug);
    const prior = beforeW15004Product(current, slug);
    assert.deepEqual(prior.images, proof.products[slug].priorImages);
    const unchanged = structuredClone(current);
    delete unchanged.images;
    delete prior.images;
    assert.deepEqual(prior, unchanged);
    const changed = structuredClone(current);
    changed.images[0].note += ' changed';
    assert.throws(() => beforeW15004Product(changed, slug), /unexpected W-15004 image metadata/);
    const unrelated = structuredClone(current);
    unrelated.model = 'INVALID';
    assert.equal(beforeW15004Product(unrelated, slug).model, 'INVALID');
  }
});

test('three approved replacements have exact bytes and the other Shure images remain untouched', () => {
  for (const [file, expected] of Object.entries(proof.unchangedImages)) {
    const bytes = readFileSync(new URL('../beta/site/detail/images/' + file, import.meta.url));
    assert.equal(sha(bytes), expected, file + ': unchanged Shure photo');
  }
  for (const [file, record] of Object.entries(proof.images)) {
    const bytes = readFileSync(new URL('../beta/site/detail/images/' + file, import.meta.url));
    assert.equal(sha(bytes), record.approvedSha256, file);
    assert.equal(beforeW15004ImageSha(record.approvedSha256, file), record.priorSha256);
    assert.throws(() => beforeW15004ImageSha('unexpected', file), /unexpected W-15004 image bytes/);
  }
});