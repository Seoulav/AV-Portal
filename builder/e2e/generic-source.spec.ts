// 빌더 전용 일반 장비(B-20261016-02): 장비 목록의 "소스 기기"에서 PC·노트북을 HDMI·DP 중 골라 놓는다.
import { expect, test } from '@playwright/test';
import { library } from './fixture';

test('노트북(DP)과 PC(HDMI)를 목록에서 골라 놓으면 고른 출력 단자가 보인다', async ({ page }) => {
  await page.route('**/builder-library.json', route => route.fulfill({ json: library }));
  await page.goto('./');
  await expect(page.locator('.library-panel .panel-foot')).toContainText('Portal 제품 8종');

  await page.locator('.library-panel .group-title', { hasText: '소스 기기' }).click();
  await page.getByRole('button', { name: '노트북 (DP) 추가' }).click();
  await page.getByRole('button', { name: 'PC (HDMI) 추가' }).click();

  const nodes = page.locator('.react-flow__node-equipment');
  await expect(nodes).toHaveCount(2);
  await expect(nodes.filter({ hasText: '노트북 (DP)' })).toContainText('DP Out 1');
  await expect(nodes.filter({ hasText: 'PC (HDMI)' })).toContainText('HDMI Out 1');
});
