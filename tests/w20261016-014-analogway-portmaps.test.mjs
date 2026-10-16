import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { prepareEnhancements, enhancementErrors } from '../beta/site/detail/detail-enhancements.mjs';
import { renderPortMapCards as renderBeta } from '../beta/site/detail/detail-enhancement-view.mjs';
import { renderPortMapCards as renderPrototype } from '../prototype/brc-am7/detail-enhancement-view.mjs';

class MockNode {
  constructor(tag, text = '') { this.tag = tag; this.className = ''; this.children = []; this._text = text; }
  append(...nodes) { this.children.push(...nodes); }
  set textContent(value) { this.children = []; this._text = String(value); }
  get textContent() { return this._text + this.children.map(node => node.textContent).join(''); }
}
const mockDocument = {
  createElement: tag => new MockNode(tag),
  createTextNode: text => new MockNode('#text', String(text))
};
function withDocument(callback) {
  const prior = globalThis.document;
  globalThis.document = mockDocument;
  try { return callback(); } finally {
    if (prior === undefined) delete globalThis.document;
    else globalThis.document = prior;
  }
}
function tree(node) {
  if (node.tag === '#text') return { text: node.textContent };
  const children = [...node.children.map(tree)];
  if (node._text) children.unshift({ text: node._text });
  return { tag: node.tag, className: node.className, children };
}
function oldUniqueListTree(items) {
  return {
    tag: 'div', className: 'port-map-ports',
    children: [...items].sort((a, b) => a.n - b.n).map(item => ({
      tag: 'div', className: 'port-map-port', children: [
        { tag: 'b', className: '', children: [
          { tag: 'span', className: 'port-map-n', children: [{ text: String(item.n) }] },
          { text: item.label }
        ] },
        { text: item.desc }
      ]
    }))
  };
}
function groupedListTree(items) {
  const groups = new Map();
  for (const item of [...items].sort((a, b) => a.n - b.n)) {
    const group = groups.get(item.n) ?? [];
    group.push(item);
    groups.set(item.n, group);
  }
  return {
    tag: 'div', className: 'port-map-ports',
    children: [...groups].map(([number, group]) => {
      const item = group[0];
      return {
        tag: 'div', className: 'port-map-port', children: [
          { tag: 'b', className: '', children: [
            { tag: 'span', className: group.length > 1 ? 'port-map-n port-map-n-many' : 'port-map-n', children: [{ text: group.length > 1 ? `${number} ×${group.length}` : String(number) }] },
            { text: item.label }
          ] },
          { text: item.desc }
        ]
      };
    })
  };
}
const mapProduct = items => ({
  manufacturer: 'Analog Way',
  images: [{ role: 'Rear', file: 'rear.webp', originalSize: '400x200', resolution: '400x200' }],
  portMap: { image: 'Rear', items }
});
const pairedCards = [
  { n: 1, label: 'HDMI 입력 카드', desc: 'HDMI IN 1–4 · 장착 카드 구성 예시', x1: 20, x2: 100, y: 40, side: 'top' },
  { n: 1, label: 'HDMI 입력 카드', desc: 'HDMI IN 1–4 · 장착 카드 구성 예시', x1: 120, x2: 200, y: 40, side: 'top' }
];

test('same Port Map number is accepted only when label and description are identical', () => {
  const valid = mapProduct(pairedCards);
  assert.deepEqual(enhancementErrors(valid), []);
  assert.ok(prepareEnhancements(valid).portMap);
  for (const patch of [{ label: 'DisplayPort 입력 카드' }, { desc: '다른 카드 구성' }]) {
    const invalid = mapProduct([pairedCards[0], { ...pairedCards[1], ...patch }]);
    assert.ok(enhancementErrors(invalid).length);
    assert.equal(prepareEnhancements(invalid).portMap, null);
  }
});

test('Port Map list collapses repeated numbers into one row with a quantity badge', () => {
  withDocument(() => {
    for (const render of [renderBeta, renderPrototype]) {
      const list = render(pairedCards);
      assert.equal(list.children.length, 1);
      assert.match(list.textContent, /×2/);
      assert.match(list.textContent, /HDMI 입력 카드/);
      assert.match(list.textContent, /HDMI IN 1–4 · 장착 카드 구성 예시/);
    }
    assert.deepEqual(tree(renderBeta(pairedCards)), tree(renderPrototype(pairedCards)));
  });
});

test('the 11 Analog Way maps use shared card numbers and short photo leaders', () => {
  const root = new URL('../beta/site/detail/data/', import.meta.url);
  const ids = ['aquilon-rsalpha', 'aquilon-rs1', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6', 'pulse-4k', 'eikos-4k', 'zenith-100', 'zenith-200'];
  for (const id of ids) {
    const product = JSON.parse(readFileSync(new URL(`${id}.json`, root), 'utf8'));
    assert.deepEqual(enhancementErrors(product), [], id);
    const map = product.portMap, width = map.measuredImage.width;
    const groups = new Map();
    for (const item of map.items) {
      const group = groups.get(item.n) ?? [];
      group.push(item);
      groups.set(item.n, group);
      assert.ok(item.x2 - item.x1 <= width / 4, `${id} #${item.n}: horizontal bracket exceeds 1/4 photo width`);
      if (item.via) {
        const anchorX = (item.x1 + item.x2) / 2;
        assert.ok(Math.abs(item.via[0][0] - anchorX) <= 0.5, `${id} #${item.n}: route starts at bracket center`);
        assert.equal(item.via[0][1], item.via[1][1], `${id} #${item.n}: route's second segment is horizontal`);
      }
    }
    for (const [number, group] of groups) {
      assert.ok(group.every(item => item.label === group[0].label && item.desc === group[0].desc), `${id} #${number}: repeated number text differs`);
    }
    const horizontal = map.items.filter(item => item.y !== undefined);
    for (let i = 0; i < horizontal.length; i++) for (let j = i + 1; j < horizontal.length; j++) {
      const a = horizontal[i], b = horizontal[j];
      if (Math.abs(a.y - b.y) >= 6) continue;
      const gap = Math.max(0, Math.max(a.x1, b.x1) - Math.min(a.x2, b.x2));
      assert.ok(gap >= 6, `${id} #${a.n}/#${b.n}: nearby horizontal brackets have ${gap}px gap`);
    }
  }
});

test('other products keep their previous unique-number Port Map list structure', () => {
  const root = new URL('../beta/site/detail/data/', import.meta.url);
  const targets = new Set(['aquilon-rsalpha', 'aquilon-rs1', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6', 'pulse-4k', 'eikos-4k', 'zenith-100', 'zenith-200']);
  const files = readdirSync(root).filter(file => file.endsWith('.json'));
  withDocument(() => {
    for (const file of files) {
      const product = JSON.parse(readFileSync(new URL(file, root), 'utf8'));
      const items = product.portMap?.items;
      if (!items?.length) continue;
      const rendered = tree(renderBeta(items));
      if (!targets.has(file.slice(0, -5))) {
        assert.equal(new Set(items.map(item => item.n)).size, items.length, `${product.manufacturer} ${product.model}: unrelated duplicate number`);
        assert.deepEqual(rendered, oldUniqueListTree(items), `${product.manufacturer} ${product.model}`);
      } else {
        assert.deepEqual(rendered, groupedListTree(items), `${product.manufacturer} ${product.model}`);
      }
    }
  });
});
