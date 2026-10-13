// builder/engine(의존성 없는 JS 모듈)을 앱에서 타입과 함께 쓰기 위한 얇은 감싸개.
// 규칙과 형식은 모두 엔진에 있다. 여기서는 타입만 붙인다.
import * as A from '../engine/audio.mjs';
import * as D from '../engine/defaults.mjs';
import * as DG from '../engine/diagram.mjs';
import * as G from '../engine/geometry.mjs';
import * as I from '../engine/issues.mjs';
import * as IR from '../engine/io-request.mjs';
import * as L from '../engine/library.mjs';
import * as N from '../engine/normalize.mjs';
import * as P from '../engine/ports.mjs';
import * as R from '../engine/rules.mjs';
import * as S from '../engine/serialize.mjs';
import * as VA from '../engine/validate.mjs';

export type Direction = 'in' | 'out' | 'both';
export interface Port {
  id: string;
  label: string;
  type: string;
  direction: Direction;
  connector: string;
  signals: string[];
  verification?: string;
  // ioIndex·direction·quantity: 라이브러리 1.2.0(B-20261013-02). 구성도 파일에는 group·connector·signal만 저장한다
  portalIo?: { group: string; connector: string; signal: string; ioIndex?: number; direction?: string; quantity?: string };
  // 구성도에서 고친 단자(B-20261013-01): 사용자가 추가한 단자는 origin 'user', 라이브러리 단자를 고쳤으면 edited
  origin?: 'user';
  edited?: boolean;
}
export interface Portal { productId: string; source: 'portal' | 'rtcom'; unit?: 'tx' | 'rx'; variant?: string; detailUrl: string }
export interface Equipment {
  id: string;
  category: string;
  name: string;
  model: string;
  manufacturer?: string;
  description?: string;
  series?: string;
  inputs: Port[];
  outputs: Port[];
  bidirectional: Port[];
  imageUrl?: string;
  portal: Portal;
}
export interface QuoteOption { id: string; model: string; name?: string; manufacturer?: string }
export interface EquipmentData extends Equipment { isReused: boolean; portsEdited?: boolean; userPortSeq?: number; systemName?: string; selectedOptionQuantities?: Record<string, number>; optionPortIds?: string[] }
export interface LineType { id: string; name: string; color: string }
export interface BomRow { cableType: 'ready-made' | 'manufactured'; productName: string; lineTypeId?: string; length?: number; quantity?: number }
export interface DiagramNode {
  id: string;
  type: 'equipment' | 'annotation' | 'shape';
  position: { x: number; y: number };
  // 장비면 EquipmentData, 메모·영역이면 서식 필드
  data: Record<string, unknown>;
  style?: { width: number; height: number };
  [key: string]: unknown;
}
export interface DiagramEdge {
  id: string;
  type: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  animated?: boolean;
  style: { stroke?: string; strokeWidth?: number };
  data: { lineTypeId: string; signal?: string; label?: string; bomRows?: BomRow[] };
  [key: string]: unknown;
}
export interface Diagram {
  version: '1.2';
  options?: QuoteOption[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  lineTypes: LineType[];
  equipmentDB: Equipment[];
  generator: { app: string; version: string };
  library: { schemaVersion: string; source: Record<string, string> } | null;
  issues: Issue[];
}
export interface Issue { code: string; severity: 'warning' | 'info'; target: { node?: string; edge?: string; port?: string }; detail?: string }
export interface ValidationError { code: string; path?: string; target?: Issue['target']; detail?: string }
export interface Rules { lineTypes: LineType[]; connectorWildcards: Record<string, string[] | '*'>; connectorEquivalents: string[][]; levelPairs: string[][] }
// slots·card: 라이브러리 1.1.0(B-20261013-03)의 프레임 슬롯·카드 장착 정보. 배치 단위에 붙고 장비(equipment)·노드 data에는 들어가지 않는다
export interface LibraryUnit { unitId: string; unit?: 'tx' | 'rx'; variant?: string; equipment: Equipment; slots?: Record<string, unknown>; card?: Record<string, unknown> }
export interface LibraryProduct {
  productId: string;
  source: 'portal' | 'rtcom';
  brand: string;
  product: string;
  categories: string[];
  detailUrl: string;
  imageUrl?: string;
  placeable: boolean;
  units: LibraryUnit[];
  readiness: { ioRows: number; ports: number; unresolvedRows: number; nonPortRows: number };
}
// 라이브러리 어휘(beta/builder-library.mjs vocabularyBlock). 장비 설정 창이 커넥터·신호 목록으로 쓴다
export interface VocabularySignal { id: string; label: string; lineType: string; symmetric?: boolean }
export interface Vocabulary { version?: string; signals?: VocabularySignal[]; connectors?: string[] }
export interface Library { schema: string; schemaVersion: string; source: Record<string, string>; lineTypes: LineType[]; vocabulary?: Vocabulary; products: LibraryProduct[] }
export interface LibraryIndex {
  library: Library;
  schemaVersion: string;
  source: Record<string, string>;
  units: Map<string, { product: LibraryProduct; unit: LibraryUnit; equipment: Equipment }>;
  products: Map<string, LibraryProduct>;
  rules: Rules;
}
export interface IdFactory { node(): string; annotation(): string; shape(): string; edge(source: string, target: string): string }
export interface PortRef { nodeId: string; port: Port }
// 단자에 선이 붙는 점(노드 왼쪽 위 기준). handle은 React Flow 핸들 ID(양방향은 source_/target_ 접두어)
export interface PortAnchor { portId: string; handle: string; side: 'left' | 'right'; x: number; y: number }
export interface Judgement { allowed: boolean; code?: string; source: PortRef; target: PortRef; flipped: boolean; signal?: string; lineTypeId?: string; findings?: Issue[] }

export const DEFAULT_RULES = D.DEFAULT_RULES as unknown as Rules;
export const createIdFactory = DG.createIdFactory as (options?: { seed?: number; now?: number }) => IdFactory;
export const createDiagram = DG.createDiagram as (options?: { library?: LibraryIndex | null; generatorVersion?: string }) => Diagram;
export const addEquipmentNode = DG.addEquipmentNode as (diagram: Diagram, equipment: Equipment, options?: { position?: { x: number; y: number }; isReused?: boolean; ids?: IdFactory }) => DiagramNode;
export const addAnnotationNode = DG.addAnnotationNode as (diagram: Diagram, options?: { position?: { x: number; y: number }; label?: string; ids?: IdFactory }) => DiagramNode;
export const addShapeNode = DG.addShapeNode as (diagram: Diagram, options?: { position?: { x: number; y: number }; label?: string; ids?: IdFactory }) => DiagramNode;
export const connectPorts = DG.connectPorts as (diagram: Diagram, from: { nodeId: string; portId: string }, to: { nodeId: string; portId: string }, options?: { ids?: IdFactory; rules?: Rules; powerEnabled?: boolean }) => { ok: boolean; code?: string; edge?: DiagramEdge; judgement?: Judgement };
export const setEdgeCable = DG.setEdgeCable as (diagram: Diagram, edgeId: string, rows: BomRow[]) => DiagramEdge;
export const setEdgeLabel = DG.setEdgeLabel as (diagram: Diagram, edgeId: string, label: string) => DiagramEdge;
export const occupiedPorts = DG.occupiedPorts as (diagram: Diagram, options?: { exceptEdgeId?: string | null }) => Set<string>;
export const createLibraryIndex = L.createLibraryIndex as (library: Library) => LibraryIndex;
export const findPort = L.findPort as (data: Equipment, portId: string) => Port | null;
export const equipmentPorts = L.equipmentPorts as (data: Equipment) => Port[];
export const judgeConnection = R.judgeConnection as (from: PortRef, to: PortRef, options?: { occupied?: (nodeId: string, portId: string) => boolean; powerEnabled?: boolean; rules?: Rules }) => Judgement;
// 오디오 단자 배지·추천 케이블(B-20261013-05)
export const audioPortTags = A.audioPortTags as (port: Port) => { connector: string | null; level: string } | null;
export const audioCable = A.audioCable as (source: Port, target: Port, signal?: string) => { kind: 'analog' | 'digital' | 'speaker'; name: string; balanced?: boolean } | null;
export const sourceHandleOf = R.sourceHandleOf as (port: Port) => string;
export const targetHandleOf = R.targetHandleOf as (port: Port) => string;
export const parseHandle = R.parseHandle as (handle: string | null | undefined) => { portId: string; role: 'source' | 'target' | null } | null;
export const serializeDiagram = S.serializeDiagram as (diagram: Diagram, options?: { library?: LibraryIndex | null }) => string;
export const normalizeDiagram = S.normalizeDiagram as unknown as (diagram: Diagram, options?: { library?: LibraryIndex | null }) => Diagram;
export const validateDiagram = VA.validateDiagram as (diagram: unknown, options?: { library?: LibraryIndex | null }) => { errors: ValidationError[]; issues: Issue[] };
export const bomRowProblem = VA.bomRowProblem as (row: unknown) => { field: string; detail: string } | null;
// 단자 편집(B-20261013-01). lists의 단자는 { id?, label, connector, signals }이며 id가 없으면 새 사용자 단자다
export interface PortDraft { id?: string; label: string; connector: string; signals: string[] }
export interface PortLists<T = PortDraft> { inputs: T[]; outputs: T[]; bidirectional: T[] }
export interface PortEditOptions { removeEdges?: boolean; rules?: Rules; powerEnabled?: boolean; signalVocabulary?: VocabularySignal[]; libraryEquipment?: Equipment | null }
export interface PortEditResult { ok: boolean; code?: string; detail?: string; removedEdgeIds: string[]; changed?: boolean }
export const updateEquipmentPorts = P.updateEquipmentPorts as (diagram: Diagram, nodeId: string, lists: PortLists, options?: PortEditOptions) => PortEditResult;
export const resetEquipmentPorts = P.resetEquipmentPorts as (diagram: Diagram, nodeId: string, libraryEquipment: Equipment | null | undefined, options?: PortEditOptions) => PortEditResult;
export const portLineType = P.portLineType as (connector: string, signals: string[], signalVocabulary?: VocabularySignal[]) => string | null;
export const nextPortLabels = P.nextPortLabels as (list: { label?: string }[], signalLabel: string, direction: Direction, count: number) => string[];
export const PORT_DIRECTION_LABELS = P.DIRECTION_LABELS as Readonly<Record<Direction, string>>;
export const computeIssues = I.computeIssues as (diagram: Diagram, options?: { library?: LibraryIndex | null; rules?: Rules }) => Issue[];
// 메모·영역 data에 둘 수 있는 서식 키(1.1과 같다). 그 밖의 키는 저장할 때 버려진다
export const ANNOTATION_DATA_KEYS = N.ANNOTATION_DATA_KEYS as readonly string[];
export const SHAPE_DATA_KEYS = N.SHAPE_DATA_KEYS as readonly string[];
export const geometry = {
  NODE_WIDTH: G.NODE_WIDTH as number,
  NODE_HEADER_HEIGHT: G.NODE_HEADER_HEIGHT as number,
  NODE_PADDING: G.NODE_PADDING as number,
  NODE_IMAGE_HEIGHT: G.NODE_IMAGE_HEIGHT as number,
  PORT_ROW_HEIGHT: G.PORT_ROW_HEIGHT as number,
  PORT_ROW_GAP: G.PORT_ROW_GAP as number,
  IO_BIDI_GAP: G.IO_BIDI_GAP as number,
  BIDI_LABEL_HEIGHT: G.BIDI_LABEL_HEIGHT as number,
  HANDLE_SIZE: G.HANDLE_SIZE as number,
  HANDLE_OUTSET: G.HANDLE_OUTSET as number,
  nodeHeight: G.nodeHeight as (data: Equipment) => number,
  portAnchors: G.portAnchors as (data: Equipment) => PortAnchor[],
};

// Portal 반영 요청(B-20261013-02). 장비 설정 창이 고친 단자를 Portal io 행 변경으로 묶어 파일로 내려받는다
export interface IoRow { group: string; connector: string; signal: string; direction: string; quantity: string }
export type IoChange =
  | { op: 'add'; row: IoRow; reason: string }
  | { op: 'update'; ioIndex: number; before: IoRow; after: IoRow; reason: string }
  | { op: 'remove'; ioIndex: number; before: IoRow; reason: string };
export interface IoRequest {
  schema: 'av-portal.builder-io-request';
  schemaVersion: '1.0.0';
  productId: string;
  source: 'portal' | 'rtcom';
  unitId: string;
  model?: string;
  createdAt?: string;
  library: { catalogSha: string; detailSetSha: string; rtcomSha?: string };
  changes: IoChange[];
}
// code: label(이름만 바꿈) · override(개별 지정 행) · override-shift(행 삭제가 개별 지정 번호를 밀어냄) · not-representable(Portal 원문으로 나타낼 수 없음)
export interface IoNotReflected { code: 'label' | 'override' | 'override-shift' | 'not-representable'; ports: string[]; detail?: string }
export interface IoRequestPort { id?: string; label: string; connector: string; signals: string[]; origin?: 'user'; reason?: string }
export interface IoRequestResult { ok: boolean; code?: 'library-missing' | 'library-old' | 'library-changed'; detail?: string; request: IoRequest | null; notReflected: IoNotReflected[] }
export const buildIoRequest = IR.buildIoRequest as (input: { lists: PortLists<IoRequestPort>; data: Pick<EquipmentData, 'model' | 'portal'>; libraryEquipment: Equipment | null; librarySource?: Record<string, string>; signalVocabulary?: VocabularySignal[]; createdAt?: string }) => IoRequestResult;
export const ioRequestFileName = IR.ioRequestFileName as (productId: string, date?: Date) => string;
export const serializeIoRequest = IR.serializeIoRequest as (request: IoRequest) => string;
export const validateIoRequest = IR.validateIoRequest as (request: unknown) => string[];
