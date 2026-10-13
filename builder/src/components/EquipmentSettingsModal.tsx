// 장비 설정 창(B-20261013-01, 구 Builder EditNodeModal 이식). 장비 노드를 두 번 누르면 열린다.
// 이 구성도의 이 노드만 고친다. Portal 데이터·라이브러리는 바뀌지 않는다(통합 기획 §8 "장비 DB 편집 폐기" 유지).
// 모든 탭의 값은 창 안의 초안이고, "적용"을 누를 때 실행 취소 한 단계로 반영한다. Esc·바깥 클릭·취소는 아무것도 바꾸지 않는다.
// 지우거나 바꾼 단자에 걸린 연결이 규칙에 맞지 않게 되면 "연결 n개도 함께 지웁니다"를 확인받은 뒤에만 적용한다.
// 단자 탭의 "적용하고 Portal 반영 요청 내보내기"(B-20261013-02)는 고친 단자를 Portal io 행 변경으로 묶어 보여 주고,
// 근거를 받은 뒤 적용과 함께 요청 파일을 내려받는다. 저장소에서 node beta/apply-builder-io-request.mjs로 적용한다.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { PORT_DIRECTION_LABELS, buildIoRequest, ioRequestFileName, nextPortLabels, parseHandle, serializeIoRequest, type Direction, type EquipmentData, type IoChange, type IoNotReflected, type IoRequest, type IoRequestPort, type Port, type PortLists, type VocabularySignal } from '../engine';
import { optionIdOf } from '../state/store';
import { useBuilder } from '../state/useBuilder';

type ListKey = keyof PortLists;
// 초안 단자. key는 화면 목록용(저장하지 않는다). id가 없으면 새로 추가한 단자다
// reason: Portal 반영 요청의 근거(자료명·쪽). 구성도에는 저장하지 않는다
interface DraftPort { key: string; id?: string; label: string; connector: string; signals: string[]; origin?: 'user'; edited?: boolean; reason?: string }
type Draft = PortLists<DraftPort>;

const SECTIONS: { list: ListKey; direction: Direction; title: string }[] = [
  { list: 'inputs', direction: 'in', title: '입력' },
  { list: 'outputs', direction: 'out', title: '출력' },
  { list: 'bidirectional', direction: 'both', title: '양방향' },
];
const MAX_ADD = 32;

// 엔진 결과 코드 → 화면 문구
const PROBLEMS: Record<string, string> = {
  'port-invalid': '단자 이름·커넥터·신호를 모두 채워 주세요',
  'signal-unknown': '라이브러리에 없는 신호입니다',
  'duplicate-port-id': '같은 단자가 두 번 들어 있습니다',
  'port-unknown': '없는 단자입니다',
  'library-missing': '라이브러리에서 이 장비를 찾지 못해 되돌릴 수 없습니다',
  'quote-invalid': '옵션 품목과 수량을 확인해 주세요',
  'node-missing': '장비를 찾지 못했습니다',
};

