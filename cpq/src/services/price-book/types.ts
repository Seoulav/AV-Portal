/**
 * 가격표(원가·판매가) — LED 구성기 방식 (B-20261016-06).
 *
 * 가격표는 **저장소·공개 웹에 없다.** 직원이 "가격표 불러오기"로 고른
 * 파일을 이 브라우저 안에서만 읽어 저장하고(`store.ts`), 다음 방문 때
 * 자동으로 쓴다. 파일 이름·내용을 네트워크로 보내지 않는다.
 *
 * ## 원가 경계
 *
 * 이 모듈은 원가를 담는다. `tools/audit-exports.mjs`가 이 경로를 원가 모듈로
 * 보고, 고객용·도메인·직렬화 경로(`src/domain`, `src/export/*`,
 * `src/services/files`)가 여기를 가져오지 못하게 막는다.
 *
 *   - 판매가 → `catalog.prices`(견적 행 단가) — 지금까지 `prices.json`이 하던 일
 *   - 원가   → 원가 세션(`services/private-cost/session.ts`) — 영업팀용(0) 출력과
 *              화면의 원가 영역에서만 쓴다
 */
import { z } from 'zod';
import type { DecimalText } from '../../domain/quote/types';

const decimalText = z.string().regex(/^\d+(\.\d+)?$/);

export const priceBookEntrySchema = z
  .object({
    cost: decimalText.optional(),
    selling: decimalText.optional(),
  })
  .strict();

export interface PriceBookEntry {
  /** 원가(매입 단가). 비어 있으면 원가 미등록이다 — `0`이 아니다. */
  cost?: DecimalText;
  /** 판매가(견적 행 단가). 비어 있으면 단가 미등록이다 — `0`이 아니다. */
  selling?: DecimalText;
}

export type PriceBookKind = 'pumsem' | 'four-sheet';

/** 불일치 표본 — 좌표와 SKU만. **가격 값을 담지 않는다.** */
export interface PriceRowIssue {
  sheet: string;
  /** 원본 시트의 실제 행 번호(1부터). */
  row: number;
  sku?: string;
  reason: string;
}

const issueSchema = z.object({
  sheet: z.string(),
  row: z.number().int(),
  sku: z.string().optional(),
  reason: z.string(),
});

export interface PriceImportSummary {
  /** 원가나 판매가가 하나라도 붙은 품목 수. */
  applied: number;
  sellingApplied: number;
  costApplied: number;
  /** 가격표 행 불일치 — 그 행의 품명·규격(또는 모델)이 견적 단가표와 달라 붙이지 않은 수. */
  mismatched: number;
  /** 맞는 행인데 원가·판매가 칸이 **둘 다** 비어 있는 수. */
  blank: number;
  costBlank: number;
  sellingBlank: number;
  /** 가격 칸이 수식이라 읽지 않은 칸 수(설계서 §8.3: 수식이 만든 가격을 믿지 않는다). */
  formulaSkipped: number;
  /** 숫자로 읽을 수 없거나 음수인 칸 수. */
  notNumeric: number;
  /** 4시트 형식: 견적 단가표에 없는 품목코드 수. */
  unknownCodes: number;
  /** 견적 단가표 품목 중 이 파일에서 행을 찾지 못한 수. */
  missingInFile: number;
  /** 읽은 시트. */
  sheetsRead: string[];
  /** 읽지 않은 시트와 사유. */
  sheetsSkipped: Array<{ name: string; reason: string }>;
  /** 불일치 등 확인이 필요한 행 표본(최대 `MAX_ISSUE_SAMPLES`). */
  issues: PriceRowIssue[];
}

export const MAX_ISSUE_SAMPLES = 50;

const summarySchema = z.object({
  applied: z.number().int(),
  sellingApplied: z.number().int(),
  costApplied: z.number().int(),
  mismatched: z.number().int(),
  blank: z.number().int(),
  costBlank: z.number().int(),
  sellingBlank: z.number().int(),
  formulaSkipped: z.number().int(),
  notNumeric: z.number().int(),
  unknownCodes: z.number().int(),
  missingInFile: z.number().int(),
  sheetsRead: z.array(z.string()),
  sheetsSkipped: z.array(z.object({ name: z.string(), reason: z.string() })),
  issues: z.array(issueSchema),
});

export interface PriceBook {
  schemaVersion: 1;
  kind: PriceBookKind;
  /** 불러올 때 대조한 견적 단가표(`products.json`)의 원본 지문. 다르면 적용하지 않는다. */
  catalogSourceSha256: string;
  /** ISO 시각 — 표시용. **파일 이름은 저장하지 않는다**(설계서 §6.3). */
  importedAt: string;
  /** SKU → 원가·판매가. 둘 다 없는 품목은 키가 없다. */
  entries: Record<string, PriceBookEntry>;
  summary: PriceImportSummary;
}

export const priceBookSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.enum(['pumsem', 'four-sheet']),
  catalogSourceSha256: z.string().length(64),
  importedAt: z.string(),
  entries: z.record(z.string(), priceBookEntrySchema),
  summary: summarySchema,
});

/**
 * 표준품셈 원본에서 사람이 확인한 열 — **값이 아니라 자리와 머리글**이다.
 * 저장해도 원가가 새지 않는다(설계서 §8.2).
 */
export interface PumsemColumnChoice {
  cost?: { index: number; label: string };
  selling?: { index: number; label: string };
}

const columnRefSchema = z.object({ index: z.number().int().min(0), label: z.string() });

export const pumsemColumnChoiceSchema = z.object({
  cost: columnRefSchema.optional(),
  selling: columnRefSchema.optional(),
});

/** 이 브라우저에 저장하는 한 덩어리. 열쇠 하나(`store.ts`)에만 둔다. */
export interface StoredPriceRecord {
  schemaVersion: 1;
  book?: PriceBook;
  pumsemColumns?: PumsemColumnChoice;
}

export const storedPriceRecordSchema = z.object({
  schemaVersion: z.literal(1),
  book: priceBookSchema.optional(),
  pumsemColumns: pumsemColumnChoiceSchema.optional(),
});

/** 저장된 값을 검증한다. 형식이 틀리면 `undefined` — 틀린 가격을 쓰지 않는다. */
export function parseStoredPriceRecord(raw: unknown): StoredPriceRecord | undefined {
  const parsed = storedPriceRecordSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  const value = parsed.data;
  return {
    schemaVersion: 1,
    ...(value.book !== undefined ? { book: value.book as PriceBook } : {}),
    ...(value.pumsemColumns !== undefined ? { pumsemColumns: value.pumsemColumns as PumsemColumnChoice } : {}),
  };
}

export function emptySummary(): PriceImportSummary {
  return {
    applied: 0,
    sellingApplied: 0,
    costApplied: 0,
    mismatched: 0,
    blank: 0,
    costBlank: 0,
    sellingBlank: 0,
    formulaSkipped: 0,
    notNumeric: 0,
    unknownCodes: 0,
    missingInFile: 0,
    sheetsRead: [],
    sheetsSkipped: [],
    issues: [],
  };
}
