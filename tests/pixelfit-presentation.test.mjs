import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const product = JSON.parse(readFileSync(new URL('../beta/site/detail/data/emision-pixelfit.json', import.meta.url)));

test('PixelFit uses four evidence-based metric tiles and two concept cards', async () => {
  assert.deepEqual(product.keyFacts, [
    { label: '버전', value: '2.0.0.0', unit: '' },
    { label: '컨셉', value: '2가지', unit: '' },
    { label: '지원 GPU', value: 'NVIDIA · AMD', unit: '' },
    { label: '대응 범위', value: '모든 디스플레이', unit: '' }
  ]);
  assert.equal(product.presentation.keyFactsVariant, 'metric-tiles');
  const modes = product.settings.find(setting => setting.kind === 'mode-cards');
  assert.equal(modes?.items.length, 2);
  assert.deepEqual(modes?.items.map(({ name, english, icon }) => [name, english, icon]), [
    ['커스텀 해상도 제작', 'CUSTOM RESOLUTION', 'resolution'],
    ['마스킹 영역 해상도', 'DISPLAY MASKING', 'masking']
  ]);
  assert.match(modes.items[0].summary, /활성 윈도우 해상도.*바탕화면 해상도/);
  assert.match(modes.items[1].summary, /AMD.*모든 디스플레이.*emision 작업표시줄/);
  const { enhancementErrors } = await import('../beta/site/detail/detail-enhancements.mjs');
  assert.deepEqual(enhancementErrors(product), []);
});

test('PixelFit screen example tabs contain native-resolution NVIDIA and masked AMD scenes', async () => {
  const examples = product.settings.find(setting => setting.kind === 'screen-examples');
  assert.deepEqual(examples.items.map(item => item.name), ['NVIDIA', 'AMD', '전체 화면']);
  assert.deepEqual(examples.items.map(item => item.signal), ['1340×780', '1920×1080@60Hz', '1920×1080@60Hz']);
  assert.equal(examples.items[0].signalType, 'output');
  assert.deepEqual([examples.items[0].outputWidth, examples.items[0].outputHeight], [1340, 780]);
  assert.equal(examples.items[0].masked, false);
  assert.deepEqual([examples.items[1].activeWidth, examples.items[1].activeHeight, examples.items[1].rightMargin, examples.items[1].bottomMargin], [1295, 780, 625, 300]);
  assert.equal(examples.items[1].masked, true);
  assert.deepEqual([examples.items[2].activeWidth, examples.items[2].activeHeight], [1920, 1080]);

  const { renderScreenExampleSvg } = await import('../beta/site/detail/detail-enhancement-view.mjs');
  const nvidia = renderScreenExampleSvg(examples.items[0]);
  assert.match(nvidia, /aria-label="화면 구성 예시: 1340×780 활성 표시 영역, 마스킹 없음"/);
  assert.doesNotMatch(nvidia, /screen-mask-label/);
  const nvidiaSurface = /class="screen-monitor-surface"[^>]*width="([\d.]+)" height="([\d.]+)"/.exec(nvidia);
  const nvidiaActive = /class="screen-active-area"[^>]*width="([\d.]+)" height="([\d.]+)"/.exec(nvidia);
  assert.deepEqual(nvidiaActive?.slice(1), nvidiaSurface?.slice(1), 'native resolution fills its unmasked screen');
  const amd = renderScreenExampleSvg(examples.items[1]);
  assert.match(amd, /screen-mask-label/);
  assert.match(amd, /1295×780/);
});
