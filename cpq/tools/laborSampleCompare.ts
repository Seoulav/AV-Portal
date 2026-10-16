/**
 * 회의실 견적 샘플의 노무비 단가 ↔ 앱 품셈 계산 대조 (B-20261016-07 1단계).
 *
 * 순수 함수만 둔다. 파일 읽기·쓰기는 `confirm-labor-from-samples.ts`가 한다.
 *
 * ## 지키는 것
 *
 * - 노무비는 **앱의 실제 계산 경로**(`calculateLaborForRows`)로만 구한다.
 *   식을 여기서 다시 만들지 않는다. 차이 유형을 가를 때도 연결 값 하나만
 *   바꾼 사본을 같은 함수에 다시 넣어 본다.
 * - 판정은 **정확히 같음**이다. 1원 차이도 불일치다. 엑셀이 저장한
 *   부동소수 꼬리(1e-6 미만)만 같은 값으로 본다.
 * - 샘플 노무비가 비었거나 0인 행은 증거로 쓰지 않는다.
 * - 규격(필요하면 품명)이 **정확히 SKU 1건**에만 맞는 행만 쓴다.
 * - 연결 하나에 걸린 샘플 행이 **전부** 같아야 확인한다.
 *
 * 이 모듈은 금액을 저장소에 쓰지 않는다. 확인 결과로 저장소에 남는 것은
 * `confirmed` 플래그와 금액 없는 note뿐이다(`applyConfirmations`).
 */
import { calculateLaborForRows, type LaborReference } from '../src/domain/labor/calculateLabor';
import type { LaborMapping } from '../src/domain/labor/types';
import { Decimal } from '../src/domain/calculation/rounding';

export interface SampleProduct {
  sku: string;
  model: string;
  quoteName: string;
  quoteSpec: string;
  unit: string;
  laborMappingId?: string | undefined;
}

/** 샘플 시트의 품목 행 하나. 값은 셀에 저장된 그대로의 문자열이다. */
export interface SampleRow {
  sheet: string;
  /** 시트의 실제 행 번호(1부터). */
  rowNumber: number;
  name: string;
  spec: string;
  description: string;
  unit: string;
  quantity: string;
  laborUnitPrice: string;
}

export interface HeaderColumns {
  /** 머리글(번호·품명·규격…) 행의 자리(0부터). */
  headerRowIndex: number;
  /** 품목이 시작하는 행의 자리(0부터). */
  dataStartRowIndex: number;
  name: number;
  spec: number;
  description: number;
  unit: number;
  quantity: number;
  /** 노무비 **단가** 열. */
  laborUnitPrice: number;
}

const compact = (s: string): string => s.normalize('NFKC').replace(/\s+/g, '');

/**
 * 머리글을 열 이름으로 찾는다. 열 위치를 고정하지 않는다.
 * 노무비는 머리글 아래 행이 `단가`인 열이어야 한다(금액 열과 섞지 않는다).
 */
export function findHeader(rows: readonly (readonly string[])[], scanRows = 10): HeaderColumns | undefined {
  for (let r = 0; r < Math.min(scanRows, rows.length); r += 1) {
    const cells = (rows[r] ?? []).map(compact);
    const col = (label: string): number => cells.indexOf(label);
    const spec = col('규격');
    const labor = col('노무비');
    if (spec < 0 || labor < 0) continue;
    const name = col('품명');
    const description = col('설명');
    const unit = col('단위');
    const quantity = col('수량');
    if (name < 0 || quantity < 0) return undefined;
    const sub = (rows[r + 1] ?? []).map(compact);
    if (sub[labor] !== '단가') return undefined;
    return {
      headerRowIndex: r,
      dataStartRowIndex: r + 2,
      name,
      spec,
      description,
      unit,
      quantity,
      laborUnitPrice: labor,
    };
  }
  return undefined;
}

function parseDecimal(value: string): Decimal | undefined {
  const t = value.trim();
  if (t === '') return undefined;
  try {
    const d = new Decimal(t);
    return d.isFinite() ? d : undefined;
  } catch {
    return undefined;
  }
}

/** 수량이 0보다 큰 행만 품목 행으로 본다. */
export function extractRows(sheet: string, rows: readonly (readonly string[])[], h: HeaderColumns): SampleRow[] {
  const out: SampleRow[] = [];
  for (let i = h.dataStartRowIndex; i < rows.length; i += 1) {
    const r = rows[i] ?? [];
    const cell = (c: number): string => (c < 0 ? '' : (r[c] ?? '')).trim();
    const qty = parseDecimal(cell(h.quantity));
    if (qty === undefined || !qty.greaterThan(0)) continue;
    out.push({
      sheet,
      rowNumber: i + 1,
      name: cell(h.name),
      spec: cell(h.spec),
      description: cell(h.description),
      unit: cell(h.unit),
      quantity: cell(h.quantity),
      laborUnitPrice: cell(h.laborUnitPrice),
    });
  }
  return out;
}

