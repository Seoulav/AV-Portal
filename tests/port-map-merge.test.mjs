import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { prepareProductDetail, isAbsentConnector, prepareIoFallbackEntries, connectorPresentation } from '../prototype/brc-am7/product-detail-model.mjs';
import { selectCardModes, selectSection03Content } from '../prototype/brc-am7/detail-enhancements.mjs';
import { renderIoFallbackCards, renderPortMapCards } from '../prototype/brc-am7/detail-enhancement-view.mjs';
import { beforeW032Product } from './w032-history.mjs';
import { beforeW12004Product } from './w12004-history.mjs';
import { beforeW20261015_001Product } from './w20261015-001-history.mjs';
import { beforeW20261015_003Product } from './w20261015-003-history.mjs';
import { isW1010Name } from './w1010-history.mjs';
import { isW1012Name } from './w1012-history.mjs';
import { isW004Name } from './w004-history.mjs';

const root = new URL('../', import.meta.url);
const read = async path => readFile(new URL(path, root), 'utf8');
const products = await Promise.all((await readdir(new URL('beta/site/detail/data/', root)))
  .filter(name => name.endsWith('.json') && !isW1010Name(name) && !isW1012Name(name)).map(async name => ({ name, raw: JSON.parse(await read(`beta/site/detail/data/${name}`)) })));

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
    if (!data.images.length) assert.ok(['LH65BEHHLBFXKR', '4CH Model A / Model N'].includes(raw.model), 'only explicitly reviewed photo gaps may show I/O without a photograph');
    for (const [index, item] of data.io.filter(item => !isAbsentConnector(item)).entries()) {
      assert.equal(cards.children[index].children[0].children[0].textContent, String(index + 1), raw.model);
      assert.ok(cards.children[index].textContent.includes(connectorPresentation(item).displayConnector), raw.model);
      assert.ok(cards.children[index].textContent.includes(connectorPresentation(item).channelSignal), raw.model);
    }
  }
  // W-006 adds eight TVs with I/O and no map; one has no verified photograph.
  // W-008 moves three NX processors from the I/O fallback to mapped photos.
  // W-20261006-005 moves ten more visible rear panels; the two covered Shure
  // panels stay in the fallback, so the total remains 265.
  // W-20261012-006 moves 15 Epson and seven Panasonic projectors into maps.
  // W-009 maps three existing AVer products, moving them from fallback to map.
  // W-20261013-001 maps all 18 existing Powersoft amplifiers; no product is added.
  // W-20261013-007 maps two video walls and six U800F hotel TVs; totals stay fixed.
  // W-20261013-007 adds rear maps for two WMFX panels; the products are unchanged.
  // W-20261014-005 adds Carbonite Ultra with a rear Port Map and documented I/O.
  // W-009 adds four products with I/O and no rear maps; all remain in the fallback.
  // W-20261014-001 moves five evidenced Logitech products to maps; the Mic
  // Pod extension cable retains its I/O fallback pending connector evidence.
  // W-20261014-003 adds rear maps to three existing X100 Pro products.
  // W-20261014-008 adds two INOGENI products with official Diagram maps.
  // W-20261014-007 adds HDF-CCF with two I/O rows and a verified Main photo, but no rear Port Map.
  // W-20261015-006 maps eleven existing Analog Way products; all eleven leave the I/O fallback.
  // W-20261015-011 maps the visible rear RJ-45 on the existing Varia-SL50 and SL80.
  // W-20261015-008 maps three existing Sony products with official rear photos.
  assert.deepEqual(counts, { mapIo: 170, ioOnly: 84, neither: 21 });
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
  assert.equal(products.filter(({ name, raw }) => prepareProductDetail(beforeW032Product(beforeW20261015_001Product(beforeW20261015_003Product(raw, name.slice(0, -5)), name.slice(0, -5)), name.slice(0, -5))).enhancements.signalFlow).length, 9);
  const beforeW004 = products.filter(({ name, raw }) => prepareProductDetail(beforeW12004Product(beforeW20261015_001Product(beforeW20261015_003Product(raw, name.slice(0, -5)), name.slice(0, -5)), name.slice(0, -5))).enhancements.signalFlow);
  assert.equal(beforeW004.length, 11);
  // W-20261015-001 adds one HDF-CCF flow after the three prior Signal Flow additions.
  assert.equal(withFlow.length, beforeW004.length + 4);
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
  assert.match(app, /product-detail-model\.mjs\?v=w20261012-008-amp-table/);
  assert.match(model, /detail-enhancements\.mjs\?v=w20261012-015-rtcom-parity/);
});
