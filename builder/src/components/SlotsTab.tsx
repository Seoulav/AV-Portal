// 장비 설정 창의 슬롯 탭(B-20261013-04). 슬롯 정보가 있는 프레임에만 보인다.
// 슬롯 번호마다 호환 카드를 고른다(없음 포함). 값은 창 안의 초안이고 "적용"할 때 store가 엔진(updateSlotAssignments)으로 반영한다.
// 카드는 노드가 아니라 프레임의 구성이다(노드 1개 = 장비 1대). 카드 단자는 적용 뒤 단자 탭에 `IN2 HDMI In 3`처럼 보인다.
import { useMemo } from 'react';
import { legacyCardPortCount, parseHandle, slotCards, slotOfPort, type DiagramEdge, type EquipmentData, type LibraryIndex, type SlotInfo, type SlotType } from '../engine';

const SLOT_TYPE_LABELS: Record<SlotType, string> = { input: '입력', output: '출력', shared: '공용' };

// 저장된 구성과 초안이 다른지(빈 슬롯은 키가 없다)
export function slotChanged(before: Record<string, string> | undefined, after: Record<string, string>) {
  const a = before ?? {};
  return [...new Set([...Object.keys(a), ...Object.keys(after)])].some(slotId => (a[slotId] ?? '') !== (after[slotId] ?? ''));
}

export function SlotsTab({ library, data, slotInfo, value, edges, nodeId, onChange, resetPending, onMigrate }: {
  library: LibraryIndex; data: EquipmentData; slotInfo: SlotInfo; value: Record<string, string>; edges: DiagramEdge[]; nodeId: string;
  onChange(value: Record<string, string>): void; resetPending: boolean; onMigrate(): void;
}) {
  // 슬롯별 연결 수(지금 저장된 구성도 기준)
  const connections = useMemo(() => {
    const count = new Map<string, number>();
    for (const edge of edges) for (const [owner, handle] of [[edge.source, edge.sourceHandle], [edge.target, edge.targetHandle]] as const) {
      const parsed = parseHandle(handle);
      const slotId = owner === nodeId && parsed ? slotOfPort(data, parsed.portId) : null;
      if (slotId) count.set(slotId, (count.get(slotId) ?? 0) + 1);
    }
    return count;
  }, [edges, nodeId, data]);
  const legacy = legacyCardPortCount(library, data);
  const choose = (slotId: string, cardUnitId: string) => {
    const next = { ...value };
    if (cardUnitId) next[slotId] = cardUnitId;
    else delete next[slotId];
    onChange(next);
  };
  const counts = `입력 ${slotInfo.input} · 출력 ${slotInfo.output} · 공용 ${slotInfo.shared}`;

  return (
    <div className="modal-section" aria-label="슬롯">
      <p className="panel-note">슬롯 {slotInfo.list.length}개({counts}). 근거 {slotInfo.source} · {slotInfo.verification}{slotInfo.note ? ` — ${slotInfo.note}` : ''}</p>
      {legacy > 0 && (
        <div className="slot-legacy" role="note" aria-label="예전 카드 단자 안내">
          <p>예전 방식으로 펼친 카드 단자 {legacy}개가 이 장비에 남아 있습니다. 자동으로 옮기지 않습니다.</p>
          <p>카드 구성으로 옮기려면 아래 버튼으로 프레임 단자만 남긴 뒤 슬롯마다 카드를 고르고 적용하세요. 예전 단자에 걸린 연결은 확인 후 함께 지웁니다.</p>
          <div className="panel-actions">
            <button type="button" disabled={resetPending} onClick={onMigrate}>{resetPending ? '적용하면 예전 단자를 정리합니다' : '카드 구성으로 옮기기'}</button>
          </div>
        </div>
      )}
      {slotInfo.compatibleCards.length === 0 && <p className="panel-note" role="note">장착 가능 모듈 정보 없음 — 라이브러리에 이 장비의 호환 카드·모듈 정보가 아직 없어 고를 수 없습니다.</p>}
      <p className="panel-note">슬롯 번호(IN1·OUT1·S1…)는 입력·출력·공용 슬롯을 차례로 센 번호입니다. 후면 패널 표기 순서와 같다는 보장은 없습니다.</p>
      {slotInfo.list.map(slot => {
        const cards = slotCards(library, data.id, slot.id);
        const current = value[slot.id] ?? '';
        const card = cards.find(item => item.unitId === current);
        const saved = data.slotAssignments?.[slot.id];
        const used = connections.get(slot.id) ?? 0;
        const portTotal = card ? card.equipment.inputs.length + card.equipment.outputs.length + card.equipment.bidirectional.length : 0;
        return (
          <div className="slot-row" key={slot.id} data-slot-id={slot.id}>
            <span className="slot-id">{slot.id}</span>
            <span className="muted" title={`${SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType} 슬롯 ${slot.id.replace(/^\D+/, '')}`}>{SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}</span>
            <select aria-label={`슬롯 ${slot.id} 카드`} value={current} disabled={!cards.length && !current} onChange={event => choose(slot.id, event.target.value)}>
              <option value="">비움</option>
              {current && !card && <option value={current}>{current} (라이브러리에 없음)</option>}
              {cards.map(item => <option key={item.unitId} value={item.unitId}>{item.equipment.model}</option>)}
            </select>
            <span className="port-edit-meta">
              {card && <span className="port-tag">단자 {portTotal}</span>}
              {saved && used > 0 && <span className="port-tag link">연결 {used}{current !== saved ? ' · 적용하면 확인 후 지웁니다' : ''}</span>}
            </span>
          </div>
        );
      })}
      <p className="panel-note">카드를 바꾸거나 빼면 그 슬롯 단자에 걸린 연결만 확인 후 지웁니다. 다른 슬롯 연결은 그대로입니다. 카드 단자는 적용 뒤 단자 탭에서 고칠 수 있고, 장착한 카드는 견적 옵션 수량에 들어갑니다.</p>
    </div>
  );
}
