// 평행선 한꺼번에 긋기(통합 기획 §7.3, B-20261006-06). 고른 단자 묶음을 대상 장비의 단자에 짝짓는다.
// - 묶음: 끌기 시작한 단자와 같은 종류(출력·입력·양방향)의 선택 단자. 화면 위 → 아래, y가 같으면 왼쪽 → 오른쪽(결정 I-a)
// - 짝: 묶음 1번 → 놓은 단자, 다음부터 대상 장비의 같은 열 아래로 차례로. 막힌 단자는 건너뛴다. 다른 장비로 넘어가지 않는다(결정 I-b)
// 연결 가능 여부는 엔진 판정(store.connectionJudge)이 정한다. 좌표는 proximity.ts(geometry.portAnchors)를 쓴다.
import type { DiagramNode, Equipment, Port } from './engine';
import { nodeAnchors, type Anchor, type Verdict } from './proximity';

export interface PortRefKey { nodeId: string; portId: string }
export const portKey = (nodeId: string, portId: string) => `${nodeId}::${portId}`;
export const parseKey = (key: string): PortRefKey => {
  const at = key.indexOf('::');
  return { nodeId: key.slice(0, at), portId: key.slice(at + 2) };
};

const LISTS = ['inputs', 'outputs', 'bidirectional'] as const;
type Kind = Port['direction'];
const dataOf = (node: DiagramNode) => node.data as unknown as Equipment;
const findPortIn = (node: DiagramNode | undefined, portId: string): Port | null => {
  if (!node || node.type !== 'equipment') return null;
  const data = dataOf(node);
  for (const list of LISTS) {
    const port = data[list].find(item => item.id === portId);
    if (port) return port;
  }
  return null;
};

// 범위 선택: 단자 점 중심이 사각형 안에 있으면 고른다(양방향은 점 둘 중 하나라도)
export function portsInRect(nodes: DiagramNode[], rect: { x: number; y: number; width: number; height: number }): string[] {
  const inside = (anchor: Anchor) => anchor.ax >= rect.x && anchor.ax <= rect.x + rect.width && anchor.ay >= rect.y && anchor.ay <= rect.y + rect.height;
  const keys = new Set<string>();
  for (const node of nodes) for (const anchor of nodeAnchors(node)) if (inside(anchor)) keys.add(portKey(node.id, anchor.portId));
  return [...keys];
}

// 단자의 대표 점(위·왼쪽 정렬용): 양방향은 두 점 중 왼쪽
const anchorFor = (node: DiagramNode, portId: string) => nodeAnchors(node).find(anchor => anchor.portId === portId) ?? null;

// 끌기 시작한 단자가 선택돼 있고 같은 종류 선택이 둘 이상이면 묶음(정렬한 키 목록), 아니면 null
export function bundleFor(nodes: DiagramNode[], selected: string[], from: PortRefKey): string[] | null {
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (!selected.includes(portKey(from.nodeId, from.portId))) return null;
  const kind: Kind | undefined = findPortIn(byId.get(from.nodeId), from.portId)?.direction;
  if (!kind) return null;
  const members = selected
    .map(key => ({ key, ref: parseKey(key) }))
    .map(item => ({ ...item, node: byId.get(item.ref.nodeId) }))
    .filter(item => item.node && findPortIn(item.node, item.ref.portId)?.direction === kind)
    .map(item => ({ key: item.key, anchor: anchorFor(item.node!, item.ref.portId) }))
    .filter((item): item is { key: string; anchor: Anchor } => item.anchor !== null)
    .sort((a, b) => (a.anchor.ay - b.anchor.ay) || (a.anchor.ax - b.anchor.ax) || (a.key < b.key ? -1 : 1));
  return members.length >= 2 ? members.map(item => item.key) : null;
}

// 핸들 ID: 양방향은 끌기 시작한 핸들과 같은 역할(source_/target_)을 쓴다
export const handleFor = (port: Port, role: 'source' | 'target' | null) => (port.direction === 'both' ? `${role ?? 'source'}_${port.id}` : port.id);

export interface BundlePair { from: PortRefKey; fromHandle: string; to: PortRefKey; toHandle: string; verdict: Verdict }
export interface BundlePlan { pairs: BundlePair[]; unmatched: { from: PortRefKey; code: string }[] }

// 묶음을 놓은 단자부터 같은 열 아래로 짝짓는다.
// judge(from, to): 묶음 단자 하나에서 대상 단자로의 엔진 판정. occupied: 이미 엣지가 있는 단자인지
export function planBundle({ nodes, bundle, target, role, judge, occupied }: {
  nodes: DiagramNode[];
  bundle: string[];
  target: PortRefKey;
  role: 'source' | 'target' | null;
  judge: (from: { nodeId: string; handle: string }, to: { nodeId: string; handle: string }) => Verdict;
  occupied: (ref: PortRefKey) => boolean;
}): BundlePlan {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const targetNode = byId.get(target.nodeId);
  const plan: BundlePlan = { pairs: [], unmatched: [] };
  const column = targetNode && targetNode.type === 'equipment' ? LISTS.map(list => dataOf(targetNode)[list]).find(list => list.some(port => port.id === target.portId)) ?? [] : [];
  const slots = column.slice(Math.max(0, column.findIndex(port => port.id === target.portId)));
  let next = 0;
  for (const key of bundle) {
    const from = parseKey(key);
    const fromPort = findPortIn(byId.get(from.nodeId), from.portId);
    if (!fromPort) { plan.unmatched.push({ from, code: 'port-missing' }); continue; }
    // 묶음 단자 자신의 문제는 대상 단자를 쓰지 않고 넘긴다
    if (occupied(from)) { plan.unmatched.push({ from, code: 'port-occupied' }); continue; }
    if (from.nodeId === target.nodeId) { plan.unmatched.push({ from, code: 'self-loop' }); continue; }
    const fromHandle = handleFor(fromPort, role);
    // 대상 단자는 차례로 한 번씩만 본다. 막힌 단자(이미 연결·규칙)는 건너뛰고 다시 보지 않는다
    let matched = false;
    while (next < slots.length) {
      const slot = slots[next];
      next += 1;
      const verdict = judge({ nodeId: from.nodeId, handle: fromHandle }, { nodeId: target.nodeId, handle: slot.id });
      if (verdict.allowed) {
        plan.pairs.push({ from, fromHandle: verdict.fromHandle ?? fromHandle, to: { nodeId: target.nodeId, portId: slot.id }, toHandle: verdict.handle ?? slot.id, verdict });
        matched = true;
        break;
      }
    }
    // 대상 열 끝까지 가도 짝이 없으면 단자가 모자란 것이다(C1)
    if (!matched) plan.unmatched.push({ from, code: 'no-slot' });
  }
  return plan;
}
