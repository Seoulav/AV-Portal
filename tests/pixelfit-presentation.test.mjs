import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { userReferences } from '../beta/user-manuals.mjs';
import { uploadedDocumentsFor, documentActionLabels } from '../beta/site/detail/pdf-documents.mjs';

const product = JSON.parse(readFileSync(new URL('../beta/site/detail/data/emision-pixelfit.json', import.meta.url)));

test('PixelFit keeps evidence-based overview facts in the standard presentation', async () => {
  assert.deepEqual(product.keyFacts, [
    { label: '버전', value: '2.0.0.0', unit: '' },
    { label: '컨셉', value: '2가지', unit: '' },
    { label: '지원 GPU', value: 'NVIDIA · AMD', unit: '' },
    { label: '대응 범위', value: '모든 디스플레이', unit: '' }
  ]);
  assert.equal(product.presentation.keyFactsVariant, undefined);
  assert.equal(product.settings.some(setting => setting.kind === 'modes'), true);
  assert.deepEqual(product.settings.map(setting => setting.kind), ['modes', 'screen-examples']);
  const { enhancementErrors } = await import('../beta/site/detail/detail-enhancements.mjs');
  assert.deepEqual(enhancementErrors(product), []);
});

test('PixelFit explains user-confirmed flexible AOI positioning', () => {
  assert.match(product.overview, /좌표는 화면 안 어느 위치든 지정할 수 있고/);
  assert.match(product.overview, /기준점 변경도 가능/);
  assert.match(product.overview, /실제 커스텀 해상도 생성은 NVIDIA GPU에서만 가능/);
  assert.match(product.overview, /NVIDIA 외 GPU\(AMD 등\)는 바탕화면 마스킹만 가능/);
  assert.ok(product.sources.some(source => source.code === 'U' && /사용자 확인\(2026-10-14\)/.test(source.name)));
});

test('PixelFit document reference is an uploaded PDF mapped to its own product', () => {
  const entry = userReferences.find(item => item.brand === 'SD컴퍼니' && item.product === 'emision PixelFit' && item.file === 'emision-pixelfit-capture.pdf');
  assert.deepEqual(entry && { file: entry.file, title: entry.title }, {
    file: 'emision-pixelfit-capture.pdf', title: 'emision PixelFit 화면 안내(사용자 제공)'
  });
});

test('PixelFit uploaded PDF exposes working local view and download actions', () => {
  const reference = userReferences.find(item => item.product === 'emision PixelFit' && item.file === 'emision-pixelfit-capture.pdf');
  const [document] = uploadedDocumentsFor('emision-pixelfit', {
    uploads: [{ slug: 'emision-pixelfit', file: 'manuals/emision-pixelfit-capture.pdf', title: reference.title, kind: 'reference' }]
  });
  assert.equal(document.title, reference.title);
  assert.equal(document.action.kind, 'local');
  assert.equal(document.action.file, '../manuals/emision-pixelfit-capture.pdf');
  assert.deepEqual(documentActionLabels(document, document.action), {
    primary: '보기', download: '↓ 내려받기', downloadAria: '참고자료 내려받기'
  });
});

