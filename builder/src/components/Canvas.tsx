// 캔버스. 연결 가능 여부·연결 생성은 엔진 규칙(store.canConnect·connect)으로 한다.
// ConnectionMode.Loose: 입력 단자에서 끌기 시작해도 된다. 방향은 엔진이 바로잡는다(기반명세 §7.1 0번).
// 조작(기반명세 §9): 왼쪽 드래그 = 범위 선택, 가운데 버튼·Space+왼쪽 드래그 = 화면 이동, 장비는 헤더·사진으로 옮긴다.
// 근접 연결: 포인터 아래 단자는 React Flow가 붙이고, 그 밖은 놓을 때 proximity.ts가 고른다(connectionRadius 0).
// 묶음 연결(B-20261006-06): 고른 단자 하나에서 끌기 시작하면 같은 종류의 고른 단자를 한꺼번에 잇는다(bundle.ts).
import { useCallback, useEffect, useMemo, useRef, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Background, ConnectionMode, Controls, ReactFlow, SelectionMode, useReactFlow, useStoreApi,
  type Connection, type Edge, type IsValidConnection, type Node, type OnConnectEnd, type OnConnectStart, type OnDelete,
} from '@xyflow/react';
import { parseHandle } from '../engine';
import { bundleFor } from '../bundle';
import { resolveBundleDrop } from '../bundleDrop';
import { pathSpacing } from '../edgeSpacing';
import { findDropTarget } from '../proximity';
import { markConnectEnd } from '../state/gesture';
import { builderStore, useBuilder } from '../state/useBuilder';
import { ConnectionLine } from './ConnectionLine';
import { EquipmentNode } from './EquipmentNode';
import { AnnotationNode, ShapeNode } from './NoteNodes';
import { UNIT_MIME } from './LibraryPanel';

const nodeTypes = { equipment: EquipmentNode, annotation: AnnotationNode, shape: ShapeNode };
// 화면 맞춤은 실제 크기(1배)보다 키우지 않는다. 빈 캔버스나 장비 한두 대가 최대 배율로 열리지 않게 한다
export const FIT_VIEW = { maxZoom: 1, padding: 0.2 };
const PAN_BUTTONS = [1];
// 이보다 덜 움직이고 놓으면 선 긋기가 아니라 클릭이다(기반명세 §9)
const CONNECTION_DRAG_THRESHOLD = 4;

const clientPoint = (event: MouseEvent | TouchEvent) => ('changedTouches' in event ? event.changedTouches[0] : event);
// 묶음 연결 알림의 짧은 이유(통합 기획 C1: "N개 중 M개 연결, 나머지 이유")
const BUNDLE_REASONS: Record<string, string> = {
  'no-slot': '대상 장비에 남은 단자 부족',
  'port-occupied': '이미 연결된 단자',
  'self-loop': '대상 장비 자신의 단자',
  'signal-mismatch': '신호 불일치',
  direction: '같은 방향',
  'power-disabled': '전원선',
  'port-missing': '단자 없음',
};
const reasonOf = (code: string) => BUNDLE_REASONS[code] ?? code;

