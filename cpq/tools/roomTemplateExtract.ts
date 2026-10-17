/**
 * 회의실 견적 샘플 → 타입 템플릿 추출 (B-20261016-07 2단계).
 *
 * 순수 함수만 둔다. 파일 읽기·쓰기는 `build-room-templates.ts`가 한다.
 *
 * ## 지키는 것 (2026-10-16 사용자 승인: "품목·수량은 공개해도 됨", 가격·구매처 제외)
 *
 * - 읽는 칸은 품명·규격·설명·단위·수량·**비고**뿐이다. 원가·재료비·노무비·
 *   합계·이윤·제조사/구매처·영업비고 칸은 **읽지 않는다.**
 * - 간접비 줄("노무비 대비", "자재비의 2%" 등)은 품목이 아니다 — 1단계와
 *   같은 규칙(`isIndirectRow`)으로 뺀다.
 * - SKU는 1단계와 같은 규칙(`matchSku`)으로 **정확히 1건**일 때만 적는다.
 *   여러 건이면 `ambiguous`, 없으면 SKU 없이 품명·규격만 적는다 — 지어내지
 *   않는다.
 * - 시트 머리글 이름과 집계표 타입 이름이 다르면 **둘 다 그대로** 둔다.
 */
import {
  findHeader,
  isIndirectRow,
  matchSku,
  normalizeKey,
  type HeaderColumns,
  type SampleProduct,
  type SampleRow,
} from './laborSampleCompare';
import type { RoomTemplateItem, RoomTemplateSystem } from '../src/import/room/templates';

const compact = (s: string): string => s.normalize('NFKC').replace(/\s+/g, '');

/** `▣ 견적 : 대회의실_40인` → `대회의실_40인`. */
export function parseRoomTitle(rows: readonly (readonly string[])[], scanRows = 3): string | undefined {
  for (let r = 0; r < Math.min(scanRows, rows.length); r += 1) {
    for (const cell of rows[r] ?? []) {
      const m = /▣\s*견적\s*[::]\s*(.+)/.exec(cell);
      if (m !== null) return m[1]!.trim();
    }
  }
  return undefined;
}

/** 머리글 행에서 `번호`·`비고` 열을 찾는다. `영업비고`와 섞지 않는다. */
export function findExtraColumns(
  rows: readonly (readonly string[])[],
  header: HeaderColumns,
): { number: number; remark: number } {
  const cells = (rows[header.headerRowIndex] ?? []).map(compact);
  return { number: cells.indexOf('번호'), remark: cells.indexOf('비고') };
}

export interface RoomSheetStats {
  itemRows: number;
  indirectRows: number;
  skuOne: number;
  skuMany: number;
  skuNone: number;
  /** SKU는 맞았지만 샘플 단위가 카탈로그 단위와 달라 SKU를 적지 않은 행. */
  unitMismatch: number;
  /**
   * 금지 패턴(금액 등)이 들어 있어 **버린** 설명·비고 칸 수. 예:
   * "실링 MIC / 채널당 50만원" — 품목 설명에 단가가 적혀 있었다(2026-10-18
   * 독립 리뷰 보강 검사로 발견). 값을 고쳐 쓰지 않고 그 칸만 뺀다.
   */
  droppedText: number;
}

export interface ExtractedRoomSheet {
  systems: RoomTemplateSystem[];
  stats: RoomSheetStats;
}

/** 수량 문자열 정규화 — 엑셀 부동소수 꼬리(`3.0000000000000004`)를 지운다. */
export function normalizeQuantity(value: string): string | undefined {
  const n = Number(value.trim());
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const rounded = Math.round(n * 1e6) / 1e6;
  return String(rounded);
}

/**
 * 견적 시트 하나에서 시스템 묶음·품목을 뽑는다.
 *
 * - 품목 행: 수량이 0보다 큰 행(간접비 줄 제외).
 * - 시스템 묶음: 번호·수량이 비고 품명만 있는 행(`영상 시스템` 등).
 *   `직접비`·`간접비` 구분 행은 번호 칸(Ⅰ·Ⅱ)이 있어 묶음으로 보지 않는다.
 */
