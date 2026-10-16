import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW16015Group12Product, w16015Group12Slugs} from './w16015-group12-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-015-group1-2-prior-portmaps.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const product = slug => JSON.parse(readFileSync(new URL('../beta/site/detail/data/' + slug + '.json', import.meta.url), 'utf8'));

test('W-015 group 1-2 changes only nine approved maps and preserves marker meaning', () => {
  assert.equal(w16015Group12Slugs.size, 9);
  let markers = 0, beforeY = 0, afterY = 0, via = 0;
  for (const [slug, record] of Object.entries(fixture)) {
    const current = product(slug);
    assert.equal(hash(current.portMap), record.approved, slug);
    const rest = structuredClone(current);
    delete rest.portMap;
    assert.equal(hash(rest), record.unchangedSha, slug + ': non-map data');
    assert.deepEqual(current.portMap.items.map(({n,label,desc})=>[n,label,desc]), record.prior.items.map(({n,label,desc})=>[n,label,desc]), slug + ': marker meaning');
    assert.deepEqual(beforeW16015Group12Product(current,slug).portMap, record.prior, slug);
    markers += current.portMap.items.length;
    beforeY += record.prior.items.filter(item=>item.y!==undefined).length;
    afterY += current.portMap.items.filter(item=>item.y!==undefined).length;
    via += current.portMap.items.filter(item=>item.via).length;
    const width = Number(current.images.find(image => image.role === current.portMap.image)?.resolution.match(/^\d+/)?.[0]);
    assert.ok(width > 0, slug + ': photo width');
    for (const item of current.portMap.items.filter(marker => marker.via)) {
      const horizontal = ['left','right'].includes(item.side)
        ? Math.abs(item.x - item.via.at(-1)[0])
        : Math.abs((item.x1 + item.x2) / 2 - item.via[0][0]);
      assert.ok(horizontal <= width / 4, slug + ': marker ' + item.n + ' has a long horizontal route');
    }
  }
  assert.deepEqual([markers,beforeY,afterY,via],[105,105,13,10]);
});

test('W-015 group 1-2 inverse rejects map drift and exposes other current regressions', () => {
  const current = product('eb-l260f');
  const ioChanged = structuredClone(current);
  ioChanged.io = [];
  assert.deepEqual(beforeW16015Group12Product(ioChanged,'eb-l260f').io, []);
  const mapChanged = structuredClone(current);
  mapChanged.portMap.items[0].x1 += 1;
  assert.throws(()=>beforeW16015Group12Product(mapChanged,'eb-l260f'), /unexpected W-015 group-1-2 portMap change/);
});
