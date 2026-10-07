// 캔버스. 연결 가능 여부·연결 생성은 엔진 규칙(store.canConnect·connect)으로 한다.
// ConnectionMode.Loose: 입력 단자에서 끌기 시작해도 된다. 방향은 엔진이 바로잡는다(기반명세 §7.1 0번).
import { useCallback, useMemo, type DragEvent } from 'react';
import { Background, ConnectionMode, Controls, ReactFlow, useReactFlow, type Edge, type IsValidConnection, type Node, type OnConnectEnd, type OnDelete } from '@xyflow/react';
import { useBuilder } from '../state/useBuilder';
import { EquipmentNode } from './EquipmentNode';
import { AnnotationNode, ShapeNode } from './NoteNodes';
import { UNIT_MIME } from './LibraryPanel';

const nodeTypes = { equipment: EquipmentNode, annotation: AnnotationNode, shape: ShapeNode };
// 화면 맞춤은 실제 크기(1배)보다 키우지 않는다. 빈 캔버스나 장비 한두 대가 최대 배율로 열리지 않게 한다
export const FIT_VIEW = { maxZoom: 1, padding: 0.2 };

export function Canvas() {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const onNodesChange = useBuilder(state => state.onNodesChange);
  const onEdgesChange = useBuilder(state => state.onEdgesChange);
  const canConnect = useBuilder(state => state.canConnect);
  const connect = useBuilder(state => state.connect);
  const addEquipment = useBuilder(state => state.addEquipment);
  const setNodeLabel = useBuilder(state => state.setNodeLabel);
  const explainBlocked = useBuilder(state => state.explainBlocked);
  const removeElements = useBuilder(state => state.removeElements);
  const selectedEdgeId = useBuilder(state => state.selectedEdgeId);
  const flow = useReactFlow();

  // 화면용 속성만 덧붙인다(저장할 때 엔진이 버린다). 영역은 장비 뒤에 깔고 제목 띠로만 끈다(안쪽 클릭 통과는 styles.css)
  const nodes = useMemo(() => diagram.nodes.map(node => {
    const view = { ...node } as unknown as Node;
    if (node.type === 'shape') Object.assign(view, { zIndex: -1, dragHandle: '.shape-title', width: node.style?.width, height: node.style?.height });
    if (node.type === 'annotation') Object.assign(view, { width: node.style?.width, height: node.style?.height });
    return view;
  }), [diagram.nodes]);
  // 엣지 선택은 store의 selectedEdgeId 하나로 둔다. React Flow가 강조·Delete·선택 해제를 하려면 selected가 엣지에 있어야 한다
  const edges = useMemo(() => diagram.edges.map(edge => ({ ...edge, label: edge.data.label, selected: edge.id === selectedEdgeId }) as unknown as Edge), [diagram.edges, selectedEdgeId]);

  const isValidConnection = useCallback<IsValidConnection>(connection => canConnect(connection), [canConnect]);
  // 막힌 연결은 onConnect가 불리지 않는다. 단자 위에 놓았으면 이유를 알린다
  const onConnectEnd = useCallback<OnConnectEnd>((_, state) => {
    if (state.isValid || !state.fromHandle || !state.toHandle) return;
    explainBlocked({ source: state.fromHandle.nodeId, sourceHandle: state.fromHandle.id, target: state.toHandle.nodeId, targetHandle: state.toHandle.id });
  }, [explainBlocked]);
  // Delete 키: React Flow는 엣지 삭제와 노드 삭제를 따로 보낸다. 한 번의 실행 취소 단위로 묶는다
  const onDelete = useCallback<OnDelete>(({ nodes: removedNodes, edges: removedEdges }) => {
    removeElements(removedNodes.map(node => node.id), removedEdges.map(edge => edge.id));
  }, [removeElements]);

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
    <div className="canvas" onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onConnectEnd={onConnectEnd}
        onDelete={onDelete}
        onNodeDoubleClick={onNodeDoubleClick}
        zoomOnDoubleClick={false}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
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
