import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateRecommendations} from '../beta/site/detail/analogway-layer-guide.mjs';
import {calculateTileLayerMaximums,formatTileLayerMaximum,prepareTileGuide} from '../beta/site/detail/analogway-tile-guide.mjs';
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

test('card maximum uses wall-wide windows and distinguishes a proven limit from the input ceiling', () => {
  for(const [columns,rows,slug,expected] of [
    [6,2,'aquilon-rs6',16],
    [3,5,'aquilon-cmax',16],
  ]){
    const tile=prepareTileGuide({columns,rows,layers:0,wallLayers:true},calculateRecommendations);
    const maximum=calculateTileLayerMaximums(tile,calculateRecommendations).get(slug);
    assert.equal(maximum?.mixing,expected,slug);
    assert.equal(maximum.atInputCeiling,false,slug);
    assert.match(formatTileLayerMaximum(maximum),/최대 16개/);
    assert.equal(maximum.splitConvertedBeyondEvaluator,true,slug);
    assert.equal(prepareTileGuide({columns,rows,layers:expected+1,wallLayers:true},calculateRecommendations)
      .result.models.find(model=>model.slug===slug).possible,false,slug);
  }
  const ceilingTile=prepareTileGuide({columns:2,rows:2,layers:0,wallLayers:true},calculateRecommendations);
  const ceiling=calculateTileLayerMaximums(ceilingTile,calculateRecommendations).get('aquilon-rs4');
  assert.equal(ceiling?.mixing,8);
  assert.equal(ceiling.atInputCeiling,true);
  assert.match(formatTileLayerMaximum(ceiling),/8개까지 확인/);
  const splitTile=prepareTileGuide({columns:3,rows:5,layers:0,wallLayers:true},calculateRecommendations);
  const splitMaximum=calculateTileLayerMaximums(splitTile,calculateRecommendations).get('aquilon-cmax');
  assert.equal(splitMaximum.splitDirectEvaluation,'not-possible');
  assert.match(formatTileLayerMaximum(splitMaximum),/분할 32개 환산\(동일 창 배분 직접 평가 불가\)/);
  const directSplit=prepareTileGuide({columns:3,rows:5,layers:splitMaximum.split,wallLayers:true},calculateRecommendations);
  const splitVerdict=calculateRecommendations({...directSplit.input,
    screens:directSplit.input.screens.map(screen=>({...screen,layerType:'split'}))});
  assert.equal(splitVerdict.models.find(model=>model.slug==='aquilon-cmax').possible,false);
});

test('nine output groups and invalid wall-window counts have precise reasons', () => {
  for(const [tileColumns,tileRows] of [[5,5],[5,6],[6,5],[6,6]]){
    const state={screens:[{inputMode:'tiles',tileColumns,tileRows,layers:0,hdLayers:0}],auxOutputs:0,inputs4k:1};
    const nine=prepareGuideInput(state,calculateRecommendations);
    assert.equal(nine.status,'unconfirmed');
    assert.match(nine.reason,/출력 그룹 9개가 평가 가능한 화면 수 한도 8개를 넘습니다/);
    assert.match(buildGuideExportText(state,nine),/출력 그룹 9개/);
  }
  const overflow=prepareTileGuide({columns:6,rows:2,layers:25,wallLayers:true},calculateRecommendations);
  assert.equal(overflow.status,'invalid');
  assert.match(overflow.reason,/벽 전체 PIP 창 수는 0~24개/);
});

test('wall card maximum evaluates every wall-wide count, including uneven group allocation', () => {
  const tile=prepareTileGuide({columns:6,rows:2,layers:0,wallLayers:true},calculateRecommendations);
  const calls=[];
  calculateTileLayerMaximums(tile,input=>{
    calls.push(input.screens.map(screen=>({type:screen.layerType,layers:screen.layers})));
    return calculateRecommendations(input);
  });
  const mixingCalls=calls.filter(screens=>screens.every(screen=>screen.type==='mixing'));
  assert.deepEqual(mixingCalls.slice(0,25).map(screens=>screens.reduce((sum,screen)=>sum+screen.layers,0)),
    Array.from({length:25},(_,index)=>index));
  assert.deepEqual(mixingCalls[16].map(screen=>screen.layers),[6,5,5]);
});
