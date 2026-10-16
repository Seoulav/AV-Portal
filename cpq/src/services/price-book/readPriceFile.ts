/**
 * 가격표 파일 읽기 (B-20261016-06) — **원가 전용**.
 *
 * 2026-10-16 사용자 결정(「옮길 때까지 공개 유지」): 판매가는 공개 `prices.json`이
 * 기준이다. 여기서는 원가만 읽는다. 판매가 열을 고르면(선택) 공개 단가와 **대조만**
 * 하고, 다르거나 공개 단가가 없으면 붙이지 않고 `sellingDiffers`로 센다.
 *
 * 두 형식을 받는다. 시트 이름으로 알아본다.
 *
 *   1순위  표준품셈 원본 xlsx — 견적 단가표(`products.json`)를 뽑은 바로 그 파일.
 *          시트 이름 + 원본 행 번호로 SKU를 찾는다(`options.sheet`·`options.sourceRow`).
 *   2순위  4시트 가격표 — `품목 단가`·`기본값`·`노무 확인`·`간접비`.
 *          이번 판은 `품목 단가`만 읽는다(나머지는 읽지 않았다고 결과에 적는다).
 *
 * ## 추측하지 않는다
 *
 *   - **열 문자를 코드에 고정하지 않는다.** 상·하반기 판마다 열 위치가 다르다.
 *     머리글로 찾고, 처음 한 번은 사람이 원가 열·판매가 열을 확인한다.
 *   - **판이 다를 수 있다.** 행마다 그 행의 품명·규격이 견적 단가표와
 *     맞을 때만 가격을 붙인다. 맞지 않으면 "가격표 행 불일치"로 세고 붙이지 않는다.
 *   - 매입처·제조사·영업비고 열은 고를 수도 읽을 수도 없다.
 *   - 가격 칸이 수식이면 그 칸을 쓰지 않는다(설계서 §8.3).
 *   - 빈 칸은 미등록이다. `0`으로 채우지 않는다(설계서 §5.6).
 *
 * 오류와 결과에는 **좌표·SKU·건수만** 담는다. 가격 값은 담지 않는다(설계서 §8.4).
 */
import type { Catalog, CatalogProduct } from '../../data/catalog/load';
import type { DecimalText } from '../../domain/quote/types';
import { dec } from '../../domain/calculation/rounding';
import { columnLetter, normalizeNumber } from '../private-cost/parse';
import type { XlsxSheetGrid } from '../private-cost/readTable';
import {
  emptySummary,
  MAX_ISSUE_SAMPLES,
  type PriceBook,
  type PriceBookEntry,
  type PriceImportSummary,
  type PumsemColumnChoice,
} from './types';

export class PriceFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PriceFileError';
  }
}

/** 비교용 — 공백·줄바꿈·대소문자만 맞춘다. **비슷한 글자를 같다고 보지 않는다.** */
export function normalizeText(value: string | undefined): string {
  return (value ?? '').normalize('NFC').replace(/\s+/g, '').toUpperCase();
}

/** 고를 수도 읽을 수도 없는 열 — 매입처·제조사·영업비고 등(결정 D1, 명세 B-20261016-06). */
const FORBIDDEN_COLUMN = /매입처|제조사|구매처|비고|영업|메모/;

export function isForbiddenColumnLabel(label: string): boolean {
  return FORBIDDEN_COLUMN.test(label.replace(/\s+/g, ''));
}

// ---------------------------------------------------------------------------
// 공통: 가격 칸 읽기와 집계
// ---------------------------------------------------------------------------

type CellRead =
  | { kind: 'empty' }
  | { kind: 'formula' }
  | { kind: 'invalid' }
  | { kind: 'value'; value: DecimalText };

function readPriceCell(sheet: XlsxSheetGrid, rowIndex: number, column: number): CellRead {
  if (sheet.formulas[rowIndex]?.has(column) === true) return { kind: 'formula' };
  const raw = (sheet.rows[rowIndex]?.[column] ?? '').trim();
  if (raw === '') return { kind: 'empty' };
  // 원화 밖의 통화 기호는 원으로 바꿔 읽지 않는다(독립 리뷰 지적: "$1,200"이 1,200원이 되면 안 된다).
  if (/[$¥€£]/.test(raw)) return { kind: 'invalid' };
  const value = normalizeNumber(raw);
  if (value === undefined || value.startsWith('-')) return { kind: 'invalid' };
  return { kind: 'value', value };
}

