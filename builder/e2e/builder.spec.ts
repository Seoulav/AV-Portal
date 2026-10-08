// Builder 기본 조작 시험(통합 기획 §7.4 중 P4 항목, 기반명세 §9). 합성 라이브러리로 돌린다.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { validateDiagram } from '../src/engine';
import { diagramText, library, libraryIndex } from './fixture';

const AUTOSAVE_KEY = 'av-portal-builder:current';
// cam(출력 2·양방향 1), disp(입력 3·양방향 1), ctl(RS-232 입력 1), mon(HDMI 입력 1)
const PLACEMENTS: [string, number, number][] = [['cam', 0, 0], ['disp', 500, 0], ['ctl', 500, 320], ['mon', 0, 320]];

type Point = { x: number; y: number };

async function openFixture(page: Page, placements: [string, number, number][] = PLACEMENTS, links: [number, string, number, string][] = []) {
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  page.on('dialog', dialog => void dialog.accept());
  await page.goto('./');
  await expect(page.locator('.library-panel .panel-foot')).toContainText('Portal 제품 6종');
  const { text, nodeIds } = diagramText(placements, links);
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

test('Shift+click tolerates a small slip, and a drag cancelled on its own row keeps the bundle', async ({ page }) => {
  const { nodeIds: [quad] } = await openFixture(page, BUNDLE);
  const rowOf = (id: string) => rowInside(handle(page, quad, id), 'right');
  // 누른 뒤 2px 미끄러져도 Shift+누르기다(React Flow가 범위 선택을 시작하지 않는다)
  const slipClick = async (id: string) => {
    const point = await rowOf(id);
    await page.keyboard.down('Shift');
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 2, point.y + 1);
    await page.mouse.up();
    await page.keyboard.up('Shift');
  };
  await page.mouse.click((await rowOf('out-hdmi-1')).x, (await rowOf('out-hdmi-1')).y);
  await slipClick('out-hdmi-2');
  await slipClick('out-hdmi-3');
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(3);

  // 묶음을 끌다가 같은 행으로 돌아와 놓으면 연결도 없고 선택도 그대로다
  const start = await rowOf('out-hdmi-2');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x - 80, start.y + 40, { steps: 8 });
  await page.mouse.move(start.x, start.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await savedEdges(page)).toEqual([]);
  await expect(page.locator('.react-flow__handle.port-selected')).toHaveCount(3);
});

// ── 선 그리기 이식(B-20261006-07, 구 Builder edgeProcessing·edgeGeometry) ──
// 그려진 엣지 경로(캔버스 좌표)에서 세로 구간을 뽑는다. M·L·Q·A 명령만 쓴다
type Segment = { edge: number; x: number; y1: number; y2: number };
async function renderedPaths(page: Page) {
  return page.locator('.react-flow__edge path.react-flow__edge-path').evaluateAll(paths => paths.map(path => path.getAttribute('d') ?? ''));
}
function verticalsOf(paths: string[]): Segment[] {
  const segments: Segment[] = [];
  paths.forEach((d, edge) => {
    const tokens = d.match(/[MLQA]|-?[\d.]+/g) ?? [];
    let cur = { x: 0, y: 0 };
    for (let i = 0; i < tokens.length;) {
      const command = tokens[i++];
      const take = (n: number) => { const values = tokens.slice(i, i + n).map(Number); i += n; return values; };
      if (command === 'M') { const [x, y] = take(2); cur = { x, y }; }
      else if (command === 'L') {
        const [x, y] = take(2);
        if (Math.abs(x - cur.x) < 0.5 && Math.abs(y - cur.y) > 1) segments.push({ edge, x, y1: Math.min(y, cur.y), y2: Math.max(y, cur.y) });
        cur = { x, y };
      }
      else if (command === 'Q') { const [, , x, y] = take(4); cur = { x, y }; }
      else if (command === 'A') { const [, , , , , x, y] = take(7); cur = { x, y }; }
    }
  });
  return segments;
}
const overlapping = (segments: Segment[]) => segments.filter((p, i) => segments.some((q, j) => j > i && q.edge !== p.edge && Math.abs(p.x - q.x) < 1 && Math.min(p.y2, q.y2) - Math.max(p.y1, q.y1) > 4)).length;

