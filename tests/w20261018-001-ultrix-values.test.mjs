import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { prepareProductDetail } from '../beta/site/detail/product-detail-model.mjs';

import { beforeW20261018_001Product, w20261018_001Fixture } from './w20261018-001-history.mjs';

const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const findSpec = (product, name) => product.specifications.find(row => row.name === name);

test('W-20261018-001 adopts the Korean Ultrix brochure values without conflict badges', () => {
  const fr2 = read('ultrix-ns-fr2');
  const gatebox = findSpec(fr2, '최대 UHD 게이트박스 수');
  const synchronizers = findSpec(fr2, '최대 UHD 입력 프레임 동기화 수');
  assert.equal(gatebox.value, '15입력/15출력');
  assert.equal(gatebox.condition, '');
  assert.equal(gatebox.source, 'B');
  assert.equal(gatebox.verification, 'FOUND');
  assert.equal(synchronizers.value, '51');
  assert.equal(synchronizers.condition, '');
  assert.equal(synchronizers.source, 'B');
  assert.equal(synchronizers.verification, 'FOUND');
  assert.match(fr2.overview, /UHD 게이트박스\(최대 15입력\/15출력\)/);
  assert.doesNotMatch(fr2.overview, /UHD 게이트박스\(최대 12입력\/12출력\)/);
  assert.equal(fr2.sources.find(source => source.code === 'B').name, '사용자 제공 Ultrix 한국어 브로슈어 + 사용자 확정 2026-10-18');
  const fr2View = prepareProductDetail(fr2);
  assert.equal(fr2View.specifications.find(row => row.name === '최대 UHD 게이트박스 수').value, '15입력/15출력');
  assert.equal(fr2View.specifications.find(row => row.name === '최대 UHD 입력 프레임 동기화 수').value, '51');

  const hdx = read('ultrix-hdx-io');
  const auxC = findSpec(hdx, 'AUX C 포트 기능');
  const auxD = findSpec(hdx, 'AUX D 포트 기능');
  for (const row of [auxC, auxD]) {
    assert.equal(row.value, 'Ultristream MV 출력 또는 Dante I/O');
    assert.equal(row.condition, '');
    assert.equal(row.source, 'B');
    assert.equal(row.verification, 'FOUND');
  }
  assert.equal(hdx.sources.find(source => source.code === 'B').name, '사용자 제공 Ultrix 한국어 브로슈어 + 사용자 확정 2026-10-18');
  const hdxView = prepareProductDetail(hdx);
  assert.equal(hdxView.specifications.find(row => row.name === 'AUX C 포트 기능').value, 'Ultristream MV 출력 또는 Dante I/O');
  assert.equal(hdxView.specifications.find(row => row.name === 'AUX D 포트 기능').value, 'Ultristream MV 출력 또는 Dante I/O');
  assert.ok(![...fr2.specifications, ...hdx.specifications].some(row => row.verification === 'CONFLICTED' && /게이트박스|프레임 동기화|AUX C|AUX D/.test(row.name)));

  assert.deepEqual(beforeW20261018_001Product(fr2, 'ultrix-ns-fr2'), w20261018_001Fixture['ultrix-ns-fr2']);
  assert.deepEqual(beforeW20261018_001Product(hdx, 'ultrix-hdx-io'), w20261018_001Fixture['ultrix-hdx-io']);
});
