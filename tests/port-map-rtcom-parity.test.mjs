import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import * as view from '../prototype/brc-am7/detail-enhancement-view.mjs';

const fixture = {
  crop: { top: 100, bottom: 200 },
  measuredImage: { file: 'rear.webp', width: 2000, height: 1000 },
  items: [
    { n: 1, label: '입력', desc: '입력 설명', x1: 400, x2: 500, y: 500, side: 'top' },
    { n: 2, label: '출력', desc: '출력 설명', x1: 1400, x2: 1500, y: 600, side: 'bottom' }
  ]
};

test('SVG crop preserves the source pixel range and places both numbers outside the photo', () => {
  assert.equal(typeof view.portMapGeometry, 'function');
  const result = view.portMapGeometry(fixture, 2000, 1000);
  assert.equal(result.width, 760);
  assert.equal(result.height, 318);
  assert.equal(result.image.x, 40);
  assert.equal(result.image.y, 6);
  assert.equal(result.image.width, 680);
  assert.equal(result.image.height, 340);
  assert.equal(result.photoTop, 40);
  assert.equal(result.photoBottom, 278);
  assert.equal(result.markers[0].anchorY, 176);
  assert.equal(result.markers[0].cy, 16);
  assert.equal(result.markers[1].anchorY, 210);
  assert.equal(result.markers[1].cy, 302);
});

test('close numbers use extra gutter lanes instead of covering the image or each other', () => {
  const map = { ...fixture, items: [fixture.items[0], { ...fixture.items[0], n: 3, x1: 410, x2: 510 }] };
  const result = view.portMapGeometry(map, 2000, 1000);
  assert.equal(result.photoTop, 58);
  assert.equal(result.photoBottom, 296);
  assert.deepEqual(result.markers.map(item => item.cy).sort((a, b) => a - b), [10, 34]);
  assert.ok(result.markers.every(item => item.cy + 10 <= result.photoTop));
});

test('side panel geometry keeps RTCOM left and right bracket paths available', () => {
  const map = { items: [
    { n: 1, side: 'left', y1: 100, y2: 300, x: 0 },
    { n: 2, side: 'right', y1: 500, y2: 700, x: 2000 }
  ] };
  const result = view.portMapGeometry(map, 2000, 1000);
  assert.equal(result.markers[0].cx, 16);
  assert.equal(result.markers[1].cx, 744);
  assert.equal(result.markers[0].cy, 108);
  assert.equal(result.markers[1].cy, 244);
  const narrower = view.portMapGeometry({ ...map, displayWidth: 600 }, 2000, 1000);
  assert.equal(narrower.width, 600);
  assert.equal(narrower.image.width, 520);
});

test('all published maps retain supported crop and side placement without product data changes', async () => {
  const files = (await readdir('beta/site/detail/data')).filter(name => name.endsWith('.json'));
  const maps = [];
  const digest = createHash('sha256');
  for (const file of files) {
    const product = JSON.parse(await readFile(join('beta/site/detail/data', file)));
    if (product.portMap) {
      maps.push(product.portMap);
      digest.update(file + '\n' + JSON.stringify(product.portMap) + '\n');
    }
  }
  assert.equal(maps.length, 47);
  assert.equal(maps.filter(map => map.crop).length, 25);
  assert.equal(digest.digest('hex'), 'bb12db7c61393e570a581306bed0c3b070e8c1c9304563711bac2aa6deb19f18');
  for (const map of maps) {
    const { width, height } = map.measuredImage;
    const result = view.portMapGeometry(map, width, height);
    assert.ok(result.markers.length > 0);
    assert.ok(result.markers.every(marker => marker.side === 'top' ? marker.cy + 10 <= result.photoTop : marker.cy - 10 >= result.photoBottom));
    assert.ok(result.markers.every((marker, i) => result.markers.slice(i + 1).every(next => Math.hypot(marker.cx - next.cx, marker.cy - next.cy) >= 20)));
    assert.ok(Math.abs((result.photoTop - result.image.y) / result.scale - (map.crop?.top || 0)) < 0.001);
    assert.ok(Math.abs((result.image.y + result.image.height - result.photoBottom) / result.scale - (map.crop?.bottom || 0)) < 0.001);
  }
});

test('rendered SVG and description cards keep RTCOM marker and card dimensions', async () => {
  class Node {
    constructor(tag) { this.tag = tag; this.attrs = {}; this.children = []; this.style = {}; this.className = ''; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    append(...children) { this.children.push(...children); }
  }
  const original = globalThis.document;
  globalThis.document = {
    createElement: tag => new Node(tag), createElementNS: (_ns, tag) => new Node(tag),
    createTextNode: text => ({ textContent: text })
  };
  try {
    const svg = view.renderPortMap(fixture, { naturalWidth: 2000, naturalHeight: 1000, src: 'rear.webp', alt: '후면 SYSTEM SELECT와 IR SELECT' }, '시험');
    const descendants = node => [node, ...node.children.flatMap(child => child instanceof Node ? descendants(child) : [])];
    const nodes = descendants(svg);
    const circles = nodes.filter(node => node.tag === 'circle');
    const numbers = nodes.filter(node => node.tag === 'text');
    const lines = nodes.filter(node => node.tag === 'path');
    const description = nodes.find(node => node.tag === 'desc');
    assert.ok(description);
    assert.equal(svg.attrs['aria-describedby'], description?.attrs.id);
    assert.equal(description?.textContent, '후면 SYSTEM SELECT와 IR SELECT');
    assert.equal(circles.length, 2);
    assert.ok(circles.every(node => node.attrs.r === '10' && node.attrs.fill === 'var(--pg-accent)'));
    assert.ok(numbers.every(node => node.attrs['font-size'] === '11' && node.attrs['font-weight'] === '700' && node.attrs.fill === '#fff'));
    assert.ok(lines.every(node => node.attrs.stroke === 'var(--pg-accent)' && node.attrs['stroke-width'] === '1.5'));
    const cards = view.renderPortMapCards(fixture.items);
    assert.equal(cards.className, 'port-map-ports');
    assert.equal(cards.children.length, 2);
    assert.equal(cards.children[0].children[0].children[0].className, 'port-map-n');
  } finally { globalThis.document = original; }
  for (const dir of ['prototype/brc-am7', 'beta/site/detail']) {
    const style = await readFile(join(dir, 'styles.css'), 'utf8');
    assert.match(style, /\.port-map-n \{[^}]*width: 18px; height: 18px;[^}]*font-size: 10\.5px; font-weight: 700;/);
    assert.match(style, /\.port-map-ports \{[^}]*grid-template-columns: repeat\(4, 1fr\)/);
    assert.match(style, /max-width: 720px\)[^}]*\.port-map-ports \{ grid-template-columns: 1fr 1fr/);
  }
});

test('Port Map source and CSS contain no obsolete blue or DOM-measurement placement', async () => {
  for (const dir of ['prototype/brc-am7', 'beta/site/detail']) {
    const files = ['detail-enhancement-view.mjs', 'styles.css', 'app.js'];
    for (const file of files) assert.doesNotMatch(await readFile(join(dir, file), 'utf8'), /#2459b0/i);
    const app = await readFile(join(dir, 'app.js'), 'utf8');
    const block = app.split('function updatePortMap()')[1].split("$('.port-photo-scroll').addEventListener")[0];
    assert.doesNotMatch(block, /getBoundingClientRect|paddingTop|paddingBottom/);
  }
});
