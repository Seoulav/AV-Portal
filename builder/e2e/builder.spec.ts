// Builder 기본 조작 시험(통합 기획 §7.4 중 P4 항목, 기반명세 §9). 합성 라이브러리로 돌린다.
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { validateDiagram } from '../src/engine';
import { diagramText, library, libraryIndex } from './fixture';

const AUTOSAVE_KEY = 'av-portal-builder:current';
// cam(출력 2·양방향 1), disp(입력 3·양방향 1), ctl(RS-232 입력 1), mon(HDMI 입력 1)
const PLACEMENTS: [string, number, number][] = [['cam', 0, 0], ['disp', 500, 0], ['ctl', 500, 320], ['mon', 0, 320]];

type Point = { x: number; y: number };

async function openFixture(page: Page, placements: [string, number, number][] = PLACEMENTS) {
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  page.on('dialog', dialog => void dialog.accept());
  await page.goto('./');
  await expect(page.locator('.library-panel .panel-foot')).toContainText('Portal 제품 6종');
  const { text, nodeIds } = diagramText(placements);
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.diagram.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(placements.length);
  // 연 파일이 자동 저장될 때까지 기다린다(시험은 저장본으로 결과를 본다)
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key) !== null, AUTOSAVE_KEY)).toBe(true);
  const [cam, disp, ctl, mon] = nodeIds;
  return { cam, disp, ctl, mon, nodeIds };
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

test('a blocked drop says why: signal, direction, occupied and the same device', async ({ page }) => {
  const { cam, disp, ctl, mon } = await openFixture(page);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, ctl, 'in-rs-232-1'), 'left'));
  await expect(page.locator('.notice')).toContainText('신호가 맞지 않습니다');
  // 입력 → 입력
  await drag(page, await rowInside(handle(page, disp, 'in-hdmi-1'), 'left'), await rowInside(handle(page, mon, 'in-hdmi-1'), 'left'));
  await expect(page.locator('.notice')).toContainText('같은 방향');
  expect(await savedEdges(page)).toEqual([]);
  // 이미 쓴 단자만 있는 장비
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, mon, 'in-hdmi-1'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-1']);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-2'), 'right'), await rowInside(handle(page, mon, 'in-hdmi-1'), 'left'));
  await expect(page.locator('.notice')).toContainText('이미 연결된 단자');
  // 출발 장비 자신의 단자 위
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-2'), 'right'), await rowInside(handle(page, cam, 'source_both-ethernet-1'), 'right'));
  await expect(page.locator('.notice')).toContainText('같은 장비');
  expect(await savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-1']);
});

test('a bidirectional line drawn right to left attaches where the preview ring was', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  // disp(오른쪽)의 양방향 행 왼쪽 절반에서 시작해 cam(왼쪽)의 오른쪽 점 근처에 놓는다
  const start = await rowInside(handle(page, disp, 'target_both-ethernet-1'), 'left');
  const camRight = await dot(handle(page, cam, 'source_both-ethernet-1'), 'right');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(camRight.x + 12, camRight.y, { steps: 15 });
  const ring = page.locator('.connection-preview .snap-ring');
  await expect(ring).toHaveCount(1);
  const ringBox = await box(ring);
  expect(Math.abs(ringBox.x + ringBox.width / 2 - camRight.x)).toBeLessThan(6);
  await page.mouse.up();
  await expect.poll(() => savedEdges(page)).toEqual(['source_both-ethernet-1>target_both-ethernet-1']);
  const edge = (await saved(page)).edges[0];
  expect([edge.source, edge.target]).toEqual([cam, disp]);
});

