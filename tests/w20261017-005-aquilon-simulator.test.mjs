import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateRecommendations} from '../prototype/brc-am7/analogway-layer-guide.mjs';
import {buildAnalogWayLayerStandards} from '../prototype/brc-am7/analogway-layer-standards.mjs';
import {readFileSync} from 'node:fs';

const model = (screens, slug, inputs4k = 4) => calculateRecommendations({screens, auxOutputs: 0, inputs4k}).models.find(row => row.slug === slug);
const screen = layers => [{outputs: 4, layerType: 'mixing', layers}];
const product = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));

test('Aquilon distributes one screen layers across VPUs while keeping output links on one VPU', () => {
  const rs1 = model(screen(6), 'aquilon-rs1');
  assert.equal(rs1.possible, false);
  assert.ok(rs1.reasons.some(reason => reason.includes('전체') || reason.includes('VPU')));
  const rs2 = model(screen(6), 'aquilon-rs2');
  assert.equal(rs2.possible, true);
  assert.equal(rs2.used.outputLinks, 8);
  assert.equal(rs2.used.sourceLinks, 12);
  assert.equal(rs2.used.processingUnits, 2);
  assert.match(rs2.displayMode, /실측 근거\(시뮬레이터\)/);
  const cplus = model(screen(6), 'aquilon-cplus');
  assert.equal(cplus.possible, true);
  assert.equal(cplus.used.processingUnits, 2);
});

test('Aquilon checks the whole model resource pool, not a fixed four layer screen ceiling', () => {
  assert.equal(model(screen(5), 'aquilon-rsalpha').possible, false);
  assert.equal(model(screen(5), 'aquilon-rs2').possible, true);
  assert.equal(model(screen(8), 'aquilon-rs2').possible, true);
  assert.equal(model(screen(8), 'aquilon-rs2').used.processingUnits, 2);
  const rs1 = model(screen(5), 'aquilon-rs1');
  assert.ok(rs1.reasons.every(reason => !reason.includes('화면당 4K 믹싱 최대 4개')));
});

test('Aquilon standards distinguish manual one-VPU example and simulator observations', () => {
  const standards = buildAnalogWayLayerStandards({
    aquilonRs: product('aquilon-rsalpha').layerPlan,
    aquilonC: product('aquilon-cmini').layerPlan,
    video: product('zenith-100').videoLayerPlan,
  });
  const text = [standards.examples[0].text, standards.calculationNote, ...standards.cautionNotes, standards.sourceNote].join(' ');
  assert.match(text, /AW LivePremier Simulator 6\.2\.2\(펌웨어 6\.2\.79\), 2026-10-17 실측/);
  assert.match(text, /용량 4.*6개.*7개/);
  assert.match(text, /용량 1.*12.*5.*2/);
  assert.match(text, /Region.*24.*12/);
  assert.match(text, /Optimized mode.*Cut&Fill/);
  assert.doesNotMatch(text, /두 개에 나눠 늘릴 수 있는지는 확인되지/);
  assert.doesNotMatch(text, /Region Captive PiP의 절감 산식은 확인되지/);
});
