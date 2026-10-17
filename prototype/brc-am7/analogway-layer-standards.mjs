const make = (tag, className = '', text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
};

const aquilonModel = row => ({
  slug: row.slug,
  model: row.model,
  outputs: row.programOutputs4k,
  screens: row.screens2x2,
  mixPerScreen: row.mixingLayers4kPerScreen,
  splitPerScreen: row.splitLayers2kPerScreen,
  totalMix: row.mixingLayers4k,
  totalSplit: row.splitLayers2k,
  processingUnits: row.vpus,
  counts: {
    outputs: row.programOutputs4k,
    screens2x2: row.screens2x2,
    mixPerScreen: row.mixingLayers4kPerScreen,
    splitPerScreen: row.splitLayers2kPerScreen,
    totalMix: row.mixingLayers4k,
    totalSplit: row.splitLayers2k,
    processingUnits: row.vpus,
  },
});

const videoModel = row => ({
  slug: row.slug,
  model: row.model,
  series: row.series,
  screens: row.maxPgm4kScreens,
  mixPerScreen: row.mixing4kPerScreenAtMaxScreens,
  splitPerScreen: row.split4kPerScreenAtMaxScreens,
  totalMix: row.totalMixing4k,
  totalSplit: row.totalSplit4k,
  mixOneScreen: row.maxMixing4kPerScreenOneScreen,
  splitOneScreen: row.maxSplit4kPerScreenOneScreen,
  auxAtMaxScreens: row.auxOutputsAtMaxScreens,
  auxMax: row.maxAuxOutputs,
  modes: row.screenModes,
  allocationExamples: row.allocationExamples,
  counts: {
    screens: row.maxPgm4kScreens,
    mixPerScreenAtMax: row.mixing4kPerScreenAtMaxScreens,
    splitPerScreenAtMax: row.split4kPerScreenAtMaxScreens,
    mixOneScreen: row.maxMixing4kPerScreenOneScreen,
    splitOneScreen: row.maxSplit4kPerScreenOneScreen,
    totalMix: row.totalMixing4k,
    totalSplit: row.totalSplit4k,
    auxAtMaxScreens: row.auxOutputsAtMaxScreens,
    auxMax: row.maxAuxOutputs,
  },
});