test('fan-in and fan-out lines keep separate vertical runs (old Builder edgeProcessing)', async ({ page }) => {
  // cam 4대 → wall 입력 1~4(모임), quad 출력 1~4 → mon 4대(퍼짐)
  const placements: [string, number, number][] = [
    ['cam', 0, 0], ['cam', 0, 230], ['cam', 0, 460], ['cam', 0, 690], ['wall', 600, 250],
    ['quad', 1100, 300], ['mon', 1700, 0], ['mon', 1700, 200], ['mon', 1700, 400], ['mon', 1700, 600],
  ];
  const links: [number, string, number, string][] = [
    [0, 'out-hdmi-1', 4, 'in-hdmi-1'], [1, 'out-hdmi-1', 4, 'in-hdmi-2'], [2, 'out-hdmi-1', 4, 'in-hdmi-3'], [3, 'out-hdmi-1', 4, 'in-hdmi-4'],
    [5, 'out-hdmi-1', 6, 'in-hdmi-1'], [5, 'out-hdmi-2', 7, 'in-hdmi-1'], [5, 'out-hdmi-3', 8, 'in-hdmi-1'], [5, 'out-hdmi-4', 9, 'in-hdmi-1'],
  ];
  await openFixture(page, placements, links);
  await expect(page.locator('.react-flow__edge')).toHaveCount(8);
  const segments = verticalsOf(await renderedPaths(page));
  expect(segments.length).toBeGreaterThanOrEqual(6);
  expect(overlapping(segments)).toBe(0);
});

test('a crossing gets a jump arc on the horizontal line (old Builder edgeGeometry)', async ({ page }) => {
  // 위 cam(출력 y 78) → 아래 mon(입력 y 678), 가운데 cam(출력 y 378) → 위 mon(입력 y -122).
  // 아래로 가는 선의 가로 구간을 위로 가는 선의 세로 구간이 가로지른다
  await openFixture(page, [['cam', 0, 0], ['cam', 0, 300], ['mon', 600, 600], ['mon', 600, -200]], [[0, 'out-hdmi-1', 2, 'in-hdmi-1'], [1, 'out-hdmi-1', 3, 'in-hdmi-1']]);
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  const paths = await renderedPaths(page);
  expect(paths.filter(d => / A 6 6 0 0 [01] /.test(d))).toHaveLength(1);
});

test('a bidirectional line is redrawn left to right after its devices swap sides', async ({ page }) => {
  const { nodeIds: [cam, disp] } = await openFixture(page, [['cam', 0, 0], ['disp', 600, 0]], [[0, 'both-ethernet-1', 1, 'both-ethernet-1']]);
  // React Flow가 잰 핸들 좌표라 소수점 끝이 조금 다르다. 정수로 맞춰 본다
  const startX = async () => Math.round(Number((await renderedPaths(page))[0].match(/^M (-?[\d.]+)/)![1]));
  const positionOf = async (id: string) => (await saved(page)).nodes.find((node: { id: string }) => node.id === id).position;
  expect(await startX()).toBe((await positionOf(cam)).x + 240);
  // cam을 disp 오른쪽으로 옮기면 선은 disp의 오른쪽에서 나와 cam의 왼쪽으로 들어간다. 저장된 source는 그대로 cam이다
  const header = await box(page.locator(`.react-flow__node[data-id="${cam}"] .node-header`));
  const target = await box(page.locator(`.react-flow__node[data-id="${disp}"] .node-header`));
  await drag(page, { x: header.x + 40, y: header.y + 20 }, { x: target.x + target.width + 260, y: header.y + 20 });
  await expect.poll(async () => (await positionOf(cam)).x).toBeGreaterThan((await positionOf(disp)).x + 220);
  await expect.poll(startX).toBe((await positionOf(disp)).x + 240);
  expect((await saved(page)).edges[0].source).toBe(cam);
});

test('cable view labels every connection with its cable or a missing mark (old Builder BOM mode)', async ({ page }) => {
  await openFixture(page, [['quad', 0, 0], ['wall', 600, 0]], [[0, 'out-hdmi-1', 1, 'in-hdmi-1'], [0, 'out-hdmi-2', 1, 'in-hdmi-2']]);
  await page.getByRole('button', { name: '케이블 보기' }).click();
  await expect(page.locator('.edge-label.missing')).toHaveCount(2);
  // 연결 하나를 골라 케이블을 넣는다
  await page.locator('.react-flow__edge').first().click({ force: true });
  await page.getByRole('button', { name: '케이블 추가' }).click();
  await page.getByPlaceholder('제품명').fill('HDMI 3m');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.locator('.edge-label.cable:not(.missing)')).toHaveText('HDMI 3m  ×1');
  await expect(page.locator('.edge-label.missing')).toHaveCount(1);
  await page.getByRole('button', { name: '케이블 보기' }).click();
  await expect(page.locator('.edge-label')).toHaveCount(0);
});

