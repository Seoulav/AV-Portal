import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, type BomRow, type Equipment, type Library, type Port } from '../src/engine';
import { cableLabel, CABLE_MISSING } from '../src/components/BuilderEdge';
import { buildOrthogonalPath, computeJumps, getEdgePoints, type XY } from '../src/edges/edgeGeometry';
import { SPACING, edgeOffsets, normalizeBidiEdges } from '../src/edges/edgeProcessing';
import { anchorOf } from '../src/proximity';
import { createBuilderStore } from '../src/state/store';

// 합성 라이브러리(현재 Portal 데이터와 무관)
const port = (id: string, direction: Port['direction'], signal: string, type: string): Port => ({ id, label: id, type, direction, connector: signal === 'ETHERNET' ? 'RJ45' : 'HDMI', signals: [signal], verification: 'FOUND' });
const unit = (id: string, ins: number, outs: number, both: number): [string, Port[]] => [id, [
  ...Array.from({ length: ins }, (_, i) => port(`in-hdmi-${i + 1}`, 'in', 'HDMI', 'video')),
  ...Array.from({ length: outs }, (_, i) => port(`out-hdmi-${i + 1}`, 'out', 'HDMI', 'video')),
  ...Array.from({ length: both }, (_, i) => port(`both-ethernet-${i + 1}`, 'both', 'ETHERNET', 'network')),
]];
const UNITS = [unit('a', 2, 4, 1), unit('b', 8, 2, 1), unit('c', 1, 8, 2), unit('d', 4, 4, 0), unit('e', 6, 1, 1)];
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0', source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })), vocabulary: { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: UNITS.map(([id, ports]) => ({ productId: id, source: 'portal', brand: 'T', product: id, categories: ['x', 'Video', 'D'], detailUrl: '', placeable: true, units: [{ unitId: id, equipment: { id, category: 'video', name: 'D', model: id, manufacturer: 'T', inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'), portal: { productId: id, source: 'portal', detailUrl: '' } } as Equipment }], readiness: { ioRows: 1, ports: ports.length, unresolvedRows: 0, nonPortRows: 0 } })),
} as unknown as Library;

const setup = (seed = 1) => {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed, now: 0 }) });
  store.getState().setLibrary(index);
  const place = (id: string, x: number, y = 0) => store.getState().addEquipment(index.units.get(id)!.equipment, { x, y });
  const link = (source: string, sourceHandle: string, target: string, targetHandle: string) => expect(store.getState().connect({ source, sourceHandle, target, targetHandle })).toBe(true);
  return { store, place, link };
};

// 결정적 무작위 장면(장비 3~11대, 4열, 연결 시도 = 장비 수 × 3)
const rng = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
function scene(seed: number) {
  const random = rng(seed);
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed, now: 0 }) });
  store.getState().setLibrary(index);
  const count = 3 + Math.floor(random() * 9);
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const u = UNITS[Math.floor(random() * UNITS.length)][0];
    const column = Math.floor(random() * 4);
    ids.push(store.getState().addEquipment(index.units.get(u)!.equipment, { x: column * 420 + Math.round(random() * 60), y: Math.round(random() * 900) }));
  }
  for (let k = 0; k < count * 3; k += 1) {
    const s = ids[Math.floor(random() * ids.length)];
    const t = ids[Math.floor(random() * ids.length)];
    const sd = store.getState().diagram.nodes.find(n => n.id === s)!.data as unknown as Equipment;
    const td = store.getState().diagram.nodes.find(n => n.id === t)!.data as unknown as Equipment;
    if (random() < 0.25 && sd.bidirectional.length && td.bidirectional.length) {
      const a = sd.bidirectional[Math.floor(random() * sd.bidirectional.length)].id;
      const b = td.bidirectional[Math.floor(random() * td.bidirectional.length)].id;
      store.getState().connect({ source: s, sourceHandle: `source_${a}`, target: t, targetHandle: `target_${b}` });
    } else if (sd.outputs.length && td.inputs.length) {
      const a = sd.outputs[Math.floor(random() * sd.outputs.length)].id;
      const b = td.inputs[Math.floor(random() * td.inputs.length)].id;
      store.getState().connect({ source: s, sourceHandle: a, target: t, targetHandle: b });
    }
  }
  return store.getState().diagram;
}
const offsetsOf = (diagram: ReturnType<typeof scene>) => edgeOffsets(normalizeBidiEdges(diagram.edges, diagram.nodes), diagram.nodes);

