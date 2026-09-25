// 제조사·대리점 사이트에서 공식 매뉴얼을 찾지 못한 제품의 매뉴얼 PDF.
// 사용자(서울영상테크)가 직접 보유한 자료를 업로드한 것이며, 저작권 재검토 없이 게시하기로
// 사용자가 확정했다(2026-09-25, "저작권은 문제없어 그냥 해도돼"). 제조사 링크가 나중에
// 확인되면 이 목록에서 빼고 manual_link를 외부 URL로 되돌린다.
export const uploadNote = '사용자 업로드 자료';

// file은 beta/site/manuals/ 안의 실제 파일명이다. 확장자는 PDF만 허용한다.
export const userManuals = [
  // 예시: { brand: 'Powersoft', product: 'Mezzo 322 A', file: 'mezzo-322-a-manual.pdf', title: 'Mezzo 322 A 사용설명서', note: uploadNote }
];

const identity = (brand, product) => `${brand.toLowerCase()}\0${product.toLowerCase()}`;
const byIdentity = new Map(userManuals.map(entry => [identity(entry.brand, entry.product), entry]));

// 카탈로그 항목에 붙일 manual_link 값. 해당 업로드가 없으면 null.
export function userManualLinkFor(item) {
  const entry = byIdentity.get(identity(item.brand, item.product));
  if (!entry) return null;
  return `./manuals/${entry.file}`;
}
