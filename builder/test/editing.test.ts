import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, validateDiagram, type Equipment, type Library, type Port } from '../src/engine';
import { lineFilter, usedLineTypes } from '../src/lineFilter';
import { PASTE_STEP, createBuilderStore } from '../src/state/store';

// 합성 라이브러리(현재 Portal 데이터와 무관)
const port = (id: string, direction: Port['direction'], signal: string, type: string): Port => ({ id, label: id, type, direction, connector: signal === 'ETHERNET' ? 'RJ45' : 'HDMI', signals: [signal], verification: 'FOUND' });
const ports = (ins: number, outs: number, both: number) => [
  ...Array.from({ length: ins }, (_, i) => port(`in-hdmi-${i + 1}`, 'in', 'HDMI', 'video')),
  ...Array.from({ length: outs }, (_, i) => port(`out-hdmi-${i + 1}`, 'out', 'HDMI', 'video')),
  ...Array.from({ length: both }, (_, i) => port(`both-ethernet-${i + 1}`, 'both', 'ETHERNET', 'network')),
];
const UNITS: [string, Port[]][] = [['src', ports(0, 2, 1)], ['dst', ports(2, 0, 1)], ['sw', ports(0, 0, 4)]];
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0', source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })), vocabulary: { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: UNITS.map(([id, list]) => ({ productId: id, source: 'portal', brand: 'T', product: id, categories: ['x', 'Video', 'D'], detailUrl: '', placeable: true, units: [{ unitId: id, equipment: { id, category: 'video', name: 'D', model: id.toUpperCase(), manufacturer: 'T', inputs: list.filter(p => p.direction === 'in'), outputs: list.filter(p => p.direction === 'out'), bidirectional: list.filter(p => p.direction === 'both'), portal: { productId: id, source: 'portal', detailUrl: '' } } as Equipment }], readiness: { ioRows: 1, ports: list.length, unresolvedRows: 0, nonPortRows: 0 } })),
} as unknown as Library;

// 카메라(src) → 디스플레이(dst) HDMI 두 줄, 두 장비 모두 스위치(sw)에 LAN. 메모 하나
const setup = () => {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed: 9, now: 0 }) });
  store.getState().setLibrary(index);
  const place = (id: string, x: number, y = 0) => store.getState().addEquipment(index.units.get(id)!.equipment, { x, y });
  const link = (source: string, sourceHandle: string, target: string, targetHandle: string) => expect(store.getState().connect({ source, sourceHandle, target, targetHandle })).toBe(true);
  const src = place('src', 0, 0);
  const dst = place('dst', 500, 0);
  const sw = place('sw', 250, 400);
  link(src, 'out-hdmi-1', dst, 'in-hdmi-1');
  link(src, 'out-hdmi-2', dst, 'in-hdmi-2');
  link(src, 'source_both-ethernet-1', sw, 'target_both-ethernet-1');
  link(dst, 'source_both-ethernet-1', sw, 'target_both-ethernet-2');
  store.getState().addAnnotation({ x: 10, y: 600 });
  const select = (ids: string[]) => store.setState({ diagram: { ...store.getState().diagram, nodes: store.getState().diagram.nodes.map(node => ({ ...node, selected: ids.includes(node.id) })) } });
  const note = () => store.getState().diagram.nodes.find(node => node.type === 'annotation')!.id;
  return { store, index, src, dst, sw, select, note };
};

