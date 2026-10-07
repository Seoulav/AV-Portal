import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, geometry as G, type Equipment, type Library, type Port } from '../src/engine';
import { bundleFor, parseKey, planBundle, portKey, portsInRect } from '../src/bundle';
import { resolveBundleDrop } from '../src/bundleDrop';
import { createBuilderStore } from '../src/state/store';

// 합성 라이브러리(현재 Portal 데이터와 무관). 사진이 없어 첫 단자 행 가운데는 12 + 54 + 12 = 78이다
const port = (id: string, direction: Port['direction'], signal: string, type: string): Port => ({ id, label: id, type, direction, connector: 'XLR', signals: [signal], verification: 'FOUND' });
const equipment = (id: string, ports: Port[]): Equipment => ({
  id, category: 'audio', name: 'Device', model: id.toUpperCase(), manufacturer: 'Test',
  inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: '' },
});
const mics = (n: number) => Array.from({ length: n }, (_, i) => port(`in-mic-audio-${i + 1}`, 'in', 'MIC-AUDIO', 'audio'));
const UNITS: [string, Port[]][] = [
  ['mic', [port('out-mic-audio-1', 'out', 'MIC-AUDIO', 'audio')]],
  ['mix', [...mics(6), port('out-line-audio-1', 'out', 'LINE-AUDIO', 'audio')]],
  ['quad', [port('in-mic-audio-1', 'in', 'MIC-AUDIO', 'audio'), ...[1, 2, 3, 4].map(i => port(`out-mic-audio-${i}`, 'out', 'MIC-AUDIO', 'audio'))]],
  ['line', [port('out-line-audio-1', 'out', 'LINE-AUDIO', 'audio')]],
  // 마이크 입력 2개 아래에 다른 신호(라인) 입력이 있는 장비(공개 주소의 사이니지: HDMI 3개 아래 DP·USB와 같은 꼴)
  ['desk', [...mics(2), port('in-line-audio-1', 'in', 'LINE-AUDIO', 'audio')]],
];
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0',
  source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })),
  vocabulary: { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: UNITS.map(([id, ports]) => ({ productId: id, source: 'portal', brand: 'Test', product: id, categories: ['오디오', 'Audio', 'Device'], detailUrl: '', placeable: true, units: [{ unitId: id, equipment: equipment(id, ports) }], readiness: { ioRows: 1, ports: ports.length, unresolvedRows: 0, nonPortRows: 0 } })),
} as unknown as Library;

const ROW1 = G.NODE_PADDING + G.NODE_HEADER_HEIGHT + G.PORT_ROW_HEIGHT / 2;
const setup = () => {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed: 11, now: 0 }) });
  store.getState().setLibrary(index);
  const place = (id: string, x: number, y = 0) => store.getState().addEquipment(index.units.get(id)!.equipment, { x, y });
  // 마이크 4대를 세로로, 믹서를 오른쪽에 놓는다
  const micIds = [0, 1, 2, 3].map(i => place('mic', 0, i * 150));
  const mix = place('mix', 500, 0);
  const keys = micIds.map(id => portKey(id, 'out-mic-audio-1'));
  const drop = (bundle: string[], targetPort: string, from = keys[0]) => {
    const ref = parseKey(from);
    return resolveBundleDrop(store.getState(), { bundle, from: { nodeId: ref.nodeId, handle: ref.portId, type: 'source' }, under: { nodeId: mix, handle: targetPort }, point: { x: 0, y: 0 }, zoom: 1 });
  };
  // 단자 위가 아니라 장비 몸체(믹서 헤더)에 놓는다
  const dropOnBody = (bundle: string[], from = keys[0]) => {
    const ref = parseKey(from);
    return resolveBundleDrop(store.getState(), { bundle, from: { nodeId: ref.nodeId, handle: ref.portId, type: 'source' }, under: null, point: { x: 600, y: 10 }, zoom: 1 });
  };
  return { store, place, micIds, mix, keys, drop, dropOnBody };
};
const pairsOf = (plan: ReturnType<typeof planBundle> | null | undefined) => (plan?.pairs ?? []).map(pair => `${pair.from.nodeId}>${pair.to.portId}`);

