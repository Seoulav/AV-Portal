const $ = selector => document.querySelector(selector);
const node = (tag, className, text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};
const statusClass = {
  VERIFIED: 'state-verified',
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
function sourceReference(raw) {
  const wrap = node('span', 'source-ref');
  wrap.append(node('span', '', '근거 '));
  const codes = [...new Set(raw.match(/\b(?:PP|HS|HC|SP|H|P)\b/g) ?? [])];
  for (const [index, code] of codes.entries()) {
    if (index) wrap.append(document.createTextNode(' · '));
    const link = node('a', '', code);
    link.href = '#source-' + code;
    wrap.append(link);
  }
  const detail = raw.replace(/\b(?:PP|HS|HC|SP|H|P)\b/g, '').replace(/^[\s,;·]+|[\s,;·]+$/g, '');
  if (detail) wrap.append(node('span', '', ' · ' + detail));
  return wrap;
}

let data;
try {
  const response = await fetch('./content.json');
  if (!response.ok) throw new Error('시안 콘텐츠를 읽을 수 없습니다.');
  data = await response.json();
  if (data.model !== 'BRC-AM7' || data.features.length !== 8 || data.specifications.length !== 27 || data.io.length !== 14) {
    throw new Error('PR #33 원고와 콘텐츠 수량이 일치하지 않습니다.');
  }
} catch (error) {
  const notice = node('div', 'load-failure', error.message);
  notice.setAttribute('role', 'alert');
  $('#main').prepend(notice);
  throw error;
}

$('#english-description').textContent = data.english;
$('#series').textContent = data.series;
$('#series-note').textContent = data.seriesNote;
$('#korean-description').textContent = data.korean;
$('#verification-summary').textContent = data.verificationSummary;
$('#overview-copy').textContent = data.korean;
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
  featured.hidden = false;
  missing.hidden = true;
  zoomButton.disabled = false;
  featured.alt = item.alt;
  featured.src = './images/' + item.file;
  $('#image-role').textContent = item.role.toUpperCase();
  $('#image-caption').textContent = item.note;
  const sourceUrl = new URL(item.sourceUrl);
  if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'www.sony.com') throw new Error('이미지 공식 출처가 올바르지 않습니다.');
  $('#image-source-link').href = sourceUrl.href;
  $('#image-provenance').textContent = `${item.provider} · ${item.model} · P 갤러리 ${item.galleryPosition} · 표시 요청 ${item.requestedSize} · 원본 크기 ${item.originalSize} · 공개 권한 ${item.publicationStatus}`;
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
    button.prepend(node('span', 'thumb-fallback', '로컬 이미지 없음'));
  });
  button.append(picture, node('span', '', image.role));
  button.addEventListener('click', () => selectImage(index));
  $('#thumbnails').append(button);
}
selectImage(0);
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
$('#show-rear').addEventListener('click', () => {
  selectImage(2);
  $('#gallery-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#thumbnails').children[2].focus();
});

const officialPage = data.documents.find(item => item.type === 'Official Product Page');
if (!officialPage) throw new Error('공식 제품 페이지가 없습니다.');
const productLink = officialLink(officialPage.url, '공식 제품 페이지 열기 ↗', 'official-product-link');
$('#official-product-link').append(productLink);

