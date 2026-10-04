import { renderLead, renderKeyFacts, renderPortMap, renderPortMapCards, renderIoFallbackCards, renderSignalFlow, renderSetting } from './detail-enhancement-view.mjs?v=w20261004-014-portmap-height';
import { portMapImageMatches, selectSection03Content } from './detail-enhancements.mjs?v=w20261004-010-samsung-115-rear';
import { prepareProductDetail, visibleDetailCards, connectorPresentation, prepareIoFallbackEntries, orderSpecificationRows } from './product-detail-model.mjs?v=w20261004-013-spec-order';
import { resolveDocumentAction, uploadedDocumentsFor, documentCardVisible, documentActionLabels } from './pdf-documents.mjs';
import { createPdfViewer } from '../shared/pdf-viewer.mjs';
import { adaptRtcomDetail } from '../shared/rtcom-adapter.mjs';
import { distributorLinkFor } from '../shared/distributor-links.mjs';

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
function safeLink(url, label, className = '') {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('공식 링크 형식이 올바르지 않습니다.');
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
if (!productKey) {
  location.replace('../');
} else {
  try {
    if (!/^[a-z0-9-]+$/.test(productKey)) throw new Error('제품 주소 형식이 올바르지 않습니다.');
    const rtcomId = isRtcomProduct ? productKey.slice('rtcom-'.length) : null;
    const productDataPath = `./data/${productKey}.json`;
    const rtcomDataPath = `../rtcom/raw/products/${rtcomId}.json`;
    const response = await fetch(rtcomId ? rtcomDataPath : productDataPath);
    if (!response.ok) throw new Error('제품 상세 데이터를 읽을 수 없습니다.');
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
  document.title = `${data.manufacturer} ${data.model} · AV Portal Product Detail`;
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

  $('#breadcrumb-brand').textContent = data.manufacturer;
  $('#breadcrumb-model').textContent = data.model;
  $('#product-name').textContent = data.productName || data.model;
  $('#product-subtitle').textContent = [data.manufacturer, enhancements.subtitle || data.english].filter(Boolean).join(' · ');
  $('#footer-product').textContent = `${data.manufacturer} ${data.model}`;
  $('#footer-manufacturer').textContent = data.manufacturer;
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
    $('#header-distributor').append(safeLink(distributorLink.url, '국내 총판 테크데이타 ↗', 'pg-btn'));
    $('#footer-distributor-link').append(safeLink(distributorLink.url, '국내 총판 · 테크데이타피에스 ↗', 'pg-btn'));
  }

  const manifestPath = '../docs/manifest.json';
  let documentManifest = { mirrors: [], uploads: [] };
  try {
    const manifestResponse = await fetch(manifestPath);
    if (manifestResponse.ok) documentManifest = await manifestResponse.json();
  } catch { /* External document links remain available. */ }
  const pdfViewer = createPdfViewer();
  const uploadedDocuments = uploadedDocumentsFor(productKey, documentManifest);
  const openDocuments = [
    ...data.quickDocuments.filter(item => item.available).map(item => ({ ...item.resource, label: item.label })),
    ...data.additionalDocuments.filter(goodDocument).map(item => ({ ...item, label: item.type })),
    ...uploadedDocuments
  ];
  function appendDocumentActions(container, item, header = false) {
    const action = item.action ?? resolveDocumentAction(item, documentManifest);
    if (!action) return;
    const labels = documentActionLabels(item, action, header);
    if (action.kind === 'external') {
      container.append(safeLink(action.url, labels.primary, 'pg-btn'));
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
    const facts = renderKeyFacts(enhancements.keyFacts); facts.id = 'key-specs'; $('#key-specs').replaceWith(facts);
  }
  $('#key-specs').hidden = !$('#key-specs').children.length;

  let selectedImage = 0;
  let zoomOpener = null;
  const imageBase = data.presentation.imageBase ?? './images/';
  const featured = $('#featured-image');
  const dialog = $('#image-dialog');
  const galleryBasis = $('#gallery-basis');
  if (!enhancements.portMap && data.io.length) {
    galleryBasis.textContent = '— 입출력 표 기준';
    galleryBasis.hidden = false;
  }
  function selectImage(index) {
    const image = data.images[index];
    if (!image) return;
    selectedImage = index;
    $('#port-map-layer').replaceChildren();
    $('#port-map-list').hidden = true;
    featured.src = imageBase + image.file;
    featured.alt = image.alt || `${data.manufacturer} ${data.model} ${image.role} 이미지`;
    featured.hidden = false;
    $('#image-missing').hidden = true;
    $('#zoom-button').disabled = false;
    $('#image-role').textContent = image.role ?? '';
    $('#image-caption').textContent = image.note || image.alt || '';
    for (const [position, button] of [...$('#thumbnails').children].entries()) button.setAttribute('aria-pressed', String(position === index));
    updatePortMap();
  }
  function updatePortMap() {
    const map = enhancements.portMap;
    const layer = $('#port-map-layer');
    $('#port-map-loupe').hidden = true;
    layer.replaceChildren();
    $('#port-map-list').replaceChildren();
    $('#port-map-list').hidden = true;
    const scroll = $('.port-photo-scroll'), photoStage = featured.parentElement;
    const matches = map && data.images[selectedImage]?.role === map.image && featured.complete && featured.naturalWidth && !featured.hidden && portMapImageMatches(data.images[selectedImage], featured.naturalWidth, featured.naturalHeight, map);
    photoStage.classList.toggle('map-active', Boolean(matches));
    if (!matches) {
      if (map) galleryBasis.hidden = true;
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
  window.addEventListener('resize', updatePortMap);
  featured.addEventListener('error', () => {
    if (enhancements.portMap) galleryBasis.hidden = true;
    $('#port-map-loupe').hidden = true;
    $('#port-map-layer').replaceChildren(); $('#port-map-list').hidden = true;
    featured.hidden = true;
    $('#image-missing').hidden = false;
    $('#zoom-button').disabled = true;
  });
  for (const [index, image] of data.images.entries()) {
    const button = element('button', '', image.role || `이미지 ${index + 1}`);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => selectImage(index));
    $('#thumbnails').append(button);
  }
  $('#thumbnails').hidden = data.images.length < 2;
  if (data.images.length) selectImage(enhancements.portMap ? data.images.findIndex(i => i.role === enhancements.portMap.image) : 0);
  else { $('#image-missing').hidden = false; $('#zoom-button').disabled = true; }
  $('#zoom-button').addEventListener('click', () => {
    if (!featured.complete || !featured.naturalWidth) return;
    zoomOpener = $('#zoom-button');
    $('#dialog-image').src = featured.src;
    $('#dialog-image').alt = featured.alt;
    $('#dialog-role').textContent = data.images[selectedImage].role ?? '';
    dialog.showModal();
    $('#dialog-close').focus();
  });
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => zoomOpener?.focus());
  const LOUPE_SIZE = 180, LOUPE_ZOOM = 3;
  function attachLoupe(wrap, loupe, currentImage) {
    wrap.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') { loupe.hidden = true; return; }
      const image = currentImage();
      if (!image) { loupe.hidden = true; return; }
      const {rect, visible = rect, src, keepInside = false, zoom = LOUPE_ZOOM} = image;
      if (event.clientX < visible.left || event.clientX > visible.right ||
          event.clientY < visible.top || event.clientY > visible.bottom) { loupe.hidden = true; return; }
      const wrapRect = wrap.getBoundingClientRect();
      let centerX = event.clientX, centerY = event.clientY;
      if (keepInside) {
        const scrollRect = $('.port-photo-scroll').getBoundingClientRect();
        const left = Math.max(visible.left, scrollRect.left), right = Math.min(visible.right, scrollRect.right);
        const top = Math.max(visible.top, scrollRect.top), bottom = Math.min(visible.bottom, scrollRect.bottom);
        if (right - left < LOUPE_SIZE || bottom - top < LOUPE_SIZE) { loupe.hidden = true; return; }
        // The lens stays inside the photograph, leaving the outside-number rail visible.
        centerX = Math.max(left + LOUPE_SIZE / 2, Math.min(right - LOUPE_SIZE / 2, centerX));
        centerY = Math.max(top + LOUPE_SIZE / 2, Math.min(bottom - LOUPE_SIZE / 2, centerY));
      }
      loupe.hidden = false;
      loupe.style.left = centerX - wrapRect.left - LOUPE_SIZE / 2 + 'px';
      loupe.style.top = centerY - wrapRect.top - LOUPE_SIZE / 2 + 'px';
      loupe.style.backgroundImage = `url("${src}")`;
      loupe.style.backgroundSize = rect.width * zoom + 'px ' + rect.height * zoom + 'px';
      loupe.style.backgroundPosition = `${LOUPE_SIZE / 2 - (event.clientX - rect.left) * zoom}px ${LOUPE_SIZE / 2 - (event.clientY - rect.top) * zoom}px`;
    });
    for (const type of ['pointerleave', 'pointerup', 'pointercancel']) wrap.addEventListener(type, () => { loupe.hidden = true; });
  }
  attachLoupe($('#dialog-image-wrap'), $('#dialog-loupe'), () => {
    if (data.images[selectedImage]?.role === 'Diagram') return null;
    const image = $('#dialog-image');
    return image.complete && image.naturalWidth ? {rect: image.getBoundingClientRect(), src: image.src} : null;
  });
  dialog.addEventListener('close', () => { $('#dialog-loupe').hidden = true; });
  attachLoupe(featured.parentElement, $('#port-map-loupe'), () => {
    if (data.images[selectedImage]?.role === 'Diagram') return null;
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
  for (const [index, setting] of enhancements.settings.entries()) $('.detail-cards').append(renderSetting(setting, index + 6));

  const specificationRows = [];
  if (data.series) specificationRows.push(['시리즈', data.series]);
  for (const [name, value] of specificationRows) {
    const row = element('tr');
    row.append(element('td', '', name), element('td', '', value));
    $('#spec-table-body').append(row);
  }
  let specNumber = 0;
  for (const { group, groupIndex, spec } of orderSpecificationRows(data)) {
      const row = element('tr', 'spec-data-row');
      row.dataset.specIndex = String(specNumber++);
      const value = element('td', '', [spec.value, spec.unit].filter(Boolean).join(' '));
      if (spec.verification && !['VERIFIED', 'FOUND'].includes(spec.verification)) value.append(badge(spec.verification));
      for (const detail of [spec.condition && `조건: ${spec.condition}`]) if (detail) value.append(element('small', '', detail));
      const name = element('td');
      const dot = element('span', 'spec-category-dot'); dot.setAttribute('aria-hidden', 'true');
      dot.style.setProperty('--category-color', ['#3478d4', '#7c5ab8', '#16806a', '#b86e14', '#bf5272', '#526a8c'][groupIndex % 6]);
      name.append(dot, element('span', 'sr-only', group.name + ' · '), document.createTextNode(spec.name));
      row.append(name, value);
      if (spec.source) {
        const record = element('div', 'source-row spec-source-record');
        record.append(element('strong', '', group.name + ' · ' + spec.name), element('span', '', '출처: ' + spec.source));
        $('#spec-source-records').append(record);
      }
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
  if (documentCardVisible(openDocuments, uploadedDocuments)) visible.add('documents');
  for (const [index] of enhancements.settings.entries()) visible.add('setting-' + (index + 6));
  for (const card of document.querySelectorAll('[data-card], [data-supplemental]')) card.hidden = !visible.has(card.id);
  const cardGrid = $('.detail-cards');
  const leftCardIds = ['overview', 'specifications', 'features', ...enhancements.settings.map((_, index) => 'setting-' + (index + 6))];
  const rightCardIds = ['gallery', 'io'];
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
    cardGrid.style.height = Math.max(place(leftCardIds, 0, 360), place(rightCardIds, 382, rightWidth)) + 'px';
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
