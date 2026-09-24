import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPublicDetail } from '../beta/group1-public.mjs';

test('public detail projection removes private workflow and image binaries but preserves review states', () => {
  const source = {
    productId: 'AVP-9999', referenceCommit: 'private', manufacturer: 'Fixture', model: 'M1', productName: 'M1',
    packageStatus: 'READY WITH REVIEW FLAGS', categories: ['Video'], itemType: 'PRODUCT', english: 'Example', korean: '예시',
    overview: '공식 제품 설명', features: [{ text: '기능', source: 'P, 내부 기록' }],
    specifications: [{ group: 'Video', name: 'Value', value: 'MISSING', verification: 'MISSING', source: '내부 기록' }],
    io: [{ group: 'Video', connector: 'HDMI', signal: 'Video', direction: 'IN', quantity: 'REVIEW REQUIRED', verification: 'PARTIAL', source: 'P, 내부 기록' }],
    images: [{ role: 'Main', file: 'private.jpg', sourceUrl: 'https://example.com/private.jpg' }],
    imageStatuses: [{ role: 'Main', status: 'REVIEW REQUIRED', sourceUrl: 'https://example.com/private.jpg' }],
    documents: [
      { type: 'Official Product Page', title: 'Page', status: 'VERIFIED', url: 'https://example.com/product' },
      { type: 'User Manual', title: 'Manual', status: 'MISSING', url: 'https://example.com/fake', note: 'local secret' },
      { type: 'Independent Specification', title: 'Independent Spec', status: 'MISSING' },
      { type: 'Specification', title: 'Spec', status: 'FOUND', url: 'https://example.com/spec' },
      { type: 'Technical Document', title: 'Tech', status: 'REVIEW REQUIRED', url: 'https://example.com/tech' }
    ],
    sources: [{ code: 'P', name: 'Internal Work package', url: 'https://example.com/product', scope: 'C:/Users/secret' }],
    issues: [{ code: 'R1', status: 'REVIEW REQUIRED', title: '검토', detail: '내부 메모' }],
    presentation: { galleryRights: 'local path' }
  };
  const result = projectPublicDetail(source, { summary: '공식 근거 검토 중', issues: [{ code: 'R1', status: 'REVIEW REQUIRED', title: '이미지', detail: '게시 권한 미확인' }] });
  assert.equal(result.packageStatus, 'REVIEW REQUIRED');
  assert.deepEqual(result.images, []);
  assert.equal(result.imageStatuses[0].sourceUrl, 'https://example.com/product');
  assert.equal(result.documents.find(item => item.type === 'User Manual').url, undefined);
  assert.equal(result.specifications[0].verification, 'MISSING');
  assert.equal(result.io[0].verification, 'PARTIAL');
  assert.equal(result.sources[0].scope.includes('C:/'), false);
  assert.ok(!JSON.stringify(result).includes('private.jpg'));
  assert.ok(!JSON.stringify(result).includes('AVP-9999'));
  assert.ok(!JSON.stringify(result).includes('local secret'));
});
