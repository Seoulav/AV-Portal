import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildAnalogWayLayerStandards} from '../prototype/brc-am7/analogway-layer-standards.mjs';

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
      totalMix: source.totalMixing4k,
      totalSplit: source.totalSplit4k,
      auxAtMaxScreens: source.auxOutputsAtMaxScreens,
      auxMax: source.maxAuxOutputs
    }, source.slug);
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
