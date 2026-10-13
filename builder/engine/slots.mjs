// 슬롯 번호별 카드 장착(B-20261013-04). 프레임 노드 하나의 구성만 바꾼다. 카드는 노드가 아니다(노드 1개 = 장비 1대).
// 라이브러리 1.1.0(B-20261013-03)의 배치 단위 slots(프레임)·card(카드)를 읽는다.
//
// 저장 형식(구 Builder 1.1 키는 그대로, 필드 추가만)
// - slotAssignments: { "IN1": "<카드 배치 단위 ID>", … } — 프레임 슬롯 목록 순서. 비면 키를 뺀다
// - 카드 단자 id: `opt-<카드 배치 단위 ID>-<슬롯 번호>-<카드 단자 id>`. 구 Builder `opt-<옵션id>-<n>-<단자id>`의 n 자리에 슬롯 번호를 넣었다.
//   슬롯마다 id가 달라 한 슬롯의 카드를 바꿔도 다른 슬롯 연결은 그대로다. 이름은 `IN2 HDMI In 3`처럼 슬롯 번호를 앞에 붙인다(결정 D2)
// - optionPortIds: 카드가 만든 단자 id 목록(구 Builder와 같은 뜻)
// - selectedOptionQuantities: `portal-option:<카드 배치 단위 ID>` = 장착 장수(견적 옵션과 같은 키라 카드가 곧 견적 품목이다)
// - 최상위 options[]: 카드 품목 정의(견적 옵션과 같은 방식)
// 카드 배치 단위 ID는 Portal 카드면 제품 ID 그대로이고, RTCOM 시리즈 카드면 `<제품ID>:<모델 슬러그>`다.
// RTCOM 카드는 제품 하나(예: rtcom-xdm)에 모델이 여럿이라 제품 ID로는 카드 종류와 견적 수량을 나눌 수 없어서다.
import { DEFAULT_RULES } from './defaults.mjs';
import { PORT_LISTS, clone } from './normalize.mjs';
import { commitNodeData, resetEquipmentPorts, samePorts } from './ports.mjs';

export const OPTION_ID_PREFIX = 'portal-option:';
export const optionIdOf = unitId => `${OPTION_ID_PREFIX}${unitId}`;
export const cardPortPrefix = (cardUnitId, slotId) => `opt-${cardUnitId}-${slotId}-`;
export const cardPortId = (cardUnitId, slotId, portId) => `${cardPortPrefix(cardUnitId, slotId)}${portId}`;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const problem = (code, detail) => ({ ok: false, code, detail, removedEdgeIds: [] });

// 프레임 슬롯 정보(라이브러리 units[].slots). 슬롯이 없는 장비면 null
export const frameSlots = (library, unitId) => library?.units.get(unitId)?.unit?.slots ?? null;
// 카드 정보(라이브러리 units[].card). 카드가 아니면 null
export const cardInfoOf = (library, unitId) => library?.units.get(unitId)?.unit?.card ?? null;

// 이 슬롯에 넣을 수 있는 카드 배치 단위(프레임 compatibleCards 순서). 슬롯 종류가 맞아야 한다. 공용(shared) 슬롯은 입력·출력 카드를 모두 받는다
export function slotCards(library, frameUnitId, slotId) {
  const slots = frameSlots(library, frameUnitId);
  const slot = slots?.list?.find(item => item.id === slotId);
  if (!slot) return [];
  const out = [];
  for (const unitId of slots.compatibleCards ?? []) {
    const entry = library.units.get(unitId);
    const card = entry?.unit?.card;
    if (!card) continue;
    if (slot.slotType === 'shared' || card.slotType === 'shared' || card.slotType === slot.slotType) out.push({ unitId, product: entry.product, unit: entry.unit, equipment: entry.equipment });
  }
  return out;
}

