// 빌더 전용 일반 장비(PC·노트북, B-20261016-02)
import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, buildIoRequest, computeIssues, createIdFactory, createLibraryIndex, type Equipment, type Library } from '../src/engine';
import { filterProducts, groupProducts } from '../src/components/LibraryPanel';
import { createBuilderStore } from '../src/state/store';

const hdmiIn = { id: 'in-hdmi-1', label: 'HDMI In 1', type: 'video', direction: 'in', connector: 'HDMI', signals: ['HDMI'], verification: 'FOUND' } as const;
const dpIn = { id: 'in-dp-1', label: 'DP In 1', type: 'lt-1784014150344', direction: 'in', connector: 'DP', signals: ['DP'], verification: 'FOUND' } as const;
const library = {
  schema: 'av-portal.builder-library', schemaVersion: '1.0.0', source: { catalogSha: 'c', detailSetSha: 'd', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })), vocabulary: { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: [{ productId: 'tv', source: 'portal', brand: 'T', product: 'TV', categories: ['x', 'Display', 'D'], detailUrl: '', placeable: true,
    units: [{ unitId: 'tv', equipment: { id: 'tv', category: 'display', name: 'D', model: 'TV', manufacturer: 'T', inputs: [hdmiIn, dpIn], outputs: [], bidirectional: [], portal: { productId: 'tv', source: 'portal', detailUrl: '' } } as unknown as Equipment }],
    readiness: { ioRows: 2, ports: 2, unresolvedRows: 0, nonPortRows: 0 } }],
} as unknown as Library;

describe('빌더 전용 일반 장비', () => {
  it('라이브러리에 PC·노트북이 HDMI·DP 두 가지로 붙고 원본 객체는 그대로다', () => {
    const index = createLibraryIndex(library);
    expect([...index.units.keys()]).toEqual(['tv', 'generic-pc:hdmi', 'generic-pc:dp', 'generic-laptop:hdmi', 'generic-laptop:dp']);
    expect(library.products).toHaveLength(1);
    const pc = index.units.get('generic-pc:dp')!.equipment;
    expect(pc.model).toBe('PC (DP)');
    expect(pc.outputs.map(p => [p.connector, p.type])).toEqual([['DP', 'lt-1784014150344']]);
    expect(pc.portal).toEqual({ productId: 'generic-pc', source: 'builder', detailUrl: '' });
    expect(pc.outputs[0]!.verification).toBe('GENERIC');
  });

  it('장비 목록에서 "소스 기기" 묶음으로 보이고 검색된다', () => {
    const index = createLibraryIndex(library);
    const groups = groupProducts(filterProducts(index.library.products, ''));
    expect(groups.find(([key]) => key === '소스 기기')?.[1].map(p => p.product).sort()).toEqual(['PC', '노트북'].sort());
    expect(filterProducts(index.library.products, '노트북').map(p => p.productId)).toEqual(['generic-laptop']);
  });

  it('구성도에 놓고 HDMI·DP 출력을 디스플레이 입력에 연결하며, 라이브러리 이슈가 없다', () => {
    const index = createLibraryIndex(library);
    const store = createBuilderStore({ ids: createIdFactory({ seed: 1, now: 0 }) });
    store.getState().setLibrary(index);
    const pc = store.getState().addEquipment(index.units.get('generic-pc:hdmi')!.equipment, { x: 0, y: 0 });
    const laptop = store.getState().addEquipment(index.units.get('generic-laptop:dp')!.equipment, { x: 0, y: 200 });
    const tv = store.getState().addEquipment(index.units.get('tv')!.equipment, { x: 400, y: 0 });
    expect(store.getState().connect({ source: pc, sourceHandle: 'out-hdmi-1', target: tv, targetHandle: 'in-hdmi-1' })).toBe(true);
    expect(store.getState().connect({ source: laptop, sourceHandle: 'out-dp-1', target: tv, targetHandle: 'in-dp-1' })).toBe(true);
    const issues = computeIssues(store.getState().diagram, { library: index });
    expect(issues.filter(issue => issue.severity === 'warning')).toEqual([]);
    expect(issues.filter(issue => ['product-removed', 'library-drift', 'no-ports', 'series-config-pending', 'unverified-port'].includes(issue.code))).toEqual([]);
  });

  it('Portal 반영 요청을 만들지 않는다', () => {
    const index = createLibraryIndex(library);
    const equipment = index.units.get('generic-pc:hdmi')!.equipment;
    const result = buildIoRequest({ lists: { inputs: [], outputs: equipment.outputs, bidirectional: [] }, data: equipment, libraryEquipment: equipment, librarySource: library.source });
    expect(result).toMatchObject({ ok: false, code: 'generic-equipment' });
  });
});
