// Builder 기본 조작 시험(통합 기획 §7.4 중 P4 항목, 기반명세 §9). 합성 라이브러리로 돌린다.
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { validateDiagram } from '../src/engine';
import { diagramText, library, libraryIndex } from './fixture';

const AUTOSAVE_KEY = 'av-portal-builder:current';
// cam(출력 2·양방향 1), disp(입력 3·양방향 1), ctl(RS-232 입력 1)
const PLACEMENTS: [string, number, number][] = [['cam', 0, 0], ['disp', 500, 0], ['ctl', 500, 320]];

type Point = { x: number; y: number };

async function openFixture(page: Page) {
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  page.on('dialog', dialog => void dialog.accept());
  await page.goto('./');
  await expect(page.locator('.library-panel .panel-foot')).toContainText('Portal 제품 3종');
  const { text, nodeIds } = diagramText(PLACEMENTS);
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.diagram.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(PLACEMENTS.length);
  await page.waitForTimeout(200);
  const [cam, disp, ctl] = nodeIds;
  return { cam, disp, ctl };
}

const handle = (page: Page, nodeId: string, handleId: string) => page.locator(`.react-flow__node[data-id="${nodeId}"] .react-flow__handle[data-handleid="${handleId}"]`);
const box = async (locator: Locator) => {
  const found = await locator.boundingBox();
  if (!found) throw new Error('보이지 않는 요소');
  return found;
};
// 단자 점(핸들 바깥 끝)과 행 안쪽(점에서 60px 안으로) 화면 좌표
async function dot(locator: Locator, side: 'left' | 'right'): Promise<Point> {
  const b = await box(locator);
  return { x: side === 'left' ? b.x + 4 : b.x + b.width - 4, y: b.y + b.height / 2 };
}
async function rowInside(locator: Locator, side: 'left' | 'right'): Promise<Point> {
  const b = await box(locator);
  return { x: side === 'left' ? b.x + 60 : b.x + b.width - 60, y: b.y + b.height / 2 };
}
async function drag(page: Page, from: Point, to: Point, button: 'left' | 'middle' = 'left') {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down({ button });
  await page.mouse.move(from.x + (to.x - from.x) / 3, from.y + (to.y - from.y) / 3, { steps: 5 });
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up({ button });
}
const saved = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), AUTOSAVE_KEY);
// 저장된 엣지를 '출발 핸들>도착 핸들'로, 정렬해서 돌려준다
const savedEdges = async (page: Page): Promise<string[]> => ((await saved(page))?.edges ?? []).map((edge: { sourceHandle: string; targetHandle: string }) => `${edge.sourceHandle}>${edge.targetHandle}`).sort();
const viewport = async (page: Page) => {
  const transform = await page.locator('.react-flow__viewport').evaluate(element => (element as HTMLElement).style.transform);
  const [, x, y] = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(transform) ?? [];
  return { x: Number(x), y: Number(y) };
};
const emptyCorner = async (page: Page) => {
  const pane = await box(page.locator('.react-flow__pane'));
  return { pane, corner: { x: pane.x + 20, y: pane.y + 20 } };
};

test('a line starts anywhere on a port row and lands on the row under the pointer', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  // 단자 점이 아니라 행 안쪽(점에서 60px)에서 시작해 대상 행 안쪽에 놓는다
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, disp, 'in-hdmi-2'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-2']);
  // 입력 쪽에서 시작해도 출력 → 입력으로 저장된다
  await drag(page, await rowInside(handle(page, disp, 'in-hdmi-3'), 'left'), await rowInside(handle(page, cam, 'out-hdmi-2'), 'right'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-2', 'out-hdmi-2>in-hdmi-3']);
});

test('a drop within 40 screen px snaps to the nearest free port, and further away does nothing', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  const start = await rowInside(handle(page, cam, 'out-hdmi-1'), 'right');
  const target = await dot(handle(page, disp, 'in-hdmi-2'), 'left');
  await drag(page, start, { x: target.x - 60, y: target.y });
  await page.waitForTimeout(500);
  expect(await savedEdges(page)).toEqual([]);
  await drag(page, start, { x: target.x - 30, y: target.y + 4 });
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-2']);
  // 이미 쓴 단자는 건너뛰고 다음으로 가까운 빈 단자에 붙는다
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-2'), 'right'), { x: target.x - 12, y: target.y });
  await expect.poll(async () => (await savedEdges(page)).length).toBe(2);
  const second = (await savedEdges(page)).find((edge: string) => edge.startsWith('out-hdmi-2'));
  expect(['out-hdmi-2>in-hdmi-1', 'out-hdmi-2>in-hdmi-3']).toContain(second);
});

test('dropping on a device body picks its nearest connectable port', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  const header = await box(page.locator(`.react-flow__node[data-id="${disp}"] .node-header`));
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), { x: header.x + header.width - 10, y: header.y + 10 });
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-1']);
});