test('the single-line preview of a bidirectional link matches the line drawn after the drop', async ({ page }) => {
  // disp(오른쪽)의 양방향 행 오른쪽 절반(source_)을 잡아 cam(왼쪽) 몸체에 놓는다.
  // 저장되면 양방향끼리라 좌우에 맞게 뒤집혀 cam의 오른쪽 점에서 disp의 왼쪽 점으로 그려진다. 미리보기 고리도 cam의 오른쪽 점이어야 한다
  const { nodeIds: [cam, disp] } = await openFixture(page, [['cam', 0, 0], ['disp', 600, 0]]);
  const start = await rowInside(handle(page, disp, 'source_both-ethernet-1'), 'right');
  const camHeader = await box(page.locator(`.react-flow__node[data-id="${cam}"] .node-header`));
  const camRight = await dot(handle(page, cam, 'source_both-ethernet-1'), 'right');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(camHeader.x + camHeader.width / 2, camHeader.y + 20, { steps: 15 });
  const ring = await box(page.locator('.connection-preview .snap-ring'));
  expect(Math.abs(ring.x + ring.width / 2 - camRight.x)).toBeLessThan(6);
  const preview = (await page.locator('.connection-preview path').getAttribute('d')) ?? '';
  await page.mouse.up();
  await expect.poll(async () => (await renderedPaths(page)).length).toBe(1);
  // 미리보기 끝점은 화면 좌표에서 되돌린 값이라 소수점 아래가 조금 다르다. 명령과 좌표를 1px 안으로 견준다
  const drawn = (await renderedPaths(page))[0];
  const commands = (d: string) => d.replace(/[-\d.]+/g, '#');
  const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  expect(commands(drawn)).toBe(commands(preview));
  numbers(drawn).forEach((value, index) => expect(Math.abs(value - numbers(preview)[index])).toBeLessThan(1));
});

test('hovered and selected connections get thicker strokes over the inline width', async ({ page }) => {
  await openFixture(page, [['quad', 0, 0], ['wall', 600, 0]], [[0, 'out-hdmi-1', 1, 'in-hdmi-1']]);
  const path = page.locator('.react-flow__edge path.react-flow__edge-path').first();
  const width = () => path.evaluate(element => getComputedStyle(element).strokeWidth);
  expect(await width()).toBe('2px');
  const line = await box(path);
  await page.mouse.move(line.x + line.width / 2, line.y + line.height / 2);
  await expect.poll(width).toBe('3px');
  await page.mouse.down();
  await page.mouse.up();
  await expect.poll(width).toBe('4px');
});

// ── 편집 도구(B-20261006-08, 구 Builder App.tsx) ──
const nodePosition = async (page: Page, id: string) => (await saved(page)).nodes.find((node: { id: string }) => node.id === id).position as Point;
const headerOf = (page: Page, id: string) => page.locator(`.react-flow__node[data-id="${id}"] .node-header`);
const zoomOf = async (page: Page) => {
  const transform = await page.locator('.react-flow__viewport').evaluate(element => (element as HTMLElement).style.transform);
  return Number(/scale\(([-\d.]+)\)/.exec(transform)?.[1] ?? 1);
};
async function zoomOutBelow(page: Page, limit: number) {
  while (await zoomOf(page) >= limit) {
    const before = await zoomOf(page);
    await page.locator('.react-flow__controls-zoomout').click();
    await expect.poll(() => zoomOf(page)).toBeLessThan(before);
  }
}

