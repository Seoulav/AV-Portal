/**
 * HDMI·LAN 연결선의 기본 케이블 자동 지정 (운영자 결정 2026-10-16, B-20261016-01).
 *
 * - HDMI → UMC-002(Locking HDMI 2m) 구간당 1EA. 거리를 입력하면 같은 묶음에서
 *   그 거리 이상인 가장 짧은 제품으로 바꾸고, 10m를 넘으면 막는다.
 * - LAN → 10GXE02(S/FTP CAT6A) 벌크. 거리를 입력하지 않은 구간은 10m로 계산한다.
 * - 10GXE02 구간의 커넥터는 CBL-0091(STP Modular Cat.7/Cat.6A용)이다.
 *
 * 품목 값은 실물 카탈로그(`data/approved/products.json`)의 값 그대로다.
 */
import { describe, expect, it } from 'vitest';

import { buildCableLines } from '@/import/diagram/cables';
import { buildDerivedLines } from '@/import/diagram/derived';
import { regenerateCables } from '@/import/diagram/regenerateCables';
import { diagramToQuote } from '@/import/diagram/toQuote';
import { rebuildCableRows } from '@/domain/quote/cableRebuild';
import type { QuoteHeader } from '@/domain/quote/types';
import type { CatalogProduct } from '@/data/catalog/load';
import { catalogProduct, cat, diagram, edge, node } from '../fixtures/diagram';

function grouped(sku: string, quoteName: string, quoteSpec: string, unit: string, group: string): CatalogProduct {
  const p = catalogProduct(sku, quoteName, quoteSpec, unit);
  p.options = { group };
  return p;
}

const header = (): QuoteHeader => ({
  quoteNumber: 'T-1',
  quoteDate: '2026-10-16',
  customer: '합성 고객',
  projectName: '테스트 회의실',
  contact: '',
  conditions: [],
});

const HDMI_GROUP = 'RTCOM_HDMI Locking 케이블';
const catalog = () =>
  cat(
    [
      grouped('CBL-0016', 'Locking HDMI Cable 1m', 'UMC-001', 'EA', HDMI_GROUP),
      grouped('CBL-0017', 'Locking HDMI Cable 2m', 'UMC-002', 'EA', HDMI_GROUP),
      grouped('CBL-0018', 'Locking HDMI Cable 3m', 'UMC-003', 'EA', HDMI_GROUP),
      grouped('CBL-0019', 'Locking HDMI Cable 5m', 'UMC-005', 'EA', HDMI_GROUP),
      grouped('CBL-0020', 'Locking HDMI Cable 10m', 'UMC-010', 'EA', HDMI_GROUP),
      grouped('CBL-0090', 'S/FTP CAT6A Cable', '10GXE02', '10M', '벨덴_SFTP CABLE'),
      grouped('CBL-0091', '- STP Modular_Cat.7/Cat.6A용', 'CAT7/CAT6A SF/UTP용', '10EA', '벨덴_SFTP CABLE'),
      catalogProduct('CBL-0101', '- Pass Through RJ45 Connector', 'CAT6 UTP용', '10EA'),
    ],
    { 'CBL-0017': '30000', 'CBL-0019': '45000', 'CBL-0090': '60000', 'CBL-0091': '50000' },
  );

const nodes = () => [node('n1', 'A', ''), node('n2', 'B', ''), node('n3', 'C', '')];
const hdmi = (id: string) => edge(id, 'n1', 'n2', 'video', { bomRows: [] });
const lan = (id: string) => edge(id, 'n2', 'n3', 'network', { bomRows: [] });
const total = (id: string, meters: string) =>
  [id, { edgeId: id, systemId: 'S1', source: 'confirmed-total' as const, confirmedTotalMeters: meters }] as const;

describe('HDMI 기본 케이블 — UMC-002', () => {
  it('거리가 없으면 연결 수만큼 UMC-002를 넣고 막지 않는다', () => {
    const built = buildCableLines(diagram(nodes(), [hdmi('e1'), hdmi('e2')]), catalog());

    expect(built.lines).toHaveLength(1);
    const line = built.lines[0]!;
    expect(line.sku).toBe('CBL-0017');
    expect(line.specification).toBe('UMC-002');
    expect(line.unit).toBe('EA');
    expect(line.quantity).toBe('2');
    expect(line.sellingUnitPrice).toBe('30000');
    expect(built.warnings.filter((w) => w.blocking)).toHaveLength(0);
    expect(built.warnings.filter((w) => w.code === 'cable-length-assumed')).toHaveLength(2);
  });

  it('거리를 넣으면 그 거리 이상인 가장 짧은 길이로 바뀐다 — 묶음에 없는 7m 계단을 거치지 않는다', () => {
    const routes = new Map([total('e1', '4'), total('e2', '6')]);
    const built = buildCableLines(diagram(nodes(), [hdmi('e1'), hdmi('e2')]), catalog(), routes);

    const bySpec = Object.fromEntries(built.lines.map((l) => [l.specification, l.quantity]));
    expect(bySpec).toEqual({ 'UMC-005': '1', 'UMC-010': '1' });
    expect(built.warnings.filter((w) => w.blocking)).toHaveLength(0);
  });

  it('10m를 넘으면 품목을 비우고, 화면에서 고를 수 있는 품목 미정 경고로 막는다', () => {
    const routes = new Map([total('e1', '12'), total('e2', '40')]);
    const built = buildCableLines(diagram(nodes(), [hdmi('e1'), hdmi('e2')]), catalog(), routes);

    // 길이가 다른 두 구간은 따로 고른다 — 한 행으로 합치지 않는다.
    expect(built.lines).toHaveLength(2);
    expect(built.lines.every((l) => l.sku === undefined)).toBe(true);
    const warning = built.warnings.find((w) => w.edgeId === 'e1');
    expect(warning?.code).toBe('cable-item-unresolved');
    expect(warning?.blocking).toBe(true);
    expect(warning?.requiredCableMeters).toBe('12');
    expect(warning?.sourceCableKey).toBe('ready:auto:over:e1');
  });

  it('경로 입력을 시작만 했으면 2m로 조용히 넣지 않고 막는다', () => {
    const routes = new Map([['e1', { edgeId: 'e1', systemId: 'S1', source: 'measured-route' as const }]]);
    const built = buildCableLines(diagram(nodes(), [hdmi('e1')]), catalog(), routes);

    expect(built.lines[0]!.quantity).toBeUndefined();
    expect(built.warnings.find((w) => w.edgeId === 'e1')?.code).toBe('cable-route-incomplete');
  });
});

