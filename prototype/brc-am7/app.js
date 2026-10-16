import { layerComparisonFor, layerComparisonHeadings } from './layer-tables.mjs?v=w20261013-017-labels';
import { renderLead, renderKeyFacts, renderPortMap, renderPortMapCards, renderIoFallbackCards, renderSignalFlow, renderSetting } from './detail-enhancement-view.mjs?v=w20261014-pixelfit-layout';
import { portMapImageMatches, selectSection03Content } from './detail-enhancements.mjs?v=w20261016-011-video-layer-plan';
import { prepareProductDetail, visibleDetailCards, connectorPresentation, prepareIoFallbackEntries, orderSpecificationRows, prepareOutputPowerTable } from './product-detail-model.mjs?v=w20261016-011-video-layer-plan';
import { resolveDocumentAction, uploadedDocumentsFor, documentCardVisible, documentActionLabels } from './pdf-documents.mjs';
import { createPdfViewer } from '../../beta/site/shared/pdf-viewer.mjs';
import { adaptRtcomDetail } from '../../beta/site/shared/rtcom-adapter.mjs';
import { distributorLinkFor } from '../../beta/distributor-links.mjs';
import { brandForProduct, brandListingHref } from '../../beta/site/shared/brand-links.mjs';
import { mountRtcomProductView } from '../../beta/site/detail/rtcom-embed.mjs?v=w20261013-002';
import { renderDs8sGuide } from './ds8s-guide.mjs?v=w20261013-005-followup';
import { frontConnectionPointsFor, frontPointPercent } from './front-connection-points.mjs';

