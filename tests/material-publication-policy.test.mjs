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
      assert.match(image.publicationStatus, /사용자 게시 승인/);
      assert.ok(image.sourceUrl, `${file}: image source`);
    }
  }
});
