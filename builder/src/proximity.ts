// 근접 연결(기반명세 §9). 선을 놓은 지점에서 붙을 단자를 고른다. React Flow의 connectionRadius는 쓰지 않는다.
// - 장비 몸체(다른 장비) 위에 놓으면: 그 장비의 연결 가능한 빈 단자 중 가장 가까운 것. 거리 제한 없음
// - 그 밖이면: 화면 기준 40px 안의 연결 가능한 빈 단자 중 가장 가까운 것
// 연결 가능 여부는 엔진 판정(judge)이 정한다. 좌표는 엔진 geometry.portAnchors를 쓴다.
import { geometry as G, type DiagramNode, type Equipment, type PortAnchor } from './engine';

export const SNAP_RADIUS_PX = 40;

export interface Point { x: number; y: number }
// 캔버스 좌표로 옮긴 단자 끝점
export interface Anchor extends PortAnchor { nodeId: string; ax: number; ay: number }
export interface Verdict { allowed: boolean; code?: string }
export type JudgeTo = (to: { nodeId: string; handle: string }) => Verdict;
export type DropTarget = { kind: 'connect'; anchor: Anchor } | { kind: 'blocked'; anchor: Anchor; code?: string } | null;

const isEquipment = (node: DiagramNode) => node.type === 'equipment';
const dataOf = (node: DiagramNode) => node.data as unknown as Equipment;

export function nodeAnchors(node: DiagramNode): Anchor[] {
  if (!isEquipment(node)) return [];
  return G.portAnchors(dataOf(node)).map(anchor => ({ ...anchor, nodeId: node.id, ax: node.position.x + anchor.x, ay: node.position.y + anchor.y }));
}

export function anchorOf(node: DiagramNode | undefined, handle: string | null | undefined): Anchor | null {
  if (!node || !handle) return null;
  return nodeAnchors(node).find(anchor => anchor.handle === handle) ?? null;
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

// 가까운 순으로 보며 처음 연결 가능한 단자를 고른다. 모두 막혔으면 가장 가까운 단자의 막힌 이유를 돌려준다
function pick(anchors: Anchor[], point: Point, judge: JudgeTo): DropTarget {
  if (!anchors.length) return null;
  const sorted = [...anchors].sort((a, b) => distance(a, point) - distance(b, point));
  let nearestBlocked: { anchor: Anchor; code?: string } | null = null;
  for (const anchor of sorted) {
    const verdict = judge({ nodeId: anchor.nodeId, handle: anchor.handle });
    if (verdict.allowed) return { kind: 'connect', anchor };
    nearestBlocked ??= { anchor, code: verdict.code };
  }
  return nearestBlocked ? { kind: 'blocked', ...nearestBlocked } : null;
}

export function findDropTarget({ nodes, fromNodeId, point, zoom, judge }: { nodes: DiagramNode[]; fromNodeId: string; point: Point; zoom: number; judge: JudgeTo }): DropTarget {
  // 출발 장비 자신은 후보가 아니다(같은 장비끼리는 연결하지 않는다). 그 위에 놓으면 반경 규칙으로 넘어간다
  const body = equipmentAt(nodes, point);
  if (body && body.id !== fromNodeId) return pick(nodeAnchors(body), point, judge);
  const radius = SNAP_RADIUS_PX / zoom;
  const reach = radius + G.HANDLE_OUTSET;
  const near = nodes.filter(node => isEquipment(node) && node.id !== fromNodeId
    && point.x >= node.position.x - reach && point.x <= node.position.x + G.NODE_WIDTH + reach
    && point.y >= node.position.y - reach && point.y <= node.position.y + G.nodeHeight(dataOf(node)) + reach);
  return pick(near.flatMap(nodeAnchors).filter(anchor => distance(anchor, point) <= radius), point, judge);
}
