import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { buildGuideBasis, type BasisVersions } from '@/data/catalog/guideBasis';
import { buildCatalog } from '@/data/catalog/load';
import { toRow } from '@/domain/quote/buildDocument';
import type { QuoteDocument } from '@/domain/quote/types';
import { buildCustomerProjection } from '@/export/customer/projection';
import { buildSystemSheetContent } from '@/export/customer/guideWorkbook';
import { buildSalesDownload } from '@/export/internal/salesExportAction';
import {
  GUIDE_IDS,
  readGuideTemplate,
  selectGuide,
  type GuideId,
  type GuideManifest,
  type GuideTemplateSet,
} from '@/export/ooxml/guideTemplate';
import type { SharedNotes } from '@/export/shared/projection';
import { buildCustomerDownload, buildSharedDownload } from '@/export/variants/download';
import { prepareQuote, type PreparedQuote } from '@/export/variants/prepare';
import { REVIEW_MARK_PREFIX, reviewReasonsByRow, withReviewMarks } from '@/export/variants/reviewMarks';
import { pickedItemsToQuote } from '@/import/picker/toQuote';
import type { ImportWarning } from '@/import/diagram/devices';

/**
 * 2026-10-16 사용자 결정: 확인 항목이 남아도 내려받기 (B-20261016-05).
 *
 * 확인 항목이 **여러 종류 남은** 실제 승인 카탈로그 문서로 0/1/2 세 등급을
 * 직접 만든다 — 화면을 거치지 않는다.
 *
 *   품셈 연결 미확인   실제 카탈로그 품목(1,331건 전부 confirmed:false)
 *   판매 단가 미등록   한 행의 단가를 지운다
 *   수량 미확인        한 행에 자리표시자 표식(`quantityUnresolved`)
 *   품목 미연결        구성도 경고(device-not-in-catalog)가 가리키는 행
 *
 * 보는 것: 세 등급 모두 예외 없이 바이트가 나온다 · NaN 같은 이상한 값이
 * 없다 · 값이 없는 칸은 0이 아니라 빈칸이다 · 0·1에는 `[확인 필요]`가
 * 있고 2에는 없다.
 */

const ROOT = resolve(__dirname, '../..');
const j = (name: string): unknown => JSON.parse(readFileSync(resolve(ROOT, 'data/approved', name), 'utf8'));
const manifest = (): GuideManifest =>
  JSON.parse(readFileSync(resolve(ROOT, 'templates/sanitized/guide-manifest.json'), 'utf8')) as GuideManifest;
const guide = (id: GuideId) =>
  readGuideTemplate(id, new Uint8Array(readFileSync(resolve(ROOT, `templates/sanitized/guide-${id}.xlsx`))), manifest());
const GUIDES: GuideTemplateSet = Object.fromEntries(GUIDE_IDS.map((id) => [id, guide(id)])) as GuideTemplateSet;
const EMPTY_NOTES: SharedNotes = { supplierByRow: new Map(), salesRemarkByRow: new Map() };

const BASIS = buildGuideBasis({
  laborItemsRaw: j('labor-items.json'),
  wageTableRaw: j('wage-table.json'),
  laborMappingsRaw: j('labor-mappings.json'),
  choice: { kind: 'guide', guide: GUIDES.pumsem },
});
const VERSIONS: BasisVersions = BASIS.versions;

const UNPRICED = 'row-unpriced';
const UNRESOLVED_QTY = 'row-qty';
const UNMATCHED = 'row-unmatched';
const UNMATCHED_NODE = 'node-unmatched';

