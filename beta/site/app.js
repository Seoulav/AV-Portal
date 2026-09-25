const fold = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase();

export const TOP_CATEGORIES = [
  { id: 'audio', label: '음향', icon: '◖', terms: ['오디오', 'audio', 'mixer', 'amplifier', 'wireless microphone system', 'antenna', 'audio interface'] },
  { id: 'video', label: '영상', icon: '▣', terms: ['영상', 'video', 'signal switcher', 'video processor', 'video capture', 'license', '멀티채널 레코더/플레이어'] },
  { id: 'camera-conference', label: '카메라·회의', icon: '◉', terms: ['camera', 'conferencing', 'conferencing endpoint', 'video bar', '화상회의'] },
  { id: 'display-projection', label: '디스플레이·프로젝션', icon: '▱', terms: ['프로젝터', 'display', 'projector', '대형 공간용 레이저 프로젝터'] },
  { id: 'network-control', label: '네트워크·제어', icon: '⌘', terms: ['제어', 'control', 'control interface', 'network', 'network switch'] },
  { id: 'power-infrastructure', label: '전원·인프라', icon: 'ϟ', terms: ['power', '전원', 'infrastructure', 'rack', 'ups'] }
];

const categoryFor = item => TOP_CATEGORIES.filter(group => item.categories.some(category => group.terms.includes(fold(category))));

export function mapTopCategories(items) {
  return TOP_CATEGORIES.map(group => ({ ...group, count: items.filter(item => categoryFor(item).some(match => match.id === group.id)).length }));
}

export function filterCatalog(items, state = {}) {
  const query = fold(state.query).trim();
  const chosen = new Set(state.categories ?? []);
  const filtered = items.filter(item =>
    item.kind === 'equipment' &&
    (!state.brand || item.brand === state.brand) &&
    (!state.topCategory || categoryFor(item).some(group => group.id === state.topCategory)) &&
    (!chosen.size || item.categories.some(category => chosen.has(category))) &&
    (state.resource !== 'detail' || Boolean(item.slug)) &&
    (state.resource !== 'official' || Boolean(item.official_links?.length)) &&
    (!query || fold([item.brand, item.product, ...item.categories, ...(item.aliases ?? []), ...(item.searchTerms ?? [])].join(' ')).includes(query))
  );
  const sort = state.sort ?? 'relevance';
  return [...filtered].sort((a, b) => {
    if (sort === 'product') return a.product.localeCompare(b.product, 'ko');
    if (sort === 'brand') return a.brand.localeCompare(b.brand, 'ko') || a.product.localeCompare(b.product, 'ko');
    const aStarts = query && fold(`${a.brand} ${a.product}`).startsWith(query) ? 0 : 1;
    const bStarts = query && fold(`${b.brand} ${b.product}`).startsWith(query) ? 0 : 1;
    return aStarts - bStarts || a.brand.localeCompare(b.brand, 'ko') || a.product.localeCompare(b.product, 'ko');
  });
}

export function buildSuggestions(items, query) {
  const needle = fold(query).trim();
  if (!needle) return [];
  const products = items.filter(item => fold([item.brand, item.product, ...(item.aliases ?? []), ...(item.searchTerms ?? [])].join(' ')).includes(needle)).slice(0, 5).map(item => ({ type: '제품', label: item.product, meta: item.brand, value: item.product, slug: item.slug }));
  const manufacturers = [...new Set(items.map(item => item.brand))].filter(brand => fold(brand).includes(needle)).slice(0, 3).map(label => ({ type: '제조사', label, value: label }));
  const categories = [...new Set(items.flatMap(item => item.categories))].filter(category => fold(category).includes(needle)).slice(0, 3).map(label => ({ type: '카테고리', label, value: label }));
  return [...products, ...manufacturers, ...categories];
}

const SEARCHABLE_VERIFICATIONS = new Set(['VERIFIED', 'FOUND', 'READY']);
const isConfirmedSearchEntry = entry => !entry.verification || SEARCHABLE_VERIFICATIONS.has(entry.verification);

export function publicDetailSearchTerms(detail) {
  return [
    ...(detail.features ?? []).map(value => value.text),
    ...(detail.specifications ?? []).filter(isConfirmedSearchEntry).flatMap(value => [value.name, value.value, value.group]),
    ...(detail.io ?? []).filter(isConfirmedSearchEntry).flatMap(value => [value.connector, value.signal, value.protocol, value.group])
  ].filter(Boolean);
}

