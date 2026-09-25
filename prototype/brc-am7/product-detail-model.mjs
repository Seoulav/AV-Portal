const QUICK_DOCUMENTS = [
  ['매뉴얼', 'User Manual', '매뉴얼 미확인'],
  ['시방서', 'Independent Specification', '공식 독립 시방서 미확인'],
  ['사양서', 'Specification', '사양서 미확인'],
  ['기술문서', 'Technical Document', '기술문서 미확인']
];

const CONNECTOR_GROUPS = [
  { key: 'video', label: '영상', matches: ['video'] },
  { key: 'audio', label: '오디오', matches: ['audio'] },
  { key: 'network-control', label: '네트워크·제어', matches: ['network', 'control'] },
  { key: 'usb', label: 'USB', matches: ['usb'] },
  { key: 'sync', label: '동기', matches: ['sync', 'timecode'] },
  { key: 'power', label: '전원', matches: ['power'] },
  { key: 'recording-media', label: '저장·미디어', matches: ['recording', 'storage', 'media'] },
  { key: 'expansion', label: '확장', matches: ['expansion'] }
];

function connectorGroup(groupName = '') {
  const normalized = groupName.toLowerCase();
  // USB and pure audio groups stay distinct even when the source label contains Audio.
  if (normalized.includes('usb')) return CONNECTOR_GROUPS.find(group => group.key === 'usb');
  if (normalized.includes('network') || normalized.includes('control')) return CONNECTOR_GROUPS.find(group => group.key === 'network-control');
  return CONNECTOR_GROUPS.find(group => group.matches.some(token => normalized.includes(token))) ?? {
    key: normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other',
    label: groupName || '기타'
  };
}

function displayDirection(direction = '') {
  const normalized = String(direction).trim().toUpperCase();
  if (['IN', 'INPUT'].includes(normalized)) return 'IN';
  if (['OUT', 'OUTPUT'].includes(normalized)) return 'OUT';
  if (['I/O', 'IO', 'IN/OUT', 'BIDIRECTIONAL', 'BI-DIRECTIONAL'].includes(normalized)) return 'I/O';
  return direction || '—';
}

export function directionLabel(direction = '') {
  if (String(direction).trim().toUpperCase() === 'IN/LOOP') return '입력/루프 출력';
  const normalized = displayDirection(direction);
  if (normalized === 'IN') return '입력';
  if (normalized === 'OUT') return '출력';
  if (normalized === 'I/O') return '양방향';
  if (/option/i.test(String(direction))) return '옵션';
  return normalized === '—' ? '미확인' : normalized;
}

const hasCondition = value => Boolean(value && !/^(?:—|-|none|n\/a|조건 없음|해당 없음)$/i.test(String(value).trim()));

function connectorDisplayName(item = {}) {
  const connector = String(item.connector || '미확인').trim();
  const direction = directionLabel(item.direction);
  if (/^xlr 3-hole$/i.test(connector) || /^xlr 3-pin$/i.test(connector)) return `XLR 3핀${['입력', '출력'].includes(direction) ? ` ${direction}` : ''}`;
  if (/^xlr 4-pin$/i.test(connector)) return `XLR 4핀${['입력', '출력'].includes(direction) ? ` ${direction}` : ''}`;
  if (/^xlr$/i.test(connector) && /aes\/ebu/i.test(String(item.signal))) return 'XLR 디지털 오디오';
  if (/^d-sub 15-hole$/i.test(connector)) return 'D-sub 15핀';
  if (/^missing$/i.test(connector)) return '단자 미확인';
  return connector;
}

export function connectorPresentation(item = {}) {
  const quantity = String(item.quantity ?? '').trim();
  const numericQuantity = /^\d+$/.test(quantity);
  const descriptiveQuantity = !numericQuantity && !/^(?:—|-|review required|missing|partial|conflicted|unknown|미확인)$/i.test(quantity) ? quantity : '';
  const unresolved = ['REVIEW REQUIRED', 'CONFLICTED', 'MISSING', 'PARTIAL'].includes(item.verification);
  const condition = item.verification !== 'MISSING' && hasCondition(item.condition) ? String(item.condition).trim() : '';
  const protocol = /^(?:—|-|review required|missing|partial|conflicted|unknown|미확인)$/i.test(String(item.protocol ?? '').trim()) ? '' : item.protocol;
  const flags = [];
  const availability = String(item.availability ?? '').trim();
  if (/optional.*card|card.*required/i.test(availability)) flags.push('카드 필요');
  else if (/optional.*module|module.*required/i.test(availability)) flags.push('모듈 필요');
  else if (/^optional\b|^option\b/i.test(availability)) flags.push('옵션');
  if (unresolved) flags.push('확인 필요');
  return {
    displayConnector: connectorDisplayName(item),
    portCount: numericQuantity ? quantity : '미확인',
    channelSignal: [descriptiveQuantity, item.signal].filter(Boolean).join(' · ') || '—',
    specificationCondition: [protocol, condition ? `조건: ${condition}` : ''].filter(Boolean).join(' · ') || (unresolved ? '확인 필요' : '—'),
    flags
  };
}

