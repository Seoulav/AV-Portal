import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enhancementErrors, prepareEnhancements, validVideoLayerPlan } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW011VideoLayerProduct } from './w20261016-011-video-layer-history.mjs';

const readProduct = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const slugs = ['pulse-4k', 'eikos-4k', 'zenith-100', 'zenith-200'];

test('the shared processor layer analysis exposes mode-specific screen and layer limits for all four products', () => {
  const expected = [
    ['pulse-4k', 2, 1, 2, 2, 4, 0],
    ['eikos-4k', 2, 1, 2, 2, 4, 0],
    ['zenith-100', 3, 1, 2, 3, 6, 1],
    ['zenith-200', 4, 1, 2, 4, 8, 2]
  ];
  let sharedModels;
  for (const [slug, maxScreens, perMaxScreensMix, perMaxScreensSplit, oneScreenMix, oneScreenSplit, auxAtMaxScreens] of expected) {
    const product = readProduct(slug);
    const plan = product.videoLayerPlan;
    assert.equal(validVideoLayerPlan(plan, product), true, slug);
    assert.equal(plan.models.length, 4, slug);
    const row = plan.models.find(item => item.slug === slug);
    assert.equal(row.maxPgm4kScreens, maxScreens, slug);
    assert.equal(row.mixing4kPerScreenAtMaxScreens, perMaxScreensMix, slug);
    assert.equal(row.split4kPerScreenAtMaxScreens, perMaxScreensSplit, slug);
    assert.equal(row.maxMixing4kPerScreenOneScreen, oneScreenMix, slug);
    assert.equal(row.maxSplit4kPerScreenOneScreen, oneScreenSplit, slug);
    assert.equal(row.totalMixing4k, oneScreenMix, slug);
    assert.equal(row.totalSplit4k, oneScreenSplit, slug);
    assert.equal(row.auxOutputsAtMaxScreens, auxAtMaxScreens, slug);
    assert.equal(plan.currentSlug, slug);
    assert.equal(enhancementErrors(product).some(error => error.includes('videoLayerPlan')), false, slug);
    if (!sharedModels) sharedModels = plan.models;
    else assert.deepEqual(plan.models, sharedModels, `${slug} shares normalized model rows`);
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
  for (const slug of slugs) for (const mode of readProduct(slug).videoLayerPlan.models.find(row => row.slug === slug).screenModes) assert.ok(Number.isInteger(mode.outputsPerScreen), `${slug}/${mode.id} output count`);
  assert.equal(eikos.screenModes.find(mode => mode.id === 'hard-soft-edge').outputsPerScreen, 2);
});

test('Alta resources are system-wide and documentation gaps remain explicitly unknown', () => {
  const z100 = readProduct('zenith-100').videoLayerPlan.models.find(row => row.slug === 'zenith-100');
  const z200 = readProduct('zenith-200').videoLayerPlan.models.find(row => row.slug === 'zenith-200');
  assert.equal(z100.maxAuxOutputs, 2);
  assert.equal(z200.maxAuxOutputs, 4);
  assert.equal(z100.auxOutputsAtMaxScreens, 1);
  assert.equal(z200.auxOutputsAtMaxScreens, 2);
  assert.equal(z100.resourceScope, 'device');
  assert.equal(z200.resourceScope, 'device');
  const plan = readProduct('zenith-100').videoLayerPlan;
  assert.ok(plan.notes.some(note => /출력 경계.*미확인/.test(note)));
  assert.ok(plan.notes.some(note => /4K\/HD.*미확인/.test(note)));
  assert.doesNotMatch(plan.notes.join(' '), /1080p Aux[^.]*미확인/);
  assert.deepEqual(z100.allocationExamples, ['1화면 3', '2화면 2+1', '3화면 1+1+1']);
  assert.deepEqual(z200.allocationExamples, ['1화면 4', '2화면 3+1 또는 2+2', '3화면 2+1+1', '4화면 1+1+1+1']);
  assert.equal(readProduct('zenith-100').videoLayerPlan.comparison.twoByTwo['zenith-100'].includes('최대 3개'), true);
  assert.equal(readProduct('zenith-200').videoLayerPlan.comparison.twoByTwo['zenith-200'].includes('믹싱 4개 또는 분할 8개'), true);
});

test('background and foreground layers are described separately from the live layer counts and Aux behavior is accurate', () => {
  const plan = readProduct('pulse-4k').videoLayerPlan;
  assert.ok(plan.notes.some(note => /배경.*라이브 입력이나 정지 이미지/.test(note) && /배경.*1개.*전경.*1개/.test(note)));
  assert.ok(plan.notes.some(note => /1080p Aux.*크기를 바꿀 수 없는 레이어가 1개/.test(note)));
  assert.ok(plan.notes.some(note => /Alta.*보조 출력은 레이어 자원을 쓰지 않습니다/.test(note)));
  assert.ok(plan.notes.some(note => /여러 출력을 한 화면으로 묶어도 배정한 자원 수/.test(note)));
  assert.equal(plan.notes.some(note => /화면 전체 레이어는 라이브 입력 레이어/.test(note)), false);
  assert.deepEqual(readProduct('zenith-100').videoLayerPlan.evidence.datasheets.find(item => item.slug === 'zenith-100').pages, [1, 6]);
});

test('XDM and Aquilon comparisons avoid unsupported layer-count claims for XDM', () => {
  const plan = readProduct('pulse-4k').videoLayerPlan;
  const raw = JSON.parse(readFileSync(new URL('../beta/site/rtcom/raw/products/xdm.json', import.meta.url), 'utf8'));
  const wos = raw.lineup.find(row => row.model === 'XDM-WOS100');
  assert.equal(plan.comparison.xdm.outputPorts, 4);
  assert.equal(plan.comparison.xdm.sourceCondition, wos.io[0].condition);
  assert.match(plan.comparison.xdm.summary, /레이어 최대 개수는 명시하지 않습니다/);
  assert.equal(Object.hasOwn(plan.comparison.xdm, 'mixingLayers'), false);
  assert.match(plan.comparison.aquilon, /4.*8/);
});

test('the 2×2 comparison card has model-specific copy for every rendered product slug', () => {
  const expected = {
    'pulse-4k': /2×2.*PGM 출력.*2개.*수 없습니다.*Datasheet 5쪽/,
    'eikos-4k': /2×2.*PGM 출력.*2개.*수 없습니다.*Datasheet 6쪽/,
    'zenith-100': /최대 3개.*2×2.*구성할 수 없습니다.*25쪽/,
    'zenith-200': /지원.*레이어 자원 4개.*믹싱 4개 또는 분할 8개.*Aquilon RS.*가정/
  };
  for (const slug of slugs) {
    const copy = readProduct(slug).videoLayerPlan.comparison.twoByTwo[slug];
    assert.equal(typeof copy, 'string', `${slug} has visible comparison text`);
    assert.match(copy, expected[slug], slug);
  }
  const app = readFileSync(new URL('../beta/site/detail/app.js', import.meta.url), 'utf8');
  assert.match(app, /plan\.comparison\.twoByTwo\[current\.slug\]/);
  assert.match(app, /2×2 격자 화면 비교 · 출력 4개 가정/);
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
  assert.match(app, /element\('details', 'video-layer-source-details'\)/);
  assert.match(app, /화면 최대 때 화면당 레이어/);
  assert.match(app, /한 화면만 쓸 때 최대 레이어/);
  assert.doesNotMatch(app, /정확한 원문 인용과 쪽수는 작업 PR 본문에 기록/);
  assert.match(app, /다른 장비의 참고 정보/);
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