test('releasing a line outside the canvas cancels it', async ({ page }) => {
  const { cam } = await openFixture(page);
  const start = await rowInside(handle(page, cam, 'out-hdmi-1'), 'right');
  const panel = await box(page.locator('.side-panel'));
  await drag(page, start, { x: panel.x + 40, y: start.y });
  const library = await box(page.locator('.library-panel'));
  await drag(page, start, { x: library.x + 40, y: start.y });
  await page.waitForTimeout(500);
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

test('after a box selection, a port row still draws a line instead of moving the group', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  const { pane, corner } = await emptyCorner(page);
  await drag(page, corner, { x: pane.x + pane.width - 30, y: pane.y + pane.height - 30 });
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(PLACEMENTS.length);
  const xs = async () => (await saved(page)).nodes.map((node: { position: { x: number } }) => node.position.x);
  const before = await xs();
  // 범위 선택은 단자도 고른다(묶음 연결). 하나만 그으려면 Esc로 단자 선택을 푼다. 장비 선택은 그대로다
  await expect(page.locator('.react-flow__handle.port-selected').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(0);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(PLACEMENTS.length);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, disp, 'in-hdmi-1'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-1']);
  expect(await xs()).toEqual(before);
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

test('drawn edges attach at the dots geometry computes', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-2'), 'right'), await rowInside(handle(page, disp, 'in-hdmi-3'), 'left'));
  await expect.poll(async () => (await savedEdges(page)).length).toBe(1);
  const file = await saved(page);
  const at = (id: string) => file.nodes.find((node: { id: string }) => node.id === id).position;
  // 엣지 경로의 처음·끝 점(캔버스 좌표)과 geometry: 출력 x = 220 + 20, 입력 x = -20, y = 12 + 54 + 행 × 28 + 12
  const d = await page.locator('.react-flow__edge path.react-flow__edge-path').first().getAttribute('d');
  const numbers = (d ?? '').match(/-?[\d.]+/g)!.map(Number);
  const [sx, sy] = numbers;
  const [tx, ty] = numbers.slice(-2);
  expect([sx, sy]).toEqual([at(cam).x + 240, at(cam).y + 12 + 54 + 28 + 12]);
  expect([tx, ty]).toEqual([at(disp).x - 20, at(disp).y + 12 + 54 + 2 * 28 + 12]);
  // 단자 점(::after)은 핸들 상자의 바깥 끝에 있다
  const dotLeft = await handle(page, disp, 'in-hdmi-3').evaluate(element => getComputedStyle(element, '::after').left);
  expect(dotLeft).toBe('0px');
});

// ── 평행선 한꺼번에 긋기(B-20261006-06, 통합 기획 §7.4 P5 항목) ──
const BUNDLE: [string, number, number][] = [['quad', 0, 0], ['wall', 500, 0]];

// quad 출력 점 4개만 덮는 사각형을 빈 캔버스(점 오른쪽 바깥)에서부터 끈다
async function boxSelectQuadOutputs(page: Page, quad: string) {
  const first = await dot(handle(page, quad, 'out-hdmi-1'), 'right');
  const last = await dot(handle(page, quad, 'out-hdmi-4'), 'right');
  await drag(page, { x: first.x + 30, y: first.y - 20 }, { x: first.x - 10, y: last.y + 20 });
}

test('box-selected ports draw parallel lines downward from the dropped port; one undo removes them all', async ({ page }) => {
  const { nodeIds: [quad, wall] } = await openFixture(page, BUNDLE);
  await boxSelectQuadOutputs(page, quad);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(4);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(0);

  // 묶음의 둘째 단자에서 끌어 wall 입력 2에 놓는다: 1번(맨 위)이 입력 2, 나머지는 아래로
  const start = await rowInside(handle(page, quad, 'out-hdmi-2'), 'right');
  const target = await rowInside(handle(page, wall, 'in-hdmi-2'), 'left');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 15 });
  await expect(page.locator('.bundle-line.snapped')).toHaveCount(4);
  await expect(page.locator('.bundle-badge')).toContainText('4/4');
  await page.mouse.up();
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-2', 'out-hdmi-2>in-hdmi-3', 'out-hdmi-3>in-hdmi-4', 'out-hdmi-4>in-hdmi-5']);
  await expect(page.locator('.notice')).toContainText('4개를 한꺼번에 연결했습니다');

  // 평행선: 꺾이는 x가 선마다 다르다(같은 x에 겹치지 않는다)
  const middles = await page.locator('.react-flow__edge path.react-flow__edge-path').evaluateAll(paths => paths.map(path => {
    const numbers = (path.getAttribute('d') ?? '').match(/-?[\d.]+/g)!.map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0).slice(1, -1).sort((a, b) => a - b);
    return Math.round(xs[Math.floor(xs.length / 2)]);
  }));
  expect(new Set(middles).size).toBe(4);

  await page.getByRole('button', { name: '실행 취소' }).click();
  await expect.poll(() => savedEdges(page)).toEqual([]);
});

test('Shift+click builds a bundle; connected targets are skipped and a shortage is reported', async ({ page }) => {
  const { nodeIds: [quad, wall] } = await openFixture(page, BUNDLE);
  // 먼저 출력 4 → 입력 3을 하나만 잇는다
  await drag(page, await rowInside(handle(page, quad, 'out-hdmi-4'), 'right'), await rowInside(handle(page, wall, 'in-hdmi-3'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-4>in-hdmi-3']);

  // 출력 1·2·3을 누르고 Shift+누르기로 고른다. 다시 Shift+누르면 빠진다
  const click = async (id: string, shift = false) => {
    const point = await rowInside(handle(page, quad, id), 'right');
    if (shift) await page.keyboard.down('Shift');
    await page.mouse.click(point.x, point.y);
    if (shift) await page.keyboard.up('Shift');
  };
  await click('out-hdmi-1');
  await click('out-hdmi-2', true);
  await click('out-hdmi-3', true);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(3);
  await click('out-hdmi-3', true);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(2);
  await click('out-hdmi-3', true);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(3);

  // 입력 2에 놓으면 1 → 2, 2 → 4(3은 이미 연결), 3 → 5
  await drag(page, await rowInside(handle(page, quad, 'out-hdmi-1'), 'right'), await rowInside(handle(page, wall, 'in-hdmi-2'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-2', 'out-hdmi-2>in-hdmi-4', 'out-hdmi-3>in-hdmi-5', 'out-hdmi-4>in-hdmi-3']);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(0);

  // 모자람: 새로 열어 네 개를 고르고 입력 4에 놓으면 4 → 6까지 세 개만 잇는다
  await page.getByRole('button', { name: '새 구성도' }).click();
  const fresh = await openFixture(page, BUNDLE);
  await boxSelectQuadOutputs(page, fresh.nodeIds[0]);
  await drag(page, await rowInside(handle(page, fresh.nodeIds[0], 'out-hdmi-1'), 'right'), await rowInside(handle(page, fresh.nodeIds[1], 'in-hdmi-4'), 'left'));
  await expect.poll(async () => (await savedEdges(page)).length).toBe(3);
  await expect(page.locator('.notice')).toContainText('4개 중 3개 연결했습니다');
  await expect(page.locator('.notice')).toContainText('대상 장비에 남은 단자 부족');
});

test('Esc and an empty-canvas click clear the port selection', async ({ page }) => {
  const { nodeIds: [quad] } = await openFixture(page, BUNDLE);
  await boxSelectQuadOutputs(page, quad);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(0);
  await boxSelectQuadOutputs(page, quad);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(4);
  const { corner } = await emptyCorner(page);
  await page.mouse.click(corner.x, corner.y);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(0);
});
