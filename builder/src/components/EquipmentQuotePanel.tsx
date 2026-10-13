// 장비 하나를 골랐을 때 오른쪽 패널: 요약만 보이고, 고치는 일은 장비 설정 창에서 한다(B-20261013-01 결정 D1).
// 시스템명·옵션 품목 입력은 설정 창의 "기본"·"견적 옵션" 탭으로 옮겼다.
import type { EquipmentData } from '../engine';
import { useBuilder } from '../state/useBuilder';

export function EquipmentQuotePanel({ nodeId }: { nodeId: string }) {
  const node = useBuilder(state => state.diagram.nodes.find(n => n.id === nodeId) ?? null);
  const options = useBuilder(state => state.diagram.options);
  const open = useBuilder(state => state.openNodeSettings);
  if (!node) return null;
  const data = node.data as unknown as EquipmentData;
  const quantities = Object.entries(data.selectedOptionQuantities ?? {}).filter(([, q]) => q > 0);
  const ports = data.inputs.length + data.outputs.length + data.bidirectional.length;
  const userPorts = [...data.inputs, ...data.outputs, ...data.bidirectional].filter(port => port.origin === 'user').length;
  return (
    <aside className="side-panel equipment-quote-panel">
      <h2 className="panel-title">장비</h2>
      <strong>{data.model}</strong>
      <dl className="edge-facts">
        <dt>제조사</dt><dd>{data.manufacturer ?? '—'}</dd>
        <dt>시스템명</dt><dd>{data.systemName || '시스템1'}</dd>
        <dt>재활용</dt><dd>{data.isReused ? '예' : '아니오'}</dd>
        <dt>단자</dt><dd>{ports}개{data.portsEdited ? ` · 구성도에서 고침${userPorts ? `(추가 ${userPorts})` : ''}` : ''}</dd>
        <dt>옵션</dt><dd>{quantities.length ? quantities.map(([id, q]) => `${options?.find(o => o.id === id)?.model ?? id} ×${q}`).join(', ') : '없음'}</dd>
      </dl>
      <button type="button" onClick={() => open(nodeId)}>설정 열기</button>
      <p className="panel-note">장비를 두 번 눌러도 설정 창이 열립니다.</p>
    </aside>
  );
}
