export const UNKNOWN_BRAND = '__unknown__';

const fold = (value) => String(value ?? '').normalize('NFKC').toLocaleLowerCase();

export function filterProducts(products, { query = '', brand = '', categories = [] } = {}) {
  const terms = fold(query).trim().split(/\s+/).filter(Boolean);
  const chosen = new Set(categories);
  return products.filter(item => {
    if (brand && (item.brand ?? UNKNOWN_BRAND) !== brand) return false;
    if (chosen.size && !item.categories.some(category => chosen.has(category))) return false;
    const searchable = fold([item.brand, item.product, ...item.aliases].filter(Boolean).join(' '));
    return terms.every(term => searchable.includes(term));
  });
}

export function listFacets(products) {
  const brands = new Map();
  const categories = new Map();
  for (const item of products) {
    const brand = item.brand ?? UNKNOWN_BRAND;
    brands.set(brand, (brands.get(brand) ?? 0) + 1);
    for (const category of new Set(item.categories)) {
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }
  }
  return {
    brands: [...brands].map(([value, count]) => ({
      value, label: value === UNKNOWN_BRAND ? '브랜드 미식별' : value, count
    })).sort((a, b) => a.label.localeCompare(b.label, 'ko')),
    categories: [...categories].map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  };
}

// Only an explicitly recorded language is used for priority; URL locale is not proof.
export function prioritizeOfficialSources(sources) {
  return sources.map((source, order) => ({ source, order }))
    .sort((a, b) => (a.source.language === 'ko' ? 0 : 1) -
      (b.source.language === 'ko' ? 0 : 1) || a.order - b.order)
    .map(({ source }) => source);
}

export function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function verificationLabel(value) {
  const labels = {
    INHERITED_RESEARCH: '기존 조사 연결 · 재확인 필요',
    'OFFICIAL_SUPPORT_LISTING_2026-09-23_NOT_MANUFACTURER_PROOF': '공식 지원 목록 등재 · 제조사 미확정',
    'SEARCH_INDEX_2026-09-23': '검색 색인 연결 · 재확인 필요'
  };
  return labels[value] ?? (value || '검증 상태 미기록');
}

const resourceGroupOrder = [
  '제품 페이지·지원', '사양서·카탈로그', '매뉴얼', '제어 자료', '기타 자료'
];
const resourceKinds = {
  PRODUCT_PAGE: '제품 페이지', PRODUCT_FAMILY_INDEX: '제품군 색인', SUPPORT_INDEX: '지원 색인',
  DATASHEET: '사양서', CATALOG: '카탈로그',
  MANUAL: '매뉴얼', MANUAL_INDEX: '매뉴얼 색인',
  CONTROL: '제어 자료', CONTROL_DOCUMENT: '제어 자료',
  DOCUMENT: '문서', SUPPLEMENTAL_DOCUMENT: '보조 문서',
  REFERENCE: '참조', UNCLASSIFIED: '분류 미확정'
};
const authorityLabels = {
  OFFICIAL: '제조사 공식',
  MANUFACTURER_DIRECT: '제조사 직접 제공 · 로컬 보관 · 파일 열기 미지원',
  SUPPLEMENTAL: '지정 보조 출처'
};
const verificationLabels = {
  CONTENT_VIEWED: '본문 열람 · 내용/적용 확인 별도',
  FILENAME_MATCH_BODY_UNREAD: '파일명 일치 후보 · 본문 미확인',
  INHERITED_NOT_RECHECKED: '기존 조사 연결 · 재확인 필요',
  OPENED_APPLICABILITY_UNCONFIRMED: '페이지 열람 · 적용 모델 미확인',
  OPENED_MODEL_TEXT_MATCH: '본문 모델명 출현 · 사양/적용 미확인',
  REFERENCE_ONLY: '참조만 확보 · 본문 미확인',
  SEARCH_INDEX_ONLY_OPEN_FAILED: '검색 색인 확인 · 원문 열람 실패',
  SEARCH_MODEL_MATCH_ONLY: '검색 결과 모델명 일치 · 원문 미확인',
  SEARCH_MODEL_MATCH_OPEN_FAILED: '검색 결과 모델명 일치 · 원문 열람 실패'
};
const applicabilityLabels = {
  CANDIDATE: '연결 후보 · 적용 미확정',
  EXACT_MODEL: '대장 표기: 해당 모델 · 세부 적용 별도 확인',
  EXACT_MODEL_INDEX: '대장 표기: 해당 모델 색인 · 자료 적용 별도 확인',
  EXACT_MODEL_ON_SERIES_PAGE: 'Series 페이지에 모델명 표기 · 적용 별도 확인',
  EXACT_MODEL_SECTION: '문서의 모델 구역 표기 · 개정/적용 별도 확인',
  FAMILY_OR_ALIAS_CANDIDATE: '제품군/별칭 후보 · 정확 모델 미확정',
  FILENAME_CANDIDATE: '파일명 일치 후보 · 적용 미확정',
  SEARCH_EXCERPT_MODEL_MATCH: '검색 발췌 모델명 일치 · 원문/적용 미확인',
  TITLE_OR_URL_MODEL_MATCH: '제목/URL 모델명 일치 · 원문/적용 미확인',
  UNASSESSED: '적용 모델 미확인'
};
const safeCodePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const pathText = /(?:[A-Za-z]:[\\/]|^\/|^\\\\|[\\/](?:Users|home|private|AppData|Desktop)[\\/])/i;

