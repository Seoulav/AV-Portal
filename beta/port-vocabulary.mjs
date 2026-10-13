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
// 슬롯 정보(slots)가 있는 프레임에서 카드를 꽂아야 생기는 행(availability 칸). 이 행은 슬롯 행으로 두고
// 단자는 장착한 카드 제품에서 만든다(B-20261013-03). slots가 없는 제품에는 적용하지 않는다.
export const CARD_IO_AVAILABILITY = /카드 장착 시/;

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
// '<제품ID>#<io 행 위치>' → 단일 {connector, signals, direction, quantity} 또는 복합 ports 배열 + match/note
// 원문은 맞는데 규칙으로 읽지 못하는 행만 넣는다. match에는 그 행의 connector·signal 원문을 그대로 적는다.
// 원문이 바뀌면(행 이동·수정) 적용하지 않고 제품 이슈 override-stale로 알린다. note에 근거(제조사 자료 등)를 적는다.
export const IO_OVERRIDES = Object.freeze({
  'v-02hd-mk-ii#1': {
    match: { connector: 'PGM OUT / PREVIEW OUT', signal: 'Video' },
    ports: [{ connector: 'HDMI', signals: ['HDMI'], direction: 'out', quantity: 2 }],
    note: 'Roland V-02HD MK II Reference Manual, Main Specifications: separate PROGRAM OUT and PREVIEW OUT HDMI Type A connectors; https://static.roland.com/assets/media/pdf/V-02HD_MKII_reference_eng03_W.pdf',
  },
  // Alta 4K fixed HDMI/SDI mirrored output pairs; optional SFP+ module rows stay unresolved.
  ...Object.fromEntries(['zenith-100', 'zenith-200'].flatMap(id => [
    [`${id}#4`, {
      match: { connector: 'HDMI 2.0 + 12G-SDI(미러링)', signal: '4K60 out' },
      ports: [
        { connector: 'HDMI', signals: ['HDMI'], direction: 'out', quantity: 2 },
        { connector: 'BNC', signals: ['SDI'], direction: 'out', quantity: 2 },
      ],
      note: `Analog Way official ${id} specifications: two output channels each mirrored on HDMI 2.0 and 12G-SDI; https://www.analogway.com/products/${id}`,
    }],
    [`${id}#6`, {
      match: { connector: 'HDMI 1.4 + 3G-SDI(미러링)', signal: 'Multiviewer out' },
      ports: [
        { connector: 'HDMI', signals: ['HDMI'], direction: 'out', quantity: 1 },
        { connector: 'BNC', signals: ['SDI'], direction: 'out', quantity: 1 },
      ],
      note: `Analog Way official ${id} specifications: one HDMI 1.4 multiviewer output mirrored on 3G-SDI; https://www.analogway.com/products/${id}`,
    }],
  ])),
  // Midra 4K has mirrored HDMI and SDI jacks on each physical output; both remain connectable.
  ...Object.fromEntries(['eikos-4k', 'pulse-4k'].flatMap(id => [
    [`${id}#4`, {
      match: { connector: 'HDMI 2.0 + 12G/6G/3G-SDI(미러링)', signal: '4K60 PGM/AUX out' },
      ports: [
        { connector: 'HDMI', signals: ['HDMI'], direction: 'out', quantity: 2 },
        { connector: 'BNC', signals: ['SDI'], direction: 'out', quantity: 2 },
      ],
      note: `Analog Way official ${id} datasheet: two HDMI 2.0 outputs, each mirrored on 12G/6G/3G-SDI; https://www.analogway.com/products/${id}`,
    }],
    [`${id}#5`, {
      match: { connector: 'HDMI 1.4 + 3G-SDI(미러링)', signal: 'Multiviewer out' },
      ports: [
        { connector: 'HDMI', signals: ['HDMI'], direction: 'out', quantity: 1 },
        { connector: 'BNC', signals: ['SDI'], direction: 'out', quantity: 1 },
      ],
      note: `Analog Way official ${id} datasheet: one HDMI 1.4 multiviewer output mirrored on 3G-SDI; https://www.analogway.com/products/${id}`,
    }],
  ])),
  // Aquilon RS standard multiviewer card: two independent HDMI 2.0 output jacks.
  // The portal I/O row is already correct; the generic parser mistakes "multiviewer" for multiple signal types.
  ...Object.fromEntries(['aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6', 'aquilon-rsalpha'].map(id => [
    `${id}#2`, {
      match: { connector: 'HDMI 2.0', signal: '멀티뷰어 out' },
      ports: [{ connector: 'HDMI', signals: ['HDMI'], direction: 'out', quantity: 2 }],
      note: `Analog Way official ${id} product specifications, "2 Dedicated Multiviewer Outputs": 2 HDMI 2.0 ports; https://www.analogway.com/products/${id === 'aquilon-rsalpha' ? 'aquilon-rs-alpha' : id}`,
    },
  ])),
  'eb-pu2010w-b#4': {
    match: { connector: "BNC", signal: "디지털 비디오 입력" },
    ports: [{ connector: 'BNC', signals: ['SDI'], direction: 'in', quantity: 1 }],
    note: "Epson official model-applicable interface specifications identify SDI In (BNC), one jack; https://files.support.epson.com/pdf/specs/specifications_ebpu2010series_en_r102.pdf",
  },
  'eb-pu2010w-b#5': {
    match: { connector: "BNC", signal: "디지털 비디오 출력" },
    ports: [{ connector: 'BNC', signals: ['SDI'], direction: 'out', quantity: 1 }],
    note: "Epson official model-applicable interface specifications identify SDI Out (BNC), one jack; https://files.support.epson.com/pdf/specs/specifications_ebpu2010series_en_r102.pdf",
  },
  'eb-pu2213b#4': {
    match: { connector: "BNC", signal: "디지털 비디오 입력" },
    ports: [{ connector: 'BNC', signals: ['SDI'], direction: 'in', quantity: 1 }],
    note: "Epson official model-applicable interface specifications identify SDI In (BNC), one jack; https://files.support.epson.com/pdf/specs/specifications_ebpu2220series_en_r100.pdf",
  },
  'eb-pu2213b#5': {
    match: { connector: "BNC", signal: "디지털 비디오 출력" },
    ports: [{ connector: 'BNC', signals: ['SDI'], direction: 'out', quantity: 1 }],
    note: "Epson official model-applicable interface specifications identify SDI Out (BNC), one jack; https://files.support.epson.com/pdf/specs/specifications_ebpu2220series_en_r100.pdf",
  },
  'eb-pu2216b#4': {
    match: { connector: "BNC", signal: "디지털 비디오 입력" },
    ports: [{ connector: 'BNC', signals: ['SDI'], direction: 'in', quantity: 1 }],
    note: "Epson official model-applicable interface specifications identify SDI In (BNC), one jack; https://files.support.epson.com/pdf/specs/specifications_ebpu2220series_en_r100.pdf",
  },
  'eb-pu2216b#5': {
    match: { connector: "BNC", signal: "디지털 비디오 출력" },
    ports: [{ connector: 'BNC', signals: ['SDI'], direction: 'out', quantity: 1 }],
    note: "Epson official model-applicable interface specifications identify SDI Out (BNC), one jack; https://files.support.epson.com/pdf/specs/specifications_ebpu2220series_en_r100.pdf",
  },
  'mx392-c#1': {
    match: { connector: "나사식 단자(스크류 터미널)", signal: "LED IN" },
    ports: [{ connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'in', quantity: 1 }],
    note: "Shure MX39x User Guide Logic Connections: LED IN, one external logic connection on screw terminals with common ground; https://www.shure.com/en-US/docs/guide/MX39x",
  },
  'mx392-c#2': {
    match: { connector: "나사식 단자(스크류 터미널)", signal: "SWITCH OUT" },
    ports: [{ connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'out', quantity: 1 }],
    note: "Shure MX39x User Guide Logic Connections: SWITCH OUT, one external logic connection on screw terminals with common ground; https://www.shure.com/en-US/docs/guide/MX39x",
  },
  'pt-mz882#6': {
    match: { connector: "M3 스테레오 미니잭", signal: "AUDIO IN/OUT" },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }, { connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 }],
    note: "Panasonic Korean manual DPQP1564ZA/X1 p.27, PT-MZ882/MZ782/MZ682: AUDIO IN and AUDIO OUT, one 3.5 mm jack each.",
  },
  'pt-vmz51#2': {
    match: { connector: "M3 스테레오 미니잭", signal: "Audio IN / Variable Audio OUT" },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 2 }, { connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 }],
    note: "Panasonic Korean manual DPQP1388ZD/X1 p.25, PT-VMZ71/61/51: AUDIO IN 1/2 and VARIABLE AUDIO OUT, three 3.5 mm jacks.",
  },
  'pt-vmz61#2': {
    match: { connector: "M3 스테레오 미니잭", signal: "Audio IN / Variable Audio OUT" },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 2 }, { connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 }],
    note: "Panasonic Korean manual DPQP1388ZD/X1 p.25, PT-VMZ71/61/51: AUDIO IN 1/2 and VARIABLE AUDIO OUT, three 3.5 mm jacks.",
  },
  'pt-vmz71#2': {
    match: { connector: "M3 스테레오 미니잭", signal: "Audio IN / Variable Audio OUT" },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 2 }, { connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 }],
    note: "Panasonic Korean manual DPQP1388ZD/X1 p.25, PT-VMZ71/61/51: AUDIO IN 1/2 and VARIABLE AUDIO OUT, three 3.5 mm jacks.",
  },
  'mx395#0': {
    match: { connector: '3-pin XLR 또는 5-pin XLR (LED 모델)', signal: 'Microphone audio output (phantom powered)' },
    ports: [{ connector: 'XLR', signals: ['MIC-AUDIO'], direction: 'out', quantity: 1 }],
    note: 'Shure MX395 User Guide, XLR output connector: 3-pin standard variants and 5-pin LED variants; https://pubs.shure.com/view/guide/MX395/en-US.pdf',
  },
  'mxc420-c#0': {
    match: { connector: '10-pin modular plug', signal: 'Conference unit connection' },
    ports: [{ connector: 'PROPRIETARY', signals: ['MIC-AUDIO'], direction: 'out', quantity: 1 }],
    note: 'Shure MXC User Guide, MXC420/C gooseneck microphone uses one locking 10-pin modular connector; https://www.shure.com/en-US/docs/guide/MXC',
  },
  'mxcw640#0': {
    match: { connector: '10-pin modular connector', signal: 'Gooseneck microphone' },
    ports: [{ connector: 'PROPRIETARY', signals: ['MIC-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Shure MXCW640 product page and MXC User Guide identify one lockable 10-pin MXC gooseneck microphone connector; https://www.shure.com/en-US/products/wireless-systems/mxcw/mxcw640 ; https://www.shure.com/en-US/docs/guide/MXC',
  },
  'qlxd1#1': {
    match: { connector: '4핀 male mini connector (TA4M)', signal: 'Mic/instrument input' },
    ports: [{ connector: 'PROPRIETARY', signals: ['MIC-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Shure QLX-D User Guide, QLXD1 specifications identify one TA4M input connector; https://pubs.shure.com/view/guide/QLXD/en-US.pdf',
  },
  'qlxd4#1': {
    match: { connector: '1/4" (6.35 mm) 및 XLR', signal: 'Audio output' },
    ports: [
      { connector: 'XLR', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 },
      { connector: 'TRS-6.3', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 },
    ],
    note: 'Shure QLX-D User Guide, QLXD4 receiver output connector diagram and specifications; https://pubs.shure.com/view/guide/QLXD/en-US.pdf',
  },
  'slxd1-plus#0': {
    match: { connector: 'TA4M (4핀 수 미니 커넥터)', signal: 'Mic/instrument input' },
    ports: [{ connector: 'PROPRIETARY', signals: ['MIC-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Shure SLX-D+ User Guide, SLXD1+ transmitter TA4M input; https://www.shure.com/en-US/docs/guide/SLXD4plus',
  },
  'slxd4-plus#1': {
    match: { connector: 'XLR ×1, 1/4"(6.35 mm) ×1 (inst/aux)', signal: 'Audio output' },
    ports: [
      { connector: 'XLR', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 },
      { connector: 'TRS-6.3', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 },
    ],
    note: 'Shure SLX-D+ User Guide, SLXD4+ rear panel and output specifications; https://www.shure.com/en-US/docs/guide/SLXD4plus',
  },
  'slxd4d-plus#1': {
    match: { connector: 'XLR ×2, 1/4"(6.35 mm) ×2 (채널별 XLR + inst/aux)', signal: 'Audio output' },
    ports: [
      { connector: 'XLR', signals: ['LINE-AUDIO'], direction: 'out', quantity: 2 },
      { connector: 'TRS-6.3', signals: ['LINE-AUDIO'], direction: 'out', quantity: 2 },
    ],
    note: 'Shure SLX-D+ User Guide, SLXD4D+ is the dual receiver with the additional output per channel; https://www.shure.com/en-US/docs/guide/SLXD4plus',
  },
  'ua845uwb#0': {
    match: { connector: 'BNC', signal: 'RF input/output (antenna distribution)' },
    ports: [
      { connector: 'BNC', signals: ['RF'], direction: 'in', quantity: 2 },
      { connector: 'BNC', signals: ['RF'], direction: 'out', quantity: 10 },
    ],
    note: 'Shure UA845UWB User Guide, rear panel has two antenna inputs, eight receiver outputs, and two cascade outputs; https://www.shure.com/en-US/docs/guide/UA845UWB',
  },
  'ulxd1#1': {
    match: { connector: '4핀 male mini connector (TA4M)', signal: 'Mic/instrument input' },
    ports: [{ connector: 'PROPRIETARY', signals: ['MIC-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Shure ULX-D User Guide, ULXD1 transmitter uses one TA4M input; https://www.shure.com/en-US/docs/guide/ULXD-DQ',
  },
  'ulxd4#1': {
    match: { connector: '1/4" (6.35 mm) TRS 및 XLR', signal: 'Audio output' },
    ports: [
      { connector: 'XLR', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 },
      { connector: 'TRS-6.3', signals: ['LINE-AUDIO'], direction: 'out', quantity: 1 },
    ],
    note: 'Shure ULX-D Wireless System User Guide, ULXD4 rear panel: one balanced XLR and one balanced 1/4 inch TRS output; https://pubs.shure.com/view/guide/ULXD/en-US.pdf',
  },
  'mezzo-322-a#2': {
    match: { connector: '3.5mm 스테레오 미니잭', signal: 'Unbalanced analog audio in' },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Powersoft MEZZO user guide, rear-panel callout for channels 1–2 unbalanced input is one stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet identifies two unbalanced channels in parallel with balanced inputs 1–2: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-324-a#2': {
    match: { connector: '3.5mm 스테레오 미니잭', signal: 'Unbalanced analog audio in' },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Powersoft MEZZO user guide, rear-panel callout for channels 1–2 unbalanced input is one stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet identifies two unbalanced channels in parallel with balanced inputs 1–2: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-324-ad#2': {
    match: { connector: '3.5mm 스테레오 미니잭', signal: 'Unbalanced analog audio in' },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Powersoft MEZZO user guide, rear-panel callout for channels 1–2 unbalanced input is one stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet identifies two unbalanced channels in parallel with balanced inputs 1–2: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-602-a#2': {
    match: { connector: '3.5mm 스테레오 미니잭', signal: 'Unbalanced analog audio in' },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Powersoft MEZZO user guide, rear-panel callout for channels 1–2 unbalanced input is one stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet identifies two unbalanced channels in parallel with balanced inputs 1–2: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-602-ad#2': {
    match: { connector: '3.5mm 스테레오 미니잭', signal: 'Unbalanced analog audio in' },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Powersoft MEZZO user guide, rear-panel callout for channels 1–2 unbalanced input is one stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet identifies two unbalanced channels in parallel with balanced inputs 1–2: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-604-a#2': {
    match: { connector: '3.5mm 스테레오 미니잭', signal: 'Unbalanced analog audio in' },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Powersoft MEZZO user guide, rear-panel callout for channels 1–2 unbalanced input is one stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet identifies two unbalanced channels in parallel with balanced inputs 1–2: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-604-ad#2': {
    match: { connector: '3.5mm 스테레오 미니잭', signal: 'Unbalanced analog audio in' },
    ports: [{ connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 }],
    note: 'Powersoft MEZZO user guide, rear-panel callout for channels 1–2 unbalanced input is one stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet identifies two unbalanced channels in parallel with balanced inputs 1–2: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-322-ad#0': {
    match: { connector: 'MISSING', signal: 'Balanced/Unbalanced analog audio in' },
    ports: [
      { connector: 'TERMINAL-BLOCK', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 },
      { connector: 'TRS-3.5', signals: ['LINE-AUDIO'], direction: 'in', quantity: 1 },
    ],
    note: 'Powersoft MEZZO user guide, exact 322 AD rear-panel diagram identifies the balanced input terminal block and the channels 1–2 unbalanced stereo mini-jack; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; datasheet confirms two balanced and two unbalanced channels: https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'mezzo-322-ad#4': {
    match: { connector: 'Output terminal block', signal: 'Speaker output' },
    ports: [{ connector: 'TERMINAL-BLOCK', signals: ['SPEAKER'], direction: 'out', quantity: 1 }],
    note: 'Powersoft MEZZO user guide rear-panel callout identifies one connector for CH2–CH1 outputs; the series datasheet specifies two output channels on Euro 5 mm for the 322 AD; https://www.powersoft.com/wp-content/uploads/user_guide/PS_MEZZO_UG.pdf ; https://www.powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf',
  },
  'blu-100#5': {
    match: { connector: 'Phoenix/Combicon', signal: '제어 입력/로직 출력(GPIO)' },
    ports: [
      { connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'in', quantity: 12 },
      { connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'out', quantity: 6 },
    ],
    note: 'BSS BLU-100 datasheet lists 12 control inputs and 6 logic outputs; source row identifies Phoenix/Combicon; https://bssaudio.com/en/product_documents/blu100_datasheetpdf',
  },
  'blu-101#5': {
    match: { connector: 'Phoenix/Combicon', signal: '제어 입력/로직 출력(GPIO)' },
    ports: [
      { connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'in', quantity: 12 },
      { connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'out', quantity: 6 },
    ],
    note: 'BSS BLU-101 model-specific datasheet lists 12 control inputs and 6 logic outputs; source row identifies Phoenix/Combicon; https://bssaudio.com/en-US/product_documents/blu101datasheet_18-0818-bpdf',
  },
  // BLU-160 카드 I/O 행(0~4)의 "최대 16채널" 펼침은 B-20261013-03에서 뺐다. 상세에 slots(공용 4슬롯)가 생겨
  // 그 행은 슬롯 행이 되고, 단자는 장착한 카드 제품(blucard-in·blucard-out·blu-aec-in)에서 만든다.
  'blu-160#8': {
    match: { connector: 'Phoenix/Combicon', signal: '제어 입력/로직 출력(GPIO)' },
    ports: [
      { connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'in', quantity: 12 },
      { connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'out', quantity: 6 },
    ],
    note: 'BSS BLU-160 datasheet lists 12 control inputs and 6 logic outputs; source row identifies Phoenix/Combicon; https://bssaudio.com/en-US/product_documents/blu160datasheet-pdf',
  },
  'blu-50v2#5': {
    match: { connector: '커넥터 규격 정보 없음', signal: '제어 입력/로직 출력(GPIO)' },
    ports: [
      { connector: 'UNKNOWN', signals: ['GPIO'], direction: 'in', quantity: 12 },
      { connector: 'UNKNOWN', signals: ['GPIO'], direction: 'out', quantity: 6 },
    ],
    note: 'BSS BLU-50v2 manufacturer product page/datasheet list 12 control inputs and 6 logic outputs; neither maps a connector shape to those ports, so preserve UNKNOWN; https://bssaudio.com/ko/products/blu-50v2 ; https://bssaudio.com/ko/site_elements/data-sheet-blu-50v2',
  },  "mx392-c#3": { match: { connector: "오디오 케이블 경유 (팬텀 전원)", signal: "Power input" }, ports: [], action: 'already-represented', note: "Shure MX39x User Guide identifies phantom-powered microphone electronics on the attached audio/logic cable; the power row is already carried by the audio output connection and is not a separate terminal. https://www.shure.com/en-US/docs/guide/MX39x" },
  "mx395#1": { match: { connector: "XLR (팬텀 전원)", signal: "Power input" }, ports: [], action: 'already-represented', note: "Shure MX395 User Guide identifies the XLR microphone connection and phantom power; the power row is carried on the existing audio XLR, not a separate physical connector. https://www.shure.com/en-US/docs/guide/MX395" },
  "mx418d-c#1": { match: { connector: "XLR (팬텀 전원)", signal: "Power input" }, ports: [], action: 'already-represented', note: "Shure MX412D/MX418D User Guide and model-family specifications identify the attached XLR microphone output and phantom supply through that connection; no separate power terminal. https://www.shure.com/en-US/docs/guide/MX400D ; https://content-files.shure.com/Pubs2/files/259339.pdf" },
  "mxa925w-r#2": { match: { connector: "RJ45 (PoE)", signal: "Power input" }, ports: [], action: 'already-represented', note: "MXA925 User Guide (model variation MXA925W-R) identifies exactly two RJ45 ports; port 1 alone carries PoE. The PoE row is already represented by the primary RJ45, not a third connector. https://www.shure.com/en-US/docs/guide/mxa925" },
  "mxcwapt-w#3": { match: { connector: "RJ45 (PoE)", signal: "Power input" }, ports: [], action: 'already-represented', note: "Shure MXCW User Guide identifies one RJ45 Ethernet port for Dante and PoE on the MXCWAPT-W access point; the PoE row is already represented by that same physical port. https://pubs.shure.com/view/guide/MXCW/en-US.pdf" },
  "cdi-2-300bl#4": { match: { connector: "8핀 블록 커넥터(GPIO·AUX 공용)", signal: "GPIO/AUX 제어 입출력" }, ports: [{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"in","quantity":3},{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"out","quantity":3}], note: "Crown CDi DriveCore Owner Manual GPIO/AUX pinout: 2 GPIO inputs, 2 GPIO outputs, SLEEP input, AMP STATUS output on shared 8-pin block. https://www.crownaudio.com/en-US/site_elements/cdi-drivecore-owner-s-manual-english" },
  "cdi-4-300#1": { match: { connector: "8핀 블록 커넥터(GPIO·AUX 공용)", signal: "GPIO/AUX 제어 입출력" }, ports: [{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"in","quantity":3},{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"out","quantity":3}], note: "Crown CDi DriveCore Owner Manual GPIO/AUX pinout: 2 GPIO inputs, 2 GPIO outputs, SLEEP input, AMP STATUS output on shared 8-pin block. https://www.crownaudio.com/en-US/site_elements/cdi-drivecore-owner-s-manual-english" },
  "dci-2-300n#4": { match: { connector: "RJ-11(6포지션)", signal: "GPIO 제어 입출력" }, ports: [{"connector":"RJ11","signals":["GPIO"],"direction":"in","quantity":2},{"connector":"RJ11","signals":["GPIO"],"direction":"out","quantity":2}], note: "Crown DCi Network Series Operation Manual: 6-position RJ-11 GPIO has 2 analog input controls and 2 digital output controls. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "dci-2-300n#5": { match: { connector: "3핀 터미널 블록", signal: "AUX 원격 Sleep·상태 감시" }, ports: [{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"in","quantity":1},{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"out","quantity":1}], note: "Crown DCi Network Series Operation Manual: separate 3-pin AUX connector supports remote sleep input and amp-status output. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "dci-2-600n#4": { match: { connector: "RJ-11(6포지션)", signal: "GPIO 제어 입출력" }, ports: [{"connector":"RJ11","signals":["GPIO"],"direction":"in","quantity":2},{"connector":"RJ11","signals":["GPIO"],"direction":"out","quantity":2}], note: "Crown DCi Network Series Operation Manual: 6-position RJ-11 GPIO has 2 analog input controls and 2 digital output controls. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "dci-2-600n#5": { match: { connector: "3핀 터미널 블록", signal: "AUX 원격 Sleep·상태 감시" }, ports: [{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"in","quantity":1},{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"out","quantity":1}], note: "Crown DCi Network Series Operation Manual: separate 3-pin AUX connector supports remote sleep input and amp-status output. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "dci-4-300n#4": { match: { connector: "RJ-11(6포지션)", signal: "GPIO 제어 입출력" }, ports: [{"connector":"RJ11","signals":["GPIO"],"direction":"in","quantity":2},{"connector":"RJ11","signals":["GPIO"],"direction":"out","quantity":2}], note: "Crown DCi Network Series Operation Manual: 6-position RJ-11 GPIO has 2 analog input controls and 2 digital output controls. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "dci-4-300n#5": { match: { connector: "3핀 터미널 블록", signal: "AUX 원격 Sleep·상태 감시" }, ports: [{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"in","quantity":1},{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"out","quantity":1}], note: "Crown DCi Network Series Operation Manual: separate 3-pin AUX connector supports remote sleep input and amp-status output. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "dci-4-600n#4": { match: { connector: "RJ-11(6포지션)", signal: "GPIO 제어 입출력" }, ports: [{"connector":"RJ11","signals":["GPIO"],"direction":"in","quantity":2},{"connector":"RJ11","signals":["GPIO"],"direction":"out","quantity":2}], note: "Crown DCi Network Series Operation Manual: 6-position RJ-11 GPIO has 2 analog input controls and 2 digital output controls. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "dci-4-600n#5": { match: { connector: "3핀 터미널 블록", signal: "AUX 원격 Sleep·상태 감시" }, ports: [{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"in","quantity":1},{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"out","quantity":1}], note: "Crown DCi Network Series Operation Manual: separate 3-pin AUX connector supports remote sleep input and amp-status output. https://www.crownaudio.com/en/site_elements/drivecore-install-network-manual-english" },
  "comtech-d-2125#3": { match: { connector: "6핀 유로블록 (1-4, 5V)", signal: "GPIO control input" }, ports: [{ connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'in', quantity: 4 }], note: "Crown ComTech D Series Operation Manual: 2-channel and 4-channel models have four GPI inputs; pin map 1 ground, 2-5 GPI 1-4, 6 common +5V. Relay output uses its separate 3-pin connector and is recorded as its own I/O row. https://www.crownaudio.com/en-US/site_elements/user-manual-comtech-d-series" },
  "comtech-d-4125#3": { match: { connector: "6핀 유로블록 (1-4, 5V)", signal: "GPIO control input" }, ports: [{ connector: 'TERMINAL-BLOCK', signals: ['GPIO'], direction: 'in', quantity: 4 }], note: "Crown ComTech D Series Operation Manual: 2-channel and 4-channel models have four GPI inputs; pin map 1 ground, 2-5 GPI 1-4, 6 common +5V. Relay output uses its separate 3-pin connector and is recorded as its own I/O row. https://www.crownaudio.com/en-US/site_elements/user-manual-comtech-d-series" },
  "comtech-d-2125#4": { match: { connector: "3-pin Euroblock", signal: "Fault relay output" }, ports: [{ connector: 'TERMINAL-BLOCK', signals: ['RELAY'], direction: 'out', quantity: 1 }], note: "Crown ComTech D Series Operation Manual documents the separate NO/COM/NC fault relay output; the series datasheet specifies the 3-pin Euroblock and 30 VDC, 1 A rating. https://www.crownaudio.com/en-US/site_elements/user-manual-comtech-d-series ; https://www.crownaudio.com/en/site_elements/data-sheet-comtech-d-series" },
  "comtech-d-4125#4": { match: { connector: "3-pin Euroblock", signal: "Fault relay output" }, ports: [{ connector: 'TERMINAL-BLOCK', signals: ['RELAY'], direction: 'out', quantity: 1 }], note: "Crown ComTech D Series Operation Manual documents the separate NO/COM/NC fault relay output; the series datasheet specifies the 3-pin Euroblock and 30 VDC, 1 A rating. https://www.crownaudio.com/en-US/site_elements/user-manual-comtech-d-series ; https://www.crownaudio.com/en/site_elements/data-sheet-comtech-d-series" },
  "mezzo-324-ad#3": {"match":{"connector":"RJ45(네트워크 포트 공용)","signal":"Dante/AES67 audio"},"ports":[],"action":"already-represented","note":"Powersoft MEZZO AD official rear-panel documentation identifies dual RJ45 network ports; Dante/AES67 audio channels use those shared physical ports, so this row adds no separate connector. https://www.powersoft.com/en/products/install-amps/mezzo-324-ad ; https://www.powersoft.com/wp-content/user_guide/PS_MEZZO_UG.pdf"},
  "mezzo-324-ad#4": {"match":{"connector":"RJ45(네트워크 포트 공용)","signal":"Dante/AES67 audio"},"ports":[],"action":"already-represented","note":"Powersoft MEZZO AD official rear-panel documentation identifies dual RJ45 network ports; Dante/AES67 audio channels use those shared physical ports, so this row adds no separate connector. https://www.powersoft.com/en/products/install-amps/mezzo-324-ad ; https://www.powersoft.com/wp-content/user_guide/PS_MEZZO_UG.pdf"},
  "mezzo-602-ad#4": {"match":{"connector":"RJ45(네트워크 포트 공용)","signal":"Dante/AES67 audio"},"ports":[],"action":"already-represented","note":"Powersoft MEZZO AD official rear-panel documentation identifies dual RJ45 network ports; Dante/AES67 audio channels use those shared physical ports, so this row adds no separate connector. https://www.powersoft.com/en/products/install-amps/mezzo-324-ad ; https://www.powersoft.com/wp-content/user_guide/PS_MEZZO_UG.pdf"},
  "mezzo-602-ad#5": {"match":{"connector":"RJ45(네트워크 포트 공용)","signal":"Dante/AES67 audio"},"ports":[],"action":"already-represented","note":"Powersoft MEZZO AD official rear-panel documentation identifies dual RJ45 network ports; Dante/AES67 audio channels use those shared physical ports, so this row adds no separate connector. https://www.powersoft.com/en/products/install-amps/mezzo-324-ad ; https://www.powersoft.com/wp-content/user_guide/PS_MEZZO_UG.pdf"},
  "mezzo-604-ad#3": {"match":{"connector":"RJ45(네트워크 포트 공용)","signal":"Dante/AES67 audio"},"ports":[],"action":"already-represented","note":"Powersoft MEZZO AD official rear-panel documentation identifies dual RJ45 network ports; Dante/AES67 audio channels use those shared physical ports, so this row adds no separate connector. https://www.powersoft.com/en/products/install-amps/mezzo-324-ad ; https://www.powersoft.com/wp-content/user_guide/PS_MEZZO_UG.pdf"},
  "mezzo-604-ad#4": {"match":{"connector":"RJ45(네트워크 포트 공용)","signal":"Dante/AES67 audio"},"ports":[],"action":"already-represented","note":"Powersoft MEZZO AD official rear-panel documentation identifies dual RJ45 network ports; Dante/AES67 audio channels use those shared physical ports, so this row adds no separate connector. https://www.powersoft.com/en/products/install-amps/mezzo-324-ad ; https://www.powersoft.com/wp-content/user_guide/PS_MEZZO_UG.pdf"},
  "blu-50v2#6": {"match":{"connector":"Phoenix/Combicon","signal":"워치독 출력"},"ports":[{"connector":"TERMINAL-BLOCK","signals":["RELAY"],"direction":"out","quantity":1}],"note":"BSS BLU-50v2 official datasheet specifies one Phoenix/Combicon watchdog output for fail-safe control; keep it separate from the six GPIO logic outputs. https://bssaudio.com/en/site_elements/data-sheet-blu-50v2"},
  "mezzo-322-ad#2": {"match":{"connector":"GPI","signal":"출력 레벨 조절용 GPI 입력"},"ports":[{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"in","quantity":2}],"note":"Powersoft MEZZO user guide documents GPI terminals I1/I2 for 2-channel models; 10 kOhm passive potentiometer control. https://www.powersoft.com/wp-content/user_guide/PS_MEZZO_UG.pdf"},
  "mezzo-322-ad#5": {"match":{"connector":"GPI","signal":"Status contact output"},"ports":[{"connector":"TERMINAL-BLOCK","signals":["RELAY"],"direction":"out","quantity":1}],"note":"Powersoft MEZZO GPIO application note documents the normally-closed status contact output on the shared terminal block. https://www.powersoft.com/en/document/gpio"},
  "pt-mz11k#2": {"match":{"connector":"D-sub 9-pin (female/male)","signal":"SERIAL/MULTI PROJECTOR SYNC IN/OUT"},"ports":[{"connector":"DSUB-9","signals":["RS-232"],"direction":"in","quantity":1},{"connector":"DSUB-9","signals":["RS-232"],"direction":"out","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz11k#3": {"match":{"connector":"D-sub 9-pin (female)","signal":"REMOTE 1 IN"},"ports":[{"connector":"DSUB-9","signals":["GPIO"],"direction":"in","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz11k#4": {"match":{"connector":"M3","signal":"REMOTE 2 IN/OUT"},"ports":[{"connector":"TRS-3.5","signals":["GPIO"],"direction":"in","quantity":1},{"connector":"TRS-3.5","signals":["GPIO"],"direction":"out","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz11k#7": {"match":{"connector":"USB Type-A","signal":"DC OUT / USB (무선 모듈/메모리)"},"ports":[{"connector":"USB-A","signals":["USB"],"direction":"both","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz14k#2": {"match":{"connector":"D-sub 9-pin (female/male)","signal":"SERIAL/MULTI PROJECTOR SYNC IN/OUT"},"ports":[{"connector":"DSUB-9","signals":["RS-232"],"direction":"in","quantity":1},{"connector":"DSUB-9","signals":["RS-232"],"direction":"out","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz14k#3": {"match":{"connector":"D-sub 9-pin (female)","signal":"REMOTE 1 IN"},"ports":[{"connector":"DSUB-9","signals":["GPIO"],"direction":"in","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz14k#4": {"match":{"connector":"M3","signal":"REMOTE 2 IN/OUT"},"ports":[{"connector":"TRS-3.5","signals":["GPIO"],"direction":"in","quantity":1},{"connector":"TRS-3.5","signals":["GPIO"],"direction":"out","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz14k#7": {"match":{"connector":"USB Type-A","signal":"DC OUT / USB (무선 모듈/메모리)"},"ports":[{"connector":"USB-A","signals":["USB"],"direction":"both","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz17k#6": {"match":{"connector":"D-Sub 9핀","signal":"SERIAL/MULTI SYNC 입력"},"ports":[{"connector":"DSUB-9","signals":["RS-232"],"direction":"in","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz17k#7": {"match":{"connector":"D-Sub 9핀","signal":"SERIAL/MULTI SYNC 출력"},"ports":[{"connector":"DSUB-9","signals":["RS-232"],"direction":"out","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz17k#8": {"match":{"connector":"D-Sub 9핀","signal":"REMOTE 1 입력"},"ports":[{"connector":"DSUB-9","signals":["GPIO"],"direction":"in","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz17k#9": {"match":{"connector":"M3 미니잭","signal":"REMOTE 2 입력/출력"},"ports":[{"connector":"TRS-3.5","signals":["GPIO"],"direction":"in","quantity":1},{"connector":"TRS-3.5","signals":["GPIO"],"direction":"out","quantity":1}],"note":"Panasonic Korean User Manual DPQP1432ZC/X1 applies to PT-MZ20K/MZ17K/MZ14K/MZ11K and labels these connectors on page 28. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz20k_manual_ko.pdf"},
  "pt-mz882#3": {"match":{"connector":"D-sub 9-pin (female/male)","signal":"SERIAL/MULTI SYNC IN/OUT"},"ports":[{"connector":"DSUB-9","signals":["RS-232"],"direction":"in","quantity":1},{"connector":"DSUB-9","signals":["RS-232"],"direction":"out","quantity":1}],"note":"Panasonic Korean User Manual DPQP1564ZA/X1 applies to PT-MZ882/MZ782/MZ682 and labels these connectors on page 27. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz882_manual_ko.pdf"},
  "pt-mz882#4": {"match":{"connector":"M3 스테레오 미니잭","signal":"REMOTE 1 IN"},"ports":[{"connector":"TRS-3.5","signals":["GPIO"],"direction":"in","quantity":1}],"note":"Panasonic Korean User Manual DPQP1564ZA/X1 applies to PT-MZ882/MZ782/MZ682 and labels these connectors on page 27. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz882_manual_ko.pdf"},
  "pt-mz882#5": {"match":{"connector":"D-sub 9-pin (female)","signal":"REMOTE 2 IN"},"ports":[{"connector":"DSUB-9","signals":["GPIO"],"direction":"in","quantity":1}],"note":"Panasonic Korean User Manual DPQP1564ZA/X1 applies to PT-MZ882/MZ782/MZ682 and labels these connectors on page 27. https://eu.connect.panasonic.com/sites/default/files/media/document/2024-04/mz882_manual_ko.pdf"},
  "brc-am7#5": {"match":{"connector":"VISCA IN RJ-45","signal":"PTZ control"},"ports":[{"connector":"RJ45","signals":["RS-422"],"direction":"in","quantity":1}],"note":"Sony BRC-AM7 model-specific Connector Block and Specifications pages: https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/connector_block.html ; https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/specifications.html"},
  "brc-am7#6": {"match":{"connector":"VISCA OUT RJ-45","signal":"PTZ control"},"ports":[{"connector":"RJ45","signals":["RS-422"],"direction":"out","quantity":1}],"note":"Sony BRC-AM7 model-specific Connector Block and Specifications pages: https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/connector_block.html ; https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/specifications.html"},
  "brc-am7#7": {"match":{"connector":"XLR 3핀","signal":"Audio"},"ports":[{"connector":"XLR","signals":["MIC-AUDIO","LINE-AUDIO"],"direction":"in","quantity":2}],"note":"Sony BRC-AM7 model-specific Connector Block and Specifications pages: https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/connector_block.html ; https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/specifications.html"},
  "brc-am7#8": {"match":{"connector":"3.5mm stereo","signal":"Audio"},"ports":[{"connector":"TRS-3.5","signals":["MIC-AUDIO"],"direction":"in","quantity":1}],"note":"Sony BRC-AM7 model-specific Connector Block and Specifications pages: https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/connector_block.html ; https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/specifications.html"},
  "hyperdeck-studio-hd-plus#1": {"match":{"connector":"6G-SDI","signal":"SDI video out + monitor"},"ports":[{"connector":"BNC","signals":["SDI"],"direction":"out","quantity":3}],"note":"Blackmagic HyperDeck Studio official tech specs and user manual: https://www.blackmagicdesign.com/kr/products/hyperdeckstudio/techspecs ; https://documents.blackmagicdesign.com/kr/UserManuals/HyperDeckHDManual.pdf?_v=1771574410000"},
  "hyperdeck-studio-hd-plus#2": {"match":{"connector":"HDMI","signal":"HDMI video"},"ports":[{"connector":"HDMI","signals":["HDMI"],"direction":"in","quantity":1},{"connector":"HDMI","signals":["HDMI"],"direction":"out","quantity":1}],"note":"Blackmagic HyperDeck Studio official tech specs and user manual: https://www.blackmagicdesign.com/kr/products/hyperdeckstudio/techspecs ; https://documents.blackmagicdesign.com/kr/UserManuals/HyperDeckHDManual.pdf?_v=1771574410000"},
  "hyperdeck-studio-hd-plus#3": {"match":{"connector":"RS-422","signal":"Deck control"},"ports":[{"connector":"DSUB-9","signals":["RS-422"],"direction":"in","quantity":1},{"connector":"DSUB-9","signals":["RS-422"],"direction":"out","quantity":1}],"note":"Blackmagic HyperDeck Studio official tech specs and user manual: https://www.blackmagicdesign.com/kr/products/hyperdeckstudio/techspecs ; https://documents.blackmagicdesign.com/kr/UserManuals/HyperDeckHDManual.pdf?_v=1771574410000"},
  "hyperdeck-studio-hd-pro#1": {"match":{"connector":"6G-SDI","signal":"SDI video out + monitor"},"ports":[{"connector":"BNC","signals":["SDI"],"direction":"out","quantity":3}],"note":"Blackmagic HyperDeck Studio official tech specs and user manual: https://www.blackmagicdesign.com/kr/products/hyperdeckstudio/techspecs ; https://documents.blackmagicdesign.com/kr/UserManuals/HyperDeckHDManual.pdf?_v=1771574410000"},
  "hyperdeck-studio-hd-pro#2": {"match":{"connector":"HDMI","signal":"HDMI video"},"ports":[{"connector":"HDMI","signals":["HDMI"],"direction":"in","quantity":1},{"connector":"HDMI","signals":["HDMI"],"direction":"out","quantity":1}],"note":"Blackmagic HyperDeck Studio official tech specs and user manual: https://www.blackmagicdesign.com/kr/products/hyperdeckstudio/techspecs ; https://documents.blackmagicdesign.com/kr/UserManuals/HyperDeckHDManual.pdf?_v=1771574410000"},
  "hyperdeck-studio-hd-pro#3": {"match":{"connector":"RS-422","signal":"Deck control"},"ports":[{"connector":"DSUB-9","signals":["RS-422"],"direction":"in","quantity":1},{"connector":"DSUB-9","signals":["RS-422"],"direction":"out","quantity":1}],"note":"Blackmagic HyperDeck Studio official tech specs and user manual: https://www.blackmagicdesign.com/kr/products/hyperdeckstudio/techspecs ; https://documents.blackmagicdesign.com/kr/UserManuals/HyperDeckHDManual.pdf?_v=1771574410000"},
  "ki-pro-go2#0": {"match":{"connector":"BNC","signal":"Video"},"ports":[{"connector":"BNC","signals":["SDI"],"direction":"in","quantity":4}],"note":"AJA Ki Pro GO2 official manual port diagram and specifications: https://www.aja.com/assets/support/files/9951/en/AJA_Ki_Pro_GO2_Manual_v5.0r1.pdf"},
  "ki-pro-go2#2": {"match":{"connector":"BNC","signal":"Video pass-through"},"ports":[{"connector":"BNC","signals":["SDI"],"direction":"out","quantity":4}],"note":"AJA Ki Pro GO2 official manual port diagram and specifications: https://www.aja.com/assets/support/files/9951/en/AJA_Ki_Pro_GO2_Manual_v5.0r1.pdf"},
  "ki-pro-go2#3": {"match":{"connector":"BNC","signal":"Monitor video"},"ports":[{"connector":"BNC","signals":["SDI"],"direction":"out","quantity":1}],"note":"AJA Ki Pro GO2 official manual port diagram and specifications: https://www.aja.com/assets/support/files/9951/en/AJA_Ki_Pro_GO2_Manual_v5.0r1.pdf"},
  "ki-pro-go2#8": {"match":{"connector":"BNC","signal":"Reference"},"ports":[{"connector":"BNC","signals":["SYNC"],"direction":"in","quantity":1},{"connector":"BNC","signals":["SYNC"],"direction":"out","quantity":1}],"note":"AJA Ki Pro GO2 official manual port diagram and specifications: https://www.aja.com/assets/support/files/9951/en/AJA_Ki_Pro_GO2_Manual_v5.0r1.pdf"},
  "dm7#2": {"match":{"connector":"XLR","signal":"AES/EBU"},"ports":[{"connector":"XLR","signals":["AES3"],"direction":"in","quantity":2}],"note":"Yamaha DM7 Korean Reference Manual: https://usa.yamaha.com/files/download/other_assets/7/2235257/DM7_RM_Ko_D0.pdf"},
  "dm7#3": {"match":{"connector":"XLR","signal":"AES/EBU"},"ports":[{"connector":"XLR","signals":["AES3"],"direction":"out","quantity":2}],"note":"Yamaha DM7 Korean Reference Manual: https://usa.yamaha.com/files/download/other_assets/7/2235257/DM7_RM_Ko_D0.pdf"},
  "nx-1200#1": {"match":{"connector":"3.5mm Screw Terminal(4-pin)","signal":"AxLink"},"ports":[{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"both","quantity":1}],"note":"AMX model datasheet lists the AxLink 4-pin screw terminal and model port count: https://www.amx.com/en-US/product_documents/nx-1200-datasheet-pdf"},
  "nx-2200#2": {"match":{"connector":"3.5mm Screw Terminal(4-pin)","signal":"AxLink"},"ports":[{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"both","quantity":1}],"note":"AMX model datasheet lists the AxLink 4-pin screw terminal and model port count: https://www.amx.com/en-US/product_documents/nx-2200-datasheet-pdf"},
  "nx-3200#2": {"match":{"connector":"3.5mm Screw Terminal(4-pin)","signal":"AxLink"},"ports":[{"connector":"TERMINAL-BLOCK","signals":["GPIO"],"direction":"both","quantity":2}],"note":"AMX model datasheet lists the AxLink 4-pin screw terminal and model port count: https://www.amx.com/en-US/product_documents/nx-3200-datasheet-pdf"},
  "confidea-flex#0": {"match":{"connector":"RJ45","signal":"Plixus 네트워크(루프스루)"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"both","quantity":2}],"note":"Televic model-specific product datasheet/product page documents conference network ports and their model-specific count/direction: https://static.televic-conference.com/datasheets/TCS_DAT_71.98.0131_ConfideaFLEX_en-US_v1.7.pdf"},
  "plixus-ae-r-dante#0": {"match":{"connector":"RJ45","signal":"회의 네트워크 포트(델리게이트 유닛)"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"both","quantity":4}],"note":"Televic model-specific product datasheet/product page documents conference network ports and their model-specific count/direction: https://www.televic.com/en/conference/products/central-equipment/plixus-aer-audio-engine-with-recording"},
  "plixus-next#0": {"match":{"connector":"RJ45 (Conference Network, Upstream)","signal":"중앙 유닛(CU) 방향 연결"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"in","quantity":2}],"note":"Televic model-specific product datasheet/product page documents conference network ports and their model-specific count/direction: https://www.televic.com/en/conference/products/central-equipment"},
  "plixus-next#1": {"match":{"connector":"RJ45 (Conference Network, Downstream)","signal":"델리게이트 유닛 방향 연결(전원 공급)"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"out","quantity":4}],"note":"Televic model-specific product datasheet/product page documents conference network ports and their model-specific count/direction: https://www.televic.com/en/conference/products/central-equipment"},
  "avhub#0": {"match":{"connector":"USB-A","signal":"USB 호스트 포트"},"ports":[{"connector":"USB-A","signals":["USB"],"direction":"both","quantity":2}],"note":"Official product specification/model guide confirms connector count and function: https://www.yealink.com/en/product-tech-specs/room-system-avhub"},
  "avhub#1": {"match":{"connector":"USB-B","signal":"PC(코덱) 연결 포트"},"ports":[{"connector":"USB-B","signals":["USB"],"direction":"both","quantity":1}],"note":"Official product specification/model guide confirms connector count and function: https://www.yealink.com/en/product-tech-specs/room-system-avhub"},
  "avhub#3": {"match":{"connector":"VCH Port (RJ-45)","signal":"카메라/마이크/스피커 PoE 연결"},"ports":[{"connector":"RJ45","signals":["ETHERNET","POE"],"direction":"both","quantity":7}],"note":"Official product specification/model guide confirms connector count and function: https://www.yealink.com/en/product-tech-specs/room-system-avhub"},
  "uvc86#1": {"match":{"connector":"USB 2.0 Type-A","signal":"확장 포트"},"ports":[{"connector":"USB-A","signals":["USB"],"direction":"both","quantity":1}],"note":"Official product specification/model guide confirms connector count and function: https://www.yealink.com/en/product-detail/compatible-camera-uvc86"},
  "uvc86#2": {"match":{"connector":"Yealink VCH Port (RJ45)","signal":"오디오 장치/BYOD 익스텐더/Yealink 코덱 연결"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"both","quantity":1}],"note":"Official product specification/model guide confirms connector count and function: https://www.yealink.com/en/product-detail/compatible-camera-uvc86"},
  "rally-bar#6": {"match":{"connector":"Proprietary mic input","signal":"External microphone"},"ports":[{"connector":"PROPRIETARY","signals":["MIC-AUDIO"],"direction":"in","quantity":1}],"note":"Official product specification/model guide confirms connector count and function: https://www.logitech.com/ko-kr/products/video-conferencing/room-solutions/rallybar.html"},
  "rally-mic-pod#1": {"match":{"connector":"12-pin","signal":"데이지체인 입력"},"ports":[{"connector":"PROPRIETARY","signals":["MIC-AUDIO"],"direction":"in","quantity":1}],"note":"Official product specification/model guide confirms connector count and function: https://www.logitech.com/en-us/products/video-conferencing/accessories/mic-pod-for-rally.html"},
  "rally-mic-pod-hub#0": {"match":{"connector":"12-pin","signal":"Mic Pod / Mic Pod Hub 연결"},"ports":[{"connector":"PROPRIETARY","signals":["MIC-AUDIO"],"direction":"both","quantity":3}],"note":"Official product specification/model guide confirms connector count and function: https://www.logitech.com/en-us/products/video-conferencing/accessories/hub-for-rally-mic-pod.html"},
  "rally-plus#3": {"match":{"connector":"RJ45","signal":"Table Hub 연결"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"both","quantity":1}],"note":"Official product specification/model guide confirms connector count and function: https://www.logitech.com/content/dam/logitech/en/video-collaboration/pdf/rally-plus.pdf"},
  "rally-plus#5": {"match":{"connector":"12-pin","signal":"Mic Pod 연결"},"ports":[{"connector":"PROPRIETARY","signals":["MIC-AUDIO"],"direction":"in","quantity":1}],"note":"Official product specification/model guide confirms connector count and function: https://www.logitech.com/content/dam/logitech/en/video-collaboration/pdf/rally-plus.pdf"},
  "ultritouch-2-hr#0": {"match":{"connector":"External DC 커넥터","signal":"15VDC"},"ports":[{"connector":"DC","signals":["POWER"],"direction":"in","quantity":2}],"note":"Ross Video official model documentation identifies these physical connectors and counts. Unimplemented HDMI/USB terminals are still physically present: https://www.rossvideo.com/products/routing-systems/ultritouch/"},
  "ultritouch-2-hr#1": {"match":{"connector":"RJ45 (8핀)","signal":"1GbE"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"both","quantity":2}],"note":"Ross Video official model documentation identifies these physical connectors and counts. Unimplemented HDMI/USB terminals are still physically present: https://www.rossvideo.com/products/routing-systems/ultritouch/"},
  "ultritouch-2-hr#2": {"match":{"connector":"HDMI","signal":""},"ports":[{"connector":"HDMI","signals":["HDMI"],"direction":"out","quantity":1}],"note":"Ross Video official model documentation identifies these physical connectors and counts. Unimplemented HDMI/USB terminals are still physically present: https://www.rossvideo.com/products/routing-systems/ultritouch/"},
  "ultritouch-2-hr#3": {"match":{"connector":"USB","signal":""},"ports":[{"connector":"USB","signals":["USB"],"direction":"both","quantity":1}],"note":"Ross Video official model documentation identifies these physical connectors and counts. Unimplemented HDMI/USB terminals are still physically present: https://www.rossvideo.com/products/routing-systems/ultritouch/"},
  "ultrix-ns-fr2#4": {"match":{"connector":"RJ45","signal":"1GbE"},"ports":[{"connector":"RJ45","signals":["ETHERNET"],"direction":"both","quantity":2}],"note":"Ross Video official model documentation identifies these physical connectors and counts. Unimplemented HDMI/USB terminals are still physically present: https://www.rossvideo.com/products/routing-systems/ultrix/ultrix-specifications/"},
  "ultripower#0": {"match":{"connector":"AC 인렛","signal":"100-264VAC, 50/60Hz"},"ports":[{"connector":"IEC","signals":["POWER"],"direction":"in","quantity":1}],"note":"Ross Video official model documentation identifies these physical connectors and counts. Unimplemented HDMI/USB terminals are still physically present: https://documentation.rossvideo.com/files/Manuals/Routers/Ultrix/Installation%20Guides/Ultrix%20Installation%20Guide%20(2101DR-003).pdf"},
  "vs10#4": {"match":{"connector":"XLR","signal":"Analog audio in/out"},"ports":[{"connector":"XLR","signals":["LINE-AUDIO"],"direction":"in","quantity":2},{"connector":"XLR","signals":["LINE-AUDIO"],"direction":"out","quantity":2}],"note":"Lumantek model-specific official manual/product material: https://www.lumantek.com/index.php/dataFunction/fileDown?location=uploads/download/6f0cb729e616d0c294f183cd48aa6b5f.pdf&name=VS10_MANUAL_ENG_211228.pdf"},
  "vs10#7": {"match":{"connector":"Remote","signal":"Remote"},"ports":[{"connector":"UNKNOWN","signals":["GPIO"],"direction":"both","quantity":1}],"note":"Lumantek model-specific official manual/product material: https://www.lumantek.com/index.php/dataFunction/fileDown?location=uploads/download/6f0cb729e616d0c294f183cd48aa6b5f.pdf&name=VS10_MANUAL_ENG_211228.pdf"},
  "ez-md-plus#5": {"match":{"connector":"D-SUB 9핀 (Female)","signal":"Audio in/out"},"ports":[{"connector":"DSUB-9","signals":["LINE-AUDIO"],"direction":"both","quantity":1}],"note":"Lumantek model-specific official manual/product material: https://lumantek.co.kr/index/product_view/44"},
  "vs5#7": {"match":{"connector":"DB9 (XLR 브레이크아웃)","signal":"Analog audio in/out"},"ports":[{"connector":"DSUB-9","signals":["LINE-AUDIO"],"direction":"both","quantity":1}],"note":"Lumantek model-specific official manual/product material: https://lumantek.co.kr/index/product_intro/74"},
  "gsm4230p#3": { match: { connector: "USB Type-C / RJ45-DB9", signal: "Console" }, ports: [{ connector: "RJ45", signals: ["RS-232"], direction: "in", quantity: 1 }, { connector: "USB-C", signals: ["USB"], direction: "in", quantity: 1 }], note: "NETGEAR M4250 Datasheet lists separate rear RJ45 RS232 Console and USB-C Console ports for GSM4230P. https://downloads1.netgear.com/files/netgear/documents/M4250-Datasheet.pdf ; https://www.netgear.com/business/wired/switches/fully-managed/gsm4230p/" },
  "gsm4230px#3": { match: { connector: "USB Type-C / RJ45-DB9", signal: "Console" }, ports: [{ connector: "RJ45", signals: ["RS-232"], direction: "in", quantity: 1 }, { connector: "USB-C", signals: ["USB"], direction: "in", quantity: 1 }], note: "NETGEAR M4250 Datasheet lists separate rear RJ45 RS232 Console and USB-C Console ports for GSM4230PX. https://downloads1.netgear.com/files/netgear/documents/M4250-Datasheet.pdf ; https://www.netgear.com/business/wired/switches/fully-managed/gsm4230p/" },
  "gsm4248p#2": { match: { connector: "USB Type-C / RJ45-DB9", signal: "Console" }, ports: [{ connector: "RJ45", signals: ["RS-232"], direction: "in", quantity: 1 }, { connector: "USB-C", signals: ["USB"], direction: "in", quantity: 1 }], note: "NETGEAR M4250 Datasheet lists separate rear RJ45 RS232 Console and USB-C Console ports for GSM4248P. https://downloads1.netgear.com/files/netgear/documents/M4250-Datasheet.pdf ; https://www.netgear.com/business/wired/switches/fully-managed/gsm4248p/" },
  "xsm4216f#1": { match: { connector: "USB Type-C / RJ45-DB9", signal: "Console" }, ports: [{ connector: "RJ45", signals: ["RS-232"], direction: "in", quantity: 1 }, { connector: "USB-C", signals: ["USB"], direction: "in", quantity: 1 }], note: "NETGEAR M4250 Datasheet lists separate rear RJ45 RS232 Console and USB-C Console ports for XSM4216F. https://downloads1.netgear.com/files/netgear/documents/M4250-Datasheet.pdf ; https://www.netgear.com/uk/business/wired/switches/fully-managed/xsm4216f/" },
  'i-tech-4x3500hd#1': {
    match: {
      connector: 'XLR-3F(아날로그·AES3 입력), etherCON/RJ-45(CobraNet·VDrive)',
      signal: 'Audio input (Analog, AES3, CobraNet, VDrive)',
    },
    ports: [
      { connector: 'XLR', signals: ['LINE-AUDIO'], direction: 'in', quantity: 4 },
      { connector: 'XLR', signals: ['AES3'], direction: 'in', quantity: 2 },
      { connector: 'RJ45', signals: ['COBRANET', 'AES3'], direction: 'in', quantity: 1 },
    ],
    note: 'Crown I-Tech HD Series Owner’s Manual, manufacturer rear-panel diagram and VDrive connector section; https://www.crownaudio.com/en-US/site_elements/i-tech-4x3500hd-manual-english',
  },
});
