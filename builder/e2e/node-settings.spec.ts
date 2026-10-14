// 장비 설정 창 브라우저 시험(B-20261013-01): 두 번 누르기 → 단자 2개 추가 → 연결 → 그 단자 삭제(확인) → 내보낸 JSON에 끊어진 엣지 없음.
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { validateDiagram } from '../src/engine';
import { diagramText, library, libraryIndex } from './fixture';

const AUTOSAVE_KEY = 'av-portal-builder:current';

async function openFixture(page: Page) {
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  await expect(page.locator('.library-panel .panel-foot')).toContainText('Portal 제품 8종');
  const { text, nodeIds } = diagramText([['cam', 0, 0], ['disp', 500, 0]]);
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.diagram.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(2);
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key) !== null, AUTOSAVE_KEY)).toBe(true);
  return { cam: nodeIds[0], disp: nodeIds[1] };
}
const saved = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), AUTOSAVE_KEY);
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
const openSettings = async (page: Page, nodeId: string) => {
  await page.locator(`.react-flow__node[data-id="${nodeId}"] .node-header`).dblclick();
  const dialog = page.getByRole('dialog', { name: '장비 설정' });
  await expect(dialog).toBeVisible();
  return dialog;
};

test('double-click opens the settings; Esc, outside click and cancel change nothing', async ({ page }) => {
  const { disp } = await openFixture(page);
  const before = JSON.stringify(await saved(page));
  let dialog = await openSettings(page, disp);
  await dialog.getByRole('tab', { name: /단자/ }).click();
  await dialog.getByRole('button', { name: '입력 단자 추가' }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  dialog = await openSettings(page, disp);
  await dialog.getByLabel('장비 시스템명').fill('바뀐 이름');
  await page.mouse.click(5, 300);
  await expect(dialog).toHaveCount(0);
  dialog = await openSettings(page, disp);
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(dialog).toHaveCount(0);
  await page.waitForTimeout(400);
  expect(JSON.stringify(await saved(page))).toBe(before);
  await expect(page.locator('.port-row.port-user')).toHaveCount(0);
});

test('two added ports draw, connect, and deleting one asks first and leaves no orphan edge', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  let dialog = await openSettings(page, disp);
  await dialog.getByRole('tab', { name: /단자/ }).click();
  await dialog.getByLabel('입력 추가 개수').fill('2');
  await dialog.getByRole('button', { name: '입력 단자 추가' }).click();
  await expect(dialog.locator('.port-edit-row.user')).toHaveCount(2);
  await dialog.getByRole('button', { name: '적용', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  // 노드에 바로 그려지고(점선·"추가" 표시) 저장된다
  await expect(page.locator(`.react-flow__node[data-id="${disp}"] .port-row.port-user`)).toHaveCount(2);
  await expect(handle(page, disp, 'in-user-1')).toBeVisible();
  await expect.poll(async () => (await saved(page)).nodes.find((n: { id: string }) => n.id === disp).data.inputs.map((p: { id: string; label: string }) => `${p.id}:${p.label}`))
    .toEqual(['in-hdmi-1:in-hdmi-1', 'in-hdmi-2:in-hdmi-2', 'in-hdmi-3:in-hdmi-3', 'in-user-1:HDMI In 1', 'in-user-2:HDMI In 2']);

  // 새 단자에 연결한다(연결 판정에 쓰인다)
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, disp, 'in-user-1'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-user-1']);

  // 연결된 단자를 지운다: 확인 없이는 적용되지 않는다
  dialog = await openSettings(page, disp);
  await dialog.getByRole('tab', { name: /단자/ }).click();
  await expect(dialog.locator('.port-edit-row[data-port-id="in-user-1"]')).toContainText('연결 1');
  await dialog.getByRole('button', { name: 'HDMI In 1 삭제' }).click();
  await dialog.getByRole('button', { name: '적용', exact: true }).click();
  const confirm = dialog.getByRole('alertdialog', { name: '연결 삭제 확인' });
  await expect(confirm).toContainText('연결 1개도 함께 지웁니다');
  await confirm.getByRole('button', { name: '돌아가기' }).click();
  await expect(confirm).toHaveCount(0);
  expect(await savedEdges(page)).toEqual(['out-hdmi-1>in-user-1']);
  await dialog.getByRole('button', { name: '적용', exact: true }).click();
  await confirm.getByRole('button', { name: '연결도 지우고 적용' }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => savedEdges(page)).toEqual([]);
  await expect(page.locator('.react-flow__edge')).toHaveCount(0);

  // 내보낸 JSON: 지운 단자를 가리키는 엣지가 없고 검증을 통과한다
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '내보내기' }).click();
  const exported = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
  expect(exported.edges).toEqual([]);
  const node = exported.nodes.find((n: { id: string }) => n.id === disp);
  expect(node.data.portsEdited).toBe(true);
  expect(node.data.inputs.map((p: { id: string; origin?: string }) => `${p.id}:${p.origin ?? ''}`)).toEqual(['in-hdmi-1:', 'in-hdmi-2:', 'in-hdmi-3:', 'in-user-2:user']);
  expect(validateDiagram(exported, { library: libraryIndex }).errors).toEqual([]);
  expect(exported.issues.filter((i: { target: { node?: string } }) => i.target.node).map((i: { code: string }) => i.code)).toEqual(['ports-edited']);

  // 실행 취소 한 번이면 단자와 연결이 함께 돌아온다
  await page.getByRole('button', { name: '실행 취소' }).click();
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-user-1']);
});

