import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { prepareProductDetail, isAbsentConnector, prepareIoFallbackEntries, connectorPresentation } from '../prototype/brc-am7/product-detail-model.mjs';
import { selectCardModes, selectSection03Content } from '../prototype/brc-am7/detail-enhancements.mjs';
import { renderIoFallbackCards, renderPortMapCards } from '../prototype/brc-am7/detail-enhancement-view.mjs';

const root = new URL('../', import.meta.url);
const read = async path => readFile(new URL(path, root), 'utf8');
const products = await Promise.all((await readdir(new URL('beta/site/detail/data/', root)))
  .filter(name => name.endsWith('.json')).map(async name => ({ name, raw: JSON.parse(await read(`beta/site/detail/data/${name}`)) })));

class Node {
  constructor(tag, text = '') { this.tag = tag; this.ownText = String(text); this.children = []; this.className = ''; }
  append(...children) { this.children.push(...children); }
  get textContent() { return this.ownText + this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set textContent(value) { this.ownText = String(value); this.children = []; }
}
globalThis.document = {
  createElement: tag => new Node(tag),
  createTextNode: text => new Node('#text', text)
};

test('remaining io-only products retain every present connector in the 02 fallback', () => {
  const counts = { mapIo: 0, ioOnly: 0, neither: 0 };
  for (const { raw } of products) {
    const data = prepareProductDetail(raw);
    if (data.enhancements.portMap) { counts.mapIo++; continue; }
    if (!data.io.length) { counts.neither++; continue; }
    counts.ioOnly++;
    const entries = prepareIoFallbackEntries(data.io);
    assert.deepEqual(entries.map(item => item.connector), data.io.filter(item => !isAbsentConnector(item)).map(item => item.connector), raw.model);
    const cards = renderIoFallbackCards(entries);
    assert.equal(cards.children.length, entries.length, raw.model);
    assert.equal(selectCardModes(data, data.enhancements).gallery, 'io-fallback', raw.model);
    assert.ok(data.images.length, raw.model);
    for (const [index, item] of data.io.filter(item => !isAbsentConnector(item)).entries()) {
      assert.equal(cards.children[index].children[0].children[0].textContent, String(index + 1), raw.model);
      assert.ok(cards.children[index].textContent.includes(connectorPresentation(item).displayConnector), raw.model);
      assert.ok(cards.children[index].textContent.includes(connectorPresentation(item).channelSignal), raw.model);
    }
  }
  // W-010 adds one photographed map; W-017 adds six manual Diagram maps.
  assert.deepEqual(counts, { mapIo: 62, ioOnly: 168, neither: 17 }); // W-023 uses the io-only fallback.
});

test('03 visibility follows selected content; map numbers never use io indices', () => {
  for (const { raw } of products) {
    const data = prepareProductDetail(raw);
    const content = selectSection03Content(data.enhancements);
    assert.equal(Boolean(selectCardModes(data, data.enhancements).io), Boolean(content), raw.model);
    if (data.enhancements.portMap) {
      const cards = renderPortMapCards(data.enhancements.portMap.items);
      assert.deepEqual(cards.children.map(card => Number(card.children[0].children[0].textContent)),
        [...data.enhancements.portMap.items].map(item => item.n).sort((a, b) => a - b), raw.model);
    }
  }
  const withFlow = products.filter(({ raw }) => prepareProductDetail(raw).enhancements.signalFlow);
  // W-20261004-015 adds the five BSS pilot flows without changing 02 card selection.
  assert.equal(withFlow.length, 9);
  assert.ok(withFlow.every(({ raw }) => selectSection03Content(prepareProductDetail(raw).enhancements)?.type === 'signal-flow'));
  assert.equal(selectSection03Content({}), null);
});

test('02 owns the fallback; 03 keeps only content and full io records remain in sources', async () => {
  const html = await read('prototype/brc-am7/index.html');
  const app = await read('prototype/brc-am7/app.js');
  const model = await read('prototype/brc-am7/product-detail-model.mjs');
  assert.match(html, /제품사진\(Port Map\)/);
  assert.match(html, /id="io-fallback"/);
  assert.doesNotMatch(html, /id="port-grid"|id="rear-connector-panel"/);
  assert.match(app, /\$\('#io-records'\)\.append\(\$\('#io-table-details'\)\)/);
  assert.match(app, /selectSection03Content\(enhancements\)/);
  assert.match(app, /product-detail-model\.mjs\?v=w20261004-013-spec-order/);
  assert.match(model, /detail-enhancements\.mjs\?v=w20261004-009-port-merge/);
});