// 화면에 그려질 경로(정규화 + 간격)
const polylines = (diagram: ReturnType<typeof scene>) => {
  const view = normalizeBidiEdges(diagram.edges, diagram.nodes);
  const offsets = edgeOffsets(view, diagram.nodes);
  const byId = new Map(diagram.nodes.map(node => [node.id, node]));
  return view.map(edge => {
    const s = anchorOf(byId.get(edge.source), edge.sourceHandle)!;
    const t = anchorOf(byId.get(edge.target), edge.targetHandle)!;
    return { id: edge.id, points: getEdgePoints({ sourceX: s.ax, sourceY: s.ay, targetX: t.ax, targetY: t.ay, splitOffset: offsets.get(edge.id) ?? 0 }) };
  });
};
// 세로 구간끼리 같은 x에 겹치는 쌍의 수
const overlappingVerticals = (lines: { points: XY[] }[]) => {
  const verticals = lines.flatMap((line, owner) => line.points.slice(1).map((p, i) => ({ owner, a: line.points[i], b: p })).filter(seg => Math.abs(seg.a.x - seg.b.x) < 0.5 && Math.abs(seg.a.y - seg.b.y) > 1));
  let count = 0;
  for (let i = 0; i < verticals.length; i += 1) for (let j = i + 1; j < verticals.length; j += 1) {
    const [p, q] = [verticals[i], verticals[j]];
    if (p.owner === q.owner) continue;
    const overlap = Math.min(Math.max(p.a.y, p.b.y), Math.max(q.a.y, q.b.y)) - Math.max(Math.min(p.a.y, p.b.y), Math.min(q.a.y, q.b.y));
    if (overlap > 4 && Math.abs(p.a.x - q.a.x) < 1) count += 1;
  }
  return count;
};

describe('edge offsets (ported from the old Builder)', () => {
  // 기대값은 구 Builder(seoul-visual-tech/av-system-builder 2fd568e) processEdgesWithOffsets에 같은 장면을 넣어 얻었다.
  // 좌표계: 구 Builder는 핸들이 노드 테두리라 노드 x를 20 당기고 폭 260으로 두어 선이 붙는 점을 같게 맞췄다
  // (이식할 때 무작위 장면 200개·엣지 1,949개에서 모두 같음을 확인했다)
  it.each([
    [5, [10, 0, -10, -20, 20, 0, -20, -10, 10, 20, 0, 0]],
    [23, [20, 0, 0, -10, -20, -10, 20, -10, 20, 10, -10, -75, 0, 10, -115.5, -89, 10, 0]],
    [77, [10, 0, -10, 0, 0, -10, -10, 10, -105.5, 10, -10, 10, 10]],
  ])('matches the old Builder on seeded scene %i', (seed, expected) => {
    const diagram = scene(seed);
    const offsets = offsetsOf(diagram);
    expect(diagram.edges.map(edge => offsets.get(edge.id) ?? 0)).toEqual(expected);
  });

  it('fans 8 sources into one mixer without overlapping vertical runs', () => {
    const { store, place, link } = setup();
    const mix = place('b', 600, 200);
    const sources = Array.from({ length: 8 }, (_, i) => place('e', 0, i * 140));
    sources.forEach((id, i) => link(id, 'out-hdmi-1', mix, `in-hdmi-${i + 1}`));
    const diagram = store.getState().diagram;
    const offsets = offsetsOf(diagram);
    expect(new Set(diagram.edges.map(edge => offsets.get(edge.id))).size).toBe(8);
    expect(overlappingVerticals(polylines(diagram))).toBe(0);
  });

  it('fans one splitter out to 4 displays without crossings where the old Builder had a bug (overlapping spans)', () => {
    const { store, place, link } = setup();
    // 위 디스플레이의 입력이 아래 출력보다 낮은 꼴(구 Builder v1.19 실사용 버그): 채널 순서를 바꿔야 교차가 없다
    const splitter = place('c', 0, 300);
    const displays = [0, 1, 2, 3].map(i => place('e', 600, 120 + i * 190));
    displays.forEach((id, i) => link(splitter, `out-hdmi-${i + 1}`, id, 'in-hdmi-1'));
    const lines = polylines(store.getState().diagram);
    expect(overlappingVerticals(lines)).toBe(0);
    const crossings = lines.reduce((sum, line, i) => sum + computeJumps(line.points, lines.filter((_, j) => j !== i).map(other => other.points)).length, 0);
    expect(crossings).toBe(0);
  });

  it('same-pair edges going down put the top source outermost', () => {
    const { store, place, link } = setup();
    const a = place('d', 0, 0);
    const b = place('d', 600, 200);
    link(a, 'out-hdmi-1', b, 'in-hdmi-1');
    link(a, 'out-hdmi-2', b, 'in-hdmi-2');
    const diagram = store.getState().diagram;
    const offsets = offsetsOf(diagram);
    const [top, lower] = diagram.edges.slice().sort((x, y) => (x.sourceHandle < y.sourceHandle ? -1 : 1)).map(edge => offsets.get(edge.id)!);
    expect(top).toBe(SPACING / 2);
    expect(lower).toBe(-SPACING / 2);
  });

  it('flips bidirectional↔bidirectional edges to run left to right, only on screen', () => {
    const { store, place, link } = setup();
    const right = place('a', 600, 0);
    const left = place('a', 0, 0);
    link(right, 'source_both-ethernet-1', left, 'target_both-ethernet-1');
    const saved = store.getState().diagram.edges[0];
    const [view] = normalizeBidiEdges(store.getState().diagram.edges, store.getState().diagram.nodes);
    expect([view.source, view.sourceHandle, view.target, view.targetHandle]).toEqual([left, 'source_both-ethernet-1', right, 'target_both-ethernet-1']);
    // 저장된 엣지는 그대로다
    expect([saved.source, saved.target]).toEqual([right, left]);
    const plain = { id: 'x', source: right, target: left, sourceHandle: 'out-hdmi-1', targetHandle: 'in-hdmi-1' };
    expect(normalizeBidiEdges([plain], store.getState().diagram.nodes)[0]).toBe(plain);
  });
});