test('auto layout loads Dagre on demand, lays the signal flow left to right, and one undo restores it', async ({ page }) => {
  const dagreRequests: string[] = [];
  page.on('request', request => { if (/\/dagre-[^/]*\.js$/.test(request.url())) dagreRequests.push(request.url()); });
  const { nodeIds: [cam, disp] } = await openFixture(page, [['cam', 700, 300], ['disp', 0, 0]], [[0, 'out-hdmi-1', 1, 'in-hdmi-1']]);
  const before = [await nodePosition(page, cam), await nodePosition(page, disp)];
  expect(dagreRequests).toEqual([]);
  await page.getByRole('button', { name: '오토 레이아웃' }).click();
  await expect.poll(async () => (await nodePosition(page, cam)).x).toBe(50);
  expect((await nodePosition(page, disp)).x).toBe(50 + 220 + 280);
  expect(dagreRequests).toHaveLength(1);
  await page.keyboard.press('Control+z');
  await expect.poll(async () => [await nodePosition(page, cam), await nodePosition(page, disp)]).toEqual(before);
});

test('Ctrl+C and Ctrl+V copy the selected devices with their links, each paste 40px further', async ({ page }) => {
  await openFixture(page, [['cam', 0, 0], ['disp', 500, 0], ['mon', 0, 320]], [[0, 'out-hdmi-1', 1, 'in-hdmi-1'], [0, 'out-hdmi-2', 2, 'in-hdmi-1']]);
  const { corner, pane } = await emptyCorner(page);
  // cam·disp만 덮는 범위 선택(mon은 아래에 있다)
  const monHeader = await box(page.locator('.react-flow__node-equipment').filter({ hasText: 'MON' }).locator('.node-header'));
  await drag(page, corner, { x: pane.x + pane.width - 20, y: monHeader.y - 30 });
  await expect(page.locator('.react-flow__node-equipment.selected')).toHaveCount(2);
  await page.keyboard.press('Control+c');
  await page.keyboard.press('Control+v');
  await expect.poll(async () => (await saved(page)).nodes.length).toBe(5);
  const nodes = (await saved(page)).nodes as { id: string; position: Point; data: { model: string } }[];
  const cams = nodes.filter(node => node.data.model === 'CAM').map(node => node.position);
  expect(cams).toContainEqual({ x: 40, y: 40 });
  // cam→disp 연결만 복제되고 mon으로 가는 연결은 빠진다
  expect(await savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-1', 'out-hdmi-1>in-hdmi-1', 'out-hdmi-2>in-hdmi-1']);
  await page.keyboard.press('Control+v');
  await expect.poll(async () => (await saved(page)).nodes.filter((node: { data: { model: string } }) => node.data.model === 'CAM').map((node: { position: Point }) => node.position)).toContainEqual({ x: 80, y: 80 });
  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await saved(page)).nodes.length).toBe(5);
});

test('lock stops dragging devices but still allows drawing links; grid snaps drops to 15px', async ({ page }) => {
  const { cam, disp } = await openFixture(page, [['cam', 0, 0], ['disp', 500, 0]]);
  await page.getByRole('button', { name: '잠금' }).click();
  await expect(page.locator('.canvas.locked')).toHaveCount(1);
  const start = await nodePosition(page, cam);
  const header = await box(headerOf(page, cam));
  await drag(page, { x: header.x + 40, y: header.y + 20 }, { x: header.x + 140, y: header.y + 90 });
  await page.waitForTimeout(400);
  expect(await nodePosition(page, cam)).toEqual(start);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, disp, 'in-hdmi-1'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-1']);
  await page.getByRole('button', { name: '잠금' }).click();
  await page.getByRole('button', { name: '격자' }).click();
  const moved = await box(headerOf(page, cam));
  await drag(page, { x: moved.x + 40, y: moved.y + 20 }, { x: moved.x + 77, y: moved.y + 53 });
  await expect.poll(async () => (await nodePosition(page, cam)).x).not.toBe(start.x);
  const snapped = await nodePosition(page, cam);
  expect([snapped.x % 15, snapped.y % 15]).toEqual([0, 0]);
});

test('the minimap shows every node and toggles off again', async ({ page }) => {
  await openFixture(page);
  await expect(page.locator('.react-flow__minimap')).toHaveCount(0);
  await page.getByRole('button', { name: '미니맵' }).click();
  await expect(page.locator('.react-flow__minimap .react-flow__minimap-node')).toHaveCount(4);
  // 구 Builder와 같은 200×130. SVG도 같은 크기라 눌러 옮기는 거리가 맞다
  const map = await box(page.locator('.react-flow__minimap'));
  const svg = await box(page.locator('.react-flow__minimap svg'));
  expect([Math.round(map.width), Math.round(map.height)]).toEqual([200, 130]);
  expect([Math.round(svg.width), Math.round(svg.height)]).toEqual([200, 130]);
  await page.getByRole('button', { name: '미니맵' }).click();
  await expect(page.locator('.react-flow__minimap')).toHaveCount(0);
});

