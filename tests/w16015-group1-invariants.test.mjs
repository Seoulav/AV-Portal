import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW16015Product, w16015Group1Slugs} from './w16015-group1-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-015-group1-prior-portmaps.json', import.meta.url), 'utf8'));
const root = new URL('../beta/site/detail/data/', import.meta.url);
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const product = slug => JSON.parse(readFileSync(new URL(`${slug}.json`, root), 'utf8'));
const group = readdirSync(root).filter(name => name.endsWith('.json')).map(name => name.slice(0,-5)).filter(slug => ['Epson','Panasonic','Colorlight'].includes(product(slug).manufacturer) && product(slug).portMap);

test('W-015 group 1 maps change only approved geometry and keep all current product fields visible', () => {
  assert.equal(group.length, 26);
  assert.equal(w16015Group1Slugs.size, 25);
  let markers = 0, beforeY = 0, afterY = 0;
  for (const slug of group) {
    const current = product(slug);
    markers += current.portMap.items.length;
    afterY += current.portMap.items.filter(item => item.y !== undefined).length;
    if (!fixture[slug]) {
      assert.equal(slug, 'x100pro-2u');
      assert.equal(hash(current.portMap), '7a73d7312597afd6049da0889419f813c80dd1d6f9664eb930750c866654419e');
      continue;
    }
    const approved = fixture[slug];
    assert.equal(hash(current.portMap), approved.approved, slug);
    const rest = structuredClone(current);
    delete rest.portMap;
    assert.equal(hash(rest), approved.unchangedSha, `${slug}: non-map data changed`);
    const old = beforeW16015Product(current, slug);
    assert.deepEqual(old.portMap, approved.prior, slug);
    beforeY += approved.prior.items.filter(item => item.y !== undefined).length;
    assert.deepEqual(current.portMap.items.map(item => [item.n,item.label,item.desc]), approved.prior.items.map(item => [item.n,item.label,item.desc]), `${slug}: marker meaning changed`);
  }
  assert.equal(markers, 241);
  assert.equal(beforeY, 238);
  assert.equal(afterY, 0);
});

test('W-015 inverse exposes unrelated current regressions and rejects unexpected map drift', () => {
  const current = product('eb-l260f');
  const ioChanged = structuredClone(current);
  ioChanged.io = [];
  assert.deepEqual(beforeW16015Product(ioChanged, 'eb-l260f').io, []);
  const mapChanged = structuredClone(current);
  mapChanged.portMap.items[0].x1 += 1;
  assert.throws(() => beforeW16015Product(mapChanged, 'eb-l260f'), /unexpected W-015 portMap change/);
});
