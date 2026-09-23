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
