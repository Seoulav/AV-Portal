import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareProductDetail, prepareConnectorGroups, selectKeyConnectors, selectKeySpecifications } from '../prototype/brc-am7/product-detail-model.mjs';

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

test('connector groups collapse mixed labels without losing entries or direction text', () => {
  const input = [
    { name: 'Audio', entries: [{ connector: 'XLR', direction: 'INPUT', quantity: '2' }] },
    { name: 'Network / Audio', entries: [{ connector: 'etherCON', direction: 'I/O', quantity: '2' }] },
    { name: 'Control', entries: [{ connector: 'D-sub', direction: 'OUT', quantity: '1' }] },
    { name: 'USB / Audio', entries: [{ connector: 'USB Type-C', direction: 'Bidirectional', quantity: '1' }] },
    { name: 'USB', entries: [{ connector: 'USB Type-A', direction: 'IN', quantity: '2' }] }
  ];

  const groups = prepareConnectorGroups(input);

  assert.deepEqual(groups.map(group => [group.key, group.label, group.entries.length]), [
    ['audio', '오디오', 1],
    ['network-control', '네트워크·제어', 2],
    ['usb', 'USB', 2]
  ]);
  assert.deepEqual(groups.flatMap(group => group.entries).map(item => item.displayDirection), ['IN', 'I/O', 'OUT', 'I/O', 'IN']);
  assert.equal(groups.flatMap(group => group.entries).length, 5);
});

test('key connector selection favors the primary group and still covers following groups', () => {
  const groups = prepareConnectorGroups([
    { name: 'Audio', entries: [
      { connector: 'XLR IN', direction: 'IN' },
      { connector: 'XLR OUT', direction: 'OUT' },
      { connector: 'AES', direction: 'I/O' }
    ] },
    { name: 'Network / Control', entries: [{ connector: 'etherCON', direction: 'I/O' }] },
    { name: 'USB', entries: [{ connector: 'USB-C', direction: 'I/O' }] },
    { name: 'Sync', entries: [{ connector: 'BNC', direction: 'IN' }] },
    { name: 'Expansion', entries: [{ connector: 'PY slot', direction: 'I/O' }] },
    { name: 'Power', entries: [{ connector: 'V-Lock', direction: 'IN' }] }
  ]);

  assert.deepEqual(selectKeyConnectors(groups, 6).map(item => item.connector), [
    'XLR IN', 'XLR OUT', 'etherCON', 'USB-C', 'BNC', 'PY slot'
  ]);
});

test('key connector selection excludes missing placeholders but full groups retain them', () => {
  const groups = prepareConnectorGroups([
    { name: 'Video', entries: [{ connector: 'MISSING', verification: 'MISSING' }] },
    { name: 'Network / Control', entries: [{ connector: 'LAN connector', verification: 'PARTIAL' }] },
    { name: 'Power', entries: [{ connector: 'MISSING', verification: 'MISSING' }] }
  ]);

  assert.deepEqual(selectKeyConnectors(groups).map(item => item.connector), ['LAN connector']);
  assert.equal(groups.flatMap(group => group.entries).length, 3);
});

test('key specification selection limits verified values while preserving group order', () => {
  const groups = [
    { name: 'Audio', entries: [
      { name: 'Inputs', verification: 'VERIFIED' },
      { name: 'Mix buses', verification: 'VERIFIED' },
      { name: 'Hidden third', verification: 'VERIFIED' }
    ] },
    { name: 'Network', entries: [
      { name: 'Dante', verification: 'VERIFIED' },
      { name: 'Review value', verification: 'REVIEW REQUIRED' }
    ] },
    { name: 'Power', entries: [{ name: 'AC', verification: 'VERIFIED' }] }
  ];

  assert.deepEqual(selectKeySpecifications(groups, 4).map(item => item.name), ['Inputs', 'Mix buses', 'Dante', 'AC']);
  assert.equal(groups.flatMap(group => group.entries).length, 6);
});
