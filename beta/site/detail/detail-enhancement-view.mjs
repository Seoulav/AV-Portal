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
export function portMapGeometry(map, naturalWidth, naturalHeight, autoWidthLimit = Infinity) {
  const X0 = 40;
  const defaultPhotoWidth = 680;
  const maxHeight = 900;
  const W = map.displayWidth ? map.displayWidth - X0 * 2
    : Math.min(defaultPhotoWidth, (maxHeight - X0 * 2) * naturalWidth / naturalHeight, autoWidthLimit);
  const scale = W / naturalWidth;
  const cropTop = map.crop?.top || 0, cropBottom = map.crop?.bottom || 0;
  const photoHeight = (naturalHeight - cropTop - cropBottom) * scale;
  const markers = map.items.map(item => {
    if (item.side === 'left' || item.side === 'right') {
      const direction = item.side === 'left' ? -1 : 1;
      const edgeX = X0 + (typeof item.x === 'number' ? item.x : direction < 0 ? 0 : naturalWidth) * scale;
      return { item, side: item.side, direction, edgeX, cx: edgeX + direction * 24,
        sourceY1: item.y1, sourceY2: item.y2 };
    }
    const side = item.side === 'top' ? 'top' : 'bottom';
    const x1 = X0 + item.x1 * scale, x2 = X0 + item.x2 * scale;
    const cx = (x1 + x2) / 2;
    return item.labelX === undefined
      ? { item, side, x1, x2, cx, sourceY: item.y }
      : { item, side, x1, x2, cx: X0 + item.labelX * scale, sourceY: item.y, anchorX: cx };
  });
  const laneCounts = {};
  for (const side of ['top', 'bottom']) {
    const lastX = [];
    for (const marker of markers.filter(entry => entry.side === side).sort((a, b) => a.cx - b.cx || a.item.n - b.item.n)) {
      let lane = lastX.findIndex(x => marker.cx - x >= 22);
      if (lane < 0) lane = lastX.length;
      lastX[lane] = marker.cx;
      marker.lane = lane;
    }
    laneCounts[side] = lastX.length;
  }
  const topMargin = Math.max(40, 34 + 24 * (laneCounts.top - 1));
  const bottomMargin = Math.max(40, 34 + 24 * (laneCounts.bottom - 1));
  if (!map.displayWidth && photoHeight + topMargin + bottomMargin > maxHeight + 1e-8) {
    const availableHeight = maxHeight - topMargin - bottomMargin;
    if (availableHeight <= 0) throw new RangeError('Port Map marker lanes exceed the height limit');
    return portMapGeometry(map, naturalWidth, naturalHeight,
      Math.min(W, availableHeight * naturalWidth / (naturalHeight - cropTop - cropBottom)));
  }
  const photoTop = topMargin, photoBottom = photoTop + photoHeight;
  for (const marker of markers) {
    if (marker.side === 'left' || marker.side === 'right') {
      marker.y1 = photoTop + (marker.sourceY1 - cropTop) * scale;
      marker.y2 = photoTop + (marker.sourceY2 - cropTop) * scale;
      marker.cy = (marker.y1 + marker.y2) / 2;
    } else {
      marker.anchorY = typeof marker.sourceY === 'number'
        ? photoTop + (marker.sourceY - cropTop) * scale
        : marker.side === 'top' ? photoTop : photoBottom;
      marker.cy = marker.side === 'top'
        ? photoTop - 24 - marker.lane * 24
        : photoBottom + 24 + marker.lane * 24;
    }
  }
  return { width: W + X0 * 2, height: photoBottom + bottomMargin, scale,
    image: { x: X0, y: photoTop - cropTop * scale, width: W, height: naturalHeight * scale },
    photoTop, photoBottom, topMargin, bottomMargin, markers };
}

export function renderPortMap(map, image, model = '') {
  const geometry = portMapGeometry(map, image.naturalWidth, image.naturalHeight);
  const svg = svgNode('svg', { class: 'port-map-svg', viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    role: 'img', 'aria-label': `${model} 단자 지도`, 'aria-describedby': 'port-map-photo-desc' });
  svg.append(svgNode('desc', { id: 'port-map-photo-desc' }, image.alt || `${model} 제품 사진`));
  if (map.displayWidth) svg.style.maxWidth = `${map.displayWidth}px`;
  else if (geometry.width < 760) {
    svg.style.minWidth = '0px';
    svg.style.maxWidth = `${geometry.width}px`;
  }
  const clipId = 'port-map-photo-clip';
  const clip = svgNode('clipPath', { id: clipId });
  clip.append(svgNode('rect', { x: geometry.image.x, y: geometry.photoTop,
    width: geometry.image.width, height: geometry.photoBottom - geometry.photoTop }));
  const defs = svgNode('defs'); defs.append(clip); svg.append(defs);
  svg.append(svgNode('image', { href: image.currentSrc || image.src, ...geometry.image, 'clip-path': `url(#${clipId})` }));
  for (const marker of geometry.markers) {
    const { side, cx, cy } = marker;
    let bracket, leader;
    if (side === 'left' || side === 'right') {
      const { edgeX: E, direction: dir, y1, y2 } = marker;
      bracket = `M${E - dir * 8} ${y1}H${E + dir * 6}V${y2}H${E - dir * 8}`;
      leader = `M${E + dir * 6} ${cy}H${E + dir * 14}`;
    } else if (side === 'bottom') {
      const { x1, x2, anchorY: B } = marker;
      bracket = `M${x1} ${B - 8}V${B + 6}H${x2}V${B - 8}`;
      leader = marker.item.labelX === undefined ? `M${cx} ${B + 6}V${cy - 10}` : `M${marker.anchorX} ${B + 6}L${cx} ${cy - 10}`;
    } else {
      const { x1, x2, anchorY: B } = marker;
      bracket = `M${x1} ${B + 8}V${B - 6}H${x2}V${B + 8}`;
      leader = marker.item.labelX === undefined ? `M${cx} ${B - 6}V${cy + 10}` : `M${marker.anchorX} ${B - 6}L${cx} ${cy + 10}`;
    }
    for (const d of [bracket, leader]) svg.append(svgNode('path', { d, fill: 'none', stroke: 'var(--pg-accent)', 'stroke-width': 1.5 }));
    svg.append(svgNode('circle', { cx, cy, r: 10, fill: 'var(--pg-accent)' }));
    svg.append(svgNode('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', 'font-size': 11,
      'font-weight': 700, fill: '#fff' }, marker.item.n));
  }
  return svg;
}

