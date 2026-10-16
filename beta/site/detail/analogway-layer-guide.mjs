import {modelData, exampleConfigurations, guideEvidence} from './analogway-layer-guide-data.mjs';
export {modelData, exampleConfigurations};

const RESOURCE_NOTES = {
  aquilon:'Aquilon: VPU 하나마다 소스·출력 링크 8개. 용량 2 믹싱 레이어는 소스 링크 2개, 분할 레이어는 1개를 사용합니다. AUX 출력은 처리 자원을 쓰지 않습니다. 화면 하나는 하나의 VPU 안에 들어가야 한다는 가정으로 계산합니다.',
  alta:'Alta 4K: 믹싱 레이어 1개 또는 분할 레이어 2개가 레이어 자원 1개입니다. 출력 경계를 넘는 추가 비용은 공식 자료에서 미확인입니다.',
  midra:'Midra 4K: Mixer·Matrix·Blend 모드별 고정 구성을 적용합니다. 문서에 적힌 모드 이외의 조합은 지원 불가로 표시합니다.',
};

const validInteger = (value,min,max) => Number.isInteger(value) && value >= min && value <= max;
const layerResourceCount = screen => screen.layerType === 'mixing' ? screen.layers : Math.ceil(screen.layers / 2);
const unique = values => [...new Set(values)];

function checkInput(input) {
  if (!input || !Array.isArray(input.screens) || input.screens.length < 1 || input.screens.length > 8 ||
      !validInteger(input.auxOutputs,0,999) || !validInteger(input.inputs4k,0,999)) return '입력값을 확인해 주세요.';
  for (const screen of input.screens) {
    if (!screen || !validInteger(screen.outputs,1,8) || !['mixing','split'].includes(screen.layerType) || !validInteger(screen.layers,0,8)) return '화면별 출력·레이어 입력값을 확인해 주세요.';
  }
  return '';
}

function firstFitAquilon(screens) {
  const bins=[]; const oversized=[];
  for (let index=0; index<screens.length; index++) {
    const screen=screens[index], outputLinks=screen.outputs*2;
    const sourceLinks=screen.layerType === 'mixing' ? screen.layers*2 : screen.layers;
    if (outputLinks>8 || sourceLinks>8) { oversized.push({screen:index+1,outputLinks,sourceLinks}); continue; }
    let bin=bins.find(item=>item.outputLinks+outputLinks<=8 && item.sourceLinks+sourceLinks<=8);
    if (!bin) { bin={outputLinks:0,sourceLinks:0,screens:[]}; bins.push(bin); }
    bin.outputLinks+=outputLinks; bin.sourceLinks+=sourceLinks; bin.screens.push(index+1);
  }
  return {bins,oversized,totalSourceLinks:screens.reduce((sum,s)=>sum+(s.layerType==='mixing'?s.layers*2:s.layers),0),totalOutputLinks:screens.reduce((sum,s)=>sum+s.outputs*2,0)};
}

