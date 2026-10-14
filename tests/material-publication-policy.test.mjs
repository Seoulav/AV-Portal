import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const detailDir = new URL('../beta/site/detail/data/', import.meta.url);

test('published product data uses provenance without manufacturer-permission gates', async () => {
  for (const file of await readdir(detailDir)) {
    if (!file.endsWith('.json')) continue;
    const product = JSON.parse(await readFile(new URL(file, detailDir), 'utf8'));
    assert.doesNotMatch(JSON.stringify(product), /제조사 (?:재사용|재배포) 권리|재게시 권한 미확인|권리 확인 필요/, file);
    for (const image of product.images) {
      if (file === 'ds-8s.json' && image.role === 'Rear') {
        // The DS-8S rear is a manufacturer photograph supplied directly by
        // the user, so there is no public origin URL to invent.
        assert.equal(image.officialSource, false);
        assert.equal(image.provider, 'VS ENT');
        assert.equal(image.model, 'DS-8S');
        assert.match(image.note, /제조사 제공 실물 사진\(사용자 업로드, 2026-10-13\)/);
        assert.match(image.publicationStatus, /사용자 게시 승인/);
        assert.equal(image.sourceUrl, undefined);
      } else if (file === 'emision-pixelfit.json') {
        assert.equal(image.publicationStatus, '사용자 제공 화면 캡처');
        assert.equal(image.provider, '사용자 제공 SD컴퍼니 소개서(2026-10-13)');
        assert.equal(image.model, product.model);
      } else if (file === 'carbonite-ultra.json') {
        assert.equal(image.provider, '사용자 제공');
        assert.equal(image.model, product.model);
        assert.match(image.publicationStatus, /사용자 제공 사진/);
        assert.equal(image.sourceUrl, undefined);
      } else {
        assert.match(image.publicationStatus, /사용자 게시 승인/);
        assert.ok(image.sourceUrl, `${file}: image source`);
      }
    }
  }
});