// 카드 장비의 단자를 슬롯 단자로 바꾼다. id·이름만 바꾸고 나머지(type·connector·signals·verification·portalIo)는 Portal 값 그대로다
export function cardPorts(cardEquipment, cardUnitId, slotId) {
  const out = {};
  for (const list of Object.keys(PORT_LISTS)) {
    out[list] = (cardEquipment?.[list] ?? []).map(port => ({ ...clone(port), id: cardPortId(cardUnitId, slotId, port.id), label: `${slotId} ${port.label}` }));
  }
  return out;
}

// 노드 단자가 어느 슬롯 카드의 단자인지(지금 장착 기준). 카드 단자가 아니면 null
export function slotOfPort(data, portId) {
  for (const [slotId, cardUnitId] of Object.entries(data?.slotAssignments ?? {})) if (portId?.startsWith(cardPortPrefix(cardUnitId, slotId))) return slotId;
  return null;
}

// 슬롯 순서 번호(목록에 없는 슬롯은 뒤로)
const slotOrder = slots => {
  const order = new Map((slots?.list ?? []).map((slot, i) => [slot.id, i]));
  return slotId => order.get(slotId) ?? Number.MAX_SAFE_INTEGER;
};
const orderedAssignments = (slots, assignments) => {
  const rank = slotOrder(slots);
  return Object.fromEntries(Object.entries(assignments).sort(([a], [b]) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0)));
};

// 프레임 + 장착 카드로 만든 "라이브러리 값". 단자 비교(library-drift·portsEdited)와 "라이브러리 값으로 되돌리기"의 기준이다.
// 프레임 단자 다음에 카드 단자를 슬롯 순서대로 붙인다. 라이브러리에 없는 카드는 빼고 missing에 적는다. 프레임이 없으면 null
export function slotEquipment(library, frameUnitId, assignments = {}) {
  const entry = library?.units.get(frameUnitId);
  if (!entry) return null;
  const equipment = clone(entry.equipment);
  const missing = [];
  for (const [slotId, cardUnitId] of Object.entries(orderedAssignments(entry.unit?.slots, assignments))) {
    const card = library.units.get(cardUnitId);
    if (!card) { missing.push(cardUnitId); continue; }
    const ports = cardPorts(card.equipment, cardUnitId, slotId);
    for (const list of Object.keys(PORT_LISTS)) equipment[list] = [...(equipment[list] ?? []), ...ports[list]];
  }
  return { equipment, missing };
}

// 이 노드의 비교 기준 장비: 카드를 꽂은 프레임이면 프레임 + 카드, 아니면 라이브러리 장비 그대로. 라이브러리에 없으면 null
export function nodeLibraryEquipment(library, data) {
  const assignments = data?.slotAssignments;
  if (isObject(assignments) && Object.keys(assignments).length && frameSlots(library, data.id)) return slotEquipment(library, data.id, assignments).equipment;
  return library?.units.get(data?.id)?.equipment ?? null;
}

// 예전 Builder·B-03 이전 라이브러리에서 펼쳐 둔 카드 단자 수(BLU-160 등). 슬롯 프레임인데 카드를 꽂지 않았고,
// 라이브러리 프레임에 없는 단자(사용자 추가·카드 단자 제외)가 남아 있으면 그 수. 자동으로 옮기지 않는다(결정 D1)
export function legacyCardPortCount(library, data) {
  const entry = library?.units.get(data?.id);
  if (!entry?.unit?.slots) return 0;
  if (isObject(data.slotAssignments) && Object.keys(data.slotAssignments).length) return 0;
  const known = new Set(Object.keys(PORT_LISTS).flatMap(list => (entry.equipment[list] ?? []).map(port => port.id)));
  return Object.keys(PORT_LISTS).flatMap(list => data[list] ?? []).filter(port => port.origin !== 'user' && !known.has(port.id)).length;
}