export function buildAnalogWayLayerStandards({ aquilonRs, aquilonC, video }) {
  if (!aquilonRs?.models?.length || !aquilonC?.models?.length || !video?.models?.length) {
    throw new TypeError('Aquilon RS·C, Alta 4K, Midra 4K 모델 자료가 모두 필요합니다.');
  }
  const rs = aquilonRs.models.map(aquilonModel);
  const c = aquilonC.models.map(aquilonModel);
  const videoModels = video.models.map(videoModel);
  const alta = videoModels.filter(row => row.series === 'Alta 4K');
  const midra = videoModels.filter(row => row.series === 'Midra 4K');
  const rsExample = aquilonRs.example;
  const zenith100 = alta.find(row => row.slug === 'zenith-100');
  const pulse = midra.find(row => row.slug === 'pulse-4k');
  const eikos = midra.find(row => row.slug === 'eikos-4k');
  const matrix = pulse?.modes.find(mode => mode.id === 'matrix');
  const blend = eikos?.modes.find(mode => mode.id === 'hard-soft-edge');

  return {
    series: [
      { id: 'aquilon-rs', title: 'Aquilon RS', models: rs },
      { id: 'aquilon-c', title: 'Aquilon C · BTO(주문 제작) 최대 구성', models: c },
      { id: 'alta', title: 'Alta 4K', models: alta },
      { id: 'midra', title: 'Midra 4K', models: midra },
    ],
    examples: [
      {
        title: 'Aquilon · 2×2 4K60 화면',
        text: `출력 ${rsExample.outputs}개를 연결한 화면 1개를 VPU ${rsExample.vpusForScreen}개로 처리하는 예시는 믹싱 ${rsExample.mixingLayersPerScreen}개 또는 분할 ${rsExample.splitLayersPerScreen}개입니다. 큰 모델은 레이어 자원을 다른 VPU에도 나눌 수 있습니다.`,
      },
      {
        title: 'Alta 4K · 여러 화면으로 나눠 쓰기',
        text: `${zenith100.model}은 화면 ${zenith100.screens}개를 만들 때 장비 전체 믹싱 ${zenith100.totalMix}개(분할 ${zenith100.totalSplit}개)를 나눠 씁니다. 예: ${zenith100.allocationExamples.join(' · ')}.`,
      },
      {
        title: 'Midra 4K · 독립 화면 2개(Matrix)',
        text: `${pulse.model}는 각 화면에 믹싱 ${matrix.mixing4kPerScreen}개 또는 분할 ${matrix.split4kPerScreen}개를 배치하며, 두 화면 전체에 믹싱 ${matrix.totalMixing4k}개 또는 분할 ${matrix.totalSplit4k}개를 씁니다.`,
      },
      {
        title: 'Eikos 4K · 두 출력 블렌딩',
        text: `출력 ${blend.outputsPerScreen}개를 이어 만든 블렌딩 화면 한 개에 믹싱 ${blend.mixing4kPerScreen}개 또는 분할 ${blend.split4kPerScreen}개를 배치할 수 있습니다.`,
      },
    ],
    explanations: [
      '믹싱은 화면 사이를 부드럽게 전환합니다. 분할은 컷 전환만 되는 대신 같은 자원으로 레이어를 두 배 구성합니다.',
      '라이브 화면마다 배경 1개와 전경 1개가 따로 있습니다. 표의 믹싱·분할 수에는 이 배경·전경이 포함되지 않습니다.',
      '보조 화면(AUX)은 주 화면과 별도 출력입니다. Midra 1080p AUX에는 크기를 바꿀 수 없는 레이어 1개가 있고, Alta AUX는 레이어 자원을 쓰지 않습니다.',
    ],
    pipNote: '화면 안 작은 창(PiP)은 화면의 레이어 자원을 사용합니다. PiP만의 별도 최대 개수는 확인되지 않았습니다.',
    calculationNote: `2×2 4K60 화면 1개 = 출력 ${rsExample.outputs}개 × 용량 ${rsExample.outputCapacity} = 출력 링크 ${rsExample.outputLinks}개 = VPU ${rsExample.vpusForScreen}개. VPU 1개의 소스 링크 8개로 믹싱 ${rsExample.mixingLayersPerScreen}개 또는 분할 ${rsExample.splitLayersPerScreen}개를 처리하는 매뉴얼 예시입니다. 화면 자체의 고정 상한은 아닙니다. (Aquilon User Manual v6.2, 61·66·79쪽)`,
    cautionNotes: [
      '배경 콘텐츠는 출력 용량과 일치해야 하며 확대·축소되지 않습니다. 2×2 4K60 화면은 출력마다 4K60 소스가 필요합니다. (Aquilon User Manual v6.2, 101쪽)',
      'Aquilon은 출력 링크 8개인 2×2 4K60 화면에서도 레이어를 VPU 여러 개에 나눌 수 있습니다. C+의 용량 4 믹싱 6개는 실제 적용(APPLY)에 성공했고 7개째는 거부됐습니다. 화면당 4개는 VPU 1개 예시입니다. 용량 2 믹싱 12개는 시뮬레이터의 추가 가능 수 표시이며 APPLY 검증값은 아닙니다. (AW LivePremier Simulator 6.2.2(펌웨어 6.2.79), 2026-10-17 실측)',
      'Aquilon 기본 모드에서 용량 1 믹싱 1개를 적용하자 남은 용량 1·2·4 믹싱 수가 각각 12→11, 12→5, 6→2로 바뀌었습니다. 혼합 비용은 레이어 용량·걸친 출력 범위에 따라 달라집니다. Alta·Midra에는 적용하지 않습니다. (AW LivePremier Simulator 6.2.2(펌웨어 6.2.79), 2026-10-17 실측; Aquilon User Manual v6.2, 69쪽)',
      'Aquilon C+에서 Region을 출력 링크 4개로 제한한 용량 1 믹싱은 24개, 화면 전체 출력 링크 8개를 걸치면 12개였습니다. 기본 모드의 레이어 링크 비용은 max(레이어 용량, 걸친 출력 링크÷4의 올림)이며 Cut&Fill은 그 두 배입니다. Region Captive PiP 용어는 RS1 데이터시트 3쪽에 있습니다. (AW LivePremier Simulator 6.2.2(펌웨어 6.2.79), 2026-10-17 실측; Aquilon User Manual v6.2, 68·83쪽)',
      'Aquilon Optimized mode에서는 4링크 경계가 없어지고 레이어 비용이 용량 1·2·4 그대로입니다(Cut&Fill은 두 배). 용량 4 Cut&Fill은 기본 모드에서 불가하지만 이 모드에서는 가능했습니다. 시뮬레이터 실측은 Aquilon에만 해당합니다. (AW LivePremier Simulator 6.2.2(펌웨어 6.2.79), 2026-10-17 실측; Aquilon User Manual v6.2, 69쪽)',
    ],
    sourceNote: '근거: Aquilon User Manual v6.2 61·66·68·69·79·83·101쪽; Aquilon RS1 Technical Datasheet 3쪽; AW LivePremier Simulator 6.2.2(펌웨어 6.2.79), 2026-10-17 실측.',
  };
}

