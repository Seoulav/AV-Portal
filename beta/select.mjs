const text = value => typeof value === 'string' && value.trim() !== '';
const confirmedBody = value =>
  typeof value === 'string' &&
  (/열람 본문에 모델명 확인|공식 본문 확인/.test(value)) &&
  !/자료 탐색용 색인|제품군\/별칭 후보|제조사 미확정/.test(value);

function webPage(urlValue, hosts) {
  let url;
  try { url = new URL(urlValue); } catch { throw new Error('공식 링크 URL 형식이 올바르지 않습니다.'); }
  if (url.protocol !== 'https:' || url.username || url.password || !hosts.includes(url.hostname) ||
      !/^[a-z0-9.-]+$/i.test(url.hostname) ||
      /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname) ||
      /\.(pdf|png|jpe?g|webp|gif|svg|zip|docx?|xlsx?)(?:$|\b)/i.test(url.pathname) ||
      /(?:file:|[A-Za-z]:[\\/]|%5c)/i.test(url.search) ||
      [...url.searchParams].some(([key, value]) =>
        /^(download|file|filename|attachment|format)$/i.test(key) ||
        /\.(pdf|png|jpe?g|webp|gif|svg|zip|docx?|xlsx?)$/i.test(value))) {
    throw new Error('공식 제조사 HTTPS 웹페이지가 아닌 링크가 있습니다.');
  }
  return url.href;
}

export function selectPublicProducts(catalog, decisions) {
  if (!catalog || !Array.isArray(catalog.products) || !decisions || !Array.isArray(decisions.approved)) {
    throw new Error('목록 또는 채택 결정표 형식이 올바르지 않습니다.');
  }
  const byId = new Map(catalog.products.map(item => [item.id, item]));
  if (byId.size !== catalog.products.length) throw new Error('원본 제품 ID가 중복됩니다.');
  const selected = [];
  const used = new Set();
  const displayNames = new Set();
  for (const decision of decisions.approved) {
    if (!decision || !text(decision.id) || used.has(decision.id)) throw new Error('채택 ID가 비었거나 중복됩니다.');
    used.add(decision.id);
    const item = byId.get(decision.id);
    if (!item) throw new Error('채택 ID를 원본에서 찾을 수 없습니다.');
    if (!text(item.brand) || !text(item.product) ||
        !Array.isArray(item.categories) || !item.categories.length || !item.categories.every(text) ||
        !['SOURCE_LIST', 'RESEARCH_MATCH', undefined].includes(item.identity_status)) {
      throw new Error('브랜드·제품·분류 또는 식별 상태가 공개 기준에 맞지 않습니다.');
    }
    const displayName = `${item.brand}\0${item.product}`.toLocaleLowerCase();
    if (displayNames.has(displayName)) throw new Error('같은 브랜드·제품명이 중복됩니다.');
    displayNames.add(displayName);
    if (!Array.isArray(decision.urls) || !decision.urls.length || !Array.isArray(decision.official_hosts) ||
        !decision.official_hosts.length || !Array.isArray(item.official_sources)) {
      throw new Error('채택 공식 링크 근거가 없습니다.');
    }
    const urls = decision.urls.map(value => {
      const source = item.official_sources.find(candidate => candidate.url === value);
      if (!source || !confirmedBody(source.verification) ||
          (source.document_type ? source.document_type !== 'PRODUCT_PAGE' :
            !/\/ PRODUCT_PAGE \/(?:\s|$)/.test(source.verification))) {
        throw new Error('모델별 공식 제품 웹페이지 확인이 없는 링크입니다.');
      }
      return webPage(value, decision.official_hosts);
    });
    if (new Set(urls).size !== urls.length) throw new Error('공식 링크가 중복됩니다.');
    selected.push({
      brand: item.brand.trim(), product: item.product.trim(),
      categories: [...new Set(item.categories.map(value => value.trim()))],
      kind: item.item_type === 'SERVICE' ? 'service' : 'equipment',
      official_links: urls
    });
  }
  return selected;
}
