import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {calculateRecommendations, exampleConfigurations, modelData} from '../beta/site/detail/analogway-layer-guide.mjs';

const product = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const model = (result, slug) => result.models.find(item => item.slug === slug);

test('guide model limits match the already-published layer plans and model input rows', () => {
  for (const row of modelData) {
    const source = product(row.slug);
    if (source.layerPlan) {
      const plan = source.layerPlan.models.find(item => item.slug === row.slug);
      assert.equal(row.inputs4k, plan.inputs4k, `${row.slug} input count`);
      assert.equal(row.outputConnectors, plan.outputConnectors4k, `${row.slug} output connectors`);
      assert.equal(row.pgmOutputs, plan.programOutputs4k, `${row.slug} PGM outputs`);
      assert.equal(row.processingUnits, plan.vpus, `${row.slug} VPUs`);
      assert.equal(row.mixingLayers, plan.mixingLayers4k, `${row.slug} mixing layers`);
      assert.equal(row.splitLayers, plan.splitLayers2k, `${row.slug} split layers`);
    } else {
      const plan = source.videoLayerPlan.models.find(item => item.slug === row.slug);
      assert.equal(row.pgmScreens, plan.maxPgm4kScreens, `${row.slug} PGM screens`);
      assert.equal(row.mixingLayers, plan.totalMixing4k, `${row.slug} mixing layers`);
      assert.equal(row.splitLayers, plan.totalSplit4k, `${row.slug} split layers`);
      assert.equal(row.auxOutputs, plan.maxAuxOutputs, `${row.slug} Aux outputs`);
    }
    const ioInputs4k = source.layerPlan ? source.layerPlan.models.find(item=>item.slug===row.slug).inputs4k :
      source.io.filter(item => item.direction === 'IN' && item.signal === '4K60 video in').reduce((sum,item)=>sum+Number(item.quantity),0);
    assert.equal(row.inputs4k,ioInputs4k,`${row.slug} 4K input I/O total`);
  }
});

test('2×2 4K + four mixing layers fits Aquilon and Zenith 200, but not Zenith 100 or Midra', () => {
  const result = calculateRecommendations(exampleConfigurations['2x2-mix4']);
  for (const slug of ['aquilon-rsalpha','aquilon-rs1','aquilon-rs2','aquilon-rs3','aquilon-rs4','aquilon-rs5','aquilon-rs6','zenith-200']) {
    assert.equal(model(result, slug).possible, true, slug);
  }
  for (const slug of ['zenith-100','pulse-4k','eikos-4k']) assert.equal(model(result, slug).possible, false, slug);
  assert.equal(model(result, 'zenith-100').reasons.some(reason => /자원.*4.*3/.test(reason)), true);
});

test('three single-output screens with two mixing layers each need twelve source links and two Aquilon VPUs', () => {
  const result = calculateRecommendations(exampleConfigurations['3-screens-mix2-aux2']);
  for (const slug of ['zenith-100','zenith-200','aquilon-rsalpha','aquilon-rs1']) assert.equal(model(result, slug).possible, false, slug);
  for (const slug of ['aquilon-rs2','aquilon-rs3','aquilon-rs4','aquilon-rs5','aquilon-rs6']) assert.equal(model(result, slug).possible, true, slug);
  assert.match(model(result, 'aquilon-rs1').reasons.join(' '), /VPU\) 2개가 필요/);
  assert.equal(model(result, 'zenith-100').possible, false);
  assert.equal(model(result, 'zenith-200').possible, false);
});

test('one single-output screen with four split layers and one Aux output fits Pulse and Eikos', () => {
  const result = calculateRecommendations(exampleConfigurations['1-screen-split4-aux1']);
  for (const slug of ['pulse-4k','eikos-4k']) assert.equal(model(result, slug).possible, true, slug);
  assert.equal(model(result, 'pulse-4k').mode, 'Mixer');
  assert.equal(model(result, 'eikos-4k').mode, 'Mixer');
});

