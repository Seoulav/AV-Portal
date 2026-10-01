import { portMarkerPercent } from './detail-enhancements.mjs?v=w20261001-001';
const el = (tag, cls = '', text) => {
  const node = document.createElement(tag);
  node.className = cls;
  if (text !== undefined) node.textContent = String(text);
  return node;
};
export function renderLead(text) {
  const fragment = document.createDocumentFragment();
  const match = /\*\*([^*]+)\*\*/.exec(text);
  if (!match) fragment.append(document.createTextNode(text));
  else fragment.append(document.createTextNode(text.slice(0, match.index)), el('strong', '', match[1]), document.createTextNode(text.slice(match.index + match[0].length)));
  return fragment;
}
export function renderKeyFacts(facts) {
  const list = el('dl', 'pg-facts enhancement-facts');
  for (const fact of facts) {
    const pair = el('div');
    const value = el('dd', String(fact.value).length > 12 ? 'long-key-value' : '', fact.value);
    if (fact.unit) value.append(el('small', 'fact-unit', fact.unit));
    pair.append(el('dt', '', fact.label), value);
    list.append(pair);
  }
  return list;
}
export function renderPortMap(items, image) {
  const overlay = el('div', 'port-map-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  if (!image.complete || !image.naturalWidth || image.hidden) return overlay;
  for (const item of items) {
    const span = portMarkerPercent(item, image.naturalWidth);
    if (!span) continue;
    const marker = el('span', 'port-map-marker', item.n);
    marker.style.left = `${span.left + span.width / 2}%`;
    marker.dataset.side = item.side ?? 'bottom';
    overlay.append(marker);
  }
  return overlay;
}
const flowLabels = {
  distribution: '신호 분배', matrix: '출력별 독립 선택', switcher: '입력 선택',
  extender: '신호 전송', 'amplifier-channel': '채널 처리', 'projector-display-input': '투사·화면 처리'
};
const svgNode = (tag, attrs = {}, text) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
};
// Three semantic stages; separate input/output nodes make branching explicit.
export function renderSignalFlow(flow, model) {
  const host = el('div', 'signal-flow');
  host.dataset.flowType = flow.type;
  const svg = svgNode('svg', { role: 'img', 'aria-label': `${flow.inputs.join(', ')} → ${flowLabels[flow.type]} → ${flow.outputs.join(', ')}` });
  const note = el('p', 'pg-note', '신호 흐름 개념도 · 구성과 적용 조건은 사양을 확인하세요.');
  host.append(svg, note);
  for (const text of flow.notes) host.append(el('p', 'flow-note', text));
  let previousWidth = 0;
  function draw(width) {
    width = Math.max(220, Math.round(width));
    if (width === previousWidth) return;
    previousWidth = width;
    const stacked = width < 480;
    const groups = [flow.inputs, [model, flowLabels[flow.type]], flow.outputs];
    const nodeWidth = stacked ? width - 28 : (width - 72) / 3;
    const boxes = [];
    let cursor = 12;
    for (let g = 0; g < 3; g++) {
      const labels = g === 1 ? [groups[g].join(' · ')] : groups[g];
      let y = stacked ? cursor : 12;
      for (const label of labels) {
        const chars = Math.max(8, Math.floor((nodeWidth - 24) / 13));
        const lines = Array.from({ length: Math.ceil(label.length / chars) }, (_, i) => label.slice(i * chars, (i + 1) * chars));
        const h = Math.max(50, lines.length * 21 + 22);
        boxes.push({ g, x: stacked ? 14 : 12 + g * (nodeWidth + 24), y, h, lines });
        y += h + 12;
      }
      if (stacked) cursor = y + 24;
    }
    const height = Math.max(...boxes.map(b => b.y + b.h)) + 12;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.replaceChildren(svgNode('title', {}, '입력 → 처리 → 출력'));
    for (let g = 0; g < 2; g++) {
      const from = boxes.filter(b => b.g === g), to = boxes.filter(b => b.g === g + 1);
      for (const a of from) for (const b of to) {
        const rightRail = stacked && g === 0;
        const x1 = stacked ? (rightRail ? a.x + nodeWidth : a.x) : a.x + nodeWidth;
        const y1 = a.y + a.h / 2;
        const x2 = stacked && rightRail ? b.x + nodeWidth : b.x;
        const y2 = b.y + b.h / 2;
        const rail = rightRail ? width - 3 : 3;
        // Route stacked branches outside the boxes, never through another input/output.
        const path = stacked ? `M${x1},${y1} H${rail} V${y2} H${x2}` : `M${x1},${y1} L${x2},${y2}`;
        svg.append(svgNode('path', { d: path, class: 'flow-line' }));
        const tail = rightRail ? x2 + 7 : x2 - 7;
        svg.append(svgNode('path', { d: `M${tail},${y2 - 4} L${x2},${y2} L${tail},${y2 + 4}`, class: 'flow-line' }));
      }
    }
    for (const b of boxes) {
      svg.append(svgNode('rect', { x: b.x, y: b.y, width: nodeWidth, height: b.h, rx: 12, class: b.g === 1 ? 'flow-process' : 'flow-node' }));
      b.lines.forEach((line, i) => svg.append(svgNode('text', { x: b.x + nodeWidth / 2, y: b.y + 26 + i * 21, 'text-anchor': 'middle', class: 'flow-text' }, line)));
    }
  }
  new ResizeObserver(entries => draw(entries[0].contentRect.width)).observe(host);
  return host;
}
export function renderSetting(setting, number) {
  const card = el('section', 'pg-card setting-card');
  card.id = `setting-${number}`;
  card.dataset.card = String(number).padStart(2, '0');
  card.setAttribute('aria-labelledby', `${card.id}-title`);
  const title = el('h2'); title.id = `${card.id}-title`;
  title.append(el('span', 'pg-idx', card.dataset.card), document.createTextNode(setting.title));
  card.append(title);
  if (setting.kind === 'modes') for (const item of setting.items) {
    const details = el('details', 'pg-inline-more');
    details.append(el('summary', '', item.name), el('p', '', item.summary));
    if (item.detail) details.append(el('p', '', item.detail));
    card.append(details);
  } else {
    const wrap = el('div', 'pg-table setting-table');
    wrap.tabIndex = 0; wrap.setAttribute('aria-label', `${setting.title} 표`);
    const table = el('table'), head = el('thead'), body = el('tbody'), row = el('tr');
    for (const name of setting.columns) { const cell = el('th', '', name); cell.scope = 'col'; row.append(cell); }
    head.append(row);
    for (const values of setting.rows) { const r = el('tr'); for (const value of values) r.append(el('td', '', value)); body.append(r); }
    table.append(head, body); wrap.append(table); card.append(wrap);
  }
  return card;
}