// 카드 품목 정의(최상위 options[]). 견적 옵션(store quoteOptions)과 같은 모양이다.
// Portal 카드(배치 단위 = 제품)는 Portal 제품명, RTCOM 시리즈 카드는 그 카드 모델명을 model로 쓴다
export function cardOptionDefinition(library, cardUnitId) {
  const entry = library.units.get(cardUnitId);
  const model = entry.unit.unitId === entry.product.productId ? entry.product.product : entry.equipment.model;
  const out = { id: optionIdOf(cardUnitId), model, name: model };
  if (entry.product.brand ?? entry.equipment.manufacturer) out.manufacturer = entry.product.brand ?? entry.equipment.manufacturer;
  return out;
}

// 슬롯마다 장착한 장수
const cardCounts = assignments => {
  const count = new Map();
  for (const cardUnitId of Object.values(assignments ?? {})) count.set(cardUnitId, (count.get(cardUnitId) ?? 0) + 1);
  return count;
};

// assignments: { 슬롯번호: 카드 배치 단위 ID } — 장착할 전체 구성(빈 문자열·빠진 슬롯 = 비움).
// options: library(createLibraryIndex 결과, 필수), removeEdges, rules, powerEnabled
// 결과: updateEquipmentPorts와 같다. 바꾼 슬롯의 카드 단자에 걸린 연결은 removeEdges 없이는 바꾸지 않고 'edges-affected'로 알린다
export function updateSlotAssignments(diagram, nodeId, assignments, { library = null, removeEdges = false, rules = library?.rules ?? DEFAULT_RULES, powerEnabled = false } = {}) {
  if (!library) return problem('library-missing', nodeId);
  const index = diagram.nodes.findIndex(node => node.id === nodeId && node.type === 'equipment');
  if (index < 0) return problem('node-missing', nodeId);
  const node = diagram.nodes[index];
  const slots = frameSlots(library, node.data.id);
  if (!slots) return problem('slots-missing', node.data.id);
  const wanted = {};
  for (const [slotId, cardUnitId] of Object.entries(assignments ?? {})) {
    if (!cardUnitId) continue;
    if (!slots.list.some(slot => slot.id === slotId)) return problem('slot-unknown', slotId);
    if (!slotCards(library, node.data.id, slotId).some(card => card.unitId === cardUnitId)) return problem('card-incompatible', `${slotId}: ${cardUnitId}`);
    wanted[slotId] = cardUnitId;
  }
  const next = orderedAssignments(slots, wanted);
  const before = isObject(node.data.slotAssignments) ? node.data.slotAssignments : {};
  const changed = [...new Set([...Object.keys(before), ...Object.keys(next)])].filter(slotId => before[slotId] !== next[slotId]);
  if (!changed.length) return { ok: true, removedEdgeIds: [], changed: false };

  // 바뀐 슬롯의 예전 카드 단자를 빼고 새 카드 단자를 붙인다. 바뀌지 않은 슬롯 단자(단자 탭에서 고친 값 포함)는 그대로 둔다
  const gone = changed.filter(slotId => before[slotId]).map(slotId => cardPortPrefix(before[slotId], slotId));
  const removedPort = id => gone.some(prefix => id.startsWith(prefix));
  const nextData = { ...node.data };
  const added = [];
  for (const list of Object.keys(PORT_LISTS)) nextData[list] = (node.data[list] ?? []).filter(port => !removedPort(port.id));
  for (const slotId of changed) {
    if (!next[slotId]) continue;
    const ports = cardPorts(library.units.get(next[slotId]).equipment, next[slotId], slotId);
    for (const list of Object.keys(PORT_LISTS)) { nextData[list].push(...ports[list]); added.push(...ports[list].map(port => port.id)); }
  }
  // 목록마다 프레임 단자(카드 단자가 아닌 것)를 앞에 두고 카드 단자를 슬롯 순서로 뒤에 둔다(같은 슬롯 안 순서는 유지)
  const rank = slotOrder(slots);
  const probe = { slotAssignments: next };
  for (const list of Object.keys(PORT_LISTS)) {
    nextData[list] = nextData[list]
      .map((port, i) => { const slotId = slotOfPort(probe, port.id); return { port, i, key: slotId === null ? -1 : rank(slotId) }; })
      .sort((a, b) => a.key - b.key || a.i - b.i)
      .map(item => item.port);
  }
  nextData.optionPortIds = [...(Array.isArray(node.data.optionPortIds) ? node.data.optionPortIds : []).filter(id => !removedPort(id)), ...added];
  if (Object.keys(next).length) nextData.slotAssignments = next;
  else delete nextData.slotAssignments;

  // 견적 수량: 장착 장수만큼 더하고 뺀다. 견적 옵션 탭에서 따로 넣은 예비 수량은 남긴다. 장착 장수 밑으로는 내려가지 않는다
  const quantities = { ...(isObject(node.data.selectedOptionQuantities) ? node.data.selectedOptionQuantities : {}) };
  const oldCount = cardCounts(before);
  const newCount = cardCounts(next);
  for (const cardUnitId of new Set([...oldCount.keys(), ...newCount.keys()])) {
    const key = optionIdOf(cardUnitId);
    const mounted = newCount.get(cardUnitId) ?? 0;
    const value = Math.max(mounted, (quantities[key] ?? 0) - (oldCount.get(cardUnitId) ?? 0) + mounted);
    if (value > 0) quantities[key] = value;
    else delete quantities[key];
  }
  if (Object.keys(quantities).length || node.data.selectedOptionQuantities !== undefined) nextData.selectedOptionQuantities = quantities;

  // 단자 변경 표시는 프레임 + 카드 값과 비교해 다시 정한다
  if (samePorts(nextData, slotEquipment(library, node.data.id, next).equipment)) delete nextData.portsEdited;
  else nextData.portsEdited = true;

  const result = commitNodeData(diagram, index, nextData, { removeEdges, rules, powerEnabled });
  if (!result.ok || !result.changed) return result;
  // 카드 품목 정의를 최상위 options[]에 둔다(없을 때만. 견적 옵션처럼 정의는 지우지 않는다)
  const options = [...(diagram.options ?? [])];
  for (const cardUnitId of newCount.keys()) if (!options.some(option => option.id === optionIdOf(cardUnitId))) options.push(cardOptionDefinition(library, cardUnitId));
  if (options.length || diagram.options) diagram.options = options;
  return result;
}

