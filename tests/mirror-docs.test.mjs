import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectCandidates, mirrorCandidate } from '../beta/mirror-docs.mjs';

const candidate = { url: 'https://example.com/manual.pdf', slug: 'camera-a', type: 'User Manual' };
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
const fetchPdf = async () => new Response(pdf, { status: 200, headers: { 'content-type': 'application/pdf' } });

test('deduplicates eligible document URLs across products', () => {
  const rows = [
    { slug: 'camera-a', documents: [{ ...candidate, status: 'FOUND' }, { url: 'https://example.com/web', status: 'MISSING' }] },
    { slug: 'camera-b', documents: [{ ...candidate, status: 'READY' }] }
  ];
  assert.deepEqual(collectCandidates(rows), [candidate]);
});

test('mirrors only PDF bytes and keeps identical bytes without rewriting', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'av-pdf-test-'));
  try {
    const first = await mirrorCandidate(candidate, { dir, fetcher: fetchPdf, now: () => '2026-09-29T01:00:00.000Z' });
    assert.equal(first.reason, null);
    assert.equal((await readFile(join(dir, first.entry.file))).subarray(0, 5).toString(), '%PDF-');
    const before = await stat(join(dir, first.entry.file));
    const second = await mirrorCandidate(candidate, { dir, fetcher: fetchPdf, existing: first.entry, now: () => '2026-09-30T01:00:00.000Z' });
    const after = await stat(join(dir, first.entry.file));
    assert.deepEqual(second.entry, first.entry);
    assert.equal(after.mtimeMs, before.mtimeMs);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('rejects webpage and oversized response, retaining prior copy after failure', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'av-pdf-test-'));
  try {
    const first = await mirrorCandidate(candidate, { dir, fetcher: fetchPdf, now: () => '2026-09-29T01:00:00.000Z' });
    const webpage = await mirrorCandidate(candidate, { dir, existing: first.entry, fetcher: async () => new Response('<html>hello</html>', { headers: { 'content-type': 'text/html' } }) });
    assert.equal(webpage.reason, 'webpage');
    assert.deepEqual(webpage.entry, first.entry);
    const oversized = await mirrorCandidate(candidate, { dir, existing: first.entry, fetcher: async () => new Response('x', { headers: { 'content-length': '52428801', 'content-type': 'application/pdf' } }) });
    assert.equal(oversized.reason, 'oversize');
    assert.deepEqual(oversized.entry, first.entry);
    const failed = await mirrorCandidate(candidate, { dir, existing: first.entry, fetcher: async () => { throw new Error('timeout'); } });
    assert.equal(failed.reason, 'error');
    assert.deepEqual(failed.entry, first.entry);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
