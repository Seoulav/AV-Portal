export const RTCOM_PUBLIC_BASE = 'https://seoulav.github.io/rtcom-configurator/';
export const RTCOM_DOCUMENT_BASE = `${RTCOM_PUBLIC_BASE}output/design/assets/docs/`;
export const RTCOM_IMAGE_BASE = `${RTCOM_PUBLIC_BASE}output/design/assets/products/`;
export const RTCOM_EXCLUDED_MODELS = Object.freeze(['HS-88M-U', 'HS-88MX', 'HD-D104U', 'HD-D108U']);

const excludedModels = new Set(RTCOM_EXCLUDED_MODELS.map(value => value.toUpperCase()));
const validId = value => typeof value === 'string' && /^[a-z0-9-]+$/.test(value);
const plainText = value => String(value ?? '').replaceAll('**', '').trim();
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

const mapDocumentType = type => type === 'Manual' ? 'User Manual' : type;

export function adaptRtcomDetail(raw) {
  if (!raw || !validId(raw.id) || raw.manufacturer !== 'RTCOM') throw new Error('RTCOM 상세 식별 정보가 올바르지 않습니다.');
  if (!raw.productName || !raw.model || !Array.isArray(raw.categories)) throw new Error(`RTCOM 상세 필수 정보 누락: ${raw.id}`);
  const sourceUrl = rtcomSourceUrl(raw.id);
  const documents = [{
    type: 'Official Product Page', status: 'FOUND', title: '알티컴 제품정보', url: sourceUrl, language: 'ko'
  }, ...(raw.documents ?? []).map(document => {
    const mapped = { ...document, type: mapDocumentType(document.type) };
    if (document.file) mapped.url = new URL(document.file, RTCOM_DOCUMENT_BASE).href;
    delete mapped.file;
    return mapped;
  })];
  const images = (raw.images ?? []).map(image => ({
    ...image,
    sourceUrl: image.sourceUrl ?? new URL(image.file, RTCOM_IMAGE_BASE).href
  }));
  const related = (raw.related ?? []).map(item => ({
    ...item,
    productName: item.productName ?? item.target,
    url: item.target && validId(item.target) ? `../detail/?product=${rtcomSlug(item.target)}` : undefined
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
