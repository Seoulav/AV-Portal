/**
 * 품목이 지정되지 않은 연결선의 기본 케이블 자동 지정 (운영자 결정 2026-10-12).
 *
 * A.AUDIO 선은 기본 마이크 케이블(CBL-0106 · YJ56878)을 자동 지정한다.
 * 수량은 여전히 경로 거리에서만 나온다 — 거리를 모르면 수량을 비우고
 * 차단 경고를 세운다. 등록되지 않은 선 종류는 기존대로 품목 미정이다.
 */
import { describe, expect, it } from 'vitest';

import { buildCableLines } from '@/import/diagram/cables';
import { catalogProduct, cat, diagram, edge, node } from '../fixtures/diagram';
import type { CatalogProduct } from '@/data/catalog/load';

/** 실물 카탈로그의 두 마이크 케이블 값 그대로다 (품셈 묶음 '1CH MIC CABLE'). */
function micCable(sku: string, quoteName: string, quoteSpec: string): CatalogProduct {
  const p = catalogProduct(sku, quoteName, quoteSpec, '10M');
  p.options = { group: '1CH MIC CABLE' };
  return p;
}

const micCatalog = () =>
  cat(
    [
      micCable('CBL-0106', 'Audio Cable', 'YJ56878'),
      micCable('CBL-0107', 'Audio Cable (배선용)', '9451'),
    ],
    { 'CBL-0106': '20000', 'CBL-0107': '15000' },
  );

const audioEdge = (id: string) => edge(id, 'n1', 'n2', 'audio', { bomRows: [] });
const nodes = () => [node('n1', '마이크', ''), node('n2', '믹서', '')];

describe('A.AUDIO 기본 케이블 자동 지정', () => {
  it('품목 미정 대신 CBL-0106을 지정하되, 거리가 없으면 수량을 비우고 차단한다', () => {
    const built = buildCableLines(diagram(nodes(), [audioEdge('e1')]), micCatalog());

    expect(built.lines).toHaveLength(1);
    const line = built.lines[0]!;
    expect(line.sku).toBe('CBL-0106');
    expect(line.name).toBe('Audio Cable');
    expect(line.unit).toBe('10M');
    expect(line.sellingUnitPrice).toBe('20000');
    expect(line.quantity).toBeUndefined();

    const warning = built.warnings.find((w) => w.edgeId === 'e1');
    expect(warning?.code).toBe('cable-item-unresolved');
    expect(warning?.blocking).toBe(true);
    // 교체 선택지는 같은 품셈 묶음의 두 케이블이다.
    expect(warning?.candidates).toEqual(['CBL-0106', 'CBL-0107']);
  });

  it('모든 구간에 경로 거리가 있으면 합산 길이로 수량이 정해진다', () => {
    const routes = new Map([
      ['e1', { edgeId: 'e1', systemId: 'S1', source: 'confirmed-total' as const, confirmedTotalMeters: '12' }],
      ['e2', { edgeId: 'e2', systemId: 'S1', source: 'confirmed-total' as const, confirmedTotalMeters: '15' }],
    ]);
    const built = buildCableLines(diagram(nodes(), [audioEdge('e1'), audioEdge('e2')]), micCatalog(), routes);

    expect(built.lines).toHaveLength(1);
    const line = built.lines[0]!;
    expect(line.sku).toBe('CBL-0106');
    expect(line.totalMeters).toBe('27');
    expect(line.quantity).toBe('3'); // 27m → 10M 단위 3개
    expect(built.warnings.filter((w) => w.blocking)).toHaveLength(0);
  });

  it('한 구간이라도 거리가 없으면 키 전체의 수량을 비운다 — 모자란 합계를 조용히 쓰지 않는다', () => {
    const routes = new Map([
      ['e1', { edgeId: 'e1', systemId: 'S1', source: 'confirmed-total' as const, confirmedTotalMeters: '12' }],
    ]);
    const built = buildCableLines(diagram(nodes(), [audioEdge('e1'), audioEdge('e2')]), micCatalog(), routes);

    expect(built.lines).toHaveLength(1);
    expect(built.lines[0]!.quantity).toBeUndefined();
    expect(built.warnings.some((w) => w.edgeId === 'e2' && w.blocking)).toBe(true);
  });

  it('기본 케이블이 없는 선 종류는 기존대로 품목 미정이다', () => {
    const built = buildCableLines(
      diagram(nodes(), [edge('e1', 'n1', 'n2', 'video', { bomRows: [] })]),
      micCatalog(),
    );

    expect(built.lines[0]!.sku).toBeUndefined();
    expect(built.lines[0]!.name).toContain('품목 미정');
  });
});
