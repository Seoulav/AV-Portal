import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const product = JSON.parse(readFileSync(new URL('../beta/site/detail/data/emision-pixelfit.json', import.meta.url)));

test('PixelFit keeps evidence-based overview facts in the standard presentation', async () => {
  assert.deepEqual(product.keyFacts, [
    { label: '버전', value: '2.0.0.0', unit: '' },
    { label: '컨셉', value: '2가지', unit: '' },
    { label: '지원 GPU', value: 'NVIDIA · AMD', unit: '' },
    { label: '대응 범위', value: '모든 디스플레이', unit: '' }
  ]);
  assert.equal(product.presentation.keyFactsVariant, undefined);
  assert.equal(product.settings.some(setting => setting.kind === 'mode-cards'), false);
  assert.deepEqual(product.settings.map(setting => setting.kind), ['screen-examples']);
  const { enhancementErrors } = await import('../beta/site/detail/detail-enhancements.mjs');
  assert.deepEqual(enhancementErrors(product), []);
});

test('PixelFit shows 4K AOI masking as the primary static scene and NVIDIA as supplemental', async () => {
  const examples = product.settings.find(setting => setting.kind === 'screen-examples');
  assert.deepEqual(examples.items.map(item => item.name), ['4K 표시 영역(AOI)', 'NVIDIA 커스텀 해상도']);
  const [aoi, nvidia] = examples.items;

  assert.equal(aoi.signalType, 'fixed');
  assert.equal(aoi.signal, '3840×2160');
  assert.deepEqual([aoi.signalWidth, aoi.signalHeight], [3840, 2160]);
  assert.deepEqual([aoi.activeWidth, aoi.activeHeight, aoi.offsetX, aoi.offsetY], [1295, 780, 0, 0]);
  assert.deepEqual([aoi.rightMargin, aoi.bottomMargin], [2545, 1380]);
  assert.equal(aoi.method, '표시 영역(AOI) 마스킹 + emision 작업표시줄');
  assert.equal(aoi.masked, true);

  assert.equal(nvidia.signalType, 'output');
  assert.equal(nvidia.signal, '1340×780');
  assert.deepEqual([nvidia.outputWidth, nvidia.outputHeight], [1340, 780]);
  assert.equal(nvidia.masked, false);
  assert.equal(nvidia.method, '커스텀 해상도 제작');

  const { renderScreenExampleSvg } = await import('../beta/site/detail/detail-enhancement-view.mjs');
  const aoiSvg = renderScreenExampleSvg(aoi);
  assert.match(aoiSvg, /aria-label="화면 구성 예시: 3840×2160 신호, 1295×780 표시 영역\(AOI\), 검정 마스킹 영역"/);
  assert.match(aoiSvg, /screen-mask-label/);
  assert.match(aoiSvg, /3840×2160/);
  const nvidiaSvg = renderScreenExampleSvg(nvidia);
  assert.match(nvidiaSvg, /aria-label="화면 구성 예시: 1340×780 신호, 1340×780 활성 표시 영역, 마스킹 없음"/);
  assert.doesNotMatch(nvidiaSvg, /screen-mask-label/);

  const view = readFileSync(new URL('../beta/site/detail/detail-enhancement-view.mjs', import.meta.url), 'utf8');
  assert.match(view, /screen-example-grid/);
  assert.doesNotMatch(view, /role', 'tablist'/);
  assert.doesNotMatch(view, /function renderModeCards/);
});
