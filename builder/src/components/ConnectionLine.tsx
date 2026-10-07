// 선을 끄는 동안의 미리보기. 놓으면 만들어질 엣지와 같은 모양으로 그린다(근접 연결, proximity.ts).
// - 붙을 단자가 있으면 그 단자까지, 엣지가 실제로 붙을 점(양방향은 역할에 따른 쪽)에 고리를 그린다
// - 붙을 곳이 없으면 포인터까지 점선, 가까운 단자가 모두 막혔으면 붉은 점선
// - 캔버스 밖에 있으면 놓아도 취소라 포인터까지 점선만 그린다
// - 묶음 끌기(B-20261006-06)면 묶음 단자마다 선을 그리고, 짝이 없는 단자는 붉은 점선, 커서 옆에 개수를 띄운다
import { useMemo } from 'react';
import { Position, getSmoothStepPath, useStore, type ConnectionLineComponentProps } from '@xyflow/react';
import { findPort, type DiagramEdge, type DiagramNode, type Equipment } from '../engine';
import { handleFor, parseKey } from '../bundle';
import { resolveBundleDrop } from '../bundleDrop';
import { stepPositions } from '../edgeSpacing';
import { anchorOf, findDropTarget, type Anchor } from '../proximity';
import { builderStore, useBuilder } from '../state/useBuilder';

const BLOCKED = '#dc2626';
const sideOf = (anchor: Anchor) => (anchor.side === 'left' ? Position.Left : Position.Right);

const pathBetween = (from: { x: number; y: number; position: Position }, end: { x: number; y: number; position: Position }, stepPosition?: number) => getSmoothStepPath({
  sourceX: from.x, sourceY: from.y, sourcePosition: from.position, targetX: end.x, targetY: end.y, targetPosition: end.position, stepPosition,
})[0];
const opposite = (position: Position) => (position === Position.Left ? Position.Right : Position.Left);

export function ConnectionLine(props: ConnectionLineComponentProps) {
  const bundle = useBuilder(state => state.bundle);
  return bundle ? <BundleLines {...props} bundle={bundle} /> : <SingleLine {...props} />;
}

// 묶음 끌기 미리보기: 놓으면 생길 쌍을 모두 그린다(놓기와 같은 resolveBundleDrop)
function BundleLines({ fromNode, fromHandle, toX, toY, toNode, toHandle, connectionStatus, pointer, bundle }: ConnectionLineComponentProps & { bundle: string[] }) {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const zoom = useStore(state => state.transform[2]);
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  const byId = new Map<string, DiagramNode>(diagram.nodes.map(node => [node.id, node]));
  const inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= width && pointer.y <= height;
  const from = { nodeId: fromNode.id, handle: fromHandle.id ?? '', type: fromHandle.type };
  const under = connectionStatus === 'valid' && toNode && toHandle?.id ? { nodeId: toNode.id, handle: toHandle.id } : null;
  const drop = inside ? resolveBundleDrop(builderStore.getState(), { bundle, from, under, point: { x: toX, y: toY }, zoom }) : null;
  const role = fromHandle.id?.startsWith('target_') ? 'target' : fromHandle.id?.startsWith('source_') ? 'source' : null;
  const colorOf = (node: DiagramNode | undefined, portId: string) => {
    const type = node ? findPort(node.data as unknown as Equipment, portId)?.type : undefined;
    return library?.rules.lineTypes.find(item => item.id === type)?.color ?? '#007aff';
  };
  const pairs = new Map((drop?.plan?.pairs ?? []).map(pair => [`${pair.from.nodeId}::${pair.from.portId}`, pair]));
  // 놓으면 생길 엣지와 같은 평행 간격으로 미리 그린다
  const steps = stepPositions(diagram.nodes, [...pairs].map(([key, pair]) => ({ id: key, source: pair.from.nodeId, sourceHandle: pair.fromHandle, target: pair.to.nodeId, targetHandle: pair.toHandle }) as unknown as DiagramEdge));
  const lines = bundle.map(key => {
    const ref = parseKey(key);
    const node = byId.get(ref.nodeId);
    const port = node ? findPort(node.data as unknown as Equipment, ref.portId) : null;
    const pair = pairs.get(key);
    const start = port ? anchorOf(node, pair?.fromHandle ?? handleFor(port, role)) : null;
    if (!start) return null;
    const startAt = { x: start.ax, y: start.ay, position: start.side === 'left' ? Position.Left : Position.Right };
    const end = pair ? anchorOf(byId.get(pair.to.nodeId), pair.toHandle) : null;
    if (end) {
      const endAt = { x: end.ax, y: end.ay, position: end.side === 'left' ? Position.Left : Position.Right };
      const color = colorOf(node, ref.portId);
      return (
        <g key={key} className="bundle-line snapped">
          <path d={pathBetween(startAt, endAt, steps.get(key))} fill="none" stroke={color} strokeWidth={2} />
          <circle className="snap-ring" cx={end.ax} cy={end.ay} r={8} stroke={color} />
        </g>
      );
    }
    // 짝이 없다: 대상이 정해졌으면(모자람) 붉은 점선, 아직 대상이 없으면 포인터까지 점선
    const missing = Boolean(drop?.plan) || Boolean(drop?.blockedCode);
    return (
      <path key={key} className={`bundle-line${missing ? ' blocked' : ''}`} d={pathBetween(startAt, { x: toX, y: toY, position: opposite(startAt.position) })}
        fill="none" stroke={missing ? '#dc2626' : colorOf(node, ref.portId)} strokeWidth={2} strokeDasharray="6 4" />
    );
  });
  // 개수 배지: 화면에서 같은 크기로 보이게 배율을 되돌린다
  const label = drop?.plan ? `${drop.plan.pairs.length}/${bundle.length}` : String(bundle.length);
  return (
    <g className="connection-preview bundle-preview">
      {lines}
      <g className="bundle-badge" transform={`translate(${toX + 14 / zoom}, ${toY + 14 / zoom}) scale(${1 / zoom})`}>
        <rect x={0} y={0} width={10 + label.length * 7} height={18} rx={9} />
        <text x={5} y={13}>{label}</text>
      </g>
    </g>
  );
}

