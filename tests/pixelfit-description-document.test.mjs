import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { userReferences, userReferenceLinksFor } from '../beta/user-manuals.mjs';
import { uploadedDocumentsFor, documentActionLabels } from '../beta/site/detail/pdf-documents.mjs';

const slug = 'emision-pixelfit';
const title = 'emision PixelFit \uC124\uBA85\uC790\uB8CC(\uC0AC\uC6A9\uC790 \uC81C\uACF5)';
const product = JSON.parse(readFileSync(new URL('../beta/site/detail/data/emision-pixelfit.json', import.meta.url)));
const catalog = JSON.parse(readFileSync(new URL('../beta/site/catalog.json', import.meta.url)));
const manifest = JSON.parse(readFileSync(new URL('../beta/site/docs/manifest.json', import.meta.url)));

test('PixelFit publishes the explanatory PDF separately from the six-page screen guide', () => {
  const refs = userReferences.filter(item => item.product === 'emision PixelFit');
  assert.deepEqual(refs.map(({ file, title: name }) => ({ file, title: name })), [
    { file: 'emision-pixelfit-capture.pdf', title: 'emision PixelFit \uD654\uBA74 \uC548\uB0B4(\uC0AC\uC6A9\uC790 \uC81C\uACF5)' },
    { file: 'emision-pixelfit-description.pdf', title }
  ]);
  const file = new URL('../beta/site/manuals/emision-pixelfit-description.pdf', import.meta.url);
  assert.equal(existsSync(file), true);
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), 'e25ccb1547e9711f25f7c618f18314c7df93e113ec2698b12319cce222476dbe');
  const catalogItem = catalog.find(item => item.slug === slug);
  assert.deepEqual(catalogItem.reference_link, ['./manuals/emision-pixelfit-capture.pdf', './manuals/emision-pixelfit-description.pdf']);
  assert.deepEqual(userReferenceLinksFor({ brand: 'SD컴퍼니', product: 'emision PixelFit' }), catalogItem.reference_link);
  assert.deepEqual(manifest.uploads.filter(item => item.slug === slug).map(({ file: path, title: name, kind }) => ({ file: path, title: name, kind })), [
    { file: 'manuals/emision-pixelfit-capture.pdf', title: refs[0].title, kind: 'reference' },
    { file: 'manuals/emision-pixelfit-description.pdf', title, kind: 'reference' }
  ]);
  const documents = uploadedDocumentsFor(slug, manifest);
  assert.deepEqual(documents.map(item => item.title), refs.map(item => item.title));
  assert.ok(documents.every(item => item.action.kind === 'local'));
  assert.ok(documents.every(item => documentActionLabels(item, item.action).download));
});

test('PixelFit presents two parent modes and nests NVIDIA and AMD under desktop masking', () => {
  const modes = product.settings.find(item => item.kind === 'modes');
  assert.deepEqual(modes.items.map(item => item.name), [
    'GPU \uCEE4\uC2A4\uD140 \uD574\uC0C1\uB3C4 \uBAA8\uB4DC',
    '\uBC14\uD0D5\uD654\uBA74 \uB9C8\uC2A4\uD0B9 \uBAA8\uB4DC'
  ]);
  assert.match(modes.items[0].summary, /NVIDIA/);
  assert.match(modes.items[1].summary, /NVIDIA.*AMD/);
  assert.match(modes.items[1].detail, /emision/);
  assert.match(product.overview, /\uC0AC\uC6A9\uC790 \uAD6C\uB450 \uC124\uBA85/);
  assert.deepEqual(product.specifications.filter(item => item.source === 'D').map(item => item.name), [
    '작업 모드',
    'GPU 커스텀 해상도 모드',
    '바탕화면 마스킹 모드',
    '마스킹 모드 GPU 선택지',
    '설명자료 표시 영역 예시',
    '적용 확인'
  ]);
  assert.equal(product.specifications.some(item => ['NVIDIA 적용 방식', 'AMD 적용 방식'].includes(item.name)), false);
  assert.ok(product.specifications.every(item => !item.name.includes('?')));
  const evidence = product.sources.find(item => item.code === 'D');
  assert.equal(product.sources.filter(item => item.code === 'D').length, 1);
  assert.equal(product.sources.some(item => item.name.includes('?')), false);
  assert.ok(evidence);
  for (const page of [3, 4, 6, 8, 9, 11]) assert.match(evidence.scope, new RegExp(page + '.{0,2}' + String.fromCharCode(0xCABD)));
  assert.match(evidence.scope, /\uAD6C\uB450/);
  assert.ok(product.features.some(item => /NVIDIA \uD558\uB4DC\uC6E8\uC5B4 \uB9C8\uC2A4\uD06C/.test(item.text)));
  assert.ok(product.features.some(item => /AMD \uD558\uB4DC\uC6E8\uC5B4 \uB9C8\uC2A4\uD06C/.test(item.text)));
  const example = product.settings.find(item => item.kind === 'screen-examples').items[0];
  assert.match(example.method, /NVIDIA.*AMD/);
});
