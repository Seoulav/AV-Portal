// B-20261013-03 슬롯·카드 데이터 → 결선용 라이브러리. 생성기 규칙은 가짜 입력으로, 실제 반영 값은 현재 데이터로 본다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBuilderLibrary, buildProduct, LIBRARY_SCHEMA_VERSION, libraryReport } from '../beta/builder-library.mjs';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';

const row = (connector, signal, direction = 'IN', quantity = '1', extra = {}) => ({ group: 'Video', connector, signal, direction, quantity, protocol: '', availability: '', condition: '', source: 'D', verification: 'FOUND', ...extra });
const VIDEO = ['영상', 'Video', 'Video Processor'];
const CARD = ['영상', 'Video', 'Video Processor Card'];

// 가짜 Portal·RTCOM 입력으로 라이브러리를 만든다
function library({ portal = [], rtcom = [] } = {}) {
  const catalog = portal.map(({ slug, categories = VIDEO }) => ({ kind: 'equipment', slug, brand: 'B', product: slug, categories }));
  const details = new Map(portal.map(({ slug, detail }) => [slug, JSON.stringify({ model: slug, io: [], ...detail })]));
  const index = { products: rtcom.map(({ id, categories = VIDEO }) => ({ id, productName: id, categories, model: id })) };
  const rtcomProducts = new Map(rtcom.map(({ id, detail }) => [id, JSON.stringify(detail)]));
  return buildBuilderLibrary({ catalogRaw: JSON.stringify(catalog), details, rtcomIndexRaw: JSON.stringify(index), rtcomProducts, rtcomIds: rtcom.map(({ id }) => id) }, {});
}
const unitOf = (lib, unitId) => lib.products.flatMap(product => product.units).find(unit => unit.unitId === unitId);

const frame = (slots, io = []) => ({ slug: 'frame', detail: { io, slots } });
const card = (slug, slotType, compatibleFrames, io = [row('HDMI', 'HDMI 입력')]) => ({ slug, categories: CARD, detail: { io, slotType, compatibleFrames } });

test('library schemaVersion is 1.1.0 (slot·card fields added)', () => {
  assert.equal(LIBRARY_SCHEMA_VERSION, '1.1.0');
  assert.equal(library().schemaVersion, '1.1.0');
});

test('a Portal frame carries numbered slots, source and verification on its unit', () => {
  const lib = library({ portal: [frame({ input: 4, output: 2, source: 'D', verification: 'FOUND', note: '메모' })] });
  const { slots } = unitOf(lib, 'frame');
  assert.deepEqual(Object.keys(slots), ['input', 'output', 'shared', 'source', 'verification', 'note', 'list', 'compatibleCards']);
  assert.deepEqual([slots.input, slots.output, slots.shared, slots.source, slots.verification, slots.note], [4, 2, 0, 'D', 'FOUND', '메모']);
  assert.deepEqual(slots.list, [
    { id: 'IN1', slotType: 'input' }, { id: 'IN2', slotType: 'input' }, { id: 'IN3', slotType: 'input' }, { id: 'IN4', slotType: 'input' },
    { id: 'OUT1', slotType: 'output' }, { id: 'OUT2', slotType: 'output' },
  ]);
  assert.deepEqual(slots.compatibleCards, []);
  // 장비 객체(1.1 Equipment)는 그대로다
  assert.ok(!('slots' in unitOf(lib, 'frame').equipment));
});

test('shared-only slots are numbered S1… and the note is omitted when absent', () => {
  const { slots } = unitOf(library({ portal: [frame({ shared: 3, source: 'P', verification: 'FOUND' })] }), 'frame');
  assert.deepEqual([slots.input, slots.output, slots.shared], [0, 0, 3]);
  assert.deepEqual(slots.list.map(slot => slot.id), ['S1', 'S2', 'S3']);
  assert.ok(!('note' in slots));
});

