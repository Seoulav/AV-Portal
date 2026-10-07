// 선을 끄는 동안의 미리보기. 놓으면 만들어질 엣지와 같은 모양(구 Builder식 직교 경로)으로 그린다(근접 연결, proximity.ts).
// - 붙을 단자가 있으면 그 단자까지, 엣지가 실제로 붙을 점(양방향은 역할에 따른 쪽)에 고리를 그린다
// - 붙을 곳이 없으면 포인터까지 점선, 가까운 단자가 모두 막혔으면 붉은 점선
// - 캔버스 밖에 있으면 놓아도 취소라 포인터까지 점선만 그린다
// - 묶음 끌기(B-20261006-06)면 묶음 단자마다 선을 그리고, 짝이 없는 단자는 붉은 점선, 커서 옆에 개수를 띄운다.
//   평행 간격은 이미 있는 엣지와 함께 edgeOffsets로 계산해 놓은 뒤 모양과 같다
import { useMemo } from 'react';
import { useStore, type ConnectionLineComponentProps } from '@xyflow/react';
import { findPort, type DiagramNode, type Equipment } from '../engine';
import { handleFor, parseKey } from '../bundle';
import { resolveBundleDrop } from '../bundleDrop';
import { buildOrthogonalPath, getEdgePoints } from '../edges/edgeGeometry';
import { edgeOffsets, normalizeBidiEdges, type EdgeLike } from '../edges/edgeProcessing';
import { anchorOf, findDropTarget, type Anchor } from '../proximity';
import { builderStore, useBuilder } from '../state/useBuilder';

const BLOCKED = '#dc2626';
interface End { x: number; y: number; side: 'left' | 'right' }
const endOf = (anchor: Anchor): End => ({ x: anchor.ax, y: anchor.ay, side: anchor.side });

// 두 끝을 엣지처럼 잇는다: 오른쪽(출력 쪽) 끝이 source, 왼쪽(입력 쪽) 끝이 target이다
function linePath(a: End, b: End, splitOffset = 0): string {
  const [source, target] = a.side === 'right' || b.side === 'left' ? [a, b] : [b, a];
  return buildOrthogonalPath(getEdgePoints({ sourceX: source.x, sourceY: source.y, targetX: target.x, targetY: target.y, splitOffset }), []);
}
// 포인터 끝: 출발 끝의 반대쪽에서 들어오는 것으로 본다
const pointerEnd = (start: End, x: number, y: number): End => ({ x, y, side: start.side === 'right' ? 'left' : 'right' });

export function ConnectionLine(props: ConnectionLineComponentProps) {
  const bundle = useBuilder(state => state.bundle);
  return bundle ? <BundleLines {...props} bundle={bundle} /> : <SingleLine {...props} />;
}

// 묶음 끌기 미리보기: 놓으면 생길 쌍을 모두 그린다(놓기와 같은 resolveBundleDrop)
function BundleLines({ fromNode, fromHandle, toX, toY, toNode, toHandle, pointer, bundle }: ConnectionLineComponentProps & { bundle: string[] }) {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const zoom = useStore(state => state.transform[2]);
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  const byId = new Map<string, DiagramNode>(diagram.nodes.map(node => [node.id, node]));
  const inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= width && pointer.y <= height;
  const from = { nodeId: fromNode.id, handle: fromHandle.id ?? '', type: fromHandle.type };
  const under = toNode && toHandle?.id ? { nodeId: toNode.id, handle: toHandle.id } : null;
  const drop = inside ? resolveBundleDrop(builderStore.getState(), { bundle, from, under, point: { x: toX, y: toY }, zoom }) : null;
  const role = fromHandle.id?.startsWith('target_') ? 'target' : fromHandle.id?.startsWith('source_') ? 'source' : null;
  const colorOf = (node: DiagramNode | undefined, portId: string) => {
    const type = node ? findPort(node.data as unknown as Equipment, portId)?.type : undefined;
    return library?.rules.lineTypes.find(item => item.id === type)?.color ?? '#007aff';
  };
  const pairs = new Map((drop?.plan?.pairs ?? []).map(pair => [`${pair.from.nodeId}::${pair.from.portId}`, pair]));
  // 미리보기 쌍을 엣지처럼(출력 쪽 → 입력 쪽) 만들어 이미 있는 엣지와 함께 간격을 계산한다
  const previewEdges: EdgeLike[] = [];
  for (const [key, pair] of pairs) {
    const a = anchorOf(byId.get(pair.from.nodeId), pair.fromHandle);
    const forward = a?.side === 'right';
    previewEdges.push(forward
      ? { id: `preview:${key}`, source: pair.from.nodeId, sourceHandle: pair.fromHandle, target: pair.to.nodeId, targetHandle: pair.toHandle }
      : { id: `preview:${key}`, source: pair.to.nodeId, sourceHandle: pair.toHandle, target: pair.from.nodeId, targetHandle: pair.fromHandle });
  }
  // 놓은 뒤 화면처럼 양방향↔양방향은 좌우에 맞게 뒤집은 엣지로 그린다(Canvas와 같은 normalizeBidiEdges)
  const normalized = previewEdges.length ? normalizeBidiEdges([...diagram.edges, ...previewEdges], diagram.nodes) : [];
  const offsets = normalized.length ? edgeOffsets(normalized, diagram.nodes) : new Map<string, number>();
  const shown = new Map(normalized.filter(edge => edge.id.startsWith('preview:')).map(edge => [edge.id, edge]));
  const lines = bundle.map(key => {
    const ref = parseKey(key);
    const node = byId.get(ref.nodeId);
    const port = node ? findPort(node.data as unknown as Equipment, ref.portId) : null;
    const pair = pairs.get(key);
    const start = port ? anchorOf(node, pair?.fromHandle ?? handleFor(port, role)) : null;
    if (!start) return null;
    const edge = pair ? shown.get(`preview:${key}`) : undefined;
    const a = edge ? anchorOf(byId.get(edge.source), edge.sourceHandle) : null;
    const b = edge ? anchorOf(byId.get(edge.target), edge.targetHandle) : null;
    if (pair && a && b) {
      const color = colorOf(node, ref.portId);
      // 고리는 대상 장비 쪽 끝에 그린다
      const ring = a.nodeId === pair.to.nodeId ? a : b;
      return (
        <g key={key} className="bundle-line snapped">
          <path d={linePath(endOf(a), endOf(b), offsets.get(`preview:${key}`))} fill="none" stroke={color} strokeWidth={2} />
          <circle className="snap-ring" cx={ring.ax} cy={ring.ay} r={8} stroke={color} />
        </g>
      );
    }
    // 짝이 없다: 대상이 정해졌으면(모자람) 붉은 점선, 아직 대상이 없으면 포인터까지 점선
    const missing = Boolean(drop?.plan) || Boolean(drop?.blockedCode);
    return (
      <path key={key} className={`bundle-line${missing ? ' blocked' : ''}`} d={linePath(endOf(start), pointerEnd(endOf(start), toX, toY))}
        fill="none" stroke={missing ? BLOCKED : colorOf(node, ref.portId)} strokeWidth={2} strokeDasharray="6 4" />
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
  const startEnd: End = start ? endOf(start) : { x: fromX, y: fromY, side: 'right' };
  const path = linePath(startEnd, snapped ? endOf(snapped) : pointerEnd(startEnd, toX, toY));
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
