/**
 * 열린 견적의 품목 단가를 **지금 카탈로그 판매가**로 다시 붙인다
 * (B-20261016-06 — 가격표를 새로 불러오거나 지운 뒤 사람이 누를 때만).
 *
 * 견적 행은 품목을 고를 때의 단가를 들고 있다. 가격표를 바꿔도 열린 견적이
 * 조용히 바뀌지 않게, 이 함수는 사람이 「열린 견적에 가격표 단가 적용」을
 * 눌렀을 때만 돈다(실행 취소할 수 있다).
 *
 * 바꾸는 것은 `sellingUnitPrice` 하나다. 품목·수량·노무는 그대로다.
 *   - 카탈로그 판이 문서와 다르면 아무것도 바꾸지 않는다(SKU가 다른 품목일 수 있다).
 *   - 행의 품목(productId·단위)이 카탈로그 품목과 다르면 그 행은 그대로 둔다.
 *   - 파생 단가 품목(`배관 기타자재` 등)은 견적 시점에 계산되므로 건드리지 않는다.
 *   - 가격표에 판매가가 없으면 단가를 비운다 — **미등록이지 0이 아니다**(설계서 §5.6).
 *
 * 이 함수는 판매가만 본다. 원가는 받지도 쓰지도 않는다.
 */
import type { Catalog } from '../../data/catalog/load';
import type { QuoteDocument } from './types';

export interface RepriceResult {
  document: QuoteDocument;
  /** 단가가 바뀐 행 수(새로 붙음·바뀜·비워짐). */
  changed: number;
  /** 카탈로그 판이 달라 아무것도 하지 않았다. */
  basisMismatch: boolean;
}

export function repriceFromCatalog(document: QuoteDocument, catalog: Catalog): RepriceResult {
  if (document.versions.catalog !== catalog.sourceSha256) {
    return { document, changed: 0, basisMismatch: true };
  }
  const bySku = new Map(catalog.products.map((p) => [p.sku, p]));
  let changed = 0;
  const rows = document.rows.map((row) => {
    if (row.type !== 'item' || row.sku === undefined) return row;
    const product = bySku.get(row.sku);
    if (product === undefined || product.productId !== row.productId || product.unit !== row.unit) return row;
    if (product.options['pricing'] === 'derived') return row;
    const price = catalog.prices.get(row.sku);
    if (price === row.sellingUnitPrice) return row;
    changed += 1;
    const { sellingUnitPrice: _old, ...rest } = row;
    return price === undefined ? rest : { ...rest, sellingUnitPrice: price };
  });
  return changed === 0 ? { document, changed, basisMismatch: false } : { document: { ...document, rows }, changed, basisMismatch: false };
}
