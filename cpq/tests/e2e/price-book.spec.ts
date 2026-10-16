/**
 * 가격표 파일 방식 (B-20261016-06, LED 구성기 방식) — 실제 화면 조작.
 *
 * ⚠ 전부 **가짜** 가격표다. 실제 표준품셈·원가·가격표 파일은 쓰지 않는다.
 *
 *   - 표준품셈 원본(2단 머리글) 불러오기 → 열 확인 → 붙은·불일치·빈 칸 건수
 *   - 저장 → 새로고침 후 유지 → 다시 불러오면 열을 묻지 않음 → 지우기
 *   - 4시트 가격표, 빈 서식 내려받기
 *   - 가격표 없음: 단가 미등록 표시, 내려받기 동작
 *   - 고객용 출력·작업 파일에 원가 없음, 영업팀용에만 원가
 *   - 네트워크로 보내는 요청이 없음
 */
import { readFileSync } from 'node:fs';
import { expect, test, type Download, type Page } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { buildSimpleXlsx, type XlsxCell } from '../../src/services/price-book/xlsxWriter';
import { readXlsxWorkbook } from '../../src/services/private-cost/readTable';
import { expandWorkspaceSections, mockResources } from './fixtures';

const SHA = 'a'.repeat(64);
const COST_SENTINEL = '7654321';

function product(sku: string, row: number, quoteName: string, spec: string) {
  return {
    productId: sku,
    sku,
    brand: '',
    model: spec,
    quoteName,
    quoteSpec: spec,
    unit: 'EA',
    options: { group: '합성 장비', sheet: '영상', sourceRow: String(row) },
    currency: 'KRW',
    evidence: 'verified',
  };
}

const PRODUCTS = {
  schemaVersion: 1,
  generatedOn: '2026-01-01',
  sourceSha256: SHA,
  products: [product('FIX-0001', 5, '합성 테스트 품목', 'FIX-SPEC'), product('FIX-0002', 6, '합성 두번째 품목', 'FIX-2')],
};

const n = (value: string): XlsxCell => ({ number: value });

/** 가짜 표준품셈 원본 — 2·3행 2단 머리글, 6행은 판이 달라 품명이 다르다. */
function fakePumsem(): Buffer {
  const rows: XlsxCell[][] = [
    ['가짜 품셈'],
    ['번호', '품 명', '규 격', '설 명', '단위', '수량', '원가', undefined, '재료비', undefined, '비 고', '제조사/구매처'],
    [undefined, undefined, undefined, undefined, undefined, undefined, '단 가', '금 액', '단 가', '금 액'],
    [undefined, '[ 영상 ]'],
    ['1', '합성 테스트 품목', 'FIX-SPEC', '', 'EA', n('1'), n('800000'), undefined, n('1200000'), undefined, '', '가짜 매입처'],
    ['2', '판이 다른 품목', 'FIX-2', '', 'EA', n('1'), n('1'), undefined, n('2')],
  ];
  return Buffer.from(buildSimpleXlsx([{ name: '영상', rows, merges: ['G2:H2', 'I2:J2'] }]));
}

function fakeFourSheet(cost: string, selling: string): Buffer {
  return Buffer.from(
    buildSimpleXlsx([
      {
        name: '품목 단가',
        rows: [
          ['품목코드', '모델', '품명', '원가', '판매가', '비고'],
          ['FIX-0001', 'FIX-SPEC', '합성 테스트 품목', n(cost), n(selling)],
        ],
      },
      { name: '기본값', rows: [['선 종류']] },
      { name: '노무 확인', rows: [['품셈 연결 코드']] },
      { name: '간접비', rows: [['항목']] },
    ]),
  );
}

async function chooseFile(page: Page, name: string, buffer: Buffer): Promise<void> {
  await page.getByLabel('가격표 파일 선택').setInputFiles({
    name,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer,
  });
}

async function makeQuote(page: Page): Promise<void> {
  await page.getByRole('button', { name: '품목 직접 선택' }).click();
  await page.getByLabel('품목 검색').fill('합성 테스트 품목');
  await page.getByRole('button', { name: '추가', exact: true }).first().click();
  await page.getByRole('button', { name: '견적 만들기' }).click();
  await expect(page.locator('.q-quote-sheet').first()).toBeVisible();
}

const quoteRow = (page: Page) => page.locator('.q-quote-table tbody tr', { hasText: '합성 테스트 품목' }).first();
const priceState = (page: Page) => page.locator('[data-price-book-state]');

async function bytesOf(download: Download): Promise<Uint8Array> {
  return new Uint8Array(readFileSync((await download.path())!));
}

function allXml(bytes: Uint8Array): string {
  return Object.entries(unzipSync(bytes))
    .filter(([name]) => name.endsWith('.xml'))
    .map(([, b]) => strFromU8(b))
    .join('\n');
}

