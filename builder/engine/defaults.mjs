// 라이브러리 없이 구성도 파일만으로 검증할 때 쓰는 기본 어휘(builder-library 어휘 1.0.0과 같은 값).
// 값이 beta/port-vocabulary.mjs와 같은지는 tests/builder-engine.test.mjs가 확인한다.

export const ENGINE_VOCABULARY_VERSION = '1.0.0';

export const DEFAULT_LINE_TYPES = Object.freeze([
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

// 1.2 파일의 lineTypes에 항상 넣는 구 Builder 운영 7종(기반명세 §5.1)
export const BASE_LINE_TYPE_IDS = Object.freeze(['audio', 'control', 'lt-1784014150344', 'network', 'sdi', 'usb', 'video']);

// 커넥터 호환(기반명세 §2.8)
export const CONNECTOR_WILDCARDS = Object.freeze({
  USB: ['USB-A', 'USB-B', 'USB-C', 'USB-MICRO', 'USB-MINI'],
  IEC: ['IEC-C13', 'IEC-C14', 'IEC-C20'],
  UNKNOWN: '*',
  CAPTIVE: '*',
});
export const CONNECTOR_EQUIVALENTS = Object.freeze([['XLR', 'XLR-COMBO'], ['TRS-6.3', 'XLR-COMBO']]);
export const LEVEL_PAIRS = Object.freeze([['LINE-AUDIO', 'MIC-AUDIO']]);
export const POWER_SIGNAL = 'POWER';

export const DEFAULT_RULES = Object.freeze({
  lineTypes: DEFAULT_LINE_TYPES,
  connectorWildcards: CONNECTOR_WILDCARDS,
  connectorEquivalents: CONNECTOR_EQUIVALENTS,
  levelPairs: LEVEL_PAIRS,
});

// 라이브러리 어휘에서 규칙 묶음을 만든다. 없으면 기본값
export function rulesFromLibrary(library) {
  if (!library) return DEFAULT_RULES;
  const vocabulary = library.vocabulary ?? {};
  return Object.freeze({
    lineTypes: library.lineTypes ?? DEFAULT_LINE_TYPES,
    connectorWildcards: vocabulary.connectorWildcards ?? CONNECTOR_WILDCARDS,
    connectorEquivalents: vocabulary.connectorEquivalents ?? CONNECTOR_EQUIVALENTS,
    levelPairs: vocabulary.levelPairs ?? LEVEL_PAIRS,
  });
}