function renderTable(series, currentSlug) {
  const region = make('div', 'pg-table aw-layer-standards-table-wrap');
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', `${series.title} 레이어 기준`);
  region.tabIndex = 0;
  const table = make('table');
  const headings = series.id.startsWith('aquilon')
    ? ['모델', '2×2 4K60 화면 수', 'VPU 1개 예시(분할)', '장비 전체 레이어(분할)', '4K60 프로그램 출력', 'VPU']
    : series.id === 'alta'
      ? ['모델', '최대 화면 수', '최대 화면 수일 때 화면당(분할)', '장비 전체(분할)', '그때 AUX', '한 화면만 쓸 때(분할)', 'AUX 최대']
      : ['모델', '최대 4K60 화면', '최대 화면 수일 때 화면당(분할)', '장비 전체(분할)', '한 화면만 쓸 때(분할)', '운영 모드'];
  const head = make('thead');
  const header = make('tr');
  for (const label of headings) {
    const cell = make('th', '', label);
    cell.scope = 'col';
    header.append(cell);
  }
  head.append(header);
  table.append(head);
  const body = make('tbody');
  for (const row of series.models) {
    const tr = make('tr', row.slug === currentSlug ? 'aw-layer-standards-current' : '');
    if (row.slug === currentSlug) tr.setAttribute('aria-current', 'true');
    tr.append(make('th', '', row.model));
    const values = series.id.startsWith('aquilon')
      ? [`${row.screens}개`, `${row.mixPerScreen} (${row.splitPerScreen})`, `${row.totalMix} (${row.totalSplit})`, `${row.outputs}개`, `${row.processingUnits}개`]
      : series.id === 'alta'
        ? [`${row.screens}개`, `${row.mixPerScreen} (${row.splitPerScreen})`, `${row.totalMix} (${row.totalSplit})`, `${row.auxAtMaxScreens}개`, `${row.mixOneScreen} (${row.splitOneScreen})`, `${row.auxMax}개`]
        : [`${row.screens}개`, `${row.mixPerScreen} (${row.splitPerScreen})`, `${row.totalMix} (${row.totalSplit})`, `${row.mixOneScreen} (${row.splitOneScreen})`, row.modes.map(mode => mode.label).join(' · ')];
    for (const value of values) tr.append(make('td', '', value));
    body.append(tr);
  }
  table.append(body);
  region.append(table);
  return region;
}

export function renderAnalogWayLayerStandards(standards, currentSlug) {
  if (!standards?.series?.some(series => series.models.some(row => row.slug === currentSlug))) return null;
  const section = make('section', 'aw-layer-standards');
  section.id = 'analogway-layer-standards';
  section.dataset.supplemental = '';
  section.setAttribute('aria-labelledby', 'aw-layer-standards-title');
  const title = make('h2', '', '레이어 연출 기준');
  title.id = 'aw-layer-standards-title';
  section.append(title);
  section.append(make('p', 'aw-layer-standards-lead', '화면을 몇 개 만들지와 레이어를 어떻게 나눌지 볼 때 쓰는 시리즈별 기준입니다. 숫자는 각 제품 상세의 공개 레이어 자료에서 가져옵니다.'));
  for (const series of standards.series) {
    const block = make('section', 'aw-layer-standards-series');
    block.append(make('h3', '', series.title), renderTable(series, currentSlug));
    section.append(block);
  }
  section.append(make('p', 'aw-layer-standards-table-hint', '휴대폰에서는 표 안을 좌우로 밀어 모든 항목을 확인할 수 있습니다.'));
  const examples = make('div', 'aw-layer-standards-examples');
  examples.append(make('h3', '', '구성 예시'));
  const list = make('div', 'aw-layer-standards-example-grid');
  for (const example of standards.examples) {
    const card = make('article', 'aw-layer-standards-example');
    card.append(make('h4', '', example.title), make('p', '', example.text));
    list.append(card);
  }
  examples.append(list);
  section.append(examples);
  const explanations = make('ul', 'aw-layer-standards-explanations');
  for (const text of standards.explanations) explanations.append(make('li', '', text));
  explanations.append(make('li', '', standards.pipNote));
  section.append(explanations);
  const details = make('details', 'aw-layer-standards-cautions');
  details.append(make('summary', '', '계산 근거와 미확인 사항'));
  details.append(make('p', 'aw-layer-standards-calculation', standards.calculationNote));
  const cautions = make('ul');
  for (const note of standards.cautionNotes) cautions.append(make('li', '', note));
  details.append(cautions);
  details.append(make('small', 'aw-layer-standards-source', standards.sourceNote));
  section.append(details);
  return section;
}
