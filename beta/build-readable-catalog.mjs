import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const site = new URL('./site/', import.meta.url);
const publicBase = 'https://seoulav.github.io/AV-Portal/';

export const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export function buildCatalogHtml(catalog) {
  const cards = catalog.map(item => {
    const slug = item.slug;
    const label = item.link_scope === 'series' ? '제품군 링크' : '공식 링크';
    const links = item.official_links.map((url, index) => `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${label} ${index + 1}</a>`);
    if (item.manual_link) links.push(`<a href="${escapeHtml(item.manual_link)}" rel="noopener noreferrer">제조사 매뉴얼</a>`);
    if (item.reference_link) links.push(`<a href="${escapeHtml(item.reference_link)}" rel="noopener noreferrer">참고자료</a>`);
    if (slug) links.unshift(`<a href="./detail/?product=${slug}">Product Detail</a>`);
    return `      <article class="catalog-product">
        <p class="brand">${escapeHtml(item.brand)}</p>
        <h2>${escapeHtml(item.product)}</h2>
        <p><strong>분류</strong> ${item.categories.map(escapeHtml).join(' · ')}</p>
        <p><strong>종류</strong> 장비</p>
        <div class="links">${links.join('')}</div>
      </article>`;
  }).join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="AV Portal 공개 장비 27개를 JavaScript 없이 읽을 수 있는 정적 카탈로그입니다.">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${publicBase}catalog.html">
  <title>AV Portal 정적 제품 카탈로그</title>
  <style>
    :root{font-family:Arial,"Noto Sans KR",sans-serif;color:#17324f;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}header,main,footer{width:min(1080px,calc(100% - 32px));margin:auto}header{padding:48px 0 24px}h1{font-size:clamp(30px,5vw,52px);margin:8px 0}.eyebrow,.brand{color:#2568bd;font-weight:800}.intro{max-width:720px;line-height:1.7}.downloads,.links{display:flex;flex-wrap:wrap;gap:10px}.downloads a,.links a{color:#185ba9;text-decoration:none;border:1px solid #cbd9ea;background:#fff;border-radius:10px;padding:9px 12px;font-weight:700}.catalog{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.catalog-product{background:#fff;border:1px solid #dde6f1;border-radius:16px;padding:20px;box-shadow:0 8px 24px rgba(30,70,120,.06)}.catalog-product h2{margin:4px 0 12px}.catalog-product p{line-height:1.55;margin:8px 0}.brand{margin:0!important}footer{padding:32px 0 48px;color:#52657d}@media(max-width:680px){.catalog{grid-template-columns:1fr}header{padding-top:28px}}
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">AV PORTAL · STATIC CATALOG</p>
    <h1>공개 제품 카탈로그</h1>
    <p class="intro">JavaScript를 실행하지 않는 GPT·검색 도구와 일반 사용자가 읽을 수 있는 공개 장비 목록입니다. 제품 세부 사양과 적용 조건은 제조사 공식 원문에서 다시 확인하세요.</p>
    <div class="downloads"><a href="./">AV Portal 홈</a><a href="./catalog.html" download>catalog.html 다운로드</a><a href="./llms.txt" download>llms.txt 다운로드</a></div>
  </header>
  <main><p><strong>공개 장비 ${catalog.length}개</strong> · 공개 허용된 제조사·제품명·분류·종류·공식 링크만 포함합니다.</p><section class="catalog" aria-label="공개 제품 목록">
${cards}
  </section></main>
  <footer>AV Portal · 공개 데이터 기준 정적 카탈로그</footer>
</body>
</html>
`;
}

export function buildLlmsText(catalog) {
  const products = catalog.map(item => {
    const slug = item.slug;
    const lines = [
      `- 제품: ${item.brand} ${item.product}`,
      `  분류: ${item.categories.join(' | ')}`,
      '  종류: 장비',
      ...item.official_links.map(url => `  ${item.link_scope === 'series' ? '제품군 링크' : '공식 링크'}: ${url}`),
      ...(item.manual_link ? [`  매뉴얼: ${item.manual_link}`] : []),
      ...(item.reference_link ? [`  참고자료: ${item.reference_link}`] : [])
    ];
    if (slug) lines.push(`  상세: ${publicBase}detail/?product=${slug}`);
    return lines.join('\n');
  }).join('\n\n');
  return `# AV Portal

AV Portal은 AV 장비를 제조사, 제품명, 카테고리와 연결 규격으로 탐색하는 공개 베타 사이트입니다.

- 홈: ${publicBase}
- 정적 HTML 카탈로그: ${publicBase}catalog.html
- 공개 JSON: ${publicBase}catalog.json
- 공개 장비: ${catalog.length}개
- Product Detail: ${catalog.filter(item => item.slug).length}개
- 데이터 범위: 공개 허용된 제조사, 제품명, 복수 분류, 장비 종류, 공식 링크
- 링크 표기: "공식 링크"는 해당 모델 전용 제조사 페이지, "제품군 링크"는 그 모델이 속한 제품군·시리즈의 제조사 페이지입니다.
- 주의: 세부 사양과 적용 조건은 연결된 제조사 공식 원문에서 확인해야 합니다.

## Public products

${products}
`;
}

export async function writeReadableCatalog() {
  const catalog = JSON.parse(await readFile(new URL('catalog.json', site), 'utf8'));
  await Promise.all([
    writeFile(new URL('catalog.html', site), buildCatalogHtml(catalog), 'utf8'),
    writeFile(new URL('llms.txt', site), buildLlmsText(catalog), 'utf8')
  ]);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await writeReadableCatalog();