function pushIssue(summary: PriceImportSummary, issue: PriceImportSummary['issues'][number]): void {
  if (summary.issues.length < MAX_ISSUE_SAMPLES) summary.issues.push(issue);
}

/**
 * 맞는 행 하나를 반영한다. 원가는 붙이고, 판매가(고른 경우)는 공개 단가와
 * 대조만 한다. `selling`이 `undefined`면 판매가 열을 고르지 않았거나 대조하지
 * 않는 품목(파생 단가)이다.
 */
function accumulate(
  summary: PriceImportSummary,
  entries: Record<string, PriceBookEntry>,
  catalog: Catalog,
  where: { sheet: string; row: number; sku: string },
  cost: CellRead,
  selling: CellRead | undefined,
): void {
  if (cost.kind === 'empty') summary.blank += 1;
  else if (cost.kind === 'formula') summary.formulaSkipped += 1;
  else if (cost.kind === 'invalid') summary.notNumeric += 1;
  else {
    entries[where.sku] = { cost: cost.value };
    summary.applied += 1;
  }

  if (selling === undefined) return;
  if (selling.kind === 'formula') summary.formulaSkipped += 1;
  if (selling.kind === 'invalid') summary.notNumeric += 1;
  if (selling.kind !== 'value') return;
  const published = catalog.prices.get(where.sku);
  if (published !== undefined && dec(published).equals(dec(selling.value))) return;
  summary.sellingDiffers += 1;
  pushIssue(summary, {
    ...where,
    reason:
      published === undefined
        ? '가격표에 판매가가 있지만 공개 단가가 없음 — 붙이지 않음'
        : '가격표 판매가가 공개 단가와 다름 — 붙이지 않음(공개 단가 사용)',
  });
}

/** 파생 단가 품목(`배관 기타자재` 등)은 견적 시점에 계산된다 — 고정 판매가를 붙이지 않는다. */
function isDerivedPricing(product: CatalogProduct): boolean {
  return product.options['pricing'] === 'derived';
}

function finishBook(
  kind: PriceBook['kind'],
  catalog: Catalog,
  entries: Record<string, PriceBookEntry>,
  summary: PriceImportSummary,
  visited: ReadonlySet<string>,
  importedAt: string,
): PriceBook {
  summary.missingInFile = catalog.products.filter((p) => !visited.has(p.sku)).length;
  return {
    schemaVersion: 1,
    kind,
    catalogSourceSha256: catalog.sourceSha256,
    importedAt,
    entries,
    summary,
  };
}

// ---------------------------------------------------------------------------
// 형식 판별
// ---------------------------------------------------------------------------

export const FOUR_SHEET_ITEMS = '품목 단가';
export const FOUR_SHEET_DEFAULTS = '기본값';
export const FOUR_SHEET_LABOR = '노무 확인';
export const FOUR_SHEET_INDIRECT = '간접비';

/** `품목 단가` 시트가 있으면 4시트 가격표다. 없으면 표준품셈 원본으로 본다. */
export function isFourSheetWorkbook(sheets: readonly XlsxSheetGrid[]): boolean {
  return sheets.some((s) => normalizeText(s.name) === normalizeText(FOUR_SHEET_ITEMS));
}

// ---------------------------------------------------------------------------
// 1순위: 표준품셈 원본
// ---------------------------------------------------------------------------

export interface PumsemColumn {
  index: number;
  /** 화면 표시용 열 문자(이 시트 기준). 코드가 이 문자로 열을 찾지 않는다. */
  letter: string;
  /** 위 칸 머리글(병합으로 덮인 칸은 병합 시작 칸의 글자). */
  top: string;
  /** 2단 머리글의 아래 칸. 없으면 빈 문자열. */
  sub: string;
  /** `위 / 아래` 꼴. 사람이 고르고, 저장하고, 다른 시트에서 이 이름으로 찾는다. */
  label: string;
}

