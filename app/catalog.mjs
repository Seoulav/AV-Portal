import { readFile } from 'node:fs/promises';

const EXCLUDED_MODELS = new Set(['HS-88M-U', 'HS-88MX', 'HD-D104U', 'HD-D108U']);
const nonBlank = value => typeof value === 'string' && value.trim().length > 0;

export function validateCatalog(data) {
  if (!data || !Array.isArray(data.products) || !data.counts) {
    throw new Error('목록 형식이 올바르지 않습니다.');
  }
  const ids = new Set();
  const rows = new Set();
  for (const item of data.products) {
    if (!item || typeof item !== 'object') throw new Error('제품 항목 형식이 올바르지 않습니다.');
    if (!nonBlank(item.id) || !nonBlank(item.product)) {
      throw new Error('제품 ID 또는 제품명이 없습니다.');
    }
    if (ids.has(item.id)) throw new Error('중복 제품 ID가 있습니다.');
    ids.add(item.id);
    if (EXCLUDED_MODELS.has(item.product.trim().toUpperCase())) throw new Error('제외 모델이 목록에 있습니다.');
    if (!Array.isArray(item.categories) || !Array.isArray(item.aliases) ||
        !Array.isArray(item.official_sources) || !Array.isArray(item.supplemental_sources) ||
        !Array.isArray(item.direct_evidence) || !Array.isArray(item.source_records) ||
        item.source_records.length === 0) {
      throw new Error('제품의 카테고리·자료·원본 행 형식이 올바르지 않습니다.');
    }
    if (item.brand !== null && !nonBlank(item.brand)) throw new Error('브랜드 형식이 올바르지 않습니다.');
    if (!item.categories.length || item.categories.some(category => !nonBlank(category))) {
      throw new Error('카테고리 항목 형식이 올바르지 않습니다.');
    }
    if (item.aliases.some(alias => !nonBlank(alias))) throw new Error('별칭 항목 형식이 올바르지 않습니다.');
    if (item.direct_evidence.some(reference => !nonBlank(reference))) {
      throw new Error('직접 제공 참조 형식이 올바르지 않습니다.');
    }
    for (const source of [...item.official_sources, ...item.supplemental_sources]) {
      if (!source || typeof source !== 'object' || !nonBlank(source.url) ||
          (source.verification != null && typeof source.verification !== 'string') ||
          (source.source_record != null && typeof source.source_record !== 'string')) {
        throw new Error('출처 항목 형식이 올바르지 않습니다.');
      }
    }
    for (const record of item.source_records) {
      if (!record || typeof record !== 'object') throw new Error('원본 행 정보가 올바르지 않습니다.');
      if (!nonBlank(record.record_id) || !nonBlank(record.sheet) || !Number.isInteger(record.row) || record.row < 1) {
        throw new Error('원본 행 정보가 올바르지 않습니다.');
      }
      if (rows.has(record.record_id)) throw new Error('중복 원본 행 ID가 있습니다.');
      rows.add(record.record_id);
    }
  }
  if (data.counts.catalog_entries !== ids.size) throw new Error('제품 수가 목록 집계와 다릅니다.');
  if (data.counts.source_item_rows !== rows.size) throw new Error('원본 행 수가 목록 집계와 다릅니다.');
  return data;
}

export async function loadCatalog(path) {
  let content;
  try {
    content = await readFile(path, 'utf8');
  } catch {
    throw new Error('목록 파일을 읽을 수 없습니다. AV_PORTAL_PRODUCT_LIST_PATH를 확인하세요.');
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('목록 JSON 형식이 올바르지 않습니다.');
  }
  return validateCatalog(parsed);
}