test('cards carry slotType and compatibleFrames as unit ids; frames list compatible cards', () => {
  const lib = library({ portal: [
    frame({ input: 1, output: 1, source: 'D', verification: 'FOUND' }),
    card('card-in', 'input', ['frame']),
    card('card-out', 'output', ['frame'], [row('HDMI', 'HDMI 출력', 'OUT')]),
  ] });
  const cardIn = unitOf(lib, 'card-in');
  assert.deepEqual(cardIn.card, { slotType: 'input', compatibleFrames: ['frame'] });
  // 카드도 단독 노드로 놓을 수 있게 단자를 그대로 만든다(D2)
  assert.equal(cardIn.equipment.inputs.length, 1);
  assert.equal(lib.products.find(product => product.productId === 'card-in').placeable, true);
  assert.deepEqual(unitOf(lib, 'frame').slots.compatibleCards, ['card-in', 'card-out']);
});

test('shared slots accept input and output cards; shared cards need shared slots', () => {
  const lib = library({ portal: [frame({ shared: 4, source: 'P', verification: 'FOUND' }), card('a', 'input', ['frame']), card('b', 'output', ['frame']), card('c', 'shared', ['frame'])] });
  assert.deepEqual(unitOf(lib, 'frame').slots.compatibleCards, ['a', 'b', 'c']);
  assert.throws(() => library({ portal: [frame({ input: 2, source: 'D', verification: 'FOUND' }), card('c', 'shared', ['frame'])] }), /shared/);
});

test('compatibleFrames validation errors stop the generator', () => {
  const ok = frame({ input: 2, source: 'D', verification: 'FOUND' });
  // 없는 프레임
  assert.throws(() => library({ portal: [ok, card('c', 'input', ['nope'])] }), /compatibleFrames.*nope/);
  // 프레임에 그 종류 슬롯이 0
  assert.throws(() => library({ portal: [ok, card('c', 'output', ['frame'])] }), /output/);
  // 슬롯 정보가 없는 제품을 가리킴
  assert.throws(() => library({ portal: [{ slug: 'plain', detail: { io: [] } }, card('c', 'input', ['plain'])] }), /slots/);
  // 형식 오류
  for (const [slotType, frames] of [['in', ['frame']], ['input', 'frame'], ['input', ['frame', 'frame']], ['input', ['']], [undefined, ['frame']]]) {
    assert.throws(() => library({ portal: [ok, card('c', slotType, frames)] }), /c/, JSON.stringify([slotType, frames]));
  }
  // 빈 배열은 허용하고 "호환 대상 없는 카드"로 센다
  const lib = library({ portal: [ok, card('c', 'input', [])] });
  assert.deepEqual(unitOf(lib, 'c').card.compatibleFrames, []);
});

test('slots validation errors stop the generator', () => {
  const bad = [
    { input: -1, source: 'D', verification: 'FOUND' },
    { input: 1.5, source: 'D', verification: 'FOUND' },
    { input: '4', source: 'D', verification: 'FOUND' },
    { input: 0, output: 0, source: 'D', verification: 'FOUND' },
    { input: 2, verification: 'FOUND' },
    { input: 2, source: 'D' },
    [],
  ];
  for (const slots of bad) assert.throws(() => library({ portal: [frame(slots)] }), /slots/, JSON.stringify(slots));
  // 프레임이면서 카드인 제품
  assert.throws(() => library({ portal: [{ slug: 'x', detail: { io: [], slots: { input: 1, source: 'D', verification: 'FOUND' }, slotType: 'input', compatibleFrames: [] } }] }), /x/);
});

test('a frame with slots turns card-dependent I/O rows into slot rows and skips their max-capacity override', () => {
  const io = [
    row('Phoenix/Combicon (Analog Input Card)', 'Mic/Line 아날로그 입력', 'IN', '슬롯당 4, 최대 16', { availability: '옵션(카드 장착 시)' }),
    row('RJ-45', 'Ethernet 제어망', 'IN/OUT', '1'),
  ];
  const override = { 'frame#0': { match: { connector: io[0].connector, signal: io[0].signal }, ports: [{ connector: 'TERMINAL-BLOCK', signals: ['MIC-AUDIO'], direction: 'in', quantity: 16 }], note: '최대 용량' } };
  const input = slots => ({ productId: 'frame', source: 'portal', brand: 'B', product: 'P', categories: ['오디오', 'Audio', 'Audio Processor'], detail: { model: 'P', io, ...(slots ? { slots } : {}) } });
  // 슬롯 정보가 없으면 지금처럼 최대 용량으로 펼친다
  const before = buildProduct(input(null), override);
  assert.equal(before.units[0].equipment.inputs.length, 16);
  const after = buildProduct(input({ shared: 4, source: 'P', verification: 'FOUND' }), override);
  assert.equal(after.units[0].equipment.inputs.length, 0);
  assert.deepEqual(after.nonPort, [{ ioIndex: 0, kind: 'slot' }]);
  assert.equal(after.units[0].equipment.bidirectional.length, 1);
  assert.deepEqual(after.issues, []);
});

