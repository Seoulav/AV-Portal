// Portal 반영 요청 브라우저 시험(B-20261013-02): 단자 탭에서 고친 단자를 요청 파일로 내려받는다.
// 합성 라이브러리의 DISP 단자에 라이브러리 1.2.0의 원본 행 정보(portalIo.ioIndex·direction·quantity)를 붙여 쓴다.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { validateIoRequest } from '../src/engine';
import { diagramText, library } from './fixture';

const HDMI_ROW = { group: 'Input', connector: 'HDMI Type-A', signal: 'HDMI 입력', direction: 'IN', quantity: '3' };
const LAN_ROW = { group: 'Network', connector: 'RJ-45', signal: 'LAN', direction: 'IN/OUT', quantity: '1' };

// DISP: HDMI 입력 3개는 io[0], LAN 1개는 io[1]에서 나온 단자다
function libraryWithRows() {
  const copy = structuredClone(library);
  copy.schemaVersion = '1.2.0';
  const disp = copy.products.find(product => product.productId === 'disp')!.units[0].equipment as unknown as Record<string, { id: string; portalIo?: unknown }[]>;
  for (const port of disp.inputs) port.portalIo = { ...HDMI_ROW, ioIndex: 0 };
  for (const port of disp.bidirectional) port.portalIo = { ...LAN_ROW, ioIndex: 1 };
  return copy;
}

