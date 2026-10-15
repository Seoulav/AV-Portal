import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portMapGeometry } from '../prototype/brc-am7/detail-enhancement-view.mjs';

test('Aquilon repeated card columns have separate top labels while brackets retain card ranges', () => {
  for (const slug of ['aquilon-rs1', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6']) {
    const product = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url)));
    const map = product.portMap;
    const { width, height } = map.measuredImage;
    const { markers, photoTop } = portMapGeometry(map, width, height);
    const top = markers.filter(marker => marker.side === 'top');
    assert.equal(top.length, 6, slug);
    assert.ok(top.every(marker => marker.cy + 10 <= photoTop), slug);
    assert.ok(top.every(marker => marker.lane === 0), slug);
    for (const n of [4, 5, 6]) {
      const first = top.find(marker => marker.item.n === n - 3);
      const second = top.find(marker => marker.item.n === n);
      assert.ok(first.cx - second.cx >= 40, `${slug}: ${n} label clearance`);
      assert.equal(second.anchorX, first.cx, `${slug}: ${n} bracket column`);
    }
  }
});
