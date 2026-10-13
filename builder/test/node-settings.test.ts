// 장비 설정 창의 상태 동작(B-20261013-01): 한 번 적용 = 실행 취소 한 단계, 연결 확인, 견적 정보, 되돌리기.
import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, createIdFactory, createLibraryIndex, validateDiagram, type Equipment, type Library, type Port, type PortLists } from '../src/engine';
import { diagramSvg } from '../src/export/diagramSvg';
import { createBuilderStore, type EquipmentSettings } from '../src/state/store';

const port = (id: string, direction: Port['direction'], connector: string, signals: string[], type: string): Port => ({ id, label: id, type, direction, connector, signals, verification: 'FOUND' });
const equipment = (id: string, ports: Port[]): Equipment => ({
  id, category: 'video', name: 'Device', model: id.toUpperCase(), manufacturer: 'Test',
  inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: '' },
});
const units = [
  equipment('cam', [port('out-hdmi-1', 'out', 'HDMI', ['HDMI'], 'video'), port('out-hdmi-2', 'out', 'HDMI', ['HDMI'], 'video')]),
  equipment('disp', [port('in-hdmi-1', 'in', 'HDMI', ['HDMI'], 'video')]),
];
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0',
  source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })),
  vocabulary: {
    signals: [{ id: 'HDMI', label: 'HDMI', lineType: 'video' }, { id: 'SDI', label: 'SDI', lineType: 'sdi' }],
    connectors: ['HDMI', 'BNC', 'UNKNOWN'], connectorWildcards: {}, connectorEquivalents: [], levelPairs: [],
  },
  products: units.map(item => ({ productId: item.id, source: 'portal', brand: 'Test', product: item.model, categories: ['시험', 'Video', 'Device'], detailUrl: '', placeable: true, units: [{ unitId: item.id, equipment: item }], readiness: { ioRows: 1, ports: 1, unresolvedRows: 0, nonPortRows: 0 } })),
} as unknown as Library;

function setup() {
  const index = createLibraryIndex(library);
  const store = createBuilderStore({ ids: createIdFactory({ seed: 9, now: 0 }) });
  store.getState().setLibrary(index);
  const cam = store.getState().addEquipment(index.units.get('cam')!.equipment, { x: 0, y: 0 });
  const disp = store.getState().addEquipment(index.units.get('disp')!.equipment, { x: 400, y: 0 });
  return { store, index, cam, disp };
}
const dataOf = (store: ReturnType<typeof setup>['store'], id: string) => store.getState().diagram.nodes.find(n => n.id === id)!.data as unknown as Equipment & Record<string, unknown>;
const listsOf = (data: Equipment): PortLists => ({
  inputs: data.inputs.map(({ id, label, connector, signals }) => ({ id, label, connector, signals })),
  outputs: data.outputs.map(({ id, label, connector, signals }) => ({ id, label, connector, signals })),
  bidirectional: data.bidirectional.map(({ id, label, connector, signals }) => ({ id, label, connector, signals })),
});
const settings = (data: Equipment & Record<string, unknown>, patch: Partial<EquipmentSettings> = {}): EquipmentSettings => ({
  isReused: Boolean(data.isReused), systemName: String(data.systemName ?? ''), ports: null, quantities: { ...(data.selectedOptionQuantities as Record<string, number> ?? {}) }, ...patch,
});

