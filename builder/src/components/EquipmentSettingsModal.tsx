// 장비 설정 창(B-20261013-01, 구 Builder EditNodeModal 이식). 장비 노드를 두 번 누르면 열린다.
// 이 구성도의 이 노드만 고친다. Portal 데이터·라이브러리는 바뀌지 않는다(통합 기획 §8 "장비 DB 편집 폐기" 유지).
// 모든 탭의 값은 창 안의 초안이고, "적용"을 누를 때 실행 취소 한 단계로 반영한다. Esc·바깥 클릭·취소는 아무것도 바꾸지 않는다.
// 지우거나 바꾼 단자에 걸린 연결이 규칙에 맞지 않게 되면 "연결 n개도 함께 지웁니다"를 확인받은 뒤에만 적용한다.
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { PORT_DIRECTION_LABELS, nextPortLabels, parseHandle, type Direction, type EquipmentData, type Port, type PortLists, type VocabularySignal } from '../engine';
import { optionIdOf } from '../state/store';
import { useBuilder } from '../state/useBuilder';

type ListKey = keyof PortLists;
// 초안 단자. key는 화면 목록용(저장하지 않는다). id가 없으면 새로 추가한 단자다
interface DraftPort { key: string; id?: string; label: string; connector: string; signals: string[]; origin?: 'user'; edited?: boolean }
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
  };

  const submit = (removeEdges: boolean) => {
    const ports = portsTouched && !reset
      ? Object.fromEntries(SECTIONS.map(({ list }) => [list, draft[list].map(({ id, label, connector, signals: s }) => ({ ...(id ? { id } : {}), label, connector, signals: s }))])) as unknown as PortLists
      : null;
    const result = apply(nodeId, { isReused, systemName, ports, resetPorts: reset, quantities, optionProductIds: addedProducts }, { removeEdges });
    if (result.code === 'edges-affected') { setConfirm(result.removedEdgeIds.length); return; }
    if (!result.ok) {
      setConfirm(null);
      setError(`${PROBLEMS[result.code ?? ''] ?? `적용하지 못했습니다(${result.code})`}${result.detail ? `: ${result.detail}` : ''}`);
      if (result.code !== 'quote-invalid') setTab('ports');
      return;
    }
    close();
    if (result.changed) notify({ text: result.removedEdgeIds.length ? `장비 설정을 적용했습니다. 연결 ${result.removedEdgeIds.length}개를 함께 지웠습니다.` : '장비 설정을 적용했습니다.', tone: 'info' });
  };

  // 창 안의 키는 바탕 단축키(Delete·Ctrl+Z 등)로 번지지 않게 막는다. Esc는 확인 → 창 순서로 닫는다
  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (confirm !== null) setConfirm(null); else close();
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
      <div className="modal equipment-settings" role="dialog" aria-modal="true" aria-label="장비 설정">
        <header className="modal-head">
          <div>
            <div className="modal-sub">{data.manufacturer}</div>
            <h2 className="panel-title">{data.model} 설정</h2>
          </div>
          <button type="button" className="icon-button" aria-label="닫기" onClick={close}>×</button>
        </header>
        <nav className="modal-tabs" role="tablist">
          {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
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
                  onAdd={(signal, connector, count) => addPorts(section.list, section.direction, signal, connector, count)} />
              ))}
              <div className="panel-actions">
                <button type="button" disabled={!libraryEquipment} onClick={resetToLibrary} title={libraryEquipment ? '' : '라이브러리에서 이 장비를 찾지 못했습니다'}>라이브러리 값으로 되돌리기</button>
              </div>
              {reset && <p className="panel-note">적용하면 라이브러리 단자로 돌아갑니다.</p>}
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
              <button type="button" onClick={() => setConfirm(null)}>돌아가기</button>
              <button type="button" className="danger" onClick={() => submit(true)}>연결도 지우고 적용</button>
            </div>
          </div>
        ) : (
          <footer className="panel-actions modal-foot">
            <button type="button" onClick={close}>취소</button>
            <button type="button" className="primary" onClick={() => submit(false)}>적용</button>
          </footer>
        )}
      </div>
    </div>
  );
}

function PortSection({ direction, title, ports, signals, connectors, connections, onChange, onRemove, onMove, onAdd }: {
  direction: Direction; title: string; ports: DraftPort[]; signals: VocabularySignal[]; connectors: string[]; connections: Map<string, number>;
  onChange(key: string, patch: Partial<DraftPort>): void; onRemove(key: string): void; onMove(index: number, step: -1 | 1): void;
  onAdd(signal: VocabularySignal, connector: string, count: number): void;
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
