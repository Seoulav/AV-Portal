// 제조사·대리점 사이트에서 공식 매뉴얼을 찾지 못한 제품의 매뉴얼 PDF.
// 사용자(서울영상테크)가 직접 보유한 자료를 업로드한 것이며, 저작권 재검토 없이 게시하기로
// 사용자가 확정했다(2026-09-25, "저작권은 문제없어 그냥 해도돼"). 제조사 링크가 나중에
// 확인되면 이 목록에서 빼고 manual_link를 외부 URL로 되돌린다.
export const uploadNote = '사용자 업로드 자료';

// file은 beta/site/manuals/ 안의 실제 파일명이다. 확장자는 PDF만 허용한다.
// 여러 모델을 한 매뉴얼이 함께 다루는 경우(예: Crown DriveCore Install DA Series 매뉴얼)
// 같은 file을 여러 항목이 공유할 수 있다.
export const userManuals = [
  // 예시: { brand: 'Powersoft', product: 'Mezzo 322 A', file: 'mezzo-322-a-manual.pdf', title: 'Mezzo 322 A 사용설명서', note: uploadNote }
  {
    brand: 'Crown',
    product: 'DCI 4/300DA',
    file: 'crown-dci-install-da-series-manual.pdf',
    title: 'DriveCore Install DA Series Manual (5072439-C, 2022) — DCi 4|300DA·4|600DA·4|1250DA·8|300DA·8|600DA 공용',
    note: uploadNote
  },
  {
    brand: 'Crown',
    product: 'DCI 4/600DA',
    file: 'crown-dci-install-da-series-manual.pdf',
    title: 'DriveCore Install DA Series Manual (5072439-C, 2022) — DCi 4|300DA·4|600DA·4|1250DA·8|300DA·8|600DA 공용',
    note: uploadNote
  },
  {
    brand: 'Magnimage',
    product: 'LED-780H',
    file: 'magnimage-led-780h-user-manual.pdf',
    title: 'LED-780H User Manual V2.1',
    note: '제조사 공식 웹사이트(magnimage.com)에서 확보. 다운로드 자산이 referer 화이트리스트로 보호되어 있어 이 사이트에서 직접 링크하면 방문자에게 접근 거부가 발생한다 — 그래서 사용자가 업로드했다.'
  }
];

export const identity = (brand, product) => `${brand.toLowerCase()}\0${product.toLowerCase()}`;
const byIdentity = new Map(userManuals.map(entry => [identity(entry.brand, entry.product), entry]));

// 카탈로그 항목에 붙일 manual_link 값. 해당 업로드가 없으면 null.
export function userManualLinkFor(item) {
  const entry = byIdentity.get(identity(item.brand, item.product));
  if (!entry) return null;
  return `./manuals/${entry.file}`;
}

// 제품 자체의 매뉴얼은 아니지만 함께 참고할 부속 자료(예: 여러 모델을 함께 다루는
// 브라켓 설치 핸드북). brand/product는 target(여러 제품에 매핑될 수 있는 하나의 파일)이 아니라
// 이 참고자료가 붙는 카탈로그 항목 각각을 기준으로 한 줄씩 적는다.
export const userReferences = [
  {
    brand: 'JBL',
    product: 'AC18/95',
    file: 'jbl-ae-series-u-bracket-handbook.pdf',
    title: 'AE Series U-Bracket Handbook (브라켓 설치·치수 참고자료, AC18 외 다수 모델 공용)',
    note: uploadNote
  },
  {
    brand: 'JBL',
    product: 'AC18/26',
    file: 'jbl-ae-series-u-bracket-handbook.pdf',
    title: 'AE Series U-Bracket Handbook (브라켓 설치·치수 참고자료, AC18 외 다수 모델 공용)',
    note: uploadNote
  }
];

const referencesByIdentity = new Map(userReferences.map(entry => [identity(entry.brand, entry.product), entry]));

// 카탈로그 항목에 붙일 reference_link 값. 해당 참고자료가 없으면 null.
export function userReferenceLinkFor(item) {
  const entry = referencesByIdentity.get(identity(item.brand, item.product));
  if (!entry) return null;
  return `./manuals/${entry.file}`;
}
