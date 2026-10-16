import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portMapGeometry } from '../prototype/brc-am7/detail-enhancement-view.mjs';

test('Aquilon repeated card columns share one card-type edge bracket and keep labels visible', () => {
  for (const slug of ['aquilon-rs1', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6']) {
    const product = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url)));
    const map = product.portMap;
    const { width, height } = map.measuredImage;
    const { markers } = portMapGeometry(map, width, height);
    const cards = markers.filter(marker => /입력 카드|출력 카드/.test(marker.item.label));
    const labels = [...new Set(cards.map(marker => marker.item.label))];
    assert.equal(cards.length, labels.length, `${slug}: each card type should have one grouped bracket`);
    assert.ok(cards.every(marker => ['left', 'right'].includes(marker.side)), slug);
    assert.ok(cards.every(marker => /카드 \d+장/.test(marker.item.desc)), slug);
    for (let i = 0; i < cards.length; i++) for (const other of cards.slice(i + 1))
      assert.ok(Math.hypot(cards[i].cx - other.cx, cards[i].cy - other.cy) >= 20, `${slug}: card marker circles overlap`);
  }
});
