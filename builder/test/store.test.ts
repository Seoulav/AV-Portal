import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, validateDiagram, type BomRow, type Equipment, type Library, type Port } from '../src/engine';
import { AUTOSAVE_KEY, REJECTED_KEY, loadSaved, startAutosave, type StorageLike } from '../src/state/autosave';
import { HISTORY_LIMIT, PLACE_STEP, createBuilderStore, freePosition } from '../src/state/store';
import { cableProblem } from '../src/components/EdgePanel';
import { filterProducts, groupProducts } from '../src/components/LibraryPanel';

// 합성 라이브러리(현재 Portal 데이터와 무관)
const port = (id: string, direction: Port['direction'], connector: string, signals: string[], type: string): Port => ({ id, label: id, type, direction, connector, signals, verification: 'FOUND', portalIo: { group: 'G', connector, signal: signals[0] } });
const equipment = (id: string, ports: Port[], category = 'video'): Equipment => ({
  id, category, name: 'Converter', model: id.toUpperCase(), manufacturer: 'Test', description: '시험용',
  inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: `https://example.invalid/${id}` },
});
const library: Library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0',
  source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })),
  products: [
    ['cam', [port('out-hdmi-1', 'out', 'HDMI', ['HDMI'], 'video'), port('both-ethernet-1', 'both', 'RJ45', ['ETHERNET'], 'network')], 'Video', 'Camera'],
    ['disp', [port('in-hdmi-1', 'in', 'HDMI', ['HDMI'], 'video'), port('both-ethernet-1', 'both', 'RJ45', ['ETHERNET'], 'network')], 'Display', 'Projector'],
    ['amp', [port('in-power-1', 'in', 'IEC', ['POWER'], 'power'), port('out-power-1', 'out', 'IEC', ['POWER'], 'power')], 'Audio', 'Amplifier'],
  ].map(([id, ports, level2, level3]) => ({
    productId: id as string, source: 'portal' as const, brand: 'Test', product: (id as string).toUpperCase(), categories: ['영상', level2 as string, level3 as string],
    detailUrl: '', placeable: true, units: [{ unitId: id as string, equipment: equipment(id as string, ports as Port[]) }],
    readiness: { ioRows: 1, ports: (ports as Port[]).length, unresolvedRows: 0, nonPortRows: 0 },
  })),
} as unknown as Library;
(library as unknown as { vocabulary: unknown }).vocabulary = { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [['LINE-AUDIO', 'MIC-AUDIO']] };

const setup = () => {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed: 5, now: 0 }) });
  store.getState().setLibrary(index);
  const unit = (id: string) => index.units.get(id)!.equipment;
  return { store, index, unit };
};
const memoryStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } };
};