// Portal 반영 요청을 만들 수 없을 때(B-20261013-02)
const EXPORT_PROBLEMS: Record<string, string> = {
  'library-missing': '라이브러리에서 이 장비를 찾지 못해 Portal 반영 요청을 만들 수 없습니다',
  'library-old': '라이브러리가 오래되어(1.2.0 미만) 단자의 원본 행을 알 수 없습니다. 새로 고친 뒤 다시 시도해 주세요',
  'library-changed': '라이브러리가 바뀌어 원본 행을 찾지 못한 단자가 있습니다. "라이브러리 값으로 되돌리기" 뒤 다시 고쳐 주세요',
  'unit-unsupported': 'TX/RX·시리즈로 나뉜 장비는 아직 Portal 반영 요청을 만들 수 없습니다',
};
const NOT_REFLECTED: Record<IoNotReflected['code'], string> = {
  label: '이름은 Portal 행에서 자동으로 매겨져 반영하지 않습니다',
  override: '개별 지정 행이라 생성기 표와 함께 따로 고칩니다',
  'override-shift': '이 행을 지우면 뒤 행의 개별 지정 번호가 밀려 지우지 않습니다',
  'not-representable': 'Portal 원문으로 나타낼 수 없는 값입니다(예: AVB, PoE를 주 신호로, 대칭 신호의 한 방향)',
};
const rowText = (row: { group: string; connector: string; signal: string; direction: string; quantity: string }) => `${row.group} · ${row.connector} · ${row.signal} · ${row.direction} · ${row.quantity}`;
const changeText = (change: IoChange) => {
  if (change.op === 'add') return `추가: ${rowText(change.row)}`;
  if (change.op === 'remove') return `삭제 ${change.ioIndex + 1}행: ${rowText(change.before)}`;
  return `변경 ${change.ioIndex + 1}행: ${rowText(change.before)} → ${rowText(change.after)}`;
};
const downloadText = (text: string, name: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

let keySeq = 0;
const draftOf = (ports: Port[]): DraftPort[] => ports.map(port => ({ key: `k${(keySeq += 1)}`, id: port.id, label: port.label, connector: port.connector, signals: [...port.signals], origin: port.origin, edited: port.edited }));
const draftLists = (data: Pick<EquipmentData, ListKey>): Draft => ({ inputs: draftOf(data.inputs ?? []), outputs: draftOf(data.outputs ?? []), bidirectional: draftOf(data.bidirectional ?? []) });
// 신호에 맞는 기본 커넥터: 신호와 같은 이름의 커넥터가 있으면 그것, 아니면 UNKNOWN
const defaultConnector = (signal: string, connectors: string[]) => (connectors.includes(signal) ? signal : 'UNKNOWN');

export function EquipmentSettingsModal() {
  const nodeId = useBuilder(state => state.settingsNodeId);
  const exists = useBuilder(state => Boolean(nodeId && state.diagram.nodes.some(node => node.id === nodeId && node.type === 'equipment')));
  if (!nodeId || !exists) return null;
  return <SettingsDialog key={nodeId} nodeId={nodeId} />;
}

function SettingsDialog({ nodeId }: { nodeId: string }) {
  // 창을 연 순간의 값으로 초안을 만든다. 열려 있는 동안 바깥 변화(실행 취소 등)는 창을 닫는다(store)
  const node = useBuilder(state => state.diagram.nodes.find(item => item.id === nodeId)!);
  const edges = useBuilder(state => state.diagram.edges);
  const diagramOptions = useBuilder(state => state.diagram.options);
  const library = useBuilder(state => state.library);
  const apply = useBuilder(state => state.applyEquipmentSettings);
  const close = useBuilder(state => state.closeNodeSettings);
  const notify = useBuilder(state => state.notify);
  const data = node.data as unknown as EquipmentData;
  const vocabulary = library?.library.vocabulary;
  const signals: VocabularySignal[] = useMemo(() => vocabulary?.signals ?? [], [vocabulary]);
  const connectors: string[] = useMemo(() => vocabulary?.connectors ?? [], [vocabulary]);
  const libraryEquipment = library?.units.get(data.id)?.equipment ?? null;

  const [tab, setTab] = useState<'basic' | 'ports' | 'quote'>('basic');
  const [isReused, setReused] = useState(Boolean(data.isReused));
  const [systemName, setSystemName] = useState(String(data.systemName ?? ''));
  const [draft, setDraft] = useState<Draft>(() => draftLists(data));
  const [portsTouched, setPortsTouched] = useState(false);
  const [reset, setReset] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({ ...(data.selectedOptionQuantities ?? {}) });
  const [addedProducts, setAddedProducts] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [confirm, setConfirm] = useState<number | null>(null);
  const [error, setError] = useState('');
  // Portal 반영 요청 확인 화면(근거 입력)과, 연결 삭제 확인을 거치는 동안 기다리는 요청
  const [review, setReview] = useState<{ request: IoRequest; notReflected: IoNotReflected[]; reasons: string[] } | null>(null);
  const [pendingExport, setPendingExport] = useState<IoRequest | null>(null);
  // 열리면 창으로 초점을 옮긴다. 두 번 누른 장비에 초점이 남으면 Esc·Delete가 바탕으로 간다
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => { dialogRef.current?.focus(); }, []);

  // 단자별 연결 수(지금 저장된 구성도 기준)
  const connections = useMemo(() => {
    const count = new Map<string, number>();
    for (const edge of edges) for (const [owner, handle] of [[edge.source, edge.sourceHandle], [edge.target, edge.targetHandle]] as const) {
      const parsed = parseHandle(handle);
      if (owner === nodeId && parsed) count.set(parsed.portId, (count.get(parsed.portId) ?? 0) + 1);
    }
    return count;
  }, [edges, nodeId]);

  const editPorts = (change: (current: Draft) => Draft) => {
    setDraft(current => change(current));
    setPortsTouched(true);
    setReset(false);
    setError('');
    // 확인 중에 초안을 바꾸면 확인한 연결 수가 맞지 않으므로 확인을 다시 받는다
    setConfirm(null);
    setReview(null);
    setPendingExport(null);
  };
  const updatePort = (list: ListKey, key: string, patch: Partial<DraftPort>) => editPorts(current => ({ ...current, [list]: current[list].map(port => (port.key === key ? { ...port, ...patch } : port)) }));
  const removePort = (list: ListKey, key: string) => editPorts(current => ({ ...current, [list]: current[list].filter(port => port.key !== key) }));
  const movePort = (list: ListKey, index: number, step: -1 | 1) => editPorts(current => {
    const items = [...current[list]];
    const to = index + step;
    if (to < 0 || to >= items.length) return current;
    [items[index], items[to]] = [items[to], items[index]];
    return { ...current, [list]: items };
  });
  const addPorts = (list: ListKey, direction: Direction, signal: VocabularySignal, connector: string, count: number) => editPorts(current => {
    const labels = nextPortLabels(current[list], signal.label, direction, count);
    return { ...current, [list]: [...current[list], ...labels.map(label => ({ key: `k${(keySeq += 1)}`, label, connector, signals: [signal.id], origin: 'user' as const }))] };
  });
  const resetToLibrary = () => {
    if (!libraryEquipment) return;
    setDraft(draftLists(libraryEquipment));
    setPortsTouched(true);
    setReset(true);
    setError('');
    setConfirm(null);
    setReview(null);
    setPendingExport(null);
  };

  // 근거만 고친다(연결 확인은 그대로 둔다). 열린 요청 확인 화면은 옛 근거로 만든 것이라 닫는다
  const updateReason = (list: ListKey, key: string, reason: string) => {
    setDraft(current => ({ ...current, [list]: current[list].map(port => (port.key === key ? { ...port, reason } : port)) }));
    setReview(null);
  };

  // 적용할 단자(초안)와 라이브러리를 견줘 Portal 반영 요청을 만들고 확인 화면을 연다
  const startExport = () => {
    setError('');
    const lists = Object.fromEntries(SECTIONS.map(({ list }) => [list, draft[list].map(({ id, label, connector, signals: s, origin, reason }) => ({ ...(id ? { id } : {}), label, connector, signals: s, ...(origin ? { origin } : {}), reason }))])) as unknown as PortLists<IoRequestPort>;
    const result = buildIoRequest({ lists, data, libraryEquipment, librarySource: library?.source, signalVocabulary: signals, createdAt: new Date().toISOString() });
    if (!result.ok || !result.request) { setError(EXPORT_PROBLEMS[result.code ?? ''] ?? `Portal 반영 요청을 만들지 못했습니다(${result.code})`); return; }
    if (!result.request.changes.length) {
      const why = result.notReflected.map(item => `${item.ports.join(', ')}: ${NOT_REFLECTED[item.code]}`).join(' / ');
      setError(`Portal에 반영할 단자 변경이 없습니다${why ? ` — ${why}` : ''}`);
      return;
    }
    setConfirm(null);
    setReview({ request: result.request, notReflected: result.notReflected, reasons: result.request.changes.map(change => change.reason) });
  };

  const submit = (removeEdges: boolean, exportRequest: IoRequest | null = null) => {
    const ports = portsTouched && !reset
      ? Object.fromEntries(SECTIONS.map(({ list }) => [list, draft[list].map(({ id, label, connector, signals: s }) => ({ ...(id ? { id } : {}), label, connector, signals: s }))])) as unknown as PortLists
      : null;
    const result = apply(nodeId, { isReused, systemName, ports, resetPorts: reset, quantities, optionProductIds: addedProducts }, { removeEdges });
    if (result.code === 'edges-affected') { setReview(null); setPendingExport(exportRequest); setConfirm(result.removedEdgeIds.length); return; }
    if (!result.ok) {
      setConfirm(null);
      setError(`${PROBLEMS[result.code ?? ''] ?? `적용하지 못했습니다(${result.code})`}${result.detail ? `: ${result.detail}` : ''}`);
      if (result.code !== 'quote-invalid') setTab('ports');
      return;
    }
    if (exportRequest) downloadText(serializeIoRequest(exportRequest), ioRequestFileName(exportRequest.productId));
    close();
    const applied = result.removedEdgeIds.length ? `장비 설정을 적용했습니다. 연결 ${result.removedEdgeIds.length}개를 함께 지웠습니다.` : '장비 설정을 적용했습니다.';
    if (exportRequest) notify({ text: `${result.changed ? `${applied} ` : ''}Portal 반영 요청 파일(행 변경 ${exportRequest.changes.length}건)을 내려받았습니다.`, tone: 'info' });
    else if (result.changed) notify({ text: applied, tone: 'info' });
  };

  // 창 안의 키는 바탕 단축키(Delete·Ctrl+Z 등)로 번지지 않게 막는다. Esc는 확인 → 창 순서로 닫는다
  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (confirm !== null) { setConfirm(null); setPendingExport(null); } else if (review) setReview(null); else close();
  };

  const products = [...(library?.products.values() ?? [])].filter(p => `${p.brand} ${p.product}`.toLowerCase().includes(search.toLowerCase()));
  const optionName = (id: string) => diagramOptions?.find(o => o.id === id)?.model
    ?? library?.products.get(addedProducts.find(pid => optionIdOf(pid) === id) ?? '')?.product
    ?? `미확인 옵션 ${id}`;
  const addOption = () => {
    if (!productId) return;
    const id = optionIdOf(productId);
    setQuantities(current => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    if (!addedProducts.includes(productId)) setAddedProducts([...addedProducts, productId]);
  };

  const portCount = SECTIONS.reduce((sum, { list }) => sum + draft[list].length, 0);
  const tabs: [typeof tab, string][] = [['basic', '기본'], ['ports', `단자 ${portCount}`], ['quote', '견적 옵션']];

  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={onKeyDown} onKeyUp={event => event.stopPropagation()}>
      <div className="modal equipment-settings" role="dialog" aria-modal="true" aria-label="장비 설정" tabIndex={-1} ref={dialogRef}>
        <header className="modal-head">
          <div>
            <div className="modal-sub">{data.manufacturer}</div>
            <h2 className="panel-title">{data.model} 설정</h2>
          </div>
          <button type="button" className="icon-button" aria-label="닫기" onClick={close}>×</button>
        </header>
        <nav className="modal-tabs" role="tablist">
          {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setReview(null); }}>{label}</button>)}
        </nav>
        <div className="modal-body">
          {tab === 'basic' && (
            <div className="modal-section">
              <dl className="edge-facts">
                <dt>제조사</dt><dd>{data.manufacturer ?? '—'}</dd>
                <dt>모델</dt><dd>{data.model}</dd>
                <dt>분류</dt><dd>{data.name}</dd>
                <dt>Portal</dt><dd>{data.portal?.detailUrl ? <a href={data.portal.detailUrl} target="_blank" rel="noreferrer">제품 상세 열기</a> : '—'}</dd>
              </dl>
              <p className="panel-note">모델·제조사·분류는 Portal 제품 그대로입니다. 바꾸려면 Portal 데이터를 고칩니다.</p>
              <label className="field">시스템명<input aria-label="장비 시스템명" value={systemName} onChange={event => setSystemName(event.target.value)} placeholder="비우면 시스템1" /></label>
              <label className="check"><input type="checkbox" checked={isReused} onChange={event => setReused(event.target.checked)} />재활용 장비(견적에서 구매하지 않음)</label>
            </div>
          )}
          {tab === 'ports' && (
            <div className="modal-section">
              <p className="panel-note">이 구성도의 이 장비에만 적용됩니다. Portal·장비 목록은 바뀌지 않습니다. 선 종류는 신호로 정해집니다.</p>
              {SECTIONS.map(section => (
                <PortSection key={section.list} direction={section.direction} title={section.title} ports={draft[section.list]} signals={signals} connectors={connectors} connections={connections}
                  onChange={(key, patch) => updatePort(section.list, key, patch)} onRemove={key => removePort(section.list, key)} onMove={(index, step) => movePort(section.list, index, step)}
                  onAdd={(signal, connector, count) => addPorts(section.list, section.direction, signal, connector, count)} onReason={(key, reason) => updateReason(section.list, key, reason)} />
              ))}
              <div className="panel-actions">
                <button type="button" disabled={!libraryEquipment} onClick={resetToLibrary} title={libraryEquipment ? '' : '라이브러리에서 이 장비를 찾지 못했습니다'}>라이브러리 값으로 되돌리기</button>
              </div>
              {reset && <p className="panel-note">적용하면 라이브러리 단자로 돌아갑니다.</p>}
              <p className="panel-note">「적용」은 이 구성도에만 적용합니다. Portal에도 반영하려면 「적용하고 Portal 반영 요청 내보내기」로 요청 파일을 내려받아 저장소 담당에게 전달합니다. 근거 칸은 선택이며 요청 파일에만 들어갑니다.</p>
            </div>
          )}
          {tab === 'quote' && (
            <div className="modal-section">
              <p className="panel-note">노드 1개는 장비 1대입니다. 옵션은 견적에 추가할 품목이며 단자와 호환성을 자동 설정하지 않습니다.</p>
              {Object.entries(quantities).map(([id, q]) => (
                <label className="field" key={id}>{optionName(id)}
                  <input aria-label={`옵션 수량 ${id}`} type="number" min="0" step="1" value={Number.isNaN(q) ? '' : q} onChange={event => setQuantities({ ...quantities, [id]: event.target.value === '' ? Number.NaN : Number(event.target.value) })} />
                </label>
              ))}
              <label className="field">옵션 검색<input value={search} onChange={event => setSearch(event.target.value)} /></label>
              <label className="field">포털 옵션 품목
                <select value={productId} onChange={event => setProductId(event.target.value)}>
                  <option value="">품목 선택</option>
                  {products.map(p => <option key={p.productId} value={p.productId}>{p.brand} {p.product}</option>)}
                </select>
              </label>
              <button type="button" disabled={!productId} onClick={addOption}>옵션 1개 추가</button>
            </div>
          )}
        </div>
        {error && <p className="modal-error" role="alert">{error}</p>}
        {confirm !== null ? (
          <div className="modal-confirm" role="alertdialog" aria-label="연결 삭제 확인">
            <span>연결 {confirm}개도 함께 지웁니다. 지운 단자나 바뀐 단자에 걸린 연결입니다.</span>
            <div className="panel-actions">
              <button type="button" onClick={() => { setConfirm(null); setPendingExport(null); }}>돌아가기</button>
              <button type="button" className="danger" onClick={() => submit(true, pendingExport)}>연결도 지우고 적용</button>
            </div>
          </div>
        ) : review ? (
          <ExportReview review={review} onReason={(index, reason) => setReview({ ...review, reasons: review.reasons.map((item, i) => (i === index ? reason : item)) })}
            onBack={() => setReview(null)}
            onConfirm={() => submit(false, { ...review.request, changes: review.request.changes.map((change, i) => ({ ...change, reason: review.reasons[i].trim() })) })} />
        ) : (
          <footer className="panel-actions modal-foot">
            <button type="button" onClick={close}>취소</button>
            {tab === 'ports' && <button type="button" onClick={startExport}>적용하고 Portal 반영 요청 내보내기</button>}
            <button type="button" className="primary" onClick={() => submit(false)} title="이 구성도에만 적용">적용</button>
          </footer>
        )}
      </div>
    </div>
  );
}

