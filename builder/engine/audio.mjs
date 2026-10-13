// 오디오 연결 판정(B-20261013-05). 오디오는 커넥터 모양이 아니라 신호의 성격으로 판단한다.
// 선을 물리는 단자(XLR·TRS·유로블록·RCA 등)끼리는 케이블 한 가닥으로 잇는 정상 결선이다. 커넥터 차이는 케이블 양 끝 처리 문제로 본다.
// 성별은 현장 관례를 따른다: 장비의 XLR 출력은 수(M)라 케이블 끝은 암(F), 입력은 암이라 케이블 끝은 수(M).

const ANALOG = ['MIC-AUDIO', 'LINE-AUDIO'];
const DIGITAL = ['AES3', 'SPDIF'];

// short: 노드 배지·불평형 안내에 쓰는 약칭. balanced: 평형 여부
const TERMINATIONS = {
  XLR: { short: 'XLR', balanced: true },
  'XLR-COMBO': { short: 'XLR/TRS', balanced: true },
  'MINI-XLR': { short: 'mXLR', cable: '미니 XLR', balanced: true },
  XLR4: { short: 'XLR4', cable: 'XLR 4P', balanced: true },
  'TRS-6.3': { short: 'TRS', cable: 'TRS 6.3', balanced: true },
  'TRS-3.5': { short: '3.5', cable: '3.5mm', balanced: false },
  RCA: { short: 'RCA', cable: 'RCA', balanced: false },
  'TERMINAL-BLOCK': { short: 'EB', cable: '유로블록 3P', speakerCable: '유로블록', balanced: true },
  CAPTIVE: { short: 'EB', cable: '유로블록 3P', speakerCable: '유로블록', balanced: true },
  'DSUB-25': { short: 'D25', cable: 'D-Sub 25', balanced: true },
  'DSUB-9': { short: 'D9', cable: 'D-Sub 9', balanced: true },
  SPEAKON: { short: 'SPK', cable: '스피콘' },
  'BINDING-POST': { short: 'BP', cable: '바인딩 포스트' },
  OPTICAL: { short: 'OPT' },
  BNC: { short: 'BNC' },
};

// 신호 종류별로 케이블 한 가닥으로 잇는 단자. 여기 없는 조합(광·BNC 등)은 기존 커넥터 규칙(변환 필요)을 따른다
const WIRED = {
  analog: ['XLR', 'XLR-COMBO', 'MINI-XLR', 'XLR4', 'TRS-6.3', 'TRS-3.5', 'RCA', 'TERMINAL-BLOCK', 'CAPTIVE', 'DSUB-25', 'DSUB-9'],
  digital: ['XLR', 'XLR-COMBO', 'TERMINAL-BLOCK', 'CAPTIVE', 'DSUB-25', 'DSUB-9', 'RCA'],
  speaker: ['TERMINAL-BLOCK', 'CAPTIVE', 'SPEAKON', 'BINDING-POST', 'TRS-6.3', 'MINI-XLR'],
};

export function audioKind(signal) {
  if (ANALOG.includes(signal)) return 'analog';
  if (DIGITAL.includes(signal)) return 'digital';
  if (signal === 'SPEAKER') return 'speaker';
  return null;
}

// 연결 신호: 공통 신호 → 없으면 레벨 차이(마이크↔라인)로 source 쪽 신호
function sharedSignal(source, target) {
  const common = source.signals.find(signal => target.signals.includes(signal));
  if (common) return common;
  if (source.signals.some(s => ANALOG.includes(s)) && target.signals.some(s => ANALOG.includes(s))) return source.signals.find(s => ANALOG.includes(s));
  return null;
}

function cableEnd(connector, role, kind) {
  const termination = TERMINATIONS[connector];
  if (connector === 'XLR' || connector === 'XLR-COMBO') return role === 'source' ? 'XLR(F)' : 'XLR(M)';
  if (kind === 'speaker' && termination.speakerCable) return termination.speakerCable;
  return termination.cable;
}

const SUFFIX = { AES3: 'AES 110Ω', SPDIF: 'S/PDIF 75Ω' };

// 오디오 연결의 추천 케이블. 오디오가 아니거나 케이블 한 가닥으로 잇지 못하면 null
export function audioCable(source, target, signal = sharedSignal(source, target)) {
  const kind = audioKind(signal);
  if (!kind) return null;
  if (!WIRED[kind].includes(source.connector) || !WIRED[kind].includes(target.connector)) return null;
  const ends = `${cableEnd(source.connector, 'source', kind)}–${cableEnd(target.connector, 'target', kind)}`;
  if (kind === 'speaker') return { kind, name: `${ends} 스피커 케이블` };
  if (kind === 'digital') return { kind, name: `${ends} ${SUFFIX[signal]}` };
  const balanced = TERMINATIONS[source.connector].balanced && TERMINATIONS[target.connector].balanced;
  return { kind, name: `${ends} ${balanced ? '평형' : '불평형'}`, balanced };
}

// 같은 단자 계열인지(같은 약칭이거나 커넥터 호환 묶음). 다르면 케이블 양 끝이 다르다는 안내를 낸다
const sameTermination = (a, b, rules) => a === b
  || TERMINATIONS[a]?.short === TERMINATIONS[b]?.short
  || rules.connectorEquivalents.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const LEVEL_HINT = { 'MIC-AUDIO>LINE-AUDIO': '프리앰프 필요', 'LINE-AUDIO>MIC-AUDIO': '감쇠(패드) 필요' };

// rules.connectionFindings가 오디오 연결에만 쓴다. 오디오가 아니면 null → 기존 규칙
export function audioFindings(source, target, level, rules) {
  const signal = sharedSignal(source, target);
  const cable = audioCable(source, target, signal);
  if (!cable) return null;
  const findings = [];
  if (!sameTermination(source.connector, target.connector, rules)) findings.push({ code: 'audio-cable', severity: 'info', detail: cable.name });
  if (cable.balanced === false && (TERMINATIONS[source.connector].balanced || TERMINATIONS[target.connector].balanced)) {
    findings.push({ code: 'audio-unbalanced', severity: 'info', detail: `${TERMINATIONS[source.connector].short} → ${TERMINATIONS[target.connector].short}` });
  }
  if (level) {
    const to = target.signals.find(s => ANALOG.includes(s) && s !== signal) ?? target.signals[0];
    const hint = LEVEL_HINT[`${signal}>${to}`];
    findings.push({ code: 'signal-level', severity: 'warning', detail: `${signal} → ${to}${hint ? ` (${hint})` : ''}` });
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
