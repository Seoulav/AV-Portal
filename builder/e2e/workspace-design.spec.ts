import { test, expect } from '@playwright/test';
import { library } from './fixture';

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