function blockedPrepared(): PreparedQuote {
  const catalog = buildCatalog(j('products.json'), j('prices.json'));
  const priced = catalog.products.filter((p) => catalog.prices.has(p.sku) && p.laborMappingId !== undefined);
  const [a, b, c] = [priced[0]!, priced[1]!, priced[2]!];
  const picked = pickedItemsToQuote(
    {
      header: {
        quoteNumber: 'UNBLOCK-1',
        quoteDate: '2026-10-16',
        customer: '합성 고객',
        projectName: '확인 항목 남은 내려받기',
        contact: '',
        conditions: [],
      },
      systems: [{ name: '회의실', items: [a, b, c].map((p) => ({ sku: p.sku, quantity: '2' })) }],
    },
    catalog,
  ).document;
  const systemId = picked.systems[0]!.systemId;
  const items = picked.rows.filter((r) => r.type === 'item');
  const unmatched = toRow(UNMATCHED, systemId, {
    name: '구성도 미연결 장비',
    specification: 'UNMATCHED-MODEL',
    unit: 'EA',
    quantity: '1',
    sourceNodeIds: [UNMATCHED_NODE],
  });
  const document: QuoteDocument = {
    ...picked,
    rows: [
      ...picked.rows.map((r) => {
        if (r.type !== 'item') return r;
        if (r.rowId === items[1]!.rowId) {
          const { sellingUnitPrice: _drop, ...rest } = r;
          return { ...rest, rowId: UNPRICED, remark: '사람이 적은 비고' };
        }
        if (r.rowId === items[2]!.rowId) return { ...r, rowId: UNRESOLVED_QTY, quantityUnresolved: true as const };
        return r;
      }),
      unmatched,
    ],
  };
  const importWarnings: ImportWarning[] = [
    { code: 'device-not-in-catalog', blocking: true, message: '모델을 찾지 못했다.', nodeId: UNMATCHED_NODE },
  ];
  return prepareQuote({
    document,
    laborReference: BASIS.reference,
    basisVersions: VERSIONS,
    guides: GUIDES,
    profileBySystem: new Map(document.systems.map((s) => [s.systemId, 'general'])),
    importWarnings,
    wageMode: 'initialize-new',
  });
}

function allXml(bytes: Uint8Array): string {
  return Object.entries(unzipSync(bytes))
    .filter(([name]) => name.endsWith('.xml'))
    .map(([, b]) => strFromU8(b))
    .join('\n');
}

function detailXml(bytes: Uint8Array): string {
  return strFromU8(unzipSync(bytes)['xl/worksheets/sheet2.xml']!);
}

describe('확인 항목이 남은 문서 — 전제', () => {
  it('네 종류의 확인 항목이 실제로 남아 있다', () => {
    const p = blockedPrepared();
    expect(p.blocking).toBe(true);
    const laborCodes = new Set(p.priced.laborWarnings.filter((w) => w.blocking).map((w) => w.code));
    const calcCodes = new Set(p.priced.calculation.warnings.filter((w) => w.blocking).map((w) => w.code));
    expect(laborCodes.has('mapping-unconfirmed')).toBe(true);
    expect(calcCodes.has('price-not-registered')).toBe(true);
    expect(calcCodes.has('quantity-unresolved')).toBe(true);
    expect(p.importWarnings.some((w) => w.blocking)).toBe(true);
  });
});

describe('세 등급 모두 바이트를 만든다 — 예외·이상한 값 없음', () => {
  const p = blockedPrepared();
  const files = {
    '2 고객용': buildCustomerDownload(p, GUIDES, VERSIONS),
    '1 공유용': buildSharedDownload(p, GUIDES, EMPTY_NOTES, VERSIONS),
    '0 영업팀용': buildSalesDownload(p, GUIDES, EMPTY_NOTES, [], new Map(), VERSIONS),
  };

  for (const [grade, file] of Object.entries(files)) {
    it(`${grade}: 실제 xlsx 바이트이고 NaN·Infinity·undefined 가 없다`, () => {
      expect(file.bytes.length).toBeGreaterThan(0);
      const xml = allXml(file.bytes);
      expect(xml).toContain('구성도 미연결 장비');
      expect(xml).not.toMatch(/NaN|Infinity|undefined/);
    });
  }

  it('2 고객용에는 확인 필요 표시가 없다', () => {
    expect(allXml(files['2 고객용'].bytes)).not.toContain(REVIEW_MARK_PREFIX);
  });

  for (const grade of ['1 공유용', '0 영업팀용'] as const) {
    it(`${grade}에는 확인 필요 행마다 비고에 사유가 붙는다`, () => {
      const xml = detailXml(files[grade].bytes);
      expect(xml).toContain(REVIEW_MARK_PREFIX);
      for (const reason of ['품셈 연결 미확인', '판매 단가 미등록', '수량 미확인', '품목 미연결']) {
        expect(xml, reason).toContain(reason);
      }
      // 사람이 적은 비고는 지우지 않고 그 뒤에 덧붙인다.
      expect(xml).toContain(`사람이 적은 비고 ${REVIEW_MARK_PREFIX}`);
    });
  }
});

