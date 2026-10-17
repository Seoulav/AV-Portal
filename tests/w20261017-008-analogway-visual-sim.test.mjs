import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateRecommendations} from '../beta/site/detail/analogway-layer-guide.mjs';
import {prepareTileGuide} from '../beta/site/detail/analogway-tile-guide.mjs';
import {prepareGuideInput,buildGuideExportText} from '../beta/site/detail/analogway-layer-guide-input.mjs';

const possible = tile => tile.result.models.filter(model => model.possible).map(model => model.slug);

test('6×2 and 5×1 use the existing evaluator with at most four outputs per group', () => {
  const wide = prepareTileGuide({columns:6,rows:2,layers:2},calculateRecommendations);
  assert.equal(wide.status,'calculated');
  assert.equal(wide.width,23040);
  assert.equal(wide.height,4320);
  assert.deepEqual(wide.input.screens.map(screen => screen.outputs),[4,4,4]);
  assert.deepEqual(possible(wide),['aquilon-rs4','aquilon-rs5','aquilon-rs6','aquilon-cplus','aquilon-cmax']);

  const single = prepareTileGuide({columns:5,rows:1,layers:2},calculateRecommendations);
  assert.equal(single.status,'calculated');
  assert.equal(single.width,19200);
  assert.equal(single.height,2160);
  assert.ok(single.input.screens.every(screen=>screen.outputs<=4));
  assert.ok(possible(single).includes('aquilon-rs2'));
});

test('tile selectors accept 1–6 and reject dimensions outside that range', () => {
  assert.equal(prepareTileGuide({columns:1,rows:6,layers:0},calculateRecommendations).status,'calculated');
  for(const [columns,rows] of [[0,2],[7,2],[2,7]]){
    assert.equal(prepareTileGuide({columns,rows,layers:0},calculateRecommendations).status,'invalid');
  }
});

test('one PIP window adds one wall-wide layer to the unchanged evaluator', () => {
  const eight=prepareGuideInput({screens:[{inputMode:'tiles',tileColumns:4,tileRows:2,layers:8,hdLayers:0}],auxOutputs:0,inputs4k:1},calculateRecommendations);
  const nine=prepareGuideInput({screens:[{inputMode:'tiles',tileColumns:4,tileRows:2,layers:9,hdLayers:0}],auxOutputs:0,inputs4k:1},calculateRecommendations);
  assert.deepEqual(eight.input.screens.map(screen=>screen.layers),[4,4]);
  assert.deepEqual(nine.input.screens.map(screen=>screen.layers),[5,4]);
  assert.equal(eight.result.models.find(model=>model.slug==='aquilon-rs2').possible,true);
  assert.equal(nine.result.models.find(model=>model.slug==='aquilon-rs2').possible,false);
  assert.equal(nine.result.models.find(model=>model.slug==='aquilon-rs2').used.layers,9);
  assert.match(buildGuideExportText({screens:[{inputMode:'tiles',tileColumns:4,tileRows:2,layers:9,hdLayers:0}],auxOutputs:0,inputs4k:1},nine),/벽 전체/);
});