export function renderPortMapCards(items) {
  const cards = el('div', 'port-map-ports');
  for (const item of [...items].sort((a, b) => a.n - b.n)) {
    const card = el('div', 'port-map-port');
    const heading = el('b');
    heading.append(el('span', 'port-map-n', item.n), document.createTextNode(item.label));
    card.append(heading, document.createTextNode(item.desc));
    cards.append(card);
  }
  return cards;
}
export function renderIoFallbackCards(entries) {
  const cards = el('div', 'port-map-ports');
  for (const [index, item] of entries.entries()) {
    const card = el('div', 'port-map-port');
    const heading = el('b');
    heading.append(el('span', 'port-map-n', index + 1), document.createTextNode(item.displayConnector));
    card.append(heading);
    card.append(el('small', 'port-direction', item.portCount === '미확인'
      ? item.directionLabel : `${item.directionLabel} · 포트 ${item.portCount}`));
    card.append(el('small', '', item.channelSignal));
    if (item.specificationCondition !== '—') card.append(el('small', 'port-condition', item.specificationCondition));
    for (const flag of item.flags) card.append(el('small', 'port-flag', flag));
    if (item.verification === 'CONFLICTED') card.append(el('span', 'state state-conflict', item.verification));
    cards.append(card);
  }
  return cards;
}
const svgNode = (tag, attrs = {}, text) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
};
const signalColors = { video:'#2470ce', audio:'#87603e', network:'#167767', control:'#686580', rf:'#a75071', power:'#997013', usb:'#267486', optical:'#7a5ab6', acoustic:'#3d7861' };
let diagramSequence = 0;
// Display-only line wrapping; technical strings are never parsed into inferred ports or routes.
export const wrapFlowText = (text, width) => {
  const measure = value => Array.from(value).reduce((sum, char) => sum + (/[\u0000-\u00ff]/.test(char) ? 7 : 13), 0);
  const lines = []; let line = '';
  for (const word of String(text || '').trim().split(/\s+/).filter(Boolean)) {
    if (line && measure(line + ' ' + word) <= width) { line += ' ' + word; continue; }
    if (line) { lines.push(line); line = ''; }
    // Only a token wider than the entire box needs emergency character wrapping.
    for (const char of word) {
      if (line && measure(line + char) > width) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
};
// HDF-CCF cable scenario renderer start
let sequence = 0;
const line = (parent, x1, y1, x2, y2, cls, marker) => {
  const attrs = { d: 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2, class: cls };
  if (marker) attrs['marker-end'] = 'url(#' + marker + ')';
  parent.append(svgNode('path', attrs));
};
const text = (parent, x, y, value, cls, anchor = 'middle') =>
  parent.append(svgNode('text', { x, y, class: cls, 'text-anchor': anchor }, value));
const monitor = (svg, x, title) => {
  svg.append(svgNode('rect', { x, y: 94, width: 108, height: 68, rx: 7, class: 'cable-flow-screen' }));
  svg.append(svgNode('rect', { x: x + 8, y: 103, width: 92, height: 49, rx: 3, class: 'cable-flow-screen-inner' }));
  line(svg, x + 54, 162, x + 54, 174, 'cable-flow-device-stroke');
  line(svg, x + 31, 174, x + 77, 174, 'cable-flow-device-stroke');
  text(svg, x + 54, 193, title, 'cable-flow-device-label');
};
const laptop = svg => {
  svg.append(svgNode('rect', { x: 28, y: 101, width: 112, height: 61, rx: 5, class: 'cable-flow-laptop' }));
  svg.append(svgNode('rect', { x: 35, y: 108, width: 98, height: 47, rx: 2, class: 'cable-flow-laptop-screen' }));
  svg.append(svgNode('path', { d: 'M21 163 H147 L137 173 H31 Z', class: 'cable-flow-laptop-base' }));
  text(svg, 84, 192, '노트북 · USB-C', 'cable-flow-device-label');
};
const connector = (svg, x, role, caption) => {
  svg.append(svgNode('rect', { x, y: 102, width: 130, height: 74, rx: 12, class: 'cable-flow-connector' }));
  svg.append(svgNode('rect', { x: x + 47, y: 114, width: 36, height: 16, rx: 8, class: 'cable-flow-usbc-port' }));
  text(svg, x + 65, 153, role, 'cable-flow-connector-role');
  text(svg, x + 65, 169, 'USB-C', 'cable-flow-connector-type');
  text(svg, x + 65, 91, caption, 'cable-flow-role-caption');
};
const hub = (svg, scenario, uid) => {
  svg.append(svgNode('rect', { x: 805, y: 8, width: 152, height: 42, rx: 12, class: 'cable-flow-pd-source' }));
  text(svg, 881, 26, '외부 USB-PD 전원', 'cable-flow-pd-source-label');
  text(svg, 881, 42, '허브에 전원 입력', 'cable-flow-pd-source-caption');
  line(svg, 881, 51, 881, 99, 'cable-flow-hub-power-line', uid + '-arrow-down');
  svg.append(svgNode('rect', { x: 810, y: 102, width: 142, height: 74, rx: 12, class: 'cable-flow-hub' }));
  for (const x of [838, 868, 898]) svg.append(svgNode('rect', { x, y: 116, width: 17, height: 10, rx: 2, class: 'cable-flow-hub-port' }));
  svg.append(svgNode('rect', { x: 842, y: 137, width: 38, height: 13, rx: 2, class: 'cable-flow-hdmi-port' }));
  text(svg, 881, 166, 'USB-C 허브/스위치', 'cable-flow-device-label');
  line(svg, 952, 138, 1003, 138, 'cable-flow-signal-line', null);
  text(svg, 978, 118, scenario.outputLabel, 'cable-flow-hdmi-label');
  monitor(svg, 1005, scenario.displayLabel);
  text(svg, 881, 207, 'USB: ' + scenario.peripherals.join(' · '), 'cable-flow-peripherals');
};
function graphic(scenario, model) {
  const uid = 'cable-scenario-' + (++sequence);
  const svg = svgNode('svg', { class: 'cable-flow-svg', viewBox: '0 0 1120 250', role: 'img',
    'aria-label': scenario.title + ' · ' + scenario.signalLabel + ' · ' + scenario.powerLabel });
  svg.append(svgNode('title', {}, model + ' ' + scenario.title));
  const defs = svgNode('defs');
  for (const [suffix, color] of [['arrow-right', '#2470ce'], ['arrow-left', '#e87925'], ['arrow-down', '#e87925']]) {
    const marker = svgNode('marker', { id: uid + '-' + suffix, markerWidth: 11, markerHeight: 11,
      refX: 9, refY: 5.5, orient: 'auto', markerUnits: 'userSpaceOnUse' });
    marker.append(svgNode('path', { d: 'M0 0 L10 5.5 L0 11 Z', fill: color }));
    defs.append(marker);
  }
  svg.append(defs);
  laptop(svg);
  connector(svg, 175, 'SOURCE', '노트북 쪽');
  connector(svg, 670, 'DISPLAY', scenario.receiver === 'hub' ? '허브 쪽' : '모니터 쪽');
  line(svg, 147, 138, 174, 138, 'cable-flow-signal-line', null);
  line(svg, 305, 138, 310, 138, 'cable-flow-signal-line', null);
  line(svg, 310, 138, 670, 138, 'cable-flow-signal-line', uid + '-arrow-right');
  line(svg, 310, 138, 670, 138, 'cable-flow-signal-motion', null);
  line(svg, 670, 160, 310, 160, 'cable-flow-power-line', uid + '-arrow-left');
  svg.append(svgNode('rect', { x: 367, y: 57, width: 246, height: 51, rx: 25, class: 'cable-flow-pill' }));
  const [hybrid, functions] = scenario.cableLabel.split(' · ');
  text(svg, 490, 77, hybrid, 'cable-flow-pill-main');
  text(svg, 490, 96, functions || '', 'cable-flow-pill-sub');
  text(svg, 490, 127, 'AOC · SOURCE → DISPLAY', 'cable-flow-cable-caption');
  if (scenario.receiver === 'hub') hub(svg, scenario, uid);
  else {
    line(svg, 800, 138, 916, 138, 'cable-flow-signal-line', null);
    monitor(svg, 920, scenario.displayLabel);
  }
  text(svg, 490, 222, scenario.signalLabel, 'cable-flow-signal-caption');
  text(svg, 490, 242, scenario.powerLabel, 'cable-flow-power-caption');
  return svg;
}
export function renderCableScenarioFlow(flow, model) {
  const host = el('div', 'signal-flow cable-flow');
  host.dataset.flowType = flow.type;
  const figures = [];
  for (const scenario of flow.scenarios) {
    const article = el('article', 'cable-flow-scenario');
    article.append(el('h3', 'cable-flow-title', scenario.title), el('p', 'cable-flow-mode', scenario.mode));
    const scroll = el('div', 'cable-flow-scroll');
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', scenario.title + ' 그림 · 좌우 방향키로 이동');
    const picture = graphic(scenario, model);
    scroll.append(picture);
    const direction = el('p', 'cable-flow-direction');
    direction.append(el('span', 'cable-flow-direction-signal', '→ ' + scenario.signalLabel),
      el('span', 'cable-flow-direction-power', '← ' + scenario.powerLabel));
    article.append(scroll, el('p', 'cable-flow-scroll-hint', '↔ 좌우로 움직여 전체 경로를 확인하세요'), direction);
    if (scenario.receiver === 'hub') article.append(
      el('p', 'cable-flow-extra cable-flow-pd-path', '외부 USB-PD 전원 → 허브 → HDF-CCF → 노트북 충전'),
      el('p', 'cable-flow-extra', scenario.receiverLabel + ' → ' + scenario.outputLabel + ' → ' + scenario.displayLabel + ' · USB 주변기기: ' + scenario.peripherals.join(' · '))
    );
    figures.push(picture);
    host.append(article);
  }
  const legend = el('div', 'cable-flow-legend');
  for (const [cls, label] of [['source', '입력 · SOURCE'], ['signal', '영상·USB →'], ['power', '← PD 전원'], ['display', '출력 · DISPLAY']]) {
    const item = el('span', 'cable-flow-legend-item');
    item.append(el('i', 'cable-flow-swatch cable-flow-swatch-' + cls), document.createTextNode(label));
    legend.append(item);
  }
  host.append(legend);
  const details = el('details', 'pg-inline-more cable-flow-description');
  details.append(el('summary', '', '그림 설명'), el('p', '', flow.description));
  for (const scenario of flow.scenarios) {
    details.append(el('h4', '', scenario.title));
    const steps = el('ol');
    for (const step of scenario.steps) steps.append(el('li', '', step));
    details.append(steps);
  }
  host.append(details, el('p', 'cable-flow-footer', flow.notes.join(' ')));
  const zoom = el('button', 'pg-btn cable-flow-zoom', '크게 보기');
  zoom.type = 'button';
  const dialog = el('dialog', 'cable-flow-dialog');
  dialog.setAttribute('aria-label', model + ' 시그널 플로우 크게 보기');
  const close = el('button', 'pg-btn cable-flow-close', '닫기');
  close.type = 'button';
  close.addEventListener('click', () => dialog.close());
  dialog.append(close);
  for (const figure of figures) dialog.append(figure.cloneNode(true));
  zoom.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  host.append(zoom, dialog);
  return host;
}
// HDF-CCF cable scenario renderer end
export function renderSignalFlow(flow, model) {
  if (model === 'TOGGLE DOCK 2×1' || model === 'U-BRIDGE 3') return renderInogeniSignalFlow(flow, model);
  if (flow.layout === 'cable-scenarios') return renderCableScenarioFlow(flow, model);
  const host=el('div','signal-flow');host.dataset.flowType=flow.type;
  const frame=el('div','flow-frame'),scroll=el('div','flow-scroll');scroll.tabIndex=0;
  scroll.setAttribute('role','region');scroll.setAttribute('aria-label',`${model} 신호 흐름 그림 · 좌우 방향키로 이동`);
  const uid=`flow-${++diagramSequence}`;
  const svg=svgNode('svg',{role:'img','aria-label':flow.description,'aria-describedby':`${uid}-desc`});
  svg.append(svgNode('title',{},`${model} Signal Flow`),svgNode('desc',{id:`${uid}-desc`},flow.description));
  const defs=svgNode('defs'),gradient=svgNode('linearGradient',{id:`${uid}-band`});
  gradient.append(svgNode('stop',{offset:'0%','stop-color':'#2586e8'}),svgNode('stop',{offset:'100%','stop-color':'#9852b7'}));defs.append(gradient);svg.append(defs);
  const lineLayer=svgNode('g'),nodeLayer=svgNode('g');svg.append(lineLayer,nodeLayer);
  const positions=new Map(), W=800;
  function text(layer,label,x,y,width,cls='flow-label',anchor='middle') {
    const lines=wrapFlowText(label,width);lines.forEach((line,i)=>layer.append(svgNode('text',{x,y:y+i*18,'text-anchor':anchor,class:cls},line)));return lines.length*18;
  }
  function endpoints(items,x,width,side) {
    let y=54;
    const order=[...new Set(items.map(n=>n.group||''))];
    for(const id of order){
      const group=flow.groups.find(g=>g.id===id),ns=items.filter(n=>(n.group||'')===id);
      const start=y;const compact=side==='out'&&ns.length>1&&ns.every(n=>n.label.length<=12&&!n.caption),cols=compact?Math.min(3,ns.length,Math.max(1,Math.floor((width+10)/(Math.max(...ns.map(n=>Array.from(n.label).reduce((sum,c)=>sum+(/[\u0000-\u00ff]/.test(c)?7:13),0)))+24)))):1,cell=(width-(cols-1)*10)/cols;
      if(group)y+=text(nodeLayer,group.label,x+width/2,y+15,width,'flow-group-label')+10;
      for(let i=0;i<ns.length;i+=cols){
        const row=ns.slice(i,i+cols),heights=row.map(n=>Math.max(34,wrapFlowText(n.label,cell-12).length*18+16)+(n.caption?wrapFlowText(n.caption,cell-16).length*18+4:0)),h=Math.max(...heights);
        row.forEach((n,j)=>{
          const xx=x+j*(cell+10),box={x:xx,y,w:cell,h,side,node:n};positions.set(n.id,box);
          nodeLayer.append(svgNode('rect',{x:xx,y,width:cell,height:h,rx:10,class:`flow-endpoint flow-${side}`,'data-node':n.id}));
          const used=text(nodeLayer,n.label,xx+cell/2,y+23,cell-12,`flow-label flow-${side}-label`);
          if(n.caption)text(nodeLayer,n.caption,xx+cell/2,y+29+used,cell-16,'flow-caption');
        });y+=h+10;
      }
      if(group?.caption)y+=text(nodeLayer,group.caption,x+width/2,y+8,width,'flow-caption')+10;
      if(group){const panel=svgNode('rect',{x:x-8,y:start-6,width:width+16,height:y-start+8,rx:14,class:`flow-group-panel flow-${side}-panel`});nodeLayer.insertBefore(panel,nodeLayer.firstChild);}
      y+=20;
    }
    return y;
  }
  const leftBottom=endpoints(flow.inputs,12,140,'in'),rightBottom=endpoints(flow.outputs,604,180,'out');
  let processY=70;
  const processX=198,processW=220;
  for(const p of flow.processes){
    const labelH=wrapFlowText(p.label,processW-24).length*18,captionH=wrapFlowText(p.caption,processW-24).length*18;
    const matrix=p.kind==='matrix',gridH=matrix?Math.max(100,p.crosspoints.inputs.length*34):72;
    const h=matrix ? Math.max(...p.crosspoints.inputs.map(id=>positions.get(id).y+positions.get(id).h))+captionH+40-54 : labelH+captionH+gridH+48;
    if(matrix)processY=54;
    const b={x:processX,y:processY,w:processW,h,side:'process',node:p};positions.set(p.id,b);
    nodeLayer.append(svgNode('rect',{x:b.x,y:b.y,width:b.w,height:b.h,rx:16,class:'flow-process-shape','data-kind':p.kind}));
    text(nodeLayer,p.label,b.x+b.w/2,matrix?18:b.y+25,b.w-24,'flow-process-label');
    const cy=b.y+labelH+52,cx=b.x+b.w/2;
    if(matrix){
      const c=p.crosspoints,gx=b.x+26,gy=b.y+8,gw=b.w-52;
      const ys=c.inputs.map(id=>{const n=positions.get(id);return n.y+n.h/2;});const gh=Math.max(...ys)-gy+14;
      text(nodeLayer,'● 선택 예시',cx,38,b.w-24,'flow-example-label');
      const px=i=>gx+(i+.5)*gw/c.outputs.length,py=i=>ys[i];
      c.inputs.forEach((id,i)=>{nodeLayer.append(svgNode('path',{d:`M${b.x} ${py(i)}H${gx+gw}`,class:'flow-grid-in'}));});
      c.outputs.forEach((id,j)=>{nodeLayer.append(svgNode('path',{d:`M${px(j)} ${gy}V${gy+gh}`,class:'flow-grid-out'}));if(positions.get(id).node.tag)text(nodeLayer,positions.get(id).node.tag,px(j),gy-6,22,'flow-axis');});
      c.inputs.forEach((input,i)=>c.outputs.forEach((output,j)=>nodeLayer.append(svgNode('circle',{cx:px(j),cy:py(i),r:c.examples.some(e=>e.input===input&&e.output===output)?5:2,class:c.examples.some(e=>e.input===input&&e.output===output)?'flow-selected':'flow-crosspoint'}))));
    }else{
      const ink={fill:'none',stroke:'#4d6890','stroke-width':2.4,'stroke-linecap':'round','stroke-linejoin':'round'};
      const path=d=>nodeLayer.append(svgNode('path',{d,...ink,class:`flow-symbol flow-symbol-${p.kind}`}));
      const circle=(x,y,r)=>nodeLayer.append(svgNode('circle',{cx:x,cy:y,r,...ink}));
      if(p.kind==='select'){path(`M${cx-55} ${cy-18}H${cx-28}M${cx-55} ${cy+18}H${cx-28}M${cx-25} ${cy-18}L${cx+15} ${cy}H${cx+55}`);circle(cx-25,cy-18,3);circle(cx-25,cy+18,3);}
      else if(p.kind==='split'){path(`M${cx-55} ${cy}H${cx}M${cx} ${cy-24}V${cy+24}M${cx} ${cy-24}H${cx+55}M${cx} ${cy}H${cx+55}M${cx} ${cy+24}H${cx+55}`);circle(cx,cy,4);}
      else if(p.kind==='mix'){circle(cx,cy,23);path(`M${cx-55} ${cy-24}L${cx-24} ${cy-8}M${cx-55} ${cy+24}L${cx-24} ${cy+8}M${cx-12} ${cy}H${cx+12}M${cx} ${cy-12}V${cy+12}M${cx+24} ${cy}H${cx+55}`);}
      else if(p.kind==='amplify'){path(`M${cx-28} ${cy-26}L${cx+30} ${cy}L${cx-28} ${cy+26}ZM${cx-55} ${cy}H${cx-28}M${cx+30} ${cy}H${cx+55}`);}
      else if(p.kind==='rf'){path(`M${cx} ${cy+25}V${cy-15}M${cx-13} ${cy-28}Q${cx-32} ${cy-7} ${cx-13} ${cy+10}M${cx+13} ${cy-28}Q${cx+32} ${cy-7} ${cx+13} ${cy+10}M${cx-27} ${cy-37}Q${cx-54} ${cy-7} ${cx-27} ${cy+20}M${cx+27} ${cy-37}Q${cx+54} ${cy-7} ${cx+27} ${cy+20}`);}
      else if(p.kind==='power'){path(`M${cx+7} ${cy-29}L${cx-20} ${cy+5}H${cx-1}L${cx-7} ${cy+29}L${cx+24} ${cy-7}H${cx+5}Z`);}
      else if(p.kind==='dsp'){path(`M${cx-60} ${cy+18}Q${cx-35} ${cy+18} ${cx-28} ${cy-16}T${cx+5} ${cy+3}T${cx+60} ${cy-18}`);}
      else if(p.kind==='switch'||p.kind==='bridge'){path(`M${cx-55} ${cy-14}H${cx+55}L${cx+43} ${cy-23}M${cx+55} ${cy+14}H${cx-55}L${cx-43} ${cy+23}`);}
      else if(p.kind==='scale'||p.kind==='conference'){path(`M${cx-45} ${cy-28}H${cx+45}V${cy+25}H${cx-45}ZM${cx} ${cy-28}V${cy+25}M${cx-45} ${cy}H${cx+45}`);}
      else if(p.kind==='record'){circle(cx,cy,23);nodeLayer.append(svgNode('circle',{cx,cy,r:10,fill:'#9052ad'}));path(`M${cx-55} ${cy}H${cx-30}M${cx+30} ${cy}H${cx+55}`);}
      else if(p.kind==='sense'||p.kind==='capture'){path(`M${cx-43} ${cy-24}H${cx+43}V${cy+24}H${cx-43}Z`);circle(cx,cy,17);}
      else if(p.kind==='module'){path(`M${cx-40} ${cy-28}H${cx+40}V${cy+28}H${cx-40}ZM${cx-22} ${cy+28}V${cy+36}M${cx} ${cy+28}V${cy+36}M${cx+22} ${cy+28}V${cy+36}`);}
      else if(p.kind==='control'){circle(cx,cy,9);for(const [dx,dy] of [[-48,-20],[48,-20],[0,30]]){path(`M${cx} ${cy}L${cx+dx} ${cy+dy}`);circle(cx+dx,cy+dy,5);}}
      else if(p.kind==='transduce'){path(`M${cx-52} ${cy}Q${cx-40} ${cy-23} ${cx-28} ${cy}T${cx-4} ${cy}M${cx+9} ${cy}H${cx+52}M${cx+40} ${cy-9}L${cx+52} ${cy}L${cx+40} ${cy+9}`);}
      else {path(`M${cx-50} ${cy}H${cx+50}M${cx+36} ${cy-11}L${cx+50} ${cy}L${cx+36} ${cy+11}`);text(nodeLayer,p.kind==='encode'?'ENC':p.kind==='decode'?'DEC':'A → B',cx,cy-17,150,'flow-caption');}
    }
    if(p.caption)text(nodeLayer,p.caption,b.x+b.w/2,b.y+b.h-captionH-10,b.w-24,'flow-caption');
    processY+=h+36;
  }
  // Every line is an explicit edge. No inferred all-to-all connections.
  const arrows=(x,y,angle,color,both=false)=>{const a=svgNode('path',{d:'M-7 -4L0 0L-7 4',fill:'none',stroke:color,'stroke-width':2,transform:`translate(${x} ${y}) rotate(${angle})`});lineLayer.append(a);};
  let auxiliaryBottom = 0;
  const drawEdge=(e,aux,index)=>{
    const a=positions.get(e.from),b=positions.get(e.to),color=!aux&&b.side==='out'?'#9658b4':signalColors[e.signal];
    let x1=a.x+a.w,y1=a.y+a.h/2,x2=b.x,y2=b.y+b.h/2,d;
    if(b.node.kind==='matrix'&&b.node.crosspoints.inputs.includes(e.from))y2=y1;
    if(aux && a.side==='in' && b.side==='out') {
      // Antenna/control/power bypasses travel outside processing blocks, never behind them.
      const lane = Math.max(leftBottom, rightBottom, processY) + 18 + index * 16;
      auxiliaryBottom = Math.max(auxiliaryBottom, lane);
      d=`M${x1} ${y1}H${x1+10+index*5}V${lane}H${588-index*5}V${y2}H${x2}`;
    }else if(a.side==='process'&&b.side==='process'){
      x1=a.x+a.w/2;y1=a.y+a.h;x2=b.x+b.w/2;y2=b.y;d=`M${x1} ${y1}L${x2} ${y2}`;
    }else if(flow.band&&a.side==='process'&&b.side==='out'){d=`M${x1} ${y1}H586C596 ${y1} 596 ${y2} ${x2} ${y2}`;
    }else{const rail=aux&&a.side!=='in'?550+index%4*8:(x1+x2)/2;d=`M${x1} ${y1}C${rail} ${y1} ${rail} ${y2} ${x2} ${y2}`;}
    lineLayer.append(svgNode('path',{d,class:`flow-edge${aux?' flow-auxiliary':''}`,stroke:color,'data-from':e.from,'data-to':e.to}));
    arrows(x2,y2,a.side==='process'&&b.side==='process'?90:0,color);
    if(e.direction==='both')arrows(x1,y1,a.side==='process'&&b.side==='process'?-90:180,color);
    // Route descriptions live in a reserved wrapping list below the canvas.
    // Long text must never overlay a node, band or another branch.
  };
  flow.connections.forEach((e,i)=>drawEdge(e,false,i));flow.auxiliary.forEach((e,i)=>drawEdge(e,true,i));
  const H=Math.max(leftBottom,rightBottom,processY,auxiliaryBottom)+12;
  if(flow.band){
    const first=positions.get(flow.processes[0].id);const y=first.y+first.h/2-5, x=438, w=148;
    nodeLayer.append(svgNode('rect',{x,y,width:w,height:10,rx:5,fill:`url(#${uid}-band)`}));
    const labelLines=wrapFlowText(flow.band.label,w).length;text(nodeLayer,flow.band.label,x+w/2,y-12-(labelLines-1)*18,w,'flow-band-label');
    if(flow.band.detail)text(nodeLayer,flow.band.detail,x+w/2,y+28,w,'flow-caption');
  }
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);scroll.append(svg);frame.append(scroll,el('span','flow-fade flow-fade-left'),el('span','flow-fade flow-fade-right'));host.append(frame);
  const hint=el('p','flow-scroll-hint','↔ 좌우로 움직여 전체 신호 흐름을 확인하세요');host.append(hint);
  const update=()=>{const max=scroll.scrollWidth-scroll.clientWidth;host.dataset.scrollable=String(max>2);host.dataset.atStart=String(scroll.scrollLeft<2);host.dataset.atEnd=String(scroll.scrollLeft>=max-2);};
  scroll.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(scroll);
  scroll.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();scroll.scrollLeft=event.key==='Home'?0:event.key==='End'?scroll.scrollWidth:scroll.scrollLeft+(event.key==='ArrowLeft'?-120:120);});
  const labeled=[...flow.connections,...flow.auxiliary].filter(e=>e.label);
  if(labeled.length){
    const notes=el('ul','flow-route-notes');notes.setAttribute('aria-label','경로별 설명');
    for(const edge of labeled){const row=el('li');row.append(el('strong','',positions.get(edge.from).node.label+' '+(edge.direction==='both'?'↔':'→')+' '+positions.get(edge.to).node.label),document.createTextNode(' · '+edge.label));notes.append(row);}
    host.append(notes);
  }
  const legend=el('div','flow-legend');
  for(const l of flow.legend){const entry=el('span','flow-legend-item');const swatch=el('i');swatch.style.background=signalColors[l.signal];swatch.setAttribute('aria-hidden','true');entry.append(swatch,document.createTextNode(l.label));legend.append(entry);}
  if(flow.auxiliary.length)legend.append(el('span','flow-legend-dashed','┄ 보조 경로'));
  host.append(legend);
  const details=el('details','pg-inline-more flow-description');details.append(el('summary','','그림 설명'),el('p','',flow.description));
  for(const note of flow.notes)details.append(el('p','flow-note',note));host.append(details);
  return host;
}
const svgText = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export function renderScreenExampleSvg(item) {
  const bounds = { x: 28, y: 24, width: 304, height: 171 };
  const sourceWidth = item.signalType === 'output' ? item.outputWidth : item.signalWidth;
  const sourceHeight = item.signalType === 'output' ? item.outputHeight : item.signalHeight;
  const illustrative = item.placementHint === 'illustrative-offset';
  const aspect = sourceWidth / sourceHeight;
  const screen = aspect < bounds.width / bounds.height
    ? { x: bounds.x + (bounds.width - bounds.height * aspect) / 2, y: bounds.y, width: bounds.height * aspect, height: bounds.height }
    : { x: bounds.x, y: bounds.y + (bounds.height - bounds.width / aspect) / 2, width: bounds.width, height: bounds.width / aspect };
  const activeWidth = screen.width * (illustrative ? 0.28 : item.activeWidth / sourceWidth);
  const activeHeight = screen.height * (illustrative ? 0.3 : item.activeHeight / sourceHeight);
  const activeX = illustrative ? screen.x + screen.width * 0.36 : screen.x + screen.width * (item.offsetX || 0) / sourceWidth;
  const activeY = illustrative ? screen.y + screen.height * 0.34 : screen.y + screen.height * (item.offsetY || 0) / sourceHeight;
  const displayLabel = illustrative ? '위치 지정 예시' : `${item.activeWidth}×${item.activeHeight}`;
  const maskLabelX = illustrative
    ? screen.x + screen.width / 2
    : item.rightMargin > 0
      ? activeX + activeWidth + screen.width * item.rightMargin / sourceWidth / 2
      : screen.x + screen.width / 2;
  const maskLabelY = illustrative
    ? screen.y + screen.height * 0.82
    : item.bottomMargin > 0 && item.rightMargin === 0
      ? activeY + activeHeight + screen.height * item.bottomMargin / sourceHeight / 2
      : activeY + activeHeight / 2;
  const maskLabel = item.masked
    ? `<text class="screen-mask-label" x="${maskLabelX}" y="${maskLabelY}" text-anchor="middle" dominant-baseline="middle">마스킹(검정) 영역</text>`
    : '';
  const activeLabel = item.areaLabel || '활성 표시 영역';
  return `<svg class="screen-example-monitor" viewBox="0 0 360 258" role="img" aria-label="화면 구성 예시: ${svgText(item.signal)} 신호, ${svgText(displayLabel)} ${svgText(activeLabel)}${item.masked ? ', 검정 마스킹 영역' : ', 마스킹 없음'}">
    <rect class="screen-monitor-bezel" x="18" y="14" width="324" height="191" rx="12" />
    <rect class="screen-monitor-surface" x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="2" />
    <rect class="screen-active-area" x="${activeX}" y="${activeY}" width="${activeWidth}" height="${activeHeight}" />
    <text class="screen-active-label" x="${activeX + activeWidth / 2}" y="${activeY + activeHeight / 2}" text-anchor="middle" dominant-baseline="middle">${svgText(displayLabel)}</text>
    ${maskLabel}
    <path class="screen-monitor-neck" d="M156 205h48l10 30h-68z" />
    <rect class="screen-monitor-foot" x="132" y="234" width="96" height="8" rx="4" />
  </svg>`;
}
function renderScreenExample(item) {
  const example = el('article', 'screen-example-card');
  const figure = el('figure', 'screen-example-figure');
  const image = el('span', 'screen-example-art'); image.innerHTML = renderScreenExampleSvg(item);
  const caption = item.placementHint === 'illustrative-offset'
    ? '파란 칸: 표시 영역(AOI) · 검정: 마스킹 영역 · 좌표·크기 수치 미표시'
    : item.masked ? `파란 칸: ${item.areaLabel || '활성 표시 영역'} · 검정: 마스킹 영역` : item.note;
  figure.append(image, el('figcaption', '', caption));
  example.append(figure);
  const details = el('dl', 'screen-example-details');
  const rows = [['적용 방식', item.method], [item.signalType === 'output' ? '출력 해상도' : '신호 해상도', item.signal]];
  if (item.placementHint === 'illustrative-offset') rows.push(['화면 구성', item.note]);
  else {
    rows.push([item.areaLabel || '활성 표시 영역', `${item.activeWidth}×${item.activeHeight}px`]);
    if (item.masked) {
      rows.push(['위치', `X ${item.offsetX} · Y ${item.offsetY}`]);
      rows.push(['여백', `오른쪽 ${item.rightMargin}px · 아래 ${item.bottomMargin}px`]);
    } else if (item.note) rows.push(['화면 구성', item.note]);
  }
  for (const [label, value] of rows) {
    const row = el('div', 'screen-example-detail');
    row.append(el('dt', '', label), el('dd', '', value)); details.append(row);
  }
  example.append(details);
  return example;
}
function renderScreenExamples(setting, card) {
  card.classList.add('screen-example-section');
  const tabs = el('div', 'screen-example-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', '화면 구성 예시 선택');
  tabs.setAttribute('aria-orientation', 'horizontal');
  const panels = [];
  const selectExample = index => {
    for (const [tabIndex, tab] of [...tabs.children].entries()) {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[tabIndex].hidden = !selected;
    }
  };
  for (const [index, item] of setting.items.entries()) {
    const example = renderScreenExample(item);
    const tabId = `${card.id}-tab-${index + 1}`;
    const panelId = `${card.id}-panel-${index + 1}`;
    const tab = el('button', 'screen-example-tab', item.name);
    tab.type = 'button';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('aria-selected', String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener('click', () => selectExample(index));
    tabs.append(tab);

    example.id = panelId;
    example.setAttribute('role', 'tabpanel');
    example.setAttribute('aria-labelledby', tabId);
    example.tabIndex = 0;
    example.hidden = index !== 0;
    example.dataset.example = String(index + 1);
    example.prepend(el('h3', 'screen-example-heading', item.name));
    panels.push(example);
  }
  tabs.addEventListener('keydown', event => {
    const current = [...tabs.children].indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.children.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.children.length) % tabs.children.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.children.length - 1;
    else return;
    event.preventDefault();
    selectExample(next);
    tabs.children[next].focus();
  });
  card.append(tabs, ...panels);
}
function renderSettingComparison(comparison) {
  const section = el('div', 'setting-comparison');
  section.append(el('h3', '', comparison.title));
  const wrap = el('div', 'pg-table setting-table');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', `${comparison.title} 표`);
  const table = el('table');
  table.append(el('caption', 'sr-only', comparison.title));
  const row = el('tr');
  for (const label of comparison.columns) {
    const heading = el('th', '', label);
    heading.scope = 'col';
    row.append(heading);
  }
  const head = el('thead'); head.append(row); table.append(head);
  const body = el('tbody');
  for (const values of comparison.rows) {
    const dataRow = el('tr');
    for (const [index, value] of values.entries()) {
      const cell = index === 0 ? el('th', '', value) : el('td', '', value);
      if (index === 0) cell.scope = 'row';
      dataRow.append(cell);
    }
    body.append(dataRow);
  }
  table.append(body); wrap.append(table); section.append(wrap);
  return section;
}
export function renderSetting(setting, number) {
  const card = el('section', 'pg-card setting-card');
  card.id = `setting-${number}`;
  card.dataset.card = String(number).padStart(2, '0');
  card.setAttribute('aria-labelledby', `${card.id}-title`);
  const title = el('h2'); title.id = `${card.id}-title`;
  title.append(el('span', 'pg-idx', card.dataset.card), document.createTextNode(setting.title));
  card.append(title);
  if (setting.kind === 'screen-examples') renderScreenExamples(setting, card);
  else if (setting.kind === 'modes') {
    for (const item of setting.items) {
      const details = el('details', 'pg-inline-more');
      details.append(el('summary', '', item.name), el('p', '', item.summary));
      if (item.detail) details.append(el('p', '', item.detail));
      card.append(details);
    }
    if (setting.comparison) card.append(renderSettingComparison(setting.comparison));
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

// W-20261016-001: scoped INOGENI connection diagrams.
const h = (tag, cls='', value='') => { const n=document.createElement(tag); n.className=cls; if(value)n.textContent=value; return n; };
const s = (tag, attrs={}, value) => { const n=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,v); if(value!==undefined)n.textContent=value; return n; };
const t = (svg,x,y,value,cls='cable-flow-device-label') => svg.append(s('text',{x,y,class:cls,'text-anchor':'middle'},value));
const r = (svg,x,y,w,h,cls) => svg.append(s('rect',{x,y,width:w,height:h,rx:12,class:cls}));
const l = (svg,d,cls,marker) => svg.append(s('path',{d,class:cls,...(marker?{'marker-end':`url(#${marker})`}:{})}));
let seq=0;
function figure(group,index,toggle) {
  const id=`inogeni-flow-${++seq}`;
  const a=s('svg',{class:'cable-flow-svg',viewBox:'0 0 1120 290',role:'img','aria-label':group.label+' · '+group.caption});
  a.append(s('title',{},group.label));
  const defs=s('defs');
  for(const [name,color] of [['signal','#2470ce'],['power','#e87925']]) for(const side of ['right','left','down']) {
    const marker=s('marker',{id:`${id}-${name}-${side}`,markerWidth:11,markerHeight:11,refX:9,refY:5.5,orient:'auto',markerUnits:'userSpaceOnUse'});
    marker.append(s('path',{d:'M0 0 L10 5.5 L0 11 Z',fill:color})); defs.append(marker);
  }
  a.append(defs);
  r(a,25,118,120,65,'cable-flow-laptop'); r(a,34,126,102,49,'cable-flow-laptop-screen');
  a.append(s('path',{d:'M17 184 H153 L141 194 H29 Z',class:'cable-flow-laptop-base'}));
  t(a,85,216,'노트북 / PC');
  if(toggle) {
    r(a,385,102,225,105,'cable-flow-connector'); t(a,497,138,'TOGGLE DOCK 2×1'); t(a,497,177,group.label,'cable-flow-connector-type');
    r(a,920,104,165,73,'cable-flow-screen'); t(a,1002,136,'TV / 모니터'); t(a,1002,161,'HDMI 출력','cable-flow-connector-type');
    r(a,820,213,260,48,'cable-flow-hub'); t(a,950,242,'USB-A ×3 주변기기 공유');
    l(a,'M610 140 L918 140','cable-flow-signal-line',`${id}-signal-right`); t(a,765,128,'HDMI 출력','cable-flow-hdmi-label');
    l(a,'M610 167 L780 167 L780 235 L818 235','cable-flow-signal-line',`${id}-signal-right`);
    r(a,418,8,158,48,'cable-flow-pd-source'); t(a,497,30,'외부 DC 24V','cable-flow-pd-source-label'); t(a,497,46,'도크 전원 입력','cable-flow-pd-source-caption');
    l(a,'M497 56 L497 99','cable-flow-power-line',`${id}-power-down`);
    if(index===0) {
      l(a,'M150 150 L382 150','cable-flow-signal-line',`${id}-signal-right`); t(a,265,136,'USB-C · USB 3.0 + DP Alt','cable-flow-hdmi-label');
      l(a,'M383 177 L151 177','cable-flow-power-line',`${id}-power-left`); t(a,265,204,'PD 최대 100W → 호스트 1','cable-flow-power-caption');
    } else {
      l(a,'M150 128 L382 128','cable-flow-signal-line',`${id}-signal-right`); t(a,265,115,'USB-B · USB 3.0','cable-flow-hdmi-label');
      l(a,'M150 169 L382 169','cable-flow-signal-line',`${id}-signal-right`); t(a,265,190,'HDMI 입력','cable-flow-hdmi-label');
      t(a,265,212,'호스트 2 PD 공급 없음','cable-flow-power-caption');
    }
    l(a,'M386 248 L610 248','inogeni-control-line'); t(a,497,275,'RS-232 · LAN · GPI 제어','cable-flow-peripherals');
  } else {
    r(a,185,101,150,105,'cable-flow-connector'); t(a,260,136,'PC HOST'); t(a,260,175,'USB-C','cable-flow-connector-type');
    r(a,782,101,150,105,'cable-flow-connector'); t(a,857,136,'DEVICE'); t(a,857,175,'USB-A ×2 + USB-C ×1','cable-flow-connector-type');
    r(a,960,109,150,70,'cable-flow-hub'); t(a,1035,140,'USB 주변기기'); t(a,1035,164,'3개','cable-flow-connector-type');
    l(a,'M146 149 L182 149','cable-flow-signal-line',`${id}-signal-right`);
    l(a,'M336 143 L779 143','cable-flow-signal-line',`${id}-signal-right`);
    l(a,'M933 149 L957 149','cable-flow-signal-line',`${id}-signal-right`);
    r(a,428,43,255,54,'cable-flow-pill'); t(a,555,67,'CAT6A U/FTP · 한 가닥','cable-flow-pill-main'); t(a,555,87,'USB 3.0 · 최대 100m','cable-flow-pill-sub');
    const px=index===0?190:786, from=index===0?336:780, to=index===0?779:336;
    r(a,px,8,145,49,'cable-flow-pd-source'); t(a,px+72,29,'외부 DC 24V','cable-flow-pd-source-label'); t(a,px+72,46,index===0?'PC HOST 쪽':'DEVICE 쪽','cable-flow-pd-source-caption');
    l(a,`M${px+72} 58 L${px+72} 98`,'cable-flow-power-line',`${id}-power-down`);
    l(a,`M${from} 179 L${to} 179`,'cable-flow-power-line',`${id}-power-${index===0?'right':'left'}`);
    t(a,555,206,index===0?'PoC 전원 PC HOST → DEVICE':'PoC 전원 DEVICE → PC HOST','cable-flow-power-caption');
    l(a,'M336 238 L780 238','inogeni-control-line'); t(a,555,263,'RS-232 패스스루 · USB-mini 모듈 관리','cable-flow-peripherals');
  }
  return a;
}
function renderInogeniSignalFlow(flow,model) {
  const toggle=model.startsWith('TOGGLE DOCK');
  const host=h('div','signal-flow cable-flow inogeni-flow'); host.dataset.flowType=flow.type;
  const pictures=[];
  for(const [index,group] of flow.groups.entries()) {
    const article=h('article','cable-flow-scenario'); article.append(h('h3','cable-flow-title',group.label),h('p','cable-flow-mode',group.caption));
    const scroll=h('div','cable-flow-scroll'); scroll.tabIndex=0; scroll.setAttribute('role','region'); scroll.setAttribute('aria-label',group.label+' 그림 좌우 스크롤');
    const pic=figure(group,index,toggle); scroll.append(pic); pictures.push(pic);
    article.append(scroll,h('p','cable-flow-scroll-hint','↔ 좌우로 움직여 전체 경로를 확인하세요')); host.append(article);
  }
  const legend=h('div','cable-flow-legend');
  for(const [cls,value] of [['source','호스트 입력'],['signal',toggle?'영상·USB → 출력':'USB 데이터 → DEVICE'],['power',toggle?'24V 입력 · USB-C PD':'24V 입력 · PoC'],['display','연결 장비']]) {
    const item=h('span','cable-flow-legend-item'); item.append(h('i','cable-flow-swatch cable-flow-swatch-'+cls),document.createTextNode(value)); legend.append(item);
  }
  host.append(legend);
  const details=h('details','pg-inline-more cable-flow-description'); details.append(h('summary','','그림 설명'),h('p','',flow.description));
  for(const group of flow.groups) { details.append(h('h4','',group.label)); const steps=h('ol');
    const lines=toggle ? group.id==='host1' ? ['호스트 1 USB-C 한 줄을 도크에 연결','영상은 HDMI 출력, USB는 공유 주변기기로 전달','도크 24V 입력과 호스트 1 USB-C PD 공급을 구분'] : ['호스트 2 USB-B와 HDMI 두 줄을 도크에 연결','영상은 HDMI 출력, USB는 공유 주변기기로 전달','호스트 2에는 USB-C PD 경로가 없음'] : group.id==='host-power' ? ['PC USB-C를 PC HOST에 연결','CAT6A U/FTP 한 가닥으로 DEVICE 유닛 연결','PC HOST의 24V 전원이 PoC로 DEVICE에 전달'] : ['PC USB-C를 PC HOST에 연결','CAT6A U/FTP 한 가닥으로 DEVICE 유닛 연결','DEVICE의 24V 전원이 PoC로 PC HOST에 전달'];
    for(const value of lines) steps.append(h('li','',value)); details.append(steps);
  }
  host.append(details,h('p','cable-flow-footer',flow.notes.join(' ')));
  const zoom=h('button','pg-btn cable-flow-zoom','크게 보기'); zoom.type='button';
  const dialog=h('dialog','cable-flow-dialog'); dialog.setAttribute('aria-label',model+' 시그널 플로우 크게 보기');
  const close=h('button','pg-btn cable-flow-close','닫기'); close.type='button'; close.addEventListener('click',()=>dialog.close()); dialog.append(close);
  for(const pic of pictures)dialog.append(pic.cloneNode(true)); zoom.addEventListener('click',()=>dialog.showModal()); dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();}); host.append(zoom,dialog);
  return host;
}
// W-20261016-001: end INOGENI connection diagrams.
