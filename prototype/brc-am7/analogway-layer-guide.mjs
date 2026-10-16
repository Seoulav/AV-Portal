// W-20261016-019: Analog Way 화면·레이어 설계 가이드.
// 사용자가 화면 구성(출력 수·레이어)을 넣으면 공식 매뉴얼 규칙으로 모델별 가능 여부를 판정한다.
// 계산은 순수 함수(evaluateModel·evaluateAll)로 두고 시험으로 고정한다. 렌더는 renderAnalogWayLayerGuide만 DOM을 쓴다.
import { AQUILON_RULES, models, guideSlugs, screenShapes, presets, assumptions } from './analogway-layer-guide-data.mjs';

export { guideSlugs, screenShapes, presets, models };

const shapeOf = id => screenShapes.find(shape => shape.id === id) ?? screenShapes[0];
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.trunc(Number(value) || 0)));

export function normalizeConfig(config = {}) {
  const screens = (Array.isArray(config.screens) ? config.screens : []).map(screen => ({
    shape: shapeOf(screen?.shape).id,
    layerType: screen?.layerType === 'split' ? 'split' : 'mixing',
    layers: clampInt(screen?.layers, 0, 8)
  }));
  return { screens, aux: clampInt(config.aux, 0, 16), inputs: clampInt(config.inputs, 0, 64) };
}

// 믹싱 레이어 1개 = 분할 레이어 2개(모든 시리즈 공통: 데이터시트 "doubled for split layers", Alta 매뉴얼 42쪽 "one pair of Split layers").
const mixingEquivalent = screen => screen.layerType === 'mixing' ? screen.layers : screen.layers / 2;

function evaluateAquilon(config, model) {
  const rules = AQUILON_RULES;
  const reasons = [];
  const screens = config.screens.map(screen => {
    const outputs = shapeOf(screen.shape).outputs;
    const outputLinks = outputs * rules.output4k60Capacity;
    const sourceLinks = screen.layerType === 'mixing' ? screen.layers * rules.mixingLayerLinks : screen.layers * rules.splitLayerLinks;
    return { outputs, outputLinks, sourceLinks };
  });
  const oversized = screens.filter(screen => screen.outputLinks > rules.vpuOutputLinks || screen.sourceLinks > rules.vpuSourceLinks);
  if (oversized.length) reasons.push(`화면 ${oversized.length}개가 VPU 1개의 링크(소스 ${rules.vpuSourceLinks}·출력 ${rules.vpuOutputLinks})를 넘습니다. 한 화면을 VPU 여러 개로 나누는 규칙은 미확인입니다(매뉴얼 66쪽).`);
  // 첫 적합(first-fit): 소스 링크가 큰 화면부터 VPU에 담는다. 화면 하나는 VPU 하나 안에 둔다(가정, 매뉴얼 67쪽 8×8 링크 한도).
  const bins = [];
  for (const screen of [...screens].filter(s => !oversized.includes(s)).sort((a, b) => b.sourceLinks - a.sourceLinks || b.outputLinks - a.outputLinks)) {
    let bin = bins.find(b => b.sourceLinks + screen.sourceLinks <= rules.vpuSourceLinks && b.outputLinks + screen.outputLinks <= rules.vpuOutputLinks && b.screens < rules.maxScreensPerVpu);
    if (!bin) { bin = { sourceLinks: 0, outputLinks: 0, screens: 0 }; bins.push(bin); }
    bin.sourceLinks += screen.sourceLinks; bin.outputLinks += screen.outputLinks; bin.screens += 1;
  }
  const vpusNeeded = bins.length + oversized.length;
  const pgmOutputs = screens.reduce((sum, screen) => sum + screen.outputs, 0);
  const mixingEq = config.screens.reduce((sum, screen) => sum + mixingEquivalent(screen), 0);
  if (!config.screens.length) reasons.push('화면을 1개 이상 넣어 주세요.');
  if (vpusNeeded > model.vpus) reasons.push(`필요한 VPU ${vpusNeeded}개 > 모델 VPU ${model.vpus}개 (매뉴얼 66·67쪽).`);
  if (mixingEq > model.mixingLayers4k) reasons.push(`4K 믹싱 환산 레이어 ${mixingEq}개 > 최대 ${model.mixingLayers4k}개 (데이터시트 가족표).`);
  if (pgmOutputs > model.programOutputs4k) reasons.push(`4K60 PGM 출력 ${pgmOutputs}개 > 최대 ${model.programOutputs4k}개 (매뉴얼 71쪽).`);
  if (pgmOutputs + config.aux > model.outputConnectors4k) reasons.push(`PGM ${pgmOutputs} + AUX ${config.aux} = 출력 ${pgmOutputs + config.aux}개 > 출력 커넥터 ${model.outputConnectors4k}개.`);
  if (config.inputs > model.inputs4k) reasons.push(`4K 입력 ${config.inputs}개 > 입력 ${model.inputs4k}개.`);
  return {
    ok: reasons.length === 0,
    reasons,
    mode: vpusNeeded ? `VPU ${vpusNeeded}개 사용` : '',
    usage: `VPU ${vpusNeeded}/${model.vpus} · 4K 믹싱 환산 ${mixingEq}/${model.mixingLayers4k} · PGM 출력 ${pgmOutputs}/${model.programOutputs4k} · 출력 커넥터 ${pgmOutputs + config.aux}/${model.outputConnectors4k} · 입력 ${config.inputs}/${model.inputs4k}`,
    detail: { vpusNeeded, pgmOutputs, mixingEq, screens }
  };
}

