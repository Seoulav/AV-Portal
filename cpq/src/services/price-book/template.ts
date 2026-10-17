/**
 * 빈 가격표 서식 (B-20261016-06, 2순위 형식).
 *
 * 표준품셈 원본이 없거나 품목을 직접 관리할 때 쓰는 4시트 서식이다.
 * 공개 품목 목록(`products.json`)으로 `품목 단가` 시트의 품목코드·모델·품명을
 * 채우고, **원가·판매가 칸은 비운다.** 원가는 필수, 판매가는 선택이다 — 비우면
 * 공개 단가를 쓰고, 적어도 공개 단가와 대조만 한다(2026-10-16 「공개 유지안」).
 * 머리글 아래 안내 행은 품목코드 칸이 비어 있어 불러올 때 건너뛴다. `기본값` 시트에는 지금 코드에 고정된
 * 기본 케이블 값을 채운다(시트가 없거나 빈 칸이면 코드 기본값을 쓴다는 뜻).
 *
 * 이 서식은 가격을 담지 않으므로 누구에게 보여도 된다. 사용자가 가격을 채운
 * 파일은 저장소에 넣지 않는다(`.gitignore`의 `*가격표*.xlsx`).
 */
import type { Catalog } from '../../data/catalog/load';
import {
  DEFAULT_BULK_CABLE_SKU_BY_LINE_TYPE,
  DEFAULT_BULK_METERS_PER_SEGMENT_BY_LINE_TYPE,
  DEFAULT_READY_MADE_CABLE_SKU_BY_LINE_TYPE,
} from '../../import/diagram/cables';
import { CONNECTOR_SKUS_BY_CABLE_SKU } from '../../import/diagram/derived';
import {
  FOUR_SHEET_DEFAULTS,
  FOUR_SHEET_INDIRECT,
  FOUR_SHEET_ITEMS,
  FOUR_SHEET_LABOR,
} from './readPriceFile';
import { buildSimpleXlsx, type XlsxCell } from './xlsxWriter';

export const PRICE_TEMPLATE_FILE_NAME = '가격표-서식.xlsx';

export const ITEM_HEADERS = ['품목코드', '모델', '품명', '원가', '판매가', '비고'] as const;
/** 머리글 아래 안내 행. 품목코드 칸을 비워 두어 데이터로 읽히지 않는다. */
export const ITEM_NOTE_ROW = [
  '',
  '',
  '',
  '필수 — 이 브라우저에만 저장',
  '선택(비우면 공개 단가 사용 · 공개 단가와 다르면 붙이지 않고 알림)',
  '읽지 않음',
] as const;
export const DEFAULT_HEADERS = ['선 종류', '기본 케이블 코드', '거리 미입력 기본 길이(m)', '커넥터 코드'] as const;
export const LABOR_HEADERS = ['품셈 연결 코드', '품셈 판', '확인일', '확인자'] as const;
export const INDIRECT_HEADERS = ['항목', '요율', '적용 여부'] as const;

/** 지금 코드에 고정된 선 종류별 기본값 — `기본값` 시트에 그대로 적는다. */
export function currentCableDefaults(): Array<[string, string, string, string]> {
  const lineTypes = [
    ...new Set([
      ...DEFAULT_READY_MADE_CABLE_SKU_BY_LINE_TYPE.keys(),
      ...DEFAULT_BULK_CABLE_SKU_BY_LINE_TYPE.keys(),
      ...DEFAULT_BULK_METERS_PER_SEGMENT_BY_LINE_TYPE.keys(),
    ]),
  ];
  return lineTypes.map((lineType) => {
    const cable =
      DEFAULT_READY_MADE_CABLE_SKU_BY_LINE_TYPE.get(lineType) ?? DEFAULT_BULK_CABLE_SKU_BY_LINE_TYPE.get(lineType) ?? '';
    const meters = DEFAULT_BULK_METERS_PER_SEGMENT_BY_LINE_TYPE.get(lineType);
    const connector = cable === '' ? '' : (CONNECTOR_SKUS_BY_CABLE_SKU.get(cable) ?? []).join('·');
    return [lineType, cable, meters === undefined ? '' : String(meters), connector];
  });
}

export function buildBlankPriceTemplate(catalog: Catalog): Uint8Array {
  const itemRows: XlsxCell[][] = [
    [...ITEM_HEADERS],
    ITEM_NOTE_ROW.map((text) => (text === '' ? undefined : text)),
    ...catalog.products.map((p): XlsxCell[] => [p.sku, p.model, p.quoteName, undefined, undefined, undefined]),
  ];
  const defaultRows: XlsxCell[][] = [
    [...DEFAULT_HEADERS],
    ...currentCableDefaults().map(([lineType, cable, meters, connector]): XlsxCell[] => [
      lineType,
      cable,
      meters === '' ? undefined : { number: meters },
      connector,
    ]),
  ];
  return buildSimpleXlsx([
    { name: FOUR_SHEET_ITEMS, rows: itemRows, widths: [12, 24, 40, 14, 14, 24] },
    { name: FOUR_SHEET_DEFAULTS, rows: defaultRows, widths: [12, 18, 24, 14] },
    { name: FOUR_SHEET_LABOR, rows: [[...LABOR_HEADERS]], widths: [18, 18, 12, 12] },
    { name: FOUR_SHEET_INDIRECT, rows: [[...INDIRECT_HEADERS]], widths: [24, 10, 10] },
  ]);
}
