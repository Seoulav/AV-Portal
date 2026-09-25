import { prepareProductDetail } from './product-detail-model.mjs?v=w003-tabs-contrast-1';
const $ = selector => document.querySelector(selector);
const node = (tag, className, text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};
const statusClass = {
  VERIFIED: 'state-verified',
  FOUND: 'state-found',
  READY: 'state-ready',
  PARTIAL: 'state-partial',
  'REVIEW REQUIRED': 'state-review',
  CONFLICTED: 'state-conflict',
  MISSING: 'state-missing'
};
function badge(status) {
  return node('span', 'state ' + (statusClass[status] ?? 'state-missing'), status);
}
function officialLink(url, text, className = '') {
  const address = new URL(url);
  if (address.protocol !== 'https:' || address.username || address.password) {
    throw new Error('공식 링크 형식이 올바르지 않습니다.');
  }
  const link = node('a', className, text);
  link.href = address.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}
function sourceReference(raw = '') {
  const wrap = node('span', 'source-ref');
  if (!raw) return wrap;
  wrap.append(node('span', '', '근거 '));
  const tokens = String(raw).split(/([A-Za-z][A-Za-z0-9-]*)/);
  const codes = [...new Set(tokens.filter(token => data.sources.some(source => source.code === token)))];
  for (const [index, code] of codes.entries()) {
    if (index) wrap.append(document.createTextNode(' · '));
    const link = node('a', '', code);
    link.href = '#source-' + code;
    wrap.append(link);
  }
  const detail = tokens.filter(token => !codes.includes(token)).join('').replace(/^[\s,;·]+|[\s,;·]+$/g, '');
  if (detail) wrap.append(node('span', '', ' · ' + detail));
  return wrap;
}

