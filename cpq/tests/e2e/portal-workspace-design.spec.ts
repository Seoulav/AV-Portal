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
  await page.setViewportSize({ width: 390, height: 844 });
  await mockResources(page, { '/data/approved/labor-items.json': 'missing' });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '견적 시작' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('labor-items.json');
  await expect(page.getByRole('alert')).toBeInViewport();
  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '품목 직접 선택' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toBeDisabled();
});


test('editing groups preserve the quote workflow and output gate', async ({ page }) => {
  await mockResources(page);
  await page.goto('./');
  await expect(page.getByRole('button', { name: '작업 파일로 저장' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '실행 취소' })).toBeDisabled();
  await page.getByRole('button', { name: '품목 직접 선택' }).click();
  await page.getByLabel('품목 검색').fill('합성 테스트 품목');
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await page.getByRole('button', { name: '견적 만들기' }).click();
  await expect(page.locator('.q-file-tools')).toBeVisible();
  await expect(page.locator('.q-edit-tools')).toBeVisible();
  await expect(page.locator('.q-output-tools')).toBeVisible();
  await expect(page.getByRole('radio', { name: '2 고객용' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Excel 다운로드' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '작업 파일 열기' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '작업 파일로 저장' })).toBeEnabled();
  const positions = await page.evaluate(() => [
    document.querySelector('.q-review-summary')?.compareDocumentPosition(document.querySelector('.q-quote-sheet')!),
    document.querySelector('.q-quote-sheet')?.compareDocumentPosition(document.querySelector('.q-workspace-section')!),
  ]);
  expect(positions.every(value => (value ?? 0) & 4)).toBeTruthy();
  await expect(page.getByRole('status', { name: '작업 저장 상태' })).toContainText('저장하지 않은 변경 내용이 있습니다');
  const quantity = page.locator('.q-quote-sheet').getByLabel('수량').first();
  await quantity.fill('3');
  await quantity.press('Tab');
  await expect(page.getByRole('button', { name: '실행 취소' })).toBeEnabled();
  await page.getByRole('button', { name: '실행 취소' }).click();
  await expect(page.getByRole('button', { name: '다시 실행' })).toBeEnabled();
});
