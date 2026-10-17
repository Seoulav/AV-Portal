/**
 * 회의실 타입 템플릿 → `QuoteDocument` (B-20261016-07 2단계).
 *
 * 템플릿은 품목·수량·비고만 담는다. **단가는 여기서 붙는다** — 템플릿의
 * SKU를 공개 단가(`catalog.prices`)에서 찾고, 없으면 `0`으로 메우지 않고
 * 행을 비운 채 경고를 세운다(설계서 §5.6). 가격표(B-20261016-06)를 올린
 * 브라우저에서는 원가가 원가 경계에서 따로 붙는다 — 이 함수는 원가를
 * 모른다.
 *
 * 단가표(승인 카탈로그)에 없는 품목은 **지어내지 않는다** — 샘플의
 * 품명·규격 그대로 행을 만들고 비고에 `단가표 미등록`을 붙이고
 * 차단 경고를 세운다(2026-10-16 사용자 승인 범위).
 *
 * **조립은 `buildQuoteDocument`가 한다.** 구성도·품목 선택과 같은 함수다.
 */
import type { QuoteDocument, QuoteHeader } from '../../domain/quote/types';
import {
  buildQuoteDocument,
  type QuoteLineInput,
  type QuoteSystemInput,
} from '../../domain/quote/buildDocument';
import type { Catalog } from '../../data/catalog/load';
import type { ImportWarning } from '../diagram/devices';
import type { RoomTemplate, RoomTemplateItem } from './templates';

export interface RoomTemplateResult {
  document: QuoteDocument;
  warnings: ImportWarning[];
  blocking: boolean;
}

/** 비고를 잇는다 — 샘플 비고를 지우지 않는다. */
function joinRemark(sample: string | undefined, added: string): string {
  return sample === undefined || sample === '' ? added : `${sample} · ${added}`;
}

function lineOf(item: RoomTemplateItem, catalog: Catalog, warnings: ImportWarning[]): QuoteLineInput {
  const product = item.sku === undefined ? undefined : catalog.products.find((p) => p.sku === item.sku);

  if (item.sku !== undefined && product === undefined) {
    // 템플릿 생성 시점의 카탈로그와 지금 카탈로그가 다르다(SKU가 사라짐).
    warnings.push({
      code: 'device-not-in-catalog',
      blocking: true,
      message: `템플릿 품목 '${item.name}'(${item.sku})가 지금 카탈로그에 없다. 품목을 다시 골라야 한다.`,
    });
  }

  if (product === undefined) {
    // 단가표 미등록(또는 모호·사라진 SKU) — 샘플의 품명·규격 그대로 적고 막는다.
    const label =
      item.ambiguous === true
        ? '단가표 대응 모호 — 품목 확인 필요'
        : item.sku !== undefined
          ? '카탈로그에서 사라진 품목 — 확인 필요'
          : '단가표 미등록';
    if (item.sku === undefined) {
      warnings.push({
        code: 'price-not-registered',
        blocking: true,
        message: `'${item.name}'${item.specification === '' ? '' : ` (${item.specification})`} — ${label}. 단가와 품셈을 확인해 주세요.`,
      });
    }
    return {
      name: item.name,
      specification: item.specification,
      unit: item.unit,
      quantity: item.quantity,
      ...(item.description !== undefined ? { internalDescription: item.description } : {}),
      remark: joinRemark(item.remark, label),
      // sellingUnitPrice·laborMappingId를 넣지 않는다 → 화면이 '미등록'으로
      // 표시하고 `buildQuoteDocument`가 품셈을 `unresolved`로 막는다.
    };
  }

  const price = catalog.prices.get(product.sku);
  if (price === undefined) {
    warnings.push({
      code: 'price-not-registered',
      blocking: true,
      message: `'${product.quoteName}'의 판매 단가가 미등록이다.`,
    });
  }

  return {
    sku: product.sku,
    // 품명·규격은 카탈로그(단가표) 값으로 쓴다 — 단가·품셈이 그 품목 기준이다.
    name: product.quoteName,
    specification: product.quoteSpec,
    // 단위·수량은 샘플 값이다. 생성기가 카탈로그 단위와 같은지 확인했다.
    unit: item.unit,
    quantity: item.quantity,
    ...(price !== undefined ? { sellingUnitPrice: price } : {}),
    ...(item.description !== undefined
      ? { internalDescription: item.description }
      : product.options['description'] !== undefined && product.options['description'] !== ''
        ? { internalDescription: product.options['description'] }
        : {}),
    ...(product.laborMappingId !== undefined ? { laborMappingId: product.laborMappingId } : {}),
    ...(item.remark !== undefined ? { remark: item.remark } : {}),
  };
}

export function roomTemplateToQuote(
  template: RoomTemplate,
  catalog: Catalog,
  header: QuoteHeader,
): RoomTemplateResult {
  const warnings: ImportWarning[] = [];

  const systems: QuoteSystemInput[] = template.systems.map((system) => ({
    name: system.name,
    lines: system.items.map((item) => lineOf(item, catalog, warnings)),
  }));

  const document = buildQuoteDocument({
    header,
    systems,
    documentId: `room-${template.id}-${header.quoteNumber}`,
    rowIdPrefix: 'rt',
    // 입구 종류는 '직접 선택'과 같은 계약이다(구성도가 아니다). 작업 파일
    // 스키마(`entryKind: diagram|picker`)를 넓히지 않는다.
    entryKind: 'picker',
    versions: { catalog: catalog.sourceSha256 },
  });

  return { document, warnings, blocking: warnings.some((w) => w.blocking) };
}

/**
 * 템플릿에서 단가표와 맞지 않은 품목 수 — 화면 안내용. 미등록과 모호는
 * 변환 결과의 표기가 다르므로 여기서도 섞지 않는다(독립 리뷰 지적 2026-10-18).
 */
export function unresolvedItemCounts(template: RoomTemplate): { unregistered: number; ambiguous: number } {
  let unregistered = 0;
  let ambiguous = 0;
  for (const system of template.systems) {
    for (const item of system.items) {
      if (item.sku !== undefined) continue;
      if (item.ambiguous === true) ambiguous += 1;
      else unregistered += 1;
    }
  }
  return { unregistered, ambiguous };
}