test('a line type chip hides its links without moving the others, and devices left without links', async ({ page }) => {
  const { nodeIds: [cam, disp, mon] } = await openFixture(page, [['cam', 0, 0], ['disp', 500, 160], ['mon', 0, 400]], [[0, 'out-hdmi-1', 1, 'in-hdmi-1'], [0, 'both-ethernet-1', 1, 'both-ethernet-1']]);
  const chip = (name: string) => page.locator('.line-filter .filter-chip', { hasText: name });
  await expect(page.locator('.line-filter .filter-chip')).toHaveText(['LAN', 'HDMI']);
  const lanPath = () => page.locator(`.react-flow__edge[data-id*="${cam}-${disp}"] path.react-flow__edge-path`).evaluateAll(paths => paths.map(path => path.getAttribute('d')));
  const before = await renderedPaths(page);
  const monBox = await box(page.locator(`.react-flow__node[data-id="${mon}"]`));
  await chip('HDMI').click();
  await expect.poll(async () => (await renderedPaths(page)).length).toBe(1);
  // 숨은 mon이 있던 자리에 선을 놓아도 붙지 않는다(숨긴 장비는 근접 연결 대상이 아니다)
  await drag(page, await dot(handle(page, cam, 'out-hdmi-2'), 'right'), { x: monBox.x + monBox.width / 2, y: monBox.y + 30 });
  await page.waitForTimeout(400);
  expect(await savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-1', 'source_both-ethernet-1>target_both-ethernet-1']);
  // 같은 쌍의 두 선은 서로 띄워 그린다. 하나를 숨겨도 남은 선은 그 자리에 있다(간격은 숨긴 선까지 계산)
  expect(before).toContain((await lanPath())[0]);
  // 연결이 없는 mon은 숨고, LAN이 남은 cam·disp는 보인다
  await expect(page.locator(`.react-flow__node[data-id="${mon}"]`)).toHaveCount(0);
  await expect(page.locator(`.react-flow__node[data-id="${cam}"]`)).toBeVisible();
  await chip('LAN').click();
  await expect.poll(async () => (await renderedPaths(page)).length).toBe(0);
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(0);
  await chip('HDMI').click();
  await chip('LAN').click();
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(3);
  expect(await renderedPaths(page)).toEqual(before);
  // 파일에는 아무것도 남지 않는다
  expect(JSON.stringify(await saved(page))).not.toContain('hidden');
});

test('zoomed out below 0.55 the model name covers the device, and a link can still be drawn', async ({ page }) => {
  const { cam, disp } = await openFixture(page, [['cam', 0, 0], ['disp', 500, 0]]);
  const overlay = page.locator(`.react-flow__node[data-id="${cam}"] .lod-overlay`);
  await expect(overlay).toBeHidden();
  await zoomOutBelow(page, 0.55);
  expect(await zoomOf(page)).toBeGreaterThanOrEqual(0.3);
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('.lod-model')).toHaveText('CAM');
  await expect(overlay.locator('.lod-name')).toBeVisible();
  // 모델명 글자는 줌의 역수로 커진다(화면에서 약 9px)
  const size = Number((await overlay.locator('.lod-model').evaluate(element => getComputedStyle(element).fontSize)).replace('px', ''));
  expect(size).toBe(Math.min(44, Math.max(13, Math.round(9 / await zoomOf(page)))));
  // 덮개 위에서도 단자 행에서 끌어 장비 몸체에 놓으면 근접 연결이 된다(몸체 가운데에 가장 가까운 빈 입력 In 2)
  const target = await box(page.locator(`.react-flow__node[data-id="${disp}"]`));
  await drag(page, await dot(handle(page, cam, 'out-hdmi-1'), 'right'), { x: target.x + target.width / 2, y: target.y + target.height / 2 });
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-2']);
  await zoomOutBelow(page, 0.3);
  await expect(overlay.locator('.lod-name')).toBeHidden();
});

