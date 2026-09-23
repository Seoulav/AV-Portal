import test from 'node:test';
import assert from 'node:assert/strict';
import { validateResourceRegister } from '../app/resource-register.mjs';

const catalog = { products: [{ id: 'P1' }, { id: 'P2' }] };

function sampleRegister() {
  return {
    products: [
      { product_id: 'P1', resource_ids: ['R1', 'R2'], folder: 'C:\\Users\\private\\docs' },
      { product_id: 'P2', resource_ids: ['R1'] }
    ],
    resources: [
      {
        resource_id: 'R1', title: '공식 매뉴얼', authority: 'OFFICIAL', kind: 'MANUAL',
        url: 'https://example.com/manual', local_reference: '/home/private/manual.pdf',
        language: 'ko', revision: '1.0', verification: 'CONTENT_VIEWED', checked_on: '2026-09-23'
      },
      {
        resource_id: 'R2', title: 'C:\\Users\\private\\secret.pdf', authority: 'MANUFACTURER_DIRECT',
        kind: 'NEW_KIND', url: 'file:///home/private/secret.pdf',
        local_reference: 'C:\\Users\\private\\secret.pdf', language: null, revision: null,
        verification: 'FILENAME_MATCH_BODY_UNREAD', checked_on: null
      }
    ],
    product_resource_links: [
      { product_id: 'P1', resource_id: 'R2', applicability: 'CANDIDATE' },
      { product_id: 'P1', resource_id: 'R1', applicability: 'EXACT_MODEL' },
      { product_id: 'P2', resource_id: 'R1', applicability: 'EXACT_MODEL' }
    ]
  };
}

test('joins shared resources by IDs, sorts explicit Korean first and hides private paths', () => {
  const index = validateResourceRegister(sampleRegister(), catalog);
  assert.equal(index.productCount, 2);
  assert.equal(index.resourceCount, 2);
  assert.equal(index.associationCount, 3);
  assert.deepEqual(index.resourcesFor('P1').map(item => item.resource_id), ['R1', 'R2']);
  assert.deepEqual(index.resourcesFor('P2').map(item => item.resource_id), ['R1']);
  const items = index.resourcesFor('P1');
  assert.equal(items[0].applicability, 'EXACT_MODEL');
  assert.equal(items[1].url, null);
  assert.equal(items[1].title, '자료 제목 확인 필요');
  assert.equal(items[1].kind, 'NEW_KIND');
  assert.equal(items[1].revision, null);
  assert.doesNotMatch(JSON.stringify(items), /private|file:|folder|local_reference/i);
});

test('ignores an exact duplicate association but rejects conflicting applicability', () => {
  const data = sampleRegister();
  data.product_resource_links.push({ ...data.product_resource_links[0] });
  assert.equal(validateResourceRegister(data, catalog).resourcesFor('P1').length, 2);
  data.product_resource_links.at(-1).applicability = 'EXACT_MODEL';
  assert.throws(() => validateResourceRegister(data, catalog), /자료대장/);
});

test('rejects duplicate IDs, missing references and reverse-index mismatch', () => {
  const variants = [
    data => data.products.push({ product_id: 'P1', resource_ids: [] }),
    data => data.resources.push({ ...data.resources[0] }),
    data => data.product_resource_links.push({ product_id: 'P2', resource_id: 'missing', applicability: 'CANDIDATE' }),
    data => data.products[0].resource_ids.pop(),
    data => data.products[0].resource_ids.push('R1'),
    data => data.products[0].product_id = 'C:\\Users\\private'
  ];
  for (const mutate of variants) {
    const data = sampleRegister();
    mutate(data);
    assert.throws(() => validateResourceRegister(data, catalog), /자료대장/);
  }
});

test('accepts resources with missing optional metadata without inventing values', () => {
  const data = sampleRegister();
  data.resources[0].language = null;
  data.resources[0].revision = null;
  data.resources[0].checked_on = null;
  const item = validateResourceRegister(data, catalog).resourcesFor('P1')[1];
  assert.equal(item.language, null);
  assert.equal(item.revision, null);
  assert.equal(item.checked_on, null);
});

test('does not expose credentialed, script or plain HTTP URLs', () => {
  for (const url of ['https://user:pass@example.com/x', 'javascript:alert(1)', 'http://example.com/x']) {
    const data = sampleRegister();
    data.resources[0].url = url;
    assert.equal(validateResourceRegister(data, catalog).resourcesFor('P1')[0].url, null);
  }
});

test('rejects an HTTPS URL that carries a local path in its query', () => {
  const data = sampleRegister();
  data.resources[0].url = 'https://example.com/view?file=C:%5CUsers%5Cprivate%5Cmanual.pdf';
  assert.equal(validateResourceRegister(data, catalog).resourcesFor('P1')[0].url, null);
});

test('conflicting duplicate relations remain invalid even when both statuses are unsafe to display', () => {
  const data = sampleRegister();
  data.product_resource_links[0].applicability = 'C:\\Users\\a';
  data.product_resource_links.push({ ...data.product_resource_links[0], applicability: 'C:\\Users\\b' });
  assert.throws(() => validateResourceRegister(data, catalog), /자료대장/);
});