// Portal 반영 요청 확인: 행 변경 목록과 변경별 근거, 반영하지 않는 단자
function ExportReview({ review, onReason, onBack, onConfirm }: { review: { request: IoRequest; notReflected: IoNotReflected[]; reasons: string[] }; onReason(index: number, reason: string): void; onBack(): void; onConfirm(): void }) {
  const { request, notReflected, reasons } = review;
  return (
    <div className="modal-confirm io-request-review" role="alertdialog" aria-label="Portal 반영 요청 확인">
      <strong>Portal 반영 요청 — 행 변경 {request.changes.length}건</strong>
      {request.source === 'rtcom' && <span>RTCOM 제품입니다. 요청 파일은 RTCOM 원본 담당에게 전달합니다(Portal 적용 스크립트는 적용하지 않습니다).</span>}
      <ol className="io-request-changes">
        {request.changes.map((change, index) => (
          <li key={index}>
            <span>{changeText(change)}</span>
            <input aria-label={`변경 ${index + 1} 근거`} value={reasons[index]} onChange={event => onReason(index, event.target.value)} placeholder="근거(자료명·쪽) — 비우면 근거 없음" />
          </li>
        ))}
      </ol>
      {notReflected.length > 0 && (
        <div className="io-request-skipped">
          <span>반영하지 않는 단자</span>
          <ul>{notReflected.map((item, index) => <li key={index}>{item.ports.join(', ')} — {NOT_REFLECTED[item.code]}</li>)}</ul>
        </div>
      )}
      <span className="muted">고친 행·새 행은 Portal에 REVIEW REQUIRED로 들어갑니다. 자료 확인은 사람이 합니다.</span>
      <div className="panel-actions">
        <button type="button" onClick={onBack}>돌아가기</button>
        <button type="button" className="primary" onClick={onConfirm}>적용하고 요청 파일 내려받기</button>
      </div>
    </div>
  );
}

