// 선택한 엣지의 라벨과 케이블(1.1 bomRows 형식) 편집.
import { useEffect, useMemo, useState } from 'react';
import { bomRowProblem, findPort, parseHandle, type BomRow, type Equipment } from '../engine';
import { useBuilder } from '../state/useBuilder';

const emptyRow = (lineTypeId: string): BomRow => ({ cableType: 'ready-made', productName: '', lineTypeId, quantity: 1 });

export function EdgePanel({ edgeId }: { edgeId: string }) {
  const diagram = useBuilder(state => state.diagram);
  const library = useBuilder(state => state.library);
  const updateEdge = useBuilder(state => state.updateEdge);
  const notify = useBuilder(state => state.notify);
  const deleteEdge = useBuilder(state => state.deleteEdge);
  const selectEdges = useBuilder(state => state.selectEdges);
  const edge = diagram.edges.find(item => item.id === edgeId) ?? null;
  const [rows, setRows] = useState<BomRow[]>([]);
  const [label, setLabelText] = useState('');
  // 다른 연결을 고르거나 저장·실행 취소로 이 연결의 값이 바뀌면 입력란을 다시 채운다
  useEffect(() => {
    setRows(edge?.data.bomRows ? structuredCloneSafe(edge.data.bomRows) : []);
    setLabelText(edge?.data.label ?? '');
  }, [edge?.id, edge?.data]);
  // 케이블 제품명 후보: Portal의 케이블 분류 제품
  const cableNames = useMemo(() => (library?.library.products ?? []).filter(product => !product.placeable && /Cable/.test(product.categories[2] ?? '')).map(product => `${product.brand} ${product.product}`), [library]);
  if (!edge) return null;
  const end = (nodeId: string, handle: string) => {
    const node = diagram.nodes.find(item => item.id === nodeId);
    const parsed = parseHandle(handle);
    const data = node?.data as unknown as Equipment | undefined;
    const port = data && parsed ? findPort(data, parsed.portId) : null;
    return `${data?.model ?? '?'} · ${port?.label ?? handle}`;
  };
  // 기성으로 바꾸면 수량 1부터 시작한다(제작으로 바꿀 때 수량은 지워진다)
  const update = (index: number, patch: Partial<BomRow>) => setRows(rows.map((row, i) => {
    if (i !== index) return row;
    const refill = patch.cableType === 'ready-made' && row.quantity === undefined ? { quantity: 1 } : {};
    return normalizeRow({ ...row, ...patch, ...refill });
  }));
  const save = () => {
    const cleaned = rows.map(row => ({ ...row, productName: row.productName.trim() }));
    const problem = cableProblem(cleaned);
    if (problem) { notify({ text: problem, tone: 'warn' }); return; }
    updateEdge(edge.id, { label: label.trim(), rows: cleaned });
  };
  return (
    <aside className="side-panel edge-panel">
      <div className="panel-head">
        <span className="panel-title">연결</span>
        <button type="button" className="icon-button" onClick={() => selectEdges([])} aria-label="연결 편집 닫기" title="닫고 이슈 목록 보기">✕</button>
      </div>
      <dl className="edge-facts">
        <dt>출발</dt><dd>{end(edge.source, edge.sourceHandle)}</dd>
        <dt>도착</dt><dd>{end(edge.target, edge.targetHandle)}</dd>
        <dt>신호</dt><dd>{edge.data.signal} · {edge.data.lineTypeId}</dd>
      </dl>
      <label className="field">라벨<input value={label} onChange={event => setLabelText(event.target.value)} placeholder="예: HDBaseT 70m 구간" /></label>
      <div className="panel-subtitle">케이블</div>
      {rows.length === 0 && <div className="panel-note">케이블을 아직 정하지 않았습니다.</div>}
      {rows.map((row, index) => (
        <div key={index} className="cable-row">
          <select value={row.cableType} onChange={event => update(index, { cableType: event.target.value as BomRow['cableType'] })}>
            <option value="ready-made">기성</option>
            <option value="manufactured">제작</option>
          </select>
          <input list="cable-names" value={row.productName} placeholder="제품명" onChange={event => update(index, { productName: event.target.value })} />
          {row.cableType === 'manufactured'
            ? <input type="number" min={0} step={0.5} value={row.length ?? ''} placeholder="길이(m)" onChange={event => update(index, { length: event.target.value === '' ? undefined : Number(event.target.value) })} />
            : <input type="number" min={1} step={1} value={row.quantity ?? ''} placeholder="수량" onChange={event => update(index, { quantity: event.target.value === '' ? undefined : Number(event.target.value) })} />}
          <button type="button" className="icon-button" onClick={() => setRows(rows.filter((_, i) => i !== index))} aria-label="케이블 행 삭제">✕</button>
        </div>
      ))}
      <datalist id="cable-names">{cableNames.map(name => <option key={name} value={name} />)}</datalist>
      <div className="panel-actions">
        <button type="button" onClick={() => setRows([...rows, emptyRow(edge.data.lineTypeId)])}>케이블 추가</button>
        <button type="button" className="primary" onClick={save}>저장</button>
      </div>
      <button type="button" className="danger" onClick={() => deleteEdge(edge.id)}>연결 삭제</button>
    </aside>
  );
}

// 견적 쪽이 받는 값이므로 저장 전에 막는다. 규칙은 엔진 검증기와 같은 함수(bomRowProblem)다(결정 H-d)
export function cableProblem(rows: BomRow[]): string | null {
  for (const [index, row] of rows.entries()) {
    const problem = bomRowProblem(row);
    if (!problem) continue;
    const hint = problem.field === 'productName' ? ' 필요 없는 행은 ✕로 지웁니다.' : '';
    return `${index + 1}번째 케이블: ${problem.detail}.${hint}`;
  }
  return null;
}

// 기성은 수량, 제작은 길이만 남긴다(1.1 의미 그대로)
function normalizeRow(row: BomRow): BomRow {
  const base: BomRow = { cableType: row.cableType, productName: row.productName, lineTypeId: row.lineTypeId };
  if (row.cableType === 'manufactured') return row.length === undefined ? base : { ...base, length: row.length };
  return row.quantity === undefined ? base : { ...base, quantity: row.quantity };
}
const structuredCloneSafe = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
