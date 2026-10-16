/**
 * 노무 확인 지문 (Task 6 노무 확인 보완 — 계획 §2-2, Task A).
 *
 * 사람이 "이 숫자를 보고" 품셈 연결이 맞다고 확인했다는 사실을, **그
 * 숫자 전부를 담은 지문**에 묶는다. 하나라도 바뀌면 지문이 달라지고,
 * 확인은 자동으로 무효가 된다(무효화 자체는 Task B가 한다 — 이 파일은
 * 지문 계산만 한다).
 *
 * 지문에 들어가는 것 — 전부 **그 순간 사람이 실제로 본 숫자**다:
 *   제품 identity(rowId·productId/SKU) · 품셈 연결(laborMappingId·
 *   laborItemId·code) · 공수(직종 정렬) · 적용 노임(직종별 금액 +
 *   wageTableId) · 단위(wageUnit·baseUnit·행 unit) · 계수(itemRate·
 *   surcharge·conversionFactor) · 행 수량 · 계산 rule 버전.
 *
 * ⛔ `confirmedAt`(확인 시각)은 넣지 않는다 — 시각이 들어가면 같은
 * 근거라도 지문이 매번 달라진다.
 */
import { dec, text } from '../calculation/rounding';
import { fnv1a64 } from '../quote/fingerprint';
import type { DecimalText } from '../quote/types';

export interface LaborConfirmation {
  /** 무엇을 보고 확인했는지 — computeLaborConfirmationFingerprint의 결과. */
  basisFingerprint: string;
  /** ISO 날짜. 지문에는 안 들어간다 — 표시용이다. */
  confirmedAt: string;
}

export interface LaborConfirmationFingerprintInput {
  rowId: string;
  productId?: string;
  sku?: string;
  laborMappingId: string;
  laborItemId: string;
  code: string;
  /** 공수 — 품셈 항목의 직종별 품. */
  trades: readonly { trade: string; quantity: DecimalText }[];
  /** 적용된 직종별 노임 금액(품 × 노임이 아니라 노임 그 자체) + 출처 표. */
  tradeWages: readonly { trade: string; amount: DecimalText; unit: string }[];
  wageTableId: string;
  wageUnit: string;
  baseUnit: string;
  /** 견적 행의 unit(판매 단위) — 품셈 기준 단위와 다를 수 있다. */
  rowUnit: string;
  itemRate: DecimalText;
  surcharge: DecimalText;
  conversionFactor: DecimalText;
  quantity: DecimalText;
  ruleVersion: string;
}

/** Decimal 문자열을 정규화한다 — `'0.30'`과 `'0.3'`이 같은 지문이어야 한다. */
function normalizeDecimal(value: DecimalText): string {
  return text(dec(value));
}

/**
 * 지문을 계산한다 — **구조를 직렬화**한다(값을 그냥 이어 붙이지 않는다
 * — 경계가 모호해지는 것을 막는다). 직종은 정렬해, 원본 순서가 바뀌어도
 * 같은 근거면 같은 지문이 나온다.
 */
export function computeLaborConfirmationFingerprint(input: LaborConfirmationFingerprintInput): string {
  const sortedTrades = [...input.trades]
    .map((t) => ({ trade: t.trade, quantity: normalizeDecimal(t.quantity) }))
    .sort((a, b) => a.trade.localeCompare(b.trade));
  const sortedWages = [...input.tradeWages]
    .map((w) => ({ trade: w.trade, amount: normalizeDecimal(w.amount), unit: w.unit }))
    .sort((a, b) => a.trade.localeCompare(b.trade));

  const structured = {
    rowId: input.rowId,
    productId: input.productId ?? null,
    sku: input.sku ?? null,
    laborMappingId: input.laborMappingId,
    laborItemId: input.laborItemId,
    code: input.code,
    trades: sortedTrades,
    tradeWages: sortedWages,
    wageTableId: input.wageTableId,
    wageUnit: input.wageUnit,
    baseUnit: input.baseUnit,
    rowUnit: input.rowUnit,
    itemRate: normalizeDecimal(input.itemRate),
    surcharge: normalizeDecimal(input.surcharge),
    conversionFactor: normalizeDecimal(input.conversionFactor),
    quantity: normalizeDecimal(input.quantity),
    ruleVersion: input.ruleVersion,
  };

  return fnv1a64(JSON.stringify(structured));
}

/**
 * **품셈 연결 내용**의 지문 (B-20261016-05 독립 검토 지적 C).
 *
 * "이 PC가 기억한 확인한 연결"은 품셈 판(`versions.labor` = 노임표
 * `sourceSha256`)만으로는 부족하다 — 원본 해시가 같은 채 `labor-mappings.json`
 * 의 연결 내용(품셈 항목·할증·요율·환산·배율)만 고치면 예전 확인이 그대로
 * 적용된다. 그래서 기억 항목에 이 지문을 함께 저장하고, 지금 연결과 지문이
 * 같을 때만 기억을 쓴다.
 *
 * 들어가는 것: 연결 id·SKU · 품셈 항목 id · 할증·요율·환산·배율 · 그 품셈
 * 항목의 코드·기준 단위·노임 단위·직종별 절사 방식·직종별 공수. 노임 **값**은 넣지 않는다 —
 * 노임은 품셈 판(`wage` 기준)이 따로 막고, 연결 자체가 맞는지와는 별개다.
 */
export interface LaborMappingFingerprintInput {
  mapping: {
    laborMappingId: string;
    sku: string;
    laborItemId: string;
    conversionFactor: DecimalText;
    surcharge: DecimalText;
    itemRate: DecimalText;
    multiplier?: DecimalText | undefined;
  };
  item: {
    laborItemId: string;
    code: string;
    baseUnit: string;
    wageUnit: string;
    perTradeRounding?: 'int' | undefined;
    trades: readonly { trade: string; quantity: DecimalText }[];
  };
}

export function computeLaborMappingFingerprint({ mapping, item }: LaborMappingFingerprintInput): string {
  const structured = {
    laborMappingId: mapping.laborMappingId,
    sku: mapping.sku,
    laborItemId: mapping.laborItemId,
    conversionFactor: normalizeDecimal(mapping.conversionFactor),
    surcharge: normalizeDecimal(mapping.surcharge),
    itemRate: normalizeDecimal(mapping.itemRate),
    multiplier: mapping.multiplier === undefined ? null : normalizeDecimal(mapping.multiplier),
    item: {
      laborItemId: item.laborItemId,
      code: item.code,
      baseUnit: item.baseUnit,
      wageUnit: item.wageUnit,
      perTradeRounding: item.perTradeRounding ?? null,
      trades: [...item.trades]
        .map((t) => ({ trade: t.trade, quantity: normalizeDecimal(t.quantity) }))
        .sort((a, b) => a.trade.localeCompare(b.trade)),
    },
  };
  return fnv1a64(JSON.stringify(structured));
}