const $ = selector => document.querySelector(selector);
const element = (tag, className = '', value) => {
  const item = document.createElement(tag);
  item.className = className;
  if (value !== undefined && value !== null) item.textContent = String(value);
  return item;
};
const goodDocument = item => Boolean(item?.url && ['VERIFIED', 'FOUND', 'READY'].includes(item.status));
const statusClass = status => ({
  VERIFIED: 'state-verified', FOUND: 'state-found', READY: 'state-ready',
  PARTIAL: 'state-partial', MISSING: 'state-missing',
  'REVIEW REQUIRED': 'state-review', CONFLICTED: 'state-conflict'
})[status] ?? 'state-review';
const badge = status => element('span', 'state ' + statusClass(status), status);
function renderAquilonLayerPlan(plan, currentSlug) {
  const section = element('section', 'aquilon-layer-plan');
  section.setAttribute('aria-labelledby', 'aquilon-layer-title');
  section.append(element('h2', '', plan.title));
  section.append(element('p', 'aquilon-layer-intro', '2×2 4K60 화면 한 개에는 모든 Aquilon 모델에서 4K 믹싱 레이어 최대 4개(분할 8개)를 배치할 수 있습니다. 큰 모델은 같은 구성을 더 많이 만들 수 있습니다.'));
  const current = plan.models.find(row => row.slug === currentSlug);
  const metrics = element('div', 'aquilon-layer-metrics');
  for (const [label, value] of [
    ['2×2 4K60 화면 최대', `${current.screens2x2}개`],
    ['화면당 4K 믹싱 레이어', `${current.mixingLayers4kPerScreen}개`],
    ['화면당 분할 레이어', `${current.splitLayers2kPerScreen}개`],
    ['장비 전체 4K 믹싱 레이어', `${current.mixingLayers4k}개`]
  ]) {
    const card = element('div', 'aquilon-layer-metric');
    card.append(element('small', '', label), element('strong', '', value));
    metrics.append(card);
  }
  section.append(metrics);
  const diagram = element('div', 'aquilon-layer-diagram');
  diagram.setAttribute('role', 'img');
  diagram.setAttribute('aria-label', '입력·정지 화면 등 소스가 Aquilon 레이어 풀을 거쳐 2 곱하기 2 4K 화면으로 출력되는 예시');
  const sources = element('div', 'aquilon-layer-node aquilon-layer-sources');
  sources.append(element('strong', '', '레이어 소스'));
  for (const source of plan.sourceTypes) sources.append(element('span', '', source));
  const pool = element('div', 'aquilon-layer-node aquilon-layer-pool');
  pool.append(element('strong', '', 'Aquilon 레이어 풀'), element('span', '', `이 화면에서 4K 믹싱 레이어 ${current.mixingLayers4kPerScreen}개`), element('span', '', `분할 레이어 ${current.splitLayers2kPerScreen}개`));
  const output = element('div', 'aquilon-layer-node aquilon-layer-output');
  output.append(element('strong', '', '2×2 4K 화면'), element('span', '', '화면에 출력 연결된 4개 출력 링크'));
  diagram.append(sources, element('span', 'aquilon-layer-arrow', '→'), pool, element('span', 'aquilon-layer-arrow', '→'), output);
  section.append(diagram);
  const example = plan.example;
  const calculation = element('div', 'aquilon-layer-callout');
  calculation.append(element('h3', '', example.title));
  calculation.append(element('p', '', `2×2 화면은 4K60 출력 ${example.outputs}개입니다. 출력마다 용량 ${example.outputCapacity}이므로 출력 링크 ${example.outputLinks}개가 필요합니다. VPU 1개의 소스 링크 ${example.sourceLinksPerVpu}개를 쓰며, 용량 ${example.layerCapacity} 믹싱 레이어 하나는 ${example.layerLinksPerMixer}개 링크를 사용합니다. 따라서 화면 전체는 4K 믹싱 레이어 ${example.mixingLayersPerScreen}개, 분할 레이어 ${example.splitLayersPerScreen}개가 최대입니다.`));
  calculation.append(element('small', '', '근거: Aquilon User Manual v6.2, 61·66쪽(4K 출력 용량·레이어 링크), 68쪽(VPU 용량), 79쪽(VPU별 믹싱 레이어).'));
  section.append(calculation);
  const comparison = element('div', 'aquilon-layer-comparison');
  comparison.append(element('h3', '', '같은 2×2 화면 예시 · XDM-WOS100 비교'));
  const compareGrid = element('div', 'aquilon-layer-comparison-grid');
  const aquilonCompare = element('div', 'aquilon-layer-compare-card');
  aquilonCompare.append(element('strong', '', 'Aquilon RS · 모든 모델'), element('p', '', `2×2 4K60 화면 전체에 4K 믹싱 레이어 최대 ${example.mixingLayersPerScreen}개(분할 ${example.splitLayersPerScreen}개).`));
  const xdmCompare = element('div', 'aquilon-layer-compare-card');
  xdmCompare.append(element('strong', '', 'RTCOM XDM-WOS100'), element('p', '', `RTCOM 원본: HDMI 출력 ${plan.xdmComparison.xdmWos100.outputPorts}개. ${plan.xdmComparison.xdmWos100.sourceCondition}.`));
  compareGrid.append(aquilonCompare, xdmCompare);
  comparison.append(compareGrid, element('small', '', 'RTCOM 원본에는 XDM-WOS100의 2×2 화면당 레이어 개수가 명시되어 있지 않아 숫자 비교는 하지 않습니다.'));
  section.append(comparison);
  section.append(element('p', 'aquilon-layer-table-hint', '모바일에서는 표를 좌우로 밀어 입력·출력 단자·VPU 열을 확인할 수 있습니다.'));
  const wrap = element('div', 'pg-table aquilon-layer-table-wrap');
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Aquilon RS 모델별 레이어·출력 비교표');
  wrap.tabIndex = 0;
  const table = element('table');
  const columns = ['모델', '2×2 4K60 화면 수', '화면당 4K 레이어(분할)', '장비 전체 4K 레이어(분할)', '4K 입력', '4K 출력 단자', '4K60 PGM 출력', 'VPU'];
  const head = element('thead');
  const header = element('tr');
  for (const label of columns) { const cell = element('th', '', label); cell.scope = 'col'; header.append(cell); }
  head.append(header); table.append(head);
  const body = element('tbody');
  for (const rowData of plan.models) {
    const row = element('tr', rowData.slug === currentSlug ? 'aquilon-layer-current' : '');
    if (rowData.slug === currentSlug) row.setAttribute('aria-current', 'true');
    row.append(element('th', '', rowData.model));
    for (const value of [rowData.screens2x2, `${rowData.mixingLayers4kPerScreen} (${rowData.splitLayers2kPerScreen})`, `${rowData.mixingLayers4k} (${rowData.splitLayers2k})`, rowData.inputs4k, rowData.outputConnectors4k, rowData.programOutputs4k, rowData.vpus]) row.append(element('td', '', value));
    body.append(row);
  }
  table.append(body); wrap.append(table); section.append(wrap);
  const notes = element('ul', 'aquilon-layer-notes');
  for (const note of plan.notes) notes.append(element('li', '', note));
  section.append(notes);
  section.append(element('small', 'aquilon-layer-sources-note', `4K60 프로그램 출력 수 근거: Aquilon User Manual v6.2 ${plan.evidence.programOutputsManualPage}쪽. 출력 커넥터·입력 수 근거: 공식 브로슈어 ${plan.evidence.outputConnectorsBrochurePage}쪽.`));
  return section;
}
function renderVideoLayerPlan(plan, currentSlug) {
  const section = element('section', 'video-layer-plan');
  section.setAttribute('aria-labelledby', 'video-layer-title');
  const heading = element('h2', '', plan.title);
  heading.id = 'video-layer-title';
  section.append(heading);
  const current = plan.models.find(row => row.slug === currentSlug);
  if (!current) return section;
  section.append(element('p', 'video-layer-intro', current.headline));

  const metrics = element('div', 'video-layer-metrics');
  const metricRows = current.resourceScope === 'device'
    ? [
        ['4K60 PGM 출력 구성 최대', `${current.maxPgm4kScreens}개`],
        ['한 화면에 배정 시 최대', `${current.maxMixing4kPerScreen} 믹싱 (${current.maxSplit4kPerScreen} 분할)`],
        ['장비 전체 레이어 자원', `${current.totalMixing4k} 믹싱 (${current.totalSplit4k} 분할)`],
        ['미사용 출력의 Aux 최대', `${current.maxAuxOutputs}개 · 최대 1080p60`]
      ]
    : [
        ['4K60 PGM 화면 구성 최대', `${current.maxPgm4kScreens}개`],
        ['화면당 최대 · Mixer', `${current.screenModes.find(mode => mode.id === 'mixer')?.mixing4kPerScreen ?? current.maxMixing4kPerScreen} 믹싱 (${current.screenModes.find(mode => mode.id === 'mixer')?.split4kPerScreen ?? current.maxSplit4kPerScreen} 분할)`],
        ['장비 전체 4K 레이어', `${current.totalMixing4k} 믹싱 (${current.totalSplit4k} 분할)`],
        ['Aux 출력 최대', `${current.maxAuxOutputs}개 · 최대 1080p60`]
      ];
  for (const [label, value] of metricRows) {
    const card = element('div', 'video-layer-metric');
    card.append(element('small', '', label), element('strong', '', value));
    metrics.append(card);
  }
  section.append(metrics);

  const modes = element('div', 'video-layer-modes');
  modes.append(element('h3', '', current.resourceScope === 'device' ? '레이어 자원 배분' : '동작 모드별 화면 구성'));
  for (const mode of current.screenModes) {
    const card = element('article', 'video-layer-mode');
    card.append(element('h4', '', mode.label));
    card.append(element('p', '', mode.layout));
    const allocation = current.resourceScope === 'device'
      ? `장비 전체 ${mode.totalMixing4k} 믹싱 / ${mode.totalSplit4k} 분할 자원을 PGM Screen에 배분합니다. 한 화면에 전부 배정하면 최대 ${mode.mixing4kPerScreen} 믹싱 / ${mode.split4kPerScreen} 분할이며, 여러 화면으로 나누면 화면별 수는 배분에 따라 달라집니다.`
      : `4K60 PGM 화면 ${mode.pgmScreens}개 · 화면당 최대 ${mode.mixing4kPerScreen} 믹싱 / ${mode.split4kPerScreen} 분할 레이어 · 모드 전체 ${mode.totalMixing4k} 믹싱 / ${mode.totalSplit4k} 분할`;
    card.append(element('p', '', allocation));
    if (mode.outputsPerScreen) card.append(element('p', '', `화면당 출력 ${mode.outputsPerScreen}개`));
    if (mode.auxOutputs) card.append(element('p', '', `이 모드의 Aux 출력 ${mode.auxOutputs}개`));
    modes.append(card);
  }
  section.append(modes);

  const comparison = element('div', 'video-layer-comparison');
  comparison.append(element('h3', '', '같은 4K 구성의 비교 자료'));
  const compareGrid = element('div', 'video-layer-comparison-grid');
  const xdm = element('article', 'video-layer-compare-card');
  xdm.append(element('strong', '', plan.comparison.xdm.model));
  xdm.append(element('p', '', `RTCOM 원본에는 ${plan.comparison.xdm.outputPorts}개 HDMI 출력과 다음 조건이 기록돼 있습니다.`));
  xdm.append(element('p', '', plan.comparison.xdm.sourceCondition));
  xdm.append(element('p', '', 'RTCOM 원본은 이 구성의 레이어 최대 개수를 명시하지 않습니다.'));
  const aquilon = element('article', 'video-layer-compare-card');
  aquilon.append(element('strong', '', 'Aquilon RS'));
  aquilon.append(element('p', '', plan.comparison.aquilon));
  compareGrid.append(xdm, aquilon);
  comparison.append(compareGrid);
  section.append(comparison);

  const tableTitle = element('h3', '', 'Midra 4K · Alta 4K 모델 비교');
  section.append(tableTitle, element('p', 'video-layer-table-hint', '휴대폰에서는 표 안을 좌우로 밀어 나머지 열을 확인할 수 있습니다.'));
  const wrap = element('div', 'pg-table video-layer-table-wrap');
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Midra 4K 및 Alta 4K 모델별 출력·레이어 자원 비교');
  wrap.tabIndex = 0;
  const table = element('table');
  const head = element('thead');
  const header = element('tr');
  for (const label of ['모델', '시리즈', '4K60 PGM 화면 구성 최대', '한 화면에 배정 시 최대 레이어', '장비 전체 레이어 자원', 'Aux 출력 최대']) {
    const cell = element('th', '', label); cell.scope = 'col'; header.append(cell);
  }
  head.append(header); table.append(head);
  const body = element('tbody');
  for (const rowData of plan.models) {
    const row = element('tr', rowData.slug === currentSlug ? 'video-layer-current' : '');
    if (rowData.slug === currentSlug) row.setAttribute('aria-current', 'true');
    row.append(element('th', '', rowData.model));
    row.append(element('td', '', rowData.series));
    row.append(element('td', '', `${rowData.maxPgm4kScreens}개`));
    row.append(element('td', '', `${rowData.maxMixing4kPerScreen} 믹싱 (${rowData.maxSplit4kPerScreen} 분할)`));
    row.append(element('td', '', `${rowData.totalMixing4k} 믹싱 (${rowData.totalSplit4k} 분할)`));
    row.append(element('td', '', `${rowData.maxAuxOutputs}개`));
    body.append(row);
  }
  table.append(body); wrap.append(table); section.append(wrap);

  const notes = element('ul', 'video-layer-notes');
  for (const note of plan.notes) notes.append(element('li', '', note));
  section.append(notes);
  section.append(element('small', 'video-layer-source-note', '근거: Midra 4K User Manual, 인쇄 41–44쪽; Alta 4K User Manual, 인쇄 25·41–43·46쪽; 모델별 공식 Technical Datasheet 5–6쪽. 정확한 원문 인용과 쪽수는 작업 PR 본문에 기록합니다.'));
  return section;
}

