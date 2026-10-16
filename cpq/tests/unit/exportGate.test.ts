import { describe, it, expect } from 'vitest';
import { exportGate, type WorkspaceStatus } from '@/app/workspace';
import type { PreparedQuote } from '@/export/variants/prepare';
import type { QuoteDocument } from '@/domain/quote/types';

/**
 * `exportGate` — 버튼 disabled 속성과 Excel 다운로드 핸들러가 **같은**
 * 판단 하나를 공유하는지 확인한다(2026-10-05 독립 검토 지적: 핸들러가
 * `status.kind`만 보고 `prepared.blocking`·`pendingCableEdit`는 버튼에만
 * 있었다 — 버튼이 비활성인 이유로 클릭이 안 된 것과 핸들러 자신이 막은
 * 것은 다른 사실인데 지금까지 구분 없이 섞여 있었다).
 */

function editingStatus(blocking: boolean): WorkspaceStatus {
  return {
    kind: 'editing',
    document: {} as QuoteDocument,
    prepared: { blocking } as unknown as PreparedQuote,
  };
}

describe('exportGate', () => {
  it('문서가 없으면(empty) 막는다', () => {
    const result = exportGate({ kind: 'empty' }, false);
    expect(result.allowed).toBe(false);
  });

  it('기준 충돌(basis-conflict) 상태면 막는다', () => {
    const result = exportGate({ kind: 'basis-conflict', document: {} as QuoteDocument, reason: '사유' }, false);
    expect(result.allowed).toBe(false);
  });

  // 2026-10-16 사용자 결정: 확인 항목이 남아도 내려받기(B-20261016-05).
  // 전에는 "prepared.blocking이면 막는다"를 고정했다. 이제 확인 항목은
  // 막지 않고 화면이 내려받기 직전 확인 창으로 알린다.
  it('prepared.blocking(확인 항목 남음)이어도 editing이면 막지 않는다', () => {
    const result = exportGate(editingStatus(true), false);
    expect(result.allowed).toBe(true);
  });

  it('pendingCableEdit이면 blocking이 아니어도 막는다', () => {
    const result = exportGate(editingStatus(false), true);
    expect(result.allowed).toBe(false);
  });

  it('pendingCableEdit은 blocking과 함께여도 계속 막는다 — 확인 항목 허용이 케이블 수정 대기까지 풀지 않는다', () => {
    const result = exportGate(editingStatus(true), true);
    expect(result.allowed).toBe(false);
  });

  it('editing이고 blocking이 아니고 pendingCableEdit도 아니면 허용한다', () => {
    const result = exportGate(editingStatus(false), false);
    expect(result.allowed).toBe(true);
  });
});
