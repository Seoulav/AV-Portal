import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {calculateRecommendations,modelData} from '../beta/site/detail/analogway-layer-guide.mjs';

const resultFor=(screens,auxOutputs=0,inputs4k=4)=>calculateRecommendations({screens,auxOutputs,inputs4k});
const resultModel=(result,slug)=>result.models.find(row=>row.slug===slug);
function permutations(items){
  if(items.length<2)return [items];
  return items.flatMap((item,index)=>permutations(items.filter((_,other)=>other!==index)).map(rest=>[item,...rest]));
}

test('Aquilon exact VPU packing is independent of screen input order',()=>{
  const configurations=permutations([1,2,2,3]).map(order=>order.map(layers=>({outputs:1,layerType:'mixing',layers})));
  for(const screens of configurations){
    const result=resultFor(screens);
    assert.equal(resultModel(result,'aquilon-rs2').possible,true);
    assert.equal(resultModel(result,'aquilon-rs2').used.processingUnits,2);
    assert.equal(result.recommendedModel,'aquilon-rs2');
  }
});

test('zero-layer screens count toward PGM outputs but consume no Aquilon VPU links',()=>{
  const result=resultFor([
    {outputs:4,layerType:'mixing',layers:0},
    {outputs:4,layerType:'mixing',layers:0},
    {outputs:4,layerType:'split',layers:0},
    {outputs:1,layerType:'mixing',layers:1},
  ]);
  const rs6=resultModel(result,'aquilon-rs6');
  assert.equal(rs6.possible,true);
  assert.equal(rs6.used.pgmOutputs,13);
  assert.equal(rs6.used.processingUnits,1);
  assert.equal(rs6.used.sourceLinks,2);
  assert.equal(rs6.used.outputLinks,2);
  const overConnectors=resultFor([
    {outputs:4,layerType:'mixing',layers:0},
    {outputs:4,layerType:'mixing',layers:0},
    {outputs:4,layerType:'split',layers:0},
    {outputs:1,layerType:'mixing',layers:1},
  ],8,4);
  const overConnectorsRs6=resultModel(overConnectors,'aquilon-rs6');
  assert.equal(overConnectorsRs6.used.outputConnectors,21);
  assert.ok(overConnectorsRs6.reasons.some(reason=>reason.includes('출력 커넥터 20개')));
});

test('Aquilon split layers consume source links in pairs',()=>{
  for(const [layers,expectedLinks] of [[1,2],[2,2],[3,4],[4,4]]){
    const result=resultFor([{outputs:1,layerType:'split',layers}],0,1);
    assert.equal(resultModel(result,'aquilon-rsalpha').used.sourceLinks,expectedLinks);
  }
});

test('Aquilon mixing beyond one VPU reports only a genuinely exceeded model limit',()=>{
  const result=resultFor([{outputs:4,layerType:'mixing',layers:5}],0,4);
  const rs6=resultModel(result,'aquilon-rs6');
  assert.equal(rs6.possible,true);
  assert.deepEqual(rs6.reasons,[]);
  assert.equal(rs6.used.processingUnits,2);
});

test('Aquilon C family follows layerPlan and uses BTO maximum connector values',()=>{
  const cRows=modelData.filter(row=>row.platform==='aquilon-c');
  assert.deepEqual(cRows.map(row=>[row.slug,row.processingUnits,row.pgmOutputs,row.inputs4k,row.outputConnectors]),[
    ['aquilon-cmini',1,4,8,12],['aquilon-c',2,8,16,16],['aquilon-cplus',3,12,24,20],['aquilon-cmax',4,16,32,24],
  ]);
  assert.ok(cRows.every(row=>row.connectorBasis==='BTO 최대 구성'));
  for(const row of cRows){
    const product=JSON.parse(readFileSync(new URL('../beta/site/detail/data/'+row.slug+'.json',import.meta.url),'utf8'));
    const plan=product.layerPlan.models.find(item=>item.slug===row.slug);
    assert.equal(row.processingUnits,plan.vpus);
    assert.equal(row.pgmOutputs,plan.programOutputs4k);
    assert.equal(row.inputs4k,plan.inputs4k);
    assert.equal(row.outputConnectors,plan.outputConnectors4k);
  }
});

test('model recommendation order groups Midra, Alta, Aquilon RS then Aquilon C',()=>{
  assert.deepEqual(modelData.map(row=>row.platform),[
    'midra','midra','alta','alta','aquilon','aquilon','aquilon','aquilon','aquilon','aquilon','aquilon',
    'aquilon-c','aquilon-c','aquilon-c','aquilon-c',
  ]);
});

test('mobile result rendering separates possible models from collapsed unavailable models and uses plain language',()=>{
  const source=readFileSync(new URL('../beta/site/detail/analogway-layer-guide.mjs',import.meta.url),'utf8');
  assert.ok(source.includes(String.fromCodePoint(0xBD88,0xAC00)));
  assert.ok(source.includes(String.fromCodePoint(0xC885,0x20,0xBCF4,0xAE30)));
  assert.ok(source.includes('details'));
  assert.match(source,/추천은 시리즈·규모 순서이며 가격 비교가 아닙니다/);
  assert.doesNotMatch(source,/VPU first-fit|공유 레이어 자원/);
});


test('screen output input is capped at four and Midra uses the shared output term',()=>{
  assert.equal(resultFor([{outputs:4,layerType:'mixing',layers:0}]).valid,true);
  assert.equal(resultFor([{outputs:5,layerType:'mixing',layers:0}]).valid,false);
  const overMidraOutputs=resultFor([
    {outputs:1,layerType:'mixing',layers:1},
    {outputs:4,layerType:'mixing',layers:1},
  ]);
  assert.ok(resultModel(overMidraOutputs,'pulse-4k').reasons.some(reason=>reason.includes('4K \uD654\uBA74 \uCD9C\uB825 5')));
  const source=readFileSync(new URL('../beta/site/detail/analogway-layer-guide.mjs',import.meta.url),'utf8');
  assert.ok(source.includes(String.fromCodePoint(0xC785,0xCD9C,0xB825,0x20,0xC218,0x3A,0x20)));
});
