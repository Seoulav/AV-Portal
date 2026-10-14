// B-20261013-02: 장비 설정 창이 내려받는 Portal 반영 요청이 JSON 스키마(builder-io-request-1.0)를 통과하는지,
// 엔진의 형식 검사(validateIoRequest)와 스키마가 같은 판정을 내리는지 본다.
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import { buildIoRequest, ioRequestFileName, serializeIoRequest, validateIoRequest, type Equipment, type Port } from '../src/engine';

const schema = JSON.parse(readFileSync(new URL('../schema/builder-io-request-1.0.schema.json', import.meta.url), 'utf8'));
const validate = new Ajv({ strict: true, allErrors: true }).compile(schema);
const SIGNALS = [{ id: 'HDMI', label: 'HDMI', lineType: 'video' }, { id: 'SDI', label: 'SDI', lineType: 'sdi' }, { id: 'ETHERNET', label: 'Ethernet', lineType: 'network', symmetric: true }];

const port = (id: string, direction: Port['direction'], connector: string, signal: string, type: string, ioIndex: number, raw: [string, string, string, string, string]): Port => ({
  id, label: id, type, direction, connector, signals: [signal], verification: 'VERIFIED',
  portalIo: { group: raw[0], connector: raw[1], signal: raw[2], ioIndex, direction: raw[3], quantity: raw[4] },
});
const hdmiIn: [string, string, string, string, string] = ['Input', 'HDMI Type-A', 'HDMI 입력', 'IN', '2'];
const lan: [string, string, string, string, string] = ['Network', 'RJ-45', 'LAN', 'IN/OUT', '1'];
const equipment: Equipment = {
  id: 'fx-1', category: 'video', name: 'Switcher', model: 'FX-1',
  inputs: [port('in-hdmi-1', 'in', 'HDMI', 'HDMI', 'video', 0, hdmiIn), port('in-hdmi-2', 'in', 'HDMI', 'HDMI', 'video', 0, hdmiIn)],
  outputs: [],
  bidirectional: [port('both-ethernet-1', 'both', 'RJ45', 'ETHERNET', 'network', 1, lan)],
  portal: { productId: 'fx-1', source: 'portal', detailUrl: 'https://example.invalid/fx-1' },
};
const source = { catalogSha: 'c'.repeat(64), detailSetSha: 'd'.repeat(64), rtcomSha: 'r'.repeat(64), vocabularyVersion: '1.0.0' };

function edited() {
  return buildIoRequest({
    lists: {
      inputs: [{ id: 'in-hdmi-1', label: 'in-hdmi-1', connector: 'HDMI', signals: ['HDMI'] }, { label: 'SDI In 1', connector: 'BNC', signals: ['SDI'], origin: 'user', reason: '매뉴얼 3쪽' }],
      outputs: [],
      bidirectional: [],
    },
    data: equipment, libraryEquipment: equipment, librarySource: source, signalVocabulary: SIGNALS, createdAt: '2026-10-13T00:00:00.000Z',
  });
}

describe('Portal 반영 요청 파일', () => {
  it('설정 창의 편집으로 만든 요청이 스키마를 통과한다', () => {
    const result = edited();
    expect(result.ok).toBe(true);
    const request = JSON.parse(serializeIoRequest(result.request!));
    expect(request.changes.map((change: { op: string }) => change.op)).toEqual(['update', 'remove', 'add']);
    expect(request.changes[2]).toEqual({ op: 'add', row: { group: 'Input', connector: 'BNC', signal: 'SDI', direction: 'IN', quantity: '1' }, reason: '매뉴얼 3쪽' });
    expect(validate(request), JSON.stringify(validate.errors)).toBe(true);
    expect(validateIoRequest(request)).toEqual([]);
    expect(ioRequestFileName('fx-1', new Date(2026, 9, 13))).toBe('builder-io-request-fx-1-20261013.json');
  });

  it('스키마와 엔진 검사가 깨진 요청을 함께 거부한다', () => {
    const request = edited().request!;
    const broken: [string, (r: Record<string, unknown>) => void][] = [
      ['schemaVersion', r => { r.schemaVersion = '2.0.0'; }],
      ['알 수 없는 키', r => { r.extra = true; }],
      ['source', r => { r.source = 'other'; }],
      ['빈 changes', r => { r.changes = []; }],
      ['reason 없음', r => { delete (r.changes as Record<string, unknown>[])[0].reason; }],
      ['row 칸 없음', r => { delete ((r.changes as Record<string, unknown>[])[2].row as Record<string, unknown>).quantity; }],
      ['음수 ioIndex', r => { (r.changes as Record<string, unknown>[])[0].ioIndex = -1; }],
      ['op', r => { (r.changes as Record<string, unknown>[])[0].op = 'move'; }],
      ['library 칸', r => { r.library = { catalogSha: 'c' }; }],
    ];
    for (const [name, mutate] of broken) {
      const copy = structuredClone(request) as unknown as Record<string, unknown>;
      mutate(copy);
      expect(validate(copy), name).toBe(false);
      expect(validateIoRequest(copy).length, name).toBeGreaterThan(0);
    }
  });
});
