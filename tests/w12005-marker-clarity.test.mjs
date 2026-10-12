import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW12005Product, beforeW12005Raw } from './w12005-history.mjs';
import { beforeKiprogo2Mx395Product } from './w12005-kiprogo2-mx395-history.mjs';

const records = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-prior-maps.json', import.meta.url), 'utf8'));
const path = slug => `beta/site/detail/data/${slug}.json`;
const current = slug => JSON.parse(readFileSync(path(slug), 'utf8'));

test('thirteen corrected maps leave all other current product fields unchanged', () => {
  assert.equal(Object.keys(records).length, 13);
  for (const slug of Object.keys(records)) {
    const product = current(slug);
    const restored = beforeW12005Product(product, slug);
    assert.deepEqual(restored.portMap, records[slug].prior, slug);
    const core = structuredClone(product);
    delete core.portMap;
    assert.equal(createHash('sha256').update(JSON.stringify(core)).digest('hex'), records[slug].priorCoreSha256, slug);
    assert.ok(prepareEnhancements(product).portMap, `${slug}: current map visible`);
  }
});

test('historical inverse rejects a changed marker and exposes unrelated current I/O', () => {
  for (const slug of Object.keys(records)) {
    const product = current(slug);
    const changedIo = structuredClone(product);
    changedIo.io = [];
    assert.deepEqual(beforeW12005Product(changedIo, slug).io, [], slug);
    assert.notEqual(beforeW12005Raw(JSON.stringify(changedIo, null, 2) + '\n', slug),
      beforeW12005Raw(readFileSync(path(slug), 'utf8'), slug), slug);
    const changedMap = structuredClone(beforeKiprogo2Mx395Product(product, slug));
    changedMap.portMap.items[0].label += ' altered';
    assert.throws(() => beforeW12005Product(changedMap, slug), /unexpected (Ki Pro GO2 regrouping|W-005 Port Map change)/, slug);
  }
});

test('two-row groups cover both rows and contiguous VS10 ports retain all 26 old entries', () => {
  const ki = beforeKiprogo2Mx395Product(current('ki-pro-go2'), 'ki-pro-go2').portMap.items;
  assert.equal(ki.length, 14);
  const hdmi = ki.filter(item => item.label.startsWith('HDMI 입력'));
  assert.deepEqual(hdmi.map(item => item.label), ['HDMI 입력 1', 'HDMI 입력 2', 'HDMI 입력 3–4']);
  assert.deepEqual(hdmi.map(item => item.side), ['top', 'top', 'bottom']);
  assert.ok(hdmi[0].x2 < hdmi[1].x1);
  const sdi = ki.filter(item => item.label.startsWith('SDI 출력'));
  assert.deepEqual(sdi.map(item => item.side), ['top', 'bottom']);
  assert.match(sdi[0].label, /1–2/);
  assert.match(sdi[1].label, /3–4/);
  assert.ok(sdi[0].y < sdi[1].y);
  const dm7 = current('dm7').portMap.items;
  assert.equal(dm7.length, 18); // Correct rows take priority over the 15-marker target.
  for (const n of [1, 2, 7]) {
    const item = dm7.find(item => item.n === n);
    assert.ok(['left', 'right'].includes(item.side));
    assert.ok(item.y1 < item.y2);
  }
  const vs10 = current('vs10').portMap.items;
  assert.equal(vs10.length, 13);
  assert.deepEqual(vs10.map(item => item.n), Array.from({ length: 13 }, (_, i) => i + 1));
  assert.match(vs10[0].label, /SDI 입력 1–6/);
  assert.match(vs10[1].label, /SDI 입력 7–8/);
  assert.match(vs10[4].label, /AUX 출력 1–4/);
});
