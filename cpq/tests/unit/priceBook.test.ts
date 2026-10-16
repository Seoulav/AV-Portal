import { describe, expect, it } from 'vitest';

import { buildCatalog, type Catalog } from '@/data/catalog/load';
import { readXlsxWorkbook } from '@/services/private-cost/readTable';
import {
  analyzePumsemWorkbook,
  isFourSheetWorkbook,
  PriceFileError,
  readFourSheetPrices,
  readPumsemPrices,
  savedChoiceFits,
} from '@/services/price-book/readPriceFile';
import { costEntriesFromBook, priceBookCostSession } from '@/services/price-book/apply';
import { buildBlankPriceTemplate, currentCableDefaults, ITEM_HEADERS, ITEM_NOTE_ROW } from '@/services/price-book/template';
import { parseStoredPriceRecord, type PriceBook, type PumsemColumnChoice } from '@/services/price-book/types';
import { buildSimpleXlsx, type XlsxCell } from '@/services/price-book/xlsxWriter';

/**
 * 가격표 파일 방식 (B-20261016-06) — 2026-10-16 「공개 유지안」: 원가만 읽고,
 * 판매가는 공개 단가와 대조만 한다.
 *
 * ⚠ **전부 가짜다.** 실제 표준품셈·원가·가격표 파일을 열지 않는다. 머리글
 * 이름은 사용자 견적서 양식(2단 머리글: 원가·재료비·노무비 아래 단가·금액)을
 * 본떴고, 행·값은 지어낸 것이다.
 */

const SHA = 'c'.repeat(64);

function product(sku: string, sheet: string, row: number, quoteName: string, spec: string, extra: Record<string, string> = {}) {
  return {
    productId: sku,
    sku,
    brand: '',
    model: spec,
    quoteName,
    quoteSpec: spec,
    unit: 'EA',
    options: { sheet, sourceRow: String(row), category: sheet, ...extra },
    currency: 'KRW',
    evidence: 'review-required',
  };
}

/** 가짜 **공개** 판매 단가 — 공개 `prices.json` 자리. */
const PUBLIC_PRICES = {
  schemaVersion: 1,
  generatedOn: '2026-01-01',
  sourceSha256: SHA,
  currency: 'KRW',
  prices: {
    'VID-0005': { sellingUnitPrice: '1200000', currency: 'KRW' },
    'VID-0008': { sellingUnitPrice: '400000', currency: 'KRW' },
    'VID-0011': { sellingUnitPrice: '1234000', currency: 'KRW' },
    'AUD-0004': { sellingUnitPrice: '99000', currency: 'KRW' },
  },
};

function fakeCatalog(): Catalog {
  return buildCatalog({
    schemaVersion: 1,
    generatedOn: '2026-01-01',
    sourceSha256: SHA,
    products: [
      product('VID-0005', '영상', 5, '매트릭스 스위처', 'FAKE-MX8'),
      product('VID-0006', '영상', 6, '분배기', 'FAKE-DA4'),
      product('VID-0007', '영상', 7, '컨버터', 'FAKE-CV1'),
      product('VID-0008', '영상', 8, '스케일러', 'FAKE-SC2'),
      product('VID-0009', '영상', 9, '배관 기타자재', '', { pricing: 'derived' }),
      product('VID-0010', '영상', 10, '익스텐더', 'FAKE-EX3'),
      product('VID-0011', '영상', 11, '모니터', 'FAKE MON 55'),
      product('AUD-0004', '오디오', 4, '앰프', 'FAKE-AMP'),
      product('CCT-0005', 'CCTV', 5, '카메라', 'FAKE-CAM'),
    ],
  }, PUBLIC_PRICES);
}

const n = (value: string): XlsxCell => ({ number: value });

