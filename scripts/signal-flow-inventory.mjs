// Read-only assessment of existing public data and repository PDF copies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDisplayProduct } from '../prototype/brc-am7/detail-enhancements.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),site=path.join(root,'beta/site');
const manifest=JSON.parse(fs.readFileSync(path.join(site,'docs/manifest.json')));
const rows=[];
const exact={
  'Video Processor':'video-processor','Video Wall Controller':'video-processor',Hub:'conferencing','Audio Interface':'audio-interface','Audio Processor':'audio-dsp','Input/Output Card':'processor-card','Network Bridge':'network-bridge',Camera:'camera','Camera Controller':'camera-controller',Amplifier:'amplifier-channel',Microphone:'microphone','Conference System':'conferencing',Speakerphone:'conferencing',Loudspeaker:'loudspeaker',Subwoofer:'loudspeaker','디지털 믹싱 콘솔':'mixer',Mixer:'mixer','Control Interface':'control','Signal Switcher':'switcher',Converter:'converter','Network Switch':'network-switch','Power Supply Module':'power','Video Processor Card':'processor-card',Extender:'extender',Recorder:'recorder','멀티채널 레코더/플레이어':'recorder','네트워크 마이크로폰':'microphone','Conferencing Endpoint':'conferencing','네트워크 기기':'wireless-microphone','Control Processor':'control','Power Supply':'power','Network Extender':'network-bridge','Wireless Microphone System':'wireless-microphone','올인원 비디오 바':'conferencing','Video Conferencing System':'conferencing','Control Console':'camera-controller','Power Conditioner':'power',Antenna:'rf-distribution','Control Panel':'control','Router Module':'processor-card','Router Frame':'matrix','Video Capture':'recorder','Touch Panel':'control'
};
export function classify(product){
  if(isDisplayProduct(product))return {type:'display',reason:'디스플레이 category · 03 연결 단자 유지'};
  const leaf=product.categories.at(-1);
  if(leaf==='Accessory'||leaf==='Cable'){
    if(/antenna distribution/i.test(product.english))return {type:'rf-distribution',reason:'Accessory이나 기존 영문 설명에 Antenna Distribution 명시'};
    return {type:'no-flow-candidate',reason:leaf==='Cable'?'케이블 · 능동 처리 유무 확인 및 제외 승인 대기':'장착 액세서리 · 신호 처리 없음 후보, 제외 승인 대기'};
  }
  if(!exact[leaf])throw Error('Unmapped category '+JSON.stringify(product.categories));
  return {type:exact[leaf],reason:`category: ${leaf}`};
}
const good=r=>['VERIFIED','FOUND'].includes(r.verification);
for(const name of fs.readdirSync(path.join(site,'detail/data')).filter(n=>n.endsWith('.json'))){
  const slug=name.slice(0,-5),p=JSON.parse(fs.readFileSync(path.join(site,'detail/data',name))),classification=classify(p);
  const urls=new Set([...p.documents,...p.sources].map(d=>d.url).filter(Boolean));
  const files=[...manifest.mirrors.filter(m=>urls.has(m.url)).map(m=>'docs/'+m.file),...manifest.uploads.filter(m=>m.slug===slug).map(m=>m.file)];
  const pdfs=[...new Set(files)].filter(f=>fs.existsSync(path.join(site,f))&&fs.readFileSync(path.join(site,f)).subarray(0,5).toString()==='%PDF-');
  const verifiedIO=p.io.filter(good),verifiedSpecs=p.specifications.filter(good);
  const input=verifiedIO.filter(r=>/\bIN\b|입력|양방향|BIDIRECTIONAL/i.test(r.direction||'')),output=verifiedIO.filter(r=>/\bOUT\b|출력|양방향|BIDIRECTIONAL/i.test(r.direction||''));
  const processingSpecs=verifiedSpecs.filter(r=>/처리|믹스|믹싱|분배|라우팅|매트릭스|스위칭|증폭|변환|수신|송신|dsp|mix|routing|matrix|switch|amplif|convert|receiv|transmi|poe/i.test([r.name,r.value].join(' ')));
  const available=input.length>0&&output.length>0&&processingSpecs.length>0;
  const feasibility=classification.type==='no-flow-candidate'?'자료 부족':available?'가능':(pdfs.length||verifiedIO.length||verifiedSpecs.length)?'일부':'자료 부족';
  rows.push({slug,manufacturer:p.manufacturer,model:p.model,categories:p.categories,...classification,pdfs,feasibility,
    verifiedIO:verifiedIO.length,totalIO:p.io.length,verifiedSpecs:verifiedSpecs.length,inputRows:input.length,outputRows:output.length,
    processingEvidence:processingSpecs.map(r=>`specifications[${p.specifications.indexOf(r)}]: ${r.name} = ${r.value}`),
    remaining:classification.type==='display'?'Signal Flow 제외 · 연결 단자 유지':classification.type==='no-flow-candidate'?'사용자 제외 결정 필요. 현재 기능·표시 유지':available?'기존 검증값으로 기본 흐름 작성 가능. 처리/분기별 근거 대조와 PDF 쪽 번호 검토는 데이터 PR에서 수행':pdfs.length?'PDF 사본 있음. 처리 단계·정확한 모델 적용·쪽 번호 독해 필요':'기존 검증값 일부 사용 가능. 처리·분기 근거 또는 PDF 사본 부족'});
}
const nonDisplay=rows.filter(r=>r.type!=='display'),displays=rows.filter(r=>r.type==='display');
if(rows.length!==240||nonDisplay.length!==202||displays.length!==38)throw Error('Inventory scope changed');
const count=(values,key)=>values.reduce((a,r)=>(a[r[key]]=(a[r[key]]||0)+1,a),{});
const report={basis:'3c6fc047888cc2f7528e078a9b7b99633a5e3be5',total:rows.length,nonDisplay:202,display:38,types:count(nonDisplay,'type'),feasibility:count(nonDisplay,'feasibility'),withPDF:nonDisplay.filter(r=>r.pdfs.length).length,noFlowCandidates:nonDisplay.filter(r=>r.type==='no-flow-candidate').map(r=>r.slug),rows};
const out=path.join(root,'Work/기록/W-20261001-001-Signal-Flow-자료현황.json');
const rendered=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check')){if(fs.readFileSync(out,'utf8')!==rendered)throw Error('Inventory needs regeneration');}
else fs.writeFileSync(out,rendered);
const safe=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
const table=nonDisplay.map(r=>`| ${safe(r.manufacturer)} | ${safe(r.model)} | ${r.type} | ${r.pdfs.length? r.pdfs.map(f=>'`'+f+'`').join('<br>'):'없음'} | ${r.feasibility} | ${r.inputRows}/${r.outputRows}; 처리 ${r.processingEvidence.length} | ${r.remaining} |`).join('\n');
const md=`# W-20261001-001 — Signal Flow 202종 대응표\n\n기준 main: \`${report.basis}\`. 현재 240종 = 디스플레이 38 + 비디스플레이 202. 기존 categories를 보존하고 작업용 유형만 대응했다. 이 보고서는 제품 JSON 변경이나 제외 승인이 아니다.\n\n## 판정 방법과 한계\n\n- PDF 보유는 documents/sources URL과 저장소 문서 사본 등록부를 정확히 대조하고 실제 파일의 PDF 서명을 확인한 결과다. 이름이 다른 공용 시리즈 PDF도 URL이 같으면 표시한다. PDF 존재는 해당 모델 적용과 페이지 검토 완료를 뜻하지 않는다.\n- **가능**: 기존 VERIFIED/FOUND 사양에서 처리 기능을 확인하고, 검증된 입력 및 출력 I/O 행이 모두 있어 기본 그림을 작성할 수 있다. 모든 확장 기능 완성을 보증하지 않는다.\n- **일부**: 일부 검증값 또는 PDF 사본이 있지만 처리 단계/방향 근거가 더 필요하다. PDF를 모두 새로 독해한 판정이 아니다.\n- **자료 부족**: 검증된 기술값·PDF가 없거나 신호 처리 없는 후보여서 사용자 결정이 필요하다.\n- IN/OUT 집계는 **행 수**다. 물리 포트/채널 수로 변환하지 않았다. CONFLICTED/REVIEW REQUIRED/PARTIAL 행은 가능 판정에 사용하지 않았다.\n- 케이블·장착물 후보를 제외하지 않았다. 능동 USB 케이블도 처리 구조 확인 후 결정해야 한다. 안테나 분배 Accessory 2종은 RF 분배로 분류했다.\n\n## 집계\n\nPDF 사본 있음 ${report.withPDF} / 없음 ${202-report.withPDF}. 가능 ${report.feasibility['가능']||0} / 일부 ${report.feasibility['일부']||0} / 자료 부족 ${report.feasibility['자료 부족']||0}.\n\n| 유형 | 제품 수 |\n|---|---:|\n${Object.entries(report.types).map(([t,n])=>`| ${t} | ${n} |`).join('\n')}\n\n유형은 소프트웨어가 추론한 기술 사실이 아니라 다음 데이터 작성 작업의 분류다. 현재 제조사 목록에 없는 분배기 유형도 RTCOM 등 향후 범위를 위한 fixture로만 검증한다.\n\n## 흐름 없음 후보 — 사용자 승인 대기\n\n${nonDisplay.filter(r=>r.type==='no-flow-candidate').map(r=>`- ${r.manufacturer} ${r.model}: ${r.reason}`).join('\n')}\n\n## 비디스플레이 202종\n\n| 제조사 | 모델 | 제안 유형 | PDF 사본 (저장소 상대 경로) | 작성 가능성 | 검증 I/O 입력/출력 행; 처리 사양 행 | 남은 확인 |\n|---|---|---|---|---|---|---|\n${table}\n\n## 디스플레이 38종 — 03 연결 단자 유지\n\n${displays.map(r=>`- ${r.manufacturer} ${r.model}`).join('\n')}\n\n## 2단계 제안만\n\n먼저 시범 5종 검토를 끝낸 뒤, 처리 근거가 이미 있는 제품 → PDF 독해 필요 제품 → 자료 부족 순으로 제조사별 작은 PR을 권장한다. 후보 제외는 사용자 결정 후 진행한다. 이번 PR에서는 시범 데이터·2단계·3단계를 시작하지 않는다.\n`;
const mdPath=out.replace('.json','.md');if(process.argv.includes('--check')){if(fs.readFileSync(mdPath,'utf8')!==md)throw Error('Inventory markdown stale');}else fs.writeFileSync(mdPath,md);
console.log(JSON.stringify({...report,rows:undefined},null,2));
