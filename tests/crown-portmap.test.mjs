import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeBssW04004Raw } from './bss-w04004-history.mjs';
import { beforeBssAlignmentRaw } from './bss-alignment-history.mjs';
import { prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeWinstarW04016Uploads } from './winstar-w04016-history.mjs';
import { beforeJblW03010, jblW03010Slug } from './jbl-w03010-history.mjs';
import { beforeBssW03011, bssW03011Slug } from './bss-w03011-history.mjs';
import { beforeCrownW03013, crownW03013Slug } from './crown-w03013-history.mjs';
import { beforeSamsungW04010Raw } from './samsung-w04010-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const targets = ['dci-2-300n', 'dci-2-600n', 'dci-4-300n', 'dci-4-600n'];
const crown = readdirSync(new URL('beta/site/detail/data/', root)).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5)).filter(slug => read(`beta/site/detail/data/${slug}.json`).manufacturer === 'Crown');
const evidence = read('Work/기록/W-20261003-009-evidence.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('four DCi N products render concise rear maps with matching measured images', () => {
  for (const slug of targets) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    const map = prepareEnhancements(product).portMap;
    assert.ok(map, `${slug}: Port Map must render`);
    assert.ok(map.items.length > 0 && map.items.length <= 12, slug);
    assert.deepEqual(map.items.map(item => item.n), map.items.map((_, i) => i + 1), slug);
    const rear = product.images.find(image => image.role === 'Rear');
    const [width, height] = rear.resolution.split(/[x×]/).map(Number);
    assert.deepEqual(map.measuredImage, { file: rear.file, width, height }, slug);
  }
});

