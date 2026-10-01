import { portMarkerPercent } from './detail-enhancements.mjs?v=w20261001-001-portmap';
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
    const box = image.getBoundingClientRect(), scale = box.width / image.naturalWidth;
    const top = item.side === 'top', sign = top ? -1 : 1;
    const y = (item.y ?? (top ? 0 : image.naturalHeight)) * scale;
    const x1 = item.x1 * scale, x2 = item.x2 * scale, cx = (x1+x2)/2;
    const bracket = svgNode('svg', {class:'port-map-bracket', width:box.width, height:box.height, 'aria-hidden':'true'});
    bracket.append(svgNode('path', {d:`M${x1} ${y-sign*4}V${y+sign*8}H${x2}V${y-sign*4}M${cx} ${y+sign*8}V${y+sign*16}`, fill:'none', stroke:'#2459b0', 'stroke-width':1.5}));
    const marker = el('span', 'port-map-marker', item.n);
    marker.style.left = `${span.left + span.width / 2}%`;
    marker.style.top = `${y + sign*28}px`;
    marker.dataset.side = item.side ?? 'bottom';
    overlay.append(bracket, marker);
  }
  return overlay;
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
const wrapText = (text, width) => {
  const lines=[];let line='',size=0;
  for(const char of String(text||'')) { const next=/[\u0000-\u00ff]/.test(char)?7:13;if(size+next>width&&line){lines.push(line);line='';size=0;}line+=char;size+=next; }
  if(line)lines.push(line);return lines;
};
export function renderSignalFlow(flow, model) {
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
    const lines=wrapText(label,width);lines.forEach((line,i)=>layer.append(svgNode('text',{x,y:y+i*18,'text-anchor':anchor,class:cls},line)));return lines.length*18;
  }
  function endpoints(items,x,width,side) {
    let y=54;
    const order=[...new Set(items.map(n=>n.group||''))];
    for(const id of order){
      const group=flow.groups.find(g=>g.id===id),ns=items.filter(n=>(n.group||'')===id);
      const start=y;const compact=side==='out'&&ns.length>1&&ns.every(n=>n.label.length<=12&&!n.caption),cols=compact?Math.min(3,ns.length,Math.max(1,Math.floor((width+10)/(Math.max(...ns.map(n=>Array.from(n.label).reduce((sum,c)=>sum+(/[\u0000-\u00ff]/.test(c)?7:13),0)))+24)))):1,cell=(width-(cols-1)*10)/cols;
      if(group)y+=text(nodeLayer,group.label,x+width/2,y+15,width,'flow-group-label')+10;
      for(let i=0;i<ns.length;i+=cols){
        const row=ns.slice(i,i+cols),heights=row.map(n=>Math.max(34,wrapText(n.label,cell-12).length*18+16)+(n.caption?wrapText(n.caption,cell-16).length*18+4:0)),h=Math.max(...heights);
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
    const labelH=wrapText(p.label,processW-24).length*18,captionH=wrapText(p.caption,processW-24).length*18;
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
  const drawEdge=(e,aux,index)=>{
    const a=positions.get(e.from),b=positions.get(e.to),color=!aux&&b.side==='out'?'#9658b4':signalColors[e.signal];
    let x1=a.x+a.w,y1=a.y+a.h/2,x2=b.x,y2=b.y+b.h/2,d;
    if(b.node.kind==='matrix'&&b.node.crosspoints.inputs.includes(e.from))y2=y1;
    if(a.side==='process'&&b.side==='process'){
      x1=a.x+a.w/2;y1=a.y+a.h;x2=b.x+b.w/2;y2=b.y;d=`M${x1} ${y1}L${x2} ${y2}`;
    }else if(flow.band&&a.side==='process'&&b.side==='out'){d=`M${x1} ${y1}H586C596 ${y1} 596 ${y2} ${x2} ${y2}`;
    }else{const rail=aux?550+index%4*8:(x1+x2)/2;d=`M${x1} ${y1}C${rail} ${y1} ${rail} ${y2} ${x2} ${y2}`;}
    lineLayer.append(svgNode('path',{d,class:`flow-edge${aux?' flow-auxiliary':''}`,stroke:color,'data-from':e.from,'data-to':e.to}));
    arrows(x2,y2,a.side==='process'&&b.side==='process'?90:0,color);
    if(e.direction==='both')arrows(x1,y1,a.side==='process'&&b.side==='process'?-90:180,color);
    // Route descriptions live in a reserved wrapping list below the canvas.
    // Long text must never overlay a node, band or another branch.
  };
  flow.connections.forEach((e,i)=>drawEdge(e,false,i));flow.auxiliary.forEach((e,i)=>drawEdge(e,true,i));
  const H=Math.max(leftBottom,rightBottom,processY)+12;
  if(flow.band){
    const first=positions.get(flow.processes[0].id);const y=first.y+first.h/2-5, x=438, w=148;
    nodeLayer.append(svgNode('rect',{x,y,width:w,height:10,rx:5,fill:`url(#${uid}-band)`}));
    const labelLines=wrapText(flow.band.label,w).length;text(nodeLayer,flow.band.label,x+w/2,y-12-(labelLines-1)*18,w,'flow-band-label');
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