test('crossing jumps are drawn against visible links only', async ({ page }) => {
  // HDMI는 곧은 가로선, LAN은 그 가로선을 세로로 지난다. 점프는 가로선(HDMI)에 그려진다
  await openFixture(page, [['quad', 0, 0], ['wall', 900, 0], ['cam', 300, -320], ['disp', 700, 320]], [[0, 'out-hdmi-1', 1, 'in-hdmi-1'], [2, 'both-ethernet-1', 3, 'both-ethernet-1']]);
  const arcs = async () => (await renderedPaths(page)).filter(d => / A 6 6 0 0 [01] /.test(d)).length;
  await expect.poll(arcs).toBe(1);
  await page.locator('.line-filter .filter-chip', { hasText: 'LAN' }).click();
  await expect.poll(async () => (await renderedPaths(page)).length).toBe(1);
  // 숨긴 LAN선과의 교차는 더 그리지 않는다
  expect(await arcs()).toBe(0);
});

// ── 메모·영역 서식과 테마(B-20261006-09, 구 Builder EditAnnotationModal·NodeResizer·data-theme) ──
async function addNoteAndZone(page: Page) {
  await page.getByRole('button', { name: '메모' }).click();
  await page.getByRole('button', { name: '영역' }).click();
  await page.locator('.react-flow__controls-fitview').click();
  await expect(page.locator('.react-flow__node-annotation')).toBeVisible();
  const ids = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.react-flow__node-annotation, .react-flow__node-shape')].map(element => [element.classList.contains('react-flow__node-shape') ? 'zone' : 'note', element.getAttribute('data-id')!]))) as { note: string; zone: string };
  // 자동 저장이 둘을 담을 때까지 기다린다(시험은 저장본으로 결과를 본다)
  await expect.poll(async () => ((await saved(page))?.nodes ?? []).filter((node: { id: string }) => node.id === ids.note || node.id === ids.zone).length).toBe(2);
  return ids;
}
const savedNode = async (page: Page, id: string) => ((await saved(page))?.nodes ?? []).find((node: { id: string }) => node.id === id) ?? {};

test('a note is formatted from the side panel and one undo restores it', async ({ page }) => {
  await openFixture(page, [['cam', 0, 0]]);
  const { note } = await addNoteAndZone(page);
  await page.locator(`.react-flow__node[data-id="${note}"]`).dblclick();
  const text = page.locator('.note-panel textarea');
  await expect(text).toBeFocused();
  await text.fill('랙 뒤 전원');
  await page.getByRole('button', { name: '📌 노란 메모' }).click();
  await page.getByRole('button', { name: '오른쪽' }).click();
  await page.getByRole('button', { name: '적용' }).click();
  await expect.poll(async () => (await savedNode(page, note)).data).toMatchObject({ label: '랙 뒤 전원', fontColor: '#fef08a', bgColor: '#4d4615', textAlign: 'right' });
  await expect(page.locator(`.react-flow__node[data-id="${note}"] .annotation-text`)).toHaveText('랙 뒤 전원');
  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await savedNode(page, note)).data.label).toBe('New note (Double-click to edit)');
  // 두 번 누른 뒤 다른 곳을 눌렀다가 다시 한 번 누르면 글 칸이 초점을 가져가지 않는다. Delete가 메모를 지운다
  const { pane } = await emptyCorner(page);
  await page.mouse.click(pane.x + 30, pane.y + pane.height - 30);
  await page.locator(`.react-flow__node[data-id="${note}"]`).click();
  await expect(page.locator('.note-panel')).toBeVisible();
  await expect(page.locator('.note-panel textarea')).not.toBeFocused();
  await page.keyboard.press('Delete');
  await expect.poll(async () => (await saved(page)).nodes.some((node: { id: string }) => node.id === note)).toBe(false);
});