export function Canvas() {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const onNodesChange = useBuilder(state => state.onNodesChange);
  const onEdgesChange = useBuilder(state => state.onEdgesChange);
  const canConnect = useBuilder(state => state.canConnect);
  const connect = useBuilder(state => state.connect);
  const addEquipment = useBuilder(state => state.addEquipment);
  const setNodeLabel = useBuilder(state => state.setNodeLabel);
  const removeElements = useBuilder(state => state.removeElements);
  const selectedEdgeIds = useBuilder(state => state.selectedEdgeIds);
  const flow = useReactFlow();
  const flowStore = useStoreApi();
  const boxStart = useRef<{ x: number; y: number } | null>(null);

  // 화면용 속성만 덧붙인다(저장할 때 엔진이 버린다). 영역은 장비 뒤에 깔고 제목 띠로만 끈다(안쪽 클릭 통과는 styles.css)
  const nodes = useMemo(() => diagram.nodes.map(node => {
    const view = { ...node } as unknown as Node;
    if (node.type === 'equipment') view.dragHandle = '.node-drag';
    if (node.type === 'shape') Object.assign(view, { zIndex: -1, dragHandle: '.shape-title', width: node.style?.width, height: node.style?.height });
    if (node.type === 'annotation') Object.assign(view, { width: node.style?.width, height: node.style?.height });
    return view;
  }), [diagram.nodes]);
  // 엣지 선택은 store.selectedEdgeIds에 둔다. React Flow가 강조·Delete·선택 해제를 하려면 selected가 엣지에 있어야 한다.
  // 같은 두 장비 사이 엣지는 꺾이는 위치를 띄워 평행하게 그린다(edgeSpacing.ts, 화면에만)
  const spacing = useMemo(() => pathSpacing(diagram.nodes, diagram.edges), [diagram.nodes, diagram.edges]);
  const edges = useMemo(() => {
    const selected = new Set(selectedEdgeIds);
    return diagram.edges.map(edge => {
      const view = { ...edge, label: edge.data.label, selected: selected.has(edge.id) } as unknown as Edge & { pathOptions?: object };
      const options = spacing.get(edge.id);
      if (options) view.pathOptions = options;
      return view as Edge;
    });
  }, [diagram.edges, selectedEdgeIds, spacing]);

  const isValidConnection = useCallback<IsValidConnection>(connection => canConnect(connection), [canConnect]);
  // 고른 단자에서 끌기 시작하면 묶음 연결이다. 묶음은 끌기를 시작할 때 한 번 정한다
  const onConnectStart = useCallback<OnConnectStart>((_, params) => {
    const parsed = parseHandle(params.handleId);
    const store = builderStore.getState();
    store.setBundle(params.nodeId && parsed ? bundleFor(store.diagram.nodes, store.selectedPorts, { nodeId: params.nodeId, portId: parsed.portId }) : null);
  }, []);
  // 묶음 연결 중에는 React Flow의 한 쌍 연결을 받지 않는다. 놓을 때(onConnectEnd) 묶음 전체를 잇는다
  const onConnect = useCallback((connection: Connection) => {
    if (builderStore.getState().bundle) return;
    connect(connection);
  }, [connect]);
  // 포인터 아래 단자가 맞으면 React Flow가 onConnect를 부른다. 아니면 근접 연결로 붙일 단자를 고르고,
  // 가까운 단자가 모두 막혔으면 막힌 이유를 알린다. 캔버스 밖(목록·패널 위)에서 놓으면 취소다
  const onConnectEnd = useCallback<OnConnectEnd>((event, state) => {
    markConnectEnd();
    const store = builderStore.getState();
    const bundle = store.bundle;
    if (bundle) store.setBundle(null);
    if (!state.fromHandle?.id || (!bundle && state.isValid)) return;
    const { clientX, clientY } = clientPoint(event);
    const bounds = flowStore.getState().domNode?.getBoundingClientRect();
    if (!bounds || clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom) return;
    const from = { nodeId: state.fromHandle.nodeId, handle: state.fromHandle.id, type: state.fromHandle.type };
    const point = flow.screenToFlowPosition({ x: clientX, y: clientY });
    if (bundle) {
      // 포인터 아래 단자는 끌고 있는 단자와 맞지 않아도 넘긴다(묶음의 다른 단자가 맞을 수 있다)
      const under = state.toHandle?.id ? { nodeId: state.toHandle.nodeId, handle: state.toHandle.id } : null;
      const drop = resolveBundleDrop(store, { bundle, from, under, point, zoom: flow.getZoom() });
      if (!drop.plan) {
        if (drop.blockedCode) store.notifyBlocked(drop.blockedCode);
        return;
      }
      // 쌍마다 React Flow와 같은 방향으로 넘긴다(받는 쪽 핸들에서 시작했으면 대상이 source)
      const result = store.connectMany(drop.plan.pairs.map(pair => (from.type === 'target'
        ? { source: pair.to.nodeId, sourceHandle: pair.toHandle, target: pair.from.nodeId, targetHandle: pair.fromHandle }
        : { source: pair.from.nodeId, sourceHandle: pair.fromHandle, target: pair.to.nodeId, targetHandle: pair.toHandle })));
      const codes = [...drop.plan.unmatched.map(item => item.code), ...result.failed];
      const reasons = [...new Set(codes)].map(reasonOf).join(', ');
      if (result.connected === bundle.length) store.notify({ text: `${result.connected}개를 한꺼번에 연결했습니다.`, tone: 'info' });
      else store.notify({ text: `${bundle.length}개 중 ${result.connected}개 연결했습니다. 나머지 ${bundle.length - result.connected}개: ${reasons}.`, tone: 'warn' });
      if (result.connected) store.selectPorts([]);
      return;
    }
    const target = findDropTarget({ nodes: store.diagram.nodes, fromNodeId: from.nodeId, point, zoom: flow.getZoom(), judge: store.connectionJudge(from) });
    if (target?.kind === 'connect') {
      // React Flow와 같은 방향으로 넘긴다: 받는 쪽 핸들에서 시작했으면 후보가 source다(양방향끼리는 이 순서가 엣지 방향)
      const candidate = { node: target.anchor.nodeId, handle: target.anchor.handle };
      store.connect(from.type === 'target'
        ? { source: candidate.node, sourceHandle: candidate.handle, target: from.nodeId, targetHandle: from.handle }
        : { source: from.nodeId, sourceHandle: from.handle, target: candidate.node, targetHandle: candidate.handle });
    } else if (target?.kind === 'blocked') {
      store.notifyBlocked(target.code);
    } else if (state.toHandle?.id) {
      // 출발 장비 자신의 단자 위에 놓은 경우 등: 그 단자가 막힌 이유를 알린다
      store.explainBlocked({ source: from.nodeId, sourceHandle: from.handle, target: state.toHandle.nodeId, targetHandle: state.toHandle.id });
    }
  }, [flow, flowStore]);
  // Delete 키: React Flow는 엣지 삭제와 노드 삭제를 따로 보낸다. 한 번의 실행 취소 단위로 묶는다
  const onDelete = useCallback<OnDelete>(({ nodes: removedNodes, edges: removedEdges }) => {
    removeElements(removedNodes.map(node => node.id), removedEdges.map(edge => edge.id));
  }, [removeElements]);

  // 범위 선택: 영역(shape)은 사각형 안에 다 들어온 것만 고른다. 걸치기만 해도 고르면 영역 안 장비를 고를 때 영역까지 딸려 온다
  const onSelectionStart = useCallback(() => {
    const rect = flowStore.getState().userSelectionRect;
    boxStart.current = rect ? { x: rect.startX, y: rect.startY } : null;
    builderStore.getState().setBoxSelecting(true);
  }, [flowStore]);
  const onSelectionEnd = useCallback((event: ReactMouseEvent) => {
    const start = boxStart.current;
    boxStart.current = null;
    const end = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    if (!start) { builderStore.getState().setBoxSelecting(false); return; }
    builderStore.getState().finishBoxSelection({ x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) });
  }, [flow]);

  // Esc: 고른 단자를 모두 푼다(입력 칸에서는 그대로 둔다)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== 'Escape' || (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      builderStore.getState().selectPorts([]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 메모·영역은 두 번 눌러 글을 바꾼다(구 Builder 기본 문구가 이 동작을 안내한다)
  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    if (node.type === 'equipment') return;
    const label = window.prompt(node.type === 'shape' ? '영역 이름' : '메모 내용', String(node.data.label ?? ''));
    if (label !== null) setNodeLabel(node.id, label);
  }, [setNodeLabel]);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const unitId = event.dataTransfer.getData(UNIT_MIME);
    const entry = unitId ? library?.units.get(unitId) : null;
    if (!entry) return;
    addEquipment(entry.equipment, flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }, [library, addEquipment, flow]);

  return (
    <div
      className="canvas"
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
      onDrop={onDrop}
      // 가운데 버튼은 화면 이동이다. 브라우저의 자동 스크롤이 끼어들지 않게 막는다.
      // d3-zoom이 가운데 버튼 누름의 전파를 멈추므로 캡처 단계에서 막는다
      onMouseDownCapture={event => { if (event.button === 1) event.preventDefault(); }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onPaneClick={() => builderStore.getState().selectPorts([])}
        onDelete={onDelete}
        onNodeDoubleClick={onNodeDoubleClick}
        onSelectionStart={onSelectionStart}
        onSelectionEnd={onSelectionEnd}
        zoomOnDoubleClick={false}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={0}
        connectionDragThreshold={CONNECTION_DRAG_THRESHOLD}
        connectOnClick={false}
        connectionLineComponent={ConnectionLine}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={PAN_BUTTONS}
        panActivationKeyCode="Space"
        defaultEdgeOptions={{ type: 'smoothstep' }}
        deleteKeyCode={['Delete', 'Backspace']}
        minZoom={0.05}
        maxZoom={2}
        fitView
        fitViewOptions={FIT_VIEW}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#e2e8f0" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
