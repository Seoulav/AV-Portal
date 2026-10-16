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
  await expect(page.locator('.canvas')).toBeVisible();
});

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
  await inspectorTab.click();
  await expect(page.getByRole('tabpanel', { name: '선택 항목·이슈' })).toBeVisible();
  await canvasTab.click();
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
