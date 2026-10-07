import { describe, expect, it } from 'vitest';
import dagre from 'dagre';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, geometry as G, type Equipment, type Library, type Port } from '../src/engine';
import { layoutPositions } from '../src/layout';
import { createBuilderStore } from '../src/state/store';

// 합성 라이브러리(현재 Portal 데이터와 무관). 사진 주소를 넣어 노드 높이를 구 Builder(사진이 늘 있다)와 같게 한다
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
  products: UNITS.map(([id, ports]) => ({ productId: id, source: 'portal', brand: 'T', product: id, categories: ['x', 'Video', 'D'], detailUrl: '', placeable: true, units: [{ unitId: id, equipment: { id, category: 'video', name: 'D', model: id, manufacturer: 'T', imageUrl: `https://example.invalid/${id}.webp`, inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'), portal: { productId: id, source: 'portal', detailUrl: '' } } as Equipment }], readiness: { ioRows: 1, ports: ports.length, unresolvedRows: 0, nonPortRows: 0 } })),
} as unknown as Library;

const setup = (seed = 1) => {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed, now: 0 }) });
  store.getState().setLibrary(index);
  const place = (id: string, x = 0, y = 0) => store.getState().addEquipment(index.units.get(id)!.equipment, { x, y });
  const link = (source: string, sourceHandle: string, target: string, targetHandle: string) => expect(store.getState().connect({ source, sourceHandle, target, targetHandle })).toBe(true);
  const positions = () => Object.fromEntries(store.getState().diagram.nodes.map(node => [node.id, node.position]));
  return { store, place, link, positions };
};

// 결정적 무작위 장면(장비 3~11대, HDMI 신호선과 양방향 LAN선이 섞인다)
const rng = (seed: number) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
function scene(seed: number) {
  const random = rng(seed);
  const { store, place } = setup(seed);
  const count = 3 + Math.floor(random() * 9);
  const ids = Array.from({ length: count }, () => place(UNITS[Math.floor(random() * UNITS.length)][0], Math.round(random() * 1200), Math.round(random() * 900)));
  for (let k = 0; k < count * 3; k += 1) {
    const s = ids[Math.floor(random() * ids.length)];
    const t = ids[Math.floor(random() * ids.length)];
    const sd = store.getState().diagram.nodes.find(n => n.id === s)!.data as unknown as Equipment;
    const td = store.getState().diagram.nodes.find(n => n.id === t)!.data as unknown as Equipment;
    if (random() < 0.3 && sd.bidirectional.length && td.bidirectional.length) {
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

describe('auto layout (old Builder layout.ts, dagre 0.8.5)', () => {
  it('places a signal chain left to right, a column apart', () => {
    const { store, place, link } = setup();
    const source = place('a', 900, 300);
    const middle = place('d', 0, 0);
    const sink = place('b', 400, 600);
    link(source, 'out-hdmi-1', middle, 'in-hdmi-1');
    link(middle, 'out-hdmi-1', sink, 'in-hdmi-1');
    const positions = layoutPositions(store.getState().diagram.nodes, store.getState().diagram.edges, dagre);
    const xs = [source, middle, sink].map(id => positions.get(id)!.x);
    expect(xs[0]).toBe(50); // marginx
    expect(xs[1] - xs[0]).toBe(G.NODE_WIDTH + 280); // ranksep
    expect(xs[2] - xs[1]).toBe(G.NODE_WIDTH + 280);
  });

  it('orders sources top to bottom by the input each one feeds (barycenter)', () => {
    const { store, place, link } = setup();
    const mixer = place('b', 0, 0);
    // 만든 순서와 반대로 이어, Dagre가 고른 순서가 아니라 입력 번호가 위아래를 정하는지 본다
    const sources = ['a', 'a', 'a'].map((id, i) => place(id, 0, i * 10));
    link(sources[0], 'out-hdmi-1', mixer, 'in-hdmi-3');
    link(sources[1], 'out-hdmi-1', mixer, 'in-hdmi-1');
    link(sources[2], 'out-hdmi-1', mixer, 'in-hdmi-2');
    const positions = layoutPositions(store.getState().diagram.nodes, store.getState().diagram.edges, dagre);
    const order = [...sources].sort((p, q) => positions.get(p)!.y - positions.get(q)!.y);
    expect(order).toEqual([sources[1], sources[2], sources[0]]);
  });

  it('keeps at least 40px between devices of a column', () => {
    for (const seed of [3, 8, 21, 44]) {
      const diagram = scene(seed);
      const positions = layoutPositions(diagram.nodes, diagram.edges, dagre);
      const placed = diagram.nodes.map(node => ({ ...positions.get(node.id)!, height: G.nodeHeight(node.data as unknown as Equipment) }));
      for (const a of placed) {
        for (const b of placed) {
          if (a === b || Math.abs(a.x - b.x) >= G.NODE_WIDTH + 40 || a.y > b.y) continue;
          expect(b.y - (a.y + a.height)).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  it('does not depend on node or edge order, so a reopened file lays out the same', () => {
    for (const seed of [5, 23, 77]) {
      const diagram = scene(seed);
      const forward = layoutPositions(diagram.nodes, diagram.edges, dagre);
      const reversed = layoutPositions([...diagram.nodes].reverse(), [...diagram.edges].reverse(), dagre);
      expect(Object.fromEntries(reversed)).toEqual(Object.fromEntries(forward));
    }
  });

  it('moves only devices; notes and zones stay, and one undo restores everything', () => {
    const { store, place, link, positions } = setup();
    const a = place('a', 700, 0);
    const b = place('b', 0, 0);
    link(a, 'out-hdmi-1', b, 'in-hdmi-1');
    store.getState().addAnnotation({ x: 11, y: 22 });
    store.getState().addShape({ x: 33, y: 44 });
    const before = positions();
    const notes = store.getState().diagram.nodes.filter(node => node.type !== 'equipment');
    expect(store.getState().applyLayout(dagre)).toBe(true);
    const after = store.getState().diagram.nodes;
    for (const note of notes) expect(after.find(node => node.id === note.id)!.position).toEqual(note.position);
    expect(after.find(node => node.id === a)!.position.x).toBeLessThan(after.find(node => node.id === b)!.position.x);
    store.getState().undo();
    expect(positions()).toEqual(before);
    // 이미 배치된 상태에서 다시 누르면 바뀌는 것이 없어 기록하지 않는다
    store.getState().redo();
    const past = store.getState().past.length;
    expect(store.getState().applyLayout(dagre)).toBe(false);
    expect(store.getState().past.length).toBe(past);
  });

  // 기대값: 구 Builder src/utils/layout.ts(2fd568e)를 dagre@0.8.5로 저장소 밖에서 그대로 실행해 얻었다(같은 장면, id 순 입력)
  // 장면마다 신호선(HDMI)과 LAN선(양방향, minlen 0)이 섞여 있다
  const OLD_BUILDER: Record<number, [number, number][]> = {
    5: [[410, 50], [2410, 699], [1410, 169], [910, 684], [910, 183], [1910, 622], [50, 803], [2770, 846]], // 장비 8·연결 12(신호 8)
    23: [[50, 1055], [1050, 331], [1550, 345], [3050, 1190], [2550, 50], [2550, 539], [550, 1123], [2050, 424], [3050, 317], [2550, 1098]], // 장비 10·연결 17(신호 16)
    77: [[50, 50], [1550, 625], [2050, 653], [1050, 796], [1050, 291], [50, 628], [550, 464], [550, 965]], // 장비 8·연결 13(신호 12)
    101: [[50, 658], [410, 50], [1130, 120], [770, 1242], [50, 307], [1490, 677], [770, 330], [1990, 663], [770, 859], [2350, 663], [1490, 1178]], // 장비 11·연결 14(신호 11)
  };
  it.each(Object.keys(OLD_BUILDER).map(Number))('matches the old Builder on sample scene %i', seed => {
    const diagram = scene(seed);
    const positions = layoutPositions(diagram.nodes, diagram.edges, dagre);
    const byId = [...diagram.nodes].sort((p, q) => (p.id < q.id ? -1 : 1));
    expect(byId.map(node => [positions.get(node.id)!.x, positions.get(node.id)!.y])).toEqual(OLD_BUILDER[seed]);
  });
});