function evaluateAquilon(model,input,pgmOutputs) {
  const reasons=[]; const fit=firstFitAquilon(input.screens);
  const layers=input.screens.reduce((sum,s)=>sum+s.layers,0);
  if (fit.oversized.length) reasons.push(`한 화면에 소스 링크 ${Math.max(...fit.oversized.map(x=>x.sourceLinks))}개 또는 출력 링크 ${Math.max(...fit.oversized.map(x=>x.outputLinks))}개가 필요합니다. VPU 1개당 각 8개 한도를 넘는 화면은 배분 규칙이 미확인입니다.`);
  if (fit.bins.length>model.processingUnits) reasons.push(`화면별 first-fit 배분에 VPU ${fit.bins.length}개가 필요하지만 보유 VPU는 ${model.processingUnits}개입니다 (총 소스 링크 ${fit.totalSourceLinks}/${model.processingUnits*8}).`);
  if (pgmOutputs>model.pgmOutputs) reasons.push(`4K PGM 출력 ${pgmOutputs}개가 한도 ${model.pgmOutputs}개를 넘습니다.`);
  if (pgmOutputs+input.auxOutputs>model.outputConnectors) reasons.push(`PGM+보조 출력 ${pgmOutputs+input.auxOutputs}개가 출력 커넥터 ${model.outputConnectors}개를 넘습니다.`);
  if (input.inputs4k>model.inputs4k) reasons.push(`4K 입력 ${input.inputs4k}개가 한도 ${model.inputs4k}개를 넘습니다.`);
  const modes=unique(input.screens.filter(s=>s.outputs>=3&&s.layers>0).map(()=> 'Optimized mode · 4K 전용'));
  return {possible:reasons.length===0,reasons,mode:modes.join(', ')||'VPU first-fit',used:{screens:input.screens.length,pgmOutputs,auxOutputs:input.auxOutputs,inputs4k:input.inputs4k,processingUnits:fit.bins.length,sourceLinks:fit.totalSourceLinks,outputLinks:fit.totalOutputLinks,layers},remaining:{pgmOutputs:Math.max(0,model.pgmOutputs-pgmOutputs),outputConnectors:Math.max(0,model.outputConnectors-pgmOutputs-input.auxOutputs),inputs4k:Math.max(0,model.inputs4k-input.inputs4k),processingUnits:Math.max(0,model.processingUnits-fit.bins.length),sourceLinks:Math.max(0,model.processingUnits*8-fit.totalSourceLinks),outputLinks:Math.max(0,model.processingUnits*8-fit.totalOutputLinks)}};
}

function evaluateAlta(model,input,pgmOutputs) {
  const reasons=[]; const resources=input.screens.reduce((sum,s)=>sum+layerResourceCount(s),0);
  const maxOutputsPerScreen=model.pgmScreens;
  if (input.screens.length>model.pgmScreens) reasons.push(`프로그램 화면 ${input.screens.length}개가 한도 ${model.pgmScreens}개를 넘습니다.`);
  if (input.screens.some(s=>s.outputs>maxOutputsPerScreen)) reasons.push(`한 화면의 출력 수가 ${maxOutputsPerScreen}개 한도를 넘습니다.`);
  if (pgmOutputs>model.pgmOutputs) reasons.push(`4K PGM 출력 ${pgmOutputs}개가 한도 ${model.pgmOutputs}개를 넘습니다.`);
  if (resources>model.mixingLayers) reasons.push(`레이어 자원 ${resources}개가 한도 ${model.mixingLayers}개를 넘습니다.`);
  if (input.auxOutputs>model.auxOutputs) reasons.push(`보조 출력 ${input.auxOutputs}개가 한도 ${model.auxOutputs}개를 넘습니다.`);
  if (pgmOutputs+input.auxOutputs>model.outputConnectors) reasons.push(`PGM+보조 출력 ${pgmOutputs+input.auxOutputs}개가 출력 커넥터 ${model.outputConnectors}개를 넘습니다.`);
  if (input.inputs4k>model.inputs4k) reasons.push(`4K 입력 ${input.inputs4k}개가 한도 ${model.inputs4k}개를 넘습니다.`);
  return {possible:reasons.length===0,reasons,mode:'Alta 4K · 공유 레이어 자원',used:{screens:input.screens.length,pgmOutputs,auxOutputs:input.auxOutputs,inputs4k:input.inputs4k,layerResources:resources,mixingLayers:input.screens.filter(s=>s.layerType==='mixing').reduce((n,s)=>n+s.layers,0),splitLayers:input.screens.filter(s=>s.layerType==='split').reduce((n,s)=>n+s.layers,0)},remaining:{pgmScreens:Math.max(0,model.pgmScreens-input.screens.length),pgmOutputs:Math.max(0,model.pgmOutputs-pgmOutputs),auxOutputs:Math.max(0,model.auxOutputs-input.auxOutputs),outputConnectors:Math.max(0,model.outputConnectors-pgmOutputs-input.auxOutputs),inputs4k:Math.max(0,model.inputs4k-input.inputs4k),layerResources:Math.max(0,model.mixingLayers-resources)}};
}

