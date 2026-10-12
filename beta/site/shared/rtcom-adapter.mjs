export const RTCOM_PUBLIC_BASE = 'https://seoulav.github.io/rtcom-configurator/';
export const AV_PORTAL_DETAIL_BASE = 'https://seoulav.github.io/AV-Portal/detail/';
export const RTCOM_DOCUMENT_BASE = `${RTCOM_PUBLIC_BASE}output/design/assets/docs/`;
export const RTCOM_IMAGE_BASE = `${RTCOM_PUBLIC_BASE}output/design/assets/products/`;
export const RTCOM_EXCLUDED_MODELS = Object.freeze(['HS-88M-U', 'HS-88MX', 'HD-D104U', 'HD-D108U']);

const excludedModels = new Set(RTCOM_EXCLUDED_MODELS.map(value => value.toUpperCase()));
const validId = value => typeof value === 'string' && /^[a-z0-9-]+$/.test(value);
const plainText = value => String(value ?? '').replaceAll('**', '').trim();
const normalizeNewlines = value => String(value ?? '').replaceAll('\r\n', '\n');
const productIdentity = product => [product.model, product.productName, product.id].filter(Boolean).map(value => String(value).trim().toUpperCase());

export function rtcomSlug(id) {
  if (!validId(id)) throw new Error(`RTCOM id 형식이 올바르지 않습니다: ${id ?? ''}`);
  return `rtcom-${id}`;
}

export function rtcomSourceUrl(id) {
  if (!validId(id)) throw new Error(`RTCOM id 형식이 올바르지 않습니다: ${id ?? ''}`);
  return `${RTCOM_PUBLIC_BASE}#products/${id}`;
}

export function isExcludedRtcomProduct(product = {}) {
  return productIdentity(product).some(value => excludedModels.has(value));
}

export function validateRtcomIndex(index, { existingSlugs = [] } = {}) {
  if (!index || index.schema !== 'rtcom.products.v1') throw new Error('RTCOM schema가 rtcom.products.v1이 아닙니다.');
  if (!Array.isArray(index.products)) throw new Error('RTCOM products 배열이 없습니다.');
  if (!index.groups || typeof index.groups !== 'object' || Array.isArray(index.groups) || !Object.keys(index.groups).length) throw new Error('RTCOM groups 객체가 비어 있습니다.');
  for (const [key, label] of Object.entries(index.groups)) {
    if (!key.trim() || key === 'all' || typeof label !== 'string' || !label.trim()) throw new Error(`RTCOM group 이름 또는 키가 올바르지 않습니다: ${key}`);
  }
  if (index.detailPath !== 'data/products/{id}.json') throw new Error('RTCOM detailPath 형식이 올바르지 않습니다.');
  if (index.imagePath !== 'output/design/assets/products/{file}') throw new Error('RTCOM imagePath 형식이 올바르지 않습니다.');
  const ids = new Set();
  const occupied = new Set(existingSlugs);
  const products = [];
  const excluded = [];
  for (const product of index.products) {
    if (!validId(product?.id)) throw new Error(`RTCOM id 형식이 올바르지 않습니다: ${product?.id ?? ''}`);
    if (ids.has(product.id)) throw new Error(`RTCOM id 중복: ${product.id}`);
    ids.add(product.id);
    if (!product.productName || !product.model || !Array.isArray(product.categories)) throw new Error(`RTCOM 제품 식별 정보 누락: ${product.id}`);
    if (typeof product.group !== 'string' || !Object.hasOwn(index.groups, product.group)) throw new Error(`RTCOM product group 미등록: ${product.id}`);
    if (isExcludedRtcomProduct(product)) { excluded.push(product); continue; }
    const slug = rtcomSlug(product.id);
    if (occupied.has(slug)) throw new Error(`RTCOM 상세 slug 충돌: ${slug}`);
    occupied.add(slug);
    products.push(product);
  }
  return { sourceCount: index.products.length, products, excluded };
}