export interface PumsemSheetLayout {
  sheet: string;
  /** 머리글(품명·규격이 있는) 행 자리(0부터). */
  headerRowIndex: number;
  /** 2단 머리글이면 그 아래 행까지가 머리글이다. 데이터 행은 그 다음부터 본다. */
  dataStartIndex: number;
  nameColumn: number;
  specColumn: number;
  columns: PumsemColumn[];
}

export interface PumsemAnalysis {
  layouts: PumsemSheetLayout[];
  skipped: Array<{ name: string; reason: string }>;
  /** 원가·판매가로 고를 수 있는 열(첫 시트 기준, 금지 열·품명·규격 제외). */
  options: PumsemColumn[];
  /** 머리글 이름으로 미리 골라 둔 열(원가는 `원가`+`단가`, 대조용 판매가는 `재료비`+`단가`). 사람이 확인하고 바꿀 수 있다. */
  suggestion: Partial<PumsemColumnChoice>;
}

const HEADER_SCAN_ROWS = 40;

function findHeaderRow(sheet: XlsxSheetGrid): { row: number; name: number; spec: number } | undefined {
  const limit = Math.min(HEADER_SCAN_ROWS, sheet.rows.length);
  for (let r = 0; r < limit; r += 1) {
    const cells = (sheet.rows[r] ?? []).map((c) => normalizeText(c));
    const name = cells.indexOf('품명');
    const spec = cells.indexOf('규격');
    if (name !== -1 && spec !== -1) return { row: r, name, spec };
  }
  return undefined;
}

function layoutOf(sheet: XlsxSheetGrid): PumsemSheetLayout | undefined {
  const header = findHeaderRow(sheet);
  if (header === undefined) return undefined;
  const top = sheet.rows[header.row] ?? [];
  const next = sheet.rows[header.row + 1] ?? [];
  // 2단 머리글: 다음 행의 품명 칸이 비어 있고(세로 병합), 어딘가에 '단가'·'금액'이 있다.
  const hasSub =
    (next[header.name] ?? '').trim() === '' && next.some((c) => /단가|금액/.test(normalizeText(c)));
  const width = Math.max(top.length, hasSub ? next.length : 0);

  const columns: PumsemColumn[] = [];
  for (let c = 0; c < width; c += 1) {
    let topLabel = (top[c] ?? '').trim();
    if (topLabel === '') {
      const merge = sheet.merges.find(
        (m) => m.firstRow <= header.row && m.lastRow >= header.row && m.firstColumn < c && m.lastColumn >= c,
      );
      if (merge !== undefined) topLabel = (sheet.rows[merge.firstRow]?.[merge.firstColumn] ?? '').trim();
    }
    const subLabel = hasSub ? (next[c] ?? '').trim() : '';
    const label = topLabel !== '' && subLabel !== '' ? `${topLabel} / ${subLabel}` : topLabel !== '' ? topLabel : subLabel;
    if (label === '') continue;
    columns.push({ index: c, letter: columnLetter(c), top: topLabel, sub: subLabel, label });
  }
  return {
    sheet: sheet.name,
    headerRowIndex: header.row,
    dataStartIndex: header.row + (hasSub ? 2 : 1),
    nameColumn: header.name,
    specColumn: header.spec,
    columns,
  };
}

function suggestOf(columns: readonly PumsemColumn[]): Partial<PumsemColumnChoice> {
  const pick = (test: (c: PumsemColumn) => boolean): PumsemColumn | undefined => columns.find(test);
  const cost =
    pick((c) => normalizeText(c.top).startsWith('원가') && normalizeText(c.sub) === '단가') ??
    pick((c) => normalizeText(c.label) === '원가');
  const selling =
    pick((c) => normalizeText(c.top).startsWith('재료비') && normalizeText(c.sub) === '단가') ??
    pick((c) => normalizeText(c.label) === '재료비단가');
  return {
    ...(cost !== undefined ? { cost: { index: cost.index, label: cost.label } } : {}),
    ...(selling !== undefined ? { selling: { index: selling.index, label: selling.label } } : {}),
  };
}

/**
 * 시트마다 머리글을 찾는다. 견적 단가표에 없는 시트는 읽지 않는다.
 * 품명·규격 머리글을 찾은 시트가 하나도 없으면 표준품셈 형식이 아니다.
 */