function evaluateMidra(model,input,pgmOutputs) {
  const reasons=[]; let mode='';
  const layerFits=(screen,maxMix,maxSplit)=>screen.layers <= (screen.layerType==='mixing'?maxMix:maxSplit);
  const screens=input.screens;
  if (screens.length===1 && screens[0].outputs===1) {
    mode='Mixer';
    if (!layerFits(screens[0],2,4)) reasons.push('Mixer 모드는 믹싱 2개 또는 분할 4개까지입니다.');
    if (input.auxOutputs>1) reasons.push('Mixer 모드는 1080p 보조 출력 1개까지입니다.');
  } else if (screens.length===2 && screens.every(s=>s.outputs===1)) {
    mode='Matrix';
    if (input.auxOutputs>0) reasons.push('Matrix 모드에는 보조 출력이 없습니다.');
    screens.forEach((screen,index)=>{if(!layerFits(screen,1,2))reasons.push(`Matrix 화면 ${index+1}은 믹싱 1개 또는 분할 2개까지입니다.`);});
  } else if (screens.length===1 && screens[0].outputs===2 && model.slug==='eikos-4k') {
    mode='Blend';
    if (!layerFits(screens[0],2,4)) reasons.push('Blend 모드는 믹싱 2개 또는 분할 4개까지입니다.');
    if (input.auxOutputs>0) reasons.push('Blend 모드에는 보조 출력이 없습니다.');
  } else {
    reasons.push(model.slug==='pulse-4k'&&screens.length===1&&screens[0].outputs===2?'Pulse 4K는 두 출력 블렌딩 모드를 지원하지 않습니다.':'선택한 화면 수·출력 구성에 해당하는 Midra Mixer·Matrix·Blend 모드가 공식 자료에 없습니다.');
  }
  if (input.inputs4k>model.inputs4k) reasons.push(`4K 입력 ${input.inputs4k}개가 한도 ${model.inputs4k}개를 넘습니다.`);
  if (pgmOutputs>model.pgmOutputs) reasons.push(`4K PGM 출력 ${pgmOutputs}개가 한도 ${model.pgmOutputs}개를 넘습니다.`);
  const totalLayers=screens.reduce((sum,s)=>sum+s.layers,0);
  const mixOrSplitLayers=screens.reduce((sum,s)=>sum+(s.layerType==='mixing'?s.layers:Math.ceil(s.layers/2)),0);
  return {possible:reasons.length===0,reasons,mode,used:{screens:screens.length,pgmOutputs,auxOutputs:input.auxOutputs,inputs4k:input.inputs4k,mixingLayers:screens.filter(s=>s.layerType==='mixing').reduce((n,s)=>n+s.layers,0),splitLayers:screens.filter(s=>s.layerType==='split').reduce((n,s)=>n+s.layers,0),mixOrSplitLayers},remaining:{pgmOutputs:Math.max(0,model.pgmOutputs-pgmOutputs),auxOutputs:Math.max(0,model.auxOutputs-input.auxOutputs),inputs4k:Math.max(0,model.inputs4k-input.inputs4k),mixOrSplitLayers:Math.max(0,model.mixingLayers-mixOrSplitLayers)}};
}

export function calculateRecommendations(input) {
  const invalid=checkInput(input);
  if (invalid) return {valid:false,error:invalid,recommendedModel:null,models:modelData.map(m=>({slug:m.slug,name:m.name,possible:false,recommended:false,reasons:[invalid],mode:'',used:{},remaining:{}}))};
  const pgmOutputs=input.screens.reduce((sum,s)=>sum+s.outputs,0);
  const models=modelData.map(model=>{
    const evaluated=model.platform==='aquilon'?evaluateAquilon(model,input,pgmOutputs):model.platform==='alta'?evaluateAlta(model,input,pgmOutputs):evaluateMidra(model,input,pgmOutputs);
    return {slug:model.slug,name:model.name,platform:model.platform,...evaluated,recommended:false};
  });
  const recommended=models.find(item=>item.possible);
  if(recommended) recommended.recommended=true;
  return {valid:true,models,recommendedModel:recommended?.slug??null,pgmOutputs,auxOutputs:input.auxOutputs,inputs4k:input.inputs4k,notes:Object.values(RESOURCE_NOTES)};
}