test('keys right after the double-click stay in the dialog', async ({ page }) => {
  const { disp } = await openFixture(page);
  const before = JSON.stringify(await saved(page));
  const dialog = await openSettings(page, disp);
  // 창 안을 누르지 않은 채 Delete·Ctrl+Z를 눌러도 바탕의 장비가 지워지거나 되돌려지지 않는다
  await page.keyboard.press('Delete');
  await page.keyboard.press('Control+z');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(2);
  await page.waitForTimeout(400);
  expect(JSON.stringify(await saved(page))).toBe(before);
});

test('moving a connected port up moves its line with it', async ({ page }) => {
  const { cam, disp } = await openFixture(page);
  await drag(page, await rowInside(handle(page, cam, 'out-hdmi-1'), 'right'), await rowInside(handle(page, disp, 'in-hdmi-3'), 'left'));
  await expect.poll(() => savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-3']);
  const dialog = await openSettings(page, disp);
  await dialog.getByRole('tab', { name: /단자/ }).click();
  await dialog.getByRole('button', { name: 'in-hdmi-3 위로' }).click();
  await dialog.getByRole('button', { name: 'in-hdmi-3 위로' }).click();
  await dialog.getByRole('button', { name: '적용', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await savedEdges(page)).toEqual(['out-hdmi-1>in-hdmi-3']);
  // 선 끝이 옮겨 간 단자 행(이제 첫 행)에 붙는다
  const target = await handle(page, disp, 'in-hdmi-3').boundingBox();
  await expect.poll(async () => {
    const box = await page.locator('.react-flow__edge path.react-flow__edge-path').first().boundingBox();
    return box ? Math.abs(box.y + box.height - (target!.y + target!.height / 2)) : 999;
  }).toBeLessThan(6);
});

test('the side panel shows a summary and opens the same settings', async ({ page }) => {
  const { disp } = await openFixture(page);
  await page.locator(`.react-flow__node[data-id="${disp}"] .node-header`).click();
  const panel = page.locator('.equipment-quote-panel');
  await expect(panel).toContainText('DISP');
  await panel.getByRole('button', { name: '설정 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '장비 설정' });
  await dialog.getByLabel('장비 시스템명').fill('회의실 A');
  await dialog.getByRole('button', { name: '적용', exact: true }).click();
  await expect(panel).toContainText('회의실 A');
  await expect.poll(async () => (await saved(page)).nodes.find((n: { id: string }) => n.id === disp).data.systemName).toBe('회의실 A');
  // 견적 정보만 넣은 노드는 이슈가 없다
  await expect.poll(async () => (await saved(page)).issues.filter((i: { target: { node?: string } }) => i.target.node)).toEqual([]);
});
