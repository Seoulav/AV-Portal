// 오디오 연결 판정(B-20261013-05). 커넥터 모양이 아니라 신호의 성격으로 판단한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { audioCable, audioPortTags } from '../builder/engine/audio.mjs';
import { judgeConnection } from '../builder/engine/rules.mjs';

const TYPE = { 'MIC-AUDIO': 'audio', 'LINE-AUDIO': 'audio', AES3: 'audio', SPDIF: 'audio', SPEAKER: 'speaker', HDMI: 'video', 'RS-232': 'control' };
let seq = 0;
const port = (direction, connector, signals, verification = 'VERIFIED') => {
  const list = signals.split(',');
  seq += 1;
  return { id: `${direction}-${seq}`, label: '', type: TYPE[list[0]], direction, connector, signals: list, verification };
};
const judge = (a, b) => judgeConnection({ nodeId: 'A', port: a }, { nodeId: 'B', port: b });
const codes = result => result.findings.map(finding => finding.code);
const detailOf = (result, code) => result.findings.find(finding => finding.code === code)?.detail;

test('마이크 XLR 출력 → DSP 유로블록 마이크/라인 입력: 경고 없이 케이블 안내', () => {
  const r = judge(port('out', 'XLR', 'MIC-AUDIO'), port('in', 'TERMINAL-BLOCK', 'MIC-AUDIO,LINE-AUDIO'));
  assert.equal(r.allowed, true);
  assert.deepEqual(codes(r), ['audio-cable']);
  assert.equal(detailOf(r, 'audio-cable'), 'XLR(F)–유로블록 3P 평형');
});

test('같은 계열 커넥터는 안내 없음, 추천 케이블은 계산된다', () => {
  const a = port('out', 'XLR', 'LINE-AUDIO');
  const b = port('in', 'XLR', 'MIC-AUDIO,LINE-AUDIO');
  assert.deepEqual(codes(judge(a, b)), []);
  assert.deepEqual(audioCable(a, b), { kind: 'analog', name: 'XLR(F)–XLR(M) 평형', balanced: true });
  assert.deepEqual(codes(judge(port('out', 'XLR-COMBO', 'LINE-AUDIO'), port('in', 'TRS-6.3', 'LINE-AUDIO'))), []);
});

test('레벨 차이: 방향에 따라 다른 안내', () => {
  const up = judge(port('out', 'XLR', 'MIC-AUDIO'), port('in', 'TERMINAL-BLOCK', 'LINE-AUDIO'));
  assert.equal(up.allowed, true);
  assert.deepEqual(codes(up), ['audio-cable', 'signal-level']);
  assert.match(detailOf(up, 'signal-level'), /프리앰프/);
  const down = judge(port('out', 'XLR', 'LINE-AUDIO'), port('in', 'XLR', 'MIC-AUDIO'));
  assert.deepEqual(codes(down), ['signal-level']);
  assert.match(detailOf(down, 'signal-level'), /감쇠/);
});

test('스피커 레벨 → 라인 입력은 차단', () => {
  assert.equal(judge(port('out', 'TERMINAL-BLOCK', 'SPEAKER'), port('in', 'TERMINAL-BLOCK', 'LINE-AUDIO')).code, 'signal-mismatch');
  assert.equal(judge(port('out', 'XLR', 'AES3'), port('in', 'XLR', 'LINE-AUDIO')).code, 'signal-mismatch');
});

test('불평형 ↔ 평형은 안내', () => {
  const r = judge(port('out', 'RCA', 'LINE-AUDIO'), port('in', 'XLR', 'LINE-AUDIO'));
  assert.deepEqual(codes(r), ['audio-cable', 'audio-unbalanced']);
  assert.equal(detailOf(r, 'audio-cable'), 'RCA–XLR(M) 불평형');
  assert.equal(detailOf(r, 'audio-unbalanced'), 'RCA → XLR');
});

test('스피커 케이블', () => {
  const r = judge(port('out', 'TERMINAL-BLOCK', 'SPEAKER'), port('in', 'SPEAKON', 'SPEAKER'));
  assert.equal(r.allowed, true);
  assert.deepEqual(codes(r), ['audio-cable']);
  assert.equal(detailOf(r, 'audio-cable'), '유로블록–스피콘 스피커 케이블');
});

test('AES3: 선 단자끼리는 케이블, BNC는 변환 필요', () => {
  const r = judge(port('out', 'XLR', 'AES3'), port('in', 'TERMINAL-BLOCK', 'AES3,SPDIF'));
  assert.deepEqual(codes(r), ['audio-cable']);
  assert.equal(detailOf(r, 'audio-cable'), 'XLR(F)–유로블록 3P AES 110Ω');
  assert.deepEqual(codes(judge(port('out', 'XLR', 'AES3'), port('in', 'BNC', 'AES3'))), ['connector-adapter']);
  assert.deepEqual(codes(judge(port('out', 'OPTICAL', 'SPDIF'), port('in', 'TERMINAL-BLOCK', 'AES3,SPDIF'))), ['connector-adapter']);
});

test('CAPTIVE는 오디오에서 유로블록으로 본다, UNKNOWN은 그대로 미상', () => {
  const r = judge(port('out', 'CAPTIVE', 'MIC-AUDIO'), port('in', 'XLR', 'MIC-AUDIO,LINE-AUDIO'));
  assert.deepEqual(codes(r), ['audio-cable']);
  assert.equal(detailOf(r, 'audio-cable'), '유로블록 3P–XLR(M) 평형');
  assert.deepEqual(codes(judge(port('out', 'UNKNOWN', 'LINE-AUDIO'), port('in', 'XLR', 'LINE-AUDIO'))), ['connector-unknown']);
  assert.equal(audioCable(port('out', 'UNKNOWN', 'LINE-AUDIO'), port('in', 'XLR', 'LINE-AUDIO')), null);
});

test('오디오가 아닌 연결은 지금 규칙 그대로', () => {
  assert.deepEqual(codes(judge(port('out', 'HDMI', 'HDMI'), port('in', 'DVI', 'HDMI'))), ['connector-adapter']);
  assert.deepEqual(codes(judge(port('both', 'TERMINAL-BLOCK', 'RS-232'), port('out', 'DSUB-9', 'RS-232'))), ['connector-adapter']);
  assert.equal(audioCable(port('out', 'HDMI', 'HDMI'), port('in', 'HDMI', 'HDMI')), null);
});

test('노드 배지: 커넥터 약칭과 레벨', () => {
  assert.deepEqual(audioPortTags(port('in', 'TERMINAL-BLOCK', 'MIC-AUDIO,LINE-AUDIO')), { connector: 'EB', level: 'M/L' });
  assert.deepEqual(audioPortTags(port('out', 'XLR', 'LINE-AUDIO')), { connector: 'XLR', level: 'LINE' });
  assert.deepEqual(audioPortTags(port('in', 'XLR-COMBO', 'MIC-AUDIO')), { connector: 'XLR/TRS', level: 'MIC' });
  assert.deepEqual(audioPortTags(port('out', 'TERMINAL-BLOCK', 'SPEAKER')), { connector: 'EB', level: 'SPK' });
  assert.deepEqual(audioPortTags(port('in', 'XLR', 'AES3')), { connector: 'XLR', level: 'AES' });
  assert.deepEqual(audioPortTags(port('in', 'UNKNOWN', 'LINE-AUDIO')), { connector: null, level: 'LINE' });
  assert.equal(audioPortTags(port('in', 'HDMI', 'HDMI')), null);
});
