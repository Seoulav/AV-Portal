import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('../beta/site/catalog.json', import.meta.url)));
const bySlug = slug => catalog.find(item => item.slug === slug);
const detail = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url)));

test('SD컴퍼니 catalog exposes the two approved products and manufacturer links', () => {
  const items = catalog.filter(item => item.brand === 'SD컴퍼니');
  assert.deepEqual(items.map(item => item.slug).sort(), ['emision-media-server', 'emision-pixelfit']);
  assert.ok(items[0].official_links?.some(url => url.startsWith('https://www.sdcompany.kr/')));
  assert.equal(bySlug('emision-media-server').product, 'emision Media Server');
  assert.equal(bySlug('emision-pixelfit').product, 'emision PixelFit');
  assert.ok(bySlug('emision-media-server').categories.includes('Media Server'));
  assert.ok(bySlug('emision-pixelfit').categories.includes('Software'));
});

test('Media Server detail retains the supplied A-model specifications and omits ROI claims', () => {
  const product = detail('emision-media-server');
  const text = JSON.stringify(product);
  for (const fact of ['16000×2160', '32GB', '1TB', '700W', 'AMD', 'NVIDIA', 'Windows 11 IoT']) assert.ok(text.includes(fact), `missing ${fact}`);
  assert.ok(product.sources.some(source => source.name === '사용자 제공 SD컴퍼니 소개서(2026-10-13)'));
  assert.ok(!/60%|80%|99%/.test(text), 'ROI marketing figures must not be published');
});

test('PixelFit is listed only as evidenced software and has no fabricated physical ports', () => {
  const product = detail('emision-pixelfit');
  assert.equal(product.itemType, 'PRODUCT');
  assert.ok(product.categories.includes('Software'));
  assert.equal(product.portMap, undefined);
  assert.deepEqual(product.io, []);
  assert.ok(product.sources.some(source => source.name === '사용자 제공 SD컴퍼니 소개서(2026-10-13)'));
  const text = JSON.stringify(product);
  for (const fact of ['2.0.0.0', '바탕화면 뷰포트', '출력 마스킹', 'NVIDIA', 'AMD', '작업표시줄', '디버그', 'Activation Code', 'LicenseKey']) assert.ok(text.includes(fact), `missing ${fact}`);
  for (const issue of ['OS 버전', '드라이버', '판매 단위', '제품 페이지']) assert.ok(product.issues.some(item => JSON.stringify(item).includes(issue)), `missing issue ${issue}`);
  for (const filename of ['emision-pixelfit-mask.png', 'emision-pixelfit-methods.png', 'emision-pixelfit-amd.png', 'emision-pixelfit-debug.png']) assert.ok(existsSync(new URL(`../beta/site/detail/images/${filename}`, import.meta.url)), `missing screenshot ${filename}`);
});

test('PixelFit screenshots use the reviewed provided-image manifest and manufacturer allowlist', async () => {
  const [{ group1Images, cardImages }, { allowedHostsFor }] = await Promise.all([
    import('../beta/group1-images.mjs'), import('../beta/manufacturer-hosts.mjs')
  ]);
  const product = detail('emision-pixelfit');
  assert.deepEqual(product.images, group1Images['emision-pixelfit']);
  assert.equal(bySlug('emision-pixelfit').card_image, cardImages['emision-pixelfit']);
  assert.ok(allowedHostsFor('SD컴퍼니').includes('sdcompany.kr'));
  assert.equal(product.presentation.visualVariant, 'user-provided-screenshots');
});

test('SD컴퍼니 feature labels end as compact noun phrases', async () => {
  const { endingType } = await import('../scripts/check-feature-wording.mjs');
  for (const slug of ['emision-media-server', 'emision-pixelfit']) {
    for (const feature of detail(slug).features) assert.equal(endingType(feature.text), null, slug + ': ' + feature.text);
  }
});

test('PixelFit screen examples preserve the three approved layouts and render a monitor diagram', async () => {
  const product = detail('emision-pixelfit');
  const examples = product.settings?.find(item => item.kind === 'screen-examples')?.items;
  assert.equal(examples?.length, 3, 'only the three approved layouts should appear');
  assert.deepEqual(examples?.map(item => [item.activeWidth, item.activeHeight, item.offsetX, item.offsetY, item.rightMargin, item.bottomMargin]), [
    [1340, 780, 0, 0, 580, 300],
    [1295, 780, 0, 0, 625, 300],
    [1920, 1080, undefined, undefined, undefined, undefined]
  ]);
  assert.deepEqual(examples?.map(item => item.method), ['NVIDIA 하드웨어 마스크', 'AMD 하드웨어 마스크', '마스킹 없음']);
  assert.ok(examples?.every(item => item.signal === '1920×1080@60Hz'));
  assert.equal(examples?.[2].note, '물리 해상도 그대로');
  const { renderScreenExampleSvg } = await import('../beta/site/detail/detail-enhancement-view.mjs');
  const [{ enhancementErrors: siteEnhancementErrors }, { enhancementErrors: pageEnhancementErrors }] = await Promise.all([
    import('../beta/site/detail/detail-enhancements.mjs'), import('../prototype/brc-am7/detail-enhancements.mjs')
  ]);
  assert.deepEqual(siteEnhancementErrors(product), []);
  assert.deepEqual(pageEnhancementErrors(product), []);
  const svg = renderScreenExampleSvg(examples[0]);
  assert.match(svg, /<svg[^>]+viewBox=/);
  assert.match(svg, /class="screen-active-area"/);
  assert.match(svg, /마스킹\(검정\) 영역/);
  assert.match(svg, /1340×780/);
  assert.doesNotMatch(renderScreenExampleSvg(examples[2]), /마스킹\(검정\) 영역/);
});
