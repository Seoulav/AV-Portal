import { test, expect } from '@playwright/test';
import { diagramText, library } from './fixture';

test('desktop presents Portal identity and grouped commands', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  await expect(page.locator('.toolbar-brand').getByRole('link', { name: 'AV Portal' })).toBeVisible();
  await expect(page.locator('.toolbar-group-project').getByRole('button', { name: '내보내기' })).toBeVisible();
  await expect(page.locator('.toolbar-group-edit').getByRole('button', { name: '메모' })).toBeVisible();
  await expect(page.locator('.toolbar-group-view').getByRole('button', { name: '미니맵' })).toBeVisible();
  await expect(page.getByRole('group', { name: '프로젝트' })).toBeVisible();
  await expect(page.locator('.canvas')).toBeVisible();
});

test('empty canvas explains how to add equipment and clears the hint after adding', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  await expect(page.locator('.canvas-empty-hint')).toBeVisible();
  await page.locator('.library-group .group-title').first().click();
  await page.locator('.unit-item button[aria-label$="추가"]').first().click();
  await expect(page.locator('.canvas-empty-hint')).toHaveCount(0);
});

for (const width of [768, 390]) {
  test(`workspace actions and tabs fit a ${width}px viewport in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
    await page.goto('./');
    await expect(page.getByRole('tab', { name: '라이브러리' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '캔버스' })).toBeVisible();
    await expect(page.locator('.toolbar-group-project').getByRole('button', { name: '내보내기' })).toBeVisible();
    await expect(page.locator('.toolbar-group-view').getByRole('button', { name: '미니맵' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: '어두운 테마' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('tab', { name: '캔버스' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('mobile adds a library unit to a persistent canvas and keeps it through inspector switches', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  const libraryTab = page.getByRole('tab', { name: '라이브러리' });
  const canvasTab = page.getByRole('tab', { name: '캔버스' });
  const inspectorTab = page.getByRole('tab', { name: '선택 항목·이슈' });
  await expect(libraryTab).toHaveAttribute('aria-selected', 'true');
  await page.locator('.library-group .group-title').first().click();
  await page.locator('.unit-item button[aria-label$="추가"]').first().click();
  await expect(canvasTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  const node = await page.locator('.react-flow__node').boundingBox();
  const canvas = await page.locator('.canvas').boundingBox();
  expect(node && canvas && node.x >= canvas.x && node.x + node.width <= canvas.x + canvas.width && node.y >= canvas.y && node.y < canvas.y + canvas.height).toBeTruthy();
  await page.locator('.react-flow__node').click();
  await page.locator('.react-flow__controls-zoomin').click();
  const zoomBefore = await page.locator('.react-flow__viewport').getAttribute('style');
  await inspectorTab.click();
  await expect(page.getByRole('tabpanel', { name: '선택 항목·이슈' })).toBeVisible();
  await expect(page.locator('.equipment-quote-panel')).toBeVisible();
  await page.getByRole('button', { name: '설정 열기' }).click({ timeout: 3000 });
  await expect(page.getByRole('dialog', { name: '장비 설정' })).toBeVisible();
  await page.keyboard.press('Escape');
  await canvasTab.click();
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', zoomBefore!);
});

test('mobile tabs respond to arrow, Home, and End keys', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: '라이브러리' })).toHaveAttribute('tabindex', '0');
});

test('mobile new diagram and file import switch to the relevant workspace tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  await page.getByRole('tab', { name: '선택 항목·이슈' }).click();
  await page.getByRole('button', { name: '새 구성도' }).click();
  await expect(page.getByRole('tab', { name: '라이브러리' })).toHaveAttribute('aria-selected', 'true');
  await page.locator('input[type="file"]').setInputFiles({ name: 'sample.diagram.json', mimeType: 'application/json', buffer: Buffer.from(diagramText([['cam', 0, 0]], []).text) });
  await expect(page.getByRole('tab', { name: '캔버스' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
});

test('saved mobile diagram opens on canvas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.addInitScript(({ key, text }) => localStorage.setItem(key, text), { key: 'av-portal-builder:current', text: diagramText([['cam', 0, 0]], []).text });
  await page.goto('./');
  await expect(page.getByRole('tab', { name: '캔버스' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
});
