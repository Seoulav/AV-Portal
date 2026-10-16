import {beforeW20261016_017View} from './w20261016-017-history.mjs';
import assert from 'node:assert/strict';
const slugs = new Map([
  ['toggle-dock-2x1', { type:'switcher', groups:['host1','host2'] }],
  ['u-bridge-3', { type:'extender', groups:['host-power','device-power'] }]
]);
export function beforeW20261016_001Product(product, slug) {
  const expected=slugs.get(slug);
  if(!expected) return product;
  const flow=product.signalFlow;
  assert.ok(flow && flow.type===expected.type && flow.groups?.map(g=>g.id).join(',')===expected.groups.join(','),`W-001 ${slug} flow changed`);
  const copy=structuredClone(product);
  delete copy.signalFlow;
  return copy;
}
export function beforeW20261016_001Raw(raw,slug) {
  if(!slugs.has(slug)) return raw;
  return JSON.stringify(beforeW20261016_001Product(JSON.parse(raw),slug),null,2)+'\n';
}
export function beforeW20261016_001View(view) {
  view=beforeW20261016_017View(view);
  const start='\n// W-20261016-001: scoped INOGENI connection diagrams.\n';
  const end='// W-20261016-001: end INOGENI connection diagrams.\n';
  if (!view.includes(start) || !view.includes(end)) throw new Error('W-001 renderer boundary changed');
  const result=view.replace(start+view.split(start)[1].split(end)[0]+end,'');
  const branch="  if (model === 'TOGGLE DOCK 2×1' || model === 'U-BRIDGE 3') return renderInogeniSignalFlow(flow, model);\n";
  if (!result.includes(branch)) throw new Error('W-001 renderer dispatch changed');
  return result.replace(branch,'');
}
export function beforeW20261016_001Styles(css) {
  const laterStart='\n/* W-20261016-011 shared Midra 4K / Alta 4K layer analysis. */';
  const laterEnd='/* W-20261016-011 shared layer analysis end. */';
  if(css.includes(laterStart)) {
    const start=css.indexOf(laterStart), end=css.indexOf(laterEnd,start);
    if(end<0) throw new Error('W-011 renderer style boundary changed');
    css=css.slice(0,start)+css.slice(end+laterEnd.length);
  }
  const addition='\n.inogeni-flow .inogeni-control-line { fill: none; stroke: #686580; stroke-width: 2; stroke-dasharray: 7 6; }\n';
  const normalized = css.trimEnd();
  if (!normalized.endsWith(addition.trimEnd())) throw new Error('W-001 renderer style changed');
  return normalized.slice(0,-addition.trimEnd().length);
}