describe('값이 없는 칸은 0으로 지어내지 않는다', () => {
  const p = blockedPrepared();
  const exported = buildCustomerProjection(p.document, p.priced.calculation);
  const system = exported.systems[0]!;
  const calc = exported.calculation.systems[0]!;
  const content = buildSystemSheetContent(system, calc, selectGuide(GUIDES, 'general', false));
  const rowOf = (rowId: string): number => content.layout.rows.find((r) => r.rowId === rowId)!.row;
  const cell = (rowId: string, role: string) => content.contentByRow.get(rowOf(rowId))?.get(content.layout.column(role));

  it('단가 미등록 행의 재료 단가 칸은 비어 있다(0 아님)', () => {
    const value = cell(UNPRICED, 'material.unit');
    expect(value === undefined || value.kind === 'blank').toBe(true);
  });

  it('수량 미확인 행의 수량 칸은 빈칸이다 — 자리표시자 1을 쓰지 않는다', () => {
    expect(cell(UNRESOLVED_QTY, 'quantity')).toEqual({ kind: 'blank' });
  });

  it('수량이 확인된 행은 그대로 숫자다(대조군)', () => {
    expect(cell(UNPRICED, 'quantity')).toEqual({ kind: 'number', value: '2' });
  });
});

describe('withReviewMarks — 비고 글자만 바꾼다', () => {
  it('수량·단가·계산 결과는 그대로다', () => {
    const p = blockedPrepared();
    const marked = withReviewMarks(p);
    expect(marked.priced).toBe(p.priced);
    const strip = (d: QuoteDocument) => d.rows.map((r) => (r.type === 'item' ? { ...r, remark: '' } : r));
    expect(strip(marked.document)).toEqual(strip(p.document));
  });

  it('확인 항목이 없으면 받은 것을 그대로 돌려준다', () => {
    const p = { ...blockedPrepared() };
    const clean: PreparedQuote = {
      ...p,
      importWarnings: [],
      priced: { ...p.priced, laborWarnings: [], calculation: { ...p.priced.calculation, warnings: [] } },
    };
    expect(reviewReasonsByRow(clean).size).toBe(0);
    expect(withReviewMarks(clean)).toBe(clean);
  });
});

describe('짧은 사유 표에 없는 코드 — 내부 id가 비고에 찍히지 않는다(독립 검토 지적)', () => {
  it('원문 대신 일반 문구 "확인 필요"를 쓴다', () => {
    const p = blockedPrepared();
    const rowId = p.document.rows.find((r) => r.type === 'item')!.rowId;
    const withUnknown: PreparedQuote = {
      ...p,
      importWarnings: [],
      priced: {
        ...p.priced,
        laborWarnings: [],
        calculation: {
          ...p.priced.calculation,
          warnings: [
            { code: 'derived-source-missing', blocking: true, message: `행 ${rowId}: 내부 id LM-SECRET-9`, rowId },
          ],
        },
      },
    };
    expect(reviewReasonsByRow(withUnknown).get(rowId)).toEqual(['확인 필요']);
    const remark = withReviewMarks(withUnknown).document.rows.find((r) => r.rowId === rowId)!;
    expect(remark.type === 'item' && remark.remark).not.toContain('LM-SECRET-9');
  });
});
