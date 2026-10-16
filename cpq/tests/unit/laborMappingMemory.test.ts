/**
 * B-20261016-05 — 확인한 품셈 연결 기억(2026-10-16 사용자 결정 "한 번
 * 확인한 연결은 기억 — 이 PC에 저장")과 내려받기 직전 확인 창 건수.
 *
 * 기억은 "연결 자체가 맞다"는 확인이고, 행 지문 확인("이 행의 이 숫자를
 * 봤다")과 별개다. 그래서 기억은 **행 확인 기록이 없는 행에만** 쓰이고,
 * 행 확인 기록이 있으면 지금처럼 지문만 본다.
 */
import { describe, expect, it } from 'vitest';
import {
  calculateLaborForRows,
  computeRowConfirmationFingerprint,
  type LaborReference,
  type LaborRowRequest,
} from '@/domain/labor/calculateLabor';
import {
  applicableEntries,
  applicableMappingIds,
  clearLaborMappingMemory,
  forgetLaborMapping,
  isApplicable,
  LABOR_MEMORY_STORAGE_KEY,
  loadLaborMappingMemory,
  rememberLaborMapping,
  type MemoryStorage,
  type RememberedLaborMapping,
} from '@/services/labor-memory/laborMappingMemory';
import { computeLaborMappingFingerprint } from '@/domain/labor/laborConfirmation';
import { exportReviewConfirmMessage, exportReviewCounts } from '@/features/worksheet/reviewItems';
import type { PreparedQuote } from '@/export/variants/prepare';

function fakeStorage(initial: Record<string, string> = {}): MemoryStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const REFERENCE: LaborReference = {
  items: [
    {
      laborItemId: 'LI-1',
      code: 'C1',
      description: '합성 품셈 항목',
      baseUnit: 'EA',
      source: 'fixture',
      revision: '1',
      wageUnit: 'M/D',
      trades: [{ trade: '통신내선공', quantity: '1' }],
    },
  ],
  mappings: [
    {
      laborMappingId: 'LM-1',
      sku: 'FIX-0001',
      laborItemId: 'LI-1',
      conversionFactor: '1',
      surcharge: '0',
      itemRate: '1',
      confirmed: false,
      note: '합성 — 미확인',
    },
  ],
  wages: { wageTableId: 'W-1', periodLabel: 'fixture', source: 'fixture', wages: { 통신내선공: { amount: '150000', unit: 'M/D' } } },
};

function request(quantity: string, existingFingerprint?: string): LaborRowRequest {
  return {
    rowId: 'r1',
    laborMappingId: 'LM-1',
    identity: { sku: 'FIX-0001', productId: 'FIX-0001', unit: 'EA', quantity, ruleVersion: 'rule-v1' },
    ...(existingFingerprint === undefined
      ? {}
      : { existingConfirmation: { basisFingerprint: existingFingerprint, confirmedAt: '2026-10-16T00:00:00Z' } }),
  };
}

const unconfirmed = (result: ReturnType<typeof calculateLaborForRows>) =>
  result.warnings.filter((w) => w.code === 'mapping-unconfirmed');

describe('calculateLaborForRows — 기억한 연결', () => {
  it('기억이 없으면 지금처럼 mapping-unconfirmed 가 선다', () => {
    expect(unconfirmed(calculateLaborForRows([request('1')], REFERENCE))).toHaveLength(1);
  });

  it('기억한 연결이고 행 확인 기록이 없으면 mapping-unconfirmed 를 세우지 않는다', () => {
    const result = calculateLaborForRows([request('1')], { ...REFERENCE, rememberedMappingIds: new Set(['LM-1']) });
    expect(unconfirmed(result)).toHaveLength(0);
    expect(result.breakdowns.get('r1')?.mappingRemembered).toBe(true);
    expect(result.breakdowns.get('r1')?.blocking).toBe(false);
  });

  it('다른 연결만 기억했으면 그대로 선다', () => {
    const result = calculateLaborForRows([request('1')], { ...REFERENCE, rememberedMappingIds: new Set(['LM-9']) });
    expect(unconfirmed(result)).toHaveLength(1);
  });

  it('행 확인 지문이 어긋나면(수량이 바뀌면) 기억이 있어도 다시 확인하라고 한다 — 지문 무효화는 그대로', () => {
    const fingerprintAtQty1 = computeRowConfirmationFingerprint('r1', 'LM-1', REFERENCE, request('1').identity)!;
    const result = calculateLaborForRows([request('3', fingerprintAtQty1)], {
      ...REFERENCE,
      rememberedMappingIds: new Set(['LM-1']),
    });
    expect(unconfirmed(result)).toHaveLength(1);
    expect(result.breakdowns.get('r1')?.mappingRemembered).toBeUndefined();
  });

  it('행 확인 지문이 맞으면 지금처럼 풀리고 "기억으로 풀렸다"고 표시하지 않는다', () => {
    const fp = computeRowConfirmationFingerprint('r1', 'LM-1', REFERENCE, request('1').identity)!;
    const result = calculateLaborForRows([request('1', fp)], { ...REFERENCE, rememberedMappingIds: new Set(['LM-1']) });
    expect(unconfirmed(result)).toHaveLength(0);
    expect(result.breakdowns.get('r1')?.mappingRemembered).toBeUndefined();
  });

  it('기억은 지문을 바꾸지 않는다 — 같은 행의 지금 지문은 기억 유무와 같다', () => {
    const without = calculateLaborForRows([request('1')], REFERENCE).breakdowns.get('r1')!.currentFingerprint;
    const withMemory = calculateLaborForRows([request('1')], {
      ...REFERENCE,
      rememberedMappingIds: new Set(['LM-1']),
    }).breakdowns.get('r1')!.currentFingerprint;
    expect(withMemory).toBe(without);
  });
});