function evaluateAlta(config, model) {
  const reasons = [];
  const screens = config.screens.map(screen => ({
    outputs: shapeOf(screen.shape).outputs,
    resources: screen.layerType === 'mixing' ? screen.layers : Math.ceil(screen.layers / 2)
  }));
  const pgmOutputs = screens.reduce((sum, screen) => sum + screen.outputs, 0);
  const resources = screens.reduce((sum, screen) => sum + screen.resources, 0);
  if (!config.screens.length) reasons.push('화면을 1개 이상 넣어 주세요.');
  const wide = screens.filter(screen => screen.outputs > model.maxPgmOutputs);
  if (wide.length) reasons.push(`출력 ${wide[0].outputs}개 화면은 PGM 출력 최대 ${model.maxPgmOutputs}개를 넘습니다 (매뉴얼 25·43쪽).`);
  if (pgmOutputs > model.maxPgmOutputs) reasons.push(`PGM 출력 합 ${pgmOutputs}개 > 최대 ${model.maxPgmOutputs}개 (매뉴얼 25쪽).`);
  if (resources > model.layerResources) reasons.push(`레이어 자원 ${resources}개 > 최대 ${model.layerResources}개 (믹싱 1 = 자원 1, 분할 2 = 자원 1 · 매뉴얼 42쪽).`);
  if (config.aux > model.maxAux) reasons.push(`AUX ${config.aux}개 > 최대 ${model.maxAux}개 (매뉴얼 25·42쪽).`);
  if (pgmOutputs + config.aux > model.outputs) reasons.push(`PGM ${pgmOutputs} + AUX ${config.aux} > 출력 ${model.outputs}개.`);
  if (config.inputs > model.inputs4k) reasons.push(`4K 입력 ${config.inputs}개 > 4K 입력 ${model.inputs4k}개(+2K ${model.inputs2k}).`);
  return {
    ok: reasons.length === 0,
    reasons,
    mode: '',
    usage: `레이어 자원 ${resources}/${model.layerResources} · PGM 출력 ${pgmOutputs}/${model.maxPgmOutputs} · AUX ${config.aux}/${model.maxAux} · 출력 ${pgmOutputs + config.aux}/${model.outputs} · 4K 입력 ${config.inputs}/${model.inputs4k}`,
    detail: { pgmOutputs, resources, screens }
  };
}

