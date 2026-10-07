// 묶음 끌기를 놓을 곳을 정한다. 미리보기(ConnectionLine)와 놓기(Canvas.onConnectEnd)가 같은 함수를 써서 결과가 같다.
// 1번 대상 단자: 포인터 아래 단자가 맞으면 그것, 아니면 근접 연결 규칙(proximity.ts)으로 끌고 있는 단자에 맞는 단자.
import { occupiedPorts, parseHandle, type Diagram } from './engine';
import { planBundle, type BundlePlan, type PortRefKey } from './bundle';
import { findDropTarget, type Point, type Verdict } from './proximity';
import type { BuilderState } from './state/store';

export interface DragFrom { nodeId: string; handle: string; type: 'source' | 'target' }
export interface BundleDrop { target: PortRefKey | null; plan: BundlePlan | null; blockedCode?: string }

export function resolveBundleDrop(
  state: Pick<BuilderState, 'diagram' | 'connectionJudge'>,
  { bundle, from, under, point, zoom }: { bundle: string[]; from: DragFrom; under: { nodeId: string; handle: string } | null; point: Point; zoom: number },
): BundleDrop {
  const diagram: Diagram = state.diagram;
  let target: PortRefKey | null = null;
  const underPort = under ? parseHandle(under.handle) : null;
  if (under && underPort) {
    target = { nodeId: under.nodeId, portId: underPort.portId };
  } else {
    const drop = findDropTarget({ nodes: diagram.nodes, fromNodeId: from.nodeId, point, zoom, judge: state.connectionJudge(from) });
    if (drop?.kind === 'blocked') return { target: null, plan: null, blockedCode: drop.code };
    if (drop?.kind === 'connect') target = { nodeId: drop.anchor.nodeId, portId: drop.anchor.portId };
  }
  if (!target) return { target: null, plan: null };
  // 묶음 단자마다 판정 함수를 한 번씩 만든다(끄는 방향은 끌기 시작한 핸들과 같다)
  const judges = new Map<string, (to: { nodeId: string; handle: string }) => Verdict>();
  const judge = (member: { nodeId: string; handle: string }, to: { nodeId: string; handle: string }) => {
    const key = `${member.nodeId}::${member.handle}`;
    if (!judges.has(key)) judges.set(key, state.connectionJudge({ ...member, type: from.type }));
    return judges.get(key)!(to);
  };
  const used = occupiedPorts(diagram);
  const plan = planBundle({
    nodes: diagram.nodes,
    bundle,
    target,
    role: parseHandle(from.handle)?.role ?? null,
    judge,
    occupied: ref => used.has(`${ref.nodeId}::${ref.portId}`),
  });
  return { target, plan };
}
