import {buildHubModel, assertHubParity, SERIES} from './model.mjs';
import {buildAnalogWayLayerStandards, renderAnalogWayLayerStandards} from '../detail/analogway-layer-standards.mjs';
import {renderAnalogWayLayerGuide} from '../detail/analogway-layer-guide.mjs';

const site = '../';
const detailHref = slug => `${site}detail/?product=${encodeURIComponent(slug)}`;
const $ = selector => document.querySelector(selector);
const make = (tag, className = '', text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
};
const readJson = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
};

function renderSeries(cards) {
  for (const card of cards) {
    const section = make('article', 'aw-series-card');
    section.append(make('p', 'aw-series-kicker', card.id === 'controller' ? 'CONTROL' : 'PROCESSING'));
    section.append(make('h3', '', card.title));
    section.append(make('p', 'aw-series-count', `${card.models.length}개 모델`));
    const list = make('div', 'aw-series-models');
    for (const model of card.models) {
      const link = make('a', '', model.name);
      link.href = detailHref(model.slug);
      list.append(link);
    }
    section.append(list);
    $('#series-cards').append(section);
  }
}

function renderComparison(model) {
  const columns = ['모델', '입력', '출력', '4K60 화면', '믹싱 레이어', 'RU', '전원'];
  for (const series of SERIES.filter(item => item.id !== 'controller')) {
    const block = make('section', 'aw-compare-series');
    block.append(make('h3', '', series.title));
    const scroll = make('div', 'aw-table-scroll');
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', `${series.title} 모델 비교표`);
    scroll.tabIndex = 0;
    const table = make('table', 'aw-table');
    const head = make('tr');
    for (const label of columns) {
      const th = make('th', '', label);
      th.scope = 'col';
      head.append(th);
    }
    table.append(make('thead'));
    table.tHead.append(head);
    const body = make('tbody');
    for (const row of model.rows.filter(item => item.series === series.id)) {
      const tr = make('tr');
      tr.dataset.slug = row.slug;
      const name = make('th');
      name.scope = 'row';
      const link = make('a', '', row.name);
      link.href = detailHref(row.slug);
      name.append(link);
      tr.append(name);
      for (const field of row.fields) {
        const cell = make('td', '', field.value);
        cell.dataset.key = field.key;
        cell.dataset.source = field.path;
        tr.append(cell);
      }
      body.append(tr);
    }
    table.append(body);
    scroll.append(table);
    block.append(scroll);
    $('#comparison-tables').append(block);
  }
}

function renderDocuments(documents, manifest) {
  for (const document of documents) {
    const item = make('article', 'aw-document');
    const copy = make('div');
    copy.append(make('small', '', `${document.series} · ${document.type === 'Brochure' ? '브로슈어' : '사용설명서'}`));
    copy.append(make('strong', '', document.title));
    const mirrored = (manifest.mirrors ?? []).find(entry => entry.url === document.url);
    const local = document.file ? `${site}${document.file}` : mirrored ? `${site}docs/${mirrored.file}` : null;
    const link = make('a', 'pg-btn', local ? '보기 ↗' : '제조사에서 보기 ↗');
    link.href = local ?? document.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(copy, link);
    $('#document-list').append(item);
  }
}

async function main() {
  const [catalog, manifest] = await Promise.all([readJson(`${site}catalog.json`), readJson(`${site}docs/manifest.json`)]);
  const entries = catalog.filter(item => item.brand === 'Analog Way');
  const products = Object.fromEntries(await Promise.all(entries.map(async item =>
    [item.slug, await readJson(`${site}detail/data/${item.slug}.json`)])));
  const model = buildHubModel(entries, products);
  assertHubParity(model, entries, products);
  renderSeries(model.cards);
  renderComparison(model);
  renderDocuments(model.documents, manifest);

  const own = slugs => slugs.map(slug => {
    const key = products[slug].layerPlan ? 'layerPlan' : 'videoLayerPlan';
    return products[slug][key].models.find(row => row.slug === slug);
  });
  const standards = buildAnalogWayLayerStandards({
    aquilonRs: {...products['aquilon-rs1'].layerPlan, models: own(SERIES[0].slugs)},
    aquilonC: {...products['aquilon-c'].layerPlan, models: own(SERIES[1].slugs)},
    video: {...products['zenith-100'].videoLayerPlan, models: own([...SERIES[2].slugs, ...SERIES[3].slugs])},
  });
  const guide = renderAnalogWayLayerGuide('aquilon-rs1');
  const standardCard = renderAnalogWayLayerStandards(standards, 'aquilon-rs1');
  if (!guide || !standardCard) throw new Error('기존 Analog Way 가이드 카드를 불러오지 못했습니다.');
  $('#guide-card').append(guide);
  $('#standards-card').append(standardCard);
  document.documentElement.dataset.ready = 'true';
}

main().catch(error => {
  $('#load-error').hidden = false;
  $('#load-error').textContent = `제품 자료를 불러오지 못했습니다: ${error.message}`;
  console.error(error);
});