export function analyzePumsemWorkbook(sheets: readonly XlsxSheetGrid[], catalog: Catalog): PumsemAnalysis {
  const catalogSheets = new Set(catalog.products.map((p) => p.options['sheet']).filter((s): s is string => s !== undefined));
  const layouts: PumsemSheetLayout[] = [];
  const skipped: PumsemAnalysis['skipped'] = [];
  for (const sheet of sheets) {
    if (!catalogSheets.has(sheet.name)) {
      skipped.push({ name: sheet.name, reason: '견적 단가표에 없는 시트' });
      continue;
    }
    const layout = layoutOf(sheet);
    if (layout === undefined) {
      skipped.push({ name: sheet.name, reason: '품명·규격 머리글을 찾지 못함' });
      continue;
    }
    layouts.push(layout);
  }
  const present = new Set(sheets.map((s) => s.name));
  for (const name of catalogSheets) {
    if (!present.has(name)) skipped.push({ name, reason: '파일에 이 시트가 없음' });
  }
  if (layouts.length === 0) {
    throw new PriceFileError(
      '표준품셈 시트(품명·규격 머리글)를 찾지 못했습니다. 견적 단가표를 뽑은 표준품셈 원본이나 「품목 단가」 시트가 있는 가격표를 고르세요.',
    );
  }
  const first = layouts[0]!;
  const options = first.columns.filter(
    (c) => c.index !== first.nameColumn && c.index !== first.specColumn && !isForbiddenColumnLabel(c.label),
  );
  return { layouts, skipped, options, suggestion: suggestOf(options) };
}

/**
 * 저장해 둔 열 선택이 이 파일에도 그대로 맞는가 — 첫 시트의 **같은 자리에
 * 같은 머리글**이 있어야 한다. 맞으면 다시 묻지 않는다. 판이 바뀌어 자리나
 * 이름이 달라졌으면 다시 묻는다.
 */
export function savedChoiceFits(analysis: PumsemAnalysis, saved: PumsemColumnChoice | undefined): boolean {
  if (saved === undefined) return false;
  const fits = (ref: { index: number; label: string } | undefined): boolean =>
    ref === undefined ||
    analysis.options.some((c) => c.index === ref.index && normalizeText(c.label) === normalizeText(ref.label));
  return fits(saved.cost) && fits(saved.selling);
}

function resolveColumn(
  layout: PumsemSheetLayout,
  ref: { index: number; label: string },
): number | 'missing' | 'ambiguous' {
  const matches = layout.columns.filter((c) => normalizeText(c.label) === normalizeText(ref.label));
  if (matches.length === 0) return 'missing';
  if (matches.length === 1) return matches[0]!.index;
  const exact = matches.find((c) => c.index === ref.index);
  return exact === undefined ? 'ambiguous' : exact.index;
}