describe('port selection and bundles', () => {
  it('box selection picks ports whose dot centre is inside the rectangle', () => {
    const { store, mix, keys } = setup();
    const nodes = store.getState().diagram.nodes;
    // 마이크 출력 점은 x = 220 + 20, y = 78 + 150 × i. 위 두 개만 덮는다
    expect(portsInRect(nodes, { x: 230, y: 0, width: 20, height: 250 }).sort()).toEqual([keys[0], keys[1]].sort());
    expect(portsInRect(nodes, { x: 470, y: ROW1 - 5, width: 20, height: 40 })).toEqual([portKey(mix, 'in-mic-audio-1'), portKey(mix, 'in-mic-audio-2')]);
    store.getState().setBoxSelecting(true);
    store.getState().finishBoxSelection({ x: 230, y: 0, width: 20, height: 700 });
    expect(store.getState().selectedPorts.sort()).toEqual([...keys].sort());
  });

  it('a bundle needs a selected start port and keeps only the same kind, sorted top to bottom', () => {
    const { store, place, keys } = setup();
    const quad = place('quad', 1000, 0);
    const mixed = [keys[2], keys[0], portKey(quad, 'in-mic-audio-1'), portKey(quad, 'out-mic-audio-2'), keys[1]];
    const nodes = store.getState().diagram.nodes;
    // quad 출력 2는 y = 78 + 28. 마이크 0(y 78)과 마이크 1(y 228) 사이로 정렬된다
    expect(bundleFor(nodes, mixed, parseKey(keys[1]))).toEqual([keys[0], portKey(quad, 'out-mic-audio-2'), keys[1], keys[2]]);
    expect(bundleFor(nodes, mixed, parseKey(keys[3]))).toBeNull();
    expect(bundleFor(nodes, [keys[0]], parseKey(keys[0]))).toBeNull();
  });

  it('pairs the bundle from the dropped port downward in the same column', () => {
    const { drop, micIds, keys } = setup();
    expect(pairsOf(drop(keys, 'in-mic-audio-2').plan)).toEqual(micIds.map((id, i) => `${id}>in-mic-audio-${i + 2}`));
  });

  it('skips ports that are already connected and reports a shortage', () => {
    const { store, drop, micIds, mix, keys, place } = setup();
    const extra = place('mic', 0, 800);
    expect(store.getState().connect({ source: extra, sourceHandle: 'out-mic-audio-1', target: mix, targetHandle: 'in-mic-audio-3' })).toBe(true);
    const skipped = drop(keys, 'in-mic-audio-2').plan;
    expect(pairsOf(skipped)).toEqual([`${micIds[0]}>in-mic-audio-2`, `${micIds[1]}>in-mic-audio-4`, `${micIds[2]}>in-mic-audio-5`, `${micIds[3]}>in-mic-audio-6`]);
    const short = drop(keys, 'in-mic-audio-5').plan;
    expect(pairsOf(short)).toEqual([`${micIds[0]}>in-mic-audio-5`, `${micIds[1]}>in-mic-audio-6`]);
    expect(short?.unmatched.map(item => item.code)).toEqual(['no-slot', 'no-slot']);
  });

  it('does not use a slot for a bundle port that is itself occupied or on the target device', () => {
    const { store, drop, micIds, mix, keys } = setup();
    expect(store.getState().connect({ source: micIds[0], sourceHandle: 'out-mic-audio-1', target: mix, targetHandle: 'in-mic-audio-6' })).toBe(true);
    const plan = drop([...keys, portKey(mix, 'out-line-audio-1')], 'in-mic-audio-1', keys[1]).plan;
    // 마이크 0은 이미 연결돼 있어 빠지고 마이크 1이 1번 대상을 쓴다. 믹서 자신의 출력은 대상 장비 단자라 빠진다
    expect(plan?.unmatched.map(item => item.code)).toEqual(['port-occupied', 'self-loop']);
    expect(pairsOf(plan)).toEqual([`${micIds[1]}>in-mic-audio-1`, `${micIds[2]}>in-mic-audio-2`, `${micIds[3]}>in-mic-audio-3`]);
  });

  it('reports a shortage, not a signal mismatch, when the matching ports ran out above other-signal ports', () => {
    const { store, place, micIds, keys } = setup();
    const desk = place('desk', 500, 600);
    const plan = resolveBundleDrop(store.getState(), { bundle: keys.slice(0, 3), from: { nodeId: micIds[0], handle: 'out-mic-audio-1', type: 'source' }, under: { nodeId: desk, handle: 'in-mic-audio-1' }, point: { x: 0, y: 0 }, zoom: 1 }).plan;
    expect(pairsOf(plan)).toEqual([`${micIds[0]}>in-mic-audio-1`, `${micIds[1]}>in-mic-audio-2`]);
    // 셋째 마이크 아래에는 라인 입력만 남았다. 이유는 신호 불일치가 아니라 남은 단자 부족이다
    expect(plan?.unmatched.map(item => item.code)).toEqual(['no-slot']);
  });

  it('a member with a different signal does not use up the slots of the others', () => {
    const { drop, place, micIds, keys } = setup();
    const line = place('line', 0, 1000);
    // 마이크 0, 라인 출력, 마이크 1·2. 라인은 마이크 입력과 맞지 않아(레벨 짝 없음) 빠지고 나머지는 차례로 잇는다
    const bundle = [keys[0], portKey(line, 'out-line-audio-1'), keys[1], keys[2]];
    const plan = drop(bundle, 'in-mic-audio-1').plan;
    expect(pairsOf(plan)).toEqual([`${micIds[0]}>in-mic-audio-1`, `${micIds[1]}>in-mic-audio-2`, `${micIds[2]}>in-mic-audio-3`]);
    expect(plan?.unmatched).toEqual([{ from: { nodeId: line, portId: 'out-line-audio-1' }, code: 'signal-mismatch' }]);
  });

  it('dragging an already connected member onto a device body still connects the rest', () => {
    const { store, dropOnBody, micIds, mix, keys } = setup();
    expect(store.getState().connect({ source: micIds[0], sourceHandle: 'out-mic-audio-1', target: mix, targetHandle: 'in-mic-audio-6' })).toBe(true);
    const result = dropOnBody(keys, keys[0]);
    expect(result.target).toEqual({ nodeId: mix, portId: 'in-mic-audio-1' });
    expect(result.plan?.unmatched.map(item => item.code)).toEqual(['port-occupied']);
    expect(pairsOf(result.plan)).toEqual([`${micIds[1]}>in-mic-audio-1`, `${micIds[2]}>in-mic-audio-2`, `${micIds[3]}>in-mic-audio-3`]);
  });

  it('an input-side bundle connects each input to the next output, stored output → input', () => {
    const { store, place, mix } = setup();
    const quad = place('quad', 1000, 0);
    const inputs = [1, 2, 3].map(i => portKey(mix, `in-mic-audio-${i}`));
    const from = { nodeId: mix, handle: 'in-mic-audio-1', type: 'target' as const };
    const drop = resolveBundleDrop(store.getState(), { bundle: inputs, from, under: { nodeId: quad, handle: 'out-mic-audio-2' }, point: { x: 0, y: 0 }, zoom: 1 });
    expect(pairsOf(drop.plan)).toEqual([`${mix}>out-mic-audio-2`, `${mix}>out-mic-audio-3`, `${mix}>out-mic-audio-4`]);
    // Canvas와 같이 받는 쪽에서 시작했으면 대상을 source로 넘긴다
    const result = store.getState().connectMany(drop.plan!.pairs.map(pair => ({ source: pair.to.nodeId, sourceHandle: pair.toHandle, target: pair.from.nodeId, targetHandle: pair.fromHandle })));
    expect(result.connected).toBe(3);
    expect(store.getState().diagram.edges.map(edge => `${edge.sourceHandle}>${edge.targetHandle}`).sort()).toEqual(['out-mic-audio-2>in-mic-audio-1', 'out-mic-audio-3>in-mic-audio-2', 'out-mic-audio-4>in-mic-audio-3']);
  });

  it('connects a whole bundle in one undo step', () => {
    const { store, drop, keys } = setup();
    const plan = drop(keys, 'in-mic-audio-1').plan!;
    const before = store.getState().past.length;
    const result = store.getState().connectMany(plan.pairs.map(pair => ({ source: pair.from.nodeId, sourceHandle: pair.fromHandle, target: pair.to.nodeId, targetHandle: pair.toHandle })));
    expect(result).toEqual({ connected: 4, failed: [] });
    expect(store.getState().past.length).toBe(before + 1);
    expect(store.getState().diagram.edges).toHaveLength(4);
    store.getState().undo();
    expect(store.getState().diagram.edges).toHaveLength(0);
  });

  it('port selection stays out of the saved file and history', () => {
    const { store, keys } = setup();
    const text = store.getState().exportText();
    const past = store.getState().past.length;
    store.getState().selectPorts(keys);
    store.getState().togglePort(keys[0]);
    expect(store.getState().selectedPorts).toEqual(keys.slice(1));
    expect(store.getState().exportText()).toBe(text);
    expect(store.getState().past.length).toBe(past);
  });

  it('keeps a per-device index of picked ports and clears the picks when a device drag starts', () => {
    const { store, micIds, mix, keys } = setup();
    store.getState().selectPorts([keys[0], keys[1], portKey(mix, 'in-mic-audio-2'), portKey(mix, 'in-mic-audio-4')]);
    expect(store.getState().selectedPortsByNode).toEqual({ [micIds[0]]: 'out-mic-audio-1', [micIds[1]]: 'out-mic-audio-1', [mix]: 'in-mic-audio-2\nin-mic-audio-4' });
    store.getState().togglePort(portKey(mix, 'in-mic-audio-2'));
    expect(store.getState().selectedPortsByNode[mix]).toBe('in-mic-audio-4');
    // 장비를 끌기 시작하면(범위 선택 뒤 옮기기) 단자 선택을 푼다
    store.getState().onNodesChange([{ type: 'position', id: mix, position: { x: 510, y: 0 }, dragging: true }]);
    expect(store.getState().selectedPorts).toEqual([]);
    expect(store.getState().selectedPortsByNode).toEqual({});
  });
});