/** 앱이 바깥으로 보내는 요청 — 같은 origin의 GET 읽기 외에는 없어야 한다. */
function watchRequests(page: Page): string[] {
  const sent: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    // 일반 설정은 localhost(vite dev), portal 설정은 127.0.0.1(정적 서버)에서 돈다.
    const sameOriginRead = request.method() === 'GET' && ['localhost', '127.0.0.1'].includes(url.hostname);
    // 배포 자료 경로로 가격 파일을 찾지도 않는다(개발 서버의 소스 모듈 요청은 제외).
    if (!sameOriginRead || /\/data\/.*price/i.test(url.pathname)) {
      sent.push(`${request.method()} ${request.url()}`);
    }
  });
  return sent;
}

test('표준품셈 원본 — 열 확인 → 결과 건수 → 열린 견적에 적용 → 새로고침 후 유지 → 지우기', async ({ page }) => {
  await mockResources(page, { '/data/approved/products.json': PRODUCTS, '/data/approved/prices.json': 'browser' });
  const sent = watchRequests(page);
  page.on('dialog', (dialog) => void dialog.accept());
  await page.goto('./');

  // 가격표가 없으면 '단가 미등록'이다(0이 아니다).
  await expect(priceState(page)).toHaveAttribute('data-price-book-state', 'none');
  await expect(page.getByRole('status').filter({ hasText: '가격표가 없습니다' })).toBeVisible();
  await makeQuote(page);
  await expect(quoteRow(page)).toContainText('단가 미등록');

  // 처음 한 번은 원가 열·판매가 열을 확인한다 — 머리글 이름으로 미리 골라져 있다.
  await chooseFile(page, '가짜-품셈.xlsx', fakePumsem());
  const chooser = page.getByLabel('가격표 열 확인');
  await expect(chooser).toBeVisible();
  await expect(chooser.getByLabel('원가 열')).toHaveValue('6');
  await expect(chooser.getByLabel('판매가 열')).toHaveValue('8');
  // 매입처·비고 열은 고를 수 없다.
  await expect(chooser.getByLabel('원가 열').locator('option', { hasText: '제조사/구매처' })).toHaveCount(0);
  await chooser.getByRole('button', { name: '이 열로 불러오기' }).click();

  const result = page.getByRole('status', { name: '가격표 불러오기 결과' });
  await expect(result.locator('[data-count="applied"]')).toHaveText('1');
  await expect(result.locator('[data-count="mismatched"]')).toHaveText('1');
  await expect(result.locator('[data-count="blank"]')).toHaveText('0');
  await result.getByText('확인할 행·시트 보기').click();
  await expect(result).toContainText("가격표 행 불일치, 확인 필요 — 시트 '영상' 6행 (FIX-0002)");
  await expect(priceState(page)).toHaveAttribute('data-price-book-state', 'active');
  await expect(page.getByRole('status').filter({ hasText: '가격표가 없습니다' })).toHaveCount(0);

  // 열린 견적은 조용히 바뀌지 않는다 — 사람이 눌러야 적용된다.
  await expect(quoteRow(page)).toContainText('단가 미등록');
  await page.getByRole('button', { name: '열린 견적에 가격표 단가 적용' }).click();
  await expect(quoteRow(page)).toContainText('1200000');
  await expect(page.getByRole('status').filter({ hasText: '단가 1행을 가격표로 바꿨습니다' })).toBeVisible();

  // 새로고침해도 가격표는 이 브라우저에 남아 있다.
  await page.reload();
  await expect(priceState(page)).toHaveAttribute('data-price-book-state', 'active');
  await expect(page.locator('[data-price-book-state]')).toContainText('판매가 1건 · 원가 1건');
  await makeQuote(page);
  await expect(quoteRow(page)).toContainText('1200000');

  // 같은 판 파일을 다시 고르면 저장한 열 선택을 그대로 쓴다 — 다시 묻지 않는다.
  await chooseFile(page, '가짜-품셈.xlsx', fakePumsem());
  await expect(page.getByRole('status', { name: '가격표 불러오기 결과' })).toBeVisible();
  await expect(page.getByLabel('가격표 열 확인')).toHaveCount(0);

  // 지우기 → 새로고침해도 없다.
  await page.getByRole('button', { name: '가격표 지우기' }).click();
  await expect(priceState(page)).toHaveAttribute('data-price-book-state', 'none');
  // 화면에서는 바로 빠지고, 저장소 지우기가 끝나면 알린다 — 그 뒤에 새로고침한다.
  await expect(page.getByRole('status').filter({ hasText: '저장된 가격표(원가·판매가·열 선택)를 지웠습니다' })).toBeVisible();
  await page.reload();
  await expect(priceState(page)).toHaveAttribute('data-price-book-state', 'none');
  await expect(page.getByRole('status').filter({ hasText: '가격표가 없습니다' })).toBeVisible();

  // 가격표는 브라우저 저장소(IndexedDB)에만 있다 — localStorage를 쓰지 않고, 바깥으로 보내지 않는다.
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /price|가격/i.test(k)))).toEqual([]);
  expect(sent).toEqual([]);
});