/** 가짜 표준품셈 원본 — 2단 머리글(2·3행), 원가는 G열, 재료비 단가는 I열. */
function fakePumsemWorkbook(): Uint8Array {
  const header2: XlsxCell[] = ['번호', '품 명', '규 격', '설 명', '단위', '수량', '원가', undefined, '재료비', undefined, '노무비', undefined, '합계', '비 고', '제조사/구매처'];
  const header3: XlsxCell[] = [undefined, undefined, undefined, undefined, undefined, undefined, '단 가', '금 액', '단 가', '금 액', '단 가', '금 액'];
  const video: XlsxCell[][] = [
    ['2026년 하반기 가짜 품셈'],
    header2,
    header3,
    [undefined, '[ 영상 ]'],
    ['1', '매트릭스 스위처', 'FAKE-MX8', '', 'EA', n('1'), n('800000'), n('800000'), n('1200000'), n('1200000'), n('30000'), n('30000'), n('1230000'), '', '가짜 매입처'],
    // 판이 달라 품명이 다르다 → 불일치, 붙이지 않는다.
    ['2', '다른 품목', 'FAKE-DA4', '', 'EA', n('1'), n('111111'), undefined, n('222222')],
    // 가격 칸이 둘 다 비어 있다 → 빈 칸.
    ['3', '컨버터', 'FAKE-CV1', '', 'EA', n('1')],
    // 원가 칸이 수식 → 원가는 읽지 않는다. 판매가는 값이라 붙는다.
    ['4', '스케일러', 'FAKE-SC2', '', 'EA', n('1'), { formula: 'H8*0.7', cached: '333333' }, undefined, n('444444')],
    // 파생 단가 품목 — 판매가는 견적 시점에 계산된다. 원가만 붙는다.
    ['5', '배관 기타자재', '', '', 'EA', n('1'), n('5000'), undefined, { formula: 'INT(J8*0.2)', cached: '88888' }],
    // 원가가 숫자가 아니다.
    ['6', '익스텐더', 'FAKE-EX3', '', 'EA', n('1'), '별도', undefined, n('660000')],
    // 쉼표가 든 문자열 판매가, 규격의 공백은 비교에서 무시한다.
    ['7', '모니터', 'FAKE  MON 55', '', 'EA', n('1'), n('900000'), undefined, '1,234,000'],
  ];
  // 오디오 시트는 규격 다음에 열이 하나 더 있다 — 열 문자가 다르다(원가 H, 재료비 단가 J).
  const audio: XlsxCell[][] = [
    ['오디오'],
    ['번호', '품 명', '규 격', '모델 코드', '설 명', '단위', '수량', '원가', undefined, '재료비', undefined],
    [undefined, undefined, undefined, undefined, undefined, undefined, undefined, '단 가', '금 액', '단 가', '금 액'],
    ['1', '앰프', 'FAKE-AMP', 'X', '', 'EA', n('1'), n('70000'), undefined, n('99000')],
  ];
  return buildSimpleXlsx([
    { name: '갑지', rows: [['견적서 표지(가짜)'], ['합계', n('12345')]] },
    { name: '영상', rows: video, merges: ['A2:A3', 'B2:B3', 'C2:C3', 'G2:H2', 'I2:J2', 'K2:L2'] },
    { name: '오디오', rows: audio, merges: ['H2:I2', 'J2:K2'] },
  ]);
}

describe('표준품셈 원본 — 2단 머리글을 찾는다', () => {
  const sheets = readXlsxWorkbook(fakePumsemWorkbook());
  const catalog = fakeCatalog();

  it('4시트 형식이 아니다', () => {
    expect(isFourSheetWorkbook(sheets)).toBe(false);
  });

  it('견적 단가표의 시트만 읽고, 표지·없는 시트는 사유와 함께 빠진다', () => {
    const analysis = analyzePumsemWorkbook(sheets, catalog);
    expect(analysis.layouts.map((l) => l.sheet)).toEqual(['영상', '오디오']);
    expect(analysis.skipped).toContainEqual({ name: '갑지', reason: '견적 단가표에 없는 시트' });
    expect(analysis.skipped).toContainEqual({ name: 'CCTV', reason: '파일에 이 시트가 없음' });
  });

  it('병합된 위 칸 + 아래 칸으로 열 이름을 만든다', () => {
    const analysis = analyzePumsemWorkbook(sheets, catalog);
    const labels = analysis.layouts[0]!.columns.map((c) => `${c.letter}=${c.label}`);
    expect(labels).toContain('G=원가 / 단 가');
    expect(labels).toContain('H=원가 / 금 액');
    expect(labels).toContain('I=재료비 / 단 가');
    expect(analysis.layouts[0]!.dataStartIndex).toBe(3);
  });

  it('원가·판매가 열을 머리글 이름으로 미리 고른다 — 열 문자를 코드에 두지 않는다', () => {
    const analysis = analyzePumsemWorkbook(sheets, catalog);
    expect(analysis.suggestion).toEqual({
      cost: { index: 6, label: '원가 / 단 가' },
      selling: { index: 8, label: '재료비 / 단 가' },
    });
  });

  it('매입처·제조사·비고 열과 품명·규격은 고를 수 없다', () => {
    const analysis = analyzePumsemWorkbook(sheets, catalog);
    const labels = analysis.options.map((o) => o.label);
    expect(labels).not.toContain('제조사/구매처');
    expect(labels).not.toContain('비 고');
    expect(labels).not.toContain('품 명');
    expect(labels).not.toContain('규 격');
  });

  it('품명·규격 머리글이 없는 파일은 거부한다', () => {
    const other = readXlsxWorkbook(buildSimpleXlsx([{ name: '영상', rows: [['아무 표'], ['a', 'b']] }]));
    expect(() => analyzePumsemWorkbook(other, catalog)).toThrow(PriceFileError);
  });
});