// "라이브러리 값으로 되돌리기"(슬롯 프레임용): 프레임 + 지금 장착한 카드 값으로 되돌린다. 카드 구성(slotAssignments)은 남긴다.
// 슬롯 프레임이 아니면 라이브러리 장비 그대로 되돌린다(resetEquipmentPorts와 같다)
export function resetFramePorts(diagram, nodeId, library, { removeEdges = false, rules = library?.rules ?? DEFAULT_RULES, powerEnabled = false } = {}) {
  const node = diagram.nodes.find(item => item.id === nodeId && item.type === 'equipment');
  if (!node) return problem('node-missing', nodeId);
  const equipment = nodeLibraryEquipment(library, node.data);
  const cardIds = Object.keys(PORT_LISTS).flatMap(list => (equipment?.[list] ?? []).map(port => port.id)).filter(id => slotOfPort(node.data, id) !== null);
  const optionPortIds = [...new Set([...(node.data.optionPortIds ?? []).filter(id => slotOfPort(node.data, id) === null), ...cardIds])];
  return resetEquipmentPorts(diagram, nodeId, equipment, { removeEdges, rules, powerEnabled, optionPortIds });
}

// 장착한 카드 수량이 견적 수량보다 크면 장착 수로 올린다(견적 옵션 탭에서 장착 수 밑으로 줄인 경우). 새 객체를 돌려준다
export function mountedQuantities(quantities, assignments) {
  const out = { ...quantities };
  for (const [cardUnitId, count] of cardCounts(assignments)) {
    const key = optionIdOf(cardUnitId);
    if (!((out[key] ?? 0) >= count)) out[key] = count;
  }
  return out;
}
