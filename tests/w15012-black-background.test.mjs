import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW15012Product, beforeW15012ImageSha } from './w15012-black-background-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w15012-black-background-history.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));

test('W-012 historical inverse restores only approved photo fields and exposes other regressions', () => {
  assert.equal(Object.keys(fixture.products).length, 7);
  for (const [slug, record] of Object.entries(fixture.products)) {
    const current = read(slug);
    const core = structuredClone(current);
    delete core.images; delete core.imageStatuses;
    assert.equal(sha(JSON.stringify(core)), record.priorCoreSha256, slug + ' protected fields');
    const previous = beforeW15012Product(current, slug);
    assert.deepEqual(previous.images, record.priorImages);
    assert.deepEqual(previous.imageStatuses, record.priorImageStatuses);
    const modified = structuredClone(current);
    modified.io = [];
    assert.deepEqual(beforeW15012Product(modified, slug).io, []);
    const drift = structuredClone(current);
    drift.images[0].note += ' drift';
    assert.throws(() => beforeW15012Product(drift, slug), /unexpected W-012/);
    const statusDrift = structuredClone(current);
    statusDrift.imageStatuses[0].status = 'INVALID';
    assert.throws(() => beforeW15012Product(statusDrift, slug), /unexpected W-012/);
  }
});

test('W-012 exact eight image bytes and two intentionally unchanged black devices', () => {
  assert.equal(Object.keys(fixture.images).length, 8);
  for (const [file, record] of Object.entries(fixture.images)) {
    const actual = sha(readFileSync(new URL(`../beta/site/detail/images/${file}`, import.meta.url)));
    assert.equal(actual, record.approvedSha256, file);
    assert.equal(beforeW15012ImageSha(actual, file), record.priorSha256);
    assert.throws(() => beforeW15012ImageSha('unexpected', file), /unexpected W-012/);
  }
  for (const [file, expected] of Object.entries({
    'lh115qhfebgxkr-rear.webp': '5de50b92d037fcabd34b774131d61b7e577dc5db4edd3f8f907a292bd5decac7',
    'ds-8s-front.webp': '5a594319f4873b252c82a5599b818bcc2e91cd31964872b855195116e97c8576'
  })) {
    const actual = sha(readFileSync(new URL(`../beta/site/detail/images/${file}`, import.meta.url)));
    assert.equal(actual, expected, file + ' unchanged');
  }
});
