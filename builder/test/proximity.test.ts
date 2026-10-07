import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, geometry as G, type Equipment, type Library, type Port } from '../src/engine';
import { SNAP_RADIUS_PX, anchorOf, equipmentAt, findDropTarget, nodeAnchors } from '../src/proximity';
import { createBuilderStore } from '../src/state/store';

// 합성 라이브러리(현재 Portal 데이터와 무관). 사진이 없어 첫 단자 행 가운데는 12 + 54 + 12 = 78이다
const port = (id: string, direction: Port['direction'], signal: string, type: string): Port => ({ id, label: id, type, direction, connector: signal === 'ETHERNET' ? 'RJ45' : signal, signals: [signal], verification: 'FOUND' });
const equipment = (id: string, ports: Port[]): Equipment => ({
  id, category: 'video', name: 'Device', model: id.toUpperCase(), manufacturer: 'Test',
  inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: '' },
});
const UNITS: [string, Port[]][] = [
  ['src', [port('out-hdmi-1', 'out', 'HDMI', 'video'), port('out-hdmi-2', 'out', 'HDMI', 'video')]],
  ['disp', [port('in-hdmi-1', 'in', 'HDMI', 'video'), port('in-hdmi-2', 'in', 'HDMI', 'video'), port('in-hdmi-3', 'in', 'HDMI', 'video'), port('both-ethernet-1', 'both', 'ETHERNET', 'network')]],
  ['ctl', [port('in-rs-232-1', 'in', 'RS-232', 'control')]],
  ['sw', [port('both-ethernet-1', 'both', 'ETHERNET', 'network')]],
];
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0',
  source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })),
  vocabulary: { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: UNITS.map(([id, ports]) => ({ productId: id, source: 'portal', brand: 'Test', product: id, categories: ['영상', 'Video', 'Device'], detailUrl: '', placeable: true, units: [{ unitId: id, equipment: equipment(id, ports) }], readiness: { ioRows: 1, ports: ports.length, unresolvedRows: 0, nonPortRows: 0 } })),
} as unknown as Library;

const setup = () => {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed: 9, now: 0 }) });
  store.getState().setLibrary(index);
  const place = (id: string, x: number, y = 0) => store.getState().addEquipment(index.units.get(id)!.equipment, { x, y });
  const drop = (from: { nodeId: string; handle: string }, point: { x: number; y: number }, zoom = 1) => {
    const state = store.getState();
    return findDropTarget({ nodes: state.diagram.nodes, fromNodeId: from.nodeId, point, zoom, judge: state.connectionJudge(from) });
  };
  return { store, place, drop };
};
const ROW1 = G.NODE_PADDING + G.NODE_HEADER_HEIGHT + G.PORT_ROW_HEIGHT / 2;

describe('anchors', () => {
  it('follow geometry and the 1.1 handle ids', () => {
    const { store, place } = setup();
    const disp = place('disp', 500, 100);
    const node = store.getState().diagram.nodes.find(item => item.id === disp)!;
    const anchors = nodeAnchors(node);
    expect(anchors.map(anchor => anchor.handle)).toEqual(['in-hdmi-1', 'in-hdmi-2', 'in-hdmi-3', 'target_both-ethernet-1', 'source_both-ethernet-1']);
    expect([anchors[0].ax, anchors[0].ay]).toEqual([500 - G.HANDLE_OUTSET, 100 + ROW1]);
    expect(anchors[1].ay - anchors[0].ay).toBe(G.PORT_ROW_HEIGHT + G.PORT_ROW_GAP);
    expect(anchorOf(node, 'source_both-ethernet-1')).toMatchObject({ side: 'right', ax: 500 + G.NODE_WIDTH + G.HANDLE_OUTSET });
    expect(anchorOf(node, 'nope')).toBeNull();
  });

  it('finds the equipment under a point, topmost first', () => {
    const { store, place } = setup();
    place('src', 0);
    const top = place('disp', 100);
    const nodes = store.getState().diagram.nodes;
    expect(equipmentAt(nodes, { x: 150, y: 20 })?.id).toBe(top);
    expect(equipmentAt(nodes, { x: 50, y: 20 })?.data.id).toBe('src');
    expect(equipmentAt(nodes, { x: -5, y: 20 })).toBeNull();
  });
});