describe('equipment settings', () => {
  it('opens only for equipment and closes on undo', () => {
    const { store, disp } = setup();
    store.getState().openNodeSettings('nope');
    expect(store.getState().settingsNodeId).toBeNull();
    store.getState().openNodeSettings(disp);
    expect(store.getState().settingsNodeId).toBe(disp);
    store.getState().undo();
    expect(store.getState().settingsNodeId).toBeNull();
  });

  it('applying unchanged values records nothing', () => {
    const { store, disp } = setup();
    const before = store.getState().past.length;
    const result = store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { ports: listsOf(dataOf(store, disp)) }));
    expect([result.ok, result.changed]).toEqual([true, false]);
    expect(store.getState().past.length).toBe(before);
  });

  it('adds ports, connects to them, and deletes them only after confirmation, in one undo step each', () => {
    const { store, cam, disp } = setup();
    const lists = listsOf(dataOf(store, disp));
    lists.inputs.push({ label: 'HDMI In 2', connector: 'HDMI', signals: ['HDMI'] }, { label: 'HDMI In 3', connector: 'HDMI', signals: ['HDMI'] });
    const before = store.getState().past.length;
    expect(store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { ports: lists })).ok).toBe(true);
    expect(store.getState().past.length).toBe(before + 1);
    expect(dataOf(store, disp).inputs.map(p => [p.id, p.origin])).toEqual([['in-hdmi-1', undefined], ['in-user-1', 'user'], ['in-user-2', 'user']]);
    expect(store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-1', target: disp, targetHandle: 'in-user-1' })).toBe(true);
    expect(store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-2', target: disp, targetHandle: 'in-user-2' })).toBe(true);
    // in-user-1 삭제: 확인 없이는 아무것도 바뀌지 않는다
    const without = listsOf(dataOf(store, disp));
    without.inputs = without.inputs.filter(p => p.id !== 'in-user-1');
    const snapshot = store.getState().exportText();
    const history = store.getState().past.length;
    const refused = store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { ports: without }));
    expect([refused.ok, refused.code, refused.removedEdgeIds.length]).toEqual([false, 'edges-affected', 1]);
    expect(store.getState().exportText()).toBe(snapshot);
    expect(store.getState().past.length).toBe(history);
    const done = store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { ports: without }), { removeEdges: true });
    expect([done.ok, done.removedEdgeIds.length]).toEqual([true, 1]);
    expect(store.getState().past.length).toBe(history + 1);
    const saved = JSON.parse(store.getState().exportText());
    expect(saved.edges.map((e: { targetHandle: string }) => e.targetHandle)).toEqual(['in-user-2']);
    expect(validateDiagram(saved, { library: store.getState().library }).errors).toEqual([]);
    expect(saved.issues.filter((i: { target: { node?: string } }) => i.target.node).map((i: { code: string }) => i.code)).toEqual(['ports-edited']);
    // 실행 취소 한 번이면 단자와 연결이 함께 돌아온다
    store.getState().undo();
    expect(store.getState().exportText()).toBe(snapshot);
  });

  it('keeps quote fields without a library-drift issue', () => {
    const { store, cam, index } = setup();
    const result = store.getState().applyEquipmentSettings(cam, settings(dataOf(store, cam), { systemName: ' 회의실 A ', isReused: true, quantities: { 'portal-option:disp': 2 }, optionProductIds: ['disp'] }));
    expect(result.ok).toBe(true);
    const data = dataOf(store, cam);
    expect([data.systemName, data.isReused, data.selectedOptionQuantities]).toEqual(['회의실 A', true, { 'portal-option:disp': 2 }]);
    expect(store.getState().diagram.options).toEqual([{ id: 'portal-option:disp', model: 'DISP', name: 'DISP', manufacturer: 'Test' }]);
    const saved = JSON.parse(store.getState().exportText());
    expect(validateDiagram(saved, { library: index }).issues.filter(i => i.target.node)).toEqual([]);
    // 정의 없는 옵션·음수는 거절한다
    expect(store.getState().applyEquipmentSettings(cam, settings(dataOf(store, cam), { quantities: { nope: 1 } })).code).toBe('quote-invalid');
    expect(store.getState().applyEquipmentSettings(cam, settings(dataOf(store, cam), { quantities: { 'portal-option:disp': -1 } })).code).toBe('quote-invalid');
  });

  it('the drawing marks user-added ports like the screen does', () => {
    const { store, disp } = setup();
    const lists = listsOf(dataOf(store, disp));
    lists.inputs.push({ label: 'SDI In 1', connector: 'BNC', signals: ['SDI'] });
    store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { ports: lists }));
    const { svg } = diagramSvg(store.getState().diagram, { lineTypes: DEFAULT_RULES.lineTypes });
    expect(svg).toContain('>추가<');
    expect(svg).not.toContain('>확인<');
  });

  it('reset to library clears every mark and asks before dropping connections', () => {
    const { store, cam, disp, index } = setup();
    const lists = listsOf(dataOf(store, disp));
    lists.inputs[0] = { ...lists.inputs[0], label: '바뀐 이름' };
    lists.inputs.push({ label: 'HDMI In 2', connector: 'HDMI', signals: ['HDMI'] });
    store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { ports: lists }));
    store.getState().connect({ source: cam, sourceHandle: 'out-hdmi-1', target: disp, targetHandle: 'in-user-1' });
    expect(store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { resetPorts: true })).code).toBe('edges-affected');
    expect(store.getState().applyEquipmentSettings(disp, settings(dataOf(store, disp), { resetPorts: true }), { removeEdges: true }).ok).toBe(true);
    const data = dataOf(store, disp);
    expect('portsEdited' in data).toBe(false);
    expect(data.inputs).toEqual(index.units.get('disp')!.equipment.inputs);
    expect(store.getState().diagram.edges).toEqual([]);
  });
});
