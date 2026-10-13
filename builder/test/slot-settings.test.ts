// 장비 설정 창 슬롯 탭의 상태 동작(B-20261013-04): 단자 탭·슬롯 탭을 함께 바꿔도 연결 확인은 한 번에, 적용 한 번 = 실행 취소 한 단계, 견적 수량.
import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, validateDiagram, type Equipment, type Library, type Port, type PortLists } from '../src/engine';
import { createBuilderStore, type EquipmentSettings } from '../src/state/store';

const port = (id: string, direction: Port['direction']): Port => ({ id, label: id, type: 'video', direction, connector: 'HDMI', signals: ['HDMI'], verification: 'FOUND' });
const equipment = (id: string, ports: Port[]): Equipment => ({
  id, category: 'video', name: 'Device', model: id.toUpperCase(), manufacturer: 'Test',
  inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: '' },
});
const product = (item: Equipment, extra: Record<string, unknown> = {}) => ({ productId: item.id, source: 'portal', brand: 'Test', product: item.model, categories: ['시험', 'Video', 'Device'], detailUrl: '', placeable: true, units: [{ unitId: item.id, equipment: item, ...extra }], readiness: { ioRows: 1, ports: 1, unresolvedRows: 0, nonPortRows: 0 } });
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.1.0',
  source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })),
  vocabulary: { signals: [{ id: 'HDMI', label: 'HDMI', lineType: 'video' }], connectors: ['HDMI', 'UNKNOWN'], connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: [
    product(equipment('frame', [port('out-hdmi-1', 'out')]), { slots: { input: 2, output: 0, shared: 0, source: 'D', verification: 'FOUND', list: [{ id: 'IN1', slotType: 'input' }, { id: 'IN2', slotType: 'input' }], compatibleCards: ['card-a', 'card-b'] } }),
    product(equipment('card-a', [port('in-hdmi-1', 'in'), port('in-hdmi-2', 'in')]), { card: { slotType: 'input', compatibleFrames: ['frame'] } }),
    product(equipment('card-b', [port('in-hdmi-1', 'in')]), { card: { slotType: 'input', compatibleFrames: ['frame'] } }),
    product(equipment('cam', [port('out-hdmi-1', 'out'), port('out-hdmi-2', 'out')])),
    product(equipment('disp', [port('in-hdmi-1', 'in')])),
  ],
} as unknown as Library;

function setup() {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed: 4, now: 0 }) });
  store.getState().setLibrary(index);
  const frame = store.getState().addEquipment(index.units.get('frame')!.equipment, { x: 400, y: 0 });
  const cam = store.getState().addEquipment(index.units.get('cam')!.equipment, { x: 0, y: 0 });
  const disp = store.getState().addEquipment(index.units.get('disp')!.equipment, { x: 800, y: 0 });
  return { store, index, frame, cam, disp };
}
type Store = ReturnType<typeof setup>['store'];
const dataOf = (store: Store, id: string) => store.getState().diagram.nodes.find(n => n.id === id)!.data as unknown as Equipment & Record<string, unknown>;
const settings = (data: Equipment & Record<string, unknown>, patch: Partial<EquipmentSettings> = {}): EquipmentSettings => ({
  isReused: Boolean(data.isReused), systemName: String(data.systemName ?? ''), ports: null, quantities: { ...(data.selectedOptionQuantities as Record<string, number> ?? {}) }, ...patch,
});
const listsOf = (data: Equipment): PortLists => ({
  inputs: data.inputs.map(({ id, label, connector, signals }) => ({ id, label, connector, signals })),
  outputs: data.outputs.map(({ id, label, connector, signals }) => ({ id, label, connector, signals })),
  bidirectional: data.bidirectional.map(({ id, label, connector, signals }) => ({ id, label, connector, signals })),
});
const connect = (store: Store, source: string, sourceHandle: string, target: string, targetHandle: string) => expect(store.getState().connect({ source, sourceHandle, target, targetHandle })).toBe(true);

