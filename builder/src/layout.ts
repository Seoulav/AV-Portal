// 오토 레이아웃. 구 Builder src/utils/layout.ts(seoul-visual-tech/av-system-builder 2fd568e)를 옮겼다.
// 1. Dagre로 신호 흐름을 왼쪽에서 오른쪽 열로 놓는다. 신호선(SDI·HDMI·오디오·USB)이 열을 정하고, 그 밖의 선은 같은 열도 허용한다
// 2. 열마다 이웃 단자 높이의 평균(barycenter)으로 순서를 다듬는다. 왼→오, 오→왼 교대로 두 번
// 3. 열 안에서 장비 사이 최소 간격을 지킨다
// 장비만 옮긴다. 메모·영역은 그대로다. 좌표는 엔진 geometry(노드 높이·단자 높이)를 쓴다.
// Dagre는 버튼을 누를 때 불러오므로 모듈을 인자로 받는다.
import { geometry as G, type DiagramEdge, type DiagramNode, type Equipment } from './engine';

interface DagreGraph {
  setDefaultEdgeLabel(label: () => object): void;
  setGraph(options: object): void;
  setNode(id: string, value: { width: number; height: number }): void;
  setEdge(source: string, target: string, value: { weight: number; minlen: number }): void;
  node(id: string): { x: number; y: number } | undefined;
}
export interface DagreModule { graphlib: { Graph: new () => DagreGraph }; layout(graph: DagreGraph): void }

const MIN_NODE_GAP = 40; // 열 안 장비 사이 최소 세로 간격(엣지 통로)
const SIGNAL_LINE_TYPES = new Set(['sdi', 'video', 'audio', 'usb']);
const COLUMN_THRESHOLD = G.NODE_WIDTH + 40;

interface Item { id: string; x: number; y: number; height: number; portY: Map<string, number> }
interface Neighbour { id: string; handle: string; weight: number }

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const average = (column: Item[]) => column.reduce((sum, item) => sum + item.x, 0) / column.length;

export function layoutPositions(nodes: DiagramNode[], edges: DiagramEdge[], dagre: DagreModule): Map<string, { x: number; y: number }> {
  // 같은 조건끼리는 입력 순서가 결과를 바꾼다. 내보낸 파일과 같은 id 순으로 맞춰 다시 열어도 같은 배치가 나오게 한다
  const equipment = nodes.filter(node => node.type === 'equipment').sort(byId);
  const items = new Map<string, Item>();
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'LR', nodesep: 90, edgesep: 30, ranksep: 280, marginx: 50, marginy: 50 });
  for (const node of equipment) {
    const data = node.data as unknown as Equipment;
    const height = G.nodeHeight(data);
    graph.setNode(node.id, { width: G.NODE_WIDTH, height });
    items.set(node.id, { id: node.id, x: 0, y: 0, height, portY: new Map(G.portAnchors(data).map(anchor => [anchor.handle, anchor.y])) });
  }

  const inside = [...edges].sort(byId).filter(edge => items.has(edge.source) && items.has(edge.target));
  const isSignal = (edge: DiagramEdge) => SIGNAL_LINE_TYPES.has(edge.data?.lineTypeId ?? '');
  const signal = inside.filter(isSignal);
  if (signal.length === 0) {
    for (const edge of inside) graph.setEdge(edge.source, edge.target, { weight: 1, minlen: 1 });
  } else {
    for (const edge of signal) graph.setEdge(edge.source, edge.target, { weight: 3, minlen: 1 });
    // 네트워크·제어선은 같은 열도 허용하고(minlen 0) 가볍게 둔다. 신호 흐름의 열을 흐트러뜨리지 않게 한다
    for (const edge of inside) if (!isSignal(edge)) graph.setEdge(edge.source, edge.target, { weight: 1, minlen: 0 });
  }
  dagre.layout(graph);
  for (const item of items.values()) {
    const placed = graph.node(item.id);
    if (!placed) continue;
    item.x = Math.round(placed.x - G.NODE_WIDTH / 2);
    item.y = Math.round(placed.y - item.height / 2);
  }

  // 열 묶기: x가 열 평균에서 NODE_WIDTH + 40 안이면 같은 열이다
  const columns: Item[][] = [];
  for (const item of [...items.values()].sort((a, b) => a.x - b.x)) {
    const column = columns.find(candidate => Math.abs(item.x - average(candidate)) < COLUMN_THRESHOLD);
    if (column) column.push(item);
    else columns.push([item]);
  }

  // barycenter: 신호선은 가중치 3, 그 밖은 1. 들어오는 선은 보낸 단자, 나가는 선은 받는 단자의 높이를 본다
  const incoming = new Map<string, Neighbour[]>();
  const outgoing = new Map<string, Neighbour[]>();
  for (const edge of inside) {
    const weight = isSignal(edge) ? 3 : 1;
    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target)!.push({ id: edge.source, handle: edge.sourceHandle, weight });
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    outgoing.get(edge.source)!.push({ id: edge.target, handle: edge.targetHandle, weight });
  }
  const sortedColumns = [...columns].sort((a, b) => average(a) - average(b));
  const reorder = (column: Item[], direction: 'incoming' | 'outgoing') => {
    if (column.length < 2) return;
    const columnX = average(column);
    const centres = column.map(item => {
      const neighbours = ((direction === 'incoming' ? incoming : outgoing).get(item.id) ?? []).filter(neighbour => {
        const other = items.get(neighbour.id)!;
        // 들어오는 선은 왼쪽 열의 이웃만, 나가는 선은 오른쪽 열의 이웃만 본다
        return direction === 'incoming' ? other.x < columnX - COLUMN_THRESHOLD / 2 : other.x > columnX + COLUMN_THRESHOLD / 2;
      });
      if (neighbours.length === 0) return item.y;
      let weights = 0;
      let sum = 0;
      for (const neighbour of neighbours) {
        const other = items.get(neighbour.id)!;
        weights += neighbour.weight;
        sum += neighbour.weight * (other.y + (other.portY.get(neighbour.handle) ?? 0));
      }
      return weights > 0 ? sum / weights : item.y;
    });
    const ys = column.map(item => item.y).sort((a, b) => a - b);
    column
      .map((item, index) => ({ item, centre: centres[index] }))
      .sort((a, b) => a.centre - b.centre)
      .forEach(({ item }, index) => { item.y = ys[index]; });
  };
  for (let round = 0; round < 2; round++) {
    sortedColumns.forEach((column, index) => { if (index > 0) reorder(column, 'incoming'); });
    for (let index = sortedColumns.length - 2; index >= 0; index--) reorder(sortedColumns[index], 'outgoing');
  }

  // 열 안 최소 간격(위에서 아래로)
  for (const column of columns) {
    if (column.length < 2) continue;
    column.sort((a, b) => a.y - b.y);
    for (let index = 1; index < column.length; index++) {
      const above = column[index - 1];
      const minY = above.y + above.height + MIN_NODE_GAP;
      if (column[index].y < minY) column[index].y = minY;
    }
  }

  return new Map([...items.values()].map(item => [item.id, { x: item.x, y: item.y }]));
}
