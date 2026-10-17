import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateRecommendations} from '../beta/site/detail/analogway-layer-guide.mjs';
import {calculateTileLayerMaximums, formatTileLayerMaximum, prepareTileGuide} from '../beta/site/detail/analogway-tile-guide.mjs';

const maxFor = (columns, rows, layers, slug) => {
  const tile = prepareTileGuide({columns, rows, layers}, calculateRecommendations);
  assert.equal(tile.status, 'calculated');
  return calculateTileLayerMaximums(tile, calculateRecommendations).get(slug);
};

test('Aquilon tile maxima come from repeated evaluator results, independent of entered layers', () => {
  for (const [columns, rows, slug, mixing, split] of [
    [4, 2, 'aquilon-rs2', 8, 16],
    [4, 2, 'aquilon-rs4', 12, 24],
    [4, 2, 'aquilon-rs6', 16, 32],
    [2, 2, 'aquilon-rsalpha', 4, 8],
    [4, 4, 'aquilon-cmax', 16, 32],
  ]) {
    const low = maxFor(columns, rows, 2, slug);
    const high = maxFor(columns, rows, 6, slug);
    assert.equal(low?.mixing, mixing, slug);
    assert.equal(low?.split, split, slug);
    assert.deepEqual(high, low, `${slug}: current layer input cannot change the maximum`);
  }
});

test('split conversion is directly corroborated by evaluator where per-group input stays within eight', () => {
  for (const [columns, rows, slug] of [[4, 2, 'aquilon-rs2'], [2, 2, 'aquilon-rsalpha'], [4, 4, 'aquilon-cmax']]) {
    const maximum = maxFor(columns, rows, 2, slug);
    assert.equal(maximum.splitConvertedBeyondEvaluator, false, slug);
    const splitInput = prepareTileGuide({columns, rows, layers: maximum.perGroupMixing * 2}, calculateRecommendations).input;
    const result = calculateRecommendations({
      ...splitInput,
      screens: splitInput.screens.map(screen => ({...screen, layerType: 'split'})),
    });
    const model = result.models.find(item => item.slug === slug);
    assert.equal(model.possible, true, slug);
    assert.equal(model.used.layers, maximum.split, slug);
  }
  assert.equal(maxFor(4, 2, 2, 'aquilon-rs4').splitConvertedBeyondEvaluator, true);
  assert.equal(maxFor(4, 2, 2, 'aquilon-rs6').splitConvertedBeyondEvaluator, true);
});

test('maximum helper does not add Alta or Midra limits', () => {
  const tile = prepareTileGuide({columns: 2, rows: 2, layers: 2}, calculateRecommendations);
  const maximums = calculateTileLayerMaximums(tile, calculateRecommendations);
  assert.equal(maximums.has('eikos-4k'), false);
  assert.equal(maximums.has('zenith-200'), false);
});

test('maximum helper actually re-evaluates every supported layer input with unchanged wall conditions', () => {
  const tile = prepareTileGuide({columns: 4, rows: 2, layers: 3, auxOutputs: 2, inputs4k: 4}, calculateRecommendations);
  const calls = [];
  calculateTileLayerMaximums(tile, input => {
    calls.push({layers: input.screens.map(screen => screen.layers), auxOutputs: input.auxOutputs, inputs4k: input.inputs4k});
    return calculateRecommendations(input);
  });
  assert.deepEqual(calls.map(call => call.layers), Array.from({length: 9}, (_, layers) => [layers, layers]));
  assert.ok(calls.every(call => call.auxOutputs === 2 && call.inputs4k === 4));
});

test('a proven limit says maximum while an input-ceiling result says only confirmed up to that count', () => {
  const proven = maxFor(4, 2, 2, 'aquilon-rs2');
  const ceiling = maxFor(2, 2, 2, 'aquilon-rs4');
  assert.equal(proven.atInputCeiling, false);
  assert.equal(formatTileLayerMaximum(proven), '4K60 믹싱 최대 8개 · 분할 최대 16개');
  assert.equal(ceiling.atInputCeiling, true);
  assert.equal(formatTileLayerMaximum(ceiling), '4K60 믹싱 8개까지 확인(평가 입력 상한) · 분할 16개까지 확인 — 실제 한도는 이보다 클 수 있습니다');
});