describe('store', () => {
  it('places equipment and connects through the engine rules', () => {
    const { store, unit } = setup();
    const cam = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const disp = store.getState().addEquipment(unit('disp'), { x: 400, y: 0 });
    // 입력 쪽에서 끌어도 엔진이 방향을 바로잡는다
    const connection = { source: disp, sourceHandle: 'in-hdmi-1', target: cam, targetHandle: 'out-hdmi-1' };
    expect(store.getState().canConnect(connection)).toBe(true);
    expect(store.getState().connect(connection)).toBe(true);
    const edge = store.getState().diagram.edges[0];
    expect([edge.source, edge.sourceHandle, edge.target, edge.targetHandle]).toEqual([cam, 'out-hdmi-1', disp, 'in-hdmi-1']);
    // 같은 단자 두 번째 연결은 막히고 이유가 나온다
    expect(store.getState().canConnect(connection)).toBe(false);
    expect(store.getState().connect(connection)).toBe(false);
    expect(store.getState().notice?.text).toContain('이미 연결된 단자');
    // 양방향 단자는 source_/target_ 핸들
    expect(store.getState().connect({ source: cam, sourceHandle: 'source_both-ethernet-1', target: disp, targetHandle: 'target_both-ethernet-1' })).toBe(true);
  });

  it('blocks power and direction errors with readable reasons', () => {
    const { store, unit } = setup();
    const a = store.getState().addEquipment(unit('amp'), { x: 0, y: 0 });
    const b = store.getState().addEquipment(unit('amp'), { x: 300, y: 0 });
    expect(store.getState().connect({ source: a, sourceHandle: 'out-power-1', target: b, targetHandle: 'in-power-1' })).toBe(false);
    expect(store.getState().notice?.text).toContain('전원선');
    const c = store.getState().addEquipment(unit('cam'), { x: 0, y: 300 });
    const d = store.getState().addEquipment(unit('cam'), { x: 300, y: 300 });
    expect(store.getState().connect({ source: c, sourceHandle: 'out-hdmi-1', target: d, targetHandle: 'out-hdmi-1' })).toBe(false);
    expect(store.getState().notice?.text).toContain('같은 방향');
  });

  it('undoes and redoes structural changes, capped at the history limit', () => {
    const { store, unit } = setup();
    const cam = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const disp = store.getState().addEquipment(unit('disp'), { x: 400, y: 0 });
    store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-1', target: disp, targetHandle: 'in-hdmi-1' });
    store.getState().undo();
    expect(store.getState().diagram.edges).toHaveLength(0);
    store.getState().undo();
    expect(store.getState().diagram.nodes).toHaveLength(1);
    store.getState().redo();
    store.getState().redo();
    expect(store.getState().diagram.edges).toHaveLength(1);
    for (let i = 0; i < HISTORY_LIMIT + 10; i += 1) store.getState().addAnnotation({ x: i, y: 0 });
    expect(store.getState().past).toHaveLength(HISTORY_LIMIT);
    // 드래그는 시작할 때 한 번만 기록한다
    const before = store.getState().past.length;
    store.getState().onNodesChange([{ type: 'position', id: cam, position: { x: 10, y: 0 }, dragging: true }]);
    store.getState().onNodesChange([{ type: 'position', id: cam, position: { x: 20, y: 0 }, dragging: true }]);
    store.getState().onNodesChange([{ type: 'position', id: cam, position: { x: 30, y: 0 }, dragging: false }]);
    expect(store.getState().past.length).toBe(Math.min(before + 1, HISTORY_LIMIT));
  });

  it('exports 1.2 that validates and re-imports to the same file', () => {
    const { store, unit, index } = setup();
    const cam = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const disp = store.getState().addEquipment(unit('disp'), { x: 400, y: 0 });
    store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-1', target: disp, targetHandle: 'in-hdmi-1' });
    const edgeId = store.getState().diagram.edges[0].id;
    store.getState().updateEdge(edgeId, { label: '메인 영상', rows: [{ cableType: 'ready-made', productName: 'HDMI 3m', lineTypeId: 'video', quantity: 1 }] });
    store.getState().addShape({ x: -50, y: -50 });
    const text = store.getState().exportText();
    expect(validateDiagram(JSON.parse(text), { library: index }).errors).toEqual([]);
    const other = setup().store;
    expect(other.getState().importText(text)).toEqual({ ok: true, errors: [] });
    expect(other.getState().exportText()).toBe(text);
    expect(other.getState().importText('{"version":"1.1"}').ok).toBe(false);
    expect(other.getState().importText('not json').errors[0].code).toBe('json');
  });

  it('saves label and cable as one step, and an unchanged save keeps redo', () => {
    const { store, unit } = setup();
    const cam = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const disp = store.getState().addEquipment(unit('disp'), { x: 400, y: 0 });
    store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-1', target: disp, targetHandle: 'in-hdmi-1' });
    const edgeId = store.getState().diagram.edges[0].id;
    const before = store.getState().past.length;
    const rows = [{ cableType: 'ready-made' as const, productName: 'HDMI 3m', lineTypeId: 'video', quantity: 2 }];
    store.getState().updateEdge(edgeId, { label: '메인', rows });
    expect(store.getState().past.length).toBe(before + 1);
    expect(store.getState().diagram.edges[0].data).toMatchObject({ label: '메인', bomRows: rows });
    store.getState().addAnnotation({ x: 0, y: 300 });
    store.getState().undo();
    expect(store.getState().future).toHaveLength(1);
    store.getState().updateEdge(edgeId, { label: '메인', rows });
    expect(store.getState().future).toHaveLength(1);
    store.getState().undo();
    expect(store.getState().diagram.edges[0].data.label).toBeUndefined();
  });

  it('edits note labels only, and keeps edge selection in one place', () => {
    const { store, unit } = setup();
    const cam = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const disp = store.getState().addEquipment(unit('disp'), { x: 400, y: 0 });
    store.getState().addAnnotation({ x: 0, y: 300 });
    const note = store.getState().diagram.nodes.find(node => node.type === 'annotation')!.id;
    store.getState().setNodeLabel(note, '랙 앞');
    store.getState().setNodeLabel(cam, '바뀌면 안 됨');
    expect(store.getState().diagram.nodes.find(node => node.id === note)!.data.label).toBe('랙 앞');
    expect(store.getState().diagram.nodes.find(node => node.id === cam)!.data.label).toBeUndefined();
    store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-1', target: disp, targetHandle: 'in-hdmi-1' });
    const edgeId = store.getState().diagram.edges[0].id;
    store.getState().onEdgesChange([{ type: 'select', id: edgeId, selected: true }]);
    expect(store.getState().selectedEdgeId).toBe(edgeId);
    // 지우기는 onDelete → removeElements로만 한다. React Flow가 먼저 보내는 remove 변경은 무시한다
    store.getState().onEdgesChange([{ type: 'remove', id: edgeId }]);
    expect(store.getState().diagram.edges).toHaveLength(1);
    store.getState().removeElements([], [edgeId]);
    expect(store.getState().diagram.edges).toHaveLength(0);
    expect(store.getState().selectedEdgeId).toBeNull();
    store.getState().undo();
    expect(store.getState().diagram.edges).toHaveLength(1);
  });

  it('offsets repeated placements so they do not stack', () => {
    const nodes = [{ position: { x: 100, y: 100 } }, { position: { x: 380, y: 110 } }];
    expect(freePosition(nodes, { x: 100, y: 100 })).toEqual({ x: 100 + 2 * PLACE_STEP, y: 100 });
    expect(freePosition(nodes, { x: 100, y: 300 })).toEqual({ x: 100, y: 300 });
  });

  it('deleting a connected node is one undo step, like React Flow sends it', () => {
    const { store, unit } = setup();
    const cam = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const disp = store.getState().addEquipment(unit('disp'), { x: 400, y: 0 });
    store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-1', target: disp, targetHandle: 'in-hdmi-1' });
    const edgeId = store.getState().diagram.edges[0].id;
    const before = store.getState().past.length;
    // React Flow deleteElements 순서: 엣지 remove → 노드 remove → onDelete
    store.getState().onEdgesChange([{ type: 'remove', id: edgeId }]);
    store.getState().onNodesChange([{ type: 'remove', id: disp }]);
    store.getState().removeElements([disp], [edgeId]);
    expect(store.getState().past.length).toBe(before + 1);
    expect(store.getState().diagram.nodes).toHaveLength(1);
    expect(store.getState().diagram.edges).toHaveLength(0);
    store.getState().undo();
    expect(store.getState().diagram.nodes).toHaveLength(2);
    expect(store.getState().diagram.edges).toHaveLength(1);
  });

  it('records arrow-key moves, not unmoved drag starts', () => {
    const { store, unit } = setup();
    const cam = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const before = store.getState().past.length;
    store.getState().onNodesChange([{ type: 'position', id: cam, position: { x: 0, y: 0 }, dragging: true }]);
    store.getState().onNodesChange([{ type: 'position', id: cam, position: { x: 0, y: 0 }, dragging: false }]);
    expect(store.getState().past.length).toBe(before);
    store.getState().onNodesChange([{ type: 'position', id: cam, position: { x: 5, y: 0 }, dragging: false }]);
    expect(store.getState().past.length).toBe(before + 1);
    store.getState().undo();
    expect(store.getState().diagram.nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it('undo of open restores the whole file, not just nodes and edges', () => {
    const { store, unit } = setup();
    store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const original = store.getState().exportText();
    const imported = JSON.parse(original);
    imported.generator.version = '9.9.9';
    imported.lineTypes = imported.lineTypes.slice(0, 7);
    expect(store.getState().importText(JSON.stringify(imported)).ok).toBe(true);
    store.getState().undo();
    expect(store.getState().exportText()).toBe(original);
  });

  it('explains why a dropped connection is blocked', () => {
    const { store, unit } = setup();
    const a = store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    const b = store.getState().addEquipment(unit('cam'), { x: 300, y: 0 });
    store.getState().explainBlocked({ source: a, sourceHandle: 'out-hdmi-1', target: b, targetHandle: 'out-hdmi-1' });
    expect(store.getState().notice?.text).toContain('같은 방향');
    store.getState().notify(null);
    store.getState().explainBlocked({ source: a, sourceHandle: 'source_both-ethernet-1', target: b, targetHandle: 'target_both-ethernet-1' });
    expect(store.getState().notice).toBeNull();
  });
});

describe('cable rows', () => {
  it('rejects rows the quote side cannot use', () => {
    const row = (patch: Partial<BomRow>): BomRow => ({ cableType: 'ready-made', productName: 'HDMI', lineTypeId: 'video', quantity: 1, ...patch });
    expect(cableProblem([row({})])).toBeNull();
    expect(cableProblem([row({ productName: '' })])).toContain('제품명');
    expect(cableProblem([row({ quantity: 0 })])).toContain('수량');
    expect(cableProblem([row({ quantity: 2.5 })])).toContain('수량');
    expect(cableProblem([row({ quantity: undefined })])).toContain('수량');
    expect(cableProblem([row({ cableType: 'manufactured', quantity: undefined, length: 12.5 })])).toBeNull();
    expect(cableProblem([row({ cableType: 'manufactured', quantity: undefined })])).toContain('길이');
    expect(cableProblem([row({ cableType: 'manufactured', quantity: undefined, length: -3 })])).toContain('길이');
  });
});

describe('autosave', () => {
  it('saves after changes and loads only valid files', async () => {
    const { store, unit, index } = setup();
    const storage = memoryStorage();
    const stop = startAutosave(store, storage, 0);
    store.getState().addEquipment(unit('cam'), { x: 0, y: 0 });
    await new Promise(resolve => setTimeout(resolve, 5));
    stop();
    expect(storage.data.get(AUTOSAVE_KEY)).toContain('"version": "1.2"');
    expect(loadSaved(storage, index).diagram?.nodes).toHaveLength(1);
    // 불러오지 못한 저장본은 다음 자동 저장에 덮이기 전에 따로 보관한다
    const broken = '{"version":"1.2","nodes":"x","edges":[],"lineTypes":[],"equipmentDB":[]}';
    storage.setItem(AUTOSAVE_KEY, broken);
    expect(loadSaved(storage, index).error).toContain(REJECTED_KEY);
    expect(storage.data.get(REJECTED_KEY)).toBe(broken);
    storage.setItem(AUTOSAVE_KEY, 'not json');
    expect(loadSaved(storage, index).error).toContain('JSON');
    expect(storage.data.get(REJECTED_KEY)).toBe('not json');
    expect(loadSaved(memoryStorage(), index)).toEqual({});
  });
});

describe('library panel', () => {
  it('filters by every word and groups by category', () => {
    const products = library.products;
    expect(filterProducts(products, 'test proj').map(p => p.productId)).toEqual(['disp']);
    expect(filterProducts(products, '').length).toBe(3);
    expect(groupProducts(products).map(([key]) => key)).toEqual(['Audio', 'Display', 'Video']);
    const hidden = { ...products[0], placeable: false };
    expect(filterProducts([hidden], '')).toEqual([]);
  });
});
