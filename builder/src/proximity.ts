// 근접 연결(기반명세 §9). 선을 놓은 지점에서 붙을 단자를 고른다. React Flow의 connectionRadius는 쓰지 않는다.
// - 장비 몸체(다른 장비) 위에 놓으면: 그 장비의 연결 가능한 빈 단자 중 가장 가까운 것. 거리 제한 없음
// - 그 밖이면: 화면 기준 40px 안의 연결 가능한 빈 단자 중 가장 가까운 것
// 연결 가능 여부는 엔진 판정(judge)이 정한다. 좌표는 엔진 geometry.portAnchors를 쓴다.
import { geometry as G, type DiagramNode, type Equipment, type PortAnchor } from './engine';

export const SNAP_RADIUS_PX = 40;

export interface Point { x: number; y: number }
// 캔버스 좌표로 옮긴 단자 끝점
export interface Anchor extends PortAnchor { nodeId: string; ax: number; ay: number }
// handle·fromHandle: 연결하면 엣지에 남을 핸들(store.connectionJudge). 양방향 단자는 역할에 따라 붙는 쪽이 정해진다
export interface Verdict { allowed: boolean; code?: string; handle?: string; fromHandle?: string }
export type JudgeTo = (to: { nodeId: string; handle: string }) => Verdict;
// connect의 anchor는 선이 실제로 붙을 점, fromHandle은 출발 장비에서 선이 붙을 핸들이다
export type DropTarget = { kind: 'connect'; anchor: Anchor; fromHandle?: string } | { kind: 'blocked'; anchor: Anchor; code?: string } | null;

const isEquipment = (node: DiagramNode) => node.type === 'equipment';
const dataOf = (node: DiagramNode) => node.data as unknown as Equipment;

// 노드 왼쪽 위 기준 단자 끝점은 장비 정보(data)에만 달렸다. 같은 data면 다시 계산하지 않는다
// (선 그리기가 끌기 중 매 순간 엣지마다 찾는다)
const relativeCache = new WeakMap<object, { list: ReturnType<typeof G.portAnchors>; byHandle: Map<string, ReturnType<typeof G.portAnchors>[number]> }>();
const relativeAnchors = (node: DiagramNode) => {
  const data = node.data as object;
  let entry = relativeCache.get(data);
  if (!entry) {
    const list = G.portAnchors(dataOf(node));
    entry = { list, byHandle: new Map(list.map(anchor => [anchor.handle, anchor])) };
    relativeCache.set(data, entry);
  }
  return entry;
};

export function nodeAnchors(node: DiagramNode): Anchor[] {
  if (!isEquipment(node)) return [];
  return relativeAnchors(node).list.map(anchor => ({ ...anchor, nodeId: node.id, ax: node.position.x + anchor.x, ay: node.position.y + anchor.y }));
}

export function anchorOf(node: DiagramNode | undefined, handle: string | null | undefined): Anchor | null {
  if (!node || !handle || !isEquipment(node)) return null;
  const anchor = relativeAnchors(node).byHandle.get(handle);
  return anchor ? { ...anchor, nodeId: node.id, ax: node.position.x + anchor.x, ay: node.position.y + anchor.y } : null;
}

// 점 아래의 장비(위에 그려진 것 우선). 단자 점이 있는 바깥 20px은 몸체가 아니다
export function equipmentAt(nodes: DiagramNode[], point: Point): DiagramNode | null {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    if (!isEquipment(node)) continue;
    const { x, y } = node.position;
    if (point.x >= x && point.x <= x + G.NODE_WIDTH && point.y >= y && point.y <= y + G.nodeHeight(dataOf(node))) return node;
  }
  return null;
}

const distance = (anchor: Anchor, point: Point) => Math.hypot(anchor.ax - point.x, anchor.ay - point.y);

// 단자 단위로 가까운 순으로 보며(양방향은 점 둘 중 가까운 쪽 거리) 처음 연결 가능한 단자를 고른다.
// 붙는 점은 판정이 돌려준 핸들의 점이다. 모두 막혔으면 가장 가까운 단자의 막힌 이유를 돌려준다
function pick(anchors: Anchor[], point: Point, judge: JudgeTo, all: (nodeId: string, portId: string) => Anchor[]): DropTarget {
  const ports = new Map<string, { nearest: Anchor; distance: number }>();
  for (const anchor of anchors) {
    const key = `${anchor.nodeId}::${anchor.portId}`;
    const d = distance(anchor, point);
    const seen = ports.get(key);
    if (!seen || d < seen.distance) ports.set(key, { nearest: anchor, distance: d });
  }
  const sorted = [...ports.values()].sort((a, b) => a.distance - b.distance);
  let nearestBlocked: { anchor: Anchor; code?: string } | null = null;
  for (const { nearest } of sorted) {
    const verdict = judge({ nodeId: nearest.nodeId, handle: nearest.handle });
    if (verdict.allowed) {
      const attached = all(nearest.nodeId, nearest.portId).find(anchor => anchor.handle === verdict.handle) ?? nearest;
      return { kind: 'connect', anchor: attached, fromHandle: verdict.fromHandle };
    }
    nearestBlocked ??= { anchor: nearest, code: verdict.code };
  }
  return nearestBlocked ? { kind: 'blocked', ...nearestBlocked } : null;
}

export function findDropTarget({ nodes, fromNodeId, point, zoom, judge }: { nodes: DiagramNode[]; fromNodeId: string; point: Point; zoom: number; judge: JudgeTo }): DropTarget {
  // 출발 장비 자신은 후보가 아니다(같은 장비끼리는 연결하지 않는다). 그 위에 놓으면 반경 규칙으로 넘어간다
  const anchorsOf = new Map<string, Anchor[]>();
  const nodeAnchorsCached = (node: DiagramNode) => {
    if (!anchorsOf.has(node.id)) anchorsOf.set(node.id, nodeAnchors(node));
    return anchorsOf.get(node.id)!;
  };
  const byId = new Map(nodes.map(node => [node.id, node]));
  const all = (nodeId: string, portId: string) => nodeAnchorsCached(byId.get(nodeId)!).filter(anchor => anchor.portId === portId);
  const body = equipmentAt(nodes, point);
  if (body && body.id !== fromNodeId) return pick(nodeAnchorsCached(body), point, judge, all);
  const radius = SNAP_RADIUS_PX / zoom;
  const reach = radius + G.HANDLE_OUTSET;
  const near = nodes.filter(node => isEquipment(node) && node.id !== fromNodeId
    && point.x >= node.position.x - reach && point.x <= node.position.x + G.NODE_WIDTH + reach
    && point.y >= node.position.y - reach && point.y <= node.position.y + G.nodeHeight(dataOf(node)) + reach);
  return pick(near.flatMap(nodeAnchorsCached).filter(anchor => distance(anchor, point) <= radius), point, judge, all);
}
