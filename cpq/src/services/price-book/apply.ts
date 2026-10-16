/**
 * 저장된 가격표(원가)를 앱에 적용한다 (B-20261016-06, 2026-10-16 「공개 유지안」).
 *
 *   판매가 → 공개 `prices.json` 그대로(`catalog.prices`). 가격표는 판매가를 바꾸지 않는다.
 *   원가   → 원가 세션 — 영업팀용(0) 출력과 화면의 원가 영역에만 쓴다.
 *
 * 견적 단가표(`products.json`)가 바뀌어 지문이 다르면 **적용하지 않는다.**
 * SKU는 시트+원본 행 번호라, 판이 바뀌면 같은 번호가 다른 품목을 가리킬 수 있다.
 */
import type { Catalog } from '../../data/catalog/load';
import type { PriceEntry } from '../private-cost/parse';
import { createSession, type PrivateCostSession } from '../private-cost/session';
import type { PriceBook } from './types';

/** 이 가격표를 지금 단가표에 쓸 수 있는가. */
export function priceBookFits(catalog: Catalog, book: PriceBook | undefined): book is PriceBook {
  return book !== undefined && book.catalogSourceSha256 === catalog.sourceSha256;
}

/** 가격표의 원가를 원가 세션 줄로 바꾼다. 단위는 견적 단가표 단위다(같은 품목이다). */
export function costEntriesFromBook(book: PriceBook, catalog: Catalog): PriceEntry[] {
  if (!priceBookFits(catalog, book)) return [];
  const known = new Map(catalog.products.map((p) => [p.sku, p]));
  const out: PriceEntry[] = [];
  for (const [sku, entry] of Object.entries(book.entries)) {
    const product = known.get(sku);
    if (product === undefined) continue;
    out.push({
      entryId: `price-book-${sku}`,
      sku,
      ...(product.model !== '' ? { model: product.model } : {}),
      name: product.quoteName,
      purchaseUnitPrice: entry.cost,
      currency: 'KRW',
      unit: product.unit,
    });
  }
  return out;
}

/** 가격표 원가로 만든 원가 세션. 원가가 하나도 없으면 `undefined`. */
export function priceBookCostSession(book: PriceBook | undefined, catalog: Catalog): PrivateCostSession | undefined {
  if (book === undefined) return undefined;
  const entries = costEntriesFromBook(book, catalog);
  return entries.length === 0 ? undefined : createSession(entries);
}
