import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, validateDiagram, type Equipment, type Library, type Port } from '../src/engine';
import { resolveBundleDrop } from '../src/bundleDrop';
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

  it('moves each further paste another 40px (decision K-b); an undone paste frees its spot again', () => {
    const { store, src, select } = setup();
    select([src]);
    store.getState().copySelection();
    const count = store.getState().diagram.nodes.length;
    const last = () => store.getState().diagram.nodes.at(-1)!.position;
    store.getState().paste();
    store.getState().paste();
    const copies = store.getState().diagram.nodes.slice(count);
    expect(copies.map(node => node.position)).toEqual([{ x: PASTE_STEP, y: PASTE_STEP }, { x: 2 * PASTE_STEP, y: 2 * PASTE_STEP }]);
    // 두 번째 붙여넣기를 되돌리면 그 자리가 비어 다시 그 자리에 붙는다
    store.getState().undo();
    expect(store.getState().diagram.nodes).toHaveLength(count + 1);
    store.getState().paste();
    expect(last()).toEqual({ x: 2 * PASTE_STEP, y: 2 * PASTE_STEP });
    // 모두 되돌리면 처음 자리(40px)부터다
    store.getState().undo();
    store.getState().undo();
    store.getState().paste();
    expect(last()).toEqual({ x: PASTE_STEP, y: PASTE_STEP });
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

  it('lists only the line types used in the diagram, in rule order (decision K-c), and keeps a chip for a hidden type', () => {
    const { store } = setup();
    expect(usedLineTypes(store.getState().diagram, DEFAULT_RULES.lineTypes).map(item => item.id)).toEqual(['network', 'video']);
    // 숨겨 둔 종류는 그 연결이 없어도 칩이 남아 숨김을 풀 수 있다
    expect(usedLineTypes(store.getState().diagram, DEFAULT_RULES.lineTypes, ['sdi']).map(item => item.id)).toEqual(['network', 'sdi', 'video']);
  });

  it('keeps hidden devices out of drops and box selection (review 1)', () => {
    const { store, index, sw } = setup();
    // 연결 없는 장비 하나를 더 두고 LAN을 숨긴다: 스위치와 새 장비가 숨는다
    const spare = store.getState().addEquipment(index.units.get('src')!.equipment, { x: 0, y: 900 });
    store.getState().toggleLineType('network');
    expect(lineFilter(store.getState().diagram, ['network']).hiddenNodes).toEqual(new Set([sw, spare]));
    // 스위치가 있던 자리에 놓아도 붙지 않는다
    const switchNode = store.getState().diagram.nodes.find(node => node.id === sw)!;
    const drop = resolveBundleDrop(store.getState(), { bundle: [`${spare}::both-ethernet-1`], from: { nodeId: spare, handle: 'source_both-ethernet-1', type: 'source' }, under: null, point: { x: switchNode.position.x + 110, y: switchNode.position.y + 60 }, zoom: 1 });
    expect(drop.target).toBeNull();
    // 범위 선택에 숨긴 장비의 단자는 들지 않는다
    store.getState().finishBoxSelection({ x: -100, y: -100, width: 2000, height: 2000 });
    const picked = store.getState().selectedPorts;
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.some(key => key.startsWith(`${sw}::`) || key.startsWith(`${spare}::`))).toBe(false);
  });

  it('a paste or an issue click never leaves a hidden device selected (review 3)', () => {
    const { store, sw, select, note } = setup();
    select([sw, note()]);
    store.getState().copySelection();
    store.getState().toggleLineType('network');
    store.getState().paste();
    const added = store.getState().diagram.nodes.slice(-2);
    // 붙인 스위치는 연결이 없어 숨고, 고른 것으로 남지 않는다. 메모는 보이고 골라진다
    expect(added.map(node => [node.type, Boolean(node.selected)])).toEqual([['equipment', false], ['annotation', true]]);
    expect(store.getState().notice?.text).toContain('1개는 선 종류 필터로 숨겨져 있습니다');
    // 숨긴 장비를 이슈에서 누르면 필터를 풀고 고른다
    store.getState().focusTarget({ node: sw });
    expect(store.getState().hiddenLineTypes).toEqual([]);
    expect(store.getState().diagram.nodes.find(node => node.id === sw)!.selected).toBe(true);
  });

  it('drawing a link of a hidden type shows that type again', () => {
    const { store, index, sw } = setup();
    const spare = store.getState().addEquipment(index.units.get('src')!.equipment, { x: 0, y: 900 });
    store.getState().toggleLineType('network');
    expect(store.getState().connect({ source: spare, sourceHandle: 'source_both-ethernet-1', target: sw, targetHandle: 'target_both-ethernet-3' })).toBe(true);
    expect(store.getState().hiddenLineTypes).toEqual([]);
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
