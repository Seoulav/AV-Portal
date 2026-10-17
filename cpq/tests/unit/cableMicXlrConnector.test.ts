/**
 * 마이크 케이블 구간의 기본 커넥터 — XLR 3핀 F·M (사용자 결정 2026-10-18, B-20261018-01).
 *
 * 기본 마이크 케이블 CBL-0106(YJ56878) 구간에는 기본 RJ45 커넥터 대신
 * XLR 3핀 한 쌍(CBL-0129 NC3FXX · CBL-0130 NC3MXX)이 붙는다. 구간당 3개
 * (사용 2 + 예비 1) 규칙은 그대로 두고 두 SKU가 나눠 갖는다 — 구간 양끝이
 * F·M 한 쌍이기 때문이다. 회의실 견적 샘플도 XLR 커넥터를 F·M 같은 수량으로
 * 함께 올렸다.
 *
 * 품목 값은 실물 카탈로그(`data/approved/products.json`)의 값 그대로다.
 */
import { describe, expect, it } from 'vitest';

import { buildCableLines, type CableLine } from '@/import/diagram/cables';
import { buildDerivedLines } from '@/import/diagram/derived';
import type { CatalogProduct } from '@/data/catalog/load';
import { catalogProduct, cat, diagram, edge, node } from '../fixtures/diagram';

function grouped(sku: string, quoteName: string, quoteSpec: string, unit: string, group: string): CatalogProduct {
  const p = catalogProduct(sku, quoteName, quoteSpec, unit);
  p.options = { group };
  return p;
}

const catalog = () =>
  cat(
    [
      grouped('CBL-0106', 'Audio Cable', 'YJ56878', '10M', '1CH MIC CABLE'),
      grouped('CBL-0129', 'XLR 3p Connector', 'NC3FXX', '10EA', '뉴트릭 커넥터'),
      grouped('CBL-0130', 'XLR 3p Connector', 'NC3MXX', '10EA', '뉴트릭 커넥터'),
      catalogProduct('CBL-0101', '- Pass Through RJ45 Connector', 'CAT6 UTP용', '10EA'),
    ],
    { 'CBL-0106': '20000', 'CBL-0129': '30000', 'CBL-0130': '30000', 'CBL-0101': '12000' },
  );

function micLine(segmentCount: number): CableLine {
  return {
    sku: 'CBL-0106',
    name: 'Audio Cable',
    specification: 'YJ56878',
    unit: '10M',
    segmentCount,
    lineTypeId: 'audio',
    sourceEdgeIds: [],
  };
}

describe('마이크 케이블 커넥터 — XLR 3핀 F·M 쌍', () => {
  it('CBL-0106 구간에는 NC3FXX·NC3MXX가 같은 수량으로 붙고 기본 RJ45는 붙지 않는다', () => {
    const { lines, warnings } = buildDerivedLines([micLine(4)], catalog());

    expect(lines.map((l) => l.sku)).toEqual(['CBL-0129', 'CBL-0130']);
    // 4구간 × 3개 ÷ 2종 = 6개 → 1묶음씩
    expect(lines.map((l) => l.quantity)).toEqual(['1', '1']);
    expect(lines.every((l) => l.unit === '10EA')).toBe(true);
    expect(lines.every((l) => l.sellingUnitPrice === '30000')).toBe(true);
    expect(lines.some((l) => l.name.includes('RJ45'))).toBe(false);
    expect(warnings).toHaveLength(0);
  });

  it('구간당 3개 규칙 총량을 지킨다 — 7구간이면 F·M 각 11개 → 2묶음씩', () => {
    const { lines } = buildDerivedLines([micLine(7)], catalog());
    // 7구간 × 3개 = 21개를 2종이 나눠 각 ceil(10.5) = 11개 → 2묶음
    expect(lines.map((l) => l.quantity)).toEqual(['2', '2']);
  });

  it('근거를 규격에 남긴다 — 구간 수와 나눈 종 수를 사람이 검산할 수 있다', () => {
    const { lines } = buildDerivedLines([micLine(4)], catalog());
    expect(lines[0]!.specification).toBe('NC3FXX (4구간 × 3개 ÷ 2종)');
    expect(lines[1]!.specification).toBe('NC3MXX (4구간 × 3개 ÷ 2종)');
  });

  it('재산출 짝짓기 식별자가 커넥터별로 붙는다', () => {
    const { lines } = buildDerivedLines([micLine(2)], catalog());
    expect(lines.map((l) => l.sourceCableMembers)).toEqual([
      ['connector:CBL-0129'],
      ['connector:CBL-0130'],
    ]);
  });

  it('다른 벌크 케이블은 여전히 기본 RJ45 커넥터다', () => {
    const utp: CableLine = {
      name: 'UTP Cable (CAT6)',
      specification: '',
      unit: '10M',
      segmentCount: 2,
      lineTypeId: 'network',
      sourceEdgeIds: [],
    };
    const { lines } = buildDerivedLines([utp, micLine(2)], catalog());
    const rj45 = lines.find((l) => l.name.includes('RJ45'))!;
    expect(rj45.sku).toBe('CBL-0101');
    expect(rj45.quantity).toBe('1'); // 2구간 × 3개 = 6개 → 1묶음 (마이크 구간은 빠진다)
    expect(lines.filter((l) => l.sku === 'CBL-0129' || l.sku === 'CBL-0130')).toHaveLength(2);
  });

  it('카탈로그에 XLR 커넥터가 없으면 행은 세우되 막는다 — 단가를 지어내지 않는다', () => {
    const noXlr = cat(
      [grouped('CBL-0106', 'Audio Cable', 'YJ56878', '10M', '1CH MIC CABLE')],
      { 'CBL-0106': '20000' },
    );
    const { lines, warnings } = buildDerivedLines([micLine(1)], noXlr);
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.sku === undefined)).toBe(true);
    expect(warnings.filter((w) => w.blocking && w.code === 'device-not-in-catalog')).toHaveLength(2);
  });

  it('구성도 가져오기 끝까지 — A.AUDIO 연결선이 XLR 쌍으로 나온다', () => {
    const nodes = [node('n1', '마이크', ''), node('n2', '믹서', '')];
    const edges = [edge('e1', 'n1', 'n2', 'audio', { bomRows: [] })];
    const cables = buildCableLines(diagram(nodes, edges), catalog());
    const { lines } = buildDerivedLines(cables.lines, catalog());

    expect(lines.map((l) => l.sku)).toEqual(['CBL-0129', 'CBL-0130']);
    expect(lines.map((l) => l.quantity)).toEqual(['1', '1']); // 1구간 × 3개 ÷ 2종 = 각 2개 → 1묶음
  });
});