function evaluateMidra(config, model) {
  const reasons = [];
  const screens = config.screens.map(screen => ({
    outputs: shapeOf(screen.shape).outputs,
    live: screen.layerType === 'mixing' ? screen.layers * 2 : screen.layers
  }));
  const liveTotal = screens.reduce((sum, screen) => sum + screen.live, 0);
  let mode = '';
  if (!screens.length) reasons.push('화면을 1개 이상 넣어 주세요.');
  else if (screens.length === 1 && screens[0].outputs === 1) {
    mode = 'Mixer 모드 (PGM 1 + AUX 1)';
    if (screens[0].live > model.liveLayersPerSystem) reasons.push(`라이브 레이어 ${screens[0].live}개 > 최대 ${model.liveLayersPerSystem}개 (믹싱 2 = 분할 4 · 매뉴얼 42쪽).`);
    if (config.aux > 1) reasons.push(`AUX ${config.aux}개 > Mixer 모드 AUX 1개(1080p) (매뉴얼 42쪽).`);
  } else if (screens.length === 1 && screens[0].outputs === 2) {
    mode = 'Blend 모드 (출력 2개 화면 1)';
    if (!model.blendMode) reasons.push('출력 2개 화면(Blend 모드)은 Eikos 4K만 지원합니다 (매뉴얼 41–42쪽).');
    if (screens[0].live > model.liveLayersPerSystem) reasons.push(`라이브 레이어 ${screens[0].live}개 > 최대 ${model.liveLayersPerSystem}개 (매뉴얼 42쪽).`);
    if (config.aux > 0) reasons.push('Blend 모드에는 AUX 출력이 없습니다 (매뉴얼 42쪽).');
  } else if (screens.length === 2 && screens.every(screen => screen.outputs === 1)) {
    mode = 'Matrix 모드 (PGM 2)';
    const over = screens.filter(screen => screen.live > model.liveLayersPerSystem / 2);
    if (over.length) reasons.push(`Matrix 모드는 화면마다 라이브 레이어 최대 ${model.liveLayersPerSystem / 2}개(믹싱 1 = 분할 2)입니다 (매뉴얼 42쪽).`);
    if (config.aux > 0) reasons.push('Matrix 모드에는 AUX 출력이 없습니다 (매뉴얼 42쪽).');
  } else {
    reasons.push(`화면 ${screens.length}개·출력 ${screens.reduce((sum, screen) => sum + screen.outputs, 0)}개 구성은 Midra 4K의 세 모드(Mixer·Matrix·Blend)에 없습니다 (매뉴얼 41–42쪽).`);
  }
  if (config.inputs > model.inputs4k) reasons.push(`4K 입력 ${config.inputs}개 > 4K 입력 ${model.inputs4k}개(+2K ${model.inputs2k}).`);
  return {
    ok: reasons.length === 0,
    reasons,
    mode,
    usage: `라이브 레이어 ${liveTotal}/${model.liveLayersPerSystem} · 출력 ${screens.reduce((sum, screen) => sum + screen.outputs, 0) + Math.min(config.aux, 1)}/${model.outputs} · 4K 입력 ${config.inputs}/${model.inputs4k}`,
    detail: { liveTotal, screens }
  };
}

export function evaluateModel(config, model) {
  const normalized = normalizeConfig(config);
  const evaluate = { aquilon: evaluateAquilon, alta: evaluateAlta, midra: evaluateMidra }[model.family];
  return { slug: model.slug, model: model.model, series: model.series, family: model.family, evidence: model.evidence, ...evaluate(normalized, model) };
}

export function evaluateAll(config) {
  const results = [...models].sort((a, b) => a.order - b.order).map(model => evaluateModel(config, model));
  const recommended = results.find(result => result.ok)?.slug ?? null;
  return results.map(result => ({ ...result, recommended: result.slug === recommended }));
}

// ---- 렌더 (DOM) ----
const element = (tag, className = '', value) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (value !== undefined && value !== null) item.textContent = String(value);
  return item;
};

