import { describe, expect, it } from 'vitest';

import {
  applyConfirmations,
  buildSpecIndex,
  decideMappings,
  extractRows,
  findHeader,
  judgeRow,
  matchSku,
  type SampleProduct,
  type SampleRow,
} from '../../tools/laborSampleCompare';
import type { LaborReference } from '@/domain/labor/calculateLabor';

/** B-20261016-07 대조 도구의 판정 규칙. 전부 가짜 자료다. */

const products: SampleProduct[] = [
  { sku: 'AAA-0001', model: 'XDM-12', quoteName: 'UHD Matrix Frame', quoteSpec: 'XDM-12', unit: 'EA', laborMappingId: 'AAA-0001' },
  { sku: 'AAA-0002', model: '4K 60p 지원', quoteName: 'HDMI 케이블', quoteSpec: '4K 60p 지원', unit: 'EA', laborMappingId: 'AAA-0002' },
  { sku: 'AAA-0003', model: '4K 60p 지원', quoteName: '- DP 젠더', quoteSpec: '4K 60p 지원', unit: 'EA', laborMappingId: 'AAA-0003' },
  { sku: 'AAA-0004', model: '4K 60p 지원', quoteName: '- DP 젠더', quoteSpec: '4K 60p 지원', unit: 'EA', laborMappingId: 'AAA-0004' },
];

const reference: LaborReference = {
  items: products.map((p) => ({
    laborItemId: p.sku,
    code: '합성',
    description: '합성',
    baseUnit: 'EA',
    source: '합성',
    revision: '합성',
    wageUnit: 'M/D' as const,
    trades: [{ trade: '통신설비공', quantity: '0.5' }],
  })),
  mappings: products.map((p) => ({
    laborMappingId: p.sku,
    sku: p.sku,
    laborItemId: p.sku,
    conversionFactor: '1',
    surcharge: '0',
    itemRate: '1',
    confirmed: false,
    note: '자동',
  })),
  wages: { wageTableId: 'W', periodLabel: '합성', source: '합성', wages: { 통신설비공: { amount: '200000', unit: 'M/D' } } },
};
// 앱 계산: INT(0.5 × 200,000) = 100,000

const index = buildSpecIndex(products);
const bySku = new Map(products.map((p) => [p.sku, p]));
const row = (over: Partial<SampleRow>): SampleRow => ({
  sheet: '1-1',
  rowNumber: 5,
  name: 'UHD Matrix Frame',
  spec: 'XDM-12',
  description: '',
  unit: 'EA',
  quantity: '1',
  laborUnitPrice: '100000',
  ...over,
});

describe('머리글과 품목 행', () => {
  it('열을 머리글 이름으로 찾고, 노무비는 아래 행이 단가인 열이다', () => {
    const rows = [
      ['견적서'],
      ['번호', '품 명', '규격', '설명', '단위', '수량', '원가', '', '재료비', '', '노무비', '', '합계'],
      ['', '', '', '', '', '', '단가', '금액', '단가', '금액', '단가', '금액', ''],
      ['1', 'A', 'XDM-12', '', 'EA', '2', '', '', '1', '2', '100000', '200000', ''],
      ['', '소계', '', '', '', '', '', '', '', '', '', '', ''],
    ];
    const h = findHeader(rows)!;
    expect(h.laborUnitPrice).toBe(10);
    expect(h.dataStartRowIndex).toBe(3);
    const items = extractRows('1-1', rows, h);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ rowNumber: 4, spec: 'XDM-12', laborUnitPrice: '100000' });
  });
});

describe('SKU 연결은 정확히 1건만', () => {
  it('규격이 1건에 맞으면 그것', () => {
    expect(matchSku(row({ spec: ' xdm-12 ' }), index)).toMatchObject({ kind: 'one', sku: 'AAA-0001' });
  });
  it('여러 건이면 품명으로 좁혀 1건일 때만', () => {
    expect(matchSku(row({ spec: '4K 60p 지원', name: 'HDMI 케이블' }), index)).toMatchObject({ kind: 'one', sku: 'AAA-0002', byName: true });
    expect(matchSku(row({ spec: '4K 60p 지원', name: 'DP 젠더' }), index)).toMatchObject({ kind: 'many' });
  });
  it('맞는 것이 없으면 건너뛴다', () => {
    expect(matchSku(row({ spec: '없는 규격' }), index)).toEqual({ kind: 'none' });
  });
});

describe('행 판정', () => {
  it('간접비 줄은 뺀다', () => {
    expect(judgeRow(row({ name: '산재보험료', spec: '노무비 대비' }), index, bySku, reference).kind).toBe('indirect');
  });
  it('노무비가 비었거나 0이면 증거로 쓰지 않는다', () => {
    expect(judgeRow(row({ laborUnitPrice: '' }), index, bySku, reference).kind).toBe('no-evidence');
    expect(judgeRow(row({ laborUnitPrice: '0' }), index, bySku, reference).kind).toBe('no-evidence');
  });
  it('정확히 같으면 일치, 1원이라도 다르면 불일치', () => {
    expect(judgeRow(row({}), index, bySku, reference).kind).toBe('equal');
    const v = judgeRow(row({ laborUnitPrice: '100001' }), index, bySku, reference);
    expect(v).toMatchObject({ kind: 'differ', mismatch: 'rounding-1won' });
  });
  it('배율 차이를 앱 계산으로 가려낸다', () => {
    expect(judgeRow(row({ laborUnitPrice: '200000' }), index, bySku, reference)).toMatchObject({ kind: 'differ', mismatch: 'multiplier' });
  });
});

describe('연결 판정과 반영', () => {
  it('연결의 샘플 행이 전부 같아야 확인한다', () => {
    const ok = judgeRow(row({}), index, bySku, reference);
    const bad = judgeRow(row({ laborUnitPrice: '100001' }), index, bySku, reference);
    expect(decideMappings([ok, ok])[0]).toMatchObject({ laborMappingId: 'AAA-0001', equalRows: 2, confirm: true });
    expect(decideMappings([ok, bad])[0]).toMatchObject({ equalRows: 1, differRows: 1, confirm: false });
  });

  it('확인한 연결의 confirmed·note만 바꾸고 순서·다른 칸은 그대로 둔다', () => {
    const file = {
      schemaVersion: 1,
      mappings: [
        { laborMappingId: 'AAA-0002', sku: 'AAA-0002', itemRate: '1', confirmed: false, note: '자동' },
        { laborMappingId: 'AAA-0001', sku: 'AAA-0001', itemRate: '1', confirmed: false, note: '자동' },
      ],
    };
    const decisions = decideMappings([judgeRow(row({}), index, bySku, reference)]);
    const { file: out, changed } = applyConfirmations(file, decisions, '2026-10-16', '26년 하반기');
    expect(changed).toEqual(['AAA-0001']);
    expect(out.mappings[0]).toEqual(file.mappings[0]);
    expect(Object.keys(out.mappings[1]!)).toEqual(Object.keys(file.mappings[1]!));
    expect(out.mappings[1]).toMatchObject({ itemRate: '1', confirmed: true });
    expect(out.mappings[1]!.note).toBe('2026-10-16 회의실 견적 샘플 노무비 단가 일치(1행, 26년 하반기 노임 기준)로 확인 (B-20261016-07).');
    expect(out.mappings[1]!.note).not.toMatch(/100000|100,000/);
  });
});
