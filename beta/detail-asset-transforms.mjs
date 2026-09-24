// Shared by the Group 1 builder and the source/generated-asset regression test.
export const detailAssetPairs = [
  ['prototype/brc-am7/index.html', 'beta/site/detail/index.html', 'html'],
  ['prototype/brc-am7/app.js', 'beta/site/detail/app.js', 'app'],
  ['prototype/brc-am7/styles.css', 'beta/site/detail/styles.css', 'copy'],
  ['prototype/brc-am7/product-detail-model.mjs', 'beta/site/detail/product-detail-model.mjs', 'copy'],
  ['prototype/group1/group1-links.js', 'beta/site/detail-links.js', 'copy'],
  ['prototype/group1/group1.css', 'beta/site/detail-links.css', 'copy']
];

function replaceRequired(source, before, after) {
  if (!source.includes(before)) throw new Error(`Detail build marker missing: ${before}`);
  return source.replace(before, after);
}

export function transformDetailHtml(source) {
  return source
    .replaceAll('Product Detail 시안', 'Product Detail Beta')
    .replaceAll('https://seoulav.github.io/AV-Portal/', '../')
    .replaceAll('PRODUCT DETAIL LAB', 'PRODUCT DETAIL')
    .replaceAll('LOCAL PREVIEW', 'PUBLIC BETA')
    .replaceAll('공개 Library', 'Library')
    .replaceAll('로컬 이미지가 없습니다', '게시된 이미지가 없습니다')
    .replaceAll('로컬 시안 이미지', '공식 제품 이미지')
    .replaceAll('AV PORTAL · PRODUCT DETAIL LOCAL STUDY', 'AV PORTAL · PRODUCT DETAIL BETA');
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
    "fetch(productKey ? `./data/${productKey}.json` : './content.json')",
    'fetch(`./data/${productKey}.json`)');
  return output
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
