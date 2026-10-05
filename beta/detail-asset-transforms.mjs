// Shared by the Group 1 builder and the source/generated-asset regression test.
export const detailAssetPairs = [
  ['prototype/brc-am7/detail-enhancements.mjs', 'beta/site/detail/detail-enhancements.mjs', 'copy'],
  ['prototype/brc-am7/detail-enhancement-view.mjs', 'beta/site/detail/detail-enhancement-view.mjs', 'copy'],
  ['prototype/brc-am7/index.html', 'beta/site/detail/index.html', 'html'],
  ['prototype/brc-am7/app.js', 'beta/site/detail/app.js', 'app'],
  ['prototype/brc-am7/styles.css', 'beta/site/detail/styles.css', 'copy'],
  ['prototype/brc-am7/product-detail-model.mjs', 'beta/site/detail/product-detail-model.mjs', 'copy'],
  ['prototype/brc-am7/pdf-documents.mjs', 'beta/site/detail/pdf-documents.mjs', 'copy'],
  ['beta/distributor-links.mjs', 'beta/site/shared/distributor-links.mjs', 'copy'],
  ['prototype/brc-am7/favicon.svg', 'beta/site/favicon.svg', 'copy']
];

function replaceRequired(source, before, after) {
  if (!source.includes(before)) throw new Error(`Detail build marker missing: ${before}`);
  return source.replace(before, after);
}

export function transformDetailHtml(source) {
  const html = source
    .replaceAll('Product Detail 시안', 'Product Detail Beta')
    .replaceAll('https://seoulav.github.io/AV-Portal/', '../')
    .replace('href="./favicon.svg"', 'href="../favicon.svg"')
    .replace('href="../../beta/site/fonts/PretendardVariable.woff2"', 'href="../fonts/PretendardVariable.woff2"')
    .replace('href="../../beta/site/shared/pg.css"', 'href="../shared/pg.css"')
    .replace('href="../../beta/site/shared/pdf-viewer.css"', 'href="../shared/pdf-viewer.css"')
    .replace('href="../../beta/site/system-version.css"', 'href="../system-version.css"')
    .replace('src="../../beta/site/system-version.js"', 'src="../system-version.js"')
    .replaceAll('PRODUCT DETAIL LAB', 'PRODUCT DETAIL')
    .replaceAll('LOCAL PREVIEW', 'PUBLIC BETA')
    .replaceAll('공개 Library', 'Library')
    .replaceAll('로컬 이미지가 없습니다', '게시된 이미지가 없습니다')
    .replaceAll('로컬 시안 이미지', '제품 이미지')
    .replaceAll('AV PORTAL · PRODUCT DETAIL LOCAL STUDY', 'AV PORTAL · PRODUCT DETAIL BETA');
  return replaceRequired(
    replaceRequired(html, '</head>', '  <link rel="stylesheet" href="../system-version.css?v=w20261004-008">\n  <script type="module" src="../system-version.js?v=w20261004-008"></script>\n</head>'),
    '    </header>',
    '      <div class="system-version" data-system-version aria-label="시스템 버전"></div>\n    </header>'
  );
}

export function transformDetailApp(source) {
  let output = replaceRequired(
    source.replace(/\r\n/g, '\n'),
    "const allowContentFallback = true;\nif (!productKey && !allowContentFallback) {",
    'if (!productKey) {'
  );
  output = replaceRequired(output,
    "if (productKey && !/^[a-z0-9-]+$/.test(productKey))",
    "if (!/^[a-z0-9-]+$/.test(productKey))");
  output = replaceRequired(output,
    "const productDataPath = productKey ? `./data/${productKey}.json` : './content.json';",
    "const productDataPath = `./data/${productKey}.json`;");
  return output
    .replace("from '../../beta/site/shared/pdf-viewer.mjs'", "from '../shared/pdf-viewer.mjs'")
    .replace("from '../../beta/site/shared/rtcom-adapter.mjs'", "from '../shared/rtcom-adapter.mjs'")
    .replace("from '../../beta/distributor-links.mjs'", "from '../shared/distributor-links.mjs'")
    .replace("from '../../beta/site/shared/brand-links.mjs'", "from '../shared/brand-links.mjs'")
    .replace("`../../beta/site/rtcom/raw/products/${rtcomId}.json`", "`../rtcom/raw/products/${rtcomId}.json`")
    .replace("fetch('../../beta/site/catalog.json')", "fetch('../catalog.json')")
    .replace("brandListingHref(brand, '../../beta/site/')", "brandListingHref(brand)")
    .replace("const manifestPath = '../../beta/site/docs/manifest.json';", "const manifestPath = '../docs/manifest.json';")
    .replace('Product Detail 시안', 'Product Detail')
    .replace('시안 콘텐츠를 읽을 수 없습니다.', '제품 상세 데이터를 읽을 수 없습니다.')
    .replace('제품의 로컬 검토본입니다. 공개 사이트와 별도로 검토합니다.', '제품의 공개 Beta 상세페이지입니다. 검토 중인 항목은 상태를 확인해 주세요.')
    .replaceAll('로컬 이미지 없음', '게시 이미지 없음')
    .replaceAll('로컬 표시 파일 없음', '게시 이미지 없음');
}

export function transformDetailAsset(source, kind) {
  if (kind === 'html') return transformDetailHtml(source);
  if (kind === 'app') return transformDetailApp(source);
  return source;
}