export function prepareConnectorGroups(ioGroups = []) {
  const grouped = new Map();
  for (const sourceGroup of ioGroups) {
    const presentation = connectorGroup(sourceGroup.name);
    if (!grouped.has(presentation.key)) grouped.set(presentation.key, { ...presentation, sourceGroups: [], entries: [] });
    const target = grouped.get(presentation.key);
    target.sourceGroups.push(sourceGroup.name);
    target.entries.push(...sourceGroup.entries.map(item => ({
      ...item,
      sourceGroup: sourceGroup.name,
      displayDirection: displayDirection(item.direction),
      directionLabel: directionLabel(item.direction),
      ...connectorPresentation(item)
    })));
  }
  return [...grouped.values()];
}

export function selectKeyConnectors(connectorGroups = [], limit = 6) {
  if (limit <= 0) return [];
  const eligibleGroups = connectorGroups.map(group => ({
    ...group,
    entries: group.entries.filter(item => item.verification !== 'MISSING' && !/^missing$/i.test(String(item.connector).trim()))
  }));
  const selected = [];
  const add = item => {
    if (item && selected.length < limit && !selected.includes(item)) selected.push(item);
  };
  for (const item of eligibleGroups[0]?.entries.slice(0, 2) ?? []) add(item);
  for (const group of eligibleGroups.slice(1)) add(group.entries[0]);
  for (const group of eligibleGroups) for (const item of group.entries) add(item);
  return selected;
}

export function selectKeySpecifications(specificationGroups = [], limit = 10) {
  const selected = [];
  for (const group of specificationGroups) {
    for (const item of group.entries.slice(0, 2)) {
      if (selected.length >= limit) return selected;
      if (!['REVIEW REQUIRED', 'CONFLICTED', 'MISSING'].includes(item.verification)) selected.push(item);
    }
  }
  return selected;
}

export function prepareProductDetail(input) {
  if (!input || !input.manufacturer || !input.model) throw new Error('제품 식별 정보가 필요합니다.');
  const documents = input.documents ?? [];
  const images = input.images ?? [];
  const specifications = input.specifications ?? [];
  const io = input.io ?? [];
  const presentation = input.presentation ?? {};
  const coreTypes = new Set(['Official Product Page', ...QUICK_DOCUMENTS.map(([, type]) => type)]);
  const group = (items, key) => {
    const groups = new Map();
    for (const item of items) {
      const name = key(item);
      if (!name) throw new Error('표시 그룹이 없는 항목이 있습니다.');
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(item);
    }
    return [...groups].map(([name, entries]) => ({ name, entries }));
  };
  const ioGroupBySignal = new Map((presentation.ioSignalGroups ?? []).flatMap(({ name, signals }) => signals.map(signal => [signal, name])));
  const ioGroups = group(io, item => item.group ?? ioGroupBySignal.get(item.signal) ?? item.signal);
  const connectorGroups = prepareConnectorGroups(ioGroups);
  const specificationGroups = group(specifications, item => item.group);
  return {
    ...input,
    images,
    features: input.features ?? [],
    specifications,
    io,
    sources: input.sources ?? [],
    issues: input.issues ?? [],
    missingDocuments: input.missingDocuments ?? [],
    presentation,
    officialPage: documents.find(item => item.type === 'Official Product Page' && item.url && item.status !== 'MISSING') ?? null,
    quickDocuments: QUICK_DOCUMENTS.map(([label, type, missingTitle]) => {
      const resource = documents.find(item => item.type === type) ?? null;
      return { label, resource, missingTitle, available: Boolean(resource?.url && ['FOUND', 'VERIFIED'].includes(resource.status)) };
    }),
    additionalDocuments: documents.filter(item => !coreTypes.has(item.type)),
    specificationGroups,
    keySpecifications: selectKeySpecifications(specificationGroups),
    ioGroups,
    connectorGroups,
    keyConnectors: selectKeyConnectors(connectorGroups),
    rearIndex: images.findIndex(item => item.role?.toLowerCase() === 'rear')
  };
}
