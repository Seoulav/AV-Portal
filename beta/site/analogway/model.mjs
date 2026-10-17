export const SERIES = [
  {id: 'aquilon-rs', title: 'Aquilon RS', slugs: ['aquilon-rsalpha', 'aquilon-rs1', 'aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6']},
  {id: 'aquilon-c', title: 'Aquilon C', slugs: ['aquilon-cmini', 'aquilon-c', 'aquilon-cplus', 'aquilon-cmax']},
  {id: 'alta', title: 'Alta 4K', slugs: ['zenith-100', 'zenith-200']},
  {id: 'midra', title: 'Midra 4K', slugs: ['pulse-4k', 'eikos-4k']},
  {id: 'controller', title: '컨트롤러', slugs: ['rc400t']},
];

const spec = (product, group, names) => {
  const matches = product.specifications.map((row, index) => ({row, index}))
    .filter(({row}) => row.group === group && names.includes(row.name));
  if (matches.length !== 1) throw new Error(`${product.model}: ${group}/${names.join('|')} 사양 행이 정확히 하나여야 합니다.`);
  return matches[0];
};

const ownPlan = (product, slug) => {
  const kind = product.layerPlan ? 'layerPlan' : 'videoLayerPlan';
  const plans = product[kind]?.models?.filter(row => row.slug === slug) ?? [];
  if (plans.length !== 1) throw new Error(`${slug}: 자기 모델 레이어 행이 정확히 하나여야 합니다.`);
  return {kind, row: plans[0], index: product[kind].models.indexOf(plans[0])};
};

export function buildHubModel(catalog, products) {
  const analog = catalog.filter(entry => entry.brand === 'Analog Way');
  const allowed = new Set(SERIES.flatMap(series => series.slugs));
  const unknown = analog.filter(entry => !allowed.has(entry.slug));
  if (unknown.length) throw new Error(`분류되지 않은 Analog Way 모델: ${unknown.map(entry => entry.slug).join(', ')}`);
  const bySlug = new Map(analog.map(entry => [entry.slug, entry]));
  if (bySlug.size !== analog.length) throw new Error('Analog Way 카탈로그 slug 중복');
  for (const slug of allowed) if (!bySlug.has(slug) || !products[slug]) throw new Error(`${slug}: 공개 카탈로그·제품 JSON 누락`);

  const cards = SERIES.map(series => ({
    id: series.id,
    title: series.title,
    models: series.slugs.map(slug => ({slug, name: bySlug.get(slug).product})),
  }));
  const rows = cards.filter(card => card.id !== 'controller').flatMap(card => card.models.map(({slug, name}) => {
    const product = products[slug];
    if (product.model !== name || product.manufacturer !== 'Analog Way') throw new Error(`${slug}: 제품 식별 불일치`);
    const {kind, row, index} = ownPlan(product, slug);
    const path = key => `${kind}.models[${index}].${key}`;
    const ru = spec(product, 'Physical', ['크기(RU)', '랙 유닛']);
    const power = spec(product, 'Power', ['전원', '전원 입력']);
    const fields = kind === 'layerPlan' ? [
      {key: 'input', value: `${row.inputs4k}개 4K 입력`, path: path('inputs4k')},
      {key: 'output', value: `${row.outputConnectors4k}개 커넥터 · ${row.programOutputs4k}개 프로그램 출력`, path: `${path('outputConnectors4k')} + ${path('programOutputs4k')}`},
      {key: 'screen', value: `${row.screens2x2}개 2×2 4K60 화면`, path: path('screens2x2')},
      {key: 'layers', value: `VPU 1개 예시 ${row.mixingLayers4kPerScreen}개/화면 · 장비 전체 ${row.mixingLayers4k}개`, path: `${path('mixingLayers4kPerScreen')} + ${path('mixingLayers4k')}`},
    ] : (() => {
      const input = spec(product, 'Input', ['구성']);
      const output = product.specifications.map((item, position) => ({item, position}))
        .filter(({item}) => item.group === 'Output' && ['출력 A(2개)', '출력 B(2개)', 'PGM 출력'].includes(item.name));
      if (!output.length) throw new Error(`${slug}: 프로그램 출력 사양 누락`);
      return [
        {key: 'input', value: input.row.value, path: `specifications[${input.index}].value`},
        {key: 'output', value: output.map(({item}) => item.value).join(' / '), path: output.map(({position}) => `specifications[${position}].value`).join(' + ')},
        {key: 'screen', value: `${row.maxPgm4kScreens}개 4K60 프로그램 화면`, path: path('maxPgm4kScreens')},
        {key: 'layers', value: `최대 화면 구성 시 ${row.mixing4kPerScreenAtMaxScreens}개/화면 · 장비 전체 ${row.totalMixing4k}개 · 한 화면 집중 ${row.maxMixing4kPerScreenOneScreen}개`, path: `${path('mixing4kPerScreenAtMaxScreens')} + ${path('totalMixing4k')} + ${path('maxMixing4kPerScreenOneScreen')}`},
      ];
    })();
    fields.push(
      {key: 'ru', value: ru.row.value, path: `specifications[${ru.index}].value`},
      {key: 'power', value: [power.row.value, power.row.condition].filter(Boolean).join(' · '), path: `specifications[${power.index}].value + condition`},
    );
    return {slug, name, series: card.id, fields};
  }));

  const seen = new Set();
  const documents = [];
  for (const card of cards) for (const {slug} of card.models) {
    for (const item of products[slug].documents ?? []) {
      if (!['Brochure', 'User Manual'].includes(item.type) || !(item.url || item.file)) continue;
      const key = item.file || item.url;
      if (seen.has(key)) continue;
      seen.add(key);
      documents.push({title: item.title, type: item.type, url: item.url, file: item.file, series: card.title});
    }
  }
  return {cards, rows, documents};
}

export function assertHubParity(model, catalog, products) {
  const expected = buildHubModel(catalog, products);
  if (JSON.stringify(model) !== JSON.stringify(expected)) throw new Error('시안 표와 현재 공개 제품 JSON 불일치');
  return true;
}
