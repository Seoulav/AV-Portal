// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createHash } from 'node:crypto';
import { beforeW14009CarboniteProduct, beforeW14009CarboniteRaw } from './w14009-carbonite-history.mjs';

const product = JSON.parse(readFileSync(new URL('../beta/site/detail/data/carbonite-ultra.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const byLabel = new Map(product.portMap.items.map(item => [item.label, item.desc]));

test('W-009 changes only the sixteen Port Map descriptions', () => {
  assert.equal(product.portMap.items.length, 16);
  assert.equal(sha(Object.fromEntries(Object.entries(product).filter(([key]) => key !== 'portMap'))),
    '5a66cb3c381754580cb950cf5e552f3ca4c78925f27ad61db669be398211bea5');
  assert.equal(sha({ ...product.portMap, items: product.portMap.items.map(({ desc, ...rest }) => rest) }),
    '81b35aafdb3f0db804730b5e46779efe190bb745fbf2524970eaabf9c8f0e989');
  assert.equal(product.portMap.items.map(item => item.n).join(','), '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16');
});

test('Port Map descriptions explain confirmed use and keep uncertainty visible', () => {
  assert.match(byLabel.get('PS1'), /본체.*전원/);
  assert.match(byLabel.get('EDITOR'), /편집기.*RS-422/);
  assert.match(byLabel.get('LAN'), /DashBoard.*Ethernet/);
  assert.match(byLabel.get('TALLY'), /tally.*24/i);
  assert.match(byLabel.get('GPIO'), /GPI\/O.*24/);
  assert.match(byLabel.get('LTC'), /타임코드.*LiveEDL/);
  assert.match(byLabel.get('AES 1'), /오디오.*AES.*스테레오/);
  assert.match(byLabel.get('AES 2'), /오디오.*AES.*스테레오/);
  assert.match(byLabel.get('MV OUTPUT IO-1–IO-2 · 1–2'), /멀티뷰어.*상충/);
  assert.match(byLabel.get('OUTPUT 3–12'), /영상.*상충/);
  assert.match(byLabel.get('INPUT 1–24'), /영상.*UHD.*18/);
  assert.match(byLabel.get('UPGD'), /용도 미확인.*UPGD/);
  assert.match(byLabel.get('SD'), /용도 미확인.*SD/);
  assert.ok(product.portMap.items.every(item => !/[.!?。]$/.test(item.desc)));
  assert.ok(product.specifications.some(row => row.verification === 'CONFLICTED'));
});

test('selective historical inverse retains every other current field and rejects unapproved wording', () => {
  const raw = readFileSync(new URL('../beta/site/detail/data/carbonite-ultra.json', import.meta.url), 'utf8');
  const restored = beforeW14009CarboniteRaw(raw, 'carbonite-ultra');
  assert.equal(createHash('sha256').update(restored).digest('hex'),
    'cf0f589ac99422eca3ed4ac7daf89b9683ddce108aa3be2b666f64663c48c20b');
  const mutated = structuredClone(product);
  mutated.io[0].quantity = 'INVALID';
  assert.equal(beforeW14009CarboniteProduct(mutated, 'carbonite-ultra').io[0].quantity, 'INVALID');
  mutated.portMap.items[0].desc = '승인되지 않은 설명';
  assert.throws(() => beforeW14009CarboniteProduct(mutated, 'carbonite-ultra'), /unexpected W-009/);
});