export function extractRoomSheet(
  sheetName: string,
  rows: readonly (readonly string[])[],
  products: readonly SampleProduct[],
  index: ReadonlyMap<string, readonly SampleProduct[]>,
): ExtractedRoomSheet | undefined {
  const header = findHeader(rows);
  if (header === undefined) return undefined;
  const extra = findExtraColumns(rows, header);
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const stats: RoomSheetStats = {
    itemRows: 0,
    indirectRows: 0,
    skuOne: 0,
    skuMany: 0,
    skuNone: 0,
    unitMismatch: 0,
    droppedText: 0,
  };
  /** 선택 칸(설명·비고)은 금액 같은 금지 값이 섞이면 그 칸만 버린다. */
  const safeOptionalText = (value: string): string | undefined => {
    if (value === '') return undefined;
    if (findForbiddenValues(value).length === 0) return value;
    stats.droppedText += 1;
    return undefined;
  };
  const systems: RoomTemplateSystem[] = [];
  let current: RoomTemplateSystem | undefined;

  for (let i = header.dataStartRowIndex; i < rows.length; i += 1) {
    const r = rows[i] ?? [];
    const cell = (c: number): string => (c < 0 ? '' : (r[c] ?? '')).trim();
    const name = cell(header.name);
    const quantityRaw = cell(header.quantity);
    const quantity = normalizeQuantity(quantityRaw);

    if (quantity === undefined) {
      // 수량 없는 행 — 품명만 있고 번호가 없으면 시스템 묶음 머리글이다.
      if (name !== '' && cell(extra.number) === '') {
        current = { name, items: [] };
        systems.push(current);
      }
      continue;
    }

    const row: SampleRow = {
      sheet: sheetName,
      rowNumber: i + 1,
      name,
      spec: cell(header.spec),
      description: cell(header.description),
      unit: cell(header.unit),
      quantity,
      laborUnitPrice: '', // 읽지 않는다 — 추출에 쓰지 않는 칸이다.
    };
    if (isIndirectRow(row)) {
      stats.indirectRows += 1;
      continue;
    }
    if (name === '' && row.spec === '') continue;

    stats.itemRows += 1;
    const match = matchSku(row, index);
    let sku: string | undefined;
    let ambiguous = false;
    if (match.kind === 'one') {
      const product = productBySku.get(match.sku)!;
      // 단가·품셈은 카탈로그 단위 기준이다. 단위가 다르면 SKU를 적지 않는다.
      if (normalizeKey(product.unit) === normalizeKey(row.unit)) {
        sku = match.sku;
        stats.skuOne += 1;
      } else {
        stats.unitMismatch += 1;
      }
    } else if (match.kind === 'many') {
      ambiguous = true;
      stats.skuMany += 1;
    } else {
      stats.skuNone += 1;
    }

    const description = safeOptionalText(row.description);
    const remark = safeOptionalText(cell(extra.remark));
    const item: RoomTemplateItem = {
      ...(sku !== undefined ? { sku } : {}),
      name: name === '' ? row.spec : name,
      specification: row.spec,
      ...(description !== undefined ? { description } : {}),
      unit: row.unit === '' ? 'EA' : row.unit,
      quantity,
      ...(remark !== undefined ? { remark } : {}),
      ...(ambiguous ? { ambiguous: true } : {}),
    };
    if (current === undefined) {
      current = { name: '직접비', items: [] };
      systems.push(current);
    }
    current.items.push(item);
  }

  return { systems: systems.filter((s) => s.items.length > 0), stats };
}

/**
 * 집계표에서 타입 id → 타입 이름을 만든다. 이름은 `x-1` 행에만 있고
 * 아래 변형 행은 비어 있다 — 마지막 이름을 이어받는다.
 */
export function readTypeNames(rows: readonly (readonly string[])[]): Map<string, string> {
  const names = new Map<string, string>();
  let lastName = '';
  for (const r of rows) {
    const id = (r[0] ?? '').trim();
    if (!/^(VIP)?\d+-\d+$/.test(id)) continue;
    const name = (r[1] ?? '').trim();
    if (name !== '') lastName = name;
    if (lastName !== '') names.set(id, lastName);
  }
  return names;
}

/**
 * 공개 금지 값이 섞였는지 마지막으로 한 번 더 본다. 생성기가 틀린 칸을
 * 읽게 바뀌어도 여기서 멈춘다. 같은 검사를 시험이 커밋된 파일에 다시 한다.
 */
export const FORBIDDEN_VALUE_PATTERN = /구매처|제조사|영업비고|원가|재료비|노무비|이윤|단가|금액|₩|\d,\d{3}|\d{3,}\s*원|만\s*원/;

/**
 * 금지 글자가 들어 있지만 **금액·구매처가 아닌** 문구 — 사람이 확인했다
 * (2026-10-18). 샘플 설명 칸의 "제작 / 원가문의 필요"는 '값을 아직 모른다'는
 * 메모지 가격이 아니다. 문구 전체를 지운 뒤 다시 검사하므로, 이 문구에
 * 금액이 붙으면 여전히 걸린다.
 */
const ALLOWED_PHRASES = ['원가문의 필요'];

export function findForbiddenValues(value: unknown, path = '$'): string[] {
  if (typeof value === 'string') {
    const cleaned = ALLOWED_PHRASES.reduce((s, phrase) => s.split(phrase).join(''), value);
    return FORBIDDEN_VALUE_PATTERN.test(cleaned) ? [`${path}: ${value.slice(0, 60)}`] : [];
  }
  if (Array.isArray(value)) return value.flatMap((v, i) => findForbiddenValues(v, `${path}[${i}]`));
  if (typeof value === 'object' && value !== null) {
    // 키도 본다 — 가격이 `원가` 같은 키로 들어오면 값이 숫자여도 잡힌다
    // (독립 리뷰 지적 2026-10-18). 숫자 값 자체는 스키마가 막는다(전부 문자열).
    return Object.entries(value).flatMap(([k, v]) => [
      ...(FORBIDDEN_VALUE_PATTERN.test(k) ? [`${path}.${k} (키 이름)`] : []),
      ...findForbiddenValues(v, `${path}.${k}`),
    ]);
  }
  return [];
}