function safeLabel(value, known, missing) {
  if (Object.hasOwn(known, value)) return known[value];
  if (typeof value === 'string' && safeCodePattern.test(value)) return `${value} · 해석 미등록`;
  return missing;
}

function groupFor(kind) {
  if (['PRODUCT_PAGE', 'PRODUCT_FAMILY_INDEX', 'SUPPORT_INDEX'].includes(kind)) return resourceGroupOrder[0];
  if (['DATASHEET', 'CATALOG'].includes(kind)) return resourceGroupOrder[1];
  if (['MANUAL', 'MANUAL_INDEX'].includes(kind)) return resourceGroupOrder[2];
  if (['CONTROL', 'CONTROL_DOCUMENT'].includes(kind)) return resourceGroupOrder[3];
  return resourceGroupOrder[4];
}

function resourceLanguageRank(language) {
  if (language === 'ko') return 0;
  if (language === 'en') return 1;
  if (language) return 2;
  return 3;
}

export function groupResources(items) {
  const groups = new Map(resourceGroupOrder.map(label => [label, []]));
  items.forEach((item, order) => groups.get(groupFor(item.kind)).push({ item, order }));
  return [...groups].filter(([, values]) => values.length).map(([label, values]) => ({
    label,
    items: values.sort((a, b) =>
      resourceLanguageRank(a.item.language) - resourceLanguageRank(b.item.language) || a.order - b.order
    ).map(({ item }) => item)
  }));
}

export function resourceDisplay(item) {
  const title = typeof item.title === 'string' && item.title.trim() && !pathText.test(item.title)
    ? item.title.trim() : '자료 제목 확인 필요';
  return {
    resource_id: safeCodePattern.test(item.resource_id ?? '') ? item.resource_id : null,
    title,
    kind: safeLabel(item.kind, resourceKinds, '종류 미확인'),
    authority: safeLabel(item.authority, authorityLabels, '출처 미확인'),
    language: item.language === 'ko' ? '한국어' : item.language === 'en' ? '영어' :
      item.language && safeCodePattern.test(item.language) ? `${item.language} · 언어 해석 미등록` : '언어 미확인',
    revision: item.revision && !pathText.test(item.revision) ? `개정 ${item.revision}` : '개정 미확인',
    checked_on: item.checked_on && !pathText.test(item.checked_on) ? `확인일 ${item.checked_on}` : '확인일 미확인',
    verification: safeLabel(item.verification, verificationLabels, '확인 수준 미기록'),
    applicability: safeLabel(item.applicability, applicabilityLabels, '적용 모델 미확인'),
    kind_basis: item.kind_basis === 'TITLE_URL_CLASSIFICATION' ? '제목·URL 기준 분류' :
      item.kind_basis && safeCodePattern.test(item.kind_basis) ? `${item.kind_basis} · 분류 근거 해석 미등록` : null,
    url: safeHttpUrl(item.url)
  };
}