describe('drop target', () => {
  it('snaps within 40 screen px, scaled by zoom', () => {
    const { place, drop } = setup();
    const src = place('src', 0);
    const disp = place('disp', 500);
    const from = { nodeId: src, handle: 'out-hdmi-1' };
    const anchor = { x: 500 - G.HANDLE_OUTSET, y: ROW1 };
    expect(drop(from, { x: anchor.x - 10, y: anchor.y })).toMatchObject({ kind: 'connect', anchor: { nodeId: disp, handle: 'in-hdmi-1' } });
    expect(drop(from, { x: anchor.x - SNAP_RADIUS_PX, y: anchor.y })).toMatchObject({ kind: 'connect' });
    expect(drop(from, { x: anchor.x - SNAP_RADIUS_PX - 5, y: anchor.y })).toBeNull();
    // 2배 확대면 캔버스 좌표로 20 안쪽만 붙는다
    expect(drop(from, { x: anchor.x - 15, y: anchor.y }, 2)).toMatchObject({ kind: 'connect' });
    expect(drop(from, { x: anchor.x - 25, y: anchor.y }, 2)).toBeNull();
  });

  it('skips occupied ports and takes the next nearest free one', () => {
    const { store, place, drop } = setup();
    const src = place('src', 0);
    const disp = place('disp', 500);
    expect(store.getState().connect({ source: src, sourceHandle: 'out-hdmi-2', target: disp, targetHandle: 'in-hdmi-1' })).toBe(true);
    const target = drop({ nodeId: src, handle: 'out-hdmi-1' }, { x: 500 - G.HANDLE_OUTSET - 5, y: ROW1 });
    expect(target).toMatchObject({ kind: 'connect', anchor: { handle: 'in-hdmi-2' } });
  });

  it('dropping on a device body picks its nearest connectable port at any distance', () => {
    const { place, drop } = setup();
    const src = place('src', 0);
    const disp = place('disp', 500);
    // 헤더 오른쪽 끝: 입력 단자에서 200px 넘게 떨어져 있다
    const target = drop({ nodeId: src, handle: 'out-hdmi-1' }, { x: 500 + G.NODE_WIDTH - 5, y: 10 });
    expect(target).toMatchObject({ kind: 'connect', anchor: { nodeId: disp, handle: 'in-hdmi-1' } });
  });

  it('reports why the nearest ports are blocked', () => {
    const { place, drop } = setup();
    const src = place('src', 0);
    place('ctl', 500);
    expect(drop({ nodeId: src, handle: 'out-hdmi-1' }, { x: 500 - G.HANDLE_OUTSET - 5, y: ROW1 })).toMatchObject({ kind: 'blocked', code: 'signal-mismatch' });
    expect(drop({ nodeId: src, handle: 'out-hdmi-1' }, { x: 600, y: 10 })).toMatchObject({ kind: 'blocked', code: 'signal-mismatch' });
  });

  it('never snaps back to the starting device', () => {
    const { place, drop } = setup();
    const src = place('src', 0);
    expect(drop({ nodeId: src, handle: 'out-hdmi-1' }, { x: 100, y: 30 })).toBeNull();
    expect(drop({ nodeId: src, handle: 'out-hdmi-1' }, { x: G.NODE_WIDTH + G.HANDLE_OUTSET + 2, y: ROW1 + 28 })).toBeNull();
  });

  it('connects bidirectional ports with source_/target_ handles', () => {
    const { store, place, drop } = setup();
    const disp = place('disp', 0);
    const sw = place('sw', 500);
    const from = { nodeId: disp, handle: 'source_both-ethernet-1' };
    const target = drop(from, { x: 500 - G.HANDLE_OUTSET - 3, y: ROW1 + G.BIDI_LABEL_HEIGHT });
    expect(target).toMatchObject({ kind: 'connect', anchor: { nodeId: sw, handle: 'target_both-ethernet-1' } });
    if (target?.kind !== 'connect') return;
    expect(store.getState().connect({ source: disp, sourceHandle: from.handle, target: sw, targetHandle: target.anchor.handle })).toBe(true);
    const edge = store.getState().diagram.edges[0];
    expect([edge.sourceHandle, edge.targetHandle]).toEqual(['source_both-ethernet-1', 'target_both-ethernet-1']);
  });
});
