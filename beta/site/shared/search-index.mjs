const CONFIRMED = new Set(['VERIFIED', 'FOUND', 'READY']);
const confirmed = entry => !entry.verification || CONFIRMED.has(entry.verification);

export function publicDetailSearchTerms(detail) {
  return [
    ...(detail.features ?? []).map(value => value.text),
    ...(detail.specifications ?? []).filter(confirmed).flatMap(value => [value.name, value.value, value.group]),
    ...(detail.io ?? []).filter(confirmed).flatMap(value => [value.connector, value.signal, value.protocol, value.group])
  ].filter(Boolean);
}

export function publicCardSummary(detail) {
  return typeof detail?.korean === 'string' ? detail.korean.trim() : '';
}

export function previewCardImage(item) {
  if (item.slug || !item.preview_image) return null;
  return { src: `./detail/images/${item.preview_image}`, alt: item.preview_image_alt, note: item.preview_image_scope === 'series' ? '제조사 공식 이미지 · 계열 공용' : '제조사 공식 이미지' };
}

export function detailSearchEntry(item, detail) {
  const entry = {
    slug: item.slug,
    aliases: [detail.model, detail.productName, detail.series].filter(Boolean),
    searchTerms: publicDetailSearchTerms(detail),
    cardSummary: publicCardSummary(detail)
  };
  const card = detail.images?.find(image => image.file === item.card_image);
  if (card) entry.cardImage = { src: `./detail/images/${card.file}`, alt: card.alt, note: '제조사 공식 이미지' };
  return entry;
}

export function applySearchIndex(items, index, catalogHash) {
  if (index?.schema !== 'avportal.search-index.v1' || !Array.isArray(index.items)) throw new Error('검색 인덱스 형식 오류');
  if (catalogHash && index.catalogSha256 !== catalogHash) throw new Error('검색 인덱스가 카탈로그와 다름');
  const expected = new Set(items.filter(item => item.slug).map(item => item.slug));
  if (index.items.length !== expected.size) throw new Error('검색 인덱스 제품 수 불일치');
  const found = new Map();
  for (const entry of index.items) {
    if (!expected.has(entry.slug) || found.has(entry.slug) || !Array.isArray(entry.aliases) || !entry.aliases.every(value => typeof value === 'string') || !Array.isArray(entry.searchTerms) || !entry.searchTerms.every(value => typeof value === 'string') || typeof entry.cardSummary !== 'string') throw new Error('검색 인덱스 항목 오류');
    if (entry.cardImage && (typeof entry.cardImage.src !== 'string' || typeof entry.cardImage.alt !== 'string' || typeof entry.cardImage.note !== 'string')) throw new Error('검색 인덱스 이미지 오류');
    found.set(entry.slug, entry);
  }
  for (const item of items) {
    item.slug = item.slug ?? null;
    item.searchTerms = [];
    const preview = previewCardImage(item);
    if (preview) item.cardImage = preview;
    if (!item.slug) continue;
    const entry = found.get(item.slug);
    item.aliases = entry.aliases;
    item.searchTerms = entry.searchTerms;
    item.cardSummary = entry.cardSummary;
    if (entry.cardImage) item.cardImage = entry.cardImage;
  }
  return items;
}