const coreDocuments = [
  { label: '매뉴얼', resource: data.documents.find(item => item.type === 'User Manual') },
  { label: '시방서', resource: data.documents.find(item => item.type === 'Independent Specification') },
  { label: '사양서', resource: data.documents.find(item => item.type === 'Specification') },
  { label: '기술문서', resource: data.documents.find(item => item.type === 'Technical Document') }
];
$('#quick-count').textContent = coreDocuments.length;
for (const { label, resource } of coreDocuments) {
  const card = node('article', 'quick-card' + (resource ? '' : ' quick-card-missing'));
  card.append(node('span', 'card-type', label), node('strong', '', resource?.title ?? '공식 독립 시방서 미확인'));
  const meta = node('div', 'quick-meta');
  meta.append(node('span', 'quick-language', resource?.type === 'Technical Document' ? '본문 언어 미확인' : (resource?.language ?? '언어 미확인')), badge(resource?.status ?? 'MISSING'));
  card.append(meta);
  if (resource) {
    const label = resource.type === 'Technical Document' ? '자료 페이지 열기 ↗' : '열기 ↗';
    card.append(officialLink(resource.url, label, 'quick-open'));
  } else {
    card.append(node('span', 'quick-unavailable', '열기 링크 없음'));
  }
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

$('#spec-count').textContent = String(data.specifications.length).padStart(2, '0');
const grouped = new Map();
for (const specification of data.specifications) {
  if (!grouped.has(specification.group)) grouped.set(specification.group, []);
  grouped.get(specification.group).push(specification);
}
for (const [group, specifications] of grouped) {
  const panel = node('section', 'spec-group panel');
  const head = node('div', 'spec-group-head');
  head.append(node('h3', '', group), node('span', '', specifications.length + ' items'));
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
const ioDefinitions = [
  ['Video', ['Video']],
  ['Network / Control', ['Network/PoE', 'PTZ control', 'Tally']],
  ['Audio', ['Audio']],
  ['Sync / Timecode', ['Sync', 'Timecode']],
  ['Power', ['Power']],
  ['Recording Media', ['Recording media']]
];
const ioGroupBySignal = new Map(ioDefinitions.flatMap(([group, signals]) => signals.map(signal => [signal, group])));
const groupedIo = new Map(ioDefinitions.map(([group]) => [group, []]));
for (const item of data.io) {
  const group = ioGroupBySignal.get(item.signal);
  if (!group) throw new Error('분류되지 않은 I/O 신호: ' + item.signal);
  groupedIo.get(group).push(item);
}
for (const [index, [group, items]] of [...groupedIo].entries()) {
  const section = node('section', 'io-group');
  const heading = node('div', 'io-group-head');
  const title = node('h3', '', group);
  title.id = 'io-group-' + index;
  section.setAttribute('aria-labelledby', title.id);
  heading.append(title, node('span', '', items.length + ' I/O'));
  section.append(heading);
  if (group === 'Power') {
    const poe = data.io.find(item => item.connector === 'LAN RJ-45');
    if (poe) {
      const note = node('p', 'io-group-note', 'PoE++ · ' + poe.connector + ' · ' + poe.condition + ' ');
      note.append(sourceReference(poe.source));
      section.append(note);
    }
  }
  const grid = node('div', 'io-grid');
  for (const item of items) {
    const card = node('article', 'io-card panel');
    const head = node('div', 'io-card-head');
    head.append(node('h4', '', item.connector), node('span', 'direction', item.direction));
    const facts = node('div', 'io-facts');
    for (const [label, value] of [
      ['SIGNAL', item.signal], ['QUANTITY', item.quantity],
      ['PROTOCOL / STANDARD', item.protocol], ['FIXED / OPTIONAL', item.availability]
    ]) {
      const fact = node('div');
      fact.append(node('span', '', label), node('strong', '', value));
      facts.append(fact);
    }
    card.append(head, facts, node('p', 'io-condition', '조건 · ' + item.condition), sourceReference(item.source));
    grid.append(card);
  }
  section.append(grid);
  $('#io-list').append(section);
}
const coreDocumentTypes = new Set(['Official Product Page', 'User Manual', 'Independent Specification', 'Specification', 'Technical Document']);
for (const document of data.documents.filter(item => !coreDocumentTypes.has(item.type))) {
  const row = node('article', 'document-row panel');
  const main = node('div', 'document-main');
  main.append(node('strong', '', document.title), node('small', '', document.language + ' · ' + document.note + ' · 출처 ' + document.source));
  const side = node('div', 'document-side');
  side.append(badge(document.status), officialLink(document.url, '제조사에서 열기 ↗'));
  row.append(node('span', 'document-type', document.type), main, side);
  $('#all-documents').append(row);
}
for (const title of data.missingDocuments) $('#missing-documents').append(node('span', '', title));

$('#source-count').textContent = data.sources.length + ' SOURCES';
for (const source of data.sources) {
  const item = node('div', 'source-item');
  item.id = 'source-' + source.code;
  const description = node('div');
  description.append(officialLink(source.url, source.name + ' ↗'), node('p', '', source.scope));
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

const sectionLinks = [...document.querySelectorAll('.section-nav a')];
const observedSections = sectionLinks.map(link => document.querySelector(link.getAttribute('href')));
const navigation = document.querySelector('.section-nav');
const navScroller = document.querySelector('.section-nav-inner');
let currentSection = '';
let scrollFrame = 0;
function updateSectionNav() {
  const edge = navigation.getBoundingClientRect().bottom + 48;
  let visibleSection = '';
  for (const section of observedSections) {
    if (section.getBoundingClientRect().top <= edge) visibleSection = section.id;
  }
  if (visibleSection === currentSection) return;
  currentSection = visibleSection;
  for (const link of sectionLinks) {
    const active = link.getAttribute('href') === '#' + visibleSection && Boolean(visibleSection);
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  if (!visibleSection || navScroller.scrollWidth <= navScroller.clientWidth) return;
  const activeLink = sectionLinks.find(link => link.getAttribute('href') === '#' + visibleSection);
  const linkRect = activeLink.getBoundingClientRect();
  const scrollerRect = navScroller.getBoundingClientRect();
  if (linkRect.left < scrollerRect.left + 8 || linkRect.right > scrollerRect.right - 8) {
    const left = navScroller.scrollLeft + linkRect.left - scrollerRect.left - (scrollerRect.width - linkRect.width) / 2;
    navScroller.scrollTo({ left, behavior: 'smooth' });
  }
}
function scheduleSectionNavUpdate() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateSectionNav();
  });
}
window.addEventListener('scroll', scheduleSectionNavUpdate, { passive: true });
window.addEventListener('resize', scheduleSectionNavUpdate);
window.addEventListener('hashchange', scheduleSectionNavUpdate);
updateSectionNav();
