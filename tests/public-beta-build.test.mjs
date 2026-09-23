import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildStaticSite } from '../beta/build.mjs';

const exec = promisify(execFile);

test('creates a standalone five-field bundle from explicit local decisions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'av-beta-test-'));
  const catalogPath = join(root, 'source.json');
  const decisionsPath = join(root, 'decisions.json');
  const outDir = join(root, 'outputs', 'site');
  await mkdir(join(root, 'outputs'));
  await exec('git', ['init', '-q', root]);
  await writeFile(join(root, '.gitignore'), '/outputs/\n');
  const catalog = { products: [{
    id: 'X1', brand: 'Example Video', product: 'Model X1', categories: ['영상'], item_type: 'PRODUCT',
    identity_status: 'SOURCE_LIST', aliases: ['secret alias'], notes: 'secret note',
    source_records: [{ record_id: 'private-row', sheet: 'sheet', row: 7 }],
    official_sources: [{ url: 'https://example.com/model-x1', verification: '열람 본문에 모델명 확인 / 제품 페이지 / 2026-09-23', document_type: 'PRODUCT_PAGE' }]
  }] };
  const bytes = JSON.stringify(catalog);
  await writeFile(catalogPath, bytes);
  await writeFile(decisionsPath, JSON.stringify({
    source_sha256: createHash('sha256').update(bytes).digest('hex'),
    approved: [{ id: 'X1', urls: ['https://example.com/model-x1'], official_hosts: ['example.com'] }]
  }));
  const result = await buildStaticSite({ catalogPath, decisionsPath, outDir });
  assert.equal(result.equipment, 1);
  const publicData = JSON.parse(await readFile(join(outDir, 'catalog.json'), 'utf8'));
  assert.deepEqual(Object.keys(publicData[0]), ['brand', 'product', 'categories', 'kind', 'official_links']);
  assert.doesNotMatch(JSON.stringify(publicData), /secret|private-row|source_records/);
  for (const file of ['index.html', 'styles.css', 'app.js']) assert.ok((await readFile(join(outDir, file))).length);
  await assert.rejects(buildStaticSite({ catalogPath, decisionsPath, outDir: join(root, 'unsafe') }));
  await assert.rejects(buildStaticSite({ catalogPath, decisionsPath, outDir: join(root, 'beta', 'outputs', 'site') }));
  const originalAsset = await readFile(join(outDir, 'app.js'));
  await assert.rejects(buildStaticSite({ catalogPath, decisionsPath, outDir }));
  assert.deepEqual(await readFile(join(outDir, 'app.js')), originalAsset);
});
