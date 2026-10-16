import { test, expect } from '@playwright/test';
import { mockResources } from './fixtures';

test('empty quote presents both entry paths once above references', async ({ page }) => {
  await mockResources(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '견적 시작' })).toBeVisible();
  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '품목 직접 선택' })).toHaveCount(1);
  await expect(page.locator('.q-start-actions')).toBeVisible();
  await expect(page.locator('.q-reference-docs')).toBeVisible();
  await expect(page.locator('.q-start-actions')).toBeInViewport();
  await page.getByRole('button', { name: '품목 직접 선택' }).click();
  await expect(page.getByText('승인된 카탈로그 1개 품목에서 고릅니다.')).toBeVisible();
  await page.getByRole('button', { name: '구성도 JSON 열기' }).click();
  await expect(page.getByRole('button', { name: '파일 선택' })).toBeVisible();
});

test('startup failure keeps entry actions and explains the missing resource', async ({ page }) => {
  await mockResources(page, { '/data/approved/labor-items.json': 'missing' });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '견적 시작' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('labor-items.json');
  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '품목 직접 선택' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toBeDisabled();
});