function SingleLine({ fromNode, fromHandle, fromX, fromY, toX, toY, toNode, toHandle, connectionStatus, pointer }: ConnectionLineComponentProps) {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const connectionJudge = useBuilder(state => state.connectionJudge);
  const zoom = useStore(state => state.transform[2]);
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  const nodeById = (id: string | undefined) => diagram.nodes.find(node => node.id === id);
  // 판정 함수는 끄는 동안 구성도가 바뀌지 않으므로 출발 단자마다 한 번만 만든다
  const judge = useMemo(
    () => connectionJudge({ nodeId: fromNode.id, handle: fromHandle.id ?? '', type: fromHandle.type }),
    [connectionJudge, fromNode.id, fromHandle.id, fromHandle.type, diagram],
  );

  const inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= width && pointer.y <= height;
  let snapped: Anchor | null = null;
  let fromAttached = fromHandle.id ?? null;
  let blocked = false;
  if (inside && connectionStatus === 'valid' && toNode && toHandle?.id) {
    // 포인터 아래 단자: React Flow가 이 단자로 연결한다. 붙는 점은 판정이 정한 핸들의 점이다
    const verdict = judge({ nodeId: toNode.id, handle: toHandle.id });
    snapped = anchorOf(nodeById(toNode.id), verdict.handle ?? toHandle.id);
    fromAttached = verdict.fromHandle ?? fromAttached;
  } else if (inside) {
    const target = findDropTarget({ nodes: diagram.nodes, fromNodeId: fromNode.id, point: { x: toX, y: toY }, zoom, judge });
    if (target?.kind === 'connect') { snapped = target.anchor; fromAttached = target.fromHandle ?? fromAttached; }
    blocked = target?.kind === 'blocked';
  }

  const start = anchorOf(nodeById(fromNode.id), fromAttached);
  const from = start ? { x: start.ax, y: start.ay, position: sideOf(start) } : { x: fromX, y: fromY, position: Position.Right };
  const end = snapped
    ? { x: snapped.ax, y: snapped.ay, position: sideOf(snapped) }
    : { x: toX, y: toY, position: from.position === Position.Left ? Position.Right : Position.Left };
  const [path] = getSmoothStepPath({ sourceX: from.x, sourceY: from.y, sourcePosition: from.position, targetX: end.x, targetY: end.y, targetPosition: end.position });
  const fromData = nodeById(fromNode.id)?.data as unknown as Equipment | undefined;
  const type = start && fromData ? findPort(fromData, start.portId)?.type : undefined;
  const color = blocked ? BLOCKED : library?.rules.lineTypes.find(item => item.id === type)?.color ?? '#007aff';
  return (
    <g className={`connection-preview${snapped ? ' snapped' : ''}${blocked ? ' blocked' : ''}`}>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeDasharray={snapped ? undefined : '6 4'} />
      {snapped && <circle className="snap-ring" cx={snapped.ax} cy={snapped.ay} r={8} stroke={color} />}
    </g>
  );
}
