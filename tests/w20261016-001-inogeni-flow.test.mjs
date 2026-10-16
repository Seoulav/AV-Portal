// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import { beforeW20261016_002Raw } from './w20261016-002-history.mjs';
import { beforeW20261016_005Raw } from './w20261016-005-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { enhancementErrors } from '../beta/site/detail/detail-enhancements.mjs';
import { renderSignalFlow } from '../beta/site/detail/detail-enhancement-view.mjs';

class Node {
  constructor(tag, value = '') { this.tag = tag; this.value = String(value); this.children = []; this.attrs = {}; this.dataset = {}; }
  append(...items) { this.children.push(...items); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  addEventListener() {}
  cloneNode() { return this; }
  get textContent() { return this.value + this.children.map(n => typeof n === 'string' ? n : n.textContent).join(''); }
  set textContent(value) { this.value = String(value); this.children = []; }
}
globalThis.document = { createElement: tag => new Node(tag), createElementNS: (_ns, tag) => new Node(tag), createTextNode: value => new Node('#text', value) };
const walk = node => [node, ...node.children.flatMap(child => typeof child === 'string' ? [] : walk(child))];
const read = slug => JSON.parse(readFileSync(new URL('../beta/site/detail/data/' + slug + '.json', import.meta.url), 'utf8'));

test('TOGGLE DOCK shows selected Host 1 USB-C versus Host 2 USB-B plus HDMI, with separate 24V and PD paths', () => {
  const product = read('toggle-dock-2x1');
  assert.deepEqual(enhancementErrors(product), []);
  const flow = product.signalFlow;
  assert.equal(flow.type, 'switcher');
  assert.equal(flow.groups.length, 2);
  for (const index of [0,1,2,3,4,5,6,7,8]) assert.ok(JSON.stringify(flow).includes('"index":' + index));
  const view = renderSignalFlow(flow, product.model);
  assert.equal(walk(view).filter(n => n.tag === 'svg').length, 4);
  assert.match(view.textContent, /호스트 1 선택/);
  assert.match(view.textContent, /호스트 2 선택/);
  assert.match(view.textContent, /USB-B/);
  assert.match(view.textContent, /HDMI/);
  assert.match(view.textContent, /24V/);
  assert.match(view.textContent, /PD/);
  assert.match(view.textContent, /한 쪽만/);
});

test('U-BRIDGE shows both PoC supply sides and USB data over one CAT6A link', () => {
  const product = read('u-bridge-3');
  assert.deepEqual(enhancementErrors(product), []);
  const flow = product.signalFlow;
  assert.equal(flow.type, 'extender');
  assert.equal(flow.groups.length, 2);
  for (const index of [0,1,2,3,4,5,6]) assert.ok(JSON.stringify(flow).includes('"index":' + index));
  const view = renderSignalFlow(flow, product.model);
  assert.equal(walk(view).filter(n => n.tag === 'svg').length, 4);
  assert.match(view.textContent, /PC HOST 쪽 전원/);
  assert.match(view.textContent, /DEVICE 쪽 전원/);
  assert.match(view.textContent, /CAT6A/);
  assert.match(view.textContent, /100m/);
  assert.match(view.textContent, /PoC/);
  assert.match(view.textContent, /RS-232/);
});
import { createHash } from 'node:crypto';
import { beforeW20261016_001Raw } from './w20261016-001-history.mjs';

test('both new flows rewind to exact prior product bytes without changing unrelated products', () => {
  const expected = new Map([
    ['toggle-dock-2x1','c5dbff0fbf7de43a4c6650e750d9a2731379a6559d7edf63588f50462b2e317f'],
    ['u-bridge-3','1bd4dbaffe5365baece1f8ffa8f65da0c5045db224c4b091c168ba2b013b796a']
  ]);
  for (const [slug, hash] of expected) {
    const raw=readFileSync(new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url),'utf8');
    assert.equal(createHash('sha256').update(beforeW20261016_001Raw(beforeW20261016_002Raw(beforeW20261016_005Raw(raw,slug),slug),slug)).digest('hex'),hash);
  }
  assert.equal(beforeW20261016_001Raw('{"x":1}', 'hdf-ccf'),'{"x":1}');
});