let data;
const isHistoryTraversal = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
// Keep the browser's saved position when returning to a detail page via Back.
if (location.hash && !isHistoryTraversal) history.scrollRestoration = 'manual';
const productKey = new URLSearchParams(location.search).get('product');
if (!productKey) {
  location.replace('../');
} else {
try {
  if (!/^[a-z0-9-]+$/.test(productKey)) throw new Error('제품 주소 형식이 올바르지 않습니다.');
  const response = await fetch(`./data/${productKey}.json`);
  if (!response.ok) throw new Error('제품 상세 데이터를 읽을 수 없습니다.');
  data = prepareProductDetail(await response.json());
} catch (error) {
  const notice = node('div', 'load-failure', error.message);
  notice.setAttribute('role', 'alert');
  const back = node('a', '', 'Library로 돌아가기 →');
  back.href = '../';
  notice.append(back);
  $('#main').prepend(notice);
  throw error;
}

document.title = `${data.manufacturer} ${data.model} · AV Portal Product Detail`;
const setMeta = (selector, value) => {
  const item = document.querySelector(selector);
  if (item && value) item.content = value;
};
const detailTitle = `${data.manufacturer} ${data.model}`;
setMeta('meta[name="description"]', data.english);
setMeta('meta[property="og:title"]', detailTitle);
setMeta('meta[property="og:description"]', data.english);
setMeta('meta[property="og:url"]', location.href.split('#')[0]);
document.body.classList.add('summary-detail');
const mobileDetail = matchMedia('(max-width: 650px)');
$('#detail-search-form').addEventListener('submit', event => {
  event.preventDefault();
  const query = $('#detail-search').value.trim();
  if (query) location.href = (productKey ? '../' : 'https://seoulav.github.io/AV-Portal/') + `?q=${encodeURIComponent(query)}`;
});
if (data.presentation.visualVariant === 'brc-pictogram') {
  document.body.classList.add('brc-pictogram');
  document.querySelector('meta[name="color-scheme"]').content = 'light';
  $('#gallery-title').textContent = '제품 시각화';
  $('#gallery-source-link').firstChild.textContent = '제품 공식 페이지 ';
  $('.image-dialog > p').firstChild.textContent = '자체 제작 픽토그램 · 실물 사진 아님 · ';
}
$('#breadcrumb-brand').textContent = data.manufacturer;
$('#breadcrumb-model').textContent = data.model;
$('#header-eyebrow').textContent = data.presentation.headerEyebrow ?? data.manufacturer;
$('#header-eyebrow').hidden = $('#header-eyebrow').textContent.trim().toLowerCase() === data.manufacturer.trim().toLowerCase();
$('#model-status').textContent = data.presentation.modelStatus ?? '';
$('#model-status').hidden = !data.presentation.modelStatus;
$('#manufacturer').textContent = data.manufacturer;
$('#product-name').textContent = data.model;
$('#product-full-name').textContent = data.productName && data.productName !== data.model ? data.productName : '';
$('#product-full-name').hidden = !$('#product-full-name').textContent;
$('#item-type').textContent = data.itemType ?? 'PRODUCT';
$('#package-status').textContent = data.packageStatus ?? 'READY';
$('#package-status').classList.add(data.packageStatus?.includes('REVIEW') ? 'state-review' : 'state-ready');
$('#gallery-count').textContent = `${data.images.length} VIEWS`;
$('.hero-grid').classList.toggle('gallery-unavailable', data.images.length === 0);
$('.gallery').classList.toggle('gallery-empty', data.images.length === 0);
$('#thumbnails').style.gridTemplateColumns = `repeat(${Math.min(data.images.length || 1, 4)}, minmax(0, 1fr))`;
$('#gallery-rights-badge').textContent = data.presentation.galleryRightsBadge ?? '';
$('#gallery-rights-badge').hidden = !data.images.length || !data.presentation.galleryRightsBadge;
if (!data.images.length) $('#image-missing').querySelector('span').textContent = '사진은 제조사 공식 출처에서 확인할 수 있습니다.';
$('#gallery-foot-note').textContent = data.presentation.galleryFootNote ?? '';
$('#gallery-rights').textContent = data.presentation.galleryRights ?? '';
$('#overview-heading').textContent = data.presentation.overviewHeading ?? '';
$('#overview-heading').hidden = !data.presentation.overviewHeading;
$('#spec-intro').textContent = '핵심 값만 먼저 표시합니다. 적용 조건은 전체 사양에서 확인하세요.';
$('#io-intro').textContent = '전체 연결 단자를 표 또는 그룹 목록으로 확인하고, 출처와 조건은 근거 및 검증 보기에서 확인하세요.';
$('#supplemental-note').textContent = data.presentation.supplementalNote ?? '';
$('#footer-product').textContent = data.presentation.footerNote ?? `${data.manufacturer} ${data.model}`;
$('#footer-manufacturer').textContent = data.manufacturer;
$('#dialog-product').textContent = `${data.manufacturer} ${data.model}`;
for (const highlight of data.presentation.overviewHighlights ?? []) {
  const item = node('div');
  item.append(node('strong', '', highlight.value), node('span', '', highlight.label));
  $('#overview-points').append(item);
}
$('#overview-points').hidden = !$('#overview-points').children.length;
$('#english-description').textContent = data.english;
$('#series').textContent = data.series;
$('#series-note').textContent = data.seriesNote ?? '';
$('#korean-description').textContent = data.korean;
const headerDescription = $('#korean-description');
const headerDescriptionToggle = $('#header-description-toggle');
function updateHeaderDescription() {
  headerDescription.classList.remove('is-expanded');
  headerDescriptionToggle.setAttribute('aria-expanded', 'false');
  headerDescriptionToggle.textContent = '설명 더 보기';
  if (!mobileDetail.matches) {
    headerDescriptionToggle.hidden = true;
    return;
  }
  headerDescriptionToggle.hidden = false;
  headerDescriptionToggle.hidden = headerDescription.scrollHeight <= headerDescription.clientHeight + 1;
}
headerDescriptionToggle.addEventListener('click', () => {
  const expanded = headerDescriptionToggle.getAttribute('aria-expanded') !== 'true';
  headerDescription.classList.toggle('is-expanded', expanded);
  headerDescriptionToggle.setAttribute('aria-expanded', String(expanded));
  headerDescriptionToggle.textContent = expanded ? '설명 접기' : '설명 더 보기';
});
mobileDetail.addEventListener('change', updateHeaderDescription);
requestAnimationFrame(updateHeaderDescription);
$('#verification-summary').textContent = data.verificationSummary;
$('#overview-summary').textContent = (data.overview ?? data.korean ?? '').split(/\n\s*\n/)[0];
$('#overview-copy').textContent = data.overview ?? data.korean;
$('#overview-more').hidden = !$('#overview-copy').textContent;
for (const category of data.categories) $('#categories').append(node('span', 'pill', category));

let selectedIndex = 0;
const featured = $('#featured-image');
const missing = $('#image-missing');
const zoomButton = $('#zoom-button');
const dialog = $('#image-dialog');
let zoomOpener = null;
function selectImage(index) {
  selectedIndex = index;
  const item = data.images[index];
  if (!item) return;
  featured.hidden = false;
  missing.hidden = true;
  zoomButton.disabled = false;
  featured.alt = item.alt;
  featured.src = './images/' + item.file;
  $('#image-role').textContent = item.role.toUpperCase();
  $('#image-caption').textContent = item.note;
  const sourceLink = $('#image-source-link');
  sourceLink.hidden = !item.sourceUrl;
  if (item.sourceUrl) sourceLink.href = officialLink(item.sourceUrl, '').href;
  $('#image-provenance').textContent = [item.provider, item.model, item.galleryPosition && `갤러리 ${item.galleryPosition}`, item.requestedSize && `표시 요청 ${item.requestedSize}`, item.originalSize && `원본 크기 ${item.originalSize}`, item.publicationStatus && `공개 권한 ${item.publicationStatus}`].filter(Boolean).join(' · ');
  for (const [position, button] of [...$('#thumbnails').children].entries()) {
    button.setAttribute('aria-pressed', String(position === index));
  }
}
featured.addEventListener('load', () => {
  featured.hidden = false;
  missing.hidden = true;
  zoomButton.disabled = false;
});
featured.addEventListener('error', () => {
  featured.hidden = true;
  missing.hidden = false;
  zoomButton.disabled = true;
});
for (const [index, image] of data.images.entries()) {
  const button = node('button', 'thumb');
  button.type = 'button';
  button.setAttribute('aria-label', image.role + ' 이미지 선택');
  button.setAttribute('aria-pressed', String(index === 0));
  const picture = node('img');
  picture.src = './images/' + image.file;
  picture.alt = '';
  picture.loading = 'lazy';
  picture.addEventListener('error', () => {
    picture.remove();
    button.disabled = true;
    button.setAttribute('aria-label', image.role + ' 이미지 없음');
    button.prepend(node('span', 'thumb-fallback', '게시 이미지 없음'));
  });
  button.append(picture, node('span', '', image.role));
  button.addEventListener('click', () => selectImage(index));
  $('#thumbnails').append(button);
}
if (data.images.length === 1) $('#thumbnails').hidden = true;
if (data.images.length) selectImage(0);
else {
  featured.hidden = true;
  missing.hidden = false;
  zoomButton.disabled = true;
  $('#image-role').hidden = true;
  $('#thumbnails').hidden = true;
  $('#image-source-link').hidden = true;
  $('#gallery-source-link').hidden = true;
}
for (const item of data.imageStatuses ?? []) {
  const card = node('div', 'image-status-card');
  card.append(node('strong', '', item.role), badge(item.status));
  if (item.status === 'FOUND') card.append(node('small', '', '공식 이미지 확인 · 게시 이미지 없음'));
  else card.append(node('small', '', item.status === 'MISSING' ? '이미지 미확인' : '역할 또는 사용 조건 검토 중'));
  if (item.sourceUrl) card.append(officialLink(item.sourceUrl, '공식 출처 ↗', 'image-source'));
  $('#image-statuses').append(card);
}
$('#image-status-details').hidden = !$('#image-statuses').children.length;
if (data.images.length) {
  $('#image-status-details').append($('.image-trace'), $('#gallery-rights'));
  $('#gallery-source-link').hidden = true;
}
const foundImages = (data.imageStatuses ?? []).filter(item => item.status === 'FOUND').length;
$('#image-status-summary').textContent = data.images.length ? '이미지별 확인 상태 보기' : `공식 이미지 ${foundImages}건 확인 · 게시 이미지 없음`;
zoomButton.addEventListener('click', () => {
  if (!featured.complete || featured.naturalWidth === 0) return;
  zoomOpener = zoomButton;
  $('#dialog-image').src = featured.src;
  $('#dialog-image').alt = featured.alt;
  $('#dialog-role').textContent = data.images[selectedIndex].role + ' · ' + data.images[selectedIndex].note;
  dialog.showModal();
  $('#dialog-close').focus();
});
$('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => zoomOpener?.focus());
if (data.officialPage?.url) {
  $('#official-product-link').append(officialLink(data.officialPage.url, '공식 제품 페이지 열기 ↗', 'official-product-link'));
  if (data.officialPage.status !== 'VERIFIED') $('#official-product-link').append(badge(data.officialPage.status));
  $('#gallery-source-link').href = data.officialPage.url;
  $('#dialog-product-link').href = data.officialPage.url;
  $('#footer-official-link').append(officialLink(data.officialPage.url, '제조사 공식 홈페이지 ↗'));
} else {
  $('#gallery-source-link').hidden = true;
  $('#dialog-product-link').hidden = true;
}
if (!data.images.length) {
  const inlineStatus = $('#image-status-inline');
  const statusCount = (data.imageStatuses ?? []).length;
  $('#image-status-message').textContent = foundImages
    ? `제품 이미지 · 공식 출처 ${foundImages}건 확인 · 재게시 권한 미확인`
    : statusCount ? '제품 이미지 · 이미지 역할·사용 조건 검토 중 · 게시 이미지 없음' : '제품 이미지 · 확보된 사진 없음';
  const rightsBadge = $('#gallery-rights-badge');
  rightsBadge.hidden = !rightsBadge.textContent;
  inlineStatus.append(rightsBadge);
  if (!$('#image-status-details').hidden) inlineStatus.append($('#image-status-details'));
  inlineStatus.hidden = false;
  $('.gallery').remove();
}
$('#quick-count').textContent = data.quickDocuments.length;
for (const { label, resource, missingTitle, available } of data.quickDocuments) {
  const rawStatus = resource?.status ?? 'MISSING';
  const displayStatus = rawStatus === 'MISSING' ? '자료 없음' : ['REVIEW REQUIRED', 'CONFLICTED', 'PARTIAL'].includes(rawStatus) ? '검토 중' : '자료 있음';
  const card = node('article', 'quick-card' + (available ? '' : ' quick-card-missing'));
  card.dataset.verification = rawStatus;
  card.append(node('span', 'card-type', label), node('strong', '', resource?.title ?? missingTitle));
  const meta = node('div', 'quick-meta');
  meta.append(node('span', 'quick-language', resource?.displayLanguage ?? resource?.language ?? '언어 미확인'), node('span', 'quick-status', displayStatus));
  card.append(meta);
  if (available) card.append(officialLink(resource.url, resource.type === 'Technical Document' ? '자료 페이지 열기 ↗' : '열기 ↗', 'quick-open'));
  else card.append(node('span', 'quick-unavailable', resource?.status === 'REVIEW REQUIRED' ? '자료 링크 검토 중' : '열기 링크 없음'));
  $('#quick-docs').append(card);
  const verificationRow = node('div', 'verification-document-row');
  verificationRow.append(node('strong', '', label), node('span', '', resource?.title ?? missingTitle), badge(rawStatus));
  $('#verification-documents').append(verificationRow);
}
$('#feature-count').textContent = String(data.features.length).padStart(2, '0');
const featureCard = feature => {
  const card = node('li', 'feature-card');
  card.append(node('span', 'feature-check', '✓'), node('span', '', feature.text));
  return card;
};
function renderFeatureSummary() {
  const limit = mobileDetail.matches ? 4 : 6;
  $('#feature-list').replaceChildren(...data.features.slice(0, limit).map(featureCard));
  $('#feature-more-list').replaceChildren(...data.features.slice(limit).map(featureCard));
  $('#feature-more').hidden = data.features.length <= limit;
  if ($('#feature-more').hidden) $('#feature-more').open = false;
}
for (const feature of data.features) {
  const evidence = node('div', 'feature-evidence-row');
  evidence.append(node('span', '', feature.text), sourceReference(feature.source));
  $('#feature-evidence-list').append(evidence);
}
renderFeatureSummary();
mobileDetail.addEventListener('change', renderFeatureSummary);

$('#spec-count').textContent = String(data.specifications.length).padStart(2, '0');
const grouped = data.specificationGroups.map(({ name, entries }) => [name, entries]);
for (const [group, specifications] of grouped) {
  const panel = node('details', 'spec-group panel');
  panel.open = false;
  const head = node('summary', 'spec-group-head');
  head.append(node('strong', '', group), node('span', '', specifications.length + ' items'));
  panel.append(head);
  for (const specification of specifications) {
    const row = node('div', 'spec-row');
    const main = node('div', 'spec-main');
    const value = node('strong', 'spec-value', specification.value);
    if (specification.unit) value.append(node('small', '', specification.unit));
    main.append(node('span', 'spec-name', specification.name), value);
    row.append(main);
    if (specification.condition) row.append(node('p', 'spec-condition', '조건 · ' + specification.condition));
    const meta = node('div', 'spec-meta');
    meta.append(sourceReference(specification.source), badge(specification.verification));
    row.append(meta);
    panel.append(row);
  }
  $('#spec-groups').append(panel);
}
const keySpec = specification => {
  const item = node('div', 'key-spec');
  item.append(node('span', 'key-spec-label', specification.name));
  const value = node('strong', '', specification.value);
  if (specification.unit) value.append(node('small', '', ' ' + specification.unit));
  item.append(value);
  if (specification.condition) item.append(node('small', 'key-spec-condition', '조건 · ' + specification.condition));
  return item;
};
function renderKeySpecifications() {
  const limit = mobileDetail.matches ? 8 : 10;
  $('#key-specs').replaceChildren(...data.keySpecifications.slice(0, limit).map(keySpec));
}
renderKeySpecifications();
mobileDetail.addEventListener('change', renderKeySpecifications);

$('#io-count').textContent = String(data.io.length);
$('#all-connector-count').textContent = String(data.io.length);
const rearItem = data.rearIndex >= 0 ? data.images[data.rearIndex] : null;
const rearPanel = $('#rear-connector-panel');
const rearUnavailable = $('#rear-unavailable');
const connectorLayout = $('#connector-layout');
function hideRearPanel() {
  rearPanel.hidden = true;
  rearUnavailable.hidden = false;
  connectorLayout.classList.add('without-rear');
}
if (rearItem) {
  const rearImage = $('#rear-connector-image');
  rearImage.src = './images/' + rearItem.file;
  rearImage.alt = `${data.manufacturer} ${data.model} 후면 연결 단자 이미지`;
  rearImage.addEventListener('error', hideRearPanel);
  rearPanel.hidden = false;
  rearUnavailable.hidden = true;
  if (rearItem.sourceUrl) $('#rear-connector-source').href = officialLink(rearItem.sourceUrl, '').href;
  else $('#rear-connector-source').hidden = true;
} else hideRearPanel();

const conditionBadge = (className, text) => node('span', `connector-flag ${className}`, text);
let connectorIndex = 0;
for (const [groupIndex, groupData] of data.connectorGroups.entries()) {
  const groupId = `connector-group-${groupData.key}-${groupIndex}`;
  const summaryItem = node('span', 'io-summary-chip');
  summaryItem.setAttribute('role', 'listitem');
  summaryItem.append(node('span', '', groupData.label), node('strong', '', `${groupData.entries.length}종`));
  $('#io-summary').append(summaryItem);

  const mobileGroup = node('details', 'connector-mobile-group panel');
  mobileGroup.id = groupId;
  mobileGroup.open = groupIndex === 0;
  const mobileHeading = node('summary', 'connector-group-heading');
  mobileHeading.setAttribute('aria-expanded', String(mobileGroup.open));
  mobileHeading.append(node('strong', '', groupData.label), node('span', '', `${groupData.entries.length}종`));
  mobileGroup.addEventListener('toggle', () => mobileHeading.setAttribute('aria-expanded', String(mobileGroup.open)));
  mobileGroup.append(mobileHeading);

  for (const item of groupData.entries) {
    const itemId = `connector-detail-${connectorIndex++}`;
    const tableRow = node('tr', 'connector-table-row');
    tableRow.append(node('td', 'connector-group-cell', groupData.label));
    const nameCell = node('td', 'connector-name-cell');
    nameCell.append(node('strong', '', item.displayConnector));
    const flags = node('span', 'connector-flags');
    for (const label of item.flags) {
      const className = label === '확인 필요' ? 'needs-review' : 'is-option';
      flags.append(conditionBadge(className, label));
    }
    nameCell.append(flags);
    tableRow.append(nameCell, node('td', 'connector-direction-text', item.directionLabel), node('td', 'connector-port-count', item.portCount), node('td', 'connector-channel-signal', item.channelSignal), node('td', 'connector-purpose', item.specificationCondition));
    $('#connector-table-body').append(tableRow);

    const mobileRow = node('div', 'connector-mobile-row');
    const mobileIdentity = node('div'); mobileIdentity.append(node('strong', '', item.displayConnector), flags.cloneNode(true), node('small', '', item.channelSignal));
    const portText = item.portCount === '미확인' ? '포트 수 미확인' : `포트 ${item.portCount}`;
    mobileRow.append(mobileIdentity, node('span', 'connector-direction-text', item.directionLabel), node('b', '', portText));
    mobileGroup.append(mobileRow);

    const detail = node('details', 'connector-detail connector-evidence-item');
    detail.id = itemId;
    detail.append(node('summary', '', `${groupData.label} · ${item.connector || '미확인'} · ${item.directionLabel} ×${item.quantity ?? '—'}`));
    const detailGrid = node('dl', 'connector-detail-grid');
    const addDetail = (label, value, showUnknown = false) => {
      if (!value || (!showUnknown && value === '—')) return;
      detailGrid.append(node('dt', '', label), node('dd', '', value));
    };
    addDetail('원본 그룹', item.sourceGroup);
    addDetail('Signal', item.signal);
    addDetail('Protocol / Standard', item.protocol);
    addDetail('Fixed / Optional', item.availability, true);
    addDetail('Condition', item.condition);
    addDetail('Applicability', item.applicability);
    addDetail('Notes', item.notes ?? item.note);
    const verification = node('div', 'connector-verification');
    verification.append(node('span', '', '검증'), badge(item.verification ?? 'REVIEW REQUIRED'));
    if (item.source) verification.append(sourceReference(item.source));
    detail.append(detailGrid, verification);
    $('#io-list').append(detail);
  }
  for (const groupNote of (data.presentation.ioGroupNotes ?? []).filter(note => groupData.sourceGroups.includes(note.group))) {
    const note = node('p', 'connector-group-note', groupNote.text + ' ');
    if (groupNote.source) note.append(sourceReference(groupNote.source));
    mobileGroup.append(note);
    $('#io-list').append(note.cloneNode(true));
  }
  $('#connector-mobile-groups').append(mobileGroup);
}
if (!data.connectorGroups.length) {
  $('#connector-table').hidden = true;
  $('#connector-mobile-groups').append(node('p', 'rear-unavailable', '확인된 연결 단자 정보가 없습니다.'));
}
for (const document of data.additionalDocuments) {
  const row = node('article', 'document-row panel');
  const main = node('div', 'document-main');
  const metadata = [document.language, document.note, document.source && `출처 ${document.source}`].filter(value => value && value !== 'undefined');
  main.append(node('strong', '', document.title));
  if (metadata.length) main.append(node('small', '', metadata.join(' · ')));
  const side = node('div', 'document-side');
  side.append(badge(document.status ?? 'REVIEW REQUIRED'));
  if (document.url && document.status !== 'MISSING') side.append(officialLink(document.url, document.status === 'REVIEW REQUIRED' ? '공식 출처 확인 ↗' : '제조사에서 열기 ↗'));
  else side.append(node('span', 'quick-unavailable', '열기 링크 없음'));
  row.append(node('span', 'document-type', document.type), main, side);
  $('#all-documents').append(row);
}
$('#missing-documents-panel').hidden = !data.missingDocuments.length;
for (const title of data.missingDocuments) $('#missing-documents').append(node('span', '', title));

$('#source-count').textContent = data.sources.length + ' SOURCES';
for (const source of data.sources) {
  const item = node('div', 'source-item');
  item.id = 'source-' + source.code;
  const description = node('div');
  description.append(source.url ? officialLink(source.url, source.name + ' ↗') : node('strong', '', source.name), node('p', '', source.scope));
  item.append(node('span', 'source-code', source.code), description);
  $('#source-list').append(item);
}
for (const issue of data.issues) {
  const item = node('div', 'issue-item');
  const heading = node('div', 'issue-item-top');
  heading.append(badge(issue.status), node('strong', '', issue.title));
  item.append(heading, node('p', '', issue.code + ' · ' + issue.detail));
  $('#issue-list').append(item);
}

const navigationTabs = [...$('#detail-tabs').querySelectorAll('[role="tab"]')];
const tabPanels = [...document.querySelectorAll('[role="tabpanel"]')];
function hashTarget() {
  if (!location.hash) return null;
  try {
    return document.getElementById(decodeURIComponent(location.hash.slice(1)));
  } catch {
    return null;
  }
}
function openForTarget(target) {
  if (target && $('#all-specs').contains(target)) $('#all-specs').open = true;
  if (target && $('#connector-evidence').contains(target)) $('#connector-evidence').open = true;
  if (target) {
    const disclosure = target.matches?.('.connector-mobile-group, .connector-detail') ? target : target.closest?.('.connector-mobile-group, .connector-detail');
    if (disclosure instanceof HTMLDetailsElement) disclosure.open = true;
    const parentGroup = disclosure?.closest?.('.connector-mobile-group');
    if (parentGroup instanceof HTMLDetailsElement) parentGroup.open = true;
  }
  if (target && (target === $('#sources') || $('#sources').contains(target))) $('#sources').open = true;
  if (target && (target === $('#supplemental-docs') || $('#supplemental-docs').contains(target))) $('#supplemental-docs').open = true;
}
function panelForTarget(target) {
  return target?.closest?.('[role="tabpanel"]') ?? $('#overview');
}
function activatePanel(panel, { updateHash = false, focusTab = false } = {}) {
  if (!panel) panel = $('#overview');
  for (const candidate of tabPanels) candidate.hidden = candidate !== panel;
  if (panel instanceof HTMLDetailsElement) panel.open = true;
  for (const tab of navigationTabs) {
    const active = tab.getAttribute('aria-controls') === panel.id;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.classList.toggle('is-active', active);
    if (active && focusTab) tab.focus();
  }
  if (updateHash) history.pushState(null, '', '#' + panel.id);
}
for (const [index, tab] of navigationTabs.entries()) {
  tab.addEventListener('click', () => {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    activatePanel(panel, { updateHash: true });
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? navigationTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + navigationTabs.length) % navigationTabs.length;
    const nextTab = navigationTabs[next];
    const panel = document.getElementById(nextTab.getAttribute('aria-controls'));
    activatePanel(panel, { updateHash: true, focusTab: true });
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  let target;
  try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); }
  catch { return; }
  if (target) {
    activatePanel(panelForTarget(target));
    openForTarget(target);
  }
});
const initialTarget = hashTarget();
activatePanel(panelForTarget(initialTarget));
openForTarget(initialTarget);

function restoreInitialHash() {
  const target = hashTarget();
  document.body.classList.toggle('source-anchor-active', Boolean(target?.id?.startsWith('source-')));
  if (!target) {
    history.scrollRestoration = 'auto';
    return;
  }
  activatePanel(panelForTarget(target));
  openForTarget(target);
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  target.scrollIntoView({ behavior: 'auto', block: 'start' });
  requestAnimationFrame(() => {
    root.style.scrollBehavior = previousBehavior;
    history.scrollRestoration = 'auto';
  });
}
if (!isHistoryTraversal) requestAnimationFrame(restoreInitialHash);
window.addEventListener('hashchange', () => requestAnimationFrame(restoreInitialHash));
window.addEventListener('popstate', () => requestAnimationFrame(restoreInitialHash));
window.addEventListener('pageshow', event => {
  if (!event.persisted && !isHistoryTraversal) requestAnimationFrame(restoreInitialHash);
});
}