/** 표준품셈 원본에서 원가·판매가를 읽는다. `choice`는 사람이 확인한 열이다. */
export function readPumsemPrices(
  sheets: readonly XlsxSheetGrid[],
  analysis: PumsemAnalysis,
  choice: PumsemColumnChoice,
  catalog: Catalog,
  importedAt: string,
): PriceBook {
  if (choice.cost === undefined) {
    throw new PriceFileError('원가 열을 골라야 합니다(판매가 열은 선택입니다).');
  }
  for (const ref of [choice.cost, choice.selling]) {
    if (ref !== undefined && isForbiddenColumnLabel(ref.label)) {
      throw new PriceFileError(`'${ref.label}' 열은 가격으로 읽을 수 없습니다(매입처·제조사·비고 열).`);
    }
  }

  const productAt = new Map<string, CatalogProduct>();
  for (const product of catalog.products) {
    const sheet = product.options['sheet'];
    const row = product.options['sourceRow'];
    if (sheet !== undefined && row !== undefined) productAt.set(`${sheet}\n${row}`, product);
  }

  const summary = emptySummary();
  summary.sheetsSkipped.push(...analysis.skipped);
  const entries: Record<string, PriceBookEntry> = {};
  const visited = new Set<string>();
  const byName = new Map(sheets.map((s) => [s.name, s]));

  for (const layout of analysis.layouts) {
    const sheet = byName.get(layout.sheet);
    if (sheet === undefined) continue;
    const costColumn = resolveColumn(layout, choice.cost);
    const sellingColumn = choice.selling === undefined ? undefined : resolveColumn(layout, choice.selling);
    const problem = [
      costColumn === 'missing' ? `원가 열 '${choice.cost.label}'이 없음` : undefined,
      costColumn === 'ambiguous' ? `원가 열 '${choice.cost.label}'이 둘 이상` : undefined,
      sellingColumn === 'missing' ? `판매가 열 '${choice.selling!.label}'이 없음` : undefined,
      sellingColumn === 'ambiguous' ? `판매가 열 '${choice.selling!.label}'이 둘 이상` : undefined,
    ].filter((p): p is string => p !== undefined);
    if (problem.length > 0) {
      summary.sheetsSkipped.push({ name: layout.sheet, reason: problem.join(', ') });
      continue;
    }
    summary.sheetsRead.push(layout.sheet);

    for (let r = layout.dataStartIndex; r < sheet.rows.length; r += 1) {
      const product = productAt.get(`${layout.sheet}\n${r + 1}`);
      if (product === undefined) continue;
      visited.add(product.sku);
      const row = sheet.rows[r] ?? [];
      const nameMatches = normalizeText(row[layout.nameColumn]) === normalizeText(product.quoteName);
      const specMatches = normalizeText(row[layout.specColumn]) === normalizeText(product.quoteSpec);
      if (!nameMatches || !specMatches) {
        summary.mismatched += 1;
        pushIssue(summary, {
          sheet: layout.sheet,
          row: r + 1,
          sku: product.sku,
          reason: !nameMatches && !specMatches ? '품명·규격이 견적 단가표와 다름' : !nameMatches ? '품명이 견적 단가표와 다름' : '규격이 견적 단가표와 다름',
        });
        continue;
      }
      if (typeof costColumn !== 'number') continue; // 위에서 시트를 건너뛰었다 — 타입 좁히기용
      const cost = readPriceCell(sheet, r, costColumn);
      const selling =
        typeof sellingColumn === 'number' && !isDerivedPricing(product) ? readPriceCell(sheet, r, sellingColumn) : undefined;
      accumulate(summary, entries, catalog, { sheet: layout.sheet, row: r + 1, sku: product.sku }, cost, selling);
    }
  }

  if (summary.sheetsRead.length === 0) {
    throw new PriceFileError('고른 열이 있는 시트가 하나도 없습니다. 열 선택을 다시 확인하세요.');
  }
  return finishBook('pumsem', catalog, entries, summary, visited, importedAt);
}

// ---------------------------------------------------------------------------
// 2순위: 4시트 가격표
// ---------------------------------------------------------------------------

const FOUR_SHEET_HEADERS = {
  code: '품목코드',
  model: '모델',
  name: '품명',
  cost: '원가',
  selling: '판매가',
} as const;

