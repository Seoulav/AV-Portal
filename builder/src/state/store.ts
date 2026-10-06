// Builder 상태. 구성도는 엔진 형식(1.2) 그대로 들고 있고, 바꾸는 일은 모두 엔진 함수로 한다.
// React 없이도 쓸 수 있게 zustand/vanilla로 만든다(시험에서 직접 쓴다).
import { applyNodeChanges, type EdgeChange, type NodeChange, type Node } from '@xyflow/react';
import { createStore } from 'zustand/vanilla';
import {
  DEFAULT_RULES, addAnnotationNode, addEquipmentNode, addShapeNode, connectPorts, createDiagram, createIdFactory, findPort,
  judgeConnection, occupiedPorts, parseHandle, serializeDiagram, setEdgeCable, setEdgeLabel, validateDiagram,
  type BomRow, type Diagram, type Equipment, type IdFactory, type LibraryIndex, type Rules, type ValidationError,
} from '../engine';

export const HISTORY_LIMIT = 50;

// 연결이 막힌 이유(엔진 판정 코드 → 화면 문구)
export const BLOCK_REASONS: Record<string, string> = {
  'port-occupied': '이미 연결된 단자입니다. 단자 하나에는 선 하나만 연결합니다.',
  'self-loop': '같은 장비의 단자끼리는 연결할 수 없습니다.',
  'signal-mismatch': '두 단자의 신호가 맞지 않습니다.',
  direction: '같은 방향의 단자끼리는 연결할 수 없습니다(입력↔입력, 출력↔출력).',
  'power-disabled': '전원선은 아직 그리지 않습니다.',
  'port-missing': '단자를 찾을 수 없습니다.',
};

// 같은 자리에 연달아 넣으면 겹치므로, 그 자리에 노드가 있으면 오른쪽 옆으로 비켜 놓는다(장비 폭 220 + 간격 60)
export const PLACE_STEP = 280;
export function freePosition(nodes: { position: { x: number; y: number } }[], position: { x: number; y: number }) {
  let next = { ...position };
  while (nodes.some(node => Math.abs(node.position.x - next.x) < PLACE_STEP && Math.abs(node.position.y - next.y) < 40)) {
    next = { x: next.x + PLACE_STEP, y: next.y };
  }
  return next;
}

export interface Notice { text: string; tone: 'info' | 'warn' | 'error' }
export interface ConnectionLike { source: string | null; sourceHandle?: string | null; target: string | null; targetHandle?: string | null }

export interface BuilderState {
  library: LibraryIndex | null;
  diagram: Diagram;
  past: string[];
  future: string[];
  selectedEdgeId: string | null;
  notice: Notice | null;
  dragging: boolean;
  setLibrary(library: LibraryIndex): void;
  addEquipment(equipment: Equipment, position: { x: number; y: number }): string;
  addAnnotation(position: { x: number; y: number }): void;
  addShape(position: { x: number; y: number }): void;
  onNodesChange(changes: NodeChange[]): void;
  onEdgesChange(changes: EdgeChange[]): void;
  canConnect(connection: ConnectionLike): boolean;
  connect(connection: ConnectionLike): boolean;
  setNodeLabel(nodeId: string, label: string): void;
  setCable(edgeId: string, rows: BomRow[]): void;
  setLabel(edgeId: string, label: string): void;
  deleteEdge(edgeId: string): void;
  selectEdge(edgeId: string | null): void;
  undo(): void;
  redo(): void;
  newDiagram(): void;
  importText(text: string): { ok: boolean; errors: ValidationError[] };
  exportText(): string;
  notify(notice: Notice | null): void;
}