/** 간접비 줄("노무비 대비", "자재비의 2%", "직접비 대비" 등). 품목이 아니다. */
const INDIRECT = /대비|자재비의|직접비|공과잡비|일반관리비|기업이윤|이윤|%/;

export function isIndirectRow(row: SampleRow): boolean {
  return INDIRECT.test(`${row.name} ${row.spec} ${row.description}`.normalize('NFKC'));
}

export const normalizeKey = (s: string): string => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
const normalizeName = (s: string): string => normalizeKey(s).replace(/^-+/, '');

export type SkuMatch =
  | { kind: 'one'; sku: string; byName: boolean }
  | { kind: 'many'; count: number }
  | { kind: 'none' };

export function buildSpecIndex(products: readonly SampleProduct[]): Map<string, SampleProduct[]> {
  const index = new Map<string, SampleProduct[]>();
  for (const p of products) {
    const keys = new Set([normalizeKey(p.model), normalizeKey(p.quoteSpec)]);
    for (const k of keys) {
      if (k === '' || k === '-') continue;
      const list = index.get(k) ?? [];
      list.push(p);
      index.set(k, list);
    }
  }
  return index;
}

/** 규격이 정확히 1건에 맞으면 그것, 여러 건이면 품명으로 좁혀 1건일 때만. */
export function matchSku(row: SampleRow, index: ReadonlyMap<string, readonly SampleProduct[]>): SkuMatch {
  const key = normalizeKey(row.spec);
  if (key === '' || key === '-') return { kind: 'none' };
  const candidates = index.get(key) ?? [];
  if (candidates.length === 0) return { kind: 'none' };
  if (candidates.length === 1) return { kind: 'one', sku: candidates[0]!.sku, byName: false };
  const name = normalizeName(row.name);
  const byName = name === '' ? [] : candidates.filter((p) => normalizeName(p.quoteName) === name);
  if (byName.length === 1) return { kind: 'one', sku: byName[0]!.sku, byName: true };
  return { kind: 'many', count: candidates.length };
}

/** 엑셀 부동소수 꼬리만 허용한다. 1원은 물론 0.01원도 다르다. */
const FLOAT_NOISE = new Decimal('0.000001');

export function sameAmount(a: Decimal, b: Decimal): boolean {
  return a.minus(b).abs().lessThan(FLOAT_NOISE);
}

/** 앱 계산 경로로 행 1개의 노무비 단가. 연결·품셈이 없으면 `undefined`. */
export function appLaborUnitPrice(
  laborMappingId: string,
  reference: LaborReference,
  override?: Partial<Pick<LaborMapping, 'surcharge' | 'itemRate' | 'multiplier' | 'conversionFactor'>>,
): Decimal | undefined {
  const ref: LaborReference =
    override === undefined
      ? reference
      : {
          ...reference,
          mappings: reference.mappings.map((m) =>
            m.laborMappingId === laborMappingId ? { ...m, ...override } : m,
          ),
        };
  const result = calculateLaborForRows(
    [{ rowId: 'sample', laborMappingId, identity: { unit: 'EA', quantity: '1', ruleVersion: 'sample-compare' } }],
    ref,
  );
  return result.unitPrices.get('sample');
}

export type MismatchKind =
  | 'app-zero'
  | 'rounding-1won'
  | 'multiplier'
  | 'surcharge'
  | 'item-rate'
  | 'approx-wage'
  | 'other';

export const MISMATCH_LABEL: Record<MismatchKind, string> = {
  'app-zero': '앱 계산 0(요율 0 등)',
  'rounding-1won': '1원 이내 끝수 차이',
  multiplier: '배율 차이(길이·묶음 등)',
  surcharge: '할증 차이',
  'item-rate': '품목 요율 차이',
  'approx-wage': '±15% 이내 근사(노임 판·품 차이 의심)',
  other: '기타',
};

