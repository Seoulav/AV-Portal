import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPublicProducts } from '../beta/select.mjs';

const source = (url, verification = '열람 본문에 모델명 확인 / 제품 페이지 / 2026-09-23') => ({ url, verification, document_type: 'PRODUCT_PAGE', source_record: 'secret-row' });
const product = (id, overrides = {}) => ({
  id, brand: 'Example Audio', product: `Model ${id}`, categories: ['음향', '제어'],
  item_type: 'PRODUCT', aliases: ['private alias'],
  official_sources: [source(`https://example.com/products/${id}`)],
  supplemental_sources: [{ url: 'https://supplemental.example.net/private' }],
  direct_evidence: ['private material'], source_records: [{ record_id: 'secret-row', sheet: 'internal', row: 10 }],
  notes: 'private memo', ...overrides
});

test('includes only explicit decisions and projects the five allowed public fields', () => {
  const catalog = { products: [product('A'), product('B', { item_type: 'SERVICE', categories: ['서비스'] }), product('C')] };
  const decisions = { approved: [
    { id: 'A', urls: ['https://example.com/products/A'], official_hosts: ['example.com'] },
    { id: 'B', urls: ['https://example.com/products/B'], official_hosts: ['example.com'] }
  ] };
  const result = selectPublicProducts(catalog, decisions);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0], {
    brand: 'Example Audio', product: 'Model A', categories: ['음향', '제어'],
    kind: 'equipment', official_links: ['https://example.com/products/A']
  });
  assert.equal(result[1].kind, 'service');
  assert.doesNotMatch(JSON.stringify(result), /secret-row|private alias|private memo|private material|supplemental/);
});

test('refuses unverified, PDF, credentialed and mismatched-domain links', () => {
  for (const badSource of [
    source('https://example.com/products/A', '검색 근거 있음 · 본문 열람 실패'),
    source('https://example.com/spec.pdf'),
    source('https://example.com/download?file=model.pdf'),
    source('https://user:pass@example.com/products/A'),
    source('https://other.example.com/products/A'),
    { ...source('https://example.com/products/A'), document_type: 'PDF' }
  ]) {
    const catalog = { products: [product('A', { official_sources: [badSource] })] };
    const decisions = { approved: [{ id: 'A', urls: [badSource.url], official_hosts: ['example.com'] }] };
    assert.throws(() => selectPublicProducts(catalog, decisions));
  }
});

test('refuses unknown, duplicate or identity-uncertain selections', () => {
  const catalog = { products: [product('A')] };
  const decision = { id: 'A', urls: ['https://example.com/products/A'], official_hosts: ['example.com'] };
  assert.throws(() => selectPublicProducts(catalog, { approved: [{ ...decision, id: 'missing' }] }));
  assert.throws(() => selectPublicProducts(catalog, { approved: [decision, decision] }));
  assert.throws(() => selectPublicProducts({ products: [product('A', { brand: null })] }, { approved: [decision] }));
  assert.throws(() => selectPublicProducts({ products: [product('A', { identity_status: 'CANDIDATE_MATCH' })] }, { approved: [decision] }));
});
