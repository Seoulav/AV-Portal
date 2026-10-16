/**
 * **가짜** 판매 단가 (B-20261016-06).
 *
 * 공개 판매 단가 `data/approved/prices.json`을 저장소에서 뺐다. 실제 단가가
 * 필요했던 시험은 이 가짜 값으로 바꾼다 — 실제 회사 단가를 시험 자료로
 * 옮기지 않는다(AGENTS.md "가격표·원가 파일은 AI가 다루지 않는다").
 *
 * 값은 SKU 순서로 정해지는 결정적인 가짜 숫자다(1,000원 단위). 파생 단가
 * 품목(`options.pricing === 'derived'`)은 견적 시점에 계산되므로 빼 둔다 —
 * 예전 `prices.json`과 같은 규칙이다.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface ProductLike {
  sku: string;
  options?: Record<string, string>;
}

interface ProductsFileLike {
  sourceSha256: string;
  products: ProductLike[];
}

/** 가짜 판매 단가 — `n`번째 품목에 대해 늘 같은 값을 준다. */
export function fakeSellingPrice(index: number): string {
  return String(((index * 37) % 90) * 1000 + 10000);
}

/** `pricesFileSchema` 모양의 가짜 판매 단가 지도. `buildCatalog(products, 이것)`으로 쓴다. */
export function fakePricesFor(productsRaw: unknown): unknown {
  const file = productsRaw as ProductsFileLike;
  const prices: Record<string, { sellingUnitPrice: string; currency: 'KRW' }> = {};
  file.products.forEach((product, index) => {
    if (product.options?.['pricing'] === 'derived') return;
    prices[product.sku] = { sellingUnitPrice: fakeSellingPrice(index), currency: 'KRW' };
  });
  return {
    schemaVersion: 1,
    generatedOn: '2026-01-01',
    sourceSha256: file.sourceSha256,
    currency: 'KRW',
    prices,
  };
}

/** 저장소의 공개 품목 목록에 가짜 판매 단가를 붙인 지도. */
export function fakeApprovedPrices(): unknown {
  const root = resolve(__dirname, '../..');
  return fakePricesFor(JSON.parse(readFileSync(resolve(root, 'data/approved/products.json'), 'utf8')));
}
