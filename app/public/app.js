import { filterProducts, listFacets, safeHttpUrl, verificationLabel, UNKNOWN_BRAND } from './catalog-view.mjs';

const $ = (selector) => document.querySelector(selector);
const elements = {
  search: $('#search'),
  brand: $('#brand-filter'),
  categories: $('#category-options'),
  selectedCategories: $('#selected-category-count'),
  results: $('#product-grid'),
  resultCount: $('#result-count'),
  loadMore: $('#load-more'),
  clear: $('#clear-filters'),
  error: $('#load-error'),
  empty: $('#empty-state')
};
let products = [];
let visibleLimit = 24;

function makeElement(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function appendSources(parent, title, sources) {
  const section = makeElement('section', 'detail-section');
  section.append(makeElement('h5', '', `${title} · ${sources.length}`));
  if (!sources.length) {
    section.append(makeElement('p', '', '연결된 URL이 없습니다.'));
  } else {
    const list = makeElement('ul', 'source-list');
    for (const source of sources) {
      const row = makeElement('li');
      const href = safeHttpUrl(source.url);
      if (href) {
        const link = makeElement('a', '', `${new URL(href).hostname} · 원본 열기 ↗`);
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = href;
        list.append(row);
        row.append(link);
      } else {
        row.append(makeElement('span', '', '링크 형식 확인 필요'));
        list.append(row);
      }
      row.append(makeElement('small', '', verificationLabel(source.verification)));
      if (source.source_record) row.append(makeElement('small', '', `연결 원본 행: ${source.source_record}`));
    }
    section.append(list);
  }
  parent.append(section);
}

function appendDetails(parent, item) {
  const body = makeElement('div', 'detail-body');
  appendSources(body, '제조사 공식 출처', item.official_sources);
  appendSources(body, '지정 보조 출처', item.supplemental_sources);

  if (item.direct_evidence.length) {
    const direct = makeElement('section', 'detail-section');
    direct.append(makeElement('h5', '', '제조사 직접 제공 자료 참조'));
    const list = makeElement('ul', 'direct-list');
    for (const reference of item.direct_evidence) list.append(makeElement('li', '', reference));
    direct.append(list);
    body.append(direct);
  }

  const records = makeElement('section', 'detail-section');
  records.append(makeElement('h5', '', `원본 행 · ${item.source_records.length}`));
  const list = makeElement('ul', 'record-list');
  for (const record of item.source_records) {
    list.append(makeElement('li', '', `${record.sheet} · ${record.row}행 · ${record.record_id}`));
  }
  records.append(list);
  body.append(records);

  if (item.notes) {
    const notes = makeElement('section', 'detail-section');
    notes.append(makeElement('h5', '', '목록 메모'));
    notes.append(makeElement('p', '', item.notes));
    body.append(notes);
  }
  parent.append(body);
}

function makeCard(item) {
  const card = makeElement('article', 'product-card');
  const top = makeElement('div', 'card-top');
  top.append(makeElement('span', `brand-label${item.brand ? '' : ' unknown'}`, item.brand || '브랜드 미식별'));
  top.append(makeElement('span', 'item-type', item.item_type || 'ITEM'));
  card.append(top, makeElement('h4', '', item.product));
  card.append(makeElement('p', 'aliases', item.aliases.length ? `별칭 · ${item.aliases.join(' · ')}` : '별칭 정보 없음'));

  const tags = makeElement('div', 'tags');
  for (const category of item.categories) tags.append(makeElement('span', 'tag', category));
  card.append(tags);

  const flags = makeElement('div', 'card-flags');
  const officialCount = item.official_sources.length;
  const supplementalCount = item.supplemental_sources.length;
  flags.append(makeElement('span', `flag${officialCount ? '' : ' missing'}`, officialCount ? `공식 링크 ${officialCount}` : '공식 링크 미확보'));
  if (supplementalCount) flags.append(makeElement('span', 'flag neutral', `보조 링크 ${supplementalCount}`));
  if (item.direct_evidence.length) flags.append(makeElement('span', 'flag neutral', '직접 제공 참조'));
  if (!officialCount && !supplementalCount && !item.direct_evidence.length) flags.append(makeElement('span', 'flag missing', '자료 미확보'));
  if (!item.brand) flags.append(makeElement('span', 'flag missing', '브랜드 미식별'));
  card.append(flags);

  const detail = makeElement('details');
  detail.append(makeElement('summary', '', '자료와 원본 행 보기'));
  appendDetails(detail, item);
  card.append(detail);
  return card;
}

function selectedCategories() {
  return [...elements.categories.querySelectorAll('input:checked')].map(input => input.value);
}

function render() {
  const categories = selectedCategories();
  elements.selectedCategories.textContent = String(categories.length);
  const filtered = filterProducts(products, {
    query: elements.search.value,
    brand: elements.brand.value,
    categories
  });
  elements.resultCount.textContent = `${filtered.length.toLocaleString('ko-KR')}개 제품`;
  elements.empty.hidden = filtered.length !== 0;
  const fragment = document.createDocumentFragment();
  for (const item of filtered.slice(0, visibleLimit)) fragment.append(makeCard(item));
  elements.results.replaceChildren(fragment);
  elements.loadMore.hidden = filtered.length <= visibleLimit;
}

function setupFacets() {
  const facets = listFacets(products);
  for (const brand of facets.brands) {
    const option = makeElement('option', '', `${brand.label} (${brand.count})`);
    option.value = brand.value;
    elements.brand.append(option);
  }
  for (const category of facets.categories) {
    const label = makeElement('label');
    const input = makeElement('input');
    input.type = 'checkbox';
    input.value = category.name;
    input.setAttribute('aria-label', category.name);
    label.append(input, makeElement('span', '', category.name), makeElement('span', 'facet-count', String(category.count)));
    elements.categories.append(label);
  }
}

function resetPageAndRender() {
  visibleLimit = 24;
  render();
}

elements.search.addEventListener('input', resetPageAndRender);
elements.brand.addEventListener('change', resetPageAndRender);
elements.categories.addEventListener('change', resetPageAndRender);
elements.clear.addEventListener('click', () => {
  elements.search.value = '';
  elements.brand.value = '';
  for (const input of elements.categories.querySelectorAll('input:checked')) input.checked = false;
  resetPageAndRender();
});
elements.loadMore.addEventListener('click', () => {
  visibleLimit += 24;
  render();
});

try {
  const response = await fetch('/api/catalog');
  const catalog = await response.json();
  if (!response.ok) throw new Error(catalog.error || '목록을 불러오지 못했습니다.');
  products = catalog.products;
  $('#stat-products').textContent = catalog.counts.catalog_entries.toLocaleString('ko-KR');
  $('#stat-brands').textContent = catalog.counts.brands.toLocaleString('ko-KR');
  $('#stat-sources').textContent = catalog.counts.with_official_links.toLocaleString('ko-KR');
  $('#as-of').textContent = `목록 기준일 ${catalog.as_of} · 실행 시 로컬 파일에서 읽음`;
  setupFacets();
  render();
} catch (error) {
  elements.resultCount.textContent = '목록을 불러오지 못했습니다.';
  elements.error.textContent = error.message;
  elements.error.hidden = false;
}
