// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFile as readFile} from './group6b-w16015-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { isAllowedHttpOfficialPage } from '../beta/manufacturer-hosts.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeW13005Product } from './w13005-ds8s-history.mjs';
import { beforeW13005FollowupProduct } from './w13005-ds8s-followup-history.mjs';
import { beforeW13005PhotoProduct } from './w13005-ds8s-photo-history.mjs';

const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const official = 'http://www.vsent.co.kr/bbs/board.php?bo_table=c4&wr_id=14';

test('DS-8S is one VS ENT product with only the exact official HTTP exception', async () => {
  const [catalog, product] = await Promise.all([
    read('beta/site/catalog.json'), read('beta/site/detail/data/ds-8s.json')
  ]);
  assert.equal(catalog.filter(item => item.slug === 'ds-8s').length, 1);
  assert.equal(product.model, 'DS-8S');
  assert.equal(product.manufacturer, 'VS ENT');
  assert.deepEqual(catalog.find(item => item.slug === 'ds-8s').official_links, [official]);
  assert.equal(isAllowedHttpOfficialPage(official), true);
  for (const other of [official.replace('wr_id=14', 'wr_id=15'), 'http://example.com/', 'https://www.vsent.co.kr/'])
    assert.equal(isAllowedHttpOfficialPage(other), false);
});

test('DS-8S keeps the 2200W/2500W source conflict and maps the photographed rear connectors', async () => {
  const product = await read('beta/site/detail/data/ds-8s.json');
  assert.equal(product.packageStatus, 'CONFLICTED');
  const output = product.specifications.find(row => row.name === 'AC 출력');
  assert.equal(output.verification, 'CONFLICTED');
  assert.match(output.condition, /2200W.*2500W/);
  assert.deepEqual(product.io.slice(0, 3).map(row => row.quantity), ['8', '1', '1']);
  assert.equal(product.io.find(row => row.connector === 'DC 출력').verification, 'CONFLICTED');
  assert.deepEqual(product.portMap.items.map(item => item.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(product.portMap.image, 'Rear');
  assert.equal(product.portMap.measuredImage.file, 'ds-8s-rear.webp');
  assert.equal(product.portMap.items.some(item => /비연동 AC/.test(item.label)), false);
  assert.equal(product.images.find(image => image.role === 'Diagram').verificationStatus, 'VERIFIED');
});

test('manufacturer rear photograph drives the current map while manual-version conflicts stay visible', async () => {
  const product = await read('beta/site/detail/data/ds-8s.json');
  const rear = product.images.find(image => image.role === 'Rear');
  assert.equal(rear?.file, 'ds-8s-rear.webp');
  assert.equal(rear?.originalSize, '1500×900');
  assert.equal(rear?.resolution, '1500×365');
  assert.equal(product.portMap.image, 'Rear');
  assert.deepEqual(product.portMap.measuredImage, { file: rear.file, width: 1500, height: 365 });
  assert.deepEqual(product.portMap.items.map(item => item.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(product.portMap.items.map(item => item.label).join(' '), /SERIAL.*LINK OUT.*SPRC LED.*LINK IN.*REMOTE SWITCH/);
  assert.ok(product.images.some(image => image.role === 'Diagram'));
  assert.match(product.io.find(row => row.connector === 'SERIAL 4핀 단자대')?.condition ?? '', /RJ-45.*판본/);
  const dc = product.specifications.find(row => row.name === 'DC 출력');
  assert.match(`${dc.value} ${dc.unit}`, /24.*1\.5A/);
  assert.equal(dc.verification, 'CONFLICTED');
  assert.match(dc.condition, /500mA.*800mA/);
  assert.equal(product.keyFacts.length, 4);
  assert.match(product.keyFacts.find(fact => /DC 출력/.test(fact.label))?.value ?? '', /24 V \/ 1\.5A/);
  assert.match(product.keyFacts.find(fact => /자료별 DC 전류/.test(fact.label))?.value ?? '', /500mA.*800mA.*1\.5A/);
  const guide = await readFile(new URL('beta/site/detail/ds8s-guide.mjs', root), 'utf8');
  assert.match(guide, /실물 후면 사진.*SERIAL.*LINK.*RJ-45/);
});

test('DS-8S uploads are viewable/downloadable and the twelve locked entries remain locked', async () => {
  const manifest = await read('beta/site/docs/manifest.json');
  const docs = uploadedDocumentsFor('ds-8s', manifest);
  assert.equal(docs.length, 3);
  assert.ok(docs.every(doc => doc.action.kind === 'local' && doc.action.locked === undefined));
  assert.equal(manifest.uploads.filter(item => item.locked === true).length, 12);
  for (const doc of docs) {
    const bytes = await readFile(new URL(`beta/site/${doc.action.file.replace('../', '')}`, root));
    assert.equal(bytes.subarray(0, 4).toString(), '%PDF');
  }
});

test('DS-8S historical inverse rejects an I/O regression and preserves unrelated current fields', async () => {
  const product = await read('beta/site/detail/data/ds-8s.json');
  const historical = current => beforeW13005Product(beforeW13005FollowupProduct(beforeW13005PhotoProduct(current, 'ds-8s'), 'ds-8s'), 'ds-8s');
  const restored = historical(product);
  assert.equal(restored.portMap, undefined);
  assert.equal(restored.specifications.find(row => row.name === 'DC 출력').unit, 'V / 500mA');
  const unexpected = structuredClone(product);
  unexpected.io[0].quantity = '7';
  assert.throws(() => historical(unexpected), /unexpected photo io change/);
  const unapproved = structuredClone(product);
  unapproved.model = 'INVALID';
  assert.equal(historical(unapproved).model, 'INVALID');
  const shifted = structuredClone(product);
  shifted.portMap.items[0].x1 += 1;
  assert.throws(() => historical(shifted), /unexpected photo portMap change/);
});
