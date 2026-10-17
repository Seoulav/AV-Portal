import { test, expect } from '@playwright/test';
import { mockResources } from './fixtures';

/**
 * 회의실 타입으로 시작 (B-20261016-07 2단계) — 실제 화면에서 확인한다.
 *
 * 자료는 전부 합성 fixture다(가짜 단가 10,000원짜리 FIX-0001 하나).
 * 보려는 것:
 *   1. 시작 화면에 세 번째 입구가 있고, 타입을 골라 견적이 만들어진다.
 *   2. 단가표에 있는 품목은 행·수량이 채워진다.
 *   3. 단가표에 없는 품목은 '단가표 미등록'으로 드러난다 — 지어내지 않는다.
 *   4. 템플릿 자료가 없으면 입구가 꺼진다.
 */
test('회의실 타입을 고르면 그 품목·수량으로 견적이 만들어진다', async ({ page }) => {
  await mockResources(page);
  await page.goto('/');

  const entry = page.getByRole('button', { name: '회의실 타입으로 시작' });
  await expect(entry).toBeEnabled();
  await entry.click();

  // 타입 그룹과 변형 2개가 보인다. 미등록 품목 수를 미리 알려준다.
  await expect(page.getByRole('heading', { name: '회의실 타입으로 시작' })).toBeVisible();
  const variant = page.getByRole('radio', { name: /1-1/ });
  await variant.check();
  await expect(page.locator('.q-room-variant', { hasText: '1-1' })).toContainText('단가표 미등록 1건');

  await page.getByRole('button', { name: '이 구성으로 견적 만들기' }).click();

  // 견적표가 열리고 품목·수량이 채워진다.
  const sheet = page.locator('.q-quote-sheet').first();
  await expect(sheet).toBeVisible();
  await expect(page.getByText('합성 테스트 품목').first()).toBeVisible();

  // 단가표에 없는 품목 — 행은 있고 '단가표 미등록'이 보인다.
  await expect(page.getByText('합성 제작 브라켓').first()).toBeVisible();
  await expect(page.getByText('단가표 미등록').first()).toBeVisible();
});

test('템플릿 자료가 없으면 입구가 꺼진다 — 다른 입구는 그대로다', async ({ page }) => {
  await mockResources(page, { '/data/approved/room-templates.json': 'missing' });
  await page.goto('/');

  await expect(page.getByRole('button', { name: '구성도 JSON 열기' })).toBeEnabled();
  await expect(page.getByRole('button', { name: '회의실 타입으로 시작' })).toBeDisabled();
});

test('템플릿 파일이 깨졌으면 조용히 끄지 않고 사유를 보여준다', async ({ page }) => {
  await mockResources(page, { '/data/approved/room-templates.json': { version: 99 } });
  await page.goto('/');

  await expect(page.getByRole('button', { name: '회의실 타입으로 시작' })).toBeDisabled();
  await expect(page.getByText('회의실 타입 입구를 켤 수 없습니다')).toBeVisible();
});
