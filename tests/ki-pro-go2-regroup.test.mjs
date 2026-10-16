// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';
import { beforeKiprogo2Mx395Product } from './w12005-kiprogo2-mx395-history.mjs';

const product = JSON.parse(readFileSync(new URL('../beta/site/detail/data/ki-pro-go2.json', import.meta.url), 'utf8'));
const items = product.portMap.items;

test('Ki Pro GO2 uses eleven sequential markers and whole two-row blocks', () => {
  assert.equal(items.length, 11);
  assert.deepEqual(items.map(item => item.n), Array.from({length: 11}, (_, i) => i + 1));
  const hdmi = items.find(item => item.label === 'HDMI 입력 1–4');
  const sdi = items.find(item => item.label === 'SDI 출력 1–4');
  for (const item of [hdmi, sdi]) {
    assert.ok(item, 'both requested blocks must be present');
    assert.ok(['left', 'right'].includes(item.side));
    assert.ok(item.y1 < 235 && item.y2 > 370, `${item.label}: cover both connector rows`);
    assert.match(item.desc, /4개/);
  }
  assert.ok(hdmi.x > 266 && hdmi.x < 287, 'HDMI bracket sits in the gap after SDI IN');
  assert.ok(sdi.x > 497 && sdi.x < 510, 'SDI OUT bracket sits in the gap after HDMI IN');
  const dc = items.find(item => item.label === 'DC 전원 입력 1–2');
  assert.equal(dc.desc, '4핀 XLR 전원 소켓 ×2 · 외부 DC 입력');
  assert.ok(prepareEnhancements(product).portMap);
});

test('regrouping preserves all connector families and the historical inverse sees other changes', () => {
  const prior = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-kiprogo2-prior-map.json', import.meta.url), 'utf8'));
  assert.deepEqual(beforeKiprogo2Mx395Product(product, 'ki-pro-go2').portMap, prior.prior);
  const labels = items.map(item => item.label);
  for (const label of ['SDI 입력 1–4', 'HDMI 입력 1–4', 'SDI 출력 1–4',
    '아날로그 오디오 입력 L·R', 'REF LOOP 입력·출력', 'HDMI 모니터 출력',
    'SDI 모니터 출력', '아날로그 모니터 L·R', 'USB 5', 'LAN', 'DC 전원 입력 1–2']) {
    assert.ok(labels.includes(label), label);
  }
  assert.match(items.find(item => item.label === '아날로그 오디오 입력 L·R').desc, /LTC/);
  const mutated = structuredClone(product);
  mutated.io = [];
  assert.deepEqual(beforeKiprogo2Mx395Product(mutated, 'ki-pro-go2').io, []);
  mutated.portMap.items[0].label = 'WRONG';
  assert.throws(() => beforeKiprogo2Mx395Product(mutated, 'ki-pro-go2'), /unexpected/);
});

test('MX395 has its approved rebuilt photo and only its image metadata changes', () => {
  const mx = JSON.parse(readFileSync(new URL('../beta/site/detail/data/mx395.json', import.meta.url), 'utf8'));
  const prior = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-kiprogo2-prior-map.json', import.meta.url), 'utf8'));
  assert.equal(mx.images[0].resolution, '1500x1024');
  assert.equal(mx.images[0].originalSize, '2397x2397');
  const sha = createHash('sha256').update(readFileSync(new URL('../beta/site/detail/images/mx395-front.webp', import.meta.url))).digest('hex');
  assert.equal(sha, prior.mx395.approvedImageSha256);
  assert.deepEqual(beforeKiprogo2Mx395Product(mx, 'mx395').images, prior.mx395.priorImages);
  const mutated = structuredClone(mx);
  mutated.io = [];
  assert.deepEqual(beforeKiprogo2Mx395Product(mutated, 'mx395').io, []);
  mutated.images[0].sourceUrl = 'WRONG';
  assert.throws(() => beforeKiprogo2Mx395Product(mutated, 'mx395'), /unexpected/);
});
