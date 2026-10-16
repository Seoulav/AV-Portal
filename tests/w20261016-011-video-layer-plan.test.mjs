import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enhancementErrors, prepareEnhancements, validVideoLayerPlan } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW011VideoLayerProduct } from './w20261016-011-video-layer-history.mjs';

const readProduct = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const slugs = ['pulse-4k', 'eikos-4k', 'zenith-100', 'zenith-200'];

test('the shared processor layer analysis exposes mode-specific screen and layer limits for all four products', () => {
  const expected = [
    ['pulse-4k', 2, 2, 4, 2, 4],
    ['eikos-4k', 2, 2, 4, 2, 4],
    ['zenith-100', 3, 3, 6, 3, 6],
    ['zenith-200', 4, 4, 8, 4, 8]
  ];
  for (const [slug, maxScreens, perScreenMix, perScreenSplit, totalMix, totalSplit] of expected) {
    const product = readProduct(slug);
    const plan = product.videoLayerPlan;
    assert.equal(validVideoLayerPlan(plan, product), true, slug);
    assert.equal(plan.models.length, 4, slug);
    const row = plan.models.find(item => item.slug === slug);
    assert.equal(row.maxPgm4kScreens, maxScreens, slug);
    assert.equal(row.maxMixing4kPerScreen, perScreenMix, slug);
    assert.equal(row.maxSplit4kPerScreen, perScreenSplit, slug);
    assert.equal(row.totalMixing4k, totalMix, slug);
    assert.equal(row.totalSplit4k, totalSplit, slug);
    assert.equal(plan.currentSlug, slug);
    assert.equal(enhancementErrors(product).some(error => error.includes('videoLayerPlan')), false, slug);
  }
});

test('Midra modes are distinct and only Eikos exposes the two-output hard/soft edge screen', () => {
  const pulse = readProduct('pulse-4k').videoLayerPlan.models.find(row => row.slug === 'pulse-4k');
  const eikos = readProduct('eikos-4k').videoLayerPlan.models.find(row => row.slug === 'eikos-4k');
  assert.deepEqual(pulse.screenModes.map(mode => [mode.id, mode.pgmScreens, mode.mixing4kPerScreen, mode.split4kPerScreen]), [
    ['mixer', 1, 2, 4], ['matrix', 2, 1, 2]
  ]);
  assert.deepEqual(eikos.screenModes.map(mode => [mode.id, mode.pgmScreens, mode.mixing4kPerScreen, mode.split4kPerScreen]), [
    ['mixer', 1, 2, 4], ['matrix', 2, 1, 2], ['hard-soft-edge', 1, 2, 4]
  ]);
  assert.equal(eikos.screenModes.find(mode => mode.id === 'hard-soft-edge').outputsPerScreen, 2);
});

test('Alta resources are system-wide and documentation gaps remain explicitly unknown', () => {
  const z100 = readProduct('zenith-100').videoLayerPlan.models.find(row => row.slug === 'zenith-100');
  const z200 = readProduct('zenith-200').videoLayerPlan.models.find(row => row.slug === 'zenith-200');
  assert.equal(z100.maxAuxOutputs, 2);
  assert.equal(z200.maxAuxOutputs, 4);
  assert.equal(z100.resourceScope, 'device');
  assert.equal(z200.resourceScope, 'device');
  const plan = readProduct('zenith-100').videoLayerPlan;
  assert.ok(plan.notes.some(note => /다중 출력.*자원 비용.*미확인/.test(note)));
  assert.ok(plan.notes.some(note => /4K\/HD.*미확인/.test(note)));
});

test('XDM and Aquilon comparisons avoid unsupported layer-count claims for XDM', () => {
  const plan = readProduct('pulse-4k').videoLayerPlan;
  const raw = JSON.parse(readFileSync(new URL('../beta/site/rtcom/raw/products/xdm.json', import.meta.url), 'utf8'));
  const wos = raw.lineup.find(row => row.model === 'XDM-WOS100');
  assert.equal(plan.comparison.xdm.outputPorts, 4);
  assert.equal(plan.comparison.xdm.sourceCondition, wos.io[0].condition);
  assert.equal(Object.hasOwn(plan.comparison.xdm, 'mixingLayers'), false);
  assert.match(plan.comparison.aquilon, /4.*8/);
});

test('a product without a processor analysis retains existing detail behavior', () => {
  const product = { manufacturer: 'Example', model: 'Example device' };
  assert.equal(prepareEnhancements(product).videoLayerPlan, null);
  assert.deepEqual(enhancementErrors(product), []);
});

test('video layer analysis is rendered and selectively rewindable', () => {
  const app = readFileSync(new URL('../beta/site/detail/app.js', import.meta.url), 'utf8');
  assert.match(app, /function renderVideoLayerPlan\(/);
  assert.match(app, /visible\.add\('video-layer-card'\)/);
  for (const slug of slugs) {
    const current = readProduct(slug);
    const restored = beforeW011VideoLayerProduct(current, slug);
    assert.notEqual(restored, current, slug);
    assert.equal(Object.hasOwn(restored, 'videoLayerPlan'), false, slug);
    const unexpected = structuredClone(current);
    unexpected.videoLayerPlan.notes[0] += ' altered';
    assert.throws(() => beforeW011VideoLayerProduct(unexpected, slug), /unexpected videoLayerPlan change/);
  }
});