describe('edge geometry (ported from the old Builder)', () => {
  it('routes forward edges H-V-H, near-straight edges straight, and back edges in a U below', () => {
    expect(getEdgePoints({ sourceX: 0, sourceY: 0, targetX: 200, targetY: 100, splitOffset: 10 })).toEqual([{ x: 0, y: 0 }, { x: 110, y: 0 }, { x: 110, y: 100 }, { x: 200, y: 100 }]);
    expect(getEdgePoints({ sourceX: 0, sourceY: 0, targetX: 200, targetY: 5, splitOffset: 10 })).toHaveLength(2);
    const back = getEdgePoints({ sourceX: 300, sourceY: 50, targetX: 0, targetY: 100, splitOffset: -20 });
    expect(back).toHaveLength(6);
    expect(back[2].y).toBe(100 + 90 + 20);
  });

  it('draws a jump where a horizontal run crosses another edge vertical, and rounds corners', () => {
    const mine = getEdgePoints({ sourceX: 0, sourceY: 100, targetX: 400, targetY: 300, splitOffset: 0 });
    const other = getEdgePoints({ sourceX: 0, sourceY: 0, targetX: 200, targetY: 400, splitOffset: 0 });
    const jumps = computeJumps(mine, [other]);
    expect(jumps).toEqual([{ x: 100, y: 100 }]);
    const path = buildOrthogonalPath(mine, jumps);
    expect(path).toContain(' A 6 6 0 0 1 ');
    expect(path).toContain(' Q ');
    // 끝에 가까운 교차(14px 안)는 점프하지 않는다
    expect(computeJumps(mine, [getEdgePoints({ sourceX: 0, sourceY: 0, targetX: 10, targetY: 400, splitOffset: -5 })])).toEqual([]);
  });

  it('summarizes cables like the old BOM mode', () => {
    const row = (patch: Partial<BomRow>): BomRow => ({ cableType: 'ready-made', productName: 'HDMI 3m', lineTypeId: 'video', quantity: 2, ...patch });
    expect(cableLabel([])).toBe(CABLE_MISSING);
    expect(cableLabel([row({})])).toBe('HDMI 3m  ×2');
    expect(cableLabel([row({ cableType: 'manufactured', productName: 'UTP', quantity: undefined, length: 12.5 }), row({ cableType: 'manufactured', productName: 'UTP', quantity: undefined, length: 3 })])).toBe('UTP  15.5m');
    expect(cableLabel([row({}), row({ productName: 'DP 2m' })])).toBe('2종  ×4');
  });
});
