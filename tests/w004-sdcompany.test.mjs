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

test('PixelFit presents the 4K AOI baseline and NVIDIA custom resolution as static monitor examples', async () => {
  const product = detail('emision-pixelfit');
  const examples = product.settings?.find(item => item.kind === 'screen-examples')?.items;
  assert.equal(examples?.length, 3, 'the 4K AOI examples include a qualitative movable-position illustration');
  assert.deepEqual(examples?.map(item => [item.signal, item.activeWidth, item.activeHeight, item.offsetX, item.offsetY, item.rightMargin, item.bottomMargin]), [
    ['3840×2160', 1295, 780, 0, 0, 2545, 1380],
    ['3840×2160', 1340, 780, 0, 0, 2500, 1380],
    ['3840×2160', undefined, undefined, undefined, undefined, undefined, undefined]
  ]);
  assert.deepEqual(examples?.map(item => item.method), [
    '바탕화면 마스킹 모드: NVIDIA 하드웨어 마스크 또는 AMD 하드웨어 마스크 선택 · emision 작업표시줄 추가 권장',
    'GPU 커스텀 해상도 모드: NVIDIA 전용 · AOI에 맞춘 데스크톱 해상도',
    '화면 안 위치와 기준점 지정'
  ]);
  assert.match(product.overview, /GPU 커스텀 해상도 모드: NVIDIA 전용/);
  assert.match(product.overview, /NVIDIA 하드웨어 마스크 또는 AMD 하드웨어 마스크/);
  assert.match(product.overview, /화면 안 어느 위치든 지정할 수 있고, 기준점 변경도 가능/);
  assert.ok(product.sources.some(source => source.code === 'U' && /사용자 확인\(2026-10-14\)/.test(source.name)));
  assert.ok(product.features.some(item => item.text.startsWith('작업 모드 · GPU 커스텀 해상도: NVIDIA 전용')));
  assert.ok(product.features.some(item => item.text === '마스킹 모드 · emision 작업표시줄 추가(권장)'));
  assert.match(product.specifications.find(item => item.name === 'GPU 커스텀 해상도 모드')?.condition ?? '', /6쪽/);
  assert.equal(product.presentation.keyFactsVariant, undefined, 'the previous standard facts presentation is restored');
  assert.equal(product.settings.some(item => item.kind === 'mode-cards'), false);
  const { renderScreenExampleSvg } = await import('../beta/site/detail/detail-enhancement-view.mjs');
  const [{ enhancementErrors: siteEnhancementErrors }, { enhancementErrors: pageEnhancementErrors }] = await Promise.all([
    import('../beta/site/detail/detail-enhancements.mjs'), import('../prototype/brc-am7/detail-enhancements.mjs')
  ]);
  assert.deepEqual(siteEnhancementErrors(product), []);
  assert.deepEqual(pageEnhancementErrors(product), []);
  const svg = renderScreenExampleSvg(examples[0]);
  assert.match(svg, /<svg[^>]+viewBox=/);
  assert.match(svg, /class="screen-active-area"/);
  assert.match(svg, /3840×2160 신호/);
  assert.match(svg, /표시 영역\(AOI\)/);
  assert.match(svg, /마스킹\(검정\) 영역/);
  assert.match(renderScreenExampleSvg(examples[1]), /3840×2160 신호/);
  assert.match(renderScreenExampleSvg(examples[1]), /1340×780/);
  assert.match(renderScreenExampleSvg(examples[1]), /마스킹\(검정\) 영역/);
});