const makeElement=(tag,className='',content)=>{
  const item=document.createElement(tag); item.className=className;
  if(content!==undefined)item.textContent=String(content);
  return item;
};
const inputTopologies=[
  {value:'1',outputs:1,label:'화면 1개 · 출력 1개'},
  {value:'2x1',outputs:2,label:'화면 1개 · 출력 2개 (2×1)'},
  {value:'1x2',outputs:2,label:'화면 1개 · 출력 2개 (1×2)'},
  {value:'3',outputs:3,label:'화면 1개 · 출력 3개'},
  {value:'2x2',outputs:4,label:'화면 1개 · 출력 4개 (2×2)'},
];

function readScreenInputs(container){
  return [...container.querySelectorAll('.aw-guide-screen-row')].map(row=>({
    layout:row.querySelector('[data-field="layout"]').value,
    outputs:Number(row.querySelector('[data-field="layout"] option:checked').dataset.outputs),
    layerType:row.querySelector('[data-field="layerType"]').value,
    layers:Number(row.querySelector('[data-field="layers"]').value),
  }));
}

function renderModelResult(result,currentSlug){
  const list=makeElement('div','aw-guide-result-list');
  const sorted=[...result.models].sort((a,b)=>Number(b.recommended)-Number(a.recommended));
  for(const model of sorted){
    const card=makeElement('article','aw-guide-model'+(model.recommended?' is-recommended':'')+(model.slug===currentSlug?' is-current':''));
    const head=makeElement('div','aw-guide-model-heading');
    head.append(makeElement('h4','',model.name));
    if(model.recommended)head.append(makeElement('span','aw-guide-recommend-badge','추천 모델'));
    if(model.slug===currentSlug)head.append(makeElement('span','aw-guide-current-badge','현재 제품'));
    card.append(head);
    card.append(makeElement('p',model.possible?'aw-guide-status is-possible':'aw-guide-status is-impossible',model.possible?`가능 · ${model.mode}`:'구성 불가'));
    if(model.reasons.length){
      const reasons=makeElement('ul','aw-guide-reasons');
      for(const reason of model.reasons)reasons.append(makeElement('li','',reason));
      card.append(reasons);
    }
    const details=makeElement('details','aw-guide-resource-details');
    details.append(makeElement('summary','','사용 자원과 남는 한도'));
    const metrics=makeElement('dl','aw-guide-resource-metrics');
    const names={screens:'화면',pgmOutputs:'4K PGM 출력',auxOutputs:'보조 출력',inputs4k:'4K 입력',processingUnits:'사용 VPU',sourceLinks:'소스 링크',outputLinks:'출력 링크',layerResources:'레이어 자원',mixingLayers:'믹싱 레이어',splitLayers:'분할 레이어',mixOrSplitLayers:'믹싱/분할 자원',pgmScreens:'PGM 화면',outputConnectors:'출력 커넥터'};
    const keys=Object.keys(model.used).filter(key=>names[key]);
    for(const key of keys){
      const row=makeElement('div','aw-guide-resource-row');
      row.append(makeElement('dt','',names[key]),makeElement('dd','',`${model.used[key]} 사용`));
      if(model.remaining[key]!==undefined)row.append(makeElement('dd','aw-guide-remaining',`${model.remaining[key]} 남음`));
      metrics.append(row);
    }
    details.append(metrics); card.append(details); list.append(card);
  }
  return list;
}