describe('표준품셈 원본 — 시트·행으로 SKU를 찾고, 품명·규격이 맞을 때만 붙인다', () => {
  const sheets = readXlsxWorkbook(fakePumsemWorkbook());
  const catalog = fakeCatalog();
  const analysis = analyzePumsemWorkbook(sheets, catalog);
  const choice = analysis.suggestion as PumsemColumnChoice;
  const book = readPumsemPrices(sheets, analysis, choice, catalog, '2026-10-16T00:00:00.000Z');

  it('맞는 행의 원가만 붙는다 — 판매가는 담지 않는다', () => {
    expect(book.entries['VID-0005']).toEqual({ cost: '800000' });
    expect(book.entries['VID-0011']).toEqual({ cost: '900000' });
    expect(JSON.stringify(book.entries)).not.toContain('selling');
  });

  it('다른 시트는 열 위치가 달라도 같은 머리글 이름으로 찾는다', () => {
    expect(book.entries['AUD-0004']).toEqual({ cost: '70000' });
  });

  it('판매가 열은 공개 단가와 대조만 한다 — 다르거나 공개 단가가 없으면 세고 붙이지 않는다', () => {
    expect(book.summary.sellingDiffers).toBe(2);
    expect(book.summary.issues).toContainEqual({
      sheet: '영상', row: 8, sku: 'VID-0008', reason: '가격표 판매가가 공개 단가와 다름 — 붙이지 않음(공개 단가 사용)',
    });
    expect(book.summary.issues).toContainEqual({
      sheet: '영상', row: 10, sku: 'VID-0010', reason: '가격표에 판매가가 있지만 공개 단가가 없음 — 붙이지 않음',
    });
    // 쉼표가 든 문자열(1,234,000)은 공개 단가 1234000과 같다.
    expect(book.summary.issues.some((i) => i.sku === 'VID-0011')).toBe(false);
  });

  it('판매가 열을 고르지 않아도 된다 — 원가만 읽는다', () => {
    const costOnly = readPumsemPrices(sheets, analysis, { cost: choice.cost }, catalog, '');
    expect(costOnly.summary.applied).toBe(4);
    expect(costOnly.summary.sellingDiffers).toBe(0);
  });

  it('원가 열은 반드시 골라야 한다', () => {
    expect(() =>
      readPumsemPrices(sheets, analysis, { selling: choice.selling } as unknown as PumsemColumnChoice, catalog, ''),
    ).toThrow(PriceFileError);
  });

  it('품명이 다른 행은 "가격표 행 불일치"로 세고 붙이지 않는다', () => {
    expect(book.entries['VID-0006']).toBeUndefined();
    expect(book.summary.mismatched).toBe(1);
    expect(book.summary.issues).toContainEqual({ sheet: '영상', row: 6, sku: 'VID-0006', reason: '품명이 견적 단가표와 다름' });
  });

  it('원가 빈 칸은 미등록이다 — 0으로 채우지 않는다', () => {
    expect(book.entries['VID-0007']).toBeUndefined();
    expect(book.summary.blank).toBe(1);
  });

  it('수식 원가 칸은 읽지 않는다', () => {
    expect(book.entries['VID-0008']).toBeUndefined();
    expect(book.summary.formulaSkipped).toBe(1);
  });

  it('파생 단가 품목은 원가만 읽고 판매가는 대조하지 않는다', () => {
    expect(book.entries['VID-0009']).toEqual({ cost: '5000' });
  });

  it('숫자가 아닌 원가 칸은 세고 붙이지 않는다', () => {
    expect(book.entries['VID-0010']).toBeUndefined();
    expect(book.summary.notNumeric).toBe(1);
  });

  it('붙은·불일치·빈 칸 건수와 찾지 못한 품목 수를 낸다', () => {
    expect(book.summary.applied).toBe(4);
    expect(book.summary.missingInFile).toBe(1); // CCTV 시트가 파일에 없다
    expect(book.summary.sheetsRead).toEqual(['영상', '오디오']);
    expect(book.kind).toBe('pumsem');
    expect(book.catalogSourceSha256).toBe(SHA);
  });

  it('결과 요약에는 가격 값이 없다 — 좌표·SKU·건수만', () => {
    const text = JSON.stringify(book.summary);
    for (const value of ['800000', '1200000', '111111', '222222', '70000']) expect(text).not.toContain(value);
  });

  it('매입처 열은 값을 읽지 않는다', () => {
    expect(JSON.stringify(book)).not.toContain('가짜 매입처');
  });

  it('저장한 열 선택은 같은 자리·같은 이름일 때만 다시 묻지 않는다', () => {
    expect(savedChoiceFits(analysis, choice)).toBe(true);
    expect(savedChoiceFits(analysis, { cost: { index: 7, label: '원가 / 단 가' } })).toBe(false);
    expect(savedChoiceFits(analysis, { cost: { index: 6, label: '원가' } })).toBe(false);
    expect(savedChoiceFits(analysis, undefined)).toBe(false);
  });

  it('금지 열을 가격으로 고르면 거부한다', () => {
    expect(() =>
      readPumsemPrices(sheets, analysis, { cost: { index: 14, label: '제조사/구매처' } }, catalog, ''),
    ).toThrow(PriceFileError);
  });

  it('고른 열이 없는 시트는 사유와 함께 건너뛴다', () => {
    const only = readPumsemPrices(
      sheets,
      analysis,
      { cost: { index: 6, label: '원가 / 단 가' }, selling: { index: 10, label: '노무비 / 단 가' } },
      catalog,
      '',
    );
    expect(only.summary.sheetsSkipped).toContainEqual({ name: '오디오', reason: "판매가 열 '노무비 / 단 가'이 없음" });
    expect(only.summary.sheetsRead).toEqual(['영상']);
  });
});