async function openDisp(page: Page, links: [number, string, number, string][] = []) {
  await page.route('**/builder-library.json', route => route.fulfill({ json: libraryWithRows() }));
  await page.goto('./');
  await expect(page.locator('.library-panel .panel-foot')).toContainText('Portal 제품 8종');
  const { text, nodeIds } = diagramText([['cam', 0, 0], ['disp', 500, 0]], links);
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.diagram.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('.react-flow__node-equipment')).toHaveCount(2);
  await page.locator(`.react-flow__node[data-id="${nodeIds[1]}"] .node-header`).dblclick();
  const dialog = page.getByRole('dialog', { name: '장비 설정' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('tab', { name: /단자/ }).click();
  return { dialog, disp: nodeIds[1] };
}

test('edited ports export a Portal request file grouped by io row, with reasons', async ({ page }) => {
  const { dialog, disp } = await openDisp(page);
  // HDMI 입력 하나를 지우고(3 → 2), SDI(BNC) 입력 2개를 더한다
  await dialog.getByRole('button', { name: 'in-hdmi-3 삭제' }).click();
  await dialog.getByLabel('입력 추가 신호').selectOption('SDI');
  await dialog.getByLabel('입력 추가 커넥터').selectOption('BNC');
  await dialog.getByLabel('입력 추가 개수').fill('2');
  await dialog.getByRole('button', { name: '입력 단자 추가' }).click();
  await dialog.getByLabel('입력 단자 근거 3').fill('DISP 매뉴얼 12쪽');

  await dialog.getByRole('button', { name: '적용하고 Portal 반영 요청 내보내기' }).click();
  const review = dialog.getByRole('alertdialog', { name: 'Portal 반영 요청 확인' });
  await expect(review).toContainText('행 변경 2건');
  await expect(review).toContainText('변경 1행: Input · HDMI Type-A · HDMI 입력 · IN · 3 → Input · HDMI Type-A · HDMI 입력 · IN · 2');
  await expect(review).toContainText('추가: Input · BNC · SDI · IN · 2');
  await expect(review.getByLabel('변경 2 근거')).toHaveValue('DISP 매뉴얼 12쪽');
  await review.getByLabel('변경 1 근거').fill('설치 현장 확인');

  const download = page.waitForEvent('download');
  await review.getByRole('button', { name: '적용하고 요청 파일 내려받기' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^builder-io-request-disp-\d{8}\.json$/);
  const request = JSON.parse(readFileSync(await file.path(), 'utf8'));
  expect(validateIoRequest(request)).toEqual([]);
  expect({ ...request, createdAt: undefined }).toEqual({
    schema: 'av-portal.builder-io-request', schemaVersion: '1.0.0', productId: 'disp', source: 'portal', unitId: 'disp', model: 'DISP', createdAt: undefined,
    library: { catalogSha: 'e2e', detailSetSha: 'e2e', rtcomSha: 'e2e' },
    changes: [
      { op: 'update', ioIndex: 0, before: HDMI_ROW, after: { ...HDMI_ROW, quantity: '2' }, reason: '설치 현장 확인' },
      { op: 'add', row: { group: 'Input', connector: 'BNC', signal: 'SDI', direction: 'IN', quantity: '2' }, reason: 'DISP 매뉴얼 12쪽' },
    ],
  });
  // 이 구성도에도 적용됐다
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(`.react-flow__node[data-id="${disp}"] .port-row.port-user`)).toHaveCount(2);
  await expect(page.getByText('Portal 반영 요청 파일(행 변경 2건)을 내려받았습니다', { exact: false })).toBeVisible();
});

test('nothing to reflect: a rename only explains why and downloads nothing; going back keeps the draft', async ({ page }) => {
  const { dialog } = await openDisp(page);
  await dialog.getByLabel('입력 단자 이름 1').fill('메인 입력');
  await dialog.getByRole('button', { name: '적용하고 Portal 반영 요청 내보내기' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Portal에 반영할 단자 변경이 없습니다');
  await expect(dialog.getByRole('alert')).toContainText('메인 입력: 이름은 Portal 행에서 자동으로 매겨져 반영하지 않습니다');
  await expect(dialog.getByRole('alertdialog')).toHaveCount(0);

  // 지운 LAN 행은 삭제로 묶이고, 돌아가기 하면 확인 화면만 닫힌다
  await dialog.getByRole('button', { name: 'both-ethernet-1 삭제' }).click();
  await dialog.getByRole('button', { name: '적용하고 Portal 반영 요청 내보내기' }).click();
  const review = dialog.getByRole('alertdialog', { name: 'Portal 반영 요청 확인' });
  await expect(review).toContainText('삭제 2행: Network · RJ-45 · LAN · IN/OUT · 1');
  await expect(review).toContainText('메인 입력 — 이름은 Portal 행에서 자동으로 매겨져 반영하지 않습니다');
  await review.getByRole('button', { name: '돌아가기' }).click();
  await expect(review).toHaveCount(0);
  await expect(dialog.locator('.port-edit-row[data-port-id="both-ethernet-1"]')).toHaveCount(0);
  await expect(dialog.getByLabel('입력 단자 이름 1')).toHaveValue('메인 입력');
});

test('removing a connected port asks about the connection first, then applies and downloads', async ({ page }) => {
  const { dialog } = await openDisp(page, [[0, 'out-hdmi-1', 1, 'in-hdmi-3']]);
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'in-hdmi-3 삭제' }).click();
  await dialog.getByRole('button', { name: '적용하고 Portal 반영 요청 내보내기' }).click();
  await dialog.getByRole('alertdialog', { name: 'Portal 반영 요청 확인' }).getByRole('button', { name: '적용하고 요청 파일 내려받기' }).click();
  // 연결 삭제 확인을 거친 뒤에만 적용·내려받기가 일어난다
  const confirm = dialog.getByRole('alertdialog', { name: '연결 삭제 확인' });
  await expect(confirm).toContainText('연결 1개도 함께 지웁니다');
  const download = page.waitForEvent('download');
  await confirm.getByRole('button', { name: '연결도 지우고 적용' }).click();
  const request = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
  expect(request.changes).toEqual([{ op: 'update', ioIndex: 0, before: HDMI_ROW, after: { ...HDMI_ROW, quantity: '2' }, reason: '' }]);
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.react-flow__edge')).toHaveCount(0);
});
