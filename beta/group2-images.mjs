// 상세페이지가 아직 없는 Group 2 제품의 Library 카드 대표 사진.
// 조사·승인 기록: Work/기록/W-20260925-012-사진조사.md, 전체 48장 목록: docs/research/group2-images/manifest.json
// 제품의 상세페이지가 생기면 이 목록에서 빼고 group1-images.mjs의 cardImages로 옮긴다(상세가 있으면 preview 필드를 두지 않는다).
export const publicationStatus = '사용자 게시 승인 · 공식 대리점 구매·계약 기반 사용';

// 사이트용 사본은 흰 여백을 잘라내고 가장자리 4%만 남겼다(resolution은 사이트 사본 기준). 조사 원본은 docs/research/group2-images/에 그대로 있다.
// scope: 'series'는 제조사가 같은 계열 여러 모델에 함께 쓰는 사진이다.
// 8개 전부 상세페이지로 전환되어(2026-09-26) group1-images.mjs로 이동했다. 새 Group 2 제품이 생기면 여기에 추가한다.
export const group2Previews = [];

const identity = (brand, product) => `${brand.toLowerCase()}\0${product.toLowerCase()}`;
const byIdentity = new Map(group2Previews.map(entry => [identity(entry.brand, entry.product), entry]));

// 카탈로그 항목에 붙일 파생 필드. 해당 사진이 없으면 null.
export function previewCatalogFieldsFor(item) {
  const entry = byIdentity.get(identity(item.brand, item.product));
  if (!entry) return null;
  return { preview_image: entry.image.file, preview_image_alt: entry.image.alt, ...(entry.scope ? { preview_image_scope: entry.scope } : {}) };
}