function fakeFourSheetWorkbook(): Uint8Array {
  return buildSimpleXlsx([
    {
      name: '품목 단가',
      rows: [
        [...ITEM_HEADERS],
        ['VID-0005', 'FAKE-MX8', '매트릭스 스위처', n('500'), n('900'), '가짜 메모'],
        ['NOPE-0001', 'X', 'Y', n('1'), n('2')],
        ['VID-0006', 'WRONG-MODEL', '분배기', n('3'), n('4')],
        ['VID-0008', 'FAKE-SC2', '스케일러', n('5'), n('6')],
        ['VID-0008', 'FAKE-SC2', '스케일러', n('7'), n('8')],
        ['VID-0007', 'FAKE-CV1', '컨버터'],
        ['VID-0009', '', '배관 기타자재', n('100'), n('200')],
        ['AUD-0004', '', '', undefined, n('31000')],
        ['VID-0010', '', '익스텐더', undefined, n('32000')],
        ['VID-0011', 'FAKE MON 55', '모니터', undefined, '$1,200'],
      ],
    },
    { name: '기본값', rows: [['선 종류', '기본 케이블 코드']] },
    { name: '노무 확인', rows: [['품셈 연결 코드']] },
    { name: '간접비', rows: [['항목', '요율', '적용 여부']] },
  ]);
}

