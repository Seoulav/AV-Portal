import { mkdirSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { mockResources } from './fixtures';

test('empty quote presents both entry paths once above references', async ({ page }) => {
  await mockResources(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '견적 시작' })).toBeVisible();
  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '품목 직접 선택' })).toHaveCount(1);
  await expect(page.locator('.q-start-actions')).toBeVisible();
  await expect(page.locator('.q-reference-docs')).toBeVisible();
  expect((await page.locator('.q-main').boundingBox())?.height ?? 0).toBeLessThan(250);
  expect(await page.locator('.q-start-intro').evaluate(el => !!(el.compareDocumentPosition(document.querySelector('.q-reference-docs')!) & 4))).toBeTruthy();
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
  await expect(page.getByRole('radiogroup', { name: '출력 등급' }).getByRole('button')).toHaveCount(0);
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


async function pageWidth(page: Page): Promise<[number, number]> {
  return page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
}

for (const width of [390, 768, 1280]) {
  test(`${width}px start controls remain touchable without page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockResources(page);
    await page.goto('./');
    for (const button of await page.locator('.q-start-actions .q-button').all()) {
      await expect(button).toBeVisible();
      expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    const [scroll, client] = await pageWidth(page);
    expect(scroll).toBeLessThanOrEqual(client + 1);
    mkdirSync('.local/screens/cpq-redesign', { recursive: true });
    await page.screenshot({ path: `.local/screens/cpq-redesign/empty-${width}.png`, fullPage: true });
  });
}

for (const width of [390, 768, 1280]) test(`${width}px long quote keeps table scrolling inside its card`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const products = Array.from({ length: 20 }, (_, i) => ({
    productId: `FIX-${i}`, sku: `FIX-${i}`, brand: '', model: `FIX-${i}`,
    quoteName: `합성 장비 ${i}`, quoteSpec: `FIX-SPEC-${i}`, unit: 'EA',
    options: { group: '합성 장비' }, currency: 'KRW', evidence: 'verified',
  }));
  await mockResources(page, {
    '/data/approved/products.json': {
      schemaVersion: 1, generatedOn: '2026-01-01', sourceSha256: 'a'.repeat(64), products,
    },
    '/data/approved/prices.json': {
      schemaVersion: 1, generatedOn: '2026-01-01', sourceSha256: 'a'.repeat(64), currency: 'KRW',
      prices: Object.fromEntries(products.map(product => [product.sku, { sellingUnitPrice: '10000', currency: 'KRW' }])),
    },
  });
  await page.goto('./');
  await page.getByRole('button', { name: '품목 직접 선택' }).click();
  await page.getByLabel('품목 검색').fill('합성 장비');
  await expect(page.locator('.q-picker-matches .q-button')).toHaveCount(20);
  for (let i = 0; i < 20; i++) await page.locator('.q-picker-matches .q-button').nth(i).click();
  await page.getByRole('button', { name: '견적 만들기' }).click();
  await expect(page.locator('.q-quote-sheet')).toBeVisible();
  await expect.poll(() => page.locator('.q-quote-table tbody tr[data-row-id]').count()).toBeGreaterThanOrEqual(20);
  if (width <= 768) for (const button of await page.locator('.q-file-tools .q-button, .q-edit-tools .q-button, .q-output-tools .q-button').all()) {
    expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  const wrap = page.locator('.q-table-wrap').first();
  if (width === 390) expect(await wrap.evaluate(el => el.scrollWidth)).toBeGreaterThan(await wrap.evaluate(el => el.clientWidth));
  for (let i = 0; i < 20; i++) {
    const closed = page.locator('.q-section-toggle[aria-expanded="false"]');
    if (await closed.count() === 0) break;
    await closed.first().click();
  }
  const [scroll, client] = await pageWidth(page);
  expect(scroll).toBeLessThanOrEqual(client + 1);
  expect(errors).toEqual([]);
  mkdirSync('.local/screens/cpq-redesign', { recursive: true });
  await page.screenshot({ path: `.local/screens/cpq-redesign/editing-${width}.png`, fullPage: true });
});