test('Aquilon caps per-screen output input at four and enforces per-screen layer limits', () => {
  const tooManyOutputs = calculateRecommendations({screens:[{outputs:5,layerType:'mixing',layers:1}],auxOutputs:0,inputs4k:1});
  assert.equal(model(tooManyOutputs, 'aquilon-rs6').possible, false);
  assert.equal(tooManyOutputs.valid,false);
  const maxOutputs = calculateRecommendations({screens:[{outputs:4,layerType:'mixing',layers:1}],auxOutputs:0,inputs4k:1});
  assert.equal(maxOutputs.valid,true);
  const tooManySources = calculateRecommendations({screens:[{outputs:4,layerType:'mixing',layers:5}],auxOutputs:0,inputs4k:1});
  assert.equal(model(tooManySources, 'aquilon-rs6').possible, false);
  assert.deepEqual(model(tooManySources, 'aquilon-rs6').reasons,['화면당 4K 믹싱 최대 4개(매뉴얼 66·79쪽) 초과']);
});

test('Aquilon uses Optimized mode for a 4K60 screen spanning five or more output links without extra boundary cost', () => {
  const result=calculateRecommendations({screens:[{outputs:3,layerType:'mixing',layers:1}],auxOutputs:0,inputs4k:1});
  assert.equal(model(result,'aquilon-rsalpha').possible,true);
  assert.match(model(result,'aquilon-rsalpha').mode,/Optimized mode/);
  assert.equal(model(result,'aquilon-rsalpha').used.outputLinks,6);
  assert.equal(model(result,'aquilon-rsalpha').used.processingUnits,1);
});

test('input and Aux excess produce explicit reasons for every platform', () => {
  const tooManyInputs = calculateRecommendations({...exampleConfigurations['1-screen-split4-aux1'],inputs4k:99});
  for (const row of tooManyInputs.models) assert.equal(row.possible, false, row.slug);
  assert.match(model(tooManyInputs, 'pulse-4k').reasons.join(' '), /입력.*8/);
  const tooManyAux = calculateRecommendations({...exampleConfigurations['1-screen-split4-aux1'],auxOutputs:30});
  for (const row of tooManyAux.models) assert.equal(row.possible, false, row.slug);
  assert.match(model(tooManyAux, 'pulse-4k').reasons.join(' '), /보조.*1/);
  assert.match(model(tooManyAux, 'zenith-200').reasons.join(' '), /보조.*4/);
  assert.match(model(tooManyAux, 'aquilon-rs6').reasons.join(' '), /출력 커넥터 20개/);
});

test('model recommendation order picks the first feasible model and reports used and remaining limits', () => {
  const result = calculateRecommendations(exampleConfigurations['1-screen-split4-aux1']);
  assert.equal(result.recommendedModel, 'pulse-4k');
  assert.equal(model(result, 'pulse-4k').used.mixOrSplitLayers, 2);
  assert.equal(model(result, 'pulse-4k').remaining.mixOrSplitLayers, 0);
  assert.equal(model(result, 'pulse-4k').recommended, true);
});

test('guide includes the fifteen approved Analog Way processors and mounts on all Analog Way detail pages', () => {
  assert.equal(modelData.length,15);
  assert.equal(modelData.some(item=>item.slug==='rc400t'),false);
  assert.deepEqual(modelData.slice(11).map(item=>item.slug),['aquilon-cmini','aquilon-c','aquilon-cplus','aquilon-cmax']);
  assert.ok(modelData.slice(11).every(item=>item.connectorBasis==='BTO 최대 구성'));
  const app=readFileSync(new URL('../beta/site/detail/app.js',import.meta.url),'utf8');
  assert.match(app,/renderAnalogWayLayerGuide/);
  assert.match(app,/data\.manufacturer\s*===\s*['"]Analog Way['"]/);
  assert.match(app,/visible\.add\(['"]analogway-layer-guide['"]\)/);
  assert.match(app,/\.supplemental-cards'\)\.prepend\(guide\)/);
});
