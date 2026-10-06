// Builder 단자 어휘와 변환 규칙.
// 근거: Work/빌더/기반명세.md 부록 A. 규칙 표의 순서가 판정 순서이므로 순서를 바꾸지 않는다.
// 규칙을 바꾸면 VOCABULARY_VERSION을 올리고 기반명세 부록 A를 함께 고친다.

export const VOCABULARY_VERSION = '1.0.0';

// ── 표준 신호: [id, 표시명, 선 종류, 대칭 여부]. 배열 순서 = 주 신호 우선순위(부록 A3 ORDER) ──
export const SIGNALS = Object.freeze([
  ['POWER', 'Power', 'power', false],
  ['BLU-LINK', 'BLU link', 'network', false],
  ['DANTE', 'Dante', 'network', true],
  ['AES67', 'AES67', 'network', true],
  ['COBRANET', 'CobraNet', 'network', true],
  ['AVB', 'AVB', 'network', true],
  ['HDBASET', 'HDBaseT', 'network', false],
  ['HDMI', 'HDMI', 'video', false],
  ['DVI', 'DVI', 'video', false],
  ['DP', 'DP', 'lt-1784014150344', false],
  ['SDI', 'SDI', 'sdi', false],
  ['SYNC', 'Sync', 'sdi', false],
  ['ANALOG-VIDEO', 'Analog Video', 'analog-video', false],
  ['SPEAKER', 'Speaker', 'speaker', false],
  ['MIC-AUDIO', 'Mic Audio', 'audio', false],
  ['LINE-AUDIO', 'Line Audio', 'audio', false],
  ['AES3', 'AES3', 'audio', false],
  ['SPDIF', 'S/PDIF', 'audio', false],
  ['ETHERNET', 'Ethernet', 'network', true],
  ['POE', 'PoE', 'network', true],
  ['RS-232', 'RS-232', 'control', false],
  ['RS-422', 'RS-422', 'control', false],
  ['RS-485', 'RS-485', 'control', false],
  ['IR', 'IR', 'control', false],
  ['GPIO', 'GPIO', 'control', false],
  ['RELAY', 'Relay', 'control', false],
  ['USB', 'USB', 'usb', false],
  ['RF', 'RF', 'rf', false],
  ['FIBER', 'Fiber', 'fiber', false],
].map(([id, label, lineType, symmetric]) => Object.freeze({ id, label, lineType, symmetric })));

export const SIGNAL_ORDER = Object.freeze(SIGNALS.map(signal => signal.id));
export const SIGNAL_BY_ID = new Map(SIGNALS.map(signal => [signal.id, signal]));
export const SYMMETRIC_SIGNALS = Object.freeze(SIGNALS.filter(signal => signal.symmetric).map(signal => signal.id));

// ── 선 종류: 기존 7종(구 Builder 운영 값 그대로) + 새 ID. power는 예약(1단계에서 선을 긋지 않음) ──
export const LINE_TYPES = Object.freeze([
  { id: 'analog-video', name: 'A.VIDEO', color: '#92400e' },
  { id: 'audio', name: 'A.AUDIO', color: '#a855f7' },
  { id: 'control', name: 'Control', color: '#f59e0b' },
  { id: 'fiber', name: 'FIBER', color: '#c026d3' },
  { id: 'lt-1784014150344', name: 'DP', color: '#ff8585' },
  { id: 'network', name: 'LAN', color: '#22c55e' },
  { id: 'power', name: 'POWER', color: '#78716c' },
  { id: 'rf', name: 'RF', color: '#65a30d' },
  { id: 'sdi', name: 'SDI', color: '#374151' },
  { id: 'speaker', name: 'SPEAKER', color: '#0891b2' },
  { id: 'usb', name: 'USB', color: '#3b82f6' },
  { id: 'video', name: 'HDMI', color: '#ef4444' },
].map(Object.freeze));
export const BASE_LINE_TYPE_IDS = Object.freeze(['audio', 'control', 'lt-1784014150344', 'network', 'sdi', 'usb', 'video']);
export const RESERVED_LINE_TYPE_IDS = Object.freeze(['power']);
export const FIBER_CONNECTORS = Object.freeze(['SFP', 'LC', 'SC']);