function PortSection({ direction, title, ports, signals, connectors, connections, onChange, onRemove, onMove, onAdd, onReason }: {
  direction: Direction; title: string; ports: DraftPort[]; signals: VocabularySignal[]; connectors: string[]; connections: Map<string, number>;
  onChange(key: string, patch: Partial<DraftPort>): void; onRemove(key: string): void; onMove(index: number, step: -1 | 1): void;
  onAdd(signal: VocabularySignal, connector: string, count: number): void; onReason(key: string, reason: string): void;
}) {
  const [signalId, setSignalId] = useState('HDMI');
  const [connector, setConnector] = useState('');
  const [count, setCount] = useState(1);
  const signal = signals.find(item => item.id === signalId) ?? signals[0];
  const chosenConnector = connector || (signal ? defaultConnector(signal.id, connectors) : '');
  // 목록에 없는 값(옛 파일 등)도 고를 수 있게 지금 값을 앞에 둔다
  const options = (values: string[], current: string) => (values.includes(current) || !current ? values : [current, ...values]);
  const label = PORT_DIRECTION_LABELS[direction];
  return (
    <section className="port-section" aria-label={`${title} 단자`}>
      <h3 className="port-section-title">{title} <span className="muted">{ports.length}개</span></h3>
      {ports.length === 0 && <p className="panel-note">단자가 없습니다.</p>}
      {ports.map((port, index) => {
        const used = port.id ? connections.get(port.id) ?? 0 : 0;
        const main = port.signals[0] ?? '';
        return (
          <div className={`port-edit-row${port.origin === 'user' ? ' user' : ''}`} key={port.key} data-port-id={port.id ?? ''}>
            <input aria-label={`${title} 단자 이름 ${index + 1}`} value={port.label} onChange={event => onChange(port.key, { label: event.target.value })} />
            <select aria-label={`${title} 단자 커넥터 ${index + 1}`} value={port.connector} onChange={event => onChange(port.key, { connector: event.target.value })}>
              {options(connectors, port.connector).map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label={`${title} 단자 신호 ${index + 1}`} value={main}
              // 같은 단자의 다른 신호를 고르면 순서만 바꾸고, 새 신호면 그 신호 하나로 바꾼다
              onChange={event => onChange(port.key, { signals: port.signals.includes(event.target.value) ? [event.target.value, ...port.signals.filter(item => item !== event.target.value)] : [event.target.value] })}>
              {options(signals.map(item => item.id), main).map(item => <option key={item} value={item}>{signals.find(s => s.id === item)?.label ?? item}</option>)}
            </select>
            <span className="port-edit-tools">
              <button type="button" className="icon-button" aria-label={`${port.label} 위로`} disabled={index === 0} onClick={() => onMove(index, -1)}>↑</button>
              <button type="button" className="icon-button" aria-label={`${port.label} 아래로`} disabled={index === ports.length - 1} onClick={() => onMove(index, 1)}>↓</button>
              <button type="button" className="icon-button" aria-label={`${port.label} 삭제`} onClick={() => onRemove(port.key)}>삭제</button>
            </span>
            <input className="port-edit-reason" aria-label={`${title} 단자 근거 ${index + 1}`} value={port.reason ?? ''} onChange={event => onReason(port.key, event.target.value)} placeholder="근거(자료명·쪽) — Portal 반영 요청에만 씁니다" />
            <span className="port-edit-meta">
              {port.signals.length > 1 && <Tag>함께: {port.signals.slice(1).join(', ')}</Tag>}
              {port.origin === 'user' && <Tag tone="user">사용자 추가</Tag>}
              {port.edited && <Tag>수정됨</Tag>}
              {used > 0 && <Tag tone="link">연결 {used}</Tag>}
            </span>
          </div>
        );
      })}
      <div className="port-add-row">
        <select aria-label={`${title} 추가 신호`} value={signal?.id ?? ''} onChange={event => { setSignalId(event.target.value); setConnector(''); }}>
          {signals.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select aria-label={`${title} 추가 커넥터`} value={chosenConnector} onChange={event => setConnector(event.target.value)}>
          {options(connectors, chosenConnector).map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <input aria-label={`${title} 추가 개수`} type="number" min="1" max={MAX_ADD} value={count} onChange={event => setCount(Math.max(1, Math.min(MAX_ADD, Math.floor(Number(event.target.value) || 1))))} />
        <button type="button" disabled={!signal || !chosenConnector} onClick={() => signal && onAdd(signal, chosenConnector, count)} aria-label={`${title} 단자 추가`}>
          {signal ? `${signal.label} ${label} ${count}개 추가` : '추가'}
        </button>
      </div>
    </section>
  );
}

function Tag({ children, tone }: { children: ReactNode; tone?: 'user' | 'link' }) {
  return <span className={`port-tag${tone ? ` ${tone}` : ''}`}>{children}</span>;
}
