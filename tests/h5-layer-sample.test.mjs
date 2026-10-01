import test from 'node:test';
import assert from 'node:assert/strict';
import { scenario, CAPACITY } from '../beta/site/samples/h5-layers/model.mjs';

test('one 2K video consumes resources per touched output within a single four-output card', () => {
 assert.equal(CAPACITY,16);
 for(const [id,used] of [['one',[1,0,0,0]],['two',[1,1,0,0]],['four',[1,1,1,1]]]) {
  const p=scenario(id);assert.equal(p.visibleLayers,1);assert.equal(p.cardCount,1);
  assert.deepEqual(p.used,used);assert.equal(p.totalConsumed,used.reduce((a,b)=>a+b));
  assert.equal(p.remaining,16-p.totalConsumed);
 }
});
test('invalid mode falls back to the two-output example and results are isolated',()=>{
 assert.deepEqual(scenario('invalid'),scenario('two'));
 const p=scenario('one');p.used[0]=999;assert.deepEqual(scenario('one').used,[1,0,0,0]);
});

import { readFileSync } from 'node:fs';
test('controls cannot claim a changed result before JavaScript initializes', () => {
 const html=readFileSync(new URL('../beta/site/samples/h5-layers/index.html',import.meta.url),'utf8');
 assert.match(html, /<fieldset[^>]*class="modes"[^>]*disabled/);
});