export function renderAnalogWayLayerGuide(currentSlug){
  if(!modelData.some(item=>item.slug===currentSlug))return null;
  const section=makeElement('section','aw-layer-guide');
  section.id='analogway-layer-guide'; section.dataset.supplemental='';
  section.setAttribute('aria-labelledby','aw-layer-guide-title');
  const title=makeElement('h2','','화면·레이어 설계 가이드'); title.id='aw-layer-guide-title'; section.append(title);
  section.append(makeElement('p','aw-guide-intro','필요한 화면 구성과 레이어 수를 입력하면, 공식 문서에 적힌 구성 한도 안에서 가능한 Analog Way 모델을 비교합니다.'));
  const examples=makeElement('div','aw-guide-examples');
  examples.setAttribute('role','group'); examples.setAttribute('aria-label','구성 예시');
  for(const [key,config] of Object.entries(exampleConfigurations)){
    const button=makeElement('button','aw-guide-example',config.label); button.type='button'; button.dataset.example=key; examples.append(button);
  }
  section.append(examples);

  const form=makeElement('div','aw-guide-form');
  const screensPanel=makeElement('div','aw-guide-screens-panel');
  const screensTitle=makeElement('h3','','화면 구성'); screensPanel.append(screensTitle);
  const rows=makeElement('div','aw-guide-screen-rows'); rows.setAttribute('aria-label','구성할 화면 목록'); screensPanel.append(rows);
  const add=makeElement('button','aw-guide-add-screen','＋ 화면 추가'); add.type='button'; screensPanel.append(add);
  const globalPanel=makeElement('div','aw-guide-global-inputs');
  globalPanel.append(makeElement('h3','','전체 입력·보조 출력'));
  const auxLabel=makeElement('label','','보조 출력 수'); const auxInput=makeElement('input',''); auxInput.type='number'; auxInput.min='0'; auxInput.max='30'; auxInput.value='0'; auxInput.id='aw-guide-aux'; auxLabel.append(auxInput); globalPanel.append(auxLabel);
  const sourceLabel=makeElement('label','','4K 입력 소스 수'); const sourceInput=makeElement('input',''); sourceInput.type='number'; sourceInput.min='0'; sourceInput.max='32'; sourceInput.value='1'; sourceInput.id='aw-guide-input-count'; sourceLabel.append(sourceInput); globalPanel.append(sourceLabel);
  form.append(screensPanel,globalPanel); section.append(form);
  const summary=makeElement('div','aw-guide-summary'); summary.setAttribute('aria-live','polite'); summary.setAttribute('aria-atomic','true');
  const results=makeElement('div','aw-guide-results'); results.id='aw-guide-results'; results.setAttribute('aria-live','polite');
  section.append(summary,results);

  function getState(){return {screens:readScreenInputs(rows),auxOutputs:Number(auxInput.value),inputs4k:Number(sourceInput.value)};}
  function update(){
    const result=calculateRecommendations(getState());
    summary.replaceChildren();
    if(!result.valid){summary.append(makeElement('p','aw-guide-error',result.error));results.replaceChildren();return;}
    const recommended=result.models.find(item=>item.recommended);
    summary.append(makeElement('p',recommended?'aw-guide-recommendation':'aw-guide-no-recommendation',recommended?`추천: ${recommended.name} · 요청한 구성이 확인된 한도 안에 들어갑니다.`:'요청한 구성을 지원하는 모델을 찾지 못했습니다.'));
    results.replaceChildren(renderModelResult(result,currentSlug));
  }
  function renderRows(initial){
    rows.replaceChildren();
    initial.forEach((screen,index)=>{
      const fieldset=makeElement('fieldset','aw-guide-screen-row');
      fieldset.append(makeElement('legend','',`화면 ${index+1}`));
      const layoutLabel=makeElement('label','','출력 구성'); const layout=makeElement('select',''); layout.dataset.field='layout'; layout.setAttribute('aria-label',`화면 ${index+1} 출력 구성`);
      for(const choice of inputTopologies){const option=makeElement('option','',choice.label);option.value=choice.value;option.dataset.outputs=choice.outputs;layout.append(option);}
      const defaultLayout={1:'1',2:'2x1',3:'3',4:'2x2'}[screen.outputs];
      layout.value=screen.layout??defaultLayout; layoutLabel.append(layout); fieldset.append(layoutLabel);
      const typeLabel=makeElement('label','','레이어 방식'); const type=makeElement('select','');type.dataset.field='layerType';type.setAttribute('aria-label',`화면 ${index+1} 레이어 방식`);
      for(const [value,label] of [['mixing','믹싱 · 부드러운 전환'],['split','분할 · 컷 전환']]){const option=makeElement('option','',label);option.value=value;type.append(option);}type.value=screen.layerType;typeLabel.append(type);fieldset.append(typeLabel);
      const countLabel=makeElement('label','','레이어 수');const count=makeElement('input','');count.type='number';count.min='0';count.max='8';count.step='1';count.value=String(screen.layers);count.dataset.field='layers';count.setAttribute('aria-label',`화면 ${index+1} 레이어 수`);countLabel.append(count);fieldset.append(countLabel);
      const remove=makeElement('button','aw-guide-remove-screen','화면 삭제');remove.type='button';remove.disabled=initial.length<=1;remove.addEventListener('click',()=>{const next=readScreenInputs(rows);next.splice(index,1);renderRows(next);update();});fieldset.append(remove);
      fieldset.addEventListener('input',update);fieldset.addEventListener('change',update);rows.append(fieldset);
    });
    add.disabled=initial.length>=8;
  }
  renderRows([{outputs:1,layerType:'mixing',layers:1}]);
  add.addEventListener('click',()=>{const next=readScreenInputs(rows);if(next.length<8)next.push({outputs:1,layerType:'mixing',layers:1});renderRows(next);update();});
  auxInput.addEventListener('input',update);sourceInput.addEventListener('input',update);
  examples.addEventListener('click',event=>{
    const button=event.target.closest('button[data-example]');if(!button)return;
    const config=exampleConfigurations[button.dataset.example];renderRows(config.screens.map(screen=>({...screen})));
    auxInput.value=String(config.auxOutputs);sourceInput.value=String(config.inputs4k);update();
  });
  const notes=makeElement('details','aw-guide-notes');notes.append(makeElement('summary','','계산 기준과 미확인 사항'));
  const noteList=makeElement('ul','');
  for(const note of [
    'Aquilon은 용량 2의 4K60만 계산합니다. 1080p 용량 1 레이어를 섞을 때의 비용은 미확인입니다.',
    'Aquilon에서 한 화면의 링크를 VPU 여러 개에 나눌 수 있는지 미확인입니다. 계산기는 각 화면을 VPU 하나 안에 담는다고 가정합니다.',
    'Aquilon 화면이 5개 이상 출력 링크에 걸치고 용량 2 레이어를 쓰면 Optimized mode가 적용됩니다. 이 계산은 4K60만 사용해 추가 4링크 경계 비용을 더하지 않습니다.',
    'Aquilon AUX는 처리 자원을 쓰지 않지만, PGM과 AUX를 합친 출력 수는 모델의 출력 커넥터 수 이하여야 합니다.',
    'Alta 4K에서 레이어가 여러 출력에 걸칠 때 추가 자원은 미확인입니다. 공개된 믹싱/분할 자원 수만 계산합니다.',
    '수량·모드 한도에 대한 근거: Aquilon User Manual v6.2 61·66–69·79쪽, Aquilon 데이터시트 1·3쪽; Alta 4K User Manual 25·42–43·46·50·52쪽, 데이터시트 6쪽; Midra 4K User Manual 25·41–42·44쪽, 데이터시트 5–6쪽.',
  ])noteList.append(makeElement('li','',note));
  notes.append(noteList);
  const simulator=makeElement('p','aw-guide-simulator-note','계산 결과를 실제 장비 구성에 적용하기 전에 제조사 시뮬레이터에서 최종 확인하세요.');
  for(const item of guideEvidence.simulators){const link=makeElement('a','aw-guide-simulator-link',item.label);link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';simulator.append(document.createTextNode(' '),link);}
  notes.append(simulator);section.append(notes);
  update();
  return section;
}
