import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

  assert.equal(detail.portMap.image, 'Main');
  assert.equal(detail.portMap.items.length, 3);
  assert.match(detail.portMap.note, /케이블 일체형 플러그/);
  assert.deepEqual(detail.portMap.items.map(item => item.label).sort(), ['HDMI OUT', 'USB-A POWER', 'USB-C IN'].sort());
});
