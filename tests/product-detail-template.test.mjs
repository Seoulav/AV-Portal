import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareProductDetail } from '../prototype/brc-am7/product-detail-model.mjs';

const brc = JSON.parse(await readFile(new URL('../prototype/brc-am7/content.json', import.meta.url), 'utf8'));

test('BRC-AM7 content keeps four image roles and 8/27/14 items', () => {
  const view = prepareProductDetail(brc);
  assert.deepEqual(view.images.map(item => item.role), ['Main', 'Front', 'Rear', 'Perspective']);
  assert.equal(view.rearIndex, 2);
  assert.equal(view.quickDocuments.length, 4);
  assert.deepEqual(view.quickDocuments.map(item => item.label), ['매뉴얼', '시방서', '사양서', '기술문서']);
  assert.equal(view.quickDocuments[1].resource, null);
  assert.equal(view.quickDocuments[1].available, false);
  assert.equal(view.features.length, 8);
  assert.equal(view.specifications.length, 27);
  assert.equal(view.io.length, 14);
  assert.deepEqual(view.ioGroups.map(group => group.name), ['Video', 'Network / Control', 'Audio', 'Sync / Timecode', 'Power', 'Recording Media']);
  assert.equal(view.additionalDocuments.length, 4);
});

test('missing documents and all missing images do not create links or image items', () => {
  const view = prepareProductDetail({ manufacturer: 'Fixture', model: 'Empty', documents: [], images: [] });
  assert.equal(view.officialPage, null);
  assert.equal(view.rearIndex, -1);
  assert.equal(view.images.length, 0);
  assert.equal(view.quickDocuments.length, 4);
  assert.ok(view.quickDocuments.every(item => item.resource === null && !item.available));
});

test('partial images and arbitrary product-specific groups work', () => {
  const view = prepareProductDetail({
    manufacturer: 'Fixture', model: 'Partial',
    images: [{ role: 'Front', file: 'front.jpg' }],
    specifications: [{ group: 'DSP', name: 'Channels' }, { group: 'Audio', name: 'Input' }, { group: 'DSP', name: 'Mix' }],
    io: [{ group: 'Custom Signal', connector: 'A' }, { group: 'Audio', connector: 'B' }],
    documents: [{ type: 'User Manual', title: 'Manual', url: 'https://example.test/manual', status: 'FOUND' }]
  });
  assert.equal(view.rearIndex, -1);
  assert.deepEqual(view.specificationGroups.map(group => [group.name, group.entries.length]), [['DSP', 2], ['Audio', 1]]);
  assert.deepEqual(view.ioGroups.map(group => group.name), ['Custom Signal', 'Audio']);
  assert.equal(view.quickDocuments[0].resource.title, 'Manual');
  assert.ok(view.quickDocuments.slice(1).every(item => item.resource === null));
  assert.equal(view.quickDocuments[0].available, true);
});

test('MISSING resources never count as openable even when a URL is present', () => {
  const view = prepareProductDetail({ manufacturer: 'Fixture', model: 'Missing', documents: [
    { type: 'Official Product Page', url: 'https://example.test/product', status: 'MISSING' },
    { type: 'User Manual', url: 'https://example.test/manual', status: 'MISSING' }
  ] });
  assert.equal(view.officialPage, null);
  assert.equal(view.quickDocuments[0].available, false);
});

test('REVIEW REQUIRED documents retain their source without becoming quick-open links', () => {
  const view = prepareProductDetail({ manufacturer: 'Fixture', model: 'Review', documents: [
    { type: 'Technical Document', url: 'https://example.test/review', status: 'REVIEW REQUIRED' }
  ] });
  assert.equal(view.quickDocuments[3].resource.status, 'REVIEW REQUIRED');
  assert.equal(view.quickDocuments[3].available, false);
});