function safeLink(url, label, className = '', allowedHttpHost = '') {
  const parsed = new URL(url);
  const vsEntPage = productKey === 'ds-8s' && parsed.href === 'http://www.vsent.co.kr/bbs/board.php?bo_table=c4&wr_id=14';
  const allowedHttp = parsed.protocol === 'http:' && (parsed.hostname === allowedHttpHost || vsEntPage);
  if ((parsed.protocol !== 'https:' && !allowedHttp) || parsed.username || parsed.password) throw new Error('공식 링크 형식이 올바르지 않습니다.');
  const link = element('a', className, label);
  link.href = parsed.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}
const productKey = new URLSearchParams(location.search).get('product');
const isRtcomProduct = productKey?.startsWith('rtcom-');
let data;
const isHistoryTraversal = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
if (location.hash && !isHistoryTraversal) history.scrollRestoration = 'manual';
const allowContentFallback = true;
if (!productKey && !allowContentFallback) {
  location.replace('../');
} else {
  try {
    if (productKey && !/^[a-z0-9-]+$/.test(productKey)) throw new Error('제품 주소 형식이 올바르지 않습니다.');
    const rtcomId = isRtcomProduct ? productKey.slice('rtcom-'.length) : null;
    const productDataPath = productKey ? `./data/${productKey}.json` : './content.json';
    const rtcomDataPath = `../../beta/site/rtcom/raw/products/${rtcomId}.json`;
    const response = await fetch(rtcomId ? rtcomDataPath : productDataPath);
    if (!response.ok) throw new Error('시안 콘텐츠를 읽을 수 없습니다.');
    const rawData = await response.json();
    data = prepareProductDetail(rtcomId ? adaptRtcomDetail(rawData) : rawData, { compactFallback: !rtcomId });
  } catch (error) {
    const notice = element('div', 'load-failure', error.message);
    notice.setAttribute('role', 'alert');
    const back = element('a', '', 'Library로 돌아가기 →');
    back.href = '../';
    notice.append(back);
    $('#main').prepend(notice);
    throw error;
  }

  const enhancements = data.enhancements;
  const section03Content = selectSection03Content(enhancements);
  document.title = `${data.manufacturer} ${data.model} · AV Portal Product Detail 시안`;
  for (const [selector, value] of [
    ['meta[name="description"]', data.english],
    ['meta[property="og:title"]', `${data.manufacturer} ${data.model}`],
    ['meta[property="og:description"]', data.english],
    ['meta[property="og:url"]', location.href.split('#')[0]]
  ]) {
    const meta = $(selector);
    if (meta && value) meta.content = value;
  }

  const mobile = matchMedia('(max-width: 650px)');
  const searchForm = $('#detail-search-form');
  const searchToggle = $('#detail-search-toggle');
  function setMobileSearch(open = false) {
    searchToggle.hidden = !mobile.matches;
    searchForm.hidden = mobile.matches && !open;
    searchToggle.setAttribute('aria-expanded', String(mobile.matches && open));
    searchToggle.setAttribute('aria-label', open ? '제품 검색 닫기' : '제품 검색 열기');
    if (mobile.matches && open) requestAnimationFrame(() => $('#detail-search').focus());
  }
  searchToggle.addEventListener('click', () => setMobileSearch(searchToggle.getAttribute('aria-expanded') !== 'true'));
  searchForm.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches) { setMobileSearch(false); searchToggle.focus(); }
  });
  mobile.addEventListener('change', () => setMobileSearch(false));
  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const query = $('#detail-search').value.trim();
    if (query) location.href = (productKey ? '../' : 'https://seoulav.github.io/AV-Portal/') + `?q=${encodeURIComponent(query)}`;
  });
  setMobileSearch();

  let catalog = [];
  try {
    const catalogResponse = await fetch('../../beta/site/catalog.json');
    if (catalogResponse.ok) catalog = await catalogResponse.json();
  } catch { /* Keep the detail page usable when the catalog is unavailable. */ }
  const brand = brandForProduct(catalog, productKey, data.manufacturer);
  const brandHref = brandListingHref(brand, '../../beta/site/');
  $('#breadcrumb-brand').textContent = data.manufacturer;
  $('#breadcrumb-brand').href = brandHref;
  $('#breadcrumb-model').textContent = data.model;
  $('#product-name').textContent = data.productName || data.model;
  const subtitleBrand = element('a', 'subtitle-brand', data.manufacturer);
  subtitleBrand.href = brandHref;
  $('#product-subtitle').replaceChildren(subtitleBrand);
  if (enhancements.subtitle || data.english) $('#product-subtitle').append(` · ${enhancements.subtitle || data.english}`);
  $('#footer-product').textContent = `${data.manufacturer} ${data.model}`;
  $('#footer-manufacturer').textContent = data.manufacturer;
  $('#footer-manufacturer').href = brandHref;
  $('#dialog-product').textContent = `${data.manufacturer} ${data.model}`;
  const category = String(data.categories.at(-1) ?? '').toLowerCase();
  const pictograms = [
    [/amplifier|앰프/, '≋'], [/speaker|스피커/, '◖'], [/microphone|마이크|wireless/, '♩'],
    [/mixer|mixing|audio processor|dsp|오디오/, '☷'], [/projector|프로젝터/, '▣'],
    [/display|signage|사이니지|led/, '▤'], [/camera|카메라/, '◉'],
    [/switcher|converter|matrix|processor/, '⤨'], [/conference|회의/, '▣'],
    [/network|네트워크/, '☷'], [/control|제어/, '◉']
  ];
  $('#category-swatch').textContent = pictograms.find(([pattern]) => pattern.test(category))?.[1] ?? 'AV';

  const official = data.officialPage;
  if (official?.url) {
    const sourceLabel = data.presentation.sourceProductLabel ?? '공식 제품 페이지 ↗';
    $('#header-official').append(safeLink(official.url, sourceLabel, 'pg-btn'));
    $('#footer-official-link').append(safeLink(official.url, sourceLabel, 'pg-btn'));
    $('#dialog-product-link').href = official.url;
  } else $('#dialog-product-link').hidden = true;

  const distributorLink = distributorLinkFor(productKey, data.manufacturer);
  if (distributorLink) {
    const distributorName = distributorLink.distributor;
    const headerName = distributorName === '테크데이타피에스' ? '테크데이타' : distributorName;
    const allowedHttpHost = distributorName === '한국에빅스' ? 'avics.co.kr' : '';
    $('#header-distributor').append(safeLink(distributorLink.url, `국내 총판 ${headerName} ↗`, 'pg-btn', allowedHttpHost));
    $('#footer-distributor-link').append(safeLink(distributorLink.url, `국내 총판 · ${distributorName} ↗`, 'pg-btn', allowedHttpHost));
  }

  const manifestPath = '../../beta/site/docs/manifest.json';
  let documentManifest = { mirrors: [], uploads: [] };
  try {
    const manifestResponse = await fetch(manifestPath);
    if (manifestResponse.ok) documentManifest = await manifestResponse.json();
  } catch { /* External document links remain available. */ }
  const pdfViewer = createPdfViewer();
  const uploadedDocuments = uploadedDocumentsFor(productKey, documentManifest, data.quickDocuments.map(item => item.resource?.file).filter(Boolean));
  const linkedDocuments = [
    ...data.quickDocuments.filter(item => item.available).map(item => ({ ...item.resource, label: item.label })),
    ...data.additionalDocuments.filter(goodDocument).map(item => ({ ...item, label: item.type }))
  ];
  const openDocuments = productKey === 'dm3'
    ? [...uploadedDocuments, ...linkedDocuments]
    : [...linkedDocuments, ...uploadedDocuments];
  function appendDocumentActions(container, item, header = false) {
    const action = item.action ?? resolveDocumentAction(item, documentManifest);
    if (!action) return;
    const labels = documentActionLabels(item, action, header);
    if (action.kind === 'external') {
      container.append(safeLink(action.url, labels.primary, 'pg-btn',
        isRtcomProduct && item.type === 'Official Link' ? 'rtcomav.com' : ''));
      return;
    }
    const showDocument = trigger => pdfViewer.open({
      file: action.file, title: item.title ?? item.label, sourceUrl: action.sourceUrl,
      locked: action.locked === true, trigger
    });
    const open = element('button', 'pg-btn', labels.primary);
    open.type = 'button';
    open.dataset.pdfOpen = 'true';
    open.addEventListener('click', () => showDocument(open));
    const download = element(action.locked ? 'button' : 'a', 'pg-btn', labels.download);
    if (action.locked) {
      download.type = 'button';
      download.title = '비밀번호로 문서를 연 뒤 내려받을 수 있습니다.';
      download.addEventListener('click', () => showDocument(download));
    } else {
      download.href = action.file;
      download.download = action.file.split('/').at(-1);
    }
    if (header) download.setAttribute('aria-label', labels.downloadAria);
    container.append(open, download);
  }
  for (const document of openDocuments.slice(0, 3)) {
    const pill = element('span', 'pg-doc');
    appendDocumentActions(pill, document, true);
    $('#header-docs').append(pill);
  }
  for (const document of openDocuments) {
    const row = element('div', 'document-row');
    const main = element('div');
    main.append(element('small', 'document-type', document.label ?? document.type),
      element('strong', '', document.title ?? document.label),
      element('small', '', [document.language, document.revision, document.note].filter(Boolean).join(' · ')));
    const actions = element('span', 'document-actions');
    appendDocumentActions(actions, document);
    row.append(main, badge(document.status), actions);
    $('#documents-list').append(row);
  }

  $('#overview-summary').textContent = data.korean || data.overview || data.english || '';
  if (enhancements.lead) $('#overview-summary').replaceChildren(renderLead(enhancements.lead));
  const fullOverview = data.overview || data.korean || '';
  $('#overview-copy').textContent = fullOverview;
  $('#overview-more').hidden = !fullOverview || fullOverview.trim() === $('#overview-summary').textContent.trim();
  for (const value of data.categories) $('#categories').append(element('span', 'pg-pill', value));
  if (!isRtcomProduct) $('#key-specs').classList.add('av-fallback-facts');
  const fallbackSpecs = data.keySpecifications.slice(0, 4);
  if (isRtcomProduct || fallbackSpecs.length >= 2) for (const specification of fallbackSpecs) {
    const cell = element('div');
    const displayValue = [specification.value, specification.unit].filter(Boolean).join(' ');
    cell.append(element('dt', '', specification.name), element('dd', displayValue.length > (isRtcomProduct ? 20 : 16) ? 'long-key-value' : '', displayValue));
    $('#key-specs').append(cell);
  }
  if (enhancements.keyFacts.length) {
    const facts = renderKeyFacts(enhancements.keyFacts); facts.id = 'key-specs';
    $('#key-specs').replaceWith(facts);
  }
  $('#key-specs').hidden = !$('#key-specs').children.length;

  let selectedImage = 0;
  let showFrontPoints = false;
  let zoomOpener = null;
  const imageBase = data.presentation.imageBase ?? './images/';
  const featured = $('#featured-image');
  const dialog = $('#image-dialog');
  const galleryBasis = $('#gallery-basis');
  const frontPoints = frontConnectionPointsFor(data);
  const frontImageIndex = data.images.findIndex(image => image.file === frontPoints?.measuredImage.file);
  const maps = enhancements.portMaps.length ? enhancements.portMaps : enhancements.portMap ? [enhancements.portMap] : [];
  const mapForImage = image => maps.find(map => map.imageFile
    ? map.imageFile === image?.file : map.image === image?.role);
  if (!enhancements.portMap && data.io.length) {
    galleryBasis.textContent = '— 입출력 표 기준';
    galleryBasis.hidden = false;
  }
  function paintFrontPoints(layer, image) {
    layer.replaceChildren();
    if (!showFrontPoints || !frontPoints || !image.complete ||
        image.naturalWidth !== frontPoints.measuredImage.width ||
        image.naturalHeight !== frontPoints.measuredImage.height) return;
    const imageRect = image.getBoundingClientRect();
    const parentRect = layer.parentElement.getBoundingClientRect();
    layer.style.left = `${imageRect.left - parentRect.left}px`;
    layer.style.top = `${imageRect.top - parentRect.top}px`;
    layer.style.width = `${imageRect.width}px`;
    layer.style.height = `${imageRect.height}px`;
    for (const item of frontPoints.items) {
      const percent = frontPointPercent(item, frontPoints.measuredImage);
      const box = element('div', 'front-point');
      box.style.left = `${percent.left}%`;
      box.style.top = `${percent.top}%`;
      box.style.width = `${percent.right - percent.left}%`;
      box.style.height = `${percent.bottom - percent.top}%`;
      box.append(element('span', 'front-point-label', item.label));
      layer.append(box);
    }
  }
  function selectImage(index, frontMode = false) {
    const image = data.images[index];
    if (!image) return;
    selectedImage = index;
    showFrontPoints = frontMode && index === frontImageIndex;
    $('#port-map-layer').replaceChildren();
    $('#port-map-list').hidden = true;
    featured.src = imageBase + image.file;
    featured.alt = image.alt || `${data.manufacturer} ${data.model} ${image.role} 이미지`;
    featured.hidden = false;
    $('#image-missing').hidden = true;
    $('#zoom-button').disabled = false;
    $('#image-role').textContent = showFrontPoints ? '정면 연결 지점' : image.role ?? '';
    const selectedMap = mapForImage(image);
    $('#image-caption').textContent = showFrontPoints ? '후면 연결 구역을 정면 기준으로 환산' :
      [selectedMap?.title, image.note || image.alt, selectedMap?.note].filter(Boolean).join(' · ');
    $('#front-points-note').hidden = !showFrontPoints;
    for (const [position, button] of [...$('#thumbnails').children].entries()) {
      button.setAttribute('aria-pressed', String(showFrontPoints ? position === data.images.length : position === index));
    }
    updatePortMap();
  }
  function updatePortMap() {
    const map = mapForImage(data.images[selectedImage]);
    const layer = $('#port-map-layer');
    $('#port-map-loupe').hidden = true;
    layer.replaceChildren();
    $('#port-map-list').replaceChildren();
    $('#port-map-list').hidden = true;
    const scroll = $('.port-photo-scroll'), photoStage = featured.parentElement;
    $('#front-points-layer').replaceChildren();
    if (showFrontPoints) {
      photoStage.classList.remove('map-active');
      paintFrontPoints($('#front-points-layer'), featured);
      galleryBasis.textContent = '— 삼성 공식 후면 사진 기준';
      galleryBasis.hidden = false;
      scroll.tabIndex = -1;
      $('#port-map-scroll-hint').hidden = true;
      return;
    }
    const matches = map && data.images[selectedImage]?.role === map.image && featured.complete && featured.naturalWidth && !featured.hidden && portMapImageMatches(data.images[selectedImage], featured.naturalWidth, featured.naturalHeight, map);
    photoStage.classList.toggle('map-active', Boolean(matches));
    if (!matches) {
      if (map) galleryBasis.hidden = true;
      else if (frontPoints && data.io.length) { galleryBasis.textContent = '— 입출력 표 기준'; galleryBasis.hidden = false; }
      scroll.tabIndex = -1;
      $('#port-map-scroll-hint').hidden = true;
      return;
    }
    const valid = map.items.filter(item => item.side === 'left' || item.side === 'right' || item.x2 <= featured.naturalWidth);
    if (!valid.length) return;
    layer.append(renderPortMap({ ...map, items: valid }, featured, data.model));
    $('#port-map-list').append(renderPortMapCards(valid));
    $('#port-map-list').hidden = false;
    galleryBasis.textContent = map.image === 'Diagram' ? '— 제조사 사용설명서 도면 기준' : '— 실제 제품 사진 기준';
    galleryBasis.hidden = false;
    scroll.tabIndex = scroll.scrollWidth > scroll.clientWidth ? 0 : -1;
    scroll.setAttribute('aria-label', scroll.tabIndex === 0 ? '제품 단자 지도 · 좌우 방향키로 이동' : '제품 단자 지도');
    $('#port-map-scroll-hint').hidden = scroll.tabIndex !== 0;
  }
  $('.port-photo-scroll').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const scroll = event.currentTarget; if (scroll.scrollWidth <= scroll.clientWidth) return;
    event.preventDefault();
    scroll.scrollLeft = event.key === 'Home' ? 0 : event.key === 'End' ? scroll.scrollWidth : scroll.scrollLeft + (event.key === 'ArrowRight' ? 160 : -160);
  });
  featured.addEventListener('load', updatePortMap);
  window.addEventListener('resize', () => {
    updatePortMap();
    if (dialog.open) paintFrontPoints($('#dialog-front-points-layer'), $('#dialog-image'));
  });
  featured.addEventListener('error', () => {
    if (enhancements.portMap) galleryBasis.hidden = true;
    $('#port-map-loupe').hidden = true;
    $('#port-map-layer').replaceChildren(); $('#port-map-list').hidden = true;
    $('#front-points-layer').replaceChildren();
    featured.hidden = true;
    $('#image-missing').hidden = false;
    $('#zoom-button').disabled = true;
  });
  for (const [index, image] of data.images.entries()) {
    const button = element('button', '', mapForImage(image)?.title || image.role || `이미지 ${index + 1}`);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => selectImage(index));
    $('#thumbnails').append(button);
  }
  if (frontPoints && frontImageIndex >= 0) {
    const button = element('button', '', '정면 연결 지점');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectImage(frontImageIndex, true));
    $('#thumbnails').append(button);
  }
  $('#thumbnails').hidden = $('#thumbnails').children.length < 2;
  if (data.images.length) selectImage(maps.length ? data.images.findIndex(i => mapForImage(i)) : 0);
  else { $('#image-missing').hidden = false; $('#zoom-button').disabled = true; }
  $('#zoom-button').addEventListener('click', () => {
    if (!featured.complete || !featured.naturalWidth) return;
    zoomOpener = $('#zoom-button');
    $('#dialog-image').src = featured.src;
    $('#dialog-image').alt = featured.alt;
    $('#dialog-role').textContent = showFrontPoints ? '정면 연결 지점' : data.images[selectedImage].role ?? '';
    dialog.showModal();
    requestAnimationFrame(() => paintFrontPoints($('#dialog-front-points-layer'), $('#dialog-image')));
    $('#dialog-close').focus();
  });
  $('#dialog-image').addEventListener('load', () => {
    if (dialog.open) paintFrontPoints($('#dialog-front-points-layer'), $('#dialog-image'));
  });
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    $('#dialog-front-points-layer').replaceChildren();
    zoomOpener?.focus();
  });
  const LOUPE_SIZE = 216, LOUPE_ZOOM = 3;
  function attachLoupe(wrap, loupe, currentImage) {
    wrap.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') { loupe.hidden = true; return; }
      const image = currentImage();
      if (!image) { loupe.hidden = true; return; }
      const {rect, visible = rect, src, keepInside = false, zoom = LOUPE_ZOOM} = image;
      if (event.clientX < visible.left || event.clientX > visible.right ||
          event.clientY < visible.top || event.clientY > visible.bottom) { loupe.hidden = true; return; }
      const wrapRect = wrap.getBoundingClientRect();
      let centerX = event.clientX, centerY = event.clientY, size = LOUPE_SIZE;
      if (keepInside || visible.right - visible.left < LOUPE_SIZE || visible.bottom - visible.top < LOUPE_SIZE) {
        const scrollRect = keepInside ? $('.port-photo-scroll').getBoundingClientRect() : wrapRect;
        const left = Math.max(visible.left, scrollRect.left), right = Math.min(visible.right, scrollRect.right);
        const top = Math.max(visible.top, scrollRect.top), bottom = Math.min(visible.bottom, scrollRect.bottom);
        if (right <= left || bottom <= top || event.clientX < left || event.clientX > right ||
            event.clientY < top || event.clientY > bottom) { loupe.hidden = true; return; }
        // Fit medium photos; retain a readable lens on thin rack panels, using the outer margin.
        const frameTop = Math.max(wrapRect.top, scrollRect.top), frameBottom = Math.min(wrapRect.bottom, scrollRect.bottom);
        size = Math.min(LOUPE_SIZE, Math.max(120, Math.min(right - left, bottom - top)), right - left, frameBottom - frameTop);
        const clamp = (value, low, high) => high - low < size ? (low + high) / 2
          : Math.max(low + size / 2, Math.min(high - size / 2, value));
        centerX = clamp(centerX, left, right);
        centerY = clamp(clamp(centerY, top, bottom), frameTop, frameBottom);
      }
      loupe.hidden = false;
      loupe.style.width = loupe.style.height = size + 'px';
      loupe.style.left = centerX - wrapRect.left - size / 2 + 'px';
      loupe.style.top = centerY - wrapRect.top - size / 2 + 'px';
      loupe.style.backgroundImage = `url("${src}")`;
      loupe.style.backgroundSize = rect.width * zoom + 'px ' + rect.height * zoom + 'px';
      loupe.style.backgroundPosition = `${size / 2 - (event.clientX - rect.left) * zoom}px ${size / 2 - (event.clientY - rect.top) * zoom}px`;
    });
    for (const type of ['pointerleave', 'pointerup', 'pointercancel']) wrap.addEventListener(type, () => { loupe.hidden = true; });
  }
  attachLoupe($('#dialog-image-wrap'), $('#dialog-loupe'), () => {
    const image = $('#dialog-image');
    return image.complete && image.naturalWidth ? {rect: image.getBoundingClientRect(), src: image.src} : null;
  });
  dialog.addEventListener('close', () => { $('#dialog-loupe').hidden = true; });
  attachLoupe(featured.parentElement, $('#port-map-loupe'), () => {
    if (!featured.parentElement.classList.contains('map-active') || !featured.complete || !featured.naturalWidth) return null;
    const svg = $('#port-map-layer svg');
    const image = $('#port-map-layer svg image');
    const clip = $('#port-map-layer svg clipPath rect');
    if (!image || !clip) return null;
    // clipPath children have no layout box; convert their SVG coordinates to viewport coordinates.
    const transform = svg.getScreenCTM();
    if (!transform) return null;
    const x = Number(clip.getAttribute('x')), y = Number(clip.getAttribute('y'));
    const width = Number(clip.getAttribute('width')), height = Number(clip.getAttribute('height'));
    const a = new DOMPoint(x, y).matrixTransform(transform);
    const b = new DOMPoint(x + width, y + height).matrixTransform(transform);
    return {rect: image.getBoundingClientRect(), visible: {left: a.x, top: a.y, right: b.x, bottom: b.y},
      src: featured.currentSrc || featured.src, keepInside: true, zoom: 1.2};
  });

  const presentConnectors = prepareIoFallbackEntries(data.io);
  if (!enhancements.portMap && data.io.length) {
    $('#io-fallback').append(renderIoFallbackCards(presentConnectors));
    $('#io-fallback').hidden = false;
    galleryBasis.textContent = `— 입출력 표 기준 · ${presentConnectors.length}개 연결 항목`;
  }
  for (const group of data.connectorGroups) for (const item of group.entries) {
    const row = element('tr');
    const name = element('td', '', item.displayConnector);
    for (const flag of item.flags) name.append(element('small', 'port-flag', flag));
    const conditions = element('td', '', item.specificationCondition);
    for (const text of [item.availability && `구성: ${item.availability}`, item.applicability && `적용: ${item.applicability}`, item.source && `출처: ${item.source}`]) if (text) conditions.append(element('small', '', text));
    conditions.append(badge(item.verification ?? 'REVIEW REQUIRED'));
    row.append(element('td', '', group.label), name, element('td', '', item.directionLabel), element('td', '', item.portCount), element('td', '', item.channelSignal), conditions);
    $('#connector-table-body').append(row);
  }
  if (data.absentConnectors.length) {
    const notice = element('div', 'source-row');
    notice.append(
      element('strong', '', '이 모델에 없는 단자'),
      element('span', '', data.absentConnectors.map(item => connectorPresentation(item).displayConnector).join(' · ')),
      element('p', '', '제조사 사양표 기준')
    );
    $('#io-records').append(notice);
  }

  $('#io-records').append($('#io-table-details'));
  $('#io-table-details').hidden = !data.io.length;
  if (section03Content?.type === 'signal-flow') {
    $('#io').append(renderSignalFlow(section03Content.flow, data.model));
  }
  const settingNumber = (setting, index) => setting.kind === 'screen-examples' ? 3 : index + 6;
  for (const [index, setting] of enhancements.settings.entries()) $('.detail-cards').append(renderSetting(setting, settingNumber(setting, index)));
  const screenExampleSetting = enhancements.settings.find(setting => setting.kind === 'screen-examples');
  const screenExampleCardId = screenExampleSetting ? `setting-${settingNumber(screenExampleSetting, enhancements.settings.indexOf(screenExampleSetting))}` : null;
  const screenExampleCard = screenExampleCardId ? document.getElementById(screenExampleCardId) : null;
  if (screenExampleCard) $('#gallery').after(screenExampleCard);
  if (productKey === 'ds-8s') $('#documents').before(renderDs8sGuide());

  const specificationRows = [];
  if (data.series) specificationRows.push(['시리즈', data.series]);
  for (const [name, value] of specificationRows) {
    const row = element('tr');
    row.append(element('td', '', name), element('td', '', value));
    $('#spec-table-body').append(row);
  }
  const outputTable = prepareOutputPowerTable(data);
  const groupDot = groupIndex => {
    const dot = element('span', 'spec-category-dot');
    dot.setAttribute('aria-hidden', 'true');
    dot.style.setProperty('--category-color', ['#3478d4', '#7c5ab8', '#16806a', '#b86e14', '#bf5272', '#526a8c'][groupIndex % 6]);
    return dot;
  };
  if (outputTable.groups.length) {
    const wrap = element('div', 'pg-table amp-output-table');
    wrap.dataset.columns = String(outputTable.groups.length);
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', '부하별 앰프 출력 표');
    wrap.tabIndex = 0;
    const table = element('table');
    table.append(element('caption', 'sr-only', '부하별 앰프 출력'));
    const heading = element('tr');
    const loadHeading = element('th', '', '부하');
    loadHeading.scope = 'col';
    heading.append(loadHeading);
    for (const group of outputTable.groups) {
      const cell = element('th');
      cell.scope = 'col';
      cell.append(groupDot(group.groupIndex), element('span', '', group.name.replace(/^출력\((.*)\)$/, '$1')));
      heading.append(cell);
    }
    const head = element('thead');
    head.append(heading);
    table.append(head);
    const body = element('tbody');
    for (const outputRow of outputTable.rows) {
      const row = element('tr');
      const load = element('th', '', outputRow.name);
      load.scope = 'row';
      row.append(load);
      for (const spec of outputRow.cells) {
        const value = element('td', '', spec ? [spec.value, spec.unit].filter(Boolean).join(' ') : '—');
        if (spec?.verification && !['VERIFIED', 'FOUND'].includes(spec.verification)) value.append(badge(spec.verification));
        if (spec?.condition) value.append(element('small', '', `조건: ${spec.condition}`));
        row.append(value);
      }
      body.append(row);
    }
    table.append(body);
    wrap.append(table);
    $('#spec-table-body').closest('.pg-table').before(wrap);
  }
  let specNumber = 0;
  for (const { group, groupIndex, spec } of orderSpecificationRows(data)) {
      if (spec.source) {
        const record = element('div', 'source-row spec-source-record');
        record.append(element('strong', '', group.name + ' · ' + spec.name), element('span', '', '출처: ' + spec.source));
        $('#spec-source-records').append(record);
      }
      if (outputTable.entries.has(spec)) continue;
      const row = element('tr', 'spec-data-row');
      row.dataset.specIndex = String(specNumber++);
      const value = element('td', '', [spec.value, spec.unit].filter(Boolean).join(' '));
      if (spec.verification && !['VERIFIED', 'FOUND'].includes(spec.verification)) value.append(badge(spec.verification));
      for (const detail of [spec.condition && `조건: ${spec.condition}`]) if (detail) value.append(element('small', '', detail));
      const name = element('td');
      const dot = groupDot(groupIndex);
      name.append(dot, element('span', 'sr-only', group.name + ' · '), document.createTextNode(spec.name));
      row.append(name, value);
      $('#spec-table-body').append(row);
  }
  function renderSpecs(expanded = false) {
    for (const row of $('#spec-table-body').querySelectorAll('.spec-data-row')) row.hidden = !expanded && Number(row.dataset.specIndex) >= 12;
    $('#spec-toggle').hidden = specNumber <= 12;
    $('#spec-toggle').textContent = expanded ? '사양 접기' : `사양 ${specNumber - 12}개 더 보기`;
    $('#spec-toggle').setAttribute('aria-expanded', String(expanded));

  }
  renderSpecs();
  $('#spec-toggle').addEventListener('click', () => renderSpecs($('#spec-toggle').getAttribute('aria-expanded') !== 'true'));
  if (enhancements.layerPlan) {
    const layerCard = renderAquilonLayerPlan(enhancements.layerPlan, productKey);
    layerCard.id = 'aquilon-layer-card';
    layerCard.dataset.supplemental = '';
    $('.supplemental-cards').prepend(layerCard);
  }
  if (enhancements.videoLayerPlan) {
    const layerCard = renderVideoLayerPlan(enhancements.videoLayerPlan, productKey);
    layerCard.id = 'video-layer-card';
    layerCard.dataset.supplemental = '';
    $('.supplemental-cards').prepend(layerCard);
  }
  const layerComparison = (enhancements.layerPlan || enhancements.videoLayerPlan) ? null : layerComparisonFor(productKey);
  if (layerComparison) {
    const section = element('div', 'layer-comparison');
    section.append(element('h3', '', `${layerComparison.manufacturer} ${layerComparison.title}`));
    section.append(element('p', 'layer-comparison-definition', layerComparison.definition));
    const wrap = element('div', 'pg-table layer-table-scroll');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', `${layerComparison.manufacturer} ${layerComparison.title}`);
    wrap.tabIndex = 0;
    const table = element('table');
    table.append(element('caption', 'sr-only', `${layerComparison.manufacturer} ${layerComparison.title}`));
    const headings = layerComparisonHeadings;
    const head = element('thead');
    const headingRow = element('tr');
    for (const heading of headings) {
      const cell = element('th', '', heading);
      cell.scope = 'col';
      headingRow.append(cell);
    }
    head.append(headingRow);
    table.append(head);
    const body = element('tbody');
    for (const item of layerComparison.rows) {
      const row = element('tr', item.slug === productKey ? 'layer-current' : '');
      if (item.slug === productKey) row.setAttribute('aria-current', 'true');
      const product = element('th', '', item.product);
      product.scope = 'row';
      row.append(product);
      for (const value of [item.input4k, item.output4k, item.layers4k, item.layers2k, item.note]) row.append(element('td', '', value));
      body.append(row);
    }
    table.append(body);
    wrap.append(table);
    section.append(wrap);
    $('#spec-toggle').after(section);
  }

  for (const feature of data.features) $('#feature-list').append(element('li', '', feature.text));
  function renderFeatures(expanded = false) {
    for (const [index, feature] of [...$('#feature-list').children].entries()) feature.hidden = !expanded && index >= 6;
    $('#feature-toggle').hidden = data.features.length <= 6;
    $('#feature-toggle').textContent = expanded ? '기능 접기' : `기능 ${data.features.length - 6}개 더 보기`;
    $('#feature-toggle').setAttribute('aria-expanded', String(expanded));
  }
  renderFeatures();
  $('#feature-toggle').addEventListener('click', () => renderFeatures($('#feature-toggle').getAttribute('aria-expanded') !== 'true'));
  for (const related of data.relatedProducts ?? data.related ?? []) {
    const card = element('div', 'related-card');
    card.append(element('strong', '', related.productName ?? related.name ?? related.model ?? '관련 제품'), element('small', '', related.relationship ?? related.relation ?? ''));
    if (related.url) card.append(safeLink(related.url, '제품 보기 ↗'));
    $('#related-list').append(card);
  }

  const visible = new Set(visibleDetailCards(data));
  if (enhancements.layerPlan) visible.add('aquilon-layer-card');
  if (enhancements.videoLayerPlan) visible.add('video-layer-card');
  if (documentCardVisible(openDocuments, uploadedDocuments)) visible.add('documents');
  for (const [index, setting] of enhancements.settings.entries()) visible.add(`setting-${settingNumber(setting, index)}`);
  for (const card of document.querySelectorAll('[data-card], [data-supplemental]')) card.hidden = !visible.has(card.id);
  const cardGrid = $('.detail-cards');
  const leftCardIds = ['overview', 'specifications', 'features', ...enhancements.settings
    .map((setting, index) => setting.kind === 'screen-examples' ? null : `setting-${settingNumber(setting, index)}`).filter(Boolean)];
  const rightCardIds = ['gallery', ...(screenExampleCardId ? [screenExampleCardId] : []), 'io'];
  let rtcomEmbedded = false;
  let packingQueued = false;
  function packCards() {
    packingQueued = false;
    if (innerWidth <= 1000) {
      cardGrid.classList.remove('is-packed');
      cardGrid.style.height = '';
      for (const card of cardGrid.children) {
        card.style.top = '';
        card.style.left = '';
        card.style.width = '';
      }
      return;
    }
    cardGrid.classList.add('is-packed');
    const rightWidth = Math.max(0, cardGrid.clientWidth - 382);
    const place = (ids, left, width) => {
      let top = 0;
      for (const id of ids) {
        const card = document.getElementById(id);
        if (card.hidden) continue;
        card.style.width = width + 'px';
        card.style.left = left + 'px';
        card.style.top = top + 'px';
        top += card.offsetHeight + 22;
      }
      return top ? top - 22 : 0;
    };
    cardGrid.style.height = rtcomEmbedded
      ? place(['gallery'], 0, cardGrid.clientWidth) + 'px'
      : Math.max(place(leftCardIds, 0, 360), place(rightCardIds, 382, rightWidth)) + 'px';
  }
  function requestPack() {
    if (packingQueued) return;
    packingQueued = true;
    requestAnimationFrame(packCards);
  }
  const cardObserver = new ResizeObserver(requestPack);
  for (const card of cardGrid.children) cardObserver.observe(card);
  window.addEventListener('resize', requestPack);
  requestPack();
  $('#package-status').textContent = data.packageStatus || 'REVIEW REQUIRED';
  $('#package-status').classList.add(statusClass(data.packageStatus));
  $('#model-status').textContent = data.presentation.modelStatus ?? '';
  $('#model-status').hidden = !$('#model-status').textContent;
  $('#verification-summary').textContent = data.verificationSummary ?? '';
  $('#series-note').textContent = data.seriesNote ?? '';
  $('#series-note').hidden = !$('#series-note').textContent;
  $('#gallery-rights-badge').textContent = data.presentation.galleryRightsBadge ?? '';
  $('#gallery-rights-badge').hidden = !$('#gallery-rights-badge').textContent;
  $('#gallery-rights').textContent = data.presentation.galleryRights ?? '';
  let reviewImages = 0;
  for (const item of data.imageStatuses) {
    const card = element('div', 'source-row');
    card.append(element('strong', '', `이미지 · ${item.role}`), badge(item.status));
    if (item.sourceUrl) card.append(safeLink(item.sourceUrl, '출처 ↗'));
    $('#image-statuses').append(card);
    if (!['VERIFIED', 'FOUND', 'READY'].includes(item.status)) reviewImages++;
  }
  for (const image of data.images) {
    const card = element('div', 'source-row');
    card.append(element('strong', '', `게시 이미지 · ${image.role ?? '기타'}`));
    const facts = [image.model, image.resolution, image.originalSize, image.publicationStatus, image.verification].filter(Boolean);
    if (facts.length) card.append(element('small', '', facts.join(' · ')));
    if (image.sourceUrl) card.append(safeLink(image.sourceUrl, '이미지 출처 ↗'));
    $('#image-statuses').append(card);
  }
  const documentIssues = data.quickDocuments.filter(item => !item.available).map(item => ({
    label: item.label, status: item.resource?.status ?? 'MISSING'
  }));
  for (const title of data.missingDocuments) {
    if (!documentIssues.some(item => item.label === title)) documentIssues.push({ label: title, status: 'MISSING' });
  }
  for (const item of documentIssues) {
    const row = element('div', 'source-row');
    row.append(element('strong', '', `문서 · ${item.label}`), badge(item.status));
    $('#missing-documents').append(row);
  }
  for (const issue of data.issues) {
    const row = element('div', 'source-row');
    row.append(badge(issue.status), element('strong', '', issue.title), element('p', '', [issue.code, issue.detail].filter(Boolean).join(' · ')));
    $('#issue-list').append(row);
  }
  for (const source of data.sources) {
    const row = element('div', 'source-row');
    row.id = `source-${String(source.code ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
    row.append(element('strong', '', [source.code, source.name].filter(Boolean).join(' · ')));
    if (source.page) row.append(element('small', '', '쪽: ' + source.page));
    if (source.scope) row.append(element('small', '', source.scope));
    if (source.url) row.append(safeLink(source.url, '출처 열기 ↗'));
    $('#source-list').append(row);
  }
  $('#sources-count').textContent = String(data.issues.length + documentIssues.length + reviewImages);

  if (isRtcomProduct) mountRtcomProductView(productKey.slice('rtcom-'.length), $('.product-hero'), () => {
    const disclosure = element('details', 'rtcom-native-details');
    const summary = element('summary', '', '포털 데이터 표 펼치기');
    const cards = element('div', 'rtcom-native-cards');
    for (const card of [...cardGrid.children]) if (card.id !== 'gallery') {
      card.style.top = '';
      card.style.left = '';
      card.style.width = '';
      cards.append(card);
    }
    disclosure.append(summary, cards);
    cardGrid.after(disclosure);
    rtcomEmbedded = true;
    requestPack();
  });

  function legacySourceHash() {
    try { return decodeURIComponent(location.hash.slice(1)).startsWith('source-'); }
    catch { return false; }
  }
  function hashTarget() {
    if (!location.hash) return null;
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch { return null; }
  }
  function revealHash(initial = false) {
    const target = hashTarget();
    const destination = target?.closest('[data-card], [data-supplemental]')?.hidden
      ? $('#overview') : target ?? (legacySourceHash() ? $('#sources') : null);
    if (!destination) { history.scrollRestoration = 'auto'; return; }
    if (destination === $('#overview') && target?.closest('[data-card], [data-supplemental]')?.hidden) history.replaceState(null, '', '#overview');
    if (destination === $('#sources') || destination.closest('#sources')) $('#sources').open = true;
    const innerDisclosure = destination.closest('details');
    if (innerDisclosure) innerDisclosure.open = true;
    if (isHistoryTraversal && initial) { history.scrollRestoration = 'auto'; return; }
    const previous = document.documentElement.style.scrollBehavior;
    if (initial) document.documentElement.style.scrollBehavior = 'auto';
    destination.scrollIntoView({ behavior: initial ? 'auto' : 'smooth', block: 'start' });
    requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = previous; history.scrollRestoration = 'auto'; });
  }
  if (!isHistoryTraversal) requestAnimationFrame(() => revealHash(true));
  window.addEventListener('hashchange', () => revealHash());
  window.addEventListener('popstate', () => revealHash());
  window.addEventListener('pageshow', event => { if (!event.persisted && !isHistoryTraversal) requestAnimationFrame(() => revealHash(true)); });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    if (link.hash === location.hash) requestAnimationFrame(() => revealHash());
  });
  let printState = null;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    const disclosures = [$('#sources'), $('#overview-more'), $('#io-table-details')];
    printState = {
      disclosures: disclosures.map(item => item.open),
      specs: $('#spec-toggle').getAttribute('aria-expanded') === 'true',
      features: $('#feature-toggle').getAttribute('aria-expanded') === 'true'
    };
    for (const item of disclosures) item.open = true;
    renderSpecs(true);
    renderFeatures(true);
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    [$('#sources'), $('#overview-more'), $('#io-table-details')].forEach((item, index) => { item.open = printState.disclosures[index]; });
    renderSpecs(printState.specs);
    renderFeatures(printState.features);
    printState = null;
  });
  $('#print-button').addEventListener('click', () => window.print());
}
