import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateRecommendations} from '../beta/site/detail/analogway-layer-guide.mjs';
import {prepareGuideInput} from '../beta/site/detail/analogway-layer-guide-input.mjs';
import {deriveLedWallTiles,parseLedWallQuery} from '../beta/site/detail/analogway-led-pixels.mjs';

const pixelState=(width,height,layers=0)=>({screens:[{inputMode:'ledPixels',width,height,layers,hdLayers:0}],auxOutputs:0,inputs4k:1});

test('LED pixel boundaries map to covering 4K60 tiles without changing the evaluator',()=>{
  for(const [width,columns] of [[3840,1],[3841,2],[7680,2],[7681,3]]){
    const wall=deriveLedWallTiles(width,2160);
    assert.equal(wall.columns,columns);
    assert.equal(wall.rows,1);
    assert.equal(wall.coverWidth,columns*3840);
  }
  const prepared=prepareGuideInput(pixelState(6144,3456),calculateRecommendations);
  assert.equal(prepared.status,'calculated');
  assert.deepEqual([prepared.tile.columns,prepared.tile.rows,prepared.tile.outputs],[2,2,4]);
  assert.deepEqual([prepared.ledWall.width,prepared.ledWall.height],[6144,3456]);
  assert.match(prepared.derivedScreens[0].label,/6,144×3,456/);
  assert.equal(prepared.result.valid,true);
});

test('LED URL parser accepts exact dimensions and optional group mixing, rejects invalid values',()=>{
  assert.deepEqual(parseLedWallQuery('?ledw=6144&ledh=3456&layers=3'),{width:6144,height:3456,groupLayers:3});
  assert.deepEqual(parseLedWallQuery('?ledw=3840&ledh=2160'),{width:3840,height:2160,groupLayers:0});
  for(const query of ['?ledw=0&ledh=2160','?ledw=no&ledh=2160','?ledw=999999&ledh=2160','?ledw=3840&ledh=-2','?ledw=3840&ledh=2160&layers=9','?ledw=3840','?ledw=23040&ledh=12960']){
    assert.equal(parseLedWallQuery(query),null,query);
  }
});