test('a blocked drop says why', async ({ page }) => {
  const { cam, ctl } = await openFixture(page);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, ctl, 'in-rs-232-1'), 'left'));
  await expect(page.locator('.notice')).toContainText('신호가 맞지 않습니다');
  expect(await savedEdges(page)).toEqual([]);
});

test('left drag on the canvas selects, middle drag and Space+left drag pan', async ({ page }) => {
  await openFixture(page);
  const { pane, corner } = await emptyCorner(page);
  await drag(page, corner, { x: pane.x + pane.width - 30, y: pane.y + pane.height - 30 });
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(PLACEMENTS.length);

  // 빈 곳을 눌러 선택을 풀고 가운데 버튼으로 끈다
  await page.mouse.click(corner.x, corner.y);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(0);
  const before = await viewport(page);
  await drag(page, corner, { x: corner.x + 120, y: corner.y + 80 }, 'middle');
  const after = await viewport(page);
  expect(Math.round(after.x - before.x)).toBe(120);
  expect(Math.round(after.y - before.y)).toBe(80);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(0);

  await page.keyboard.down('Space');
  await drag(page, { x: corner.x + 10, y: corner.y + 10 }, { x: corner.x + 70, y: corner.y + 10 });
  await page.keyboard.up('Space');
  const spaced = await viewport(page);
  expect(Math.round(spaced.x - after.x)).toBe(60);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(0);
});

test('devices move by the header, not by a port row', async ({ page }) => {
  const { cam } = await openFixture(page);
  const positionOf = async () => (await saved(page)).nodes.find((node: { id: string }) => node.id === cam).position;
  await expect.poll(async () => (await saved(page)) !== null).toBe(true);
  const start = await positionOf();
  const row = await rowInside(handle(page, cam, 'out-hdmi-1'), 'right');
  await drag(page, row, { x: row.x + 30, y: row.y + 200 });
  await page.waitForTimeout(500);
  expect(await positionOf()).toEqual(start);
  const header = await box(page.locator(`.react-flow__node[data-id="${cam}"] .node-header`));
  await drag(page, { x: header.x + 40, y: header.y + 20 }, { x: header.x + 140, y: header.y + 70 });
  await expect.poll(async () => (await positionOf()).x).toBeGreaterThan(start.x + 50);
});

test('build, export, start over and reopen gives the same file; the issue panel matches it', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, disp, 'in-hdmi-1'), 'left'));
  await drag(page, await rowInside(handle(page, cam, 'source_both-ethernet-1'), 'right'), await rowInside(handle(page, disp, 'target_both-ethernet-1'), 'left'));
  await expect.poll(async () => (await savedEdges(page)).length).toBe(2);
  expect(await savedEdges(page)).toContain('source_both-ethernet-1>target_both-ethernet-1');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '내보내기' }).click();
  const file = await download;
  const exported = readFileSync(await file.path(), 'utf8');
  const parsed = JSON.parse(exported);
  expect(validateDiagram(parsed, { library: libraryIndex }).errors).toEqual([]);

  // 이슈 패널: 내보낸 파일의 issues와 같은 수. 누르면 그 연결을 고르고 연결 편집이 열린다
  await expect(page.locator('.issues-panel .panel-title')).toContainText(String(parsed.issues.length));
  await expect(page.locator('.issue-item')).toHaveCount(parsed.issues.length);
  await page.locator('.issue-item').first().click();
  await expect(page.locator('.edge-panel')).toBeVisible();
  await expect(page.locator('.react-flow__edge.selected')).toHaveCount(1);

  await page.getByRole('button', { name: '새 구성도' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(0);
  await page.locator('input[type=file]').setInputFiles({ name: file.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(exported) });
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), AUTOSAVE_KEY)).toBe(exported);
});

test('the rendered port dots sit where geometry says lines attach', async ({ page }) => {
  const { disp } = await openFixture(page);
  // 같은 노드의 두 단자 점 간격이 행 간격(28) × 배율과 같아야 근접 연결 좌표가 그림과 맞는다
  const zoom = await page.locator('.react-flow__viewport').evaluate(element => Number(/scale\(([\d.]+)\)/.exec((element as HTMLElement).style.transform)?.[1]));
  const first = await dot(handle(page, disp, 'in-hdmi-1'), 'left');
  const third = await dot(handle(page, disp, 'in-hdmi-3'), 'left');
  expect(Math.abs((third.y - first.y) - 56 * zoom)).toBeLessThan(1);
  const nodeBox = await box(page.locator(`.react-flow__node[data-id="${disp}"]`));
  expect(Math.abs((nodeBox.x - (first.x - 4)) - 20 * zoom)).toBeLessThan(1);
});