export function adaptRtcomCatalog(index, options) {
  const { products } = validateRtcomIndex(index, options);
  const sourceOrder = new Map(index.products.map((product, order) => [product.id, order]));
  return products.map(product => {
    const item = {
      brand: 'RTCOM',
      product: product.productName,
      categories: [...product.categories],
      kind: 'equipment',
      official_links: [rtcomSourceUrl(product.id)],
      link_scope: product.group === 'series' ? 'series' : 'model',
      slug: rtcomSlug(product.id),
      rtcomId: product.id,
      // Use the source index position for brand sorting even if a future
      // synchronized index interleaves groups. Group choice order is separate.
      brandSort: { group: product.group, order: sourceOrder.get(product.id) },
      ...(product.group === 'series' ? { configurator_link: 'https://seoulav.github.io/rtcom-configurator/#matrix-configurator' } : {}),
      aliases: [...new Set([product.model, product.productName].filter(Boolean))],
      cardSummary: plainText(product.korean)
    };
    if (product.cardImage) item.cardImage = {
      src: `./rtcom/images/${product.cardImage}`,
      alt: `RTCOM ${product.model}`,
      note: 'RTCOM 공개 제품 이미지'
    };
    return item;
  });
}

export function combinePublicCatalog(avCatalog, rtcomIndex) {
  const existingSlugs = avCatalog.map(item => item.slug).filter(Boolean);
  return rtcomIndex ? [...avCatalog, ...adaptRtcomCatalog(rtcomIndex, { existingSlugs })] : [...avCatalog];
}

export function combinedCatalogSource(avCatalogRaw, rtcomIndexRaw = '') {
  return `${normalizeNewlines(avCatalogRaw)}\0${normalizeNewlines(rtcomIndexRaw)}`;
}

const mapDocumentType = type => type === 'Manual' ? 'User Manual' : type;

const rtcomOfficialUrl = url => {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.hostname !== 'rtcomav.com' ||
      parsed.username || parsed.password || parsed.pathname !== '/kor/bbs/board.php' ||
      !parsed.searchParams.has('bo_table') || !parsed.searchParams.has('wr_id')) {
    throw new Error(`RTCOM 공식 링크 출처가 올바르지 않습니다: ${url}`);
  }
  return parsed.href;
};

const adaptPortMaps = raw => {
  if (!raw.portMap) return [];
  const sourceMaps = Array.isArray(raw.portMap) ? raw.portMap : [raw.portMap];
  return sourceMaps.map(map => {
    const image = raw.images?.find(item => map.file ? item.file === map.file : item.role === map.image);
    if (!image || image.role !== map.image) throw new Error(`RTCOM Port Map 이미지 불일치: ${raw.id}`);
    const size = /^(\d+)\s*[×x]\s*(\d+)$/i.exec(image.resolution ?? '');
    if (!size) throw new Error(`RTCOM Port Map 이미지 크기 누락: ${raw.id} ${image.file}`);
    return {
      image: image.role, imageFile: image.file,
      // The configurator treats an omitted side as top; Portal defaults it to bottom.
      items: map.items.map(item => ({ ...structuredClone(item), side: item.side ?? 'top' })),
      measuredImage: { file: image.file, width: Number(size[1]), height: Number(size[2]) },
      ...(map.title ? { title: map.title } : {}),
      ...(map.note ? { note: map.note } : {}),
      ...(map.basis ? { basis: map.basis } : {}),
      ...(map.displayWidth ? { displayWidth: map.displayWidth } : {})
    };
  });
};

