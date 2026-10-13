// 오디오 연결 판정(B-20261013-05). 오디오는 커넥터 모양이 아니라 신호의 성격으로 판단한다.
// 선을 물리는 단자(XLR·TRS·유로블록·RCA 등)끼리는 케이블 한 가닥으로 잇는 정상 결선이다. 커넥터 차이는 케이블 양 끝 처리 문제로 본다.
// 성별은 현장 관례를 따른다: 장비의 XLR 출력은 수(M)라 케이블 끝은 암(F), 입력은 암이라 케이블 끝은 수(M). 양방향 단자는 성별을 적지 않는다.
// CAPTIVE는 "커넥터 없음(무단말 케이블 직결)"이 섞인 묶음이라 케이블을 추천하지 않는다(기반명세 §2.8, 모르는 것을 다르다고 하지 않는다).
import { LEVEL_PAIRS } from './defaults.mjs';

const ANALOG = ['MIC-AUDIO', 'LINE-AUDIO'];

// short: 노드 배지·불평형 안내에 쓰는 약칭. cable: 추천 케이블 이름의 끝 표기. balanced: 평형 여부
const TERMINATIONS = {
  XLR: { short: 'XLR', balanced: true },
  'XLR-COMBO': { short: 'XLR/TRS', balanced: true },
  'MINI-XLR': { short: 'mXLR', cable: '미니 XLR', balanced: true },
  'TRS-6.3': { short: 'TRS', cable: 'TRS 6.3', speakerCable: '6.3mm', balanced: true },
  'TRS-3.5': { short: '3.5', cable: '3.5mm', balanced: false },
  RCA: { short: 'RCA', cable: 'RCA', balanced: false },
  'TERMINAL-BLOCK': { short: 'EB', cable: '유로블록 3P', speakerCable: '유로블록', balanced: true },
  'DSUB-25': { short: 'D25', cable: 'D-Sub 25 브레이크아웃', balanced: true },
  'DSUB-9': { short: 'D9', cable: 'D-Sub 9', balanced: true },
  SPEAKON: { short: 'NL4', cable: '스피콘' },
  'BINDING-POST': { short: 'BP', cable: '바인딩 포스트' },
  XLR4: { short: 'XLR4' },
  CAPTIVE: { short: '직결' },
  OPTICAL: { short: 'OPT' },
  BNC: { short: 'BNC' },
};

// 케이블 한 가닥으로 잇는 단자 묶음. 같은 묶음 안에서만 케이블을 추천한다. 묶음을 넘으면 기존 커넥터 규칙(변환 필요)을 따른다
// 디지털은 임피던스로 나눈다: AES3 평형 110Ω과 S/PDIF 동축 75Ω은 트랜스(발룬)가 있어야 이어진다
const FAMILIES = {
  analog: [['XLR', 'XLR-COMBO', 'MINI-XLR', 'TRS-6.3', 'TRS-3.5', 'RCA', 'TERMINAL-BLOCK', 'DSUB-25', 'DSUB-9']],
  digital: [['XLR', 'XLR-COMBO', 'TERMINAL-BLOCK', 'DSUB-25', 'DSUB-9'], ['RCA']],
  speaker: [['TERMINAL-BLOCK', 'SPEAKON', 'BINDING-POST', 'TRS-6.3']],
};
const SUFFIX = { AES3: 'AES 110Ω', SPDIF: 'S/PDIF 75Ω' };
const LEVEL_HINT = { 'MIC-AUDIO>LINE-AUDIO': '프리앰프 필요', 'LINE-AUDIO>MIC-AUDIO': '감쇠(패드) 필요' };

export function audioKind(signal) {
  if (ANALOG.includes(signal)) return 'analog';
  if (signal === 'AES3' || signal === 'SPDIF') return 'digital';
  if (signal === 'SPEAKER') return 'speaker';
  return null;
}