test('RTCOM lineup slots and card io become frame slots and card units', () => {
  const detail = {
    model: 'SPX Series', itemType: 'SERIES', io: [],
    lineup: [
      { model: 'SPX-M810', kind: '메인프레임', summary: '입력 슬롯 1 · 출력 슬롯 1', slots: { input: 1, output: 1, source: 'C', verification: 'VERIFIED' } },
      { model: 'SPX-M3236', kind: '메인프레임', summary: '입력 슬롯 4 · 출력 슬롯 3', slots: { input: 4, output: 3, source: 'C', verification: 'VERIFIED', note: '후면 왼쪽부터' } },
      { model: 'SPX-M24120', kind: '메인프레임', summary: '슬롯 정보 없음' },
      { model: 'SPX-HOS10', kind: '출력 카드', summary: 'HDMI 출력 10', slotType: 'output', compatibleFrames: ['SPX-M810', 'SPX-M3236'], io: [
        { group: 'Video', connector: 'HDMI', signal: 'HDMI', direction: 'OUT', quantity: '10', protocol: 'HDMI 2.0b', condition: '', source: 'C', verification: 'VERIFIED' },
        { group: 'Audio', connector: '3-pin 피닉스', signal: 'Analog Audio', direction: 'OUT', quantity: '2', protocol: '', condition: '', source: 'C', verification: 'VERIFIED' },
      ] },
      { model: 'SPX-HIS8', kind: '입력 카드', summary: '카드 정보 없음' },
      { model: 'SPX-TX', kind: '전송기', summary: '전송기' },
    ],
  };
  const lib = library({ rtcom: [{ id: 'spx', detail }] });
  const product = lib.products.find(item => item.productId === 'rtcom-spx');
  assert.deepEqual(product.units.map(unit => unit.unitId), ['rtcom-spx:spx-m810', 'rtcom-spx:spx-m3236', 'rtcom-spx:spx-m24120', 'rtcom-spx:spx-hos10']);
  const m3236 = unitOf(lib, 'rtcom-spx:spx-m3236');
  assert.deepEqual(m3236.slots.list.map(slot => slot.id), ['IN1', 'IN2', 'IN3', 'IN4', 'OUT1', 'OUT2', 'OUT3']);
  assert.equal(m3236.slots.note, '후면 왼쪽부터');
  assert.deepEqual(m3236.slots.compatibleCards, ['rtcom-spx:spx-hos10']);
  assert.ok(!('slots' in unitOf(lib, 'rtcom-spx:spx-m24120')));
  const hos10 = unitOf(lib, 'rtcom-spx:spx-hos10');
  assert.equal(hos10.variant, 'SPX-HOS10');
  assert.deepEqual(hos10.card, { slotType: 'output', compatibleFrames: ['rtcom-spx:spx-m810', 'rtcom-spx:spx-m3236'] });
  assert.equal(hos10.equipment.model, 'SPX-HOS10');
  assert.equal(hos10.equipment.outputs.filter(port => port.signals[0] === 'HDMI').length, 10);
  // 카드 io 행도 준비도와 확인 필요 목록에 들어간다(어느 카드의 행인지 variant로 표시)
  assert.equal(product.readiness.ioRows, 2);
  for (const item of [...product.unresolved, ...product.nonPort]) assert.equal(item.variant, 'SPX-HOS10');
  const report = libraryReport(lib);
  assert.deepEqual([report.slotFrames, report.cards, report.cardsWithoutFrames], [2, 1, 0]);
  // 없는 모델을 가리키면 오류
  const broken = structuredClone(detail);
  broken.lineup[3].compatibleFrames = ['SPX-M9999'];
  assert.throws(() => library({ rtcom: [{ id: 'spx', detail: broken }] }), /SPX-M9999/);
});

