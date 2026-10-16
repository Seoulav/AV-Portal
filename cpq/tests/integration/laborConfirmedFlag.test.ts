import { describe, expect, it } from 'vitest';

import { pickedItemsToQuote } from '@/import/picker/toQuote';
import { priceQuote } from '@/domain/quote/priceQuote';
import { buildLaborReference } from '@/data/catalog/load';
import { generatedLaborMappingsFileSchema } from '@/data/catalog/schema';
import { cat, catalogProduct } from '../fixtures/diagram';

/**
 * B-20261016-07 1단계 — 배포본 `labor-mappings.json`에서 사람이 확인한 연결
 * (`confirmed: true`)은 견적에 `mapping-unconfirmed`를 내지 않는다.
 *
 * **가짜 자료만 쓴다.** 실제 배포본의 어느 연결이 확인됐는지는 여기서
 * 단정하지 않는다(그건 샘플 대조 도구의 몫이고, 자료가 바뀌면 달라진다).
 */

const SHA = 'b'.repeat(64);
const SKU = 'TST-0001';

function rawFiles(confirmed: boolean) {
  return {
    items: {
      schemaVersion: 1,
      generatedOn: '2026-10-16',
      sourceSha256: SHA,
      laborItems: [
        {
          laborItemId: SKU,
          code: '합성-1',
          description: '합성 품셈',
          baseUnit: 'EA',
          source: '합성',
          revision: '합성',
          wageUnit: 'M/D',
          trades: [{ trade: '통신설비공', quantity: '0.5' }],
        },
      ],
    },
    wages: {
      schemaVersion: 1,
      generatedOn: '2026-10-16',
      sourceSha256: SHA,
      wageTable: {
        wageTableId: 'WAGE-합성',
        periodLabel: '합성',
        source: '합성',
        wages: { 통신설비공: { amount: '200000', unit: 'M/D' } },
      },
    },
    mappings: {
      schemaVersion: 1,
      generatedOn: '2026-10-16',
      sourceSha256: SHA,
      mappings: [
        {
          laborMappingId: SKU,
          sku: SKU,
          laborItemId: SKU,
          conversionFactor: '1',
          surcharge: '0',
          itemRate: '1',
          confirmed,
          note: confirmed ? '합성 — 사람이 확인함' : '합성 — 자동 추출',
        },
      ],
      unmappedSkus: [],
    },
  };
}

function quoteWith(confirmed: boolean) {
  const files = rawFiles(confirmed);
  const reference = buildLaborReference(files.items, files.wages, files.mappings);
  const catalog = cat([{ ...catalogProduct(SKU, '합성 장비', 'SYN-1'), laborMappingId: SKU }], { [SKU]: '100000' });
  const { document } = pickedItemsToQuote(
    {
      header: {
        quoteNumber: 'T-LC',
        quoteDate: '2026-10-16',
        customer: '합성 고객',
        projectName: '확인 플래그 시험',
        contact: '',
        conditions: [],
      },
      systems: [{ name: '회의실', items: [{ sku: SKU, quantity: '2' }] }],
    },
    catalog,
  );
  return { document, priced: priceQuote(document, reference) };
}

describe('품셈 연결 확인 플래그 (B-20261016-07)', () => {
  it('미확인 연결은 mapping-unconfirmed로 막는다', () => {
    const { priced } = quoteWith(false);
    expect(priced.laborWarnings.some((w) => w.code === 'mapping-unconfirmed')).toBe(true);
    expect(priced.blocking).toBe(true);
  });

  it('확인한 연결(confirmed: true)은 mapping-unconfirmed를 내지 않는다', () => {
    const { priced } = quoteWith(true);
    expect(priced.laborWarnings.filter((w) => w.code === 'mapping-unconfirmed')).toEqual([]);
    expect(priced.laborWarnings.filter((w) => w.blocking)).toEqual([]);
  });

  it('확인 플래그는 노무 단가를 바꾸지 않는다 — 막힘만 푼다', () => {
    const before = quoteWith(false);
    const after = quoteWith(true);
    const rowId = (before.document.rows[0] as { rowId: string }).rowId;
    const a = before.priced.laborBreakdowns.get(rowId)!.appliedUnitPrice;
    const b = after.priced.laborBreakdowns.get((after.document.rows[0] as { rowId: string }).rowId)!.appliedUnitPrice;
    // INT(0.5 × 200,000 × 1 × 1) = 100,000
    expect(a.toString()).toBe('100000');
    expect(b.toString()).toBe(a.toString());
  });

  it('추출기 산출물 스키마는 confirmed: true를 받지 않는다 — 자동 추출을 확인으로 올리지 않는다', () => {
    expect(generatedLaborMappingsFileSchema.safeParse(rawFiles(false).mappings).success).toBe(true);
    expect(generatedLaborMappingsFileSchema.safeParse(rawFiles(true).mappings).success).toBe(false);
  });
});