describe('computeLaborMappingFingerprint — 연결 내용 지문 (독립 검토 지적 C)', () => {
  const mapping = REFERENCE.mappings[0]!;
  const item = REFERENCE.items[0]!;
  const base = computeLaborMappingFingerprint({ mapping, item });

  it('노무 계산에 쓰는 칸이 바뀌면 지문이 달라진다', () => {
    for (const changed of [
      { ...mapping, laborItemId: 'LI-2' },
      { ...mapping, surcharge: '0.1' },
      { ...mapping, itemRate: '1.2' },
      { ...mapping, conversionFactor: '2' },
      { ...mapping, multiplier: '0.3' },
    ]) {
      expect(computeLaborMappingFingerprint({ mapping: changed, item })).not.toBe(base);
    }
    expect(
      computeLaborMappingFingerprint({ mapping, item: { ...item, trades: [{ trade: '통신내선공', quantity: '2' }] } }),
    ).not.toBe(base);
  });

  it('메모·확인 여부처럼 계산에 안 쓰는 칸과 소수 표기("1"·"1.0")는 지문을 바꾸지 않는다', () => {
    const withOtherNote = { ...mapping, note: '다른 메모', confirmed: true };
    expect(computeLaborMappingFingerprint({ mapping: withOtherNote, item })).toBe(base);
    expect(computeLaborMappingFingerprint({ mapping: { ...mapping, itemRate: '1.0' }, item })).toBe(base);
  });
});

const FP = (id: string) => (id === 'LM-1' ? 'fp-1' : id === 'LM-2' ? 'fp-2' : undefined);
const entry = (over: Partial<RememberedLaborMapping> = {}): RememberedLaborMapping => ({
  laborVersion: 'A',
  laborMappingId: 'LM-1',
  mappingFingerprint: 'fp-1',
  confirmedAt: 't1',
  ...over,
});
const keepFor = (version: string) => (e: RememberedLaborMapping) => isApplicable(e, version, FP);

