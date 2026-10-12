import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';
import { beforeW12003Product, beforeW12003Raw } from './w12003-kiprogo2-history.mjs';

const read = name => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${name}.json`, import.meta.url), 'utf8'));
const record = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-003-prior-map.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = [[1,2,3,4], [5,6,7,8], [9,10], [11,12], [13,14,15,16], [17], [18], [19,20], [21], [22], [23,24]];

test('Ki Pro GO2 groups all 24 old connectors into eleven valid photographed markers', () => {
  const p = read('ki-pro-go2');
  assert.equal(p.portMap.items.length, 11);
  assert.deepEqual(p.portMap.items.map(item => item.n), Array.from({ length: 11 }, (_, i) => i + 1));
  assert.ok(prepareEnhancements(p).portMap, 'Port Map must pass the public validator');
  assert.deepEqual(groups.flat(), record.prior.items.map(item => item.n));
  assert.equal(p.portMap.measuredImage.file, 'ki-pro-go2-rear.webp');
  assert.deepEqual([p.portMap.measuredImage.width, p.portMap.measuredImage.height], [1140, 450]);
  assert.match(p.portMap.items[0].label, /SDI 입력 1–4/);
  assert.match(p.portMap.items[1].label, /HDMI 입력 1–4/);
  assert.match(p.portMap.items[2].desc, /R.*LTC/);
  assert.match(p.portMap.items[10].desc, /2계통/);
});

test('only the approved map changes and historical inverse exposes unrelated current data', () => {
  const p = read('ki-pro-go2');
  const core = structuredClone(p); delete core.portMap;
  assert.equal(hash(core), record.coreSha256);
  const old = beforeW12003Product(p, 'ki-pro-go2');
  assert.deepEqual(old.portMap, record.prior);
  const raw = readFileSync(new URL('../beta/site/detail/data/ki-pro-go2.json', import.meta.url), 'utf8');
  assert.equal(createHash('sha256').update(beforeW12003Raw(raw, 'ki-pro-go2')).digest('hex'), record.priorFileSha256);
  const unrelated = structuredClone(p); unrelated.io = []; unrelated.model = 'INVALID';
  const restored = beforeW12003Product(unrelated, 'ki-pro-go2');
  assert.deepEqual(restored.io, []); assert.equal(restored.model, 'INVALID');
  const bad = structuredClone(p); bad.portMap.items[0].label = 'wrong';
  assert.throws(() => beforeW12003Product(bad, 'ki-pro-go2'), /unexpected W-003 portMap/);
  assert.equal(beforeW12003Product(read('vs10'), 'vs10').portMap.items.length, 26);
});