test('all Crown products have uploaded documents and retain measurement conditions', () => {
  const manifest = read('beta/site/docs/manifest.json');
  assert.equal(crown.length, 26);
  for (const slug of crown) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    assert.ok(product.documents?.some(doc => ['FOUND','VERIFIED'].includes(doc.status)) || uploadedDocumentsFor(slug, manifest).length > 0, `${slug}: document missing`);
  }
  const conditions = crown.flatMap(slug => read(`beta/site/detail/data/${slug}.json`).specifications.map(row => row.condition).filter(Boolean));
  assert.ok(conditions.length <= 150, `Crown conditions: ${conditions.length}`);
  assert.ok(conditions.includes('정격출력, 20Hz-20kHz'));
  assert.ok(conditions.includes('8Ω, 20Hz-20kHz'));
  assert.ok(conditions.includes('20Hz-100Hz'));
  assert.ok(!conditions.some(value => /공식 후면 사진 판독|\blbs?\b|\d"/.test(value)));
  // The baseline already has four approved facts on dci-4-600da; all presentation
  // fields are locked against the pre-task evidence in the next test.
});

test('five distinct PDFs serve exact models in eleven new upload links', () => {
  const manifest = read('beta/site/docs/manifest.json');
  const historicalUploads = beforeWinstarW04016Uploads(manifest.uploads);
  // This audit locks the W-009 upload segment; later JBL uploads are checked separately.
  assert.ok(historicalUploads.length >= evidence.manifest.uploadCount + 11);
  assert.equal(sha(JSON.stringify(historicalUploads.slice(0,evidence.manifest.uploadCount))), evidence.manifest.uploadsSha256);
  assert.equal(sha(JSON.stringify(manifest.mirrors)), evidence.manifest.mirrorsSha256);
  for (const doc of evidence.documents) {
    assert.deepEqual(manifest.uploads.filter(item => item.file === doc.file).map(item => item.slug), doc.slugs);
    assert.match(doc.file, /^manuals\/[a-z0-9-]+\.pdf$/);
    const bytes = readFileSync(new URL(`beta/site/${doc.file}`,root));
    assert.equal(bytes.length, doc.bytes);
    assert.equal(sha(bytes), doc.sha256);
  }
  assert.equal(new Set(evidence.documents.map(doc => doc.sha256)).size, 5);
});

test('approved Crown maps, non-Crown JSON, and prior values are retained', () => {
  for (const slug of crown) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    const prior = evidence.products[slug];
    assert.deepEqual(product.specifications.map(row => [row.name,row.group,row.source,row.verification]),prior.beforeSpecifications.map(row => [row.name,row.group,row.source,row.verification]),slug);
    for (const [index, original] of prior.beforeSpecifications.entries()) {
      const actual = product.specifications[index];
      assert.equal(actual.name, original.name, slug);
      if (actual.value !== original.value) {
        assert.equal(actual.condition, '', `${slug}: condition moved`);
        assert.equal(actual.unit, '', `${slug}: unit moved with value`);
        assert.ok(actual.value.includes(`${original.value}${original.unit ? ` ${original.unit}` : ''}`), `${slug}: original value retained`);
        assert.ok(actual.value.includes(original.condition.replace(/^공식 후면 사진 판독, 후면 표기 /,'')), `${slug}: former condition retained`);
      } else {
        assert.equal(actual.unit, original.unit, `${slug}: unit`);
        if (actual.condition !== original.condition) assert.match(original.condition, /공식 후면 사진 판독|이슈 참고/, `${slug}: only provenance note removed`);
      }
    }
    if (targets.includes(slug)) {
      assert.equal(product.io.length,7,`${slug}: distinct physical connectors`);
      assert.deepEqual(product.io.map(row=>row.signal),[
        'Analog audio input','Speaker output','HARMAN BLU link digital audio bus',
        'HiQnet 제어/모니터링 네트워크','GPIO 제어 입출력',
        'AUX 원격 Sleep·상태 감시','Mains power'
      ]);
      assert.deepEqual(product.io.map(row=>row.connector),[
        '6핀 터미널 블록',prior.beforeIo[0].connector,'RJ45 (IN·OUT)','RJ45',
        'RJ-11(6포지션)','3핀 터미널 블록','15A IEC'
      ]);
      assert.equal(product.io[0].quantity,`${slug.split('-')[1]}채널`);
      assert.equal(product.io[2].quantity,'2');
      assert.deepEqual(product.io[1],prior.beforeIo[0]);
      assert.deepEqual(product.io[6],prior.beforeIo.at(-1));
      assert.ok(product.io.slice(2,6).every(row=>row.source.includes('M1')));
      assert.deepEqual(product.sources.slice(0,-1),prior.beforeSources);
      assert.equal(product.sources.at(-1).code,'M1');
      assert.match(product.issues[0].detail,/Dante/);
    } else assert.deepEqual(product.io,prior.beforeIo,`${slug}: I/O unchanged`);
    assert.deepEqual(product.issues,prior.beforeIssues,`${slug}: issues retained`);
    const core = beforeCrownW03013(structuredClone(product),slug);
    delete core.specifications;delete core.io;delete core.issues;delete core.portMap;
    if (prior.beforeSources) core.sources = prior.beforeSources;
    assert.equal(sha(JSON.stringify(core)),prior.nonSpecificationsSha256,slug);
  }
  const dir = new URL('beta/site/detail/data/',root);
  const hash = createHash('sha256');
  for (const name of readdirSync(dir).filter(name=>name.endsWith('.json')&&!crown.includes(name.slice(0,-5))).sort()) {
    const slug=name.slice(0,-5);
    const raw=beforeHarmanW03014Raw(beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(readFileSync(new URL(name,dir),'utf8').replace(/\r\n/g,'\n'),slug),slug),slug),slug);
    const historical=jblW03010Slug(slug)?beforeJblW03010(JSON.parse(raw),slug)
      : bssW03011Slug(slug)?beforeBssW03011(JSON.parse(raw),slug):null;
    hash.update(name).update('\0').update(historical?JSON.stringify(historical,null,2)+'\n':raw);
  }
  assert.equal(hash.digest('hex'),evidence.otherDetailJsonSha256);
});