describe('laborMappingMemory — 이 PC 저장', () => {
  it('같은 판·같은 연결 내용일 때만 적용한다 — 판이 다르거나 내용 지문이 다르면 빠진다', () => {
    const memory = [entry(), entry({ laborMappingId: 'LM-2', mappingFingerprint: 'fp-OLD' }), entry({ laborVersion: 'B' })];
    expect([...applicableMappingIds(memory, 'A', FP)]).toEqual(['LM-1']);
    expect(applicableMappingIds(memory, 'C', FP).size).toBe(0);
    // 화면 건수는 지금 적용되는 것만 센다.
    expect(applicableEntries(memory, 'A', FP)).toHaveLength(1);
  });

  it('저장할 때 지금 적용되지 않는 옛 기록을 정리한다', () => {
    const storage = fakeStorage({
      [LABOR_MEMORY_STORAGE_KEY]: JSON.stringify([
        entry({ laborVersion: 'OLD' }),
        entry({ laborMappingId: 'LM-2', mappingFingerprint: 'fp-OLD' }),
      ]),
    });
    const result = rememberLaborMapping(entry(), keepFor('A'), storage);
    expect(result.ok && result.added).toBe(true);
    expect(loadLaborMappingMemory(storage)).toEqual([entry()]);
  });

  it('같은 기록은 한 번만 남고, 두 번째는 added:false 다', () => {
    const storage = fakeStorage();
    expect(rememberLaborMapping(entry(), keepFor('A'), storage)).toMatchObject({ ok: true, added: true });
    expect(rememberLaborMapping(entry({ confirmedAt: 't2' }), keepFor('A'), storage)).toMatchObject({
      ok: true,
      added: false,
    });
    expect(loadLaborMappingMemory(storage)).toHaveLength(1);
  });

  it('forget 은 그 기록 하나만 뺀다(실행 취소) — 다른 기록은 남긴다', () => {
    const storage = fakeStorage();
    rememberLaborMapping(entry(), keepFor('A'), storage);
    rememberLaborMapping(entry({ laborMappingId: 'LM-2', mappingFingerprint: 'fp-2' }), keepFor('A'), storage);
    expect(forgetLaborMapping(entry(), storage).ok).toBe(true);
    expect(loadLaborMappingMemory(storage).map((e) => e.laborMappingId)).toEqual(['LM-2']);
    // 마지막 하나를 빼면 열쇠 자체가 없어진다.
    forgetLaborMapping(entry({ laborMappingId: 'LM-2', mappingFingerprint: 'fp-2' }), storage);
    expect(storage.data).toEqual({});
  });

  it('모두 지우기는 열쇠 자체를 없앤다', () => {
    const storage = fakeStorage();
    rememberLaborMapping(entry(), keepFor('A'), storage);
    expect(clearLaborMappingMemory(storage).ok).toBe(true);
    expect(storage.data).toEqual({});
  });

  it('판·연결 id·지문·시각 네 칸만 저장한다 — 문서·고객·금액이 섞이지 않는다', () => {
    const storage = fakeStorage();
    rememberLaborMapping({ ...entry(), customer: '고객명' } as never, keepFor('A'), storage);
    const stored = JSON.parse(storage.data[LABOR_MEMORY_STORAGE_KEY]!) as Record<string, unknown>[];
    expect(Object.keys(stored[0]!).sort()).toEqual(['confirmedAt', 'laborMappingId', 'laborVersion', 'mappingFingerprint']);
  });

  it('손상된 값·지문 없는 옛 형식·저장소 없음은 "기억 없음"으로 본다', () => {
    expect(loadLaborMappingMemory(fakeStorage({ [LABOR_MEMORY_STORAGE_KEY]: '{깨진' }))).toEqual([]);
    expect(
      loadLaborMappingMemory(
        fakeStorage({ [LABOR_MEMORY_STORAGE_KEY]: '[{"laborVersion":"A","laborMappingId":"LM-1","confirmedAt":"t"}]' }),
      ),
    ).toEqual([]);
    expect(loadLaborMappingMemory(undefined)).toEqual([]);
  });

  it('저장이 실패하면 ok:false 이고 기억 목록은 늘지 않는다 — 성공한 척하지 않는다', () => {
    const broken: MemoryStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const result = rememberLaborMapping(entry(), keepFor('A'), broken);
    expect(result.ok).toBe(false);
    expect(result.memory).toEqual([]);
    expect(clearLaborMappingMemory(broken).ok).toBe(false);
    expect(rememberLaborMapping(entry(), keepFor('A'), undefined).ok).toBe(false);
  });
});

describe('exportReviewCounts — 내려받기 직전 확인 창 건수', () => {
  const prepared = {
    document: { rows: [], systems: [], derivedRows: [] },
    importWarnings: [
      { code: 'device-not-in-catalog', blocking: true, message: 'm', nodeId: 'n1' },
      { code: 'misc-classification-missing', blocking: true, message: 'm' },
      { code: 'cable-length-assumed', blocking: false, message: 'm', edgeId: 'e1' },
    ],
    priced: {
      laborWarnings: [
        { code: 'mapping-unconfirmed', blocking: true, message: 'm', rowId: 'r1' },
        { code: 'mapping-unconfirmed', blocking: true, message: 'm', rowId: 'r2' },
      ],
      calculation: {
        warnings: [
          { code: 'price-not-registered', blocking: true, message: 'm', rowId: 'r1' },
          { code: 'labor-unresolved', blocking: true, message: 'm', rowId: 'r3' },
          { code: 'quantity-unresolved', blocking: true, message: 'm', rowId: 'r4' },
        ],
      },
    },
  } as unknown as PreparedQuote;

  it('확인 목록 화면의 분류와 같게 센다 — 노무 계열 계산 경고는 품셈(노무), misc-* 는 계산', () => {
    expect(exportReviewCounts(prepared)).toEqual({
      total: 7,
      diagram: 1,
      labor: 3,
      calculation: 3,
      unresolvedQuantityRows: 1,
    });
  });

  it('수량 미정 행이 있으면 Excel 합계가 화면과 다르다는 것을 덧붙인다', () => {
    expect(exportReviewConfirmMessage(exportReviewCounts(prepared))).toBe(
      '확인 필요 7건(구성도 1·품셈(노무) 3·계산 3)이 남아 있습니다. ' +
        '수량 미정 1행은 Excel에서 수량 빈칸·금액 0으로 나가 화면 합계와 다릅니다. 그래도 내려받을까요?',
    );
  });

  it('수량 미정 행이 없으면 그 문장을 넣지 않는다', () => {
    expect(
      exportReviewConfirmMessage({ total: 2, diagram: 0, labor: 2, calculation: 0, unresolvedQuantityRows: 0 }),
    ).toBe('확인 필요 2건(구성도 0·품셈(노무) 2·계산 0)이 남아 있습니다. 그래도 내려받을까요?');
  });
});
