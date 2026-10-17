/**
 * 회의실 타입 템플릿 → 견적 (B-20261016-07 2단계).
 *
 * 1부: 변환 규칙 — 단가는 **가짜 값**으로만 시험한다. 단가표에 없는 품목은
 *      '단가표 미등록'으로 막고 값을 지어내지 않는다.
 * 2부: 커밋된 `data/approved/room-templates.json` 자체 검사 — 39종이고,
 *      **가격·구매처 문자열이 섞여 있지 않으며**, 적힌 SKU가 전부 실제
 *      승인 카탈로그에 있고 단위까지 같다.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { roomTemplatesFileSchema, type RoomTemplate } from '@/import/room/templates';
import { roomTemplateToQuote, unresolvedItemCounts } from '@/import/room/toQuote';
import type { SheetRow } from '@/domain/quote/types';
import { cat, catalogProduct } from '../fixtures/diagram';
import { findForbiddenValues } from '../../tools/roomTemplateExtract';

const header = () => ({
  quoteNumber: 'ROOM-T-1',
  quoteDate: '2026-10-18',
  customer: '',
  projectName: '',
  contact: '',
  conditions: [],
});

// 가짜 단가만 쓴다 — 실제 금액을 시험에 적지 않는다.
const catalog = () =>
  cat(
    [
      Object.assign(catalogProduct('FIX-0001', '합성 프로젝터', 'FIX-PJ'), { laborMappingId: 'LM-1' }),
      catalogProduct('FIX-0002', '합성 스크린', 'FIX-SC'),
    ],
    { 'FIX-0001': '1000' },
  );

const template = (): RoomTemplate => ({
  id: '1-1',
  typeName: '합성 대회의실',
  sourceSheet: '1-1',
  systems: [
    {
      name: '영상 시스템',
      items: [
        { sku: 'FIX-0001', name: '합성 프로젝터', specification: 'FIX-PJ', unit: 'EA', quantity: '2', remark: '천정 설치' },
        { sku: 'FIX-0002', name: '합성 스크린', specification: 'FIX-SC', unit: 'EA', quantity: '1' },
        { name: '제작 브라켓', specification: '제작사양', unit: 'EA', quantity: '3' },
        { name: '모호 품목', specification: '공용규격', unit: 'EA', quantity: '1', ambiguous: true },
      ],
    },
  ],
});

function itemRows(doc: { rows: readonly SheetRow[] }): Extract<SheetRow, { type: 'item' }>[] {
  return doc.rows.filter((r): r is Extract<SheetRow, { type: 'item' }> => r.type === 'item');
}

describe('회의실 템플릿 → 견적 변환', () => {
  it('SKU가 맞은 품목은 카탈로그 품명·단가·품셈 연결이 붙는다', () => {
    const { document } = roomTemplateToQuote(template(), catalog(), header());
    const rows = itemRows(document);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      sku: 'FIX-0001',
      name: '합성 프로젝터',
      quantity: '2',
      sellingUnitPrice: '1000',
      laborMappingId: 'LM-1',
      remark: '천정 설치',
    });
    expect(document.entryKind).toBe('picker');
  });

  it('단가 미등록 SKU는 0으로 채우지 않고 경고로 막는다', () => {
    const { warnings } = roomTemplateToQuote(template(), catalog(), header());
    const w = warnings.find((x) => x.message.includes('합성 스크린'));
    expect(w?.code).toBe('price-not-registered');
    expect(w?.blocking).toBe(true);
  });

  it('단가표에 없는 품목은 샘플 품명·규격 그대로 두고 「단가표 미등록」으로 막는다', () => {
    const { document, warnings, blocking } = roomTemplateToQuote(template(), catalog(), header());
    const row = itemRows(document).find((r) => r.name === '제작 브라켓')!;
    expect(row.sku).toBeUndefined();
    expect(row.sellingUnitPrice).toBeUndefined();
    expect(row.remark).toBe('단가표 미등록');
    expect(row.quantity).toBe('3');
    expect(blocking).toBe(true);
    expect(warnings.some((w) => w.message.includes('제작 브라켓') && w.message.includes('단가표 미등록'))).toBe(true);
  });

  it('여러 품목과 맞아 고르지 못한 품목은 「확인 필요」로 구분한다 — 미등록이라고 말하지 않는다', () => {
    const { document } = roomTemplateToQuote(template(), catalog(), header());
    const row = itemRows(document).find((r) => r.name === '모호 품목')!;
    expect(row.remark).toBe('단가표 대응 모호 — 품목 확인 필요');
  });

  it('템플릿의 SKU가 지금 카탈로그에서 사라졌으면 그 사실을 알린다 — 미등록이라고 말하지 않는다', () => {
    const gone: RoomTemplate = {
      ...template(),
      systems: [{ name: 'S', items: [{ sku: 'FIX-9999', name: '사라진 품목', specification: 'X', unit: 'EA', quantity: '1' }] }],
    };
    const { document, warnings } = roomTemplateToQuote(gone, catalog(), header());
    expect(warnings.some((w) => w.code === 'device-not-in-catalog' && w.message.includes('FIX-9999'))).toBe(true);
    expect(itemRows(document)[0]!.remark).toBe('카탈로그에서 사라진 품목 — 확인 필요');
  });

  it('화면 안내용 수 — 미등록과 모호를 섞지 않는다', () => {
    expect(unresolvedItemCounts(template())).toEqual({ unregistered: 1, ambiguous: 1 });
  });
});

describe('커밋된 room-templates.json', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../../data/approved/room-templates.json', import.meta.url), 'utf8'),
  );
  const file = roomTemplatesFileSchema.parse(raw); // strict — 모르는 키(가격 등)가 있으면 실패한다.
  const products = (
    JSON.parse(readFileSync(new URL('../../data/approved/products.json', import.meta.url), 'utf8')) as {
      products: Array<{ sku: string; unit: string }>;
    }
  ).products;

  it('39종이고 id가 겹치지 않는다', () => {
    expect(file.templates).toHaveLength(39);
    expect(new Set(file.templates.map((t) => t.id)).size).toBe(39);
    expect(file.templates.map((t) => t.id)).toContain('7-1');
    expect(file.templates.map((t) => t.id)).toContain('8-3');
  });

  it('가격·구매처 문자열이 없다 — 공개 승인 범위(품목·수량·비고)만 담는다', () => {
    expect(findForbiddenValues(raw)).toEqual([]);
  });

  it('적힌 SKU는 전부 실제 승인 카탈로그에 있고 단위가 같다', () => {
    const unitBySku = new Map(products.map((p) => [p.sku, p.unit]));
    for (const t of file.templates) {
      for (const s of t.systems) {
        for (const item of s.items) {
          if (item.sku === undefined) continue;
          expect(unitBySku.has(item.sku), `${t.id} ${item.name} — ${item.sku}`).toBe(true);
          expect(item.unit, `${t.id} ${item.name} — ${item.sku} 단위`).toBe(unitBySku.get(item.sku));
        }
      }
    }
  });

  it('수량은 전부 0보다 큰 수다', () => {
    for (const t of file.templates) {
      for (const s of t.systems) {
        for (const item of s.items) {
          expect(Number(item.quantity), `${t.id} ${item.name}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
