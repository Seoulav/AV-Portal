/**
 * 확인 항목이 남은 채 내려받는 0·1단계 파일에 **그 행이 확인 필요라는
 * 표시**를 단다 (B-20261016-05, 2026-10-16 사용자 결정: 확인 항목이 남아도
 * 내려받기 — 0·1은 표시, 2(고객용)는 표시하지 않음).
 *
 * ## 어디에 다는가
 *
 * 그 행의 **비고** 끝에 `[확인 필요] 사유` 를 덧붙인다. 사람이 적은 비고는
 * 지우지 않는다. 비고 칸은 0·1·2 모두 이미 있는 열이라 새 열을 만들지
 * 않는다 — 고객용(2)은 이 함수를 아예 부르지 않는다.
 *
 * ## 무엇을 표시하는가
 *
 * `prepared`의 **출력 전 확인 대상(blocking) 경고**만 본다 — 화면의
 * "확인 항목"과 같은 원본(구성도·품셈·계산)이다. 경고가 가리키는 행은
 * 구조화된 식별자로만 찾는다(rowId·optionId·nodeId·edgeId). 문구로 행을
 * 추측하지 않는다. 행을 특정할 수 없는 경고(예: 잡자재비 기준 재확인)는
 * 행에 달지 않는다 — 내려받기 직전 확인 창의 건수에는 들어 있다.
 *
 * ## 값은 바꾸지 않는다
 *
 * 비고 글자만 바꾼다. 수량·단가·금액·계산 결과(`priced`)는 그대로다.
 */
import type { QuoteDocument } from '../../domain/quote/types';
import type { PreparedQuote } from './prepare';

export const REVIEW_MARK_PREFIX = '[확인 필요]';

/**
 * 짧은 사유. 표에 없는 코드는 일반 문구(`확인 필요`)로 쓴다 — 경고 원문에는
 * 내부 id(행 id·연결 id 등)가 들어 있어 파일 비고에 찍히면 안 된다(독립 검토 지적).
 */
const SHORT_REASON: Readonly<Record<string, string>> = {
  'mapping-unconfirmed': '품셈 연결 미확인',
  'mapping-missing': '품셈 연결 없음',
  'labor-item-missing': '품셈 항목 없음',
  'wage-missing': '노임 없음',
  'wage-unit-mismatch': '노임 단위 불일치',
  'price-not-registered': '판매 단가 미등록',
  'quantity-unresolved': '수량 미확인',
  'labor-unresolved': '노무 처리 방식 미선택',
  'labor-mapping-missing': '품셈 연결 없음',
  'manual-labor-incomplete': '직접 입력 노무비 미완성',
  'not-applicable-reason-missing': '노무 해당 없음 사유 없음',
  'device-not-in-catalog': '품목 미연결',
  'device-ambiguous-match': '품목 후보 여러 개',
  'cable-item-unresolved': '케이블 품목 미연결',
  'catalog-item-removed': '카탈로그에서 사라진 품목',
};

const GENERIC_REASON = '확인 필요';

function reasonOf(code: string): string {
  return SHORT_REASON[code] ?? GENERIC_REASON;
}

type ItemRow = Extract<QuoteDocument['rows'][number], { type: 'item' }>;

/** 행 id → 사유 목록(중복 없이, 처음 나온 순서). */
export function reviewReasonsByRow(prepared: PreparedQuote): ReadonlyMap<string, readonly string[]> {
  const out = new Map<string, string[]>();
  const add = (rowId: string, reason: string): void => {
    const list = out.get(rowId) ?? [];
    if (!list.includes(reason)) list.push(reason);
    out.set(rowId, list);
  };
  const items = prepared.document.rows.filter((r): r is ItemRow => r.type === 'item');

  for (const w of prepared.importWarnings) {
    if (!w.blocking) continue;
    const reason = reasonOf(w.code);
    if (w.rowId !== undefined) {
      add(w.rowId, reason);
    } else if (w.optionId !== undefined) {
      for (const r of items) if (r.optionId === w.optionId) add(r.rowId, reason);
    } else if (w.nodeId !== undefined) {
      // 본체 장비 경고 — 옵션 행은 같은 노드를 공유해도 제외한다(`activeWarnings.ts`와 같은 규칙).
      for (const r of items) {
        if (r.optionId === undefined && (r.sourceNodeIds?.includes(w.nodeId) ?? false)) add(r.rowId, reason);
      }
    } else if (w.edgeId !== undefined) {
      for (const r of items) {
        if (
          (r.sourceEdgeIds?.includes(w.edgeId) ?? false) &&
          (w.sourceCableKey === undefined || r.sourceCableKey === w.sourceCableKey)
        ) {
          add(r.rowId, reason);
        }
      }
    }
  }
  for (const w of prepared.priced.laborWarnings) {
    if (w.blocking && w.rowId !== undefined) add(w.rowId, reasonOf(w.code));
  }
  for (const w of prepared.priced.calculation.warnings) {
    if (w.blocking && w.rowId !== undefined) add(w.rowId, reasonOf(w.code));
  }
  return out;
}

function markedRemark(remark: string, reasons: readonly string[] | undefined): string {
  if (reasons === undefined || reasons.length === 0) return remark;
  const mark = `${REVIEW_MARK_PREFIX} ${reasons.join(', ')}`;
  return remark.trim() === '' ? mark : `${remark} ${mark}`;
}

/**
 * 0·1단계용 — 확인 필요 행의 비고에 표시를 단 **복사본**을 돌려준다.
 * 확인 항목이 없으면 받은 것을 그대로 돌려준다.
 */
export function withReviewMarks(prepared: PreparedQuote): PreparedQuote {
  const reasons = reviewReasonsByRow(prepared);
  if (reasons.size === 0) return prepared;
  const document: QuoteDocument = {
    ...prepared.document,
    rows: prepared.document.rows.map((r) =>
      r.type === 'item' && reasons.has(r.rowId) ? { ...r, remark: markedRemark(r.remark, reasons.get(r.rowId)) } : r,
    ),
    derivedRows: prepared.document.derivedRows.map((r) =>
      reasons.has(r.rowId) ? { ...r, remark: markedRemark(r.remark, reasons.get(r.rowId)) } : r,
    ),
  };
  return { ...prepared, document };
}
