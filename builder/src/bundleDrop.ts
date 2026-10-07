// 묶음 끌기를 놓을 곳을 정한다. 미리보기(ConnectionLine)와 놓기(Canvas.onConnectEnd)가 같은 함수를 써서 결과가 같다.
// 1번 대상 단자는 묶음을 대표하는 단자(이미 연결되지 않은 첫 묶음 단자)로 판정한다. 끌고 있는 단자가 이미 연결돼 있거나
// 놓은 단자와 맞지 않아도 묶음의 다른 단자가 맞으면 잇는다.
// - 다른 장비의 단자 위에 놓았으면: 그 단자가 대표 단자와 맞으면 그 단자, 아니면 그 장비에서 가장 가까운 맞는 단자
// - 그 밖이면: 근접 연결 규칙(proximity.ts)
import { findPort, occupiedPorts, parseHandle, type Diagram, type Equipment } from './engine';
import { handleFor, parseKey, planBundle, type BundlePlan, type PortRefKey } from './bundle';
import { lineFilter, visibleNodes } from './lineFilter';
import { findDropTarget, type Point, type Verdict } from './proximity';
import type { BuilderState } from './state/store';

export interface DragFrom { nodeId: string; handle: string; type: 'source' | 'target' }
export interface BundleDrop { target: PortRefKey | null; plan: BundlePlan | null; blockedCode?: string }

export function resolveBundleDrop(
  state: Pick<BuilderState, 'diagram' | 'connectionJudge' | 'hiddenLineTypes'>,
  { bundle, from, under, point, zoom }: { bundle: string[]; from: DragFrom; under: { nodeId: string; handle: string } | null; point: Point; zoom: number },
): BundleDrop {
  const diagram: Diagram = state.diagram;
  const byId = new Map(diagram.nodes.map(node => [node.id, node]));
  const used = occupiedPorts(diagram);
  const role = parseHandle(from.handle)?.role ?? null;
  // 묶음 단자마다 판정 함수를 한 번씩 만든다(끄는 방향은 끌기 시작한 핸들과 같다)
  const judges = new Map<string, (to: { nodeId: string; handle: string }) => Verdict>();
  const judgeOf = (member: { nodeId: string; handle: string }) => {
    const key = `${member.nodeId}::${member.handle}`;
    if (!judges.has(key)) judges.set(key, state.connectionJudge({ ...member, type: from.type }));
    return judges.get(key)!;
  };
  const memberHandle = (key: string) => {
    const ref = parseKey(key);
    const port = byId.get(ref.nodeId)?.type === 'equipment' ? findPort(byId.get(ref.nodeId)!.data as unknown as Equipment, ref.portId) : null;
    return port ? { nodeId: ref.nodeId, handle: handleFor(port, role) } : null;
  };
  // 대표 단자: 놓을 장비 위의 단자가 아니고 아직 연결되지 않은 첫 묶음 단자. 없으면 끌고 있는 단자
  const representativeKey = bundle.find(key => !used.has(key) && parseKey(key).nodeId !== under?.nodeId);
  const representative = (representativeKey && memberHandle(representativeKey)) || { nodeId: from.nodeId, handle: from.handle };
  const judgeRepresentative = judgeOf(representative);

  let target: PortRefKey | null = null;
  const underPort = under && under.nodeId !== from.nodeId ? parseHandle(under.handle) : null;
  if (under && underPort && judgeRepresentative({ nodeId: under.nodeId, handle: under.handle }).allowed) {
    target = { nodeId: under.nodeId, portId: underPort.portId };
  } else {
    // 선 종류 필터로 숨긴 장비는 놓을 곳에서 뺀다
    const drop = findDropTarget({ nodes: visibleNodes(diagram.nodes, lineFilter(diagram, state.hiddenLineTypes)), fromNodeId: from.nodeId, point, zoom, judge: judgeRepresentative });
    if (drop?.kind === 'blocked') return { target: null, plan: null, blockedCode: drop.code };
    if (drop?.kind === 'connect') target = { nodeId: drop.anchor.nodeId, portId: drop.anchor.portId };
  }
  if (!target) return { target: null, plan: null };
  const plan = planBundle({
    nodes: diagram.nodes,
    bundle,
    target,
    role,
    judge: (member, to) => judgeOf(member)(to),
    occupied: ref => used.has(`${ref.nodeId}::${ref.portId}`),
  });
  return { target, plan };
}