export function renderAnalogWayLayerGuide(currentSlug) {
  const section = element('section', 'pg-card aw-guide');
  section.setAttribute('aria-labelledby', 'aw-guide-title');
  const heading = element('h2', '', '화면·레이어 설계 가이드 · Analog Way');
  heading.id = 'aw-guide-title';
  section.append(heading);
  section.append(element('p', 'aw-guide-intro', '원하는 화면 구성(출력 수·레이어 수)과 AUX·입력 수를 넣으면, 공식 사용설명서 규칙으로 Analog Way 11개 모델의 가능 여부와 가장 작은 추천 모델을 보여 줍니다. RTCOM 구성기처럼 구성에서 출발해 장비를 고르는 순서입니다.'));

  let state = normalizeConfig(presets[0]);
  const presetRow = element('div', 'aw-guide-presets');
  presetRow.append(element('span', 'aw-guide-label', '예시'));
  for (const preset of presets) {
    const button = element('button', 'pg-btn', preset.label);
    button.type = 'button';
    button.dataset.preset = preset.id;
    button.addEventListener('click', () => { state = normalizeConfig(preset); renderForm(); renderResults(); });
    presetRow.append(button);
  }
  section.append(presetRow);

  const form = element('form', 'aw-guide-form');
  form.addEventListener('submit', event => event.preventDefault());
  const screensBox = element('div', 'aw-guide-screens');
  form.append(screensBox);
  const controls = element('div', 'aw-guide-controls');
  const addButton = element('button', 'pg-btn', '+ 화면 추가');
  addButton.type = 'button';
  addButton.addEventListener('click', () => { if (state.screens.length < 8) { state.screens.push({ shape: 'single', layerType: 'mixing', layers: 2 }); renderForm(); renderResults(); } });
  const auxField = numberField('aux', 'AUX 출력 수', 0, 16);
  const inputField = numberField('inputs', '4K 입력 소스 수', 0, 64);
  controls.append(addButton, auxField.label, inputField.label);
  form.append(controls);
  section.append(form);

  const summary = element('p', 'aw-guide-summary');
  summary.setAttribute('aria-live', 'polite');
  section.append(summary);
  const wrap = element('div', 'pg-table aw-guide-table-wrap');
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Analog Way 모델별 판정표');
  wrap.tabIndex = 0;
  const table = element('table');
  table.append(element('caption', 'sr-only', 'Analog Way 모델별 판정표'));
  const head = element('thead');
  const headRow = element('tr');
  for (const label of ['모델', '판정', '자원 사용', '이유·모드']) { const cell = element('th', '', label); cell.scope = 'col'; headRow.append(cell); }
  head.append(headRow); table.append(head);
  const body = element('tbody');
  table.append(body); wrap.append(table); section.append(wrap);
  section.append(element('p', 'aw-guide-hint', '모바일에서는 표를 좌우로 밀어 자원 사용 열을 확인할 수 있습니다. 다른 모델 이름을 누르면 그 제품 상세로 이동합니다.'));

  const notes = element('details', 'aw-guide-notes');
  notes.append(element('summary', '', '계산 규칙·가정·근거'));
  const rules = element('ul');
  for (const text of [
    `Aquilon RS: VPU마다 소스 링크 ${AQUILON_RULES.vpuSourceLinks}·출력 링크 ${AQUILON_RULES.vpuOutputLinks}. 4K60 출력 1개 = 출력 링크 2, 4K 믹싱 레이어 1개 = 소스 링크 2, 분할 레이어 1개 = 소스 링크 1 (${AQUILON_RULES.evidence}).`,
    'Alta 4K(Zenith): 레이어 자원 1 = 믹싱 1 또는 분할 1쌍. Zenith 100 자원 3·출력 4·PGM 최대 3·AUX 최대 2, Zenith 200 자원 4·출력 6·PGM 최대 4·AUX 최대 4 (Alta 4K User Manual 25·42–43쪽).',
    'Midra 4K(Pulse·Eikos): Mixer 모드 PGM 1 + AUX 1, Matrix 모드 PGM 2(화면마다 라이브 레이어 2), Blend 모드(Eikos만) 출력 2개 화면 1. 시스템당 라이브 레이어 4 = 믹싱 2 또는 분할 4 (Midra 4K User Manual 41–42쪽, 데이터시트 5·6쪽).',
    ...assumptions
  ]) rules.append(element('li', '', text));
  notes.append(rules);
  const simulator = element('p', 'aw-guide-sim');
  simulator.append('최종 검증은 제조사 시뮬레이터로 합니다: ');
  const simLink = element('a', '', 'AW LivePremier Simulator 데이터시트(Aquilon, PC·Mac 오프라인 구성) ↗');
  simLink.href = 'https://dwn01.analogway.com/Site+Internet/Series/LivePremier/Common/Simulator/Technical+Datasheets/livepremier-simulator-datasheet-en.pdf';
  simLink.target = '_blank'; simLink.rel = 'noopener noreferrer';
  simulator.append(simLink, ' · Alta 4K·Midra 4K 시뮬레이터는 analogway.com 다운로드 센터에서 받습니다.');
  notes.append(simulator);
  section.append(notes);

  function numberField(key, text, min, max) {
    const label = element('label', 'aw-guide-field');
    label.append(element('span', '', text));
    const input = element('input');
    input.type = 'number'; input.min = String(min); input.max = String(max); input.id = `aw-guide-${key}`;
    input.addEventListener('input', () => { state[key] = clampInt(input.value, min, max); renderResults(); });
    label.append(input);
    return { label, input };
  }

  function renderForm() {
    screensBox.replaceChildren();
    state.screens.forEach((screen, index) => {
      const row = element('div', 'aw-guide-screen');
      row.append(element('strong', '', `화면 ${index + 1}`));
      const shape = element('select');
      shape.id = `aw-guide-shape-${index}`;
      shape.setAttribute('aria-label', `화면 ${index + 1} 구성`);
      for (const option of screenShapes) { const item = element('option', '', option.label); item.value = option.id; item.selected = option.id === screen.shape; shape.append(item); }
      shape.addEventListener('change', () => { screen.shape = shape.value; renderResults(); });
      const type = element('select');
      type.id = `aw-guide-type-${index}`;
      type.setAttribute('aria-label', `화면 ${index + 1} 레이어 종류`);
      for (const [value, text] of [['mixing', '믹싱 레이어(심리스)'], ['split', '분할 레이어(컷)']]) { const item = element('option', '', text); item.value = value; item.selected = value === screen.layerType; type.append(item); }
      type.addEventListener('change', () => { screen.layerType = type.value; renderResults(); });
      const layers = element('input');
      layers.type = 'number'; layers.min = '0'; layers.max = '8'; layers.value = String(screen.layers); layers.id = `aw-guide-layers-${index}`;
      layers.setAttribute('aria-label', `화면 ${index + 1} 레이어 수`);
      layers.addEventListener('input', () => { screen.layers = clampInt(layers.value, 0, 8); renderResults(); });
      const remove = element('button', 'pg-btn aw-guide-remove', '삭제');
      remove.type = 'button';
      remove.setAttribute('aria-label', `화면 ${index + 1} 삭제`);
      remove.addEventListener('click', () => { state.screens.splice(index, 1); renderForm(); renderResults(); });
      row.append(shape, type, layers, element('span', 'aw-guide-unit', '개'), remove);
      screensBox.append(row);
    });
    auxField.input.value = String(state.aux);
    inputField.input.value = String(state.inputs);
  }

  function renderResults() {
    const results = evaluateAll(state);
    const recommended = results.find(result => result.recommended);
    const current = results.find(result => result.slug === currentSlug);
    summary.textContent = recommended
      ? `추천: ${recommended.model} (가능한 모델 중 가장 작은 모델)${current ? ` · 지금 보는 ${current.model}: ${current.ok ? '가능' : '불가'}` : ''}`
      : '이 구성을 만들 수 있는 Analog Way 모델이 없습니다. 화면·레이어·AUX 값을 줄여 보세요.';
    body.replaceChildren();
    for (const result of results) {
      const row = element('tr', `${result.ok ? 'aw-guide-ok' : 'aw-guide-no'}${result.slug === currentSlug ? ' aw-guide-current' : ''}`);
      if (result.slug === currentSlug) row.setAttribute('aria-current', 'true');
      const name = element('th');
      name.scope = 'row';
      if (result.slug === currentSlug) name.append(element('span', '', result.model), element('small', '', ' · 현재 제품'));
      else { const link = element('a', '', result.model); link.href = `./?product=${result.slug}`; name.append(link); }
      if (result.recommended) name.append(element('span', 'aw-guide-badge', '추천'));
      const verdict = element('td', '', result.ok ? '가능' : '불가');
      const usage = element('td', 'aw-guide-usage', result.usage);
      const why = element('td');
      if (result.mode) why.append(element('div', '', result.mode));
      if (result.reasons.length) { const list = element('ul'); for (const reason of result.reasons) list.append(element('li', '', reason)); why.append(list); }
      else why.append(element('small', '', result.evidence));
      row.append(name, verdict, usage, why);
      body.append(row);
    }
  }

  renderForm();
  renderResults();
  return section;
}
