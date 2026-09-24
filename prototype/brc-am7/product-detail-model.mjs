const QUICK_DOCUMENTS = [
  ['매뉴얼', 'User Manual', '매뉴얼 미확인'],
  ['시방서', 'Independent Specification', '공식 독립 시방서 미확인'],
  ['사양서', 'Specification', '사양서 미확인'],
  ['기술문서', 'Technical Document', '기술문서 미확인']
];

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
      return { label, resource, missingTitle, available: Boolean(resource?.url && resource.status !== 'MISSING') };
    }),
    additionalDocuments: documents.filter(item => !coreTypes.has(item.type)),
    specificationGroups: group(specifications, item => item.group),
    ioGroups: group(io, item => item.group ?? ioGroupBySignal.get(item.signal) ?? item.signal),
    rearIndex: images.findIndex(item => item.role?.toLowerCase() === 'rear')
  };
}