const MULTIPLIER_CANDIDATES: string[] = [
  ...Array.from({ length: 100 }, (_, i) => new Decimal(i + 1).div(10).toString()),
  ...Array.from({ length: 90 }, (_, i) => String(i + 11)),
];
const SURCHARGE_CANDIDATES = ['0', '0.1', '0.15', '0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '1'];
const ITEM_RATE_CANDIDATES: string[] = Array.from({ length: 60 }, (_, i) =>
  new Decimal(i + 1).times('0.05').toString(),
);

/**
 * 다른 원인을 하나씩만 바꿔 앱 계산에 다시 넣어 본다. 처음 맞는 것이 유형이다.
 * 분류용일 뿐이다 — 분류가 맞아도 확인하지 않는다.
 */
export function classifyMismatch(
  sample: Decimal,
  computed: Decimal,
  laborMappingId: string,
  reference: LaborReference,
): MismatchKind {
  if (computed.isZero()) return 'app-zero';
  if (sample.minus(computed).abs().lessThanOrEqualTo(1)) return 'rounding-1won';
  const tryWith = (o: Parameters<typeof appLaborUnitPrice>[2], values: readonly string[], key: 'multiplier' | 'surcharge' | 'itemRate'): boolean =>
    values.some((v) => {
      const got = appLaborUnitPrice(laborMappingId, reference, { ...o, [key]: v });
      return got !== undefined && sameAmount(got, sample);
    });
  if (tryWith({}, MULTIPLIER_CANDIDATES, 'multiplier')) return 'multiplier';
  if (tryWith({}, SURCHARGE_CANDIDATES, 'surcharge')) return 'surcharge';
  if (tryWith({}, ITEM_RATE_CANDIDATES, 'itemRate')) return 'item-rate';
  const ratio = sample.div(computed);
  if (ratio.greaterThanOrEqualTo('0.85') && ratio.lessThanOrEqualTo('1.15')) return 'approx-wage';
  return 'other';
}

export type RowVerdict =
  | { kind: 'indirect' }
  | { kind: 'sku-none' }
  | { kind: 'sku-many' }
  | { kind: 'no-mapping'; sku: string }
  | { kind: 'no-evidence'; sku: string; laborMappingId: string }
  | { kind: 'equal'; sku: string; laborMappingId: string; sample: Decimal; computed: Decimal }
  | { kind: 'differ'; sku: string; laborMappingId: string; sample: Decimal; computed: Decimal; mismatch: MismatchKind };

export function judgeRow(
  row: SampleRow,
  index: ReadonlyMap<string, readonly SampleProduct[]>,
  productBySku: ReadonlyMap<string, SampleProduct>,
  reference: LaborReference,
): RowVerdict {
  if (isIndirectRow(row)) return { kind: 'indirect' };
  const m = matchSku(row, index);
  if (m.kind === 'none') return { kind: 'sku-none' };
  if (m.kind === 'many') return { kind: 'sku-many' };
  const product = productBySku.get(m.sku)!;
  const laborMappingId = product.laborMappingId;
  if (laborMappingId === undefined || !reference.mappings.some((x) => x.laborMappingId === laborMappingId)) {
    return { kind: 'no-mapping', sku: m.sku };
  }
  const sample = parseDecimal(row.laborUnitPrice);
  if (sample === undefined || sample.isZero()) return { kind: 'no-evidence', sku: m.sku, laborMappingId };
  const computed = appLaborUnitPrice(laborMappingId, reference);
  if (computed === undefined) return { kind: 'no-mapping', sku: m.sku };
  if (sameAmount(sample, computed)) return { kind: 'equal', sku: m.sku, laborMappingId, sample, computed };
  return {
    kind: 'differ',
    sku: m.sku,
    laborMappingId,
    sample,
    computed,
    mismatch: classifyMismatch(sample, computed, laborMappingId, reference),
  };
}

export interface MappingDecision {
  laborMappingId: string;
  equalRows: number;
  differRows: number;
  /** 다른 행의 유형별 건수. */
  mismatches: Partial<Record<MismatchKind, number>>;
  confirm: boolean;
}

/** 연결 하나에 걸린 샘플 행이 1건 이상이고 **전부** 같을 때만 확인한다. */
export function decideMappings(verdicts: readonly RowVerdict[]): MappingDecision[] {
  const by = new Map<string, MappingDecision>();
  for (const v of verdicts) {
    if (v.kind !== 'equal' && v.kind !== 'differ') continue;
    const d =
      by.get(v.laborMappingId) ??
      { laborMappingId: v.laborMappingId, equalRows: 0, differRows: 0, mismatches: {}, confirm: false };
    if (v.kind === 'equal') d.equalRows += 1;
    else {
      d.differRows += 1;
      d.mismatches[v.mismatch] = (d.mismatches[v.mismatch] ?? 0) + 1;
    }
    by.set(v.laborMappingId, d);
  }
  for (const d of by.values()) d.confirm = d.equalRows > 0 && d.differRows === 0;
  return [...by.values()].sort((a, b) => a.laborMappingId.localeCompare(b.laborMappingId));
}

/** 금액이 들어가지 않는 근거 문구. */
export function confirmationNote(date: string, rows: number, wageLabel: string): string {
  return `${date} 회의실 견적 샘플 노무비 단가 일치(${rows}행, ${wageLabel} 노임 기준)로 확인 (B-20261016-07).`;
}

/**
 * `labor-mappings.json` 객체에서 확인할 연결만 `confirmed: true`·note를 바꾼다.
 * 다른 칸·순서는 건드리지 않는다. 이미 확인된 연결은 다시 쓰지 않는다.
 */
export function applyConfirmations<T extends { mappings: Array<{ laborMappingId: string; confirmed: boolean; note: string }> }>(
  file: T,
  decisions: readonly MappingDecision[],
  date: string,
  wageLabel: string,
): { file: T; changed: string[] } {
  const confirm = new Map(decisions.filter((d) => d.confirm).map((d) => [d.laborMappingId, d.equalRows]));
  const changed: string[] = [];
  const mappings = file.mappings.map((m) => {
    const rows = confirm.get(m.laborMappingId);
    if (rows === undefined || m.confirmed) return m;
    changed.push(m.laborMappingId);
    return { ...m, confirmed: true, note: confirmationNote(date, rows, wageLabel) };
  });
  return { file: { ...file, mappings }, changed };
}
