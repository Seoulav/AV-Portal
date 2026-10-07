// 선을 끄는 동안의 미리보기. 놓으면 만들어질 엣지와 같은 모양으로 그린다(근접 연결, proximity.ts).
// - 붙을 단자가 있으면 그 단자까지, 엣지가 실제로 붙을 점(양방향은 역할에 따른 쪽)에 고리를 그린다
// - 붙을 곳이 없으면 포인터까지 점선, 가까운 단자가 모두 막혔으면 붉은 점선
// - 캔버스 밖에 있으면 놓아도 취소라 포인터까지 점선만 그린다
import { useMemo } from 'react';
import { Position, getSmoothStepPath, useStore, type ConnectionLineComponentProps } from '@xyflow/react';
import { findPort, type Equipment } from '../engine';
import { anchorOf, findDropTarget, type Anchor } from '../proximity';
import { useBuilder } from '../state/useBuilder';

const BLOCKED = '#dc2626';
const sideOf = (anchor: Anchor) => (anchor.side === 'left' ? Position.Left : Position.Right);

export function ConnectionLine({ fromNode, fromHandle, fromX, fromY, toX, toY, toNode, toHandle, connectionStatus, pointer }: ConnectionLineComponentProps) {
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