test('an RTCOM product (spx-r6 shape) with top-level shared slots is a frame', () => {
  const lib = library({ rtcom: [{ id: 'spx-r6', detail: { model: 'SPX-R6', itemType: 'PRODUCT', io: [], slots: { shared: 6, source: 'S1', verification: 'VERIFIED', note: '모듈 칸 1~6' } } }] });
  assert.deepEqual(unitOf(lib, 'rtcom-spx-r6').slots.list.map(slot => slot.id), ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']);
});

test('report counts frames, cards and cards without a frame', () => {
  const lib = library({ portal: [frame({ input: 1, source: 'D', verification: 'FOUND' }), card('a', 'input', ['frame']), card('b', 'input', [])] });
  const report = libraryReport(lib);
  assert.deepEqual([report.slotFrames, report.cards, report.cardsWithoutFrames], [1, 2, 1]);
});

// ── 현재 Portal 데이터에 반영한 값 ──
let cached;
const real = async () => (cached ??= await expectedBuilderLibrary());
const H_INPUT = ['h-input-card-12g-sdi', 'h-input-card-2xhdmi20-2xdp12', 'h-input-card-4x3g-sdi', 'h-input-card-4xhdmi', 'h-input-card-dp12-4k', 'h-input-card-hdmi20-4k', 'h-input-card-hdmi20-dp12-4k'];
const H_OUTPUT = ['h-output-card-4xhdmi-dl', 'h-output-card-hdmi20-4k'];

test('NovaStar H2·H5 slots come from their existing slot rows (H5 MVR count stays out)', async () => {
  const lib = await real();
  const h2 = unitOf(lib, 'novastar-h2').slots;
  const h5 = unitOf(lib, 'novastar-h5').slots;
  assert.deepEqual([h2.input, h2.output, h2.shared, h2.source, h2.verification], [4, 2, 0, 'D', 'FOUND']);
  assert.deepEqual([h5.input, h5.output, h5.shared, h5.source, h5.verification], [10, 3, 0, 'D', 'FOUND']);
  assert.match(h2.note, /프리뷰/);
  assert.match(h5.note, /MVR/);
});

test('NovaStar H cards fit the frames their datasheets list', async () => {
  const lib = await real();
  for (const id of H_INPUT) assert.deepEqual(unitOf(lib, id).card, { slotType: 'input', compatibleFrames: ['novastar-h2', 'novastar-h5'] }, id);
  for (const id of H_OUTPUT) assert.deepEqual(unitOf(lib, id).card, { slotType: 'output', compatibleFrames: ['novastar-h2', 'novastar-h5'] }, id);
  // 프리뷰 카드: H2는 입력·프리뷰 겸용 슬롯, H5는 수량 미확인 MVR 전용 슬롯이라 H2만
  assert.deepEqual(unitOf(lib, 'h-preview-card-2xrj45-1xhdmi13').card, { slotType: 'input', compatibleFrames: ['novastar-h2'] });
  assert.deepEqual(unitOf(lib, 'novastar-h5').slots.compatibleCards, [...H_INPUT, ...H_OUTPUT].sort());
});

test('BSS BLU-160 has four shared card slots and card I/O comes from installed cards', async () => {
  const lib = await real();
  const blu160 = lib.products.find(product => product.productId === 'blu-160');
  const { slots, equipment } = blu160.units[0];
  assert.deepEqual([slots.input, slots.output, slots.shared, slots.source, slots.verification], [0, 0, 4, 'P', 'FOUND']);
  assert.deepEqual(slots.compatibleCards, ['blu-aec-in', 'blucard-in', 'blucard-out']);
  // 최대 용량 펼침(카드 I/O 0~4행)은 끄고 슬롯 행으로 둔다
  for (const index of [0, 1, 2, 3, 4]) assert.deepEqual(blu160.nonPort.find(item => item.ioIndex === index), { ioIndex: index, kind: 'slot' });
  assert.equal([...equipment.inputs, ...equipment.outputs].filter(port => /AUDIO|AES3/.test(port.signals[0])).length, 0);
  assert.deepEqual(unitOf(lib, 'blucard-in').card, { slotType: 'input', compatibleFrames: ['blu-160'] });
  assert.deepEqual(unitOf(lib, 'blucard-out').card, { slotType: 'output', compatibleFrames: ['blu-160'] });
  assert.deepEqual(unitOf(lib, 'blu-aec-in').card, { slotType: 'input', compatibleFrames: ['blu-160'] });
});
