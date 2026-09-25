const clean = value => String(value ?? '').trim().replace(/^`|`$/g, '');
const present = value => !['', '—', 'MISSING'].includes(clean(value));
const https = value => {
  const raw = clean(value);
  if (!/^https:\/\/[^\s]+$/.test(raw)) return undefined;
  try {
    const url = new URL(raw);
    return url.username || url.password ? undefined : url.href;
  } catch { return undefined; }
};
const section = (source, heading) => {
  const markdown = source.replaceAll('\r\n', '\n');
  const start = markdown.indexOf(`## ${heading}\n`);
  if (start < 0) throw new Error(`${heading} 섹션이 없습니다.`);
  const body = markdown.slice(start + heading.length + 4);
  return body.split(/\n## /, 1)[0];
};
const rows = body => {
  const lines = body.split(/\r?\n/);
  const first = lines.findIndex(line => line.startsWith('|'));
  if (first < 0) return [];
  return lines.slice(first).filter(line => line.startsWith('|'))
    .slice(2).map(line => line.slice(1, -1).split(/(?<!\\)\|/).map(value => clean(value.replaceAll('\\|', '|'))));
};
const field = (table, name) => table.find(row => row[0] === name) ?? [];

export function parseGroup1Package(markdown) {
  const header = rows(section(markdown, 'A. Product Header'));
  const page = field(header, 'Official Product Page');
  const pageUrl = https(page[1]);
  const docRows = rows(section(markdown, 'C. Quick Documents'));
  const typeMap = { Manual: 'User Manual', '시방서': 'Independent Specification', '사양서': 'Specification', '기술문서': 'Technical Document' };
  const documents = docRows.map(([type, status, title, source, language, revision, applicability, note]) => ({
    type: typeMap[type], status, title: present(title) ? title : `${type} 미확인`,
    ...(https(source) ? { url: https(source) } : {}),
    language: present(language) && language !== 'REVIEW REQUIRED' ? language : '언어 미확인',
    note: [revision, applicability, note].filter(present).join(' · ')
  }));
  if (documents.length !== 4 || documents.some(doc => !doc.type)) throw new Error('Quick Documents 네 슬롯이 필요합니다.');
  documents.push({ type: 'Official Product Page', status: page[2]?.startsWith('VERIFIED') ? 'VERIFIED' : 'REVIEW REQUIRED', title: '공식 제품 페이지', ...(pageUrl ? { url: pageUrl } : {}) });
  const imageStatuses = rows(section(markdown, 'B. Image Gallery'))
    .map(([role, status, source, modelMatch, resolution, publication]) => ({ role, status, sourceUrl: https(source), modelMatch, resolution, publication }));
  const features = section(markdown, 'Features').split(/\r?\n/).filter(line => /^\d+\. /.test(line)).map(line => ({ text: line.replace(/^\d+\. /, ''), source: '' }));
  const specifications = rows(section(markdown, 'Specifications'))
    .map(([group, name, value, unit, condition, source, verification]) => ({ group, name, value, unit: present(unit) ? unit : '', condition: present(condition) ? condition : '', source: present(source) ? source : '', verification }));
  const io = rows(section(markdown, 'I/O'))
    .map(([group, connector, signal, direction, quantity, protocol, availability, condition, source, verification]) => ({
      group, connector, signal, direction, quantity, protocol, availability, condition: present(condition) ? condition : '', source: present(source) ? source : '', verification
    }));
  const issues = section(markdown, 'Remaining Review').split(/\r?\n/).filter(line => line.startsWith('- '))
    .map((line, index) => ({ code: `R${index + 1}`, status: line.includes('CONFLICTED') ? 'CONFLICTED' : 'REVIEW REQUIRED', title: '추가 검토', detail: line.slice(2).replaceAll('`', '') }));
  const productId = /- Product ID: `([^`]+)`/.exec(markdown)?.[1];
  const packageStatus = /- Package status: `([^`]+)`/.exec(markdown)?.[1];
  if (!productId || !packageStatus || !pageUrl) throw new Error('제품 ID·패키지 상태·공식 제품 페이지가 필요합니다.');
  const overview = section(markdown, 'Overview').trim();
  const legend = /^출처:\s*(.+)$/m.exec(markdown)?.[1] ?? '';
  const sourceUrls = {
    P: pageUrl,
    M: documents.find(item => item.type === 'User Manual' && item.status === 'FOUND')?.url,
    RM: documents.find(item => item.type === 'User Manual' && item.status === 'FOUND')?.url,
    S: documents.find(item => item.type === 'Specification' && item.status === 'FOUND')?.url,
    R: documents.find(item => item.type === 'Specification' && item.status === 'FOUND')?.url,
    F: documents.find(item => item.type === 'Technical Document' && item.status === 'FOUND')?.url
  };
  const sources = [...legend.matchAll(/\*\*([A-Z]{1,3})\*\*\s*([^,\n]+)/g)].map(([, code, name]) => ({
    code, name: name.trim().replace(/\.$/, ''), ...(sourceUrls[code] ? { url: sourceUrls[code] } : {}),
    scope: code === 'P' ? (page[2] ?? '') : 'Group 1 자료 패키지의 근거 표기 · 원문 링크 미기록 항목은 링크 없음'
  }));
  const extra = /Additional Document: \[([^\]]+)\]\((https:\/\/[^)]+)\)/.exec(markdown);
  if (extra) documents.push({ type: 'Supplemental Document', title: extra[1], url: extra[2], status: 'REVIEW REQUIRED', language: '언어 미확인', note: '추가 문서 · 적용 범위 검토 필요' });
  return {
    productId, packageStatus,
    manufacturer: field(header, 'Manufacturer')[1], productName: field(header, 'Product Name')[1], model: field(header, 'Model')[1],
    series: field(header, 'Series')[1] ?? '', itemType: field(header, 'Item Type')[1] ?? '',
    categories: (field(header, 'Category')[1] ?? '').split('·').map(clean).filter(Boolean),
    english: field(header, 'Short English Description')[1] ?? '',
    korean: field(header, 'Korean Description')[1] ?? '',
    verificationSummary: field(header, 'Verification Summary')[1] ?? '',
    overview,
    images: [], imageStatuses, documents, features, specifications, io, issues,
    sources: sources.length ? sources : [{ code: 'P', name: 'Manufacturer Official · Product Page', url: pageUrl, scope: page[2] ?? '' }],
    presentation: { galleryRightsBadge: '이미지 사용 검토 중', galleryRights: '자료의 존재와 이미지 게시·핫링크 권한은 별도로 확인해야 합니다.', specIntro: '값·조건·검증 상태를 함께 표시합니다.', ioIntro: '확인된 단자와 미확인 항목을 구분합니다.' }
  };
}