test('PixelFit shows NVIDIA and AMD in a shared 4K AOI coordinate system', async () => {
  const examples = product.settings.find(setting => setting.kind === 'screen-examples');
  assert.deepEqual(examples.items.map(item => item.name), ['4K 표시 영역(AOI)', 'NVIDIA 커스텀 해상도', '위치 지정 예시']);
  const [aoi, nvidia, position] = examples.items;

  assert.equal(aoi.signalType, 'fixed');
  assert.equal(aoi.signal, '3840×2160');
  assert.deepEqual([aoi.signalWidth, aoi.signalHeight], [3840, 2160]);
  assert.deepEqual([aoi.activeWidth, aoi.activeHeight, aoi.offsetX, aoi.offsetY], [1295, 780, 0, 0]);
  assert.deepEqual([aoi.rightMargin, aoi.bottomMargin], [2545, 1380]);
  assert.match(aoi.method, /NVIDIA.*AMD/);
  assert.equal(aoi.masked, true);

  assert.equal(nvidia.signalType, 'fixed');
  assert.equal(nvidia.signal, '3840×2160');
  assert.deepEqual([nvidia.signalWidth, nvidia.signalHeight], [3840, 2160]);
  assert.deepEqual([nvidia.activeWidth, nvidia.activeHeight], [1340, 780]);
  assert.equal(nvidia.masked, true);
  assert.match(nvidia.method, /NVIDIA GPU 모드: OS·GPU에 AOI 크기의 실제 커스텀 해상도 생성·출력/);
  assert.doesNotMatch(nvidia.method, /마스킹 없음/);
  const modes = product.settings.find(setting => setting.kind === 'modes');
  assert.deepEqual(modes.comparison.rows, [['NVIDIA', '○ 가능', '○ 가능'], ['AMD·기타', '✕ 불가', '○ 가능']]);
  assert.match(modes.items[0].summary, /실제 생성해 출력/);
  assert.match(modes.items[1].summary, /신호 해상도 유지/);
  assert.match(aoi.method, /신호 해상도 3840×2160 유지/);

  assert.equal(position.signalType, 'fixed');
  assert.equal(position.signal, '3840×2160');
  assert.equal(position.masked, true);
  assert.equal(position.placementHint, 'illustrative-offset');
  assert.equal(position.activeWidth, undefined);
  assert.equal(position.offsetX, undefined);
  assert.equal(position.offsetY, undefined);
  assert.equal(position.rightMargin, undefined);
  assert.equal(position.bottomMargin, undefined);

  const { renderScreenExampleSvg } = await import('../beta/site/detail/detail-enhancement-view.mjs');
  const aoiSvg = renderScreenExampleSvg(aoi);
  assert.match(aoiSvg, /aria-label="화면 구성 예시: 3840×2160 신호, 1295×780 표시 영역\(AOI\), 검정 마스킹 영역"/);
  assert.match(aoiSvg, /screen-mask-label/);
  assert.match(aoiSvg, /3840×2160/);
  const nvidiaSvg = renderScreenExampleSvg(nvidia);
  assert.match(nvidiaSvg, /aria-label="화면 구성 예시: 3840×2160 신호, 1340×780 표시 영역\(AOI\), 검정 마스킹 영역"/);
  assert.match(nvidiaSvg, /screen-mask-label/);
  const positionSvg = renderScreenExampleSvg(position);
  assert.match(positionSvg, /위치 지정 예시/);
  assert.doesNotMatch(positionSvg, /undefined|NaN|0×0/);

  const view = readFileSync(new URL('../beta/site/detail/detail-enhancement-view.mjs', import.meta.url), 'utf8');
  assert.match(view, /screen-example-tabs/);
  assert.match(view, /role', 'tablist'/);
  assert.match(view, /aria-selected/);
  assert.match(view, /ArrowRight/);
  assert.match(view, /role', 'tabpanel'/);
  assert.match(view, /function renderSettingComparison/);
  assert.match(view, /comparison\.title/);
  assert.doesNotMatch(view, /function renderModeCards/);

  const app = readFileSync(new URL('../beta/site/detail/app.js', import.meta.url), 'utf8');
  assert.match(app, /\$\('#gallery'\)\.after\(screenExampleCard\)/);
  assert.match(app, /settingNumber/);
  const styles = readFileSync(new URL('../beta/site/detail/styles.css', import.meta.url), 'utf8');
  assert.match(styles, /#setting-3\.screen-example-section[\s\S]*?screen-example-monitor/);
  assert.match(styles, /@media \(max-width: ?(?:650|600|520|420)px\)[\s\S]*?screen-example-card/);
});

test('PixelFit example tabs switch panels and support keyboard navigation', async () => {
  class ElementStub {
    constructor(tag) { this.tagName = tag; this.children = []; this.attributes = {}; this.listeners = {}; this.dataset = {}; this.classList = { add() {} }; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    append(...nodes) { this.children.push(...nodes); }
    prepend(...nodes) { this.children.unshift(...nodes); }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    focus() { globalThis.document.activeElement = this; }
    set textContent(value) { this._textContent = String(value); }
    get textContent() { return this._textContent ?? ''; }
  }
  const priorDocument = globalThis.document;
  globalThis.document = { activeElement: null, createElement: tag => new ElementStub(tag), createTextNode: text => ({ textContent: text }) };
  try {
    const { renderSetting } = await import('../beta/site/detail/detail-enhancement-view.mjs');
    const card = renderSetting(product.settings.find(setting => setting.kind === 'screen-examples'), 3);
    const findAll = (node, predicate) => [node, ...node.children.flatMap(child => child instanceof ElementStub ? findAll(child, predicate) : [])].filter(predicate);
    const tabs = findAll(card, node => node.getAttribute('role') === 'tab');
    const panels = findAll(card, node => node.getAttribute('role') === 'tabpanel');
    assert.equal(card.id, 'setting-3');
    assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-selected')), ['true', 'false', 'false']);
    assert.deepEqual(panels.map(panel => panel.hidden), [false, true, true]);
    tabs[2].listeners.click();
    assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-selected')), ['false', 'false', 'true']);
    assert.deepEqual(panels.map(panel => panel.hidden), [true, true, false]);
    tabs[2].focus();
    let prevented = false;
    findAll(card, node => node.getAttribute('role') === 'tablist')[0].listeners.keydown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
    assert.equal(globalThis.document.activeElement, tabs[0]);
  } finally {
    if (priorDocument === undefined) delete globalThis.document;
    else globalThis.document = priorDocument;
  }
});
