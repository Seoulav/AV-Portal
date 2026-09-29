import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDocumentAction, uploadedDocumentsFor, documentCardVisible } from '../prototype/brc-am7/pdf-documents.mjs';

const source = 'https://example.com/manual.pdf';
const manifest = {
  mirrors: [{ url: source, file: 'camera-user-manual-aabbcc.pdf', sha256: 'a'.repeat(64), bytes: 1024, fetchedAt: '2026-09-29T00:00:00Z' }],
  uploads: [{ slug: 'camera', file: 'manuals/camera-user-manual.pdf', kind: 'manual', title: '사용자 매뉴얼' }]
};

test('mirrored PDF resolves to local view/download while retaining original URL', () => {
  assert.deepEqual(resolveDocumentAction({ url: source }, manifest), {
    kind: 'local', file: '../docs/camera-user-manual-aabbcc.pdf', sourceUrl: source
  });
});

test('document without a PDF copy retains manufacturer new-tab link', () => {
  assert.deepEqual(resolveDocumentAction({ url: 'https://example.com/help' }, manifest), {
    kind: 'external', url: 'https://example.com/help'
  });
  assert.equal(resolveDocumentAction({ status: 'MISSING' }, manifest), null);
});

test('user-uploaded PDFs become same-viewer documents for their exact slug', () => {
  assert.deepEqual(uploadedDocumentsFor('camera', manifest), [{
    title: '사용자 매뉴얼', label: '매뉴얼', status: 'FOUND',
    action: { kind: 'local', file: '../manuals/camera-user-manual.pdf', sourceUrl: '../manuals/camera-user-manual.pdf' }
  }]);
  assert.deepEqual(uploadedDocumentsFor('other', manifest), []);
  assert.equal(documentCardVisible([], uploadedDocumentsFor('camera', manifest)), true);
  assert.equal(documentCardVisible([], []), false);
});
