import { readFile } from 'node:fs/promises';

const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const codePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const privatePath = /(?:^\/|^\\\\|file:\/\/|(?:^|[\s=("'?&])(?:[A-Za-z]:[\\/]|\/(?:Users|home|private|tmp|mnt|var)\/|\\\\))/i;
const nonBlank = value => typeof value === 'string' && value.trim().length > 0;

function invalid() {
  throw new Error('자료대장 형식이 올바르지 않습니다.');
}

function validId(value) {
  return typeof value === 'string' && idPattern.test(value);
}

function optionalString(value) {
  if (value == null) return true;
  return typeof value === 'string';
}

function safeText(value) {
  if (!nonBlank(value) || privatePath.test(value)) return null;
  const trimmed = value.trim();
  return trimmed.length <= 240 ? trimmed : null;
}

function safeCode(value) {
  if (!nonBlank(value)) return null;
  const code = value.trim();
  return code.length <= 100 && codePattern.test(code) ? code : null;
}

function safeTitle(value) {
  return safeText(value) ?? '자료 제목 확인 필요';
}

function safeExternalUrl(value) {
  if (!nonBlank(value)) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (privatePath.test(decoded)) return null;
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function languageRank(value) {
  if (value === 'ko') return 0;
  if (value === 'en') return 1;
  if (value) return 2;
  return 3;
}

export function validateResourceRegister(data, catalog) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.products) ||
      !Array.isArray(data.resources) || !Array.isArray(data.product_resource_links) ||
      !catalog || !Array.isArray(catalog.products)) invalid();

  const catalogIds = new Set(catalog.products.map(item => item?.id));
  if (catalogIds.size !== catalog.products.length || [...catalogIds].some(id => !validId(id))) invalid();

  const productIds = new Map();
  for (const product of data.products) {
    if (!product || !validId(product.product_id) || !Array.isArray(product.resource_ids) ||
        productIds.has(product.product_id) || !catalogIds.has(product.product_id)) invalid();
    const ids = new Set();
    for (const id of product.resource_ids) {
      if (!validId(id) || ids.has(id)) invalid();
      ids.add(id);
    }
    productIds.set(product.product_id, ids);
  }
  if (productIds.size !== catalogIds.size) invalid();

  const resources = new Map();
  for (const resource of data.resources) {
    if (!resource || !validId(resource.resource_id) || resources.has(resource.resource_id) ||
        !optionalString(resource.title) || !optionalString(resource.url) ||
        !optionalString(resource.authority) || !optionalString(resource.kind) ||
        !optionalString(resource.kind_basis) || !optionalString(resource.language) ||
        !optionalString(resource.revision) || !optionalString(resource.verification) ||
        !optionalString(resource.checked_on)) invalid();
    resources.set(resource.resource_id, {
      resource_id: resource.resource_id,
      title: safeTitle(resource.title),
      authority: safeCode(resource.authority),
      kind: safeCode(resource.kind),
      kind_basis: safeCode(resource.kind_basis),
      url: safeExternalUrl(resource.url),
      language: safeText(resource.language),
      revision: safeText(resource.revision),
      verification: safeCode(resource.verification),
      checked_on: safeText(resource.checked_on)
    });
  }

  const linksByProduct = new Map([...productIds.keys()].map(id => [id, new Map()]));
  let associationCount = 0;
  for (const link of data.product_resource_links) {
    if (!link || !validId(link.product_id) || !validId(link.resource_id) ||
        !optionalString(link.applicability) || !productIds.has(link.product_id) ||
        !resources.has(link.resource_id)) invalid();
    const links = linksByProduct.get(link.product_id);
    const rawApplicability = link.applicability ?? null;
    const applicability = safeCode(rawApplicability);
    if (links.has(link.resource_id)) {
      if (links.get(link.resource_id).raw !== rawApplicability) invalid();
      continue;
    }
    links.set(link.resource_id, { raw: rawApplicability, public: applicability });
    associationCount++;
  }
  for (const [productId, resourceIds] of productIds) {
    const links = linksByProduct.get(productId);
    if (links.size !== resourceIds.size || [...resourceIds].some(id => !links.has(id))) invalid();
  }

  return {
    productCount: productIds.size,
    resourceCount: resources.size,
    associationCount,
    resourcesFor(productId) {
      const links = linksByProduct.get(productId);
      if (!links) return [];
      return [...links].map(([resourceId, status], order) => ({
        ...resources.get(resourceId), applicability: status.public, order
      })).sort((a, b) => languageRank(a.language) - languageRank(b.language) || a.order - b.order)
        .map(({ order, ...item }) => item);
    }
  };
}

export async function loadResourceIndex(path, catalog) {
  let content;
  try {
    content = await readFile(path, 'utf8');
  } catch {
    throw new Error('자료대장 파일을 읽을 수 없습니다.');
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('자료대장 JSON 형식이 올바르지 않습니다.');
  }
  return validateResourceRegister(parsed, catalog);
}