test('a zone becomes a circle, resizes by its handle in one undo step, and a locked note does not move', async ({ page }) => {
  await openFixture(page, [['cam', 0, 0]]);
  const { note, zone } = await addNoteAndZone(page);
  await page.locator(`.react-flow__node[data-id="${zone}"] .shape-title`).click();
  await page.locator('.note-panel select').first().selectOption('circle');
  await page.getByRole('button', { name: '적용' }).click();
  await expect(page.locator(`.react-flow__node[data-id="${zone}"] .shape-node`)).toHaveCSS('border-radius', '50%');
  const start = (await savedNode(page, zone)).style;
  const corner = await box(page.locator(`.react-flow__node[data-id="${zone}"] .react-flow__resize-control.handle.bottom.right`));
  await drag(page, { x: corner.x + corner.width / 2, y: corner.y + corner.height / 2 }, { x: corner.x + 80, y: corner.y + 50 });
  await expect.poll(async () => (await savedNode(page, zone)).style.width).toBeGreaterThan(start.width + 40);
  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await savedNode(page, zone)).style).toEqual(start);
  // 안쪽으로 크게 끌어도 최소 80×80보다 작아지지 않는다(구 Builder와 같다)
  // 실행 취소는 선택을 푼다. 다시 골라 손잡이를 띄운다
  await page.locator(`.react-flow__node[data-id="${zone}"] .shape-title`).click();
  const shrink = await box(page.locator(`.react-flow__node[data-id="${zone}"] .react-flow__resize-control.handle.bottom.right`));
  await drag(page, { x: shrink.x + shrink.width / 2, y: shrink.y + shrink.height / 2 }, { x: shrink.x - 600, y: shrink.y - 600 });
  await expect.poll(async () => (await savedNode(page, zone)).style.width).toBeLessThan(start.width);
  const smallest = (await savedNode(page, zone)).style;
  expect(smallest.width).toBeGreaterThanOrEqual(80);
  expect(smallest.height).toBeGreaterThanOrEqual(80);
  // 고정한 메모는 끌리지 않고 크기 손잡이도 없다
  await page.locator(`.react-flow__node[data-id="${note}"]`).dblclick();
  await page.getByLabel('고정(끌기·크기 바꾸기 막기)').check();
  await page.getByRole('button', { name: '적용' }).click();
  await expect.poll(async () => (await savedNode(page, note)).data.locked).toBe(true);
  const position = (await savedNode(page, note)).position;
  const body = await box(page.locator(`.react-flow__node[data-id="${note}"]`));
  await drag(page, { x: body.x + body.width / 2, y: body.y + body.height / 2 }, { x: body.x + body.width / 2 + 120, y: body.y + 90 });
  await page.waitForTimeout(400);
  expect((await savedNode(page, note)).position).toEqual(position);
  await expect(page.locator(`.react-flow__node[data-id="${note}"] .react-flow__resize-control`)).toHaveCount(0);
});

test('the dark theme switches the whole screen, survives a reload, and stays out of the file', async ({ page }) => {
  await openFixture(page, [['cam', 0, 0]]);
  const background = () => page.locator('.react-flow').evaluate(element => getComputedStyle(element).backgroundColor);
  const light = await background();
  await page.getByRole('button', { name: '어두운 테마' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(background).not.toBe(light);
  await expect(page.locator('.react-flow')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: '어두운 테마' })).toHaveAttribute('aria-pressed', 'true');
  expect(JSON.stringify(await saved(page))).not.toContain('dark');
});

// ── 도면 내보내기(B-20261006-10): 구성도 데이터로 그린 SVG, SVG에서 만든 PDF ──
// PDF 글자는 Portal이 이미 싣는 pdf.js 원본(beta/site/vendor/pdfjs)으로 읽는다
const PDFJS = resolve('..', 'beta', 'site', 'vendor', 'pdfjs');
async function exportFixture(page: Page) {
  await page.route('**/__pdfjs/**', route => route.fulfill({ path: join(PDFJS, route.request().url().split('/__pdfjs/')[1]), contentType: 'text/javascript' }));
  // 앞으로 가는 선, 뒤집어 그리는 양방향 선(disp→cam으로 저장), 뒤로 가는 U자 선 둘(quad→wall)이 함께 있다
  const ids = await openFixture(page, [['cam', 0, 0], ['disp', 500, 160], ['quad', 900, 420], ['wall', 300, 520]],
    [[0, 'out-hdmi-1', 1, 'in-hdmi-1'], [1, 'both-ethernet-1', 0, 'both-ethernet-1'], [2, 'out-hdmi-1', 3, 'in-hdmi-1'], [2, 'out-hdmi-2', 3, 'in-hdmi-2']]);
  const { note } = await addNoteAndZone(page);
  await page.locator(`.react-flow__node[data-id="${note}"]`).dblclick();
  // 한자(確認)는 PDF 글꼴에 없다. PDF를 만들면 빠진다고 알려야 한다
  await page.locator('.note-panel textarea').fill('랙 앞 전원 확인 & <점검> 確認');
  await page.getByRole('button', { name: '적용' }).click();
  await expect.poll(async () => (await savedNode(page, note)).data.label).toBe('랙 앞 전원 확인 & <점검> 確認');
  return ids;
}
// 경로를 명령과 숫자로 나눈다(숫자는 반올림 차이를 견주려고 수로 바꾼다)
const pathTokens = (d: string) => (d.match(/[MLQA]|-?\d+(?:\.\d+)?/g) ?? []).map(token => (/[MLQA]/.test(token) ? token : Number(token)));