describe('LAN 기본 케이블 — 10GXE02', () => {
  it('거리가 없으면 구간당 10m로 계산하고 막지 않는다', () => {
    const built = buildCableLines(diagram(nodes(), [lan('e1')]), catalog());

    const line = built.lines[0]!;
    expect(line.sku).toBe('CBL-0090');
    expect(line.unit).toBe('10M');
    expect(line.totalMeters).toBe('10');
    expect(line.quantity).toBe('1');
    expect(built.warnings.filter((w) => w.blocking)).toHaveLength(0);
    expect(built.warnings.find((w) => w.edgeId === 'e1')?.code).toBe('cable-length-assumed');
  });

  it('거리를 넣은 구간은 그 값을, 안 넣은 구간은 10m를 더한다', () => {
    const routes = new Map([total('e1', '25')]);
    const built = buildCableLines(diagram(nodes(), [lan('e1'), lan('e2')]), catalog(), routes);

    const line = built.lines[0]!;
    expect(line.totalMeters).toBe('35');
    expect(line.quantity).toBe('4'); // 35m → 10M 단위 4개
  });

  it('10GXE02 구간에는 CBL-0091 커넥터가 붙고 기본 RJ45 커넥터는 붙지 않는다', () => {
    const cables = buildCableLines(diagram(nodes(), [lan('e1'), lan('e2'), lan('e3'), lan('e4')]), catalog());
    const { lines, warnings } = buildDerivedLines(cables.lines, catalog());

    expect(lines).toHaveLength(1);
    expect(lines[0]!.sku).toBe('CBL-0091');
    expect(lines[0]!.unit).toBe('10EA');
    expect(lines[0]!.quantity).toBe('2'); // 4구간 × 3개 = 12개 → 2묶음
    expect(lines[0]!.sellingUnitPrice).toBe('50000');
    expect(warnings).toHaveLength(0);
  });
});

describe('커넥터 행 2개 — 재산출 짝짓기 (독립 리뷰 지적)', () => {
  it('LAN 전용 커넥터 행의 비고를 고친 뒤 HDMI 거리를 넣어 재산출해도 충돌 없이 비고가 남는다', () => {
    const withMic = cat(
      [
        ...catalog().products,
        Object.assign(catalogProduct('CBL-0106', 'Audio Cable', 'YJ56878', '10M'), { options: { group: '1CH MIC CABLE' } }),
      ],
      { 'CBL-0017': '30000', 'CBL-0090': '60000', 'CBL-0091': '50000', 'CBL-0101': '12000', 'CBL-0106': '20000' },
    );
    const source = diagram(nodes(), [
      hdmi('h1'),
      lan('l1'),
      edge('a1', 'n1', 'n3', 'audio', { bomRows: [] }),
    ]);
    const imported = diagramToQuote(source, withMic, { header: header(), defaultSystemName: '회의실' }).document;
    const connectorRows = imported.rows.filter((r) => r.type === 'item' && r.ruleInstanceId === 'diagram-connectors-v1');
    expect(connectorRows).toHaveLength(2);

    const dedicated = connectorRows.find((r) => r.type === 'item' && r.sku === 'CBL-0091')!;
    const edited = { ...imported, rows: imported.rows.map((r) => (r.rowId === dedicated.rowId ? { ...r, remark: '현장 확인 메모' } : r)) };

    const next = regenerateCables(edited, withMic, [
      { edgeId: 'h1', systemId: imported.systems[0]!.systemId, source: 'confirmed-total', confirmedTotalMeters: '4' },
    ]);
    const result = rebuildCableRows(edited, imported.cableBaseline ?? [], next.rows);

    expect(result.canApply).toBe(true);
    expect(result.rows.find((r) => r.rowId === dedicated.rowId)).toMatchObject({ remark: '현장 확인 메모' });
  });
});