/** 4시트 가격표의 `품목 단가` 시트를 읽는다. 다른 세 시트는 이번 판에서 읽지 않는다. */
export function readFourSheetPrices(sheets: readonly XlsxSheetGrid[], catalog: Catalog, importedAt: string): PriceBook {
  const items = sheets.find((s) => normalizeText(s.name) === normalizeText(FOUR_SHEET_ITEMS));
  if (items === undefined) throw new PriceFileError(`'${FOUR_SHEET_ITEMS}' 시트가 없습니다.`);

  let headerRow = -1;
  let header: string[] = [];
  for (let r = 0; r < Math.min(HEADER_SCAN_ROWS, items.rows.length); r += 1) {
    const cells = (items.rows[r] ?? []).map((c) => normalizeText(c));
    if (cells.includes(normalizeText(FOUR_SHEET_HEADERS.code))) {
      headerRow = r;
      header = cells;
      break;
    }
  }
  if (headerRow === -1) throw new PriceFileError(`'${FOUR_SHEET_ITEMS}' 시트에서 '품목코드' 머리글을 찾지 못했습니다.`);
  const at = (name: string): number | undefined => {
    const index = header.indexOf(normalizeText(name));
    return index === -1 ? undefined : index;
  };
  const codeColumn = at(FOUR_SHEET_HEADERS.code)!;
  const modelColumn = at(FOUR_SHEET_HEADERS.model);
  const nameColumn = at(FOUR_SHEET_HEADERS.name);
  const costColumn = at(FOUR_SHEET_HEADERS.cost);
  const sellingColumn = at(FOUR_SHEET_HEADERS.selling);
  if (costColumn === undefined) {
    throw new PriceFileError(`'${FOUR_SHEET_ITEMS}' 시트에 '원가' 머리글이 없습니다(판매가 열은 선택입니다).`);
  }

  const bySku = new Map(catalog.products.map((p) => [p.sku, p]));
  const summary = emptySummary();
  const entries: Record<string, PriceBookEntry> = {};
  const visited = new Set<string>();
  summary.sheetsRead.push(items.name);
  for (const sheet of sheets) {
    if (sheet === items) continue;
    const known = [FOUR_SHEET_DEFAULTS, FOUR_SHEET_LABOR, FOUR_SHEET_INDIRECT].some(
      (n) => normalizeText(n) === normalizeText(sheet.name),
    );
    summary.sheetsSkipped.push({
      name: sheet.name,
      reason: known ? '이번 판에서는 읽지 않음 — 지금 코드 기본값을 씁니다' : '가격표 형식에 없는 시트',
    });
  }

  // 같은 품목코드가 두 줄 이상이면 어느 줄인지 정할 수 없다 — **모든 줄을** 뺀다
  // (먼저 나온 줄을 고르면 조용히 틀린다, 독립 리뷰 지적).
  const codeCount = new Map<string, number>();
  for (let r = headerRow + 1; r < items.rows.length; r += 1) {
    const code = (items.rows[r]?.[codeColumn] ?? '').trim();
    if (code !== '') codeCount.set(code, (codeCount.get(code) ?? 0) + 1);
  }

  for (let r = headerRow + 1; r < items.rows.length; r += 1) {
    const row = items.rows[r] ?? [];
    const code = (row[codeColumn] ?? '').trim();
    if (code === '') continue;
    const product = bySku.get(code);
    if (product === undefined) {
      summary.unknownCodes += 1;
      pushIssue(summary, { sheet: items.name, row: r + 1, sku: code, reason: '견적 단가표에 없는 품목코드' });
      continue;
    }
    visited.add(code);
    if ((codeCount.get(code) ?? 0) > 1) {
      summary.mismatched += 1;
      pushIssue(summary, { sheet: items.name, row: r + 1, sku: code, reason: '품목코드 중복 — 어느 줄인지 정할 수 없음' });
      continue;
    }
    // 품목코드(SKU)는 시트+원본 행 번호라 판이 바뀌면 다른 품목을 가리킨다. 모델·품명 중
    // **하나 이상은 반드시** 적혀 있고 맞아야 붙인다(독립 리뷰 지적).
    const model = modelColumn === undefined ? '' : (row[modelColumn] ?? '');
    const name = nameColumn === undefined ? '' : (row[nameColumn] ?? '');
    if (model.trim() === '' && name.trim() === '') {
      summary.mismatched += 1;
      pushIssue(summary, { sheet: items.name, row: r + 1, sku: code, reason: '모델·품명이 비어 견적 단가표와 대조할 수 없음' });
      continue;
    }
    const modelMatches = model.trim() === '' || normalizeText(model) === normalizeText(product.model);
    const nameMatches = name.trim() === '' || normalizeText(name) === normalizeText(product.quoteName);
    if (!modelMatches || !nameMatches) {
      summary.mismatched += 1;
      pushIssue(summary, {
        sheet: items.name,
        row: r + 1,
        sku: code,
        reason: !modelMatches && !nameMatches ? '모델·품명이 견적 단가표와 다름' : !modelMatches ? '모델이 견적 단가표와 다름' : '품명이 견적 단가표와 다름',
      });
      continue;
    }
    const cost = readPriceCell(items, r, costColumn);
    const selling =
      sellingColumn === undefined || isDerivedPricing(product) ? undefined : readPriceCell(items, r, sellingColumn);
    accumulate(summary, entries, catalog, { sheet: items.name, row: r + 1, sku: code }, cost, selling);
  }
  return finishBook('four-sheet', catalog, entries, summary, visited, importedAt);
}
