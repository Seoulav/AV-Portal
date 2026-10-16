import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portMapGeometry } from '../prototype/brc-am7/detail-enhancement-view.mjs';

test('Aquilon repeated card columns share the same card number while retaining separate photo markers', () => {
  for (const slug of ['aquilon-rs1', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6']) {
    const product = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url)));
    const map = product.portMap;
    const { width, height } = map.measuredImage;
    const { markers, photoTop } = portMapGeometry(map, width, height);
    const top = markers.filter(marker => marker.side === 'top');
    assert.equal(top.length, 6, slug);
    assert.ok(top.every(marker => marker.cy + 10 <= photoTop), slug);
    const groups = new Map();
    for (const marker of top) {
      const same = groups.get(marker.item.n) ?? [];
      same.push(marker);
      groups.set(marker.item.n, same);
    }
    for (const group of groups.values()) {
      assert.ok(group.every(marker => marker.item.label === group[0].item.label && marker.item.desc === group[0].item.desc), slug);
      for (let i = 0; i < group.length; i++) for (const other of group.slice(i + 1))
        assert.ok(Math.hypot(group[i].cx - other.cx, group[i].cy - other.cy) >= 20, `${slug}: marker circles overlap`);
    }
  }
});
