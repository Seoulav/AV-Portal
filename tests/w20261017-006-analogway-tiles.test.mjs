import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateRecommendations} from '../beta/site/detail/analogway-layer-guide.mjs';
import {prepareTileGuide, TILE_REFERENCE} from '../beta/site/detail/analogway-tile-guide.mjs';
import {prepareGuideInput} from '../beta/site/detail/analogway-layer-guide-input.mjs';

const possible = result => result.models.filter(model => model.possible).map(model => model.slug);

test('tile adapter keeps a 3×2 grid as six 4K60 outputs across two supported screen groups', () => {
  const prepared = prepareTileGuide({columns: 3, rows: 2, layers: 2}, calculateRecommendations);
  assert.equal(prepared.status, 'calculated');
  assert.equal(prepared.width, 11520);
  assert.equal(prepared.height, 4320);
  assert.equal(prepared.outputs, 6);
  assert.equal(prepared.outputLinks, 12);
  assert.equal(prepared.requiredVpu, 2);
  assert.deepEqual(prepared.input.screens.map(screen => screen.outputs), [4, 2]);
  assert.deepEqual(possible(prepared.result), ['aquilon-rs2','aquilon-rs3','aquilon-rs4','aquilon-rs5','aquilon-rs6','aquilon-c','aquilon-cplus','aquilon-cmax']);
});

test('reference configurations use evaluator verdicts, including 4/6/16-panel boundaries', () => {
  assert.deepEqual(TILE_REFERENCE.map(([columns, rows]) => columns * rows), [1,2,3,4,6,8,9,12,16]);
  for (const [columns, rows] of TILE_REFERENCE) {
    for (const layers of [0,2]) {
      const prepared = prepareTileGuide({columns,rows,layers}, calculateRecommendations);
      assert.equal(prepared.status, 'calculated', `${columns}×${rows} · ${layers}`);
      assert.equal(prepared.result.pgmOutputs, columns * rows);
      assert.ok(prepared.input.screens.every(screen => screen.outputs <= 4));
    }
  }
  const four = possible(prepareTileGuide({columns:2,rows:2,layers:2},calculateRecommendations).result);
  assert.ok(four.includes('zenith-200'));
  assert.equal(four.filter(slug => slug.startsWith('aquilon-')).length, 11);
  assert.ok(possible(prepareTileGuide({columns:3,rows:1,layers:2},calculateRecommendations).result).includes('zenith-100'));
  const sixteen = possible(prepareTileGuide({columns:4,rows:4,layers:2},calculateRecommendations).result);
  assert.deepEqual(sixteen,['aquilon-rs6','aquilon-cmax']);
  assert.deepEqual(possible(prepareTileGuide({columns:3,rows:4,layers:2},calculateRecommendations).result),
    possible(prepareTileGuide({columns:4,rows:3,layers:2},calculateRecommendations).result));
});

test('invalid tile dimensions and layers never call the evaluator', () => {
  for (const request of [{columns:0,rows:2,layers:2},{columns:5,rows:5,layers:2},{columns:2.5,rows:2,layers:2},{columns:2,rows:2,layers:-1}]) {
    let calls = 0;
    const prepared = prepareTileGuide(request, () => {calls++;return {};});
    assert.equal(prepared.status,'invalid');
    assert.equal(calls,0);
  }
});

test('shared guide tile mode bypasses undocumented-resolution lookup and retains the current evaluator', () => {
  const state={screens:[{inputMode:'tiles',tileColumns:3,tileRows:2,layerType:'mixing',layers:2,hdLayers:0}],auxOutputs:0,inputs4k:1};
  const prepared=prepareGuideInput(state,calculateRecommendations);
  assert.equal(prepared.status,'calculated');
  assert.equal(prepared.tile.outputLinks,12);
  assert.deepEqual(possible(prepared.result),possible(calculateRecommendations(prepared.input)));
  assert.match(prepared.derivedScreens[0].label,/11520×4320@60/);
});
