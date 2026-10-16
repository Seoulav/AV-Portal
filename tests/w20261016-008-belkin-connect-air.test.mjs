import { beforeW008Catalog, beforeW008Manifest, beforeW008Snapshot } from './w20261016-008-history.mjs';
﻿import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enhancementErrors } from '../prototype/brc-am7/detail-enhancements.mjs';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('Belkin Connect Air is registered in the approved conferencing presentation category', async () => {
  const catalog = await json('../beta/site/catalog.json');
  const matches = catalog.filter(item => item.brand === 'Belkin' && item.product === 'Connect Air');
  assert.equal(matches.length, 1);
  assert.deepEqual(matches[0].categories, ['화상회의', 'Conferencing', 'Wireless Presentation']);
  assert.equal(matches[0].slug, 'belkin-connect-air');
  assert.ok(matches[0].official_links.some(url => /belkin\.com\/kr\/p\/.*AVC024dqBK\.html/.test(url)));

  const detail = await json('../beta/site/detail/data/belkin-connect-air.json');
  assert.equal(detail.manufacturer, 'Belkin');
  assert.equal(detail.model, 'AVC024');
  assert.deepEqual(detail.categories, matches[0].categories);
  assert.ok(detail.specifications.some(row => /1080/.test(row.value)));
  assert.ok(detail.io.some(row => /USB-C/.test(row.connector) && row.direction === 'IN'));
  assert.ok(detail.io.some(row => /HDMI/.test(row.connector) && row.direction === 'OUT'));
  assert.ok(detail.io.some(row => /USB-A/.test(row.connector) && row.direction === 'IN'));

  const featureText = detail.features.map(row => row.text).join(' ');
  assert.doesNotMatch(featureText, /Crestron|AirMedia/i);
  assert.match(featureText, /네트워크|P2P/);
  assert.match(featureText, /40m/);

  const flow = detail.signalFlow;
  assert.ok(flow && flow.connections.length);
  for (const edge of flow.connections) assert.ok(['video', 'audio', 'power'].includes(edge.signal));
  assert.ok(flow.connections.some(edge => edge.signal === 'power'));
  const evidenced = [...flow.inputs, ...flow.outputs, ...flow.processes, ...flow.connections];
  for (const node of evidenced) {
    assert.ok(node.evidence?.length, node.id);
    for (const evidence of node.evidence.filter(ref => ref.kind === 'io')) assert.ok(detail.io[evidence.index], `${node.id}: io[${evidence.index}]`);
  }

  assert.equal(detail.portMap.image, 'Front');
  assert.equal(detail.portMap.note, undefined);
  assert.equal(detail.portMap.items.length, 3);
  assert.deepEqual(detail.portMap.items.map(item => item.label).sort(), ['HDMI OUT', 'USB-A POWER', 'USB-C IN'].sort());
  const frontMapImage = detail.images.find(image => image.role === 'Front');
  assert.ok(frontMapImage);
  assert.notEqual(frontMapImage.file, detail.images.find(image => image.role === 'Main').file);
  assert.equal(frontMapImage.note, '기기 본체 단자판이 아닌 케이블 일체형 플러그 표시');
  assert.doesNotMatch(frontMapImage.alt, /\?{2,}|\uFFFD/);
  assert.equal(detail.imageStatuses.find(image => image.role === 'Front').status, 'FOUND');
  assert.deepEqual(enhancementErrors(detail), []);
  assert.ok(enhancementErrors({ ...detail, portMap: { ...detail.portMap, image: 'Main' } }).includes('Invalid optional detail field: portMap'));
});

test('W-008 historical inverse removes only the Belkin catalog, mirror, and snapshot addition', async () => {
  const catalog = await json('../beta/site/catalog.json');
  const priorCatalog = beforeW008Catalog(catalog);
  assert.equal(catalog.length, priorCatalog.length + 1);
  assert.ok(catalog.some(item => item.slug === 'belkin-connect-air'));
  assert.deepEqual(catalog.filter(item => item.slug !== 'belkin-connect-air'), priorCatalog);

  const manifest = await json('../beta/site/docs/manifest.json');
  const priorManifest = beforeW008Manifest(manifest);
  assert.equal(manifest.mirrors.length, priorManifest.mirrors.length + 1);
  assert.deepEqual(manifest.uploads, priorManifest.uploads);
  assert.deepEqual(manifest.mirrors.filter(item => item.file !== 'belkin-connect-air-specification-2650a8f7c667.pdf'), priorManifest.mirrors);

  const snapshot = await json('../beta/public-snapshot.json');
  const priorSnapshot = beforeW008Snapshot(snapshot);
  assert.equal(snapshot.catalog.count, priorSnapshot.catalog.count + 1);
  assert.equal(Object.keys(snapshot.details).length, Object.keys(priorSnapshot.details).length + 1);
  assert.equal(Object.hasOwn(priorSnapshot.details, 'belkin-connect-air'), false);
});
