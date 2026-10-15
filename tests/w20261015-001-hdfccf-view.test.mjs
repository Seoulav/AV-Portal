import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderCableScenarioFlow } from '../beta/site/detail/detail-enhancement-view.mjs';

class Node {
  constructor(tag, value = '') { this.tag = tag; this.value = String(value); this.children = []; this.attrs = {}; this.className = ''; this.dataset = {}; }
  append(...items) { this.children.push(...items); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  addEventListener() {}
  cloneNode() { return this; }
  get textContent() { return this.value + this.children.map(n => typeof n === 'string' ? n : n.textContent).join(''); }
  set textContent(value) { this.value = String(value); this.children = []; }
}
globalThis.document = {
  createElement: tag => new Node(tag),
  createElementNS: (_namespace, tag) => new Node(tag),
  createTextNode: text => new Node('#text', text)
};
const walk = node => [node, ...node.children.flatMap(child => typeof child === 'string' ? [] : walk(child))];
const flow = JSON.parse(readFileSync(new URL('../beta/site/detail/data/hdf-ccf.json', import.meta.url), 'utf8')).signalFlow;

test('two rows show direct and hub to HDMI with an explicit reverse PD arrow', () => {
  const host = renderCableScenarioFlow(flow, 'HDF-CCF');
  const nodes = walk(host);
  assert.equal(nodes.filter(n => n.tag === 'svg').length, 4);
  assert.match(host.textContent, /시나리오 1 · 직결/);
  assert.match(host.textContent, /시나리오 2 · 허브 연동/);
  assert.match(host.textContent, /HDMI 출력/);
  assert.match(host.textContent, /PD 역공급 DISPLAY → SOURCE/);
  assert.equal(nodes.filter(n => n.tag === 'path' && n.attrs.class === 'cable-flow-power-line').length, 4);
  assert.ok(nodes.filter(n => n.tag === 'path' && n.attrs.class === 'cable-flow-power-line')
    .every(n => n.attrs['marker-end']?.includes('arrow-left') && n.attrs.d.startsWith('M670')));
  assert.equal(nodes.filter(n => n.tag === 'details').length, 1);
  assert.equal(nodes.filter(n => n.tag === 'button').length, 2);
  assert.equal(nodes.filter(n => n.tag === 'li').length, 7);
  assert.equal(nodes.filter(n => n.tag === 'dialog').length, 1);
});

test('hub scenario shows external USB-PD supply entering the hub before charging the laptop', () => {
  const host = renderCableScenarioFlow(flow, 'HDF-CCF');
  const nodes = walk(host);
  const hubSvg = nodes.filter(n => n.tag === 'svg')[1];
  const hubNodes = walk(hubSvg);
  assert.match(hubSvg.textContent, /외부 USB-PD 전원/);
  assert.ok(hubNodes.some(n => n.tag === 'path' && n.attrs.class === 'cable-flow-hub-power-line'
    && n.attrs['marker-end']?.includes('arrow-down')));
  assert.match(host.textContent, /허브.*노트북.*충전/);
});
