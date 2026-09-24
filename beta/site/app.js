const $ = selector => document.querySelector(selector);
const ui = {
  search: $('#search'), brand: $('#brand-filter'), categories: $('#categories'),
  categoryCount: $('#category-count'), cards: $('#cards'), resultCount: $('#result-count'),
  empty: $('#empty-state'), error: $('#load-error')
};
let products = [];
let view = 'equipment';
const fold = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase();
// Only imagery already cleared for this public site belongs here. Add later products
// individually after their image and publication status have been checked.
const publicImages = new Map([
  ['sony\0brc-am7', {
    src: './detail/images/ptz-pictogram.svg',
    detail: './detail/?product=brc-am7',
    alt: '범용 PTZ 카메라 픽토그램. BRC-AM7 실물 사진이 아닙니다.',
    note: '픽토그램 · 실물 사진 아님'
  }]
]);

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function setFacets() {
  const current = products.filter(item => item.kind === view);
  const brands = [...new Set(current.map(item => item.brand))].sort((a, b) => a.localeCompare(b, 'ko'));
  const allBrands = element('option', '', '모든 브랜드');
  allBrands.value = '';
  ui.brand.replaceChildren(allBrands);
  for (const brand of brands) {
    const option = element('option', '', brand);
    option.value = brand;
    ui.brand.append(option);
  }
  ui.categories.replaceChildren();
  const categories = [...new Set(current.flatMap(item => item.categories))].sort((a, b) => a.localeCompare(b, 'ko'));
  for (const category of categories) {
    const label = element('label');
    const input = element('input');
    input.type = 'checkbox';
    input.value = category;
    input.setAttribute('aria-label', category);
    label.append(input, element('span', '', category));
    ui.categories.append(label);
  }
}

function createCard(item) {
  const card = element('article', 'card');
  const image = publicImages.get(`${fold(item.brand)}\0${fold(item.product)}`);
  if (image) {
    const media = element('a', 'card-media');
    media.href = image.detail;
    media.setAttribute('aria-label', `${item.brand} ${item.product} 상세 보기`);
    const picture = element('img');
    picture.src = image.src;
    picture.alt = image.alt;
    picture.loading = 'lazy';
    picture.width = 800;
    picture.height = 560;
    media.append(picture, element('span', 'card-media-note', image.note));
    card.append(media);
  }
  card.append(element('span', 'card-brand', item.brand), element('h4', '', item.product));
  const tags = element('div', 'tags');
  for (const category of item.categories) tags.append(element('span', 'tag', category));
  card.append(tags);
  const links = element('div', 'links');
  for (const address of item.official_links) {
    const link = element('a', 'official-link', `${new URL(address).hostname} · 공식 웹페이지 ↗`);
    link.href = address;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    links.append(link);
  }
  card.append(links);
  return card;
}

function render() {
  const query = fold(ui.search.value).trim();
  const brand = ui.brand.value;
  const chosen = new Set([...ui.categories.querySelectorAll('input:checked')].map(input => input.value));
  ui.categoryCount.textContent = chosen.size;
  const filtered = products.filter(item => item.kind === view &&
    (!brand || item.brand === brand) &&
    (!chosen.size || item.categories.some(category => chosen.has(category))) &&
    (!query || fold(`${item.brand} ${item.product}`).includes(query)));
  ui.resultCount.textContent = `${filtered.length.toLocaleString('ko-KR')}개 ${view === 'service' ? '서비스' : '장비'}`;
  ui.empty.hidden = filtered.length !== 0;
  ui.empty.textContent = products.some(item => item.kind === view)
    ? '검색 결과가 없습니다. 검색어나 필터를 조정해 보세요.'
    : '이번 검토본에 선별된 서비스가 없습니다.';
  ui.cards.replaceChildren(...filtered.map(createCard));
}

function switchView(next) {
  view = next;
  $('#equipment-tab').setAttribute('aria-pressed', String(view === 'equipment'));
  $('#service-tab').setAttribute('aria-pressed', String(view === 'service'));
  ui.search.value = '';
  setFacets();
  render();
}

ui.search.addEventListener('input', render);
ui.brand.addEventListener('change', render);
ui.categories.addEventListener('change', render);
$('#clear').addEventListener('click', () => {
  ui.search.value = '';
  ui.brand.value = '';
  for (const input of ui.categories.querySelectorAll('input:checked')) input.checked = false;
  render();
});
$('#equipment-tab').addEventListener('click', () => switchView('equipment'));
$('#service-tab').addEventListener('click', () => switchView('service'));

try {
  const response = await fetch('./catalog.json');
  if (!response.ok) throw new Error('선별 목록을 읽을 수 없습니다.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('선별 목록 형식이 올바르지 않습니다.');
  products = data;
  $('#equipment-total').textContent = data.filter(item => item.kind === 'equipment').length.toLocaleString('ko-KR');
  $('#service-total').textContent = data.filter(item => item.kind === 'service').length.toLocaleString('ko-KR');
  $('#brand-total').textContent = new Set(data.map(item => item.brand)).size.toLocaleString('ko-KR');
  $('#equipment-tab-count').textContent = data.filter(item => item.kind === 'equipment').length;
  $('#service-tab-count').textContent = data.filter(item => item.kind === 'service').length;
  switchView('equipment');
} catch (error) {
  ui.error.hidden = false;
  ui.error.textContent = error.message;
  ui.resultCount.textContent = '목록을 불러오지 못했습니다.';
}
