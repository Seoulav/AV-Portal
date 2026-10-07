// 선을 끄는 동안의 미리보기. 놓으면 붙을 단자(근접 연결, proximity.ts)까지 선을 긋고 고리로 표시한다.
// 붙을 곳이 없으면 포인터까지, 가까운 단자가 모두 막혔으면 붉은 점선으로 그린다.
import { useMemo } from 'react';
import { Position, getSmoothStepPath, useStore, type ConnectionLineComponentProps } from '@xyflow/react';
import { findPort, type Equipment } from '../engine';
import { anchorOf, findDropTarget, type Anchor } from '../proximity';
import { useBuilder } from '../state/useBuilder';

const BLOCKED = '#dc2626';
const sideOf = (anchor: Anchor) => (anchor.side === 'left' ? Position.Left : Position.Right);

export function ConnectionLine({ fromNode, fromHandle, fromX, fromY, toX, toY, toNode, toHandle, connectionStatus }: ConnectionLineComponentProps) {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const connectionJudge = useBuilder(state => state.connectionJudge);
  const zoom = useStore(state => state.transform[2]);
  const nodeById = (id: string | undefined) => diagram.nodes.find(node => node.id === id);
  const start = anchorOf(nodeById(fromNode.id), fromHandle.id);
  // 판정 함수는 끄는 동안 구성도가 바뀌지 않으므로 한 번만 만든다
  const judge = useMemo(() => connectionJudge({ nodeId: fromNode.id, handle: fromHandle.id ?? '' }), [connectionJudge, fromNode.id, fromHandle.id, diagram]);

  let end: { x: number; y: number; position: Position } = { x: toX, y: toY, position: start?.side === 'left' ? Position.Right : Position.Left };
  let snapped: Anchor | null = null;
  let blocked = false;
  const under = connectionStatus === 'valid' && toNode && toHandle ? anchorOf(nodeById(toNode.id), toHandle.id) : null;
  if (under) snapped = under;
  else {
    const target = findDropTarget({ nodes: diagram.nodes, fromNodeId: fromNode.id, point: { x: toX, y: toY }, zoom, judge });
    if (target?.kind === 'connect') snapped = target.anchor;
    blocked = target?.kind === 'blocked';
  }
  if (snapped) end = { x: snapped.ax, y: snapped.ay, position: sideOf(snapped) };

  const from = start ? { x: start.ax, y: start.ay, position: sideOf(start) } : { x: fromX, y: fromY, position: Position.Right };
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
