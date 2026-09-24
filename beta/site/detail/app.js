import { prepareProductDetail } from './product-detail-model.mjs?v=w012-techdata-1';
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
$('#spec-intro').textContent = data.presentation.specIntro ?? '';
$('#io-intro').textContent = data.presentation.ioIntro ?? '';
$('#supplemental-note').textContent = data.presentation.supplementalNote ?? '';
$('#footer-product').textContent = data.presentation.footerNote ?? `${data.manufacturer} ${data.model}`;
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
$('#verification-summary').textContent = data.verificationSummary;
$('#overview-summary').textContent = data.korean ?? data.overview;
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
const rearButton = $('#show-rear');
rearButton.hidden = data.rearIndex < 0;
rearButton.addEventListener('click', () => {
  if (data.rearIndex < 0) return;
  selectImage(data.rearIndex);
  $('#gallery-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#thumbnails').children[data.rearIndex].focus();
});

if (data.officialPage?.url) {
  $('#official-product-link').append(officialLink(data.officialPage.url, '공식 제품 페이지 열기 ↗', 'official-product-link'));
  if (data.officialPage.status !== 'VERIFIED') $('#official-product-link').append(badge(data.officialPage.status));
  $('#gallery-source-link').href = data.officialPage.url;
  $('#dialog-product-link').href = data.officialPage.url;
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
  const card = node('article', 'quick-card' + (available ? '' : ' quick-card-missing'));
  card.append(node('span', 'card-type', label), node('strong', '', resource?.title ?? missingTitle));
  const meta = node('div', 'quick-meta');
  meta.append(node('span', 'quick-language', resource?.displayLanguage ?? resource?.language ?? '언어 미확인'), badge(resource?.status ?? 'MISSING'));
  card.append(meta);
  if (available) card.append(officialLink(resource.url, resource.type === 'Technical Document' ? '자료 페이지 열기 ↗' : '열기 ↗', 'quick-open'));
  else card.append(node('span', 'quick-unavailable', resource?.status === 'REVIEW REQUIRED' ? '자료 링크 검토 중' : '열기 링크 없음'));
  $('#quick-docs').append(card);
}
$('#feature-count').textContent = String(data.features.length).padStart(2, '0');
for (const [index, feature] of data.features.entries()) {
  const card = node('article', 'feature-card panel');
  const body = node('div');
  body.append(node('p', '', feature.text), sourceReference(feature.source));
  card.append(node('span', 'feature-number', String(index + 1).padStart(2, '0')), body);
  $('#feature-list').append(card);
}
$('#feature-more').hidden = true;

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

$('#io-count').textContent = String(data.io.length).padStart(2, '0');
const groupedIo = data.ioGroups.map(({ name, entries }) => [name, entries]);
for (const [index, [group, items]] of [...groupedIo].entries()) {
  const section = node('section', 'io-group');
  const heading = node('div', 'io-group-head');
  const title = node('h3', '', group);
  title.id = 'io-group-' + index;
  section.setAttribute('aria-labelledby', title.id);
  heading.append(title, node('span', '', items.length + ' I/O'));
  section.append(heading);
  for (const groupNote of (data.presentation.ioGroupNotes ?? []).filter(note => note.group === group)) {
    const note = node('p', 'io-group-note', groupNote.text + ' ');
    if (groupNote.source) note.append(sourceReference(groupNote.source));
    section.append(note);
  }
  const grid = node('div', 'io-grid');
  for (const item of items) {
    const card = node('article', 'io-card panel');
    const head = node('div', 'io-card-head');
    head.append(node('h4', '', item.connector), node('span', 'direction', item.direction));
    const facts = node('div', 'io-facts');
    const primary = node('p', 'io-facts-primary');
    const signal = node('strong', '', item.signal);
    signal.setAttribute('aria-label', '신호 ' + item.signal);
    const protocol = node('strong', '', item.protocol);
    protocol.setAttribute('aria-label', '규격 ' + item.protocol);
    primary.append(signal, node('span', 'io-facts-separator', '·'), protocol);
    const secondary = node('p', 'io-facts-secondary');
    secondary.append(node('span', '', '수량 ' + item.quantity), node('span', '', '고정/옵션 ' + item.availability));
    facts.append(primary, secondary);
    const main = node('div', 'io-row-main');
    main.append(head, facts, badge(item.verification ?? 'REVIEW REQUIRED'));
    const supporting = node('div', 'io-row-support');
    supporting.append(node('p', 'io-condition', '조건 · ' + (item.condition || '별도 조건 미기록')), sourceReference(item.source));
    card.append(main, supporting);
    grid.append(card);
  }
  section.append(grid);
  $('#io-list').append(section);
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

const tabs = [$('#tab-features'), $('#tab-specifications')];
const panels = [$('#feature-panel'), $('#spec-panel')];
function selectTab(index, updateAddress = false) {
  for (const [position, tab] of tabs.entries()) {
    const selected = position === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[position].hidden = !selected;
  }
  if (updateAddress) {
    history.pushState(null, '', index ? '#specifications' : '#features');
    $('#detail-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
function hashTarget() {
  if (!location.hash) return null;
  try {
    return document.getElementById(decodeURIComponent(location.hash.slice(1)));
  } catch {
    return null;
  }
}
function openForTarget(target) {
  const isSpec = Boolean(target && panels[1].contains(target));
  selectTab(isSpec ? 1 : 0);
  if (target && (target === $('#sources') || $('#sources').contains(target))) $('#sources').open = true;
  if (target && $('#supplemental-docs').contains(target)) $('#supplemental-docs').open = true;
}
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectTab(index, true));
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(next, true);
    tabs[next].focus();
  });
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  let target;
  try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); }
  catch { return; }
  if (target) openForTarget(target);
});
openForTarget(hashTarget());

function restoreInitialHash() {
  const target = hashTarget();
  if (!target) {
    history.scrollRestoration = 'auto';
    return;
  }
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
