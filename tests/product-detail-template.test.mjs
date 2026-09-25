import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareProductDetail, prepareConnectorGroups, selectKeyConnectors, selectKeySpecifications, directionLabel, connectorPresentation } from '../prototype/brc-am7/product-detail-model.mjs';

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

test('connector directions use explicit Korean text in the public table', () => {
  assert.equal(directionLabel('IN'), '입력');
  assert.equal(directionLabel('OUTPUT'), '출력');
  assert.equal(directionLabel('Bidirectional'), '양방향');
  assert.equal(directionLabel('IN/LOOP'), '입력/루프 출력');
  assert.equal(directionLabel('OPTION'), '옵션');
});

test('connector presentation separates physical port counts from channel descriptions', () => {
  assert.deepEqual(connectorPresentation({
    connector: 'XLR', signal: 'AES/EBU', direction: 'IN', quantity: '2 stereo pairs / 4ch',
    protocol: 'AES/EBU, SRC', availability: 'Fixed', condition: 'DM7 본체', verification: 'VERIFIED'
  }), {
    displayConnector: 'XLR 디지털 오디오',
    portCount: '—',
    channelSignal: '2 stereo pairs / 4ch · AES/EBU',
    specificationCondition: 'AES/EBU, SRC · 조건: DM7 본체',
    flags: ['조건 있음']
  });
  assert.deepEqual(connectorPresentation({
    connector: 'USB-C', signal: 'Audio / MIDI / DAW control', direction: 'I/O', quantity: '1',
    protocol: 'USB 2.0, 18×18', availability: 'Fixed', condition: 'Yamaha driver 조건', verification: 'VERIFIED'
  }), {
    displayConnector: 'USB-C',
    portCount: '1',
    channelSignal: 'Audio / MIDI / DAW control',
    specificationCondition: 'USB 2.0, 18×18 · 조건: Yamaha driver 조건',
    flags: ['조건 있음']
  });
});

test('connector presentation normalizes confirmed names and omits empty condition badges', () => {
  assert.deepEqual(connectorPresentation({ connector: 'XLR 3-hole', signal: 'Analog mic/line', direction: 'IN', quantity: '32', protocol: 'Balanced', availability: 'Fixed', condition: '조건 없음', verification: 'VERIFIED' }), {
    displayConnector: 'XLR 3핀 입력', portCount: '32', channelSignal: 'Analog mic/line', specificationCondition: 'Balanced', flags: []
  });
  assert.equal(connectorPresentation({ connector: 'D-sub 15-hole', direction: 'I/O', quantity: '1' }).displayConnector, 'D-sub 15핀');
  assert.equal(connectorPresentation({ connector: 'XLR 4-pin', direction: 'IN', quantity: '2' }).displayConnector, 'XLR 4핀 입력');
  assert.deepEqual(connectorPresentation({ connector: 'PY slot', quantity: '1', availability: 'Optional card', condition: '카드별 사양 분리' }).flags, ['카드 필요', '조건 있음']);
});

test('connector presentation keeps unresolved quantity markers out of channel data', () => {
  const review = connectorPresentation({ connector: 'LAN connector', quantity: 'REVIEW REQUIRED', signal: 'Network control', verification: 'PARTIAL' });
  assert.equal(review.portCount, '—');
  assert.equal(review.channelSignal, 'Network control');
  assert.deepEqual(review.flags, ['확인 필요']);
  const missing = connectorPresentation({ connector: 'MISSING', quantity: 'MISSING', signal: 'Serial / remote control', verification: 'MISSING' });
  assert.equal(missing.portCount, '—');
  assert.equal(missing.channelSignal, 'Serial / remote control');
});

test('connector presentation flags only explicit optional availability', () => {
  assert.deepEqual(connectorPresentation({ connector: 'XLR 4-pin', quantity: '2', availability: 'Fixed redundant inputs', verification: 'VERIFIED' }).flags, []);
  assert.deepEqual(connectorPresentation({ connector: 'RJ-45', quantity: '1', availability: 'Fixed, region dependent', verification: 'REVIEW REQUIRED' }).flags, ['확인 필요']);
  assert.deepEqual(connectorPresentation({ connector: 'SFP+', quantity: '1', availability: 'Optional module', verification: 'VERIFIED' }).flags, ['모듈 필요']);
  assert.deepEqual(connectorPresentation({ connector: 'DC IN', quantity: '1', availability: 'Optional supply', verification: 'VERIFIED' }).flags, ['옵션']);
});

test('missing connector notes remain evidence instead of becoming operating conditions', () => {
  const missing = connectorPresentation({ connector: 'MISSING', quantity: 'MISSING', signal: 'Serial / remote control', protocol: 'MISSING', condition: '물리 입력 단자표 미정리', verification: 'MISSING' });
  assert.equal(missing.displayConnector, '단자 미확인');
  assert.equal(missing.specificationCondition, '확인 필요');
  assert.deepEqual(missing.flags, ['확인 필요']);
});
