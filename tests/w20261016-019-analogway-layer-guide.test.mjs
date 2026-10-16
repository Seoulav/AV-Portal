import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateAll, evaluateModel, normalizeConfig, presets, models, guideSlugs } from '../beta/site/detail/analogway-layer-guide.mjs';

const readProduct = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const byModel = results => Object.fromEntries(results.map(result => [result.slug, result]));
const modelOf = slug => models.find(model => model.slug === slug);

test('guide model numbers match the portal layerPlan and videoLayerPlan data', () => {
  const aquilon = readProduct('aquilon-rs1').layerPlan.models;
  for (const row of aquilon) {
    const model = modelOf(row.slug);
    assert.ok(model, row.slug);
    assert.equal(model.inputs4k, row.inputs4k, row.slug);
    assert.equal(model.outputConnectors4k, row.outputConnectors4k, row.slug);
    assert.equal(model.programOutputs4k, row.programOutputs4k, row.slug);
    assert.equal(model.vpus, row.vpus, row.slug);
    assert.equal(model.mixingLayers4k, row.mixingLayers4k, row.slug);
  }
  const video = readProduct('zenith-100').videoLayerPlan.models;
  for (const row of video) {
    const model = modelOf(row.slug);
    assert.ok(model, row.slug);
    assert.equal(model.family === 'alta' ? model.layerResources : model.liveLayersPerSystem / 2, row.totalMixing4k, row.slug);
    if (model.family === 'alta') {
      assert.equal(model.maxPgmOutputs, row.maxPgm4kScreens, row.slug);
    }
  }
  assert.equal(guideSlugs.length, 11);
  assert.ok(!guideSlugs.includes('rc400t'));
});

test('preset 1: one 2x2 4K60 screen with 4 mixing layers fits every Aquilon and Zenith 200 only', () => {
  const results = byModel(evaluateAll(presets[0]));
  for (const slug of ['aquilon-rsalpha', 'aquilon-rs1', 'aquilon-rs2', 'aquilon-rs6', 'zenith-200']) assert.equal(results[slug].ok, true, slug);
  for (const slug of ['zenith-100', 'pulse-4k', 'eikos-4k']) assert.equal(results[slug].ok, false, slug);
  assert.equal(results['zenith-200'].recommended, true);
  assert.equal(results['aquilon-rs1'].detail.vpusNeeded, 1);
  assert.equal(results['aquilon-rs1'].detail.screens[0].sourceLinks, 8);
  assert.equal(results['aquilon-rs1'].detail.screens[0].outputLinks, 8);
});

test('preset 2: three 4K screens with 2 mixing layers each and 2 AUX needs two VPUs', () => {
  const results = byModel(evaluateAll(presets[1]));
  for (const slug of ['zenith-100', 'zenith-200', 'aquilon-rsalpha', 'aquilon-rs1', 'pulse-4k', 'eikos-4k']) assert.equal(results[slug].ok, false, slug);
  for (const slug of ['aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6']) assert.equal(results[slug].ok, true, slug);
  assert.equal(results['aquilon-rs2'].recommended, true);
  assert.equal(results['aquilon-rs2'].detail.vpusNeeded, 2);
  assert.match(results['zenith-100'].reasons.join(' '), /레이어 자원 6개 > 최대 3개/);
  assert.match(results['aquilon-rs1'].reasons.join(' '), /VPU 2개 > 모델 VPU 1개/);
});

test('preset 3: one 4K screen with 4 split layers and 1 AUX fits Pulse 4K in Mixer mode', () => {
  const results = byModel(evaluateAll(presets[2]));
  assert.equal(results['pulse-4k'].ok, true);
  assert.equal(results['pulse-4k'].recommended, true);
  assert.match(results['pulse-4k'].mode, /Mixer/);
  assert.equal(results['zenith-100'].detail.resources, 2);
  assert.equal(results['aquilon-rs1'].detail.screens[0].sourceLinks, 4);
});

test('Midra modes: Matrix needs two single-output screens with at most 2 live layers each; Blend is Eikos only', () => {
  const matrix = { screens: [{ shape: 'single', layerType: 'split', layers: 2 }, { shape: 'single', layerType: 'mixing', layers: 1 }], aux: 0, inputs: 4 };
  assert.equal(evaluateModel(matrix, modelOf('pulse-4k')).ok, true);
  assert.match(evaluateModel(matrix, modelOf('pulse-4k')).mode, /Matrix/);
  const matrixOver = { ...matrix, screens: [{ shape: 'single', layerType: 'mixing', layers: 2 }, { shape: 'single', layerType: 'mixing', layers: 1 }] };
  assert.equal(evaluateModel(matrixOver, modelOf('pulse-4k')).ok, false);
  const blend = { screens: [{ shape: 'dual', layerType: 'mixing', layers: 2 }], aux: 0, inputs: 4 };
  assert.equal(evaluateModel(blend, modelOf('eikos-4k')).ok, true);
  assert.equal(evaluateModel(blend, modelOf('pulse-4k')).ok, false);
  assert.equal(evaluateModel({ ...blend, aux: 1 }, modelOf('eikos-4k')).ok, false);
});

test('boundaries: oversized screen, too many inputs, too many AUX, empty config', () => {
  const quadSplit = { screens: [{ shape: 'quad', layerType: 'split', layers: 8 }], aux: 0, inputs: 1 };
  assert.equal(evaluateModel(quadSplit, modelOf('aquilon-rs1')).ok, true, '2x2 with 8 split layers uses 8 source links');
  const tooManyLayers = { screens: [{ shape: 'quad', layerType: 'mixing', layers: 5 }], aux: 0, inputs: 1 };
  const over = evaluateModel(tooManyLayers, modelOf('aquilon-rs6'));
  assert.equal(over.ok, false);
  assert.match(over.reasons.join(' '), /VPU 1개의 링크/);
  const inputs = evaluateModel({ screens: [{ shape: 'single', layerType: 'mixing', layers: 1 }], aux: 0, inputs: 9 }, modelOf('aquilon-rsalpha'));
  assert.equal(inputs.ok, false);
  const aux = evaluateModel({ screens: [{ shape: 'single', layerType: 'mixing', layers: 1 }], aux: 3, inputs: 1 }, modelOf('zenith-100'));
  assert.match(aux.reasons.join(' '), /AUX 3개 > 최대 2개/);
  for (const result of evaluateAll({ screens: [], aux: 0, inputs: 0 })) assert.equal(result.ok, false, result.slug);
  assert.deepEqual(normalizeConfig({ screens: [{ shape: 'nope', layerType: 'x', layers: 99 }], aux: -2, inputs: 'a' }), { screens: [{ shape: 'single', layerType: 'mixing', layers: 8 }], aux: 0, inputs: 0 });
});

test('Aquilon packs independent screens into VPUs by links, not by screen count alone', () => {
  const eight = { screens: Array.from({ length: 8 }, () => ({ shape: 'single', layerType: 'mixing', layers: 0 })), aux: 0, inputs: 1 };
  const rs2 = evaluateModel(eight, modelOf('aquilon-rs2'));
  assert.equal(rs2.detail.vpusNeeded, 2, '8 screens x 2 output links = 16 links = 2 VPUs');
  assert.equal(rs2.ok, true);
  assert.equal(evaluateModel(eight, modelOf('aquilon-rs1')).ok, false);
});
