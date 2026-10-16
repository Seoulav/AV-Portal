/**
 * 배포 카탈로그 읽기 (결정 D3, B-20261016-06).
 *
 * 배포에서 읽는 것은 `products.json`(품목 목록)뿐이다. **판매 단가 `prices.json`은
 * 2026-10-16 저장소·Pages에서 뺐다**(B-20261016-06, LED 구성기 방식). 판매가와
 * 원가는 직원이 「가격표 불러오기」로 고른 파일을 이 브라우저 안에서만 읽어
 * 붙인다(`services/price-book/apply.ts`의 `catalogWithPriceBook`).
 *
 * 그래서 **가격이 없는 상태가 정상 경로다.** 앱은 단가를 `단가 미등록`으로
 * 표시한다(설계서 §5.6 — 0으로 채우지 않는다).
 *
 * 반대로 `products.json`이 없으면 **던진다.** 제품 목록 없이는 아무것도 못 한다.
 */
import { z } from 'zod';
import type { DecimalText } from '../../domain/quote/types';
import type { LaborItem, LaborMapping, WageTable } from '../../domain/labor/types';
import {
  productsFileSchema,
  pricesFileSchema,
  laborItemsFileSchema,
  wageTableFileSchema,
  laborMappingsFileSchema,
} from './schema';

export type CatalogProduct = z.infer<typeof productsFileSchema>['products'][number];

export interface Catalog {
  /** 어느 원본에서 나왔는지. 가격 파일과 일치해야 한다. */
  sourceSha256: string;
  products: CatalogProduct[];
  /** SKU → 판매단가. **미등록 제품은 키가 없다.** */
  prices: Map<string, DecimalText>;
  /** 가격 파일을 실제로 읽었는지. `false`면 전 품목이 미등록이다. */
  pricesAvailable: boolean;
  /** 가격을 못 읽은 이유. 화면에 그대로 보여준다. */
  pricesUnavailableReason?: string;
}

/**
 * 이미 파싱한 JSON에서 카탈로그를 만든다. 네트워크를 타지 않아 테스트가 쉽다.
 *
 * `pricesRaw`는 SKU → 판매가 지도(`pricesFileSchema` 모양)다. 앱은 넘기지 않고
 * (가격은 가격표에서 온다), 시험이 **가짜 가격**을 넣을 때 쓴다.
 */
export function buildCatalog(productsRaw: unknown, pricesRaw?: unknown): Catalog {
  const products = productsFileSchema.parse(productsRaw);

  const catalog: Catalog = {
    sourceSha256: products.sourceSha256,
    products: products.products,
    prices: new Map(),
    pricesAvailable: false,
  };

  if (pricesRaw === undefined) {
    catalog.pricesUnavailableReason = '가격표가 없다 — 「가격표 불러오기」로 이 브라우저에 불러와야 한다';
    return catalog;
  }

  const parsed = pricesFileSchema.safeParse(pricesRaw);
  if (!parsed.success) {
    // 던지지 않는다. 가격이 없는 것은 정상 경로다.
    catalog.pricesUnavailableReason = '가격 파일의 형식이 맞지 않는다.';
    return catalog;
  }

  // 설계서 §6.3: 조용한 가격 변경을 막는다.
  // 제품과 가격이 다른 원본에서 나왔으면 섞어 쓰지 않는다.
  if (parsed.data.sourceSha256 !== products.sourceSha256) {
    catalog.pricesUnavailableReason =
      '제품 파일과 가격 파일이 서로 다른 원본에서 나왔다. 섞어 쓰지 않는다.';
    return catalog;
  }

  for (const [sku, entry] of Object.entries(parsed.data.prices)) {
    catalog.prices.set(sku, entry.sellingUnitPrice);
  }
  catalog.pricesAvailable = true;
  return catalog;
}

/** SKU의 판매단가. 미등록이면 `undefined` — **`0`이 아니다** (설계서 §5.6). */
export function priceOf(catalog: Catalog, sku: string): DecimalText | undefined {
  return catalog.prices.get(sku);
}

export interface LoadCatalogOptions {
  /** `import.meta.env.BASE_URL`. 끝에 `/`가 있어야 한다. */
  baseUrl?: string;
  /** 테스트에서 갈아끼운다. */
  fetchImpl?: typeof fetch;
}

/**
 * 배포 데이터(품목 목록)를 읽는다.
 *
 * 같은 origin의 정적 파일만 읽는다. 문서 상태를 바깥으로 보내지 않는다
 * (설계서 §8.4). **`prices.json`을 요청하지 않는다**(B-20261016-06) — 판매가는
 * 가격표에서 온다.
 */
export async function loadCatalog(options: LoadCatalogOptions = {}): Promise<Catalog> {
  const base = options.baseUrl ?? '/';
  const get = options.fetchImpl ?? fetch;

  const productsResponse = await get(`${base}data/approved/products.json`);
  if (!productsResponse.ok) {
    throw new Error(
      `제품 목록을 읽을 수 없다 (HTTP ${productsResponse.status}). ` +
        '`npm run build:approved`로 배포 데이터를 만들었는지 확인한다.',
    );
  }
  const productsRaw: unknown = await productsResponse.json();
  return buildCatalog(productsRaw);
}


// ---------------------------------------------------------------------------
// 품셈·노임
// ---------------------------------------------------------------------------

export interface LaborReference {
  items: LaborItem[];
  mappings: LaborMapping[];
  wages: WageTable;
  /** 품셈을 붙일 수 없는 SKU. 숨기지 않고 함께 들고 다닌다. */
  unmappedSkus: string[];
}

/**
 * 품셈 세 파일을 읽는다.
 *
 * 가격과 달리 **셋 다 필수다.** 품셈이 없으면 노무비가 0이 되고, 간접비가
 * 노무비 대비로 계산되므로 간접비까지 0이 된다. 조용히 틀린 견적이 나간다.
 */
export function buildLaborReference(
  itemsRaw: unknown,
  wageRaw: unknown,
  mappingsRaw: unknown,
): LaborReference {
  const items = laborItemsFileSchema.parse(itemsRaw);
  const wage = wageTableFileSchema.parse(wageRaw);
  const mappings = laborMappingsFileSchema.parse(mappingsRaw);

  if (
    items.sourceSha256 !== wage.sourceSha256 ||
    items.sourceSha256 !== mappings.sourceSha256
  ) {
    throw new Error(
      '품셈·노임·매핑이 서로 다른 원본에서 나왔다. 섞어 쓰면 노무비가 틀린다.',
    );
  }

  return {
    items: items.laborItems,
    mappings: mappings.mappings,
    wages: wage.wageTable,
    unmappedSkus: mappings.unmappedSkus,
  };
}