describe('slot settings', () => {
  it('mounting cards is one undo step and adds quote items', () => {
    const { store, frame } = setup();
    const before = store.getState().past.length;
    const result = store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { slots: { IN1: 'card-a', IN2: 'card-a' } }));
    expect(result).toMatchObject({ ok: true, changed: true });
    expect(store.getState().past.length).toBe(before + 1);
    const data = dataOf(store, frame);
    expect(data.slotAssignments).toEqual({ IN1: 'card-a', IN2: 'card-a' });
    expect(data.selectedOptionQuantities).toEqual({ 'portal-option:card-a': 2 });
    expect(data.inputs.map(p => p.label)).toEqual(['IN1 in-hdmi-1', 'IN1 in-hdmi-2', 'IN2 in-hdmi-1', 'IN2 in-hdmi-2']);
    expect(store.getState().diagram.options).toEqual([{ id: 'portal-option:card-a', model: 'CARD-A', name: 'CARD-A', manufacturer: 'Test' }]);
    store.getState().undo();
    expect(dataOf(store, frame).slotAssignments).toBeUndefined();
  });

  it('asks once for edges hit by both the ports tab and the slots tab, then removes only those', () => {
    const { store, frame, cam, disp } = setup();
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { slots: { IN1: 'card-a', IN2: 'card-b' } }));
    connect(store, cam, 'out-hdmi-1', frame, 'opt-card-a-IN1-in-hdmi-1');
    connect(store, cam, 'out-hdmi-2', frame, 'opt-card-b-IN2-in-hdmi-1');
    connect(store, frame, 'out-hdmi-1', disp, 'in-hdmi-1');
    const edges = store.getState().diagram.edges.map(edge => edge.id);
    // 단자 탭: 프레임 출력 삭제. 슬롯 탭: IN2 카드 바꾸기
    const data = dataOf(store, frame);
    const lists = listsOf(data);
    lists.outputs = [];
    const draft = settings(data, { ports: lists, slots: { IN1: 'card-a', IN2: 'card-a' } });
    const asked = store.getState().applyEquipmentSettings(frame, draft);
    expect(asked.code).toBe('edges-affected');
    expect(asked.removedEdgeIds.sort()).toEqual([edges[1], edges[2]].sort());
    expect(store.getState().diagram.edges.map(edge => edge.id)).toEqual(edges);
    expect(dataOf(store, frame).slotAssignments).toEqual({ IN1: 'card-a', IN2: 'card-b' });
    const done = store.getState().applyEquipmentSettings(frame, draft, { removeEdges: true });
    expect(done).toMatchObject({ ok: true, changed: true });
    expect(store.getState().diagram.edges.map(edge => edge.id)).toEqual([edges[0]]);
    expect(dataOf(store, frame).selectedOptionQuantities).toEqual({ 'portal-option:card-a': 2 });
    expect(validateDiagram(JSON.parse(store.getState().exportText()), { library: store.getState().library }).errors).toEqual([]);
  });

  it('quote quantities never drop below mounted cards and spare cards are kept', () => {
    const { store, frame } = setup();
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { slots: { IN1: 'card-a' } }));
    // 견적 옵션 탭에서 예비 1장을 더한다
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { quantities: { 'portal-option:card-a': 2 } }));
    expect(dataOf(store, frame).selectedOptionQuantities).toEqual({ 'portal-option:card-a': 2 });
    // 장착 수 밑으로 줄이면 장착 수로 맞춘다
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { quantities: { 'portal-option:card-a': 0 } }));
    expect(dataOf(store, frame).selectedOptionQuantities).toEqual({ 'portal-option:card-a': 1 });
    // 견적에서 예비를 다시 넣고 카드를 빼면 예비만 남는다
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { quantities: { 'portal-option:card-a': 3 }, slots: {} }));
    expect(dataOf(store, frame).selectedOptionQuantities).toEqual({ 'portal-option:card-a': 2 });
    expect(dataOf(store, frame).slotAssignments).toBeUndefined();
  });

  it('reset to library keeps mounted cards', () => {
    const { store, frame } = setup();
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { slots: { IN1: 'card-b' } }));
    const lists = listsOf(dataOf(store, frame));
    lists.inputs[0].label = '고친 이름';
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { ports: lists }));
    expect(dataOf(store, frame).portsEdited).toBe(true);
    store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { resetPorts: true }));
    const data = dataOf(store, frame);
    expect(data.portsEdited).toBeUndefined();
    expect(data.inputs.map(p => p.label)).toEqual(['IN1 in-hdmi-1']);
    expect(data.slotAssignments).toEqual({ IN1: 'card-b' });
  });

  it('refuses incompatible cards without recording history', () => {
    const { store, frame } = setup();
    const before = store.getState().past.length;
    expect(store.getState().applyEquipmentSettings(frame, settings(dataOf(store, frame), { slots: { IN1: 'cam' } })).code).toBe('card-incompatible');
    expect(store.getState().past.length).toBe(before);
  });
});