const adaptSettings = raw => {
  const settings = [];
  if (raw.videoModes?.modes?.length) settings.push({
    kind: 'modes', title: '비디오 모드',
    items: raw.videoModes.modes.map(mode => ({
      name: mode.name, summary: mode.summary,
      detail: [mode.detail, mode.layouts?.length ? `레이아웃: ${mode.layouts.join(' · ')}` : '',
        mode.page ? `원본 ${mode.page}쪽` : '', raw.videoModes.source ? `출처 ${raw.videoModes.source}` : ''].filter(Boolean).join(' · ')
    }))
  });
  if (raw.audioOutFlow) settings.push({
    kind: 'table', title: '오디오 출력 선택',
    columns: ['구분', '선택 경로', '출처'],
    rows: [[raw.audioOutFlow.tag, raw.audioOutFlow.caption, raw.audioOutFlow.source]]
  });
  if (raw.lineup?.length) settings.push({
    kind: 'table', title: '제품군 구성',
    columns: ['모델', '종류', '구성·사양', 'RU'],
    rows: raw.lineup.map(item => [item.model, item.kind, item.summary,
      item.rackUnits == null ? '—' : String(item.rackUnits)])
  });
  return settings;
};

export function adaptRtcomDetail(raw) {
  if (!raw || !validId(raw.id) || raw.manufacturer !== 'RTCOM') throw new Error('RTCOM 상세 식별 정보가 올바르지 않습니다.');
  if (!raw.productName || !raw.model || !Array.isArray(raw.categories)) throw new Error(`RTCOM 상세 필수 정보 누락: ${raw.id}`);
  const sourceUrl = rtcomSourceUrl(raw.id);
  const portMaps = adaptPortMaps(raw);
  const settings = adaptSettings(raw);
  const documents = [{
    type: 'Official Product Page', status: 'FOUND', title: '알티컴 제품정보', url: sourceUrl, language: 'ko'
  }, ...(raw.documents ?? []).map(document => {
    const mapped = { ...document, type: mapDocumentType(document.type) };
    if (document.file) mapped.url = new URL(document.file, RTCOM_DOCUMENT_BASE).href;
    delete mapped.file;
    return mapped;
  }), ...(raw.officialLinks ?? []).map(link => ({
    type: 'Official Link', status: 'FOUND', title: link.label, url: rtcomOfficialUrl(link.url), language: 'ko'
  }))];
  const images = (raw.images ?? []).map(image => ({
    ...image,
    sourceUrl: image.sourceUrl ?? new URL(image.file, RTCOM_IMAGE_BASE).href
  }));
  const related = (raw.related ?? []).map(item => ({
    ...item,
    productName: item.productName ?? item.target,
    url: item.target && validId(item.target) ? `${AV_PORTAL_DETAIL_BASE}?product=${rtcomSlug(item.target)}` : undefined
  }));
  const presentation = {
    ...(raw.presentation ?? {}),
    imageBase: '../rtcom/images/',
    sourceId: raw.id,
    sourceProductLabel: '알티컴 제품정보에서 자세히 보기 ↗',
    sourceProductUrl: sourceUrl,
    visualVariant: 'official-product-images'
  };
  const result = {
    manufacturer: raw.manufacturer,
    productName: raw.productName,
    model: raw.model,
    ...(raw.series ? { series: raw.series } : {}),
    ...(raw.seriesNote ? { seriesNote: raw.seriesNote } : {}),
    ...(raw.itemType ? { itemType: raw.itemType } : {}),
    categories: [...raw.categories],
    english: plainText(raw.subtitle || raw.english),
    korean: plainText(raw.lead || raw.korean),
    overview: plainText(raw.overview),
    verificationSummary: plainText(raw.verificationSummary),
    packageStatus: raw.packageStatus ?? 'REVIEW REQUIRED',
    images,
    imageStatuses: structuredClone(raw.imageStatuses ?? []),
    documents,
    ...(portMaps.length ? { portMap: portMaps[0], portMaps } : {}),
    ...(settings.length ? { settings } : {}),
    features: structuredClone(raw.features ?? []),
    specifications: structuredClone(raw.specifications ?? []),
    io: structuredClone(raw.io ?? []),
    related,
    sources: structuredClone(raw.sources ?? []),
    issues: structuredClone(raw.issues ?? []),
    presentation
  };
  return result;
}