// 상세 페이지가 있는 항목에만 붙는 파생 필드. 기준 목록 해시는 이 필드를 뺀 형태로 계산한다.
export const derivedCatalogFields = ['slug', 'card_image'];

export function stripDerivedCatalogFields(item) {
  const copy = { ...item };
  for (const field of derivedCatalogFields) delete copy[field];
  return copy;
}

const catalogIdentity = (brand, product) => `${brand.toLowerCase()}\0${product.toLowerCase()}`;

export function buildPreviewCatalog(publicCatalog, products, { slugOf, cardImageOf } = {}) {
  const result = publicCatalog.map(item => ({ ...stripDerivedCatalogFields(item), categories: [...item.categories], official_links: [...item.official_links] }));
  const byIdentity = new Map(result.map(item => [catalogIdentity(item.brand, item.product), item]));
  for (const product of products) {
    const identity = catalogIdentity(product.manufacturer, product.model);
    const slug = slugOf?.(product) ?? null;
    const cardImage = slug ? cardImageOf?.(product) ?? null : null;
    const detailFields = slug ? { slug, ...(cardImage ? { card_image: cardImage } : {}) } : {};
    const existing = byIdentity.get(identity);
    if (existing) { Object.assign(existing, detailFields); continue; }
    const official = product.documents.find(item => item.type === 'Official Product Page' && item.status === 'VERIFIED');
    const entry = { brand: product.manufacturer, product: product.model, categories: product.categories, kind: 'equipment', official_links: official?.url ? [official.url] : [], ...detailFields };
    result.push(entry);
    byIdentity.set(identity, entry);
  }
  return result;
}