export function stateForSuggestion(current, suggestion) {
  if (suggestion.type === '제조사') return { query: '', topCategory: '', brand: suggestion.value, categories: [], resource: '', sort: 'brand' };
  if (suggestion.type === '카테고리') return { query: '', topCategory: '', brand: '', categories: [suggestion.value], resource: '', sort: 'relevance' };
  return { ...current, query: suggestion.value, topCategory: '', brand: '', categories: [] };
}

export function parseExploreState(params) {
  const input = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  return { query: input.get('q') ?? '', topCategory: input.get('top') ?? '', brand: input.get('brand') ?? '', categories: input.getAll('category'), resource: input.get('resource') ?? '', sort: input.get('sort') ?? 'relevance' };
}

export function serializeExploreState(state) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.topCategory) params.set('top', state.topCategory);
  if (state.brand) params.set('brand', state.brand);
  for (const category of state.categories ?? []) params.append('category', category);
  if (state.resource) params.set('resource', state.resource);
  if (state.sort && state.sort !== 'relevance') params.set('sort', state.sort);
  return params;
}

async function loadDetailSearchTerms(items) {
  await Promise.all(items.map(async item => {
    item.slug = item.slug ?? null;
    item.searchTerms = [];
    if (!item.slug) return;
    try {
      const response = await fetch(`./detail/data/${item.slug}.json`);
      if (!response.ok) return;
      const detail = await response.json();
      item.aliases = [detail.model, detail.productName, detail.series].filter(Boolean);
      item.searchTerms = publicDetailSearchTerms(detail);
      item.verificationState = detail.packageStatus ?? '';
      const card = detail.images?.find(image => image.file === item.card_image);
      if (card) item.cardImage = { src: `./detail/images/${card.file}`, alt: card.alt, note: '제조사 공식 이미지' };
    } catch { /* Public Library remains usable if one optional detail index fails. */ }
  }));
}

