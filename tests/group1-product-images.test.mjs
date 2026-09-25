import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const site = new URL('../beta/site/detail/', import.meta.url);
const expected = {
  'brc-am7': ['Main', 'Front', 'Rear', 'Perspective'],
  dm7: ['Front', 'Rear', 'Perspective'],
  'ki-pro-go2': ['Main', 'Rear'],
  'pt-mz17k': ['Front', 'Perspective'],
  'rally-bar': ['Front', 'Perspective']
};

test('Group 1 product pages publish only the reviewed official image roles', async () => {
  for (const [slug, roles] of Object.entries(expected)) {
    const product = JSON.parse(await readFile(new URL(`data/${slug}.json`, site), 'utf8'));
    assert.deepEqual(product.images.map(image => image.role), roles, `${slug}: image roles`);
    assert.equal(product.presentation.visualVariant, 'official-product-images');
    assert.match(product.presentation.galleryRightsBadge, /사용자 게시 승인/);
    assert.match(product.presentation.galleryRights, /제조사 재사용 권리.*미확인/);

    for (const image of product.images) {
      assert.match(image.file, new RegExp(`^${slug}-(?:main|front|rear|perspective)\\.webp$`));
      assert.equal(image.officialSource, true);
      assert.ok(['FOUND', 'VERIFIED'].includes(image.verificationStatus));
      assert.match(image.publicationStatus, /사용자 게시 승인/);
      assert.match(image.publicationStatus, /제조사 재사용 권리 미확인/);
      assert.match(image.sourceUrl, /^https:\/\//);
      const file = new URL(`images/${image.file}`, site);
      const bytes = await readFile(file);
      assert.ok((await stat(file)).size > 10_000, `${image.file}: usable image file`);
      assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${image.file}: WebP RIFF header`);
      assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${image.file}: WebP signature`);
    }
  }
});

test('missing rear roles stay missing rather than borrowing another model image', async () => {
  for (const slug of ['pt-mz17k', 'rally-bar']) {
    const product = JSON.parse(await readFile(new URL(`data/${slug}.json`, site), 'utf8'));
    assert.equal(product.images.some(image => image.role === 'Rear'), false);
  }
});
