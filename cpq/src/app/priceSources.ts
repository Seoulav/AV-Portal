/**
 * 견적 앱의 **가격 출처를 한곳에 모은다** (B-20261016-06, 2026-10-16 사용자 결정).
 *
 *   판매가  공개 `data/approved/prices.json` — `loadCatalog`(`data/catalog/load.ts`)가
 *           품목 목록과 함께 읽어 `catalog.prices`에 붙인다. 회사 서버로 옮길 때까지
 *           공개 유지("옮길 때까지 공개 유지").
 *   원가    직원이 「가격표 불러오기」로 이 브라우저에 저장한 가격표
 *           (`services/price-book/store.ts`). 영업팀용(0)과 원가 영역에만 쓴다.
 *
 * 화면(`App.tsx`)은 가격을 이 모듈로만 받는다.
 *
 * ## 회사 서버로 옮길 때 바꿀 자리
 *
 * 사용자 검토 중: "av포탈이 완성되면 … 회사에서 계약한 웹서버에 옮길거고 회사 erp솔루션
 * 통해서만 접근되게". 그때는 `loadPriceSources`가 **인증된 회사 서버에서 가격표를 받아**
 * 같은 `StoredPriceLoad` 모양으로 돌려주면 된다(판매가도 공개 파일 대신 그 응답에서).
 * 화면·계산·출력 경계는 그대로 둔다. **지금은 서버 연동을 만들지 않는다.**
 */
import type { Catalog } from '../data/catalog/load';
import { priceBookCostSession } from '../services/price-book/apply';
import { loadStoredPriceRecord, type StoredPriceLoad } from '../services/price-book/store';
import type { PriceBook } from '../services/price-book/types';
import type { PrivateCostSession } from '../services/private-cost/session';

/** 시작할 때 가격 출처를 읽는다. 판매가는 이미 카탈로그에 있다 — 여기서는 원가 가격표만. */
export function loadPriceSources(): Promise<StoredPriceLoad> {
  return loadStoredPriceRecord();
}

/** 원가 세션. 가격표가 없거나 다른 판이면 `undefined` — 원가 미등록이다. */
export function costSessionFor(catalog: Catalog, book: PriceBook | undefined): PrivateCostSession | undefined {
  return priceBookCostSession(book, catalog);
}