if (typeof document !== 'undefined') {
  const $ = selector => document.querySelector(selector);
  const element = (tag, className, content) => { const item = document.createElement(tag); if (className) item.className = className; if (content !== undefined) item.textContent = content; return item; };
  const ui = { search: $('#search'), heroSearch: $('#hero-search-form'), heroNote: $('.hero-note'), headerSearch: $('#header-search-form'), globalSearch: $('#global-search'), resultSearch: $('#result-search'), brand: $('#brand-filter'), categories: $('#categories'), categoryCount: $('#category-count'), resource: $('#resource-filter'), sort: $('#sort-filter'), cards: $('#cards'), resultCount: $('#result-count'), workspace: $('#results-workspace'), empty: $('#empty-state'), error: $('#load-error'), suggestions: $('#search-suggestions') };
  let products = [];
  let state = parseExploreState(location.search);
  let activeSuggestion = -1;

  const hasExploration = () => Boolean(state.query || state.topCategory || state.brand || state.categories.length || state.resource);
  const saveUrl = push => {
    const url = new URL(location.href); url.search = serializeExploreState(state).toString();
    history[push ? 'pushState' : 'replaceState']({ explore: true }, '', url);
  };
  const restoreScroll = () => requestAnimationFrame(() => scrollTo({ top: Number(sessionStorage.getItem(`av-scroll:${location.href}`) ?? 0), behavior: 'auto' }));
  const saveScroll = () => sessionStorage.setItem(`av-scroll:${location.href}`, String(scrollY));

  function setFacets() {
    const pool = state.topCategory ? products.filter(item => categoryFor(item).some(group => group.id === state.topCategory)) : products;
    const brands = [...new Set(pool.map(item => item.brand))].sort((a, b) => a.localeCompare(b, 'ko'));
    const selectedBrand = state.brand;
    const currentBrands = [...ui.brand.options].slice(1).map(option => option.value);
    if (currentBrands.join('\0') !== brands.join('\0')) {
      ui.brand.replaceChildren(Object.assign(element('option', '', '모든 제조사'), { value: '' }), ...brands.map(brand => Object.assign(element('option', '', brand), { value: brand })));
    }
    ui.brand.value = brands.includes(selectedBrand) ? selectedBrand : '';
    if (!ui.brand.value) state.brand = '';
    const categories = [...new Set(pool.flatMap(item => item.categories))].sort((a, b) => a.localeCompare(b, 'ko'));
    const currentInputs = [...ui.categories.querySelectorAll('input')];
    if (currentInputs.map(input => input.value).join('\0') !== categories.join('\0')) {
      ui.categories.replaceChildren(...categories.map(category => {
        const label = element('label'); const input = element('input'); input.type = 'checkbox'; input.value = category; input.setAttribute('aria-label', category); label.append(input, element('span', '', category)); return label;
      }));
    }
    for (const input of ui.categories.querySelectorAll('input')) input.checked = state.categories.includes(input.value);
  }

  function createCard(item) {
    const card = element('article', 'card');
    const image = item.cardImage;
    card.classList.toggle('has-media', Boolean(image));
    if (image) { const media = element(item.slug ? 'a' : 'div', 'card-media'); if (item.slug) media.href = `./detail/?product=${item.slug}`; const img = element('img'); img.src = image.src; img.alt = image.alt; img.loading = 'lazy'; media.append(img, element('span', 'card-media-note', image.note)); card.append(media); }
    card.append(element('span', 'card-brand', item.brand), element('h3', '', item.product));
    const tags = element('div', 'tags'); item.categories.slice(0, 3).forEach(category => tags.append(element('span', 'tag', category))); card.append(tags);
    const status = item.verificationState === 'REVIEW REQUIRED' ? '검토 중' : item.slug ? '상세 정보 있음' : item.official_links?.length ? '공식 링크 확인' : '자료 미확인';
    card.append(element('span', 'card-status', status));
    const actions = element('div', 'card-actions');
    if (item.slug) { const detail = element('a', 'detail-link', '제품 상세 보기'); detail.href = `./detail/?product=${item.slug}`; detail.addEventListener('click', saveScroll); actions.append(detail); }
    const official = item.official_links?.[0]; if (official) { const link = element('a', 'official-link', '제조사 공식 페이지 ↗'); link.href = official; link.target = '_blank'; link.rel = 'noopener noreferrer'; actions.append(link); }
    card.append(actions); return card;
  }

  function contextCopy(filtered) {
    const top = TOP_CATEGORIES.find(group => group.id === state.topCategory)?.label;
    if (state.query) return `“${state.query}” 검색 결과`;
    if (top) return `${top} 카테고리`;
    if (state.brand) return `${state.brand} 제품`;
    if (state.categories.length) return `${state.categories.join(' · ')} 카테고리`;
    return `${filtered.length}개 공개 장비`;
  }

  function render(push = false) {
    ui.search.value = state.query; ui.globalSearch.value = state.query; ui.resultSearch.value = state.query; ui.resource.value = state.resource; ui.sort.value = state.sort;
    const active = hasExploration(); ui.workspace.hidden = !active;
    ui.headerSearch.hidden = !active;
    ui.heroSearch.hidden = active;
    ui.heroNote.hidden = active;
    ui.globalSearch.disabled = !active;
    for (const control of [ui.resultSearch, ui.brand, ui.resource, ui.sort]) control.disabled = !active;
    ui.categories.querySelectorAll('input').forEach(input => { input.disabled = !active; });
    document.querySelectorAll('[data-top-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topCategory === state.topCategory)));
    document.querySelectorAll('[data-manufacturer]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.manufacturer === state.brand)));
    if (!active) { ui.cards.replaceChildren(); saveUrl(push); return; }
    setFacets();
    const filtered = filterCatalog(products, state);
    ui.categoryCount.textContent = state.categories.length;
    $('#result-context-title').textContent = contextCopy(filtered);
    $('#result-context-copy').textContent = `${filtered.length.toLocaleString('ko-KR')}개 제품 · 현재 조건에 맞는 공개 항목`;
    ui.resultCount.textContent = `${filtered.length.toLocaleString('ko-KR')}개 제품`;
    ui.empty.hidden = filtered.length !== 0; ui.empty.textContent = '검색 결과가 없습니다. 검색어나 필터를 조정해 보세요.';
    ui.cards.replaceChildren(...filtered.map(createCard)); saveUrl(push);
    if (push) ui.workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderSuggestions() {
    const suggestions = buildSuggestions(products, ui.search.value);
    activeSuggestion = -1; ui.suggestions.hidden = !suggestions.length; ui.search.setAttribute('aria-expanded', String(Boolean(suggestions.length)));
    ui.suggestions.replaceChildren(...suggestions.map((suggestion, index) => {
      const option = element('button', 'suggestion'); option.type = 'button'; option.role = 'option'; option.dataset.index = index; option.append(element('span', 'suggestion-type', suggestion.type), element('strong', '', suggestion.label), element('small', '', suggestion.meta ?? ''));
      option.addEventListener('click', () => selectSuggestion(suggestion)); return option;
    }));
    ui.suggestions._items = suggestions;
  }

  function selectSuggestion(suggestion) {
    ui.suggestions.hidden = true; ui.search.setAttribute('aria-expanded', 'false');
    if (suggestion.type === '제품' && suggestion.slug) { saveScroll(); location.href = `./detail/?product=${suggestion.slug}`; return; }
    state = stateForSuggestion(state, suggestion);
    render(true);
  }

  function renderDiscovery() {
    $('#top-categories').replaceChildren(...mapTopCategories(products).map(group => { const button = element('button', 'category-card'); button.type = 'button'; button.dataset.topCategory = group.id; button.setAttribute('aria-pressed', 'false'); button.disabled = group.count === 0; button.append(element('span', 'category-icon', group.icon), element('strong', '', group.label), element('small', '', `${group.count}개 제품`), element('b', '', '→')); button.addEventListener('click', () => { state = { query: '', topCategory: group.id, brand: '', categories: [], resource: '', sort: 'relevance' }; render(true); }); return button; }));
    const counts = new Map(); products.forEach(item => counts.set(item.brand, (counts.get(item.brand) ?? 0) + 1));
    $('#manufacturer-browser').replaceChildren(...[...counts].sort(([a], [b]) => a.localeCompare(b, 'ko')).map(([brand, count]) => { const button = element('button', 'manufacturer-chip'); button.type = 'button'; button.dataset.manufacturer = brand; button.setAttribute('aria-pressed', 'false'); button.append(element('strong', '', brand), element('span', '', count)); button.addEventListener('click', () => { state = { query: '', topCategory: '', brand, categories: [], resource: '', sort: 'brand' }; render(true); }); return button; }));
  }

  const submitSearch = value => { state = { ...state, query: value.trim(), topCategory: '', brand: '', categories: [] }; ui.suggestions.hidden = true; render(true); };
  $('#hero-search-form').addEventListener('submit', event => { event.preventDefault(); submitSearch(ui.search.value); });
  $('#header-search-form').addEventListener('submit', event => { event.preventDefault(); submitSearch(ui.globalSearch.value); });
  ui.search.addEventListener('input', () => { ui.globalSearch.value = ui.search.value; renderSuggestions(); });
  ui.globalSearch.addEventListener('input', () => { ui.search.value = ui.globalSearch.value; });
  ui.search.addEventListener('keydown', event => { const options = [...ui.suggestions.querySelectorAll('.suggestion')]; if (!options.length) return; if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); activeSuggestion = (activeSuggestion + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length; options.forEach((option, index) => option.setAttribute('aria-selected', String(index === activeSuggestion))); options[activeSuggestion].focus(); } else if (event.key === 'Escape') { ui.suggestions.hidden = true; ui.search.setAttribute('aria-expanded', 'false'); } });
  ui.suggestions.addEventListener('keydown', event => { const options = [...ui.suggestions.querySelectorAll('.suggestion')]; const current = options.indexOf(document.activeElement); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const next = (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length; options[next].focus(); } else if (event.key === 'Escape') { ui.search.focus(); ui.suggestions.hidden = true; } });
  ui.resultSearch.addEventListener('input', () => { state.query = ui.resultSearch.value; render(); });
  ui.brand.addEventListener('change', () => { state.brand = ui.brand.value; render(); });
  ui.categories.addEventListener('change', () => { state.categories = [...ui.categories.querySelectorAll('input:checked')].map(input => input.value); render(); });
  ui.resource.addEventListener('change', () => { state.resource = ui.resource.value; render(); });
  ui.sort.addEventListener('change', () => { state.sort = ui.sort.value; render(); });
  $('#filter-clear').addEventListener('click', () => { state = { ...state, brand: '', categories: [], resource: '', sort: 'relevance' }; render(); });
  $('#clear').addEventListener('click', () => { state = { query: '', topCategory: '', brand: '', categories: [], resource: '', sort: 'relevance' }; render(); scrollTo({ top: 0, behavior: 'smooth' }); });
  addEventListener('popstate', () => { state = parseExploreState(location.search); setFacets(); render(); restoreScroll(); });
  addEventListener('pagehide', saveScroll);

  try {
    const response = await fetch('./catalog.json'); if (!response.ok) throw new Error('선별 목록을 읽을 수 없습니다.');
    const data = await response.json(); if (!Array.isArray(data)) throw new Error('선별 목록 형식이 올바르지 않습니다.');
    products = data.filter(item => item.kind === 'equipment'); await loadDetailSearchTerms(products);
    $('#equipment-total').textContent = products.length.toLocaleString('ko-KR'); $('#brand-total').textContent = `${new Set(products.map(item => item.brand)).size}개 제조사`;
    renderDiscovery(); setFacets(); render(); if (hasExploration()) restoreScroll();
  } catch (error) { ui.error.hidden = false; ui.error.textContent = error.message; ui.workspace.hidden = false; ui.resultCount.textContent = '목록을 불러오지 못했습니다.'; }
}