// 연결 신호(rules.connectionSignal과 같은 규칙). 엣지에 저장된 신호가 있으면 그것을 넘긴다
function defaultSignal(source, target, levelPairs = LEVEL_PAIRS) {
  const common = source.signals.find(signal => target.signals.includes(signal));
  if (common) return common;
  for (const a of source.signals) for (const b of target.signals) if (levelPairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return a;
  return null;
}

// 콤보 잭은 상대가 TRS면 TRS로, 아니면 XLR로 받는다
const resolveCombo = (connector, other) => (connector === 'XLR-COMBO' ? (other === 'TRS-6.3' ? 'TRS-6.3' : 'XLR') : connector);

function cableEnd(port, otherConnector, role, kind) {
  const connector = resolveCombo(port.connector, otherConnector);
  if (connector === 'XLR') return port.direction === 'both' ? 'XLR' : role === 'source' ? 'XLR(F)' : 'XLR(M)';
  const termination = TERMINATIONS[connector];
  return (kind === 'speaker' && termination.speakerCable) || termination.cable;
}

const familyOf = (kind, connector) => FAMILIES[kind].findIndex(family => family.includes(connector));

// 오디오 연결의 추천 케이블. 오디오가 아니거나 케이블 한 가닥으로 잇지 못하면 null
export function audioCable(source, target, signal = defaultSignal(source, target)) {
  const kind = audioKind(signal);
  if (!kind) return null;
  const family = familyOf(kind, source.connector);
  if (family < 0 || family !== familyOf(kind, target.connector)) return null;
  const ends = `${cableEnd(source, target.connector, 'source', kind)}–${cableEnd(target, source.connector, 'target', kind)}`;
  if (kind === 'speaker') return { kind, name: `${ends} 스피커 케이블` };
  if (kind === 'digital') return { kind, name: `${ends} ${SUFFIX[signal]}` };
  const balanced = TERMINATIONS[source.connector].balanced && TERMINATIONS[target.connector].balanced;
  return { kind, name: `${ends} ${balanced ? '평형' : '불평형'}`, balanced };
}

// 레벨 차이 경고의 detail. 오디오면 프리앰프·감쇠 안내를 붙인다(커넥터와 무관)
export function levelDetail(source, target, signal) {
  const to = target.signals.find(s => s !== signal && ANALOG.includes(s) && ANALOG.includes(signal)) ?? target.signals[0];
  const hint = LEVEL_HINT[`${signal}>${to}`];
  return `${signal} → ${to}${hint ? ` (${hint})` : ''}`;
}

// 같은 단자 계열인지(같은 약칭이거나 커넥터 호환 묶음). 다르면 케이블 양 끝이 다르다는 안내를 낸다
const sameTermination = (a, b, rules) => a === b
  || TERMINATIONS[a]?.short === TERMINATIONS[b]?.short
  || rules.connectorEquivalents.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// rules.connectionFindings가 쓴다. 케이블 한 가닥으로 잇는 오디오 연결이 아니면 null → 기존 커넥터 규칙
export function audioCableFindings(source, target, signal, rules) {
  const cable = audioCable(source, target, signal);
  if (!cable) return null;
  const findings = [];
  if (!sameTermination(source.connector, target.connector, rules)) findings.push({ code: 'audio-cable', severity: 'info', detail: cable.name });
  if (cable.balanced === false && (TERMINATIONS[source.connector].balanced || TERMINATIONS[target.connector].balanced)) {
    findings.push({ code: 'audio-unbalanced', severity: 'info', detail: `${TERMINATIONS[source.connector].short} → ${TERMINATIONS[target.connector].short}` });
  }
  return findings;
}

const LEVEL_TAGS = [['SPEAKER', 'SPK'], ['AES3', 'AES'], ['SPDIF', 'S/PDIF']];

// 노드 단자 행 배지. 오디오 단자가 아니면 null
export function audioPortTags(port) {
  const mic = port.signals.includes('MIC-AUDIO');
  const line = port.signals.includes('LINE-AUDIO');
  let level = mic && line ? 'M/L' : mic ? 'MIC' : line ? 'LINE' : null;
  if (!level) level = LEVEL_TAGS.find(([signal]) => port.signals.includes(signal))?.[1] ?? null;
  if (!level) return null;
  return { connector: TERMINATIONS[port.connector]?.short ?? null, level };
}