// ── A1. 단자가 아닌 행: [분류, 대상 칸, 정규식, 제외 정규식] ──
export const NON_PORT_RULES = Object.freeze([
  ['unsupported', 'availability', /미지원/],
  ['service', 'connector', /SERVICE|Reset|Security Lock|서비스 전용/i],
  ['service', 'signal', /펌웨어|firmware|서비스 전용/i, /재생|미디어|Media|Storage|메모리|Memory|Viewer|USB 메모리/i],
  ['wireless', 'connector', /무선|Wireless|Bluetooth|NFC|RFID|Wi-?Fi|AirPlay|Google Cast|수신부/i, /USB/i],
  ['wireless', 'signal', /^무선/],
  ['wireless', 'connector+signal', /(\bRF\b.*리모컨|리모컨.*\bRF\b)/i],
  ['slot', 'connector', /슬롯|slot|보드\(선택형\)|CFexpress|카드/i, /Combicon|온보드|USB/i],
  ['slot', 'condition', /모듈 칸|카드 구성에 따라|카드형/],
]);

// ── A2. 커넥터 ──
export const UNKNOWN_CONNECTOR = /^(정보 없음|MISSING|—|커넥터 규격 정보 없음|)$/;
export const CONNECTOR_RULES = Object.freeze([
  ['CAPTIVE', /커넥터 없음|무단말 케이블|부착형 케이블|captive/i],
  ['TERMINAL-BLOCK', /Phoenix|Combicon|Euro ?\d|유로블록|터미널 블록|터미널\(|Terminal|Screw(?!-lock)|스크류 단자|단자대|Barrier|WAGO|핀 블록|블록 커넥터|\d+-pin terminal|2핀 단자/i],
  ['BINDING-POST', /Binding Post/i],
  ['SPEAKON', /Speakon|NL4/i],
  ['POWERCON', /powerCON/i],
  ['IEC-C20', /IEC.*C20|C20 inlet/i],
  ['IEC-C14', /IEC.*C14/i],
  ['IEC-C13', /IEC C13/i],
  ['IEC', /IEC|AC 인렛|AC 전원 리셉터클|V-Lock AC inlet/i],
  ['SCHUKO', /CEE7\/7/i],
  ['XLR4', /DC IN XLR 4핀/i],
  ['DC', /\bDC\b|DC입력|DC 입력/i],
  ['HD-BNC', /HD-BNC/i],
  ['BNC', /BNC/i],
  ['HDMI', /HDMI/i],
  ['DP', /DisplayPort|^DP$|^DP\b/i],
  ['DVI', /DVI/i],
  ['DSUB-15', /D-?SUB ?(HD )?15|DB-?15/i],
  ['DSUB-25', /DB-?25/i],
  ['DSUB-9', /D-?SUB ?9|DB-?9/i],
  ['MINI-DIN-8', /Mini DIN 8/i],
  ['SFP', /SFP/i],
  ['LC', /\bLC\b|1LC|2LC/i],
  ['SC', /\bSC\b/i],
  ['RJ11', /RJ-?11|RJ-?12/i],
  ['RJ45', /RJ-?45|etherCON|CATx|Cat5/i],
  ['USB-C', /USB.*(Type[- ]?C|-C\b|\bC$)|USB-C/i],
  ['USB-B', /USB.*(Type[- ]?B|-B\b| B$)/i],
  ['USB-MICRO', /Micro[- ]?USB/i],
  ['USB-MINI', /Mini USB/i],
  ['USB-A', /USB.*(Type[- ]?A|-A\b| A\b|Host)|USB-A/i],
  ['USB', /USB/i],
  ['MINI-XLR', /Mini XLR|TA4M/i],
  ['XLR-COMBO', /Combo/i],
  ['XLR4', /XLR 4|XLR-4|XLR 4pin/i],
  ['XLR', /XLR/i],
  ['TRS-6.3', /1\/4|6\.3 ?mm|6\.35|TRS Phone/i],
  ['TRS-3.5', /3\.5 ?mm|Stereo mini|미니잭|mini jack|1\/8/i],
  ['RCA', /RCA|Cinch/i],
  ['OPTICAL', /옵티컬|OPTICAL/i],
  ['SMA', /SMA/i],
  ['PROPRIETARY', /modular|12-pin/i],
]);
export const CONNECTORS = Object.freeze(['UNKNOWN', ...new Set(CONNECTOR_RULES.map(([id]) => id))]);

// 다중 커넥터 검사용 계열
export const CONNECTOR_FAMILIES = Object.freeze([
  ['HDMI', /HDMI/i], ['DP', /DisplayPort|\bDP\b/], ['DVI', /DVI/i], ['BNC', /BNC/i], ['SDI', /SDI/],
  ['RJ45', /RJ-?45|etherCON/i], ['USB', /USB/i], ['XLR', /XLR/i], ['TRS', /1\/4|6\.3 ?mm|6\.35|TRS/i],
  ['RCA', /RCA/i], ['DSUB', /D-?SUB|DB-?\d/i], ['SFP', /SFP/i], ['SPEAKON', /Speakon/i], ['BINDING', /Binding/i],
]);
export const FAMILY_EXEMPTIONS = Object.freeze([
  [/Combo/i, ['XLR', 'TRS']],
  [/브레이크아웃|breakout/i, '*'],
  [/RS-?232|RS-?422/i, ['DSUB']],
]);
export const MULTI_SPLIT = /\s(?:또는|or|및)\s|\s\+\s|,\s/;
export const MULTI_SPLIT_EXEMPT = /Combo|브레이크아웃|breakout/i;

// 커넥터 호환(§2.8): 와일드카드는 해당 계열 전체와, '*'는 모든 커넥터와 같은 것으로 본다
export const CONNECTOR_WILDCARDS = Object.freeze({
  USB: ['USB-A', 'USB-B', 'USB-C', 'USB-MICRO', 'USB-MINI'],
  IEC: ['IEC-C13', 'IEC-C14', 'IEC-C20'],
  UNKNOWN: '*',
  CAPTIVE: '*',
});
export const CONNECTOR_EQUIVALENTS = Object.freeze([['XLR', 'XLR-COMBO'], ['TRS-6.3', 'XLR-COMBO']]);
export const LEVEL_PAIRS = Object.freeze([['LINE-AUDIO', 'MIC-AUDIO']]);

// ── A3. 신호 ──
export const POWER_CONNECTORS = Object.freeze(['IEC', 'IEC-C14', 'IEC-C20', 'IEC-C13', 'POWERCON', 'SCHUKO', 'DC']);
export const ANALOG_AUDIO_CONNECTORS = Object.freeze(['XLR', 'XLR4', 'XLR-COMBO', 'MINI-XLR', 'TRS-6.3', 'TRS-3.5', 'RCA', 'TERMINAL-BLOCK', 'DSUB-9', 'DSUB-25', 'UNKNOWN', 'CAPTIVE']);
export const DIGITAL_VIDEO_SIGNALS = Object.freeze(['HDMI', 'DVI', 'DP', 'SDI', 'HDBASET']);
export const POWER_TEXT = /Mains|AC 전원|AC power|DC power|DC 전원|램프 전원|전원 입력|Power In|^POWER$|DC IN|DC 입력|DC OUT|전원 출력|Power Out|전용 전원|^전원 공급$/i;
export const POWER_EXCLUDE = /팬텀|phantom|PoE/i;
// MIC·LINE 판정은 SPEAKER 다음, AES3 앞에서 한다(signalRules의 'AUDIO' 자리)
export const SIGNAL_RULES = Object.freeze([
  ['BLU-LINK', /BLU ?link/i],
  ['DANTE', /Dante/i],
  ['AES67', /AES67|AES-67/i],
  ['COBRANET', /CobraNet/i],
  ['HDBASET', /HDBaseT|HDBT|DIGITAL LINK/i],
  ['HDMI', /HDMI|TMDS/i],
  ['DVI', /DVI/i],
  ['DP', /DisplayPort|\bDP\b/],
  ['SDI', /SDI/],
  ['SYNC', /Genlock|GENLOCK|Reference|Word ?Clock|\bTC IN\b|Timecode|블랙 버스트|Black ?burst|트라이레벨|Tri-?level/i],
  ['ANALOG-VIDEO', /VGA|RGB|컴포넌트|Component|컴포지트|Composite|CVBS|\bY\/C\b|아날로그 비디오|Analog video/],
  ['SPEAKER', /스피커|Speaker(?!phone)/i],
  ['AUDIO', null],
  ['AES3', /AES3|AES\/EBU/i],
  ['SPDIF', /S\/PDIF/i],
  ['ETHERNET', /Ethernet|\bLAN\b|네트워크|\bNetwork\b|1000BASE|100BASE|10GBASE|10\/100|\b1G\b|\b10G\b|Gigabit|HiQnet|\bIP\b|이더넷|etherCON/i],
  ['POE', /PoE/],
  ['RS-232', /RS-?232|외부 제어|Ex-Link/i],
  ['RS-422', /RS-?422/i],
  ['RS-485', /RS-?485/i],
  ['IR', /\bIR\b|IR 입력|IR 출력|IR 수신|적외선/],
  ['GPIO', /\bGPI|GPIO|Contact|TALLY|Tally|접점|FOOTSWITCH|[Tt]rigger|트리거/],
  ['RELAY', /Relay|릴레이/i],
  ['USB', /USB/i],
  ['RF', /\bRF\b|안테나|Antenna/i],
]);
export const ETHERNET_SKIP = /Wireless|무선/i;
export const MIC_LINE = /Mic\/Line|마이크\/라인/i;
export const MIC = /마이크|\bMic\b|\bMIC\b|Microphone/;
export const LINE = /아날로그 오디오|Analog (audio|input|output|stereo)|\bLine\b|라인|Stereo Audio|오디오 (입력|출력)|\bBalanced\b|\bUnbalanced\b|\bAUX\b|헤드폰|PHONES|headphone|\bAudio (in|out|output|input)\b|\bAUDIO (IN|OUT)\b/i;
export const LINE_EXCLUDE = /제어|[Cc]ontrol|GPI/;
export const OPTICAL_AUDIO = /오디오|audio/i;
export const DSUB15_VIDEO = /Computer|COMPUTER|MONITOR OUT|\bPC\b/;
export const PROTOCOL_ADDABLE = Object.freeze(['DANTE', 'AES67', 'COBRANET', 'POE']);
export const PROTOCOL_TRIGGER_CONNECTORS = Object.freeze(['RJ45', 'SFP']);
export const PROPRIETARY_TEXT = /독자|proprietary|전용 프로토콜/i;
export const FIBER_TEXT = /Fiber|FIBER|광섬유|광 단자|광 커넥터|1000BASE-X/i;
export const ON_ETHERNET = Object.freeze(['DANTE', 'AES67', 'COBRANET', 'AVB', 'POE']);
export const CONNECTOR_DEFINES_SIGNAL = Object.freeze({ HDMI: 'HDMI', DP: 'DP', DVI: 'DVI', SPEAKON: 'SPEAKER' });
export const MULTI_SIGNAL_TEXT = /\s(또는|or)\s/i;
export const MULTIVIEWER_TEXT = /멀티뷰어|Multiviewer/i;

// ── A4. 방향 ──
export const DIRECTION_RULES = Object.freeze([['in', /^(IN|입력)$/i], ['out', /^(OUT|출력)$/i], ['both', /^(IN\/OUT|I\/O|BIDIR|양방향)$/i]]);
export const DIRECTION_UNSTATED = /^(|N\/A|정보 없음)$/;
export const DIRECTION_LABELS = Object.freeze({ in: 'In', out: 'Out', both: 'I/O' });

// ── A5. 수량 ──
export const CHANNEL_CONNECTORS = Object.freeze(['TERMINAL-BLOCK', 'XLR', 'XLR-COMBO', 'BINDING-POST']);
export const QUANTITY_INTEGER = /^[1-9]\d*$/;
export const QUANTITY_CHANNELS = /^([1-9]\d*)\s*(채널|ch)$/i;
export const QUANTITY_TIMES = /^([1-9]\d*)\s*[x×]\s*\S/;
export const CONNECTOR_COUNT = /(?:\bx\s?|×\s?)([1-9]\d*)\b|^([1-9]\d*)\s?x\s/i;

// ── A6. 확인 필요 사유 순서 ──
// txrx: TX/RX로 나눠야 하는데 근거가 모자란 제품의 행(§6.1) · series-io: 시리즈 제품에 생긴 I/O 행(§6.3)
export const REVIEW_REASONS = Object.freeze(['multi-connector', 'multi-signal', 'no-signal', 'direction', 'quantity', 'txrx', 'series-io']);

// ── §4. 카테고리 ──
export const CATEGORY_BY_LEVEL2 = Object.freeze({ Audio: 'audio', Video: 'video', Display: 'display', Conferencing: 'conferencing', Control: 'control', Network: 'network' });
export const NOT_PLACEABLE_LEVEL3 = Object.freeze(['Cable', 'Active Optical Cable', 'HDMI Cable', 'License']);

// ── 개별 지정(P6에서 채운다) ──
// '<제품ID>#<io 행 위치>' → { match: { connector, signal }, connector, signals, direction, quantity, note }
// 원문은 맞는데 규칙으로 읽지 못하는 행만 넣는다. match에는 그 행의 connector·signal 원문을 그대로 적는다.
// 원문이 바뀌면(행 이동·수정) 적용하지 않고 제품 이슈 override-stale로 알린다. note에 근거(제조사 자료 등)를 적는다.
export const IO_OVERRIDES = Object.freeze({});
