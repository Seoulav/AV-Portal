import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';
import { enhancementErrors } from '../prototype/brc-am7/detail-enhancements.mjs';
import { resolveDocumentAction } from '../beta/site/detail/pdf-documents.mjs';
import { resolveDocumentAction as resolvePrototypeDocumentAction } from '../prototype/brc-am7/pdf-documents.mjs';

const root = new URL('../beta/site/', import.meta.url);
const product = slug => JSON.parse(readFileSync(new URL(`detail/data/${slug}.json`, root), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('docs/manifest.json', root), 'utf8'));
const cameras = ['brc-am7','srg-a40','srg-x40uh','rm-ip10','rm-ip500','cl01','tr315','tr335'];

test('camera flows use verified I/O without invented Genlock or output grades', () => {
  const brc=product('brc-am7'), srg=product('srg-a40');
  assert.ok(prepareEnhancements(brc).signalFlow);
  assert.ok(prepareEnhancements(srg).signalFlow);
  for(const slug of cameras.slice(2)) assert.equal(product(slug).signalFlow,undefined);
  const a=JSON.stringify(brc.signalFlow), b=JSON.stringify(srg.signalFlow);
  assert.match(a,/SDI OUT1.*12G|12G.*SDI OUT1/);
  assert.match(a,/SDI OUT2.*3G|3G.*SDI OUT2/);
  assert.match(a,/GENLOCK IN/); assert.match(a,/TC IN/);
  assert.doesNotMatch(a,/무조건 동시 출력 가능|무조건 동시 출력 지원/);
  assert.doesNotMatch(b,/GENLOCK|젠록|TC IN/);
  assert.match(b,/4K 출력 미지원/);
  assert.match(b,/SDI와 동시 출력/);
});

test('all eight cameras have locally viewable and downloadable official manual PDFs', () => {
  for(const slug of cameras) {
    const docs=product(slug).documents;
    const local=docs.filter(d=>/Manual|설명|PDF/i.test(d.title||'')).map(d=>({d,a:resolveDocumentAction(d,manifest)})).filter(x=>x.a?.kind==='local');
    assert.ok(local.length>=1,slug);
    for(const {a} of local) assert.ok(existsSync(new URL(a.file.replace(/^\.\.\//,''),root)),`${slug}: ${a.file}`);
  }
  const tr315=product('tr315').documents.find(d=>d.type==='User Manual');
  const tr335=product('tr335').documents.find(d=>d.type==='User Manual');
  assert.equal(tr315.url,tr335.url);
  for(const slug of ['srg-a40','srg-x40uh','rm-ip500']) {
    const docs=product(slug).documents;
    assert.ok(docs.some(d=>d.type==='User Manual'&&d.language==='ko'&&resolveDocumentAction(d,manifest)?.kind==='local'),slug);
    assert.ok(docs.some(d=>d.language==='en'),`${slug}: prior English reference retained`);
    assert.ok(!docs.some(d=>/한국어판.*확인되지 않음/.test(d.note||'')),slug);
  }
});

test('new official PDF mirrors match file bytes and SHA-256', () => {
  const names=['sony-brc-am7-helpguide-ko.pdf','sony-srg-a40-a12-manual-ko.pdf','sony-srg-x40uh-h40uh-manual-ko.pdf','sony-rm-ip500-manual-ko.pdf'];
  const entries=manifest.mirrors.filter(m=>names.includes(m.file));
  assert.equal(entries.length,4);
  for(const m of entries) {
    const bytes=readFileSync(new URL(`docs/${m.file}`,root));
    assert.equal(bytes.length,m.bytes,m.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256,m.file);
    assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  }
});

test('BRC prototype shares the approved flow and resolves its PDF to the posted site file', () => {
  const prototype = JSON.parse(readFileSync(new URL('../prototype/brc-am7/content.json', import.meta.url), 'utf8'));
  const publicProduct = product('brc-am7');
  assert.deepEqual(prototype.signalFlow, publicProduct.signalFlow);
  assert.deepEqual(enhancementErrors(prototype), []);
  const print = prototype.documents.find(row => row.url === 'https://helpguide.sony.net/rc/brc-am7/v1/ko/print.pdf');
  assert.equal(print.status, 'FOUND');
  const action = resolvePrototypeDocumentAction(print, manifest);
  assert.equal(action.kind, 'local');
  assert.ok(existsSync(new URL(`../prototype/brc-am7/${action.file}`, import.meta.url)));
});
