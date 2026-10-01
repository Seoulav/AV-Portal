import test from 'node:test';
import assert from 'node:assert/strict';
import { scenario, CAPACITY } from '../beta/site/samples/h5-layers/model.mjs';

test('one illustration spanning two card areas spends one resource on each, not two visible layers', () => {
  assert.equal(CAPACITY, 16);
  for (const [id, used] of [['left',[1,0]], ['span',[1,1]], ['right',[0,1]]]) {
    const p = scenario(id);
    assert.equal(p.visibleLayers,1);
    assert.deepEqual(p.used,used);
    assert.deepEqual(p.remaining,used.map(n=>16-n));
    assert.equal(p.totalConsumed,used.reduce((a,b)=>a+b));
  }
});
test('unknown modes fall back to the labelled spanning example',()=>{
  assert.deepEqual(scenario('invalid'),scenario('span'));
  const p=scenario('left');p.used[0]=999;
  assert.deepEqual(scenario('left').used,[1,0]);
});

import { readFileSync } from 'node:fs';
test('controls cannot claim a changed result before JavaScript initializes', () => {
 const html=readFileSync(new URL('../beta/site/samples/h5-layers/index.html',import.meta.url),'utf8');
 assert.match(html, /<fieldset[^>]*class="modes"[^>]*disabled/);
});
