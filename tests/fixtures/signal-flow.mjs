// Synthetic UI cases only. Never register these as real products.
import { readFileSync } from 'node:fs';
export const scenarios = {
  matrix: ['매트릭스', ['영상 IN A', '영상 IN B'], [['matrix', '출력별 독립 선택']], ['영상 OUT A', '영상 OUT B'], 'video'],
  switcher: ['스위처', ['영상 IN A', '영상 IN B'], [['select', '입력 선택']], ['선택 영상 OUT'], 'video'],
  distribution: ['분배기', ['영상 IN'], [['split', '동일 신호 분배']], ['영상 OUT A', '영상 OUT B', '영상 OUT C'], 'video'],
  extender: ['익스텐더 TX/RX', ['소스 신호'], [['encode', 'TX · 전송 변환'], ['decode', 'RX · 신호 복원']], ['수신 신호'], 'optical'],
  converter: ['컨버터', ['규격 A 입력'], [['convert', 'A → B 변환']], ['규격 B 출력'], 'video'],
  'video-processor': ['영상 프로세서·멀티뷰', ['영상 A', '영상 B'], [['scale', '화면 합성·스케일링']], ['합성 화면'], 'video'],
  'processor-card': ['프레임 장착 카드', ['외부 입력'], [['module', '카드 인터페이스'], ['bridge', '프레임 내부 연결']], ['백플레인 신호'], 'video'],
  recorder: ['레코더·캡처', ['영상 입력'], [['capture', '신호 수집'], ['record', '인코딩·기록']], ['기록 매체'], 'video'],
  camera: ['카메라', ['빛·피사체'], [['sense', '센서'], ['encode', '영상 처리']], ['영상 출력'], 'video'],
  'camera-controller': ['카메라 컨트롤러', ['조작 입력'], [['control', '명령 생성']], ['카메라 제어'], 'control'],
  'amplifier-channel': ['채널 앰프', ['오디오 CH A', '오디오 CH B'], [['amplify', '채널별 증폭']], ['스피커 CH A', '스피커 CH B'], 'audio'],
  'audio-dsp': ['오디오 DSP', ['오디오 입력'], [['dsp', '필터·지연 처리']], ['처리 오디오'], 'audio'],
  mixer: ['믹서', ['입력 CH A', '입력 CH B', '입력 CH C'], [['mix', '채널 믹싱·버스']], ['Mix Bus'], 'audio'],
  'audio-interface': ['오디오 인터페이스', ['아날로그 오디오'], [['convert', 'A/D 변환']], ['디지털 오디오'], 'audio'],
  'network-bridge': ['네트워크 오디오 브리지', ['네트워크 A'], [['bridge', '오디오 전송망 연결']], ['네트워크 B'], 'network'],
  'wireless-microphone': ['무선 마이크 시스템', ['송신 오디오'], [['encode', '송신기'], ['rf', 'RF 수신·복조']], ['수신기 오디오'], 'rf'],
  'rf-distribution': ['안테나·RF 분배', ['안테나 RF'], [['split', 'RF 분배']], ['수신기 A', '수신기 B'], 'rf'],
  loudspeaker: ['스피커·서브우퍼', ['전기 오디오'], [['transduce', '전기 → 음향 변환']], ['음향 출력'], 'acoustic'],
  microphone: ['마이크', ['음향 입력'], [['transduce', '음향 → 전기 변환']], ['오디오 출력'], 'audio'],
  conferencing: ['화상회의', ['카메라', '마이크'], [['conference', '회의 신호 처리']], ['USB · PC', '스피커'], 'usb'],
  'network-switch': ['네트워크 스위치', ['네트워크 포트 A'], [['switch', '패킷·VLAN 처리']], ['네트워크 포트 B'], 'network'],
  control: ['제어 프로세서·터치 패널', ['터치·이벤트'], [['control', '제어 로직']], ['장비 제어'], 'control'],
  power: ['전원 장치·컨디셔너', ['AC 전원'], [['power', '전원 변환·분배']], ['DC 부하 A', 'DC 부하 B'], 'power']
};
export function fixtureProduct(type) {
  const [title, ins, stages, outs, signal] = scenarios[type], evidence = [{kind:'io',index:0}];
  const inputs = ins.map((label,i)=>({id:`in-${i}`,label,signal,evidence}));
  const outputs = outs.map((label,i)=>({id:`out-${i}`,label,signal,evidence}));
  const processes = stages.map(([kind,label],i)=>({id:`p-${i}`,kind,label,caption:'설명용 구성',evidence}));
  const connections = inputs.map(n=>({from:n.id,to:processes[0].id,signal,evidence}));
  for(let i=1;i<processes.length;i++) connections.push({from:processes[i-1].id,to:processes[i].id,signal,evidence});
  for(const n of outputs) connections.push({from:processes.at(-1).id,to:n.id,signal,evidence});
  if(type==='matrix') processes[0].crosspoints={inputs:inputs.map(n=>n.id),outputs:outputs.map(n=>n.id),examples:outputs.map((n,i)=>({input:inputs[i%inputs.length].id,output:n.id}))};
  const auxiliary=[];
  const aux=(id,label,sig,edgeLabel,direction='forward')=>{outputs.push({id,label,signal:sig,group:'aux',evidence});auxiliary.push({from:processes.at(-1).id,to:id,signal:sig,label:edgeLabel,direction,evidence});};
  if(['network-switch','power','processor-card'].includes(type))aux('power-out','PoE / 전원','power','급전 경로');
  if(['conferencing','camera','extender','control'].includes(type))aux('control','제어 장비','control','제어 신호','both');
  if(['amplifier-channel','mixer','network-bridge','audio-dsp'].includes(type))aux('net-audio','Dante / AES67','network','네트워크 오디오','both');
  if(type==='video-processor')aux('audio-out','오디오 출력','audio','오디오 추출');
  return {model:`${title} · 검증용`,categories:['TEST'],specifications:[],io:[{connector:'fixture',signal:'설명용 합성 데이터',verification:'VERIFIED'}],sources:[],signalFlow:{
    type,description:`${title} 유형의 설명용 그림입니다. 실제 제품 데이터가 아닙니다.`,inputs,outputs,processes,connections,auxiliary,
    groups:auxiliary.length?[{id:'aux',label:'보조 경로',caption:'지원 여부는 제품별 근거 필요',evidence}]:[],
    legend:[...new Set([signal,...auxiliary.map(e=>e.signal)])].map(signal=>({signal,label:signal})),notes:['유형 UI 검증용. 이 구성과 사양을 실제 제품에 자동 적용하지 않습니다.']
  }};
}
export function qmsFixture() {
  const p=JSON.parse(readFileSync(new URL('../../beta/site/rtcom/raw/products/qms-88ux.json',import.meta.url)));
  const e=index=>[{kind:'io',index}], spec=index=>[{kind:'spec',index}];
  const inputs=Array.from({length:8},(_,i)=>({id:`in-${i+1}`,label:`HDMI IN ${i+1}`,signal:'video',evidence:e(0)}));
  const outputs=Array.from({length:8},(_,i)=>({id:`out-${i+1}`,label:`OUT ${i+1}`,tag:String(i+1),signal:'video',group:'matrix-out',evidence:e(1)}));
  outputs.push(...[9,10].map(i=>({id:`out-${i}`,label:`OUT ${i}`,signal:'video',group:'multiview',evidence:e(1)})),{id:'audio',label:'AUDIO OUT',signal:'audio',caption:'QD1 · QD2',group:'audio-out',evidence:e(2)});
  p.signalFlow={
    type:'matrix',description:'HDMI 입력 1–8을 출력 1–8에 독립 선택합니다. 9·10번은 멀티뷰 분기, AUDIO OUT은 오디오 추출입니다. 격자의 점은 선택 예시이며 현재 설정이 아닙니다.',inputs,outputs,
    processes:[{id:'matrix',kind:'matrix',label:'매트릭스',caption:'출력마다 입력 선택',evidence:spec(1),crosspoints:{inputs:inputs.map(n=>n.id),outputs:outputs.slice(0,8).map(n=>n.id),examples:outputs.slice(0,8).map((n,i)=>({input:`in-${i===7?2:(i*5+1)%8+1}`,output:n.id}))}}],
    connections:[...inputs.map(n=>({from:n.id,to:'matrix',signal:'video',evidence:e(0)})),...outputs.slice(0,8).map(n=>({from:'matrix',to:n.id,signal:'video',evidence:e(1)}))],
    auxiliary:[...[9,10].map(i=>({from:'matrix',to:`out-${i}`,signal:'video',label:'멀티뷰',evidence:e(1)})),{from:'matrix',to:'audio',signal:'audio',label:'추출',evidence:e(2)}],
    groups:[{id:'matrix-out',label:'OUT 1–8',caption:'출력마다 입력 선택',evidence:spec(1)},{id:'multiview',label:'멀티뷰 9·10',caption:'각 4분할 또는 8분할',evidence:e(1)},{id:'audio-out',label:'오디오 추출',caption:'QD1: IN 1–4 / QD2: IN 5–8 중 선택',evidence:e(2)}],
    band:{label:'4K/60 @ 4:4:4',detail:'HDMI 2.0 · HDCP 2.2',evidence:[...spec(2),...spec(4),...spec(5)]},
    legend:[{signal:'video',label:'영상'},{signal:'audio',label:'오디오 추출'}],notes:['기존 RTCOM 원본·매뉴얼 기록의 비교 fixture. 공개 데이터나 어댑터에는 연결하지 않습니다.']
  };
  return p;
}