describe('4시트 가격표 — 품목 단가 시트', () => {
  const sheets = readXlsxWorkbook(fakeFourSheetWorkbook());
  const catalog = fakeCatalog();
  const book = readFourSheetPrices(sheets, catalog, '2026-10-16T00:00:00.000Z');

  it('시트 이름으로 형식을 알아본다', () => {
    expect(isFourSheetWorkbook(sheets)).toBe(true);
  });

  it('품목코드로 원가를 붙이고, 모델·품명이 다르거나 중복이면 붙이지 않는다 — 중복은 모든 줄을 뺀다', () => {
    expect(book.entries['VID-0005']).toEqual({ cost: '500' });
    expect(book.entries['VID-0006']).toBeUndefined();
    expect(book.entries['VID-0008']).toBeUndefined();
    expect(book.summary.unknownCodes).toBe(1);
    expect(book.summary.mismatched).toBe(4);
    expect(book.summary.issues.map((i) => i.reason).filter((r) => !r.includes('판매가'))).toEqual([
      '견적 단가표에 없는 품목코드',
      '모델이 견적 단가표와 다름',
      '품목코드 중복 — 어느 줄인지 정할 수 없음',
      '품목코드 중복 — 어느 줄인지 정할 수 없음',
      '모델·품명이 비어 견적 단가표와 대조할 수 없음',
    ]);
  });

  it('판매가가 공개 단가와 다르면(또는 공개 단가가 없으면) 붙이지 않고 센다', () => {
    expect(book.summary.sellingDiffers).toBe(2); // VID-0005(900 ≠ 공개 1200000), VID-0010(공개 단가 없음)
  });

  it('모델·품명이 둘 다 비면 붙이지 않는다. 하나만 적혀 있으면 그것으로 대조한다. 빈 원가는 미등록이다', () => {
    expect(book.entries['AUD-0004']).toBeUndefined();
    expect(book.entries['VID-0010']).toBeUndefined();
    expect(book.entries['VID-0007']).toBeUndefined();
    expect(book.summary.blank).toBe(3);
  });

  it("'원가' 머리글이 없으면 거부한다 — 판매가만 있는 가격표는 받지 않는다", () => {
    const sellingOnly = readXlsxWorkbook(
      buildSimpleXlsx([{ name: '품목 단가', rows: [['품목코드', '모델', '품명', '판매가'], ['VID-0005', 'FAKE-MX8', '', n('1')]] }]),
    );
    expect(() => readFourSheetPrices(sellingOnly, catalog, '')).toThrow(PriceFileError);
  });

  it('원화 밖 통화 기호가 붙은 가격은 원으로 바꿔 읽지 않는다', () => {
    expect(book.entries['VID-0011']).toBeUndefined();
    expect(book.summary.notNumeric).toBe(1);
  });

  it('파생 단가 품목은 원가만 붙는다', () => {
    expect(book.entries['VID-0009']).toEqual({ cost: '100' });
  });

  it('나머지 세 시트는 이번 판에서 읽지 않았다고 알린다', () => {
    for (const name of ['기본값', '노무 확인', '간접비']) {
      expect(book.summary.sheetsSkipped).toContainEqual({ name, reason: '이번 판에서는 읽지 않음 — 지금 코드 기본값을 씁니다' });
    }
    expect(book.kind).toBe('four-sheet');
  });

  it('비고 열은 읽지 않는다', () => {
    expect(JSON.stringify(book)).not.toContain('가짜 메모');
  });
});

describe('빈 가격표 서식', () => {
  const catalog = fakeCatalog();
  const sheets = readXlsxWorkbook(buildBlankPriceTemplate(catalog));

  it('네 시트를 만든다', () => {
    expect(sheets.map((s) => s.name)).toEqual(['품목 단가', '기본값', '노무 확인', '간접비']);
  });

  it('품목 단가 — 품목코드·모델·품명을 채우고 원가·판매가는 비운다. 판매가는 선택이라고 적는다', () => {
    const items = sheets[0]!;
    expect(items.rows[0]).toEqual([...ITEM_HEADERS]);
    expect(items.rows[1]![4]).toBe(ITEM_NOTE_ROW[4]);
    expect(items.rows[1]![4]).toContain('선택(비우면 공개 단가 사용');
    expect(items.rows).toHaveLength(catalog.products.length + 2);
    expect(items.rows[2]!.slice(0, 3)).toEqual(['VID-0005', 'FAKE-MX8', '매트릭스 스위처']);
    for (const row of items.rows.slice(2)) {
      expect(row[3] ?? '').toBe('');
      expect(row[4] ?? '').toBe('');
    }
  });

  it('기본값 — 지금 코드의 기본 케이블 값을 채운다', () => {
    const defaults = sheets[1]!.rows.slice(1).map((r) => [r[0] ?? '', r[1] ?? '', r[2] ?? '', r[3] ?? '']);
    expect(defaults).toEqual(currentCableDefaults());
    expect(defaults).toContainEqual(['HDMI', 'CBL-0017', '', '']);
    expect(defaults).toContainEqual(['LAN', 'CBL-0090', '10', 'CBL-0091']);
    expect(defaults).toContainEqual(['A.AUDIO', 'CBL-0106', '', '']);
  });

  it('그대로 다시 불러오면 아무 가격도 붙지 않는다 — 안내 행은 데이터로 읽지 않는다', () => {
    const book = readFourSheetPrices(sheets, catalog, '');
    expect(book.entries).toEqual({});
    expect(book.summary.applied).toBe(0);
    expect(book.summary.mismatched).toBe(0);
    expect(book.summary.unknownCodes).toBe(0);
    expect(book.summary.blank).toBe(catalog.products.length);
  });
});

