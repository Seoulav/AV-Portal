import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW16015Group5Product, w16015Group5Slugs} from './w16015-group5-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-015-group5-prior-portmaps.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const product = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const unchangedMaps = {
  dm7: '282a3bb693fd8cfe14e6daa7a9062349400900691d044c22ef707448e63c10be',
  'rally-plus': 'e3c00d9c22ee34c066ff5e3da96511b1f16314d3e23417829572f585f0b56afd',
  'rally-bar': 'c39d1adf2cd42da9bfe37ebf41ecd026ecd481bc4c383250ea13d8489fc43835'
};

test('W-015 group 5 changes only 30 approved maps and preserves current non-map fields', () => {
  assert.equal(w16015Group5Slugs.size, 30);
  let markers = 0, beforeY = 0, afterY = 0;
  for (const [slug, record] of Object.entries(fixture)) {
    const current = product(slug);
    assert.equal(hash(current.portMap), record.approved, slug);
    const rest = structuredClone(current);
    delete rest.portMap;
    assert.equal(hash(rest), record.unchangedSha, `${slug}: non-map data`);
    assert.deepEqual(current.portMap.items.map(({n,label,desc})=>[n,label,desc]), record.prior.items.map(({n,label,desc})=>[n,label,desc]), `${slug}: marker meaning`);
    assert.deepEqual(beforeW16015Group5Product(current,slug).portMap, record.prior, slug);
    markers += current.portMap.items.length;
    beforeY += record.prior.items.filter(item=>item.y!==undefined).length;
    afterY += current.portMap.items.filter(item=>item.y!==undefined).length;
  }
  assert.deepEqual([markers,beforeY,afterY],[171,170,2]);
  for (const [slug, expected] of Object.entries(unchangedMaps)) assert.equal(hash(product(slug).portMap), expected, `${slug}: unsafe edge draft excluded`);
});

test('W-015 group 5 inverse rejects marker drift and exposes unrelated current regressions', () => {
  const original = product('gsm4212p');
  const ioChanged = structuredClone(original);
  ioChanged.io = [];
  assert.deepEqual(beforeW16015Group5Product(ioChanged,'gsm4212p').io, []);
  const mapChanged = structuredClone(original);
  mapChanged.portMap.items[0].x1 += 1;
  assert.throws(()=>beforeW16015Group5Product(mapChanged,'gsm4212p'), /unexpected W-015 group-5 portMap change/);
});
