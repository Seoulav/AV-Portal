// 브라우저 시험용 합성 라이브러리와 구성도. 실제 Portal 데이터가 바뀌어도 시험이 흔들리지 않게 한다.
import { DEFAULT_RULES, addEquipmentNode, createDiagram, createIdFactory, createLibraryIndex, serializeDiagram, type Library } from '../src/engine';

type Direction = 'in' | 'out' | 'both';
const port = (id: string, direction: Direction, signal: string, type: string) => ({
  id, label: id, type, direction, connector: signal === 'ETHERNET' ? 'RJ45' : signal, signals: [signal], verification: 'FOUND',
});
const UNITS: [string, string, ReturnType<typeof port>[]][] = [
  ['cam', 'Video', [port('out-hdmi-1', 'out', 'HDMI', 'video'), port('out-hdmi-2', 'out', 'HDMI', 'video'), port('both-ethernet-1', 'both', 'ETHERNET', 'network')]],
  ['disp', 'Display', [port('in-hdmi-1', 'in', 'HDMI', 'video'), port('in-hdmi-2', 'in', 'HDMI', 'video'), port('in-hdmi-3', 'in', 'HDMI', 'video'), port('both-ethernet-1', 'both', 'ETHERNET', 'network')]],
  ['ctl', 'Control', [port('in-rs-232-1', 'in', 'RS-232', 'control')]],
  ['mon', 'Display', [port('in-hdmi-1', 'in', 'HDMI', 'video')]],
];

export const library = {
  schema: 'av-portal.builder-library',
  schemaVersion: '1.0.0',
  source: { catalogSha: 'e2e', detailSetSha: 'e2e', rtcomSha: 'e2e', vocabularyVersion: '1.0.0' },
  lineTypes: DEFAULT_RULES.lineTypes.map(item => ({ ...item })),
  vocabulary: { connectorWildcards: {}, connectorEquivalents: [], levelPairs: [] },
  products: UNITS.map(([id, category, ports]) => ({
    productId: id, source: 'portal', brand: 'Test', product: id.toUpperCase(), categories: ['시험', category, 'Device'], detailUrl: '', placeable: true,
    units: [{
      unitId: id,
      equipment: {
        id, category: category.toLowerCase(), name: 'Device', model: id.toUpperCase(), manufacturer: 'Test',
        inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
        portal: { productId: id, source: 'portal', detailUrl: '' },
      },
    }],
    readiness: { ioRows: ports.length, ports: ports.length, unresolvedRows: 0, nonPortRows: 0 },
  })),
};

export const libraryIndex = createLibraryIndex(library as unknown as Library);

// 장비를 정한 자리에 놓은 1.2 파일. 노드 ID는 시드로 고정한다
export function diagramText(placements: [string, number, number][]) {
  const diagram = createDiagram({ library: libraryIndex });
  const ids = createIdFactory({ seed: 3, now: 0 });
  const nodeIds = placements.map(([unit, x, y]) => addEquipmentNode(diagram, libraryIndex.units.get(unit)!.equipment, { position: { x, y }, ids }).id);
  return { text: serializeDiagram(diagram, { library: libraryIndex }), nodeIds };
}