function fakeBook(catalog: Catalog, entries: PriceBook['entries']): PriceBook {
  const sheets = readXlsxWorkbook(fakeFourSheetWorkbook());
  const base = readFourSheetPrices(sheets, catalog, '2026-10-16T00:00:00.000Z');
  return { ...base, entries };
}

describe('가격표 적용 — 원가는 원가 세션으로만, 판매가는 공개 단가 그대로', () => {
  const catalog = fakeCatalog();

  it('원가는 SKU로 찾는 원가 세션 줄이 된다 — 단위는 견적 단가표 단위', () => {
    const book = fakeBook(catalog, { 'VID-0005': { cost: '7654321' } });
    const session = priceBookCostSession(book, catalog)!;
    expect(session.size).toBe(1);
    expect(session.lookup('VID-0005')?.purchaseUnitPrice).toBe('7654321');
    expect(session.lookup('VID-0005')?.unit).toBe('EA');
    // 세션은 직렬화해도 원가가 나가지 않는다(기존 원가 세션 규칙).
    expect(JSON.stringify(session)).not.toContain('7654321');
    // 카탈로그(공개 판매가)는 가격표가 바꾸지 않는다.
    expect(catalog.prices.get('VID-0005')).toBe('1200000');
  });

  it('다른 판의 견적 단가표에서 불러온 가격표는 적용하지 않는다', () => {
    const book = { ...fakeBook(catalog, { 'VID-0005': { cost: '1' } }), catalogSourceSha256: 'd'.repeat(64) };
    expect(costEntriesFromBook(book, catalog)).toEqual([]);
    expect(priceBookCostSession(book, catalog)).toBeUndefined();
  });

  it('원가가 하나도 없으면 원가 세션을 만들지 않는다', () => {
    expect(priceBookCostSession(fakeBook(catalog, {}), catalog)).toBeUndefined();
    expect(priceBookCostSession(undefined, catalog)).toBeUndefined();
  });
});

describe('저장된 가격표 검증', () => {
  const catalog = fakeCatalog();

  it('맞는 형식은 그대로 읽는다', () => {
    const book = fakeBook(catalog, { 'VID-0005': { cost: '1' } });
    const record = { schemaVersion: 1, book, pumsemColumns: { cost: { index: 6, label: '원가 / 단 가' } } };
    expect(parseStoredPriceRecord(JSON.parse(JSON.stringify(record)))).toEqual(record);
  });

  it('깨진 값·음수 가격·모르는 칸은 쓰지 않는다', () => {
    const book = fakeBook(catalog, {});
    expect(parseStoredPriceRecord({ schemaVersion: 2 })).toBeUndefined();
    expect(parseStoredPriceRecord({ schemaVersion: 1, book: { ...book, entries: { A: { cost: '-1' } } } })).toBeUndefined();
    expect(parseStoredPriceRecord({ schemaVersion: 1, book: { ...book, entries: { A: { cost: '1', selling: '2' } } } })).toBeUndefined();
    expect(parseStoredPriceRecord({ schemaVersion: 1, pumsemColumns: { selling: { index: 1, label: 'x' } } })).toBeUndefined();
    expect(parseStoredPriceRecord('문자열')).toBeUndefined();
  });

  it('파일 이름을 저장할 자리가 없다', () => {
    const book = fakeBook(catalog, {});
    expect(Object.keys(book).sort()).toEqual(['catalogSourceSha256', 'entries', 'importedAt', 'kind', 'schemaVersion', 'summary']);
  });
});
