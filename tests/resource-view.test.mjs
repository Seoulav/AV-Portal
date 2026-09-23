import test from 'node:test';
import assert from 'node:assert/strict';
import { groupResources, resourceDisplay } from '../app/public/catalog-view.mjs';

function resource(resource_id, kind, language, extra = {}) {
  return {
    resource_id, title: resource_id, kind, language, authority: 'OFFICIAL',
    revision: null, checked_on: null, verification: 'CONTENT_VIEWED',
    applicability: 'UNASSESSED', url: 'https://example.com/' + resource_id,
    kind_basis: null, ...extra
  };
}

test('groups by document type and places explicit Korean before English within each group', () => {
  const groups = groupResources([
    resource('en-manual', 'MANUAL', 'en'),
    resource('other', 'UNCLASSIFIED', null),
    resource('ko-manual', 'MANUAL', 'ko'),
    resource('product', 'PRODUCT_PAGE', 'en'),
    resource('datasheet', 'DATASHEET', null),
    resource('control', 'CONTROL', null),
    resource('unknown', 'NEW_KIND', null)
  ]);
  assert.deepEqual(groups.map(group => group.label), [
    '제품 페이지·지원', '사양서·카탈로그', '매뉴얼', '제어 자료', '기타 자료'
  ]);
  assert.deepEqual(groups.find(group => group.label === '매뉴얼').items.map(item => item.resource_id),
    ['ko-manual', 'en-manual']);
  assert.equal(groups.find(group => group.label === '기타 자료').items.length, 2);
});

test('labels missing metadata, provisional evidence and direct local material without claiming validation', () => {
  const display = resourceDisplay(resource('R1', 'MANUAL', null, {
    authority: 'MANUFACTURER_DIRECT', url: null, verification: 'FILENAME_MATCH_BODY_UNREAD',
    applicability: 'FILENAME_CANDIDATE', kind_basis: 'TITLE_URL_CLASSIFICATION'
  }));
  assert.equal(display.language, '언어 미확인');
  assert.equal(display.revision, '개정 미확인');
  assert.equal(display.checked_on, '확인일 미확인');
  assert.match(display.authority, /제조사 직접 제공/);
  assert.match(display.authority, /파일 열기 미지원/);
  assert.match(display.verification, /본문 미확인/);
  assert.match(display.applicability, /후보/);
  assert.equal(display.kind_basis, '제목·URL 기준 분류');
  assert.equal(display.url, null);
  assert.doesNotMatch(JSON.stringify(display), /검증 완료|공개 준비 완료/);
});

test('keeps unregistered safe codes visible with a warning and rejects unsafe links', () => {
  const display = resourceDisplay(resource('R2', 'NEW_KIND', 'ko', {
    authority: 'NEW_AUTHORITY', verification: 'NEW_VERIFICATION',
    applicability: 'NEW_APPLICABILITY', url: 'javascript:alert(1)'
  }));
  assert.match(display.kind, /NEW_KIND.*해석 미등록/);
  assert.match(display.authority, /NEW_AUTHORITY.*해석 미등록/);
  assert.match(display.verification, /NEW_VERIFICATION.*해석 미등록/);
  assert.match(display.applicability, /NEW_APPLICABILITY.*해석 미등록/);
  assert.equal(display.url, null);
  const inheritedCode = resourceDisplay(resource('R4', 'constructor', 'ko'));
  assert.equal(inheritedCode.kind, 'constructor · 해석 미등록');
  const pathCode = resourceDisplay(resource('R3', 'C:\\Users\\private', 'ko'));
  assert.doesNotMatch(JSON.stringify(pathCode), /private/);
});
