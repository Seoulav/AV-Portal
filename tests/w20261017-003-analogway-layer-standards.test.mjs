import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildAnalogWayLayerStandards, renderAnalogWayLayerStandards} from '../prototype/brc-am7/analogway-layer-standards.mjs';

const product = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));

test('layer standards summary reads all 15 model counts from the existing JSON plans', () => {
  const rs = product('aquilon-rsalpha').layerPlan;
  const c = product('aquilon-cmini').layerPlan;
  const video = product('zenith-100').videoLayerPlan;
  const standards = buildAnalogWayLayerStandards({aquilonRs: rs, aquilonC: c, video});

  assert.equal(standards.series.reduce((sum, series) => sum + series.models.length, 0), 15);
  assert.deepEqual(standards.series.map(series => series.id), ['aquilon-rs', 'aquilon-c', 'alta', 'midra']);
  const aquilonRows = standards.series[0].models;
  assert.equal(aquilonRows[0].slug, 'aquilon-rsalpha');
  assert.equal(aquilonRows.at(-1).slug, 'aquilon-rs6');
  assert.equal(standards.series[1].models.at(-1).slug, 'aquilon-cmax');
  for (const source of [...rs.models, ...c.models]) {
    const actual = standards.series.flatMap(series => series.models).find(row => row.slug === source.slug);
    assert.deepEqual(actual.counts, {
      outputs: source.programOutputs4k,
      screens2x2: source.screens2x2,
      mixPerScreen: source.mixingLayers4kPerScreen,
      splitPerScreen: source.splitLayers2kPerScreen,
      totalMix: source.mixingLayers4k,
      totalSplit: source.splitLayers2k,
      processingUnits: source.vpus
    }, source.slug);
  }
  for (const source of video.models) {
    const actual = standards.series.flatMap(series => series.models).find(row => row.slug === source.slug);
    assert.deepEqual(actual.counts, {
      screens: source.maxPgm4kScreens,
      mixPerScreenAtMax: source.mixing4kPerScreenAtMaxScreens,
      splitPerScreenAtMax: source.split4kPerScreenAtMaxScreens,
      mixOneScreen: source.maxMixing4kPerScreenOneScreen,
      splitOneScreen: source.maxSplit4kPerScreenOneScreen,
      totalMix: source.totalMixing4k,
      totalSplit: source.totalSplit4k,
      auxAtMaxScreens: source.auxOutputsAtMaxScreens,
      auxMax: source.maxAuxOutputs
    }, source.slug);
  }
});

test('Midra table distinguishes two-screen Matrix from one-screen Mixer', () => {
  const standards = buildAnalogWayLayerStandards({
    aquilonRs: product('aquilon-rsalpha').layerPlan,
    aquilonC: product('aquilon-cmini').layerPlan,
    video: product('zenith-100').videoLayerPlan
  });
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: tag => ({
      tag,
      children: [],
      attributes: {},
      dataset: {},
      textContent: '',
      append(...children) { this.children.push(...children); },
      setAttribute(name, value) { this.attributes[name] = value; }
    })
  };
  try {
    const card = renderAnalogWayLayerStandards(standards, 'pulse-4k');
    const nodes = node => [node, ...node.children.flatMap(nodes)];
    const midra = nodes(card).find(node => node.tag === 'div' && node.attributes?.['aria-label'] === 'Midra 4K 레이어 기준');
    assert.ok(midra);
    const table = midra.children[0];
    assert.deepEqual(table.children[0].children[0].children.map(cell => cell.textContent), [
      '모델', '최대 4K60 화면', '최대 화면 수일 때 화면당(분할)',
      '장비 전체(분할)', '한 화면만 쓸 때(분할)', '운영 모드'
    ]);
    for (const row of table.children[1].children) {
      assert.deepEqual(row.children.slice(1, 5).map(cell => cell.textContent),
        ['2개', '1 (2)', '2 (4)', '2 (4)'], row.children[0].textContent);
    }
    const cautions = nodes(card).filter(node => node.tag === 'details');
    assert.equal(cautions.length, 1);
    assert.equal(cautions[0].children[0].textContent, '계산 근거와 미확인 사항');
    assert.match(cautions[0].children[1].textContent, /출력 4개.*출력 링크 8개.*VPU 1개.*믹싱 4개.*분할 8개/);
    assert.equal(cautions[0].children[2].children.length, 4);
    assert.match(cautions[0].children[3].textContent, /Aquilon User Manual v6\.2.*101쪽/);
  } finally {
    globalThis.document = previousDocument;
  }
});

test('four examples are derived from plan data and avoid a separate undocumented PiP count', () => {
  const standards = buildAnalogWayLayerStandards({
    aquilonRs: product('aquilon-rsalpha').layerPlan,
    aquilonC: product('aquilon-cmini').layerPlan,
    video: product('zenith-100').videoLayerPlan
  });
  assert.equal(standards.examples.length, 4);
  assert.match(standards.examples[0].text, /4개/);
  assert.match(standards.examples[0].text, /8개/);
  assert.match(standards.examples[1].text, /Zenith 100/);
  assert.match(`${standards.examples[2].title} ${standards.examples[2].text}`, /Matrix/);
  assert.match(standards.examples[2].text, /Pulse 4K는/);
  assert.match(standards.examples[3].text, /블렌딩/);
  assert.match(standards.pipNote, /별도 최대 개수는 확인되지 않았습니다/);
});

test('the new standard card is mounted only for Analog Way details and keeps the XDM comparison blocks intact', () => {
  const app = readFileSync(new URL('../beta/site/detail/app.js', import.meta.url), 'utf8');
  assert.match(app, /renderAnalogWayLayerStandards/);
  assert.match(app, /data\.manufacturer\s*===\s*['"]Analog Way['"]/);
  assert.match(app, /visible\.add\(['"]analogway-layer-standards['"]\)/);
  assert.match(app, /aquilon-layer-comparison/);
  assert.match(app, /video-layer-comparison/);
  assert.match(app, /const xdmCompare = element\('div', 'aquilon-layer-compare-card'\)/);
  assert.match(app, /const xdm = element\('article', 'video-layer-compare-card'\)/);
  assert.doesNotMatch(app, /aquilon-layer-intro|video-layer-intro|video-layer-explainer/);
  const baseline = execFileSync('git', ['show', '598757af700c961a4caf0888a5f5ce3dcde79c08:prototype/brc-am7/app.js'], {encoding:'utf8'});
  const source = readFileSync(new URL('../prototype/brc-am7/app.js', import.meta.url), 'utf8');
  const block = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)) + end.length);
  assert.equal(
    block(source, "  const comparison = element('div', 'aquilon-layer-comparison');", '  section.append(comparison);'),
    block(baseline, "  const comparison = element('div', 'aquilon-layer-comparison');", '  section.append(comparison);'),
    'Aquilon XDM-WOS100 comparison remains byte-for-byte unchanged'
  );
  assert.equal(
    block(source, "  const comparison = element('div', 'video-layer-comparison');", '  section.append(comparison);'),
    block(baseline, "  const comparison = element('div', 'video-layer-comparison');", '  section.append(comparison);'),
    'Midra/Alta XDM comparison remains byte-for-byte unchanged'
  );
});
