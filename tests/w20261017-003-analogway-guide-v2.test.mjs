import assert from 'node:assert/strict';
import test from 'node:test';
import {deriveScreenFormat, prepareGuideInput, buildGuideExportText} from '../prototype/brc-am7/analogway-layer-guide-input.mjs';
import {calculateRecommendations} from '../prototype/brc-am7/analogway-layer-guide.mjs';

const screen = (width, height, refresh = 60, layers = 2, hdLayers = 0) => ({
  inputMode: 'resolution', width, height, refresh, layerType: 'mixing', layers, hdLayers,
});
const request = screens => ({screens, auxOutputs: 0, inputs4k: 2});

test('documented output formats derive exact tiled outputs and capacities', () => {
  assert.deepEqual(deriveScreenFormat(3840, 2160, 60), {confirmed: true, outputs: 1, capacity: 2, layout: '1', label: '3840×2160@60 · 4K60 출력 1개'});
  assert.deepEqual(deriveScreenFormat(7680, 2160, 60), {confirmed: true, outputs: 2, capacity: 2, layout: '2x1', label: '7680×2160@60 · 4K60 출력 2개'});
  assert.deepEqual(deriveScreenFormat(5760, 1080, 60), {confirmed: true, outputs: 3, capacity: 1, layout: '3', label: '5760×1080@60 · 1080p60 출력 3개'});
  assert.deepEqual(deriveScreenFormat(7680, 1080, 60), {confirmed: true, outputs: 4, capacity: 1, layout: '4', label: '7680×1080@60 · 1080p60 출력 4개'});
  assert.deepEqual(deriveScreenFormat(7680, 4320, 60), {confirmed: true, outputs: 4, capacity: 2, layout: '2x2', label: '7680×4320@60 · 4K60 출력 4개'});
  assert.deepEqual(deriveScreenFormat(2560, 1600, 60), {confirmed: true, outputs: 1, capacity: 1, layout: '1', label: '2560×1600@60 · 출력 1개'});
  assert.deepEqual(deriveScreenFormat(5120, 2880, 60), {confirmed: true, outputs: 1, capacity: 4, layout: '1', label: '5120×2880@60 · 단일 용량 4 출력'});
  assert.deepEqual(deriveScreenFormat(7680, 4320, 30), {confirmed: true, outputs: 1, capacity: 4, layout: '1', label: '7680×4320@30 · 단일 용량 4 출력'});
  assert.equal(deriveScreenFormat(5000, 2000, 60).confirmed, false);
});

test('negative and fractional HD layer counts cannot enter calculations or copied results', () => {
  for (const invalidCount of [-1, 0.5]) {
    const state = request([screen(3840, 2160, 60, 2, invalidCount)]);
    let calls = 0;
    const prepared = prepareGuideInput(state, () => {calls++; return {};});
    assert.equal(prepared.status, 'unconfirmed');
    assert.match(prepared.reason, /HD 레이어.*0 이상의 정수/);
    assert.equal(calls, 0);
    const exported = buildGuideExportText(state, prepared);
    assert.match(exported, /HD 레이어 입력 오류/);
    assert.doesNotMatch(exported, /HD 레이어 -1개|HD 레이어 0\.5개/);
  }
});

test('Aquilon HD resource note limits eight mixing layers to the four-output-link region', () => {
  const prepared = prepareGuideInput(request([screen(5760, 1080, 60, 0, 4)]), calculateRecommendations);
  assert.match(prepared.reason, /Aquilon에 한해.*출력 링크 4개 이하 영역/);
});

test('confirmed 4K60 resolution feeds the existing W-019 evaluator unchanged', () => {
  const state = request([screen(7680, 4320, 60, 4)]);
  const prepared = prepareGuideInput(state, calculateRecommendations);
  assert.equal(prepared.status, 'calculated');
  assert.equal(prepared.input.screens[0].outputs, 4);
  assert.equal(prepared.result.recommendedModel, 'zenith-200');
});

test('HD-only, mixed HD/4K, capacity-4, and undocumented resolutions do not create a model recommendation', () => {
  for (const state of [
    request([screen(5760, 1080, 60, 0, 4)]),
    request([screen(3840, 2160, 60, 2, 1)]),
    request([screen(7680, 4320, 30)]),
    request([screen(5000, 2000)]),
  ]) {
    let calls = 0;
    const prepared = prepareGuideInput(state, () => {calls++; return {};});
    assert.equal(prepared.status, 'unconfirmed');
    assert.equal(prepared.result, null);
    assert.equal(calls, 0);
    assert.match(prepared.reason, /미확인/);
  }
});

test('legacy direct-output input still has the same verdict', () => {
  const state = request([{inputMode:'topology', layout:'1', outputs:1, layerType:'mixing', layers:2, hdLayers:0}]);
  const prepared = prepareGuideInput(state, calculateRecommendations);
  assert.equal(prepared.status, 'calculated');
  assert.deepEqual(prepared.input, {screens:[{outputs:1, layerType:'mixing', layers:2}], auxOutputs:0, inputs4k:2});
  assert.equal(prepared.result.recommendedModel, calculateRecommendations(prepared.input).recommendedModel);
});

test('export includes entered configuration and explicitly preserves an unconfirmed verdict', () => {
  const prepared = prepareGuideInput(request([screen(5760, 1080, 60, 0, 4)]), calculateRecommendations);
  const exported = buildGuideExportText(request([screen(5760, 1080, 60, 0, 4)]), prepared);
  assert.match(exported, /5760×1080@60/);
  assert.match(exported, /미확인/);
  assert.doesNotMatch(exported, /추천 모델:/);
});

test('export includes every model verdict and the reason when a model cannot support the configuration', () => {
  const state=request([screen(7680,4320,60,4)]);
  const exported=buildGuideExportText(state,prepareGuideInput(state,calculateRecommendations));
  assert.match(exported,/Zenith 200: 가능/);
  assert.match(exported,/Pulse 4K: 불가 ·/);
  assert.equal(exported.split('\n').filter(line=>/^(Pulse 4K|Eikos 4K|Zenith |Aquilon )/.test(line)).length,15);
});
