import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { beforeW005Product } from './w005-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

test('BEHX-H guide confirms an ANT connector but does not prove its physical count', () => {
  const product = read('beta/site/detail/data/lh43behhlbfxkr.json');
  assert.equal(product.io.length, 6);
  assert.deepEqual(product.io[3], {
    group: 'Video', connector: 'RF 입력', signal: '지상파·케이블 방송 입력',
    direction: 'IN', quantity: '', protocol: 'RF',
    availability: '공식 스펙: 지상파/케이블/위성 1/1/0 · 설치가이드 1쪽 단자 안내에 ANT 단자 표시 · 물리 단자 수는 미확인',
    condition: '', source: 'P, IG', verification: 'VERIFIED',
  });
  assert.equal(sha(product.io.filter((_, index) => index !== 3)), 'e55093dc17531d361a8e8a3e15a82aff39639a7555b68fbc78cd49566c81db02');
  const guide = product.sources.find(source => source.code === 'IG');
  assert.match(guide?.name ?? '', /삼성전자.*BN68-26620A-01/);
  assert.match(guide?.scope ?? '', /1쪽.*ANT.*43~85인치 공용/);
  assert.match(guide?.scope ?? '', /manuals\/samsung-behx-h-installation-guide-ko\.pdf/);
  assert.equal(product.portMap, undefined);
});

test('BEHX-H evidence update leaves other product data and uploaded documents intact', () => {
  const product = read('beta/site/detail/data/lh43behhlbfxkr.json');
  const hashes = {
    specifications: 'efa7a77b62deb2a674a066da4a6a2b386542c14cd01a478d7f3e6ab299bdcfd2',
    keyFacts: '573adab65462cec3d5619355922e836a1890e2fbda83869983d7abb581e70447',
    images: 'dc042f1f103a9a26ddee56def9ef2caeec37007bd9f165009dc8dd4f5e0b08d7',
    documents: '52b9daaf350c5f45dbe1199767d07315d19342bcfb8e8d4ad2e322a84de5912d',
    issues: 'f8352e13333d06ddbfa932281efe2b0659136b6d642487cb89e9c348b1ed92b1',
  };
  for (const [field, expected] of Object.entries(hashes)) assert.equal(sha(product[field]), expected, field);
  const manifest = read('beta/site/docs/manifest.json');
  assert.equal(manifest.uploads.length, 110);
  assert.equal(manifest.uploads.filter(item => item.locked === true).length, 12);
});

test('historical inverse exposes unrelated I/O changes and rejects altered guide evidence', () => {
  const product = read('beta/site/detail/data/lh43behhlbfxkr.json');
  const changedIo = structuredClone(product);
  changedIo.io[0].quantity = '99';
  assert.equal(beforeW005Product(changedIo, 'lh43behhlbfxkr').io[0].quantity, '99');
  const changedGuide = structuredClone(product);
  changedGuide.sources.find(source => source.code === 'IG').scope = 'unverified';
  assert.throws(() => beforeW005Product(changedGuide, 'lh43behhlbfxkr'), /installation-guide source changed/);
});