test('빈 가격표 서식 내려받기 → 채운 4시트 가격표 불러오기', async ({ page }) => {
  await mockResources(page, { '/data/approved/products.json': PRODUCTS, '/data/approved/prices.json': 'browser' });
  await page.goto('./');

  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: '빈 가격표 서식 내려받기' }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('가격표-서식.xlsx');
  const sheets = readXlsxWorkbook(await bytesOf(download));
  expect(sheets.map((s) => s.name)).toEqual(['품목 단가', '기본값', '노무 확인', '간접비']);
  const items = sheets[0]!.rows;
  expect(items[0]).toEqual(['품목코드', '모델', '품명', '원가', '판매가', '비고']);
  expect(items.slice(1).map((r) => r.slice(0, 3))).toEqual([
    ['FIX-0001', 'FIX-SPEC', '합성 테스트 품목'],
    ['FIX-0002', 'FIX-2', '합성 두번째 품목'],
  ]);
  for (const row of items.slice(1)) expect([row[3] ?? '', row[4] ?? '']).toEqual(['', '']);
  expect(sheets[1]!.rows.map((r) => r[0])).toEqual(expect.arrayContaining(['선 종류', 'HDMI', 'LAN', 'A.AUDIO']));

  await chooseFile(page, '채운-가격표.xlsx', fakeFourSheet('500', '900'));
  const result = page.getByRole('status', { name: '가격표 불러오기 결과' });
  await expect(result.locator('[data-count="applied"]')).toHaveText('1');
  await expect(page.getByLabel('가격표 열 확인')).toHaveCount(0);
  await expect(priceState(page)).toContainText('4시트 가격표');
  await result.getByText('확인할 행·시트 보기').click();
  await expect(result).toContainText("읽지 않은 시트 '기본값' — 이번 판에서는 읽지 않음");
});

test('가격표 없음 — 단가 미등록으로 보이고 내려받기는 막지 않는다', async ({ page }) => {
  await mockResources(page, { '/data/approved/prices.json': 'missing' });
  await page.goto('./');
  await makeQuote(page);
  await expect(quoteRow(page)).toContainText('단가 미등록');
  await expect(quoteRow(page)).not.toContainText('0원');

  page.on('dialog', (dialog) => void dialog.accept());
  const button = page.getByRole('button', { name: 'Excel 다운로드' });
  await expect(button).toBeEnabled();
  const event = page.waitForEvent('download');
  await button.click();
  const files = unzipSync(await bytesOf(await event));
  expect(files['[Content_Types].xml']).toBeDefined();
});

test('고객용 출력과 작업 파일에는 가격표 원가가 없고, 영업팀용에만 있다', async ({ page }) => {
  await mockResources(page, { '/data/approved/products.json': PRODUCTS, '/data/approved/prices.json': 'browser' });
  page.on('dialog', (dialog) => void dialog.accept());
  await page.goto('./');
  await chooseFile(page, '채운-가격표.xlsx', fakeFourSheet(COST_SENTINEL, '1500000'));
  await expect(page.getByRole('status', { name: '가격표 불러오기 결과' }).locator('[data-count="applied"]')).toHaveText('1');

  await makeQuote(page);
  await expect(quoteRow(page)).toContainText('1500000');
  await expandWorkspaceSections(page);
  await expect(page.locator('[data-price-book-cost]')).toContainText('가격표 원가 사용 중 — 1품목');

  const button = page.getByRole('button', { name: 'Excel 다운로드' });
  const xml: Record<string, string> = {};
  for (const grade of ['2 고객용', '1 공유용', '0 영업팀용'] as const) {
    await page.getByRole('radio', { name: grade }).check();
    const event = page.waitForEvent('download');
    await button.click();
    xml[grade] = allXml(await bytesOf(await event));
  }
  expect(xml['2 고객용']).not.toContain(COST_SENTINEL);
  expect(xml['1 공유용']).not.toContain(COST_SENTINEL);
  expect(xml['0 영업팀용']).toContain(COST_SENTINEL);

  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: '작업 파일로 저장' }).click();
  const work = readFileSync((await (await saved).path())!, 'utf8');
  expect(work).not.toContain(COST_SENTINEL);
  expect(work).toContain('1500000');
});