test('SVG export draws the links exactly where the screen draws them and parses as XML', async ({ page }) => {
  await exportFixture(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'SVG' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^구성도-\d{8}-\d{4}\.svg$/);
  const svg = readFileSync(await download.path(), 'utf8');
  const parsed = await page.evaluate(text => {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    return { error: doc.querySelector('parsererror')?.textContent ?? null, texts: [...doc.querySelectorAll('text')].map(node => node.textContent) };
  }, svg);
  expect(parsed.error).toBeNull();
  expect(parsed.texts).toContain('랙 앞 전원 확인 & <점검> 確認');
  // 화면의 선과 같은 경로다. SVG의 선은 구성도 좌표 그대로이고, 도면 원점 이동은 바깥 g의 translate가 한다
  expect(svg).toMatch(/<g transform="translate\([-\d.]+ [-\d.]+\)">/);
  const screen = await page.locator('.react-flow__edge').evaluateAll(edges => edges.map(edge => [edge.getAttribute('data-id'), edge.querySelector('path.react-flow__edge-path')?.getAttribute('d') ?? '']));
  expect(screen.length).toBe(4);
  for (const [id, d] of screen) {
    const exported = new RegExp(`<path data-edge="${id}" d="([^"]+)"`).exec(svg)![1];
    const theirs = pathTokens(d!);
    const ours = pathTokens(exported);
    expect(ours.length).toBe(theirs.length);
    ours.forEach((value, index) => (typeof value === 'string' ? expect(value).toBe(theirs[index]) : expect(Math.abs(value - Number(theirs[index]))).toBeLessThan(0.2)));
  }
});

test('PDF export loads its library and Korean font on demand and keeps text as text', async ({ page }) => {
  const late: string[] = [];
  page.on('request', request => { if (/diagramPdf-|Pretendard-Regular\.ttf/.test(request.url())) late.push(request.url()); });
  await exportFixture(page);
  expect(late).toEqual([]);
  const [svgDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'SVG' }).click()]);
  const [, width, height] = /<svg[^>]* width="([\d.]+)" height="([\d.]+)"/.exec(readFileSync(await svgDownload.path(), 'utf8'))!;
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 60_000 }), page.getByRole('button', { name: 'PDF' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^구성도-\d{8}-\d{4}\.pdf$/);
  expect(late.filter(url => url.endsWith('Pretendard-Regular.ttf'))).toHaveLength(1);
  // PDF 라이브러리 파일도 누른 뒤에야 받는다(첫 화면 번들에 없다)
  expect(late.some(url => /\/diagramPdf-[^/]+\.js$/.test(url))).toBe(true);
  // 글꼴에 없는 한자는 빠진다고 알린다
  await expect(page.locator('.notice')).toContainText('글꼴에 없는 글자');
  await expect(page.locator('.notice')).toContainText('確');
  const pdf = readFileSync(await download.path());
  expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  const read = await page.evaluate(async base64 => {
    const pdfjs = await import(new URL('/__pdfjs/pdf.min.mjs', location.href).href);
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('/__pdfjs/pdf.worker.min.mjs', location.href).href;
    const doc = await pdfjs.getDocument({ data: Uint8Array.from(atob(base64), char => char.charCodeAt(0)) }).promise;
    const first = await doc.getPage(1);
    const { width: w, height: h } = first.getViewport({ scale: 1 });
    const content = await first.getTextContent();
    return { pages: doc.numPages, width: w, height: h, text: content.items.map((item: { str: string }) => item.str).join(' ') };
  }, pdf.toString('base64'));
  expect(read.pages).toBe(1);
  // 결정 M-b: 도면 크기 그대로 한 쪽(1px = 1pt)
  expect(Math.abs(read.width - Number(width))).toBeLessThan(1);
  expect(Math.abs(read.height - Number(height))).toBeLessThan(1);
  for (const word of ['CAM', 'DISP', 'in-hdmi-1', '양방향', '랙 앞 전원 확인 & <점검>', 'AV Portal Builder']) expect(read.text).toContain(word);
});
