// 슬롯 탭 브라우저 시험(B-20261013-04): H2 모양 프레임에 입력 카드 2장·출력 카드 1장 장착 → 결선 → 한 슬롯 카드 교체(확인) → 다른 슬롯 연결 유지.
// RTCOM SPX 모양 시리즈 프레임(단위 ID에 ':')도 같은 흐름인지 본다. 라이브러리는 합성 값이다(실제 Portal 데이터가 바뀌어도 흔들리지 않게).
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { addEquipmentNode, createDiagram, createIdFactory, createLibraryIndex, serializeDiagram, validateDiagram, type Library } from '../src/engine';
import { library as baseLibrary } from './fixture';

const AUTOSAVE_KEY = 'av-portal-builder:current';
type Direction = 'in' | 'out' | 'both';
const port = (id: string, direction: Direction, label: string) => ({ id, label, type: 'video', direction, connector: 'HDMI', signals: ['HDMI'], verification: 'FOUND' });
const ins = (n: number) => Array.from({ length: n }, (_, i) => port(`in-hdmi-${i + 1}`, 'in', `HDMI In ${i + 1}`));
const outs = (n: number) => Array.from({ length: n }, (_, i) => port(`out-hdmi-${i + 1}`, 'out', `HDMI Out ${i + 1}`));
const equipment = (id: string, model: string, ports: ReturnType<typeof port>[], portal: Record<string, string> = {}) => ({
  id, category: 'video', name: 'Video Processor', model, manufacturer: 'Test',
  inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: '', ...portal },
});
const slotList = (prefix: string, n: number, slotType: string) => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i + 1}`, slotType }));
const readiness = { ioRows: 1, ports: 1, unresolvedRows: 0, nonPortRows: 0 };
const portalProduct = (id: string, model: string, ports: ReturnType<typeof port>[], extra: Record<string, unknown>) => ({
  productId: id, source: 'portal', brand: 'Test', product: model, categories: ['시험', 'Video', 'Device'], detailUrl: '', placeable: true, readiness,
  units: [{ unitId: id, equipment: equipment(id, model, ports), ...extra }],
});
const spx = (slug: string, model: string, ports: ReturnType<typeof port>[], extra: Record<string, unknown>) => ({
  unitId: `rtcom-spx:${slug}`, variant: model, equipment: equipment(`rtcom-spx:${slug}`, model, ports, { productId: 'rtcom-spx', source: 'rtcom', variant: model }), ...extra,
});
const library = {
  ...baseLibrary,
  schemaVersion: '1.1.0',
  products: [
    ...baseLibrary.products,
    portalProduct('h2', 'H2', [], { slots: { input: 2, output: 1, shared: 0, source: 'D', verification: 'FOUND', list: [...slotList('IN', 2, 'input'), ...slotList('OUT', 1, 'output')], compatibleCards: ['card-4hdmi', 'card-1hdmi', 'card-out'] } }),
    portalProduct('card-4hdmi', 'H_4xHDMI Input Card', ins(4), { card: { slotType: 'input', compatibleFrames: ['h2'] } }),
    portalProduct('card-1hdmi', 'H_1xHDMI Input Card', ins(1), { card: { slotType: 'input', compatibleFrames: ['h2'] } }),
    portalProduct('card-out', 'H_2xHDMI Output Card', outs(2), { card: { slotType: 'output', compatibleFrames: ['h2'] } }),
    {
      productId: 'rtcom-spx', source: 'rtcom', brand: 'RTCOM', product: 'SPX Series', categories: ['시험', 'Video', 'Device'], detailUrl: '', placeable: true, readiness,
      units: [
        spx('spx-m810', 'SPX-M810', [], { slots: { input: 1, output: 1, shared: 0, source: 'M1', verification: 'VERIFIED', list: [...slotList('IN', 1, 'input'), ...slotList('OUT', 1, 'output')], compatibleCards: ['rtcom-spx:spx-his8', 'rtcom-spx:spx-hos12'] } }),
        spx('spx-his8', 'SPX-HIS8', ins(2), { card: { slotType: 'input', compatibleFrames: ['rtcom-spx:spx-m810'] } }),
        spx('spx-hos12', 'SPX-HOS12', outs(2), { card: { slotType: 'output', compatibleFrames: ['rtcom-spx:spx-m810'] } }),
      ],
    },
  ],
};
const libraryIndex = createLibraryIndex(library as unknown as Library);

async function open(page: Page, units: [string, number, number][]) {
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  await expect(page.locator('.library-panel .panel-foot')).toBeVisible();
  const diagram = createDiagram({ library: libraryIndex });
  const ids = createIdFactory({ seed: 11, now: 0 });
  const nodeIds = units.map(([unit, x, y]) => addEquipmentNode(diagram, libraryIndex.units.get(unit)!.equipment, { position: { x, y }, ids }).id);
  const text = serializeDiagram(diagram, { library: libraryIndex });
  await page.locator('input[type=file]').setInputFiles({ name: 'slots.diagram.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(units.length);
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key) !== null, AUTOSAVE_KEY)).toBe(true);
  return nodeIds;
}
const saved = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), AUTOSAVE_KEY);
const savedNode = async (page: Page, id: string) => (await saved(page)).nodes.find((n: { id: string }) => n.id === id).data;
const savedEdges = async (page: Page): Promise<string[]> => ((await saved(page))?.edges ?? []).map((edge: { sourceHandle: string; targetHandle: string }) => `${edge.sourceHandle}>${edge.targetHandle}`).sort();
const handle = (page: Page, nodeId: string, handleId: string) => page.locator(`.react-flow__node[data-id="${nodeId}"] .react-flow__handle[data-handleid="${handleId}"]`);
async function rowInside(locator: Locator, side: 'left' | 'right') {
  const b = await locator.boundingBox();
  if (!b) throw new Error('보이지 않는 요소');
  return { x: side === 'left' ? b.x + 60 : b.x + b.width - 60, y: b.y + b.height / 2 };
}
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + (to.x - from.x) / 3, from.y + (to.y - from.y) / 3, { steps: 5 });
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
}
const connect = async (page: Page, from: [string, string], to: [string, string]) => drag(page, await rowInside(handle(page, ...from), 'right'), await rowInside(handle(page, ...to), 'left'));
const openSettings = async (page: Page, nodeId: string) => {
  await page.getByRole('button', { name: 'Fit View' }).click();
  await page.locator(`.react-flow__node[data-id="${nodeId}"] .node-header`).dblclick();
  const dialog = page.getByRole('dialog', { name: '장비 설정' });
  await expect(dialog).toBeVisible();
  return dialog;
};

test('H2: mount 2 input cards and 1 output card, connect, swap one card with confirmation, other slots keep their edges', async ({ page }) => {
  const [h2, quad, wall] = await open(page, [['h2', 400, 0], ['quad', 0, 0], ['wall', 800, 0]]);
  // 슬롯 탭은 슬롯 정보가 있는 프레임에만 있다
  let dialog = await openSettings(page, quad);
  await expect(dialog.getByRole('tab', { name: /슬롯/ })).toHaveCount(0);
  await page.keyboard.press('Escape');

  dialog = await openSettings(page, h2);
  await dialog.getByRole('tab', { name: '슬롯 0/3' }).click();
  // 입력 슬롯엔 입력 카드만 보인다
  await expect(dialog.getByLabel('슬롯 IN1 카드').locator('option')).toHaveText(['비움', 'H_4xHDMI Input Card', 'H_1xHDMI Input Card']);
  await expect(dialog.getByLabel('슬롯 OUT1 카드').locator('option')).toHaveText(['비움', 'H_2xHDMI Output Card']);
  await dialog.getByLabel('슬롯 IN1 카드').selectOption('card-4hdmi');
  await dialog.getByLabel('슬롯 IN2 카드').selectOption('card-1hdmi');
  await dialog.getByLabel('슬롯 OUT1 카드').selectOption('card-out');
  await expect(dialog.getByRole('tab', { name: '슬롯 3/3' })).toBeVisible();
  await dialog.getByRole('button', { name: '적용' }).click();
  await expect(dialog).toHaveCount(0);

  // 카드 단자가 슬롯 번호를 단 이름으로 노드에 생긴다
  await expect(page.locator(`.react-flow__node[data-id="${h2}"]`)).toContainText('IN2 HDMI In 1');
  await expect.poll(async () => (await savedNode(page, h2)).slotAssignments).toEqual({ IN1: 'card-4hdmi', IN2: 'card-1hdmi', OUT1: 'card-out' });
  const data = await savedNode(page, h2);
  expect(data.inputs.map((p: { id: string }) => p.id)).toEqual(['opt-card-4hdmi-IN1-in-hdmi-1', 'opt-card-4hdmi-IN1-in-hdmi-2', 'opt-card-4hdmi-IN1-in-hdmi-3', 'opt-card-4hdmi-IN1-in-hdmi-4', 'opt-card-1hdmi-IN2-in-hdmi-1']);
  expect(data.selectedOptionQuantities).toEqual({ 'portal-option:card-4hdmi': 1, 'portal-option:card-1hdmi': 1, 'portal-option:card-out': 1 });

  // 결선: IN1 카드, IN2 카드, OUT1 카드
  await connect(page, [quad, 'out-hdmi-1'], [h2, 'opt-card-4hdmi-IN1-in-hdmi-1']);
  await connect(page, [quad, 'out-hdmi-2'], [h2, 'opt-card-1hdmi-IN2-in-hdmi-1']);
  await connect(page, [h2, 'opt-card-out-OUT1-out-hdmi-1'], [wall, 'in-hdmi-1']);
  await expect.poll(() => savedEdges(page)).toEqual(['opt-card-out-OUT1-out-hdmi-1>in-hdmi-1', 'out-hdmi-1>opt-card-4hdmi-IN1-in-hdmi-1', 'out-hdmi-2>opt-card-1hdmi-IN2-in-hdmi-1']);

  // IN2 카드를 바꾼다: 확인 없이는 적용되지 않는다
  dialog = await openSettings(page, h2);
  await dialog.getByRole('tab', { name: /슬롯/ }).click();
  await expect(dialog.locator('.slot-row[data-slot-id="IN2"]')).toContainText('연결 1');
  await dialog.getByLabel('슬롯 IN2 카드').selectOption('card-4hdmi');
  await dialog.getByRole('button', { name: '적용' }).click();
  const confirm = dialog.getByRole('alertdialog', { name: '연결 삭제 확인' });
  await expect(confirm).toContainText('연결 1개도 함께 지웁니다');
  await confirm.getByRole('button', { name: '돌아가기' }).click();
  expect((await savedNode(page, h2)).slotAssignments.IN2).toBe('card-1hdmi');
  await dialog.getByRole('button', { name: '적용' }).click();
  await confirm.getByRole('button', { name: '연결도 지우고 적용' }).click();
  await expect(dialog).toHaveCount(0);
  // 바꾼 슬롯 연결만 지워지고 IN1·OUT1 연결은 그대로다
  await expect.poll(() => savedEdges(page)).toEqual(['opt-card-out-OUT1-out-hdmi-1>in-hdmi-1', 'out-hdmi-1>opt-card-4hdmi-IN1-in-hdmi-1']);
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);

  // 내보낸 JSON: 1.2 검증 통과, 카드 품목 수량과 정의
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '내보내기' }).click();
  const exported = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
  expect(validateDiagram(exported, { library: libraryIndex }).errors).toEqual([]);
  const node = exported.nodes.find((n: { id: string }) => n.id === h2).data;
  expect(node.selectedOptionQuantities).toEqual({ 'portal-option:card-4hdmi': 2, 'portal-option:card-out': 1 });
  expect(exported.options.map((o: { id: string }) => o.id)).toEqual(['portal-option:card-4hdmi', 'portal-option:card-1hdmi', 'portal-option:card-out']);
  expect(exported.issues.filter((i: { target: { node?: string } }) => i.target.node === h2)).toEqual([]);

  // 다시 열기(가져오기) 후에도 같다
  await page.locator('input[type=file]').setInputFiles({ name: 'again.diagram.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  await expect.poll(() => savedEdges(page)).toEqual(['opt-card-out-OUT1-out-hdmi-1>in-hdmi-1', 'out-hdmi-1>opt-card-4hdmi-IN1-in-hdmi-1']);
  dialog = await openSettings(page, h2);
  await expect(dialog.getByRole('tab', { name: '슬롯 3/3' })).toBeVisible();
});

test('RTCOM SPX series frame: same slot flow, no series-config-pending', async ({ page }) => {
  const [frame, quad] = await open(page, [['rtcom-spx:spx-m810', 400, 0], ['quad', 0, 0]]);
  await expect.poll(async () => (await saved(page)).issues.filter((i: { target: { node?: string } }) => i.target.node === frame).map((i: { code: string }) => i.code)).toEqual(['no-ports', 'slot-empty']);
  const dialog = await openSettings(page, frame);
  await dialog.getByRole('tab', { name: '슬롯 0/2' }).click();
  await dialog.getByLabel('슬롯 IN1 카드').selectOption('rtcom-spx:spx-his8');
  await dialog.getByRole('button', { name: '적용' }).click();
  await expect(dialog).toHaveCount(0);
  await connect(page, [quad, 'out-hdmi-1'], [frame, 'opt-rtcom-spx:spx-his8-IN1-in-hdmi-2']);
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>opt-rtcom-spx:spx-his8-IN1-in-hdmi-2']);
  const data = await savedNode(page, frame);
  expect(data.selectedOptionQuantities).toEqual({ 'portal-option:rtcom-spx:spx-his8': 1 });
  const all = await saved(page);
  expect(all.options).toEqual([{ id: 'portal-option:rtcom-spx:spx-his8', model: 'SPX-HIS8', name: 'SPX-HIS8', manufacturer: 'RTCOM' }]);
  expect(all.issues.filter((i: { target: { node?: string } }) => i.target.node === frame)).toEqual([]);
});