// 히스토리에는 구성도의 의미 있는 부분만 담는다(선택·드래그 같은 화면 상태는 빼고)
const snapshot = (diagram: Diagram) => JSON.stringify({
  nodes: diagram.nodes.map(({ selected: _s, dragging: _d, ...node }) => node),
  edges: diagram.edges.map(({ selected: _s, ...edge }) => edge),
});
const copy = (diagram: Diagram): Diagram => ({ ...diagram, nodes: [...diagram.nodes], edges: [...diagram.edges] });
const rulesOf = (library: LibraryIndex | null): Rules => library?.rules ?? DEFAULT_RULES;
const portOf = (diagram: Diagram, nodeId: string | null, handle: string | null | undefined) => {
  const node = diagram.nodes.find(item => item.id === nodeId);
  const parsed = parseHandle(handle);
  if (!node || node.type !== 'equipment' || !parsed) return null;
  const port = findPort(node.data as unknown as Equipment, parsed.portId);
  return port ? { nodeId: node.id, port } : null;
};

export function createBuilderStore({ ids = createIdFactory(), initial = null as Diagram | null } = {}) {
  return createStore<BuilderState>()((set, get) => {
    // 구조를 바꾸기 직전에 부른다: 지금 상태를 past에 넣고 future를 비운다
    const remember = () => {
      const { diagram, past } = get();
      set({ past: [...past, snapshot(diagram)].slice(-HISTORY_LIMIT), future: [] });
    };
    const restore = (text: string) => {
      const { nodes, edges } = JSON.parse(text) as Pick<Diagram, 'nodes' | 'edges'>;
      return { ...get().diagram, nodes, edges };
    };
    return {
      library: null,
      diagram: initial ?? createDiagram(),
      past: [],
      future: [],
      selectedEdgeId: null,
      notice: null,
      dragging: false,

      setLibrary(library) {
        const { diagram } = get();
        // 아직 라이브러리 출처가 없는 구성도(새 구성도)에는 이번 라이브러리를 적는다
        const next = diagram.library ? diagram : { ...diagram, library: { schemaVersion: library.schemaVersion, source: { ...library.source } } };
        set({ library, diagram: next });
      },

      addEquipment(equipment, position) {
        remember();
        const next = copy(get().diagram);
        const node = addEquipmentNode(next, equipment, { position, ids });
        set({ diagram: next });
        return node.id;
      },
      addAnnotation(position) {
        remember();
        const next = copy(get().diagram);
        addAnnotationNode(next, { position, ids });
        set({ diagram: next });
      },
      addShape(position) {
        remember();
        const next = copy(get().diagram);
        addShapeNode(next, { position, ids });
        set({ diagram: next });
      },

      onNodesChange(changes) {
        const { diagram, dragging } = get();
        const structural = changes.some(change => change.type === 'remove');
        const dragStart = changes.some(change => change.type === 'position' && change.dragging) && !dragging;
        const dragEnd = changes.some(change => change.type === 'position' && change.dragging === false);
        if (structural || dragStart) remember();
        const nodes = applyNodeChanges(changes, diagram.nodes as unknown as Node[]) as unknown as Diagram['nodes'];
        const removed = new Set(changes.filter(change => change.type === 'remove').map(change => (change as { id: string }).id));
        const edges = removed.size ? diagram.edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target)) : diagram.edges;
        set({ diagram: { ...diagram, nodes, edges }, dragging: dragStart ? true : dragEnd ? false : dragging });
      },

      onEdgesChange(changes) {
        const { diagram, selectedEdgeId } = get();
        const removed = new Set(changes.filter(change => change.type === 'remove').map(change => change.id));
        let selected = selectedEdgeId;
        for (const change of changes) if (change.type === 'select') selected = change.selected ? change.id : selected === change.id ? null : selected;
        if (removed.size) {
          remember();
          set({ diagram: { ...get().diagram, edges: diagram.edges.filter(edge => !removed.has(edge.id)) }, selectedEdgeId: selected && removed.has(selected) ? null : selected });
          return;
        }
        set({ selectedEdgeId: selected });
      },

      canConnect(connection) {
        const { diagram, library } = get();
        const from = portOf(diagram, connection.source, connection.sourceHandle);
        const to = portOf(diagram, connection.target, connection.targetHandle);
        if (!from || !to) return false;
        const used = occupiedPorts(diagram);
        return judgeConnection(from, to, { occupied: (nodeId, portId) => used.has(`${nodeId}::${portId}`), rules: rulesOf(library) }).allowed;
      },

      connect(connection) {
        const { diagram, library } = get();
        const from = parseHandle(connection.sourceHandle);
        const to = parseHandle(connection.targetHandle);
        if (!connection.source || !connection.target || !from || !to) return false;
        const next = copy(diagram);
        const result = connectPorts(next, { nodeId: connection.source, portId: from.portId }, { nodeId: connection.target, portId: to.portId }, { ids, rules: rulesOf(library) });
        if (!result.ok) {
          set({ notice: { text: BLOCK_REASONS[result.code ?? ''] ?? `연결할 수 없습니다(${result.code}).`, tone: 'warn' } });
          return false;
        }
        remember();
        const findings = result.judgement?.findings ?? [];
        set({
          diagram: next,
          notice: findings.length ? { text: `연결했습니다. 확인할 점: ${findings.map(item => item.code).join(', ')}`, tone: 'info' } : null,
        });
        return true;
      },

      // 메모·영역의 글만 바꾼다(서식 편집은 P5). 장비 노드는 Portal 데이터라 고치지 않는다
      setNodeLabel(nodeId, label) {
        const { diagram } = get();
        const node = diagram.nodes.find(item => item.id === nodeId);
        if (!node || node.type === 'equipment' || node.data.label === label) return;
        remember();
        set({ diagram: { ...diagram, nodes: diagram.nodes.map(item => (item.id === nodeId ? { ...item, data: { ...item.data, label } } : item)) } });
      },
      setCable(edgeId, rows) {
        remember();
        const next = copy(get().diagram);
        next.edges = next.edges.map(edge => (edge.id === edgeId ? { ...edge, data: { ...edge.data } } : edge));
        setEdgeCable(next, edgeId, rows);
        set({ diagram: next });
      },
      setLabel(edgeId, label) {
        remember();
        const next = copy(get().diagram);
        next.edges = next.edges.map(edge => (edge.id === edgeId ? { ...edge, data: { ...edge.data } } : edge));
        setEdgeLabel(next, edgeId, label);
        set({ diagram: next });
      },
      deleteEdge(edgeId) {
        remember();
        const { diagram } = get();
        set({ diagram: { ...diagram, edges: diagram.edges.filter(edge => edge.id !== edgeId) }, selectedEdgeId: null });
      },
      selectEdge(edgeId) { set({ selectedEdgeId: edgeId }); },

      undo() {
        const { past, future, diagram } = get();
        if (!past.length) return;
        set({ diagram: restore(past[past.length - 1]), past: past.slice(0, -1), future: [snapshot(diagram), ...future].slice(0, HISTORY_LIMIT), selectedEdgeId: null });
      },
      redo() {
        const { past, future, diagram } = get();
        if (!future.length) return;
        set({ diagram: restore(future[0]), future: future.slice(1), past: [...past, snapshot(diagram)].slice(-HISTORY_LIMIT), selectedEdgeId: null });
      },

      newDiagram() {
        remember();
        const { library } = get();
        set({ diagram: createDiagram({ library }), selectedEdgeId: null, notice: null });
      },

      importText(text) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text.replace(/^﻿/, ''));
        } catch {
          return { ok: false, errors: [{ code: 'json', detail: 'JSON 형식이 아닙니다.' }] };
        }
        const { errors } = validateDiagram(parsed, { library: get().library });
        if (errors.length) return { ok: false, errors };
        remember();
        set({ diagram: parsed as Diagram, selectedEdgeId: null });
        return { ok: true, errors: [] };
      },
      exportText() {
        const { diagram, library } = get();
        return serializeDiagram(diagram, { library });
      },
      notify(notice) { set({ notice }); },
    };
  });
}

export type BuilderStore = ReturnType<typeof createBuilderStore>;
export type { IdFactory };
