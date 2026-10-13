import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW13010Product, withoutW13010Uploads, w13010Fixture } from './w13010-yamaha-history.mjs';

const root = new URL('../beta/site/', import.meta.url);
const product = slug => JSON.parse(readFileSync(new URL(`detail/data/${slug}.json`, root), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => sha(JSON.stringify(value ?? null));

test('DM3 and DM7 retain every marker fact while moving only the approved sides', () => {
  for (const slug of ['dm3', 'dm7']) {
    const current = product(slug);
    const prior = w13010Fixture[slug].prior.portMap;
    assert.ok(prepareEnhancements(current).portMap, `${slug}: map visible`);
    assert.deepEqual(current.portMap.items.map(({ n, label, desc }) => ({ n, label, desc })),
      prior.items.map(({ n, label, desc }) => ({ n, label, desc })), slug);
    assert.equal(current.portMap.measuredImage.file, prior.measuredImage.file, slug);
    const restored = beforeW13010Product(current, slug);
    assert.deepEqual(restored.portMap, prior, slug);
    assert.equal(digest(Object.fromEntries(Object.entries(current).filter(([field]) => !Object.hasOwn(w13010Fixture[slug].prior, field)))),
      w13010Fixture[slug].protectedSha256, `${slug}: protected fields`);
    const invalid = structuredClone(current);
    invalid.portMap.items[0].label += ' altered';
    assert.throws(() => beforeW13010Product(invalid, slug), /unexpected W-010 portMap change/, slug);
    invalid.portMap = current.portMap;
    invalid.io = [];
    assert.deepEqual(beforeW13010Product(invalid, slug).io, [], `${slug}: unrelated regression remains visible`);
  }
});

test('DM3 distinguishes Dante-capable DM3 from DM3 Standard using separate documents', () => {
  const dm3 = product('dm3');
  assert.deepEqual(dm3.keyFacts, [
    { label: '믹스버스', value: '6', unit: '' },
    { label: '샘플링 주파수 · 신호 지연', value: '96 / 48 kHz · 1.3 ms 미만', unit: '' },
    { label: 'PC/Mac 레코딩·플레이백', value: '18 트랙', unit: '' },
    { label: 'Dante 지원 차이', value: 'DM3 지원 · DM3 Standard(DM3S) 미지원', unit: '' },
  ]);
  assert.deepEqual(prepareEnhancements(dm3).keyFacts, dm3.keyFacts);
  assert.equal(dm3.documents.find(row => row.type === 'Specification').url,
    'https://kr.yamaha.com/ko/business/audio/products/mixers/dm3/specs.html');
  assert.deepEqual(dm3.sources.filter(row => ['U1', 'U2'].includes(row.code)).map(row => row.code), ['U1', 'U2']);
  assert.equal(beforeW13010Product(dm3, 'dm3').keyFacts, undefined);
});

test('the two model-specific data sheets keep their supplied bytes and remain unlocked', () => {
  const sheets = [
    ['yamaha-dm3-data-sheet-en.pdf', '6211e77d6f83636136fa58e8b66120a79ec7229fc398b4cdbf3b17046c02010e'],
    ['yamaha-dm3-standard-data-sheet-en.pdf', '37362d8704ec8c12f05ce2fc003bb3625fe2ef5e02c3d6ccadde330e8b221f59'],
  ];
  const manifest = JSON.parse(readFileSync(new URL('docs/manifest.json', root), 'utf8'));
  assert.equal(manifest.uploads.filter(row => row.locked === true).length, 12);
  assert.equal(manifest.uploads.length - withoutW13010Uploads(manifest.uploads).length, 2);
  for (const [name, expected] of sheets) {
    const bytes = readFileSync(new URL(`manuals/${name}`, root));
    assert.equal(sha(bytes), expected, name);
    const upload = manifest.uploads.find(row => row.file === `manuals/${name}`);
    assert.equal(upload.slug, 'dm3');
    assert.notEqual(upload.locked, true);
  }
});