describe('copy and paste (old Builder Ctrl+C/V)', () => {
  it('copies the selected nodes with the links between them, cables and labels included, and pastes new ids 40px away', () => {
    const { store, src, dst, select, note } = setup();
    const hdmi = store.getState().diagram.edges.find(edge => edge.source === src && edge.sourceHandle === 'out-hdmi-1')!;
    store.getState().updateEdge(hdmi.id, { label: 'PGM', rows: [{ cableType: 'ready-made', productName: 'HDMI 2m', length: 2, quantity: 1 }] });
    select([src, dst, note()]);
    expect(store.getState().copySelection()).toBe(3);
    // 스위치로 가는 LAN선은 한쪽 끝이 고른 장비가 아니라 빠진다
    expect(store.getState().clipboard!.edges).toHaveLength(2);
    const before = store.getState().diagram;
    expect(store.getState().paste()).toBe(3);
    const after = store.getState().diagram;
    const added = after.nodes.filter(node => !before.nodes.some(old => old.id === node.id));
    expect(added).toHaveLength(3);
    expect(added.map(node => node.type).sort()).toEqual(['annotation', 'equipment', 'equipment']);
    expect(added.every(node => node.selected)).toBe(true);
    expect(after.nodes.filter(node => node.selected)).toHaveLength(3);
    const srcCopy = added.find(node => node.type === 'equipment' && (node.data as unknown as Equipment).model === 'SRC')!;
    expect(srcCopy.position).toEqual({ x: PASTE_STEP, y: PASTE_STEP });
    const newEdges = after.edges.filter(edge => !before.edges.some(old => old.id === edge.id));
    expect(newEdges).toHaveLength(2);
    expect(newEdges.every(edge => added.some(node => node.id === edge.source) && added.some(node => node.id === edge.target))).toBe(true);
    const copied = newEdges.find(edge => edge.sourceHandle === 'out-hdmi-1')!;
    expect(copied.data.label).toBe('PGM');
    expect(copied.data.bomRows).toEqual([{ cableType: 'ready-made', productName: 'HDMI 2m', length: 2, quantity: 1 }]);
    // 내보낸 파일이 검증을 통과한다
    expect(validateDiagram(JSON.parse(store.getState().exportText()), { library: store.getState().library }).errors).toEqual([]);
  });

  it('moves each further paste another 40px (decision K-b) and undoes a paste in one step', () => {
    const { store, src, select } = setup();
    select([src]);
    store.getState().copySelection();
    const count = store.getState().diagram.nodes.length;
    store.getState().paste();
    store.getState().paste();
    const copies = store.getState().diagram.nodes.slice(count);
    expect(copies.map(node => node.position)).toEqual([{ x: PASTE_STEP, y: PASTE_STEP }, { x: 2 * PASTE_STEP, y: 2 * PASTE_STEP }]);
    store.getState().undo();
    expect(store.getState().diagram.nodes).toHaveLength(count + 1);
    // 새로 복사하면 다시 40px부터다
    store.getState().copySelection();
    store.getState().paste();
    expect(store.getState().diagram.nodes.at(-1)!.position).toEqual({ x: 3 * PASTE_STEP, y: 3 * PASTE_STEP });
  });

  it('does nothing without a selection or a clipboard', () => {
    const { store } = setup();
    expect(store.getState().paste()).toBe(0);
    expect(store.getState().copySelection()).toBe(0);
    expect(store.getState().clipboard).toBeNull();
  });
});

describe('line type filter (old Builder hiddenLineTypeIds)', () => {
  it('hides the links of a hidden type and the devices left with no visible link; notes stay', () => {
    const { store, src, dst, sw, note } = setup();
    const { diagram } = store.getState();
    const video = lineFilter(diagram, ['video']);
    expect(video.active).toBe(true);
    expect([...video.hiddenEdges]).toHaveLength(2);
    expect(video.hiddenNodes.size).toBe(0);
    const network = lineFilter(diagram, ['network']);
    expect([...network.hiddenNodes]).toEqual([sw]);
    const both = lineFilter(diagram, ['network', 'video']);
    expect([...both.hiddenNodes].sort()).toEqual([src, dst, sw].sort());
    expect(both.hiddenNodes.has(note())).toBe(false);
    // 도면에 없는 종류만 숨겼으면 필터가 꺼진 것과 같다
    expect(lineFilter(diagram, ['sdi']).active).toBe(false);
  });

  it('lists only the line types used in the diagram, in rule order (decision K-c)', () => {
    const { store } = setup();
    expect(usedLineTypes(store.getState().diagram, DEFAULT_RULES.lineTypes).map(item => item.id)).toEqual(['network', 'video']);
  });

  it('drops the selection of what it hides, and never reaches the file', () => {
    const { store, sw, select } = setup();
    const lan = store.getState().diagram.edges.filter(edge => edge.data.lineTypeId === 'network').map(edge => edge.id);
    select([sw]);
    store.getState().selectEdges(lan);
    store.getState().selectPorts([`${sw}::both-ethernet-3`]);
    const text = store.getState().exportText();
    store.getState().toggleLineType('network');
    expect(store.getState().hiddenLineTypes).toEqual(['network']);
    expect(store.getState().diagram.nodes.find(node => node.id === sw)!.selected).toBe(false);
    expect(store.getState().selectedEdgeIds).toEqual([]);
    expect(store.getState().selectedPorts).toEqual([]);
    expect(store.getState().copySelection()).toBe(0);
    store.getState().toggleLock();
    store.getState().toggleSnapToGrid();
    store.getState().toggleMiniMap();
    expect(store.getState().exportText()).toBe(text);
    expect(store.getState().past.length).toBe(3 + 4 + 1); // 장비 3대 + 연결 4개 + 메모(필터·도구는 기록하지 않는다)
    store.getState().toggleLineType('network');
    expect(store.getState().hiddenLineTypes).toEqual([]);
    // 새 구성도에서는 필터를 푼다
    store.getState().toggleLineType('video');
    store.getState().newDiagram();
    expect(store.getState().hiddenLineTypes).toEqual([]);
  });
});
