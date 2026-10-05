import { isW029Name } from './w029-history.mjs';
import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import {readFileSync,readdirSync} from 'node:fs';
import {uploadedDocumentsFor} from '../beta/site/detail/pdf-documents.mjs';
import {beforeWinstarW04016Uploads} from './winstar-w04016-history.mjs';
import {beforeW04021Uploads} from './document-lock-history.mjs';
import {beforeBssW03011,bssW03011Slug} from './bss-w03011-history.mjs';
import {beforeCrownW03013,crownW03013Slug} from './crown-w03013-history.mjs';
import {beforeSamsungW04010Raw} from './samsung-w04010-history.mjs';

const root = new URL('../',import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path,root),'utf8'));
const bytes = path => readFileSync(new URL(path,root));
const hash = value => createHash('sha256').update(value).digest('hex');
const evidence = read('Work/기록/W-20261003-010-evidence.json');
const bssEvidence = read('Work/기록/W-20261003-011-evidence.json');
const manifest = read('beta/site/docs/manifest.json');
const slugs = Object.keys(evidence.products);
const product = slug => read(`beta/site/detail/data/${slug}.json`);

const specFacts = {
  'control-412ct':['85 Hz – 16 kHz','60 W'],
  'control-414ct':['83 Hz – 20 kHz','90 W'],
  'control-416ct':['84 Hz – 19 kHz','150 W'],
  'control-418ct':['74 Hz – 19 kHz','270 W'],
  'control-419cst':['55 Hz – 150 Hz','320 W'],
  'control-424ct':['88 Hz – 17 kHz','120 W'],
  'control-424lp':['88 Hz – 17 kHz','120 W'],
  'control-426lp':['150 Hz – 17 kHz','220 W'],
  'control-440cst':['42 Hz – 180 Hz','300 W'],
  'control-447ct':['74 Hz – 20 kHz','224 W'],
};

test('all 16 JBL products have correctly scoped documents and exactly 19 unique published PDFs',()=>{
  assert.equal(hash(JSON.stringify(manifest.mirrors)),evidence.manifest.mirrorsSha256);
  const historicalUploads=beforeW04021Uploads(beforeWinstarW04016Uploads(manifest.uploads));
  assert.equal(hash(JSON.stringify(historicalUploads.slice(0,evidence.manifest.uploadCount))),evidence.manifest.uploadsSha256);
  // Keep this audit on the W-010 segment; W-011 BSS uploads are checked separately.
  const added=historicalUploads.slice(evidence.manifest.uploadCount,bssEvidence.manifest.uploadCount);
  assert.equal(added.length,28);
  const files=[...new Set(added.map(item=>item.file))];
  assert.equal(files.length,19);
  for(const doc of evidence.inventory.documents){
    const links=added.filter(item=>item.file===doc.file);
    assert.deepEqual(links.map(item=>item.slug).sort(),[...doc.products].sort(),doc.file);
    for(const item of links){
      assert.equal(item.kind,doc.kind);
      assert.equal(item.title,doc.title);
      assert.match(item.file,/^manuals\/[a-z0-9-]+\.pdf$/);
    }
    const file=bytes(`beta/site/${doc.file}`);
    assert.equal(file.length,doc.bytes);
    assert.equal(hash(file),doc.sha256);
  }
  for(const slug of slugs) assert.ok(uploadedDocumentsFor(slug,manifest).length>0,`${slug}: missing document`);
});

test('Standard, Enhanced and Premium series manuals stay with their exact model families',()=>{
  const expected={
    'jbl-control-400-standard-manual.pdf':['control-412ct','control-414ct','control-418ct'],
    'jbl-control-400-enhanced-manual.pdf':['control-419cst','control-424ct','control-424lp','control-426ct','control-426lp'],
    'jbl-control-400-premium-manual.pdf':['control-440cst'],
  };
  for(const [name,models] of Object.entries(expected)) {
    assert.deepEqual(manifest.uploads.filter(item=>item.file===`manuals/${name}`).map(item=>item.slug).sort(),models);
  }
  const enhanced=evidence.inventory.documents.find(d=>d.file==='manuals/jbl-control-400-enhanced-manual.pdf');
  assert.equal(enhanced.sha256.slice(0,12),'427e76dad5f0');
});

test('only the drawing labeled AC18/95 and AC18/26 is attached; other cabinet drawings are absent',()=>{
  const drawing=manifest.uploads.filter(item=>item.file==='manuals/jbl-ac18-26-95-drawing.pdf');
  assert.deepEqual(drawing.map(item=>item.slug).sort(),['ac18-26','ac18-95']);
  assert.equal(evidence.inventory.ac18DrawingModelMark,'AC18/95, AC18/26');
  for(const model of evidence.inventory.excludedDrawings)
    assert.ok(!manifest.uploads.some(item=>new RegExp(`(?:^|[-/])${model}(?:[-.])`,'i').test(item.file)),`${model} drawing published`);
});

test('JBL I/O, presentation and all other products remain unchanged; only ten spec-sheet products gain source-backed facts',()=>{
  for(const slug of slugs){
    const p=beforeHarmanW03014(product(slug),slug),before=evidence.products[slug];
    const {specifications,sources,...core}=p;
    assert.equal(hash(JSON.stringify(core)),before.coreSha256,`${slug}: protected fields including I/O`);
    assert.equal(hash(JSON.stringify(p.io)),before.ioSha256,`${slug}: I/O changed`);
    assert.equal(p.keyFacts?.length??0,0,`${slug}: keyFacts deferred`);
    if(specFacts[slug]){
      assert.equal(specifications.length,before.specificationCount+2,slug);
      assert.equal(hash(JSON.stringify(specifications.slice(0,before.specificationCount))),before.specificationsSha256,`${slug}: previous specs changed`);
      assert.equal(hash(JSON.stringify(sources.slice(0,before.sourceCount))),before.sourcesSha256,`${slug}: previous sources changed`);
      assert.equal(sources.length,before.sourceCount+1,slug);
      assert.deepEqual(specifications.slice(-2).map(row=>[row.name,row.value,row.source,row.verification]),[
        ['주파수 응답(±3dB)',specFacts[slug][0],'D1','VERIFIED'],
        ['연속 프로그램 전력(2시간)',specFacts[slug][1],'D1','VERIFIED'],
      ],slug);
      assert.deepEqual(specifications.slice(-2).map(row=>row.group),['Acoustic','Power'],slug);
    }else{
      assert.equal(hash(JSON.stringify(specifications)),before.specificationsSha256,`${slug}: no model-specific spec sheet`);
      assert.equal(hash(JSON.stringify(sources)),before.sourcesSha256,`${slug}: source should stay unchanged`);
      assert.equal(hash(Buffer.from(beforeHarmanW03014Raw(readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root),'utf8').replace(/\r\n/g,'\n'),slug))),before.fileSha256,`${slug}: entire JSON bytes must remain unchanged`);
    }
  }
  const names=readdirSync(new URL('beta/site/detail/data/',root)).filter(x=>x.endsWith('.json') && x !== 'lh43behhlbfxkr.json'&&!isW029Name(x)&&!slugs.includes(x.slice(0,-5))).sort();
  const digest=hash(names.map(name=>{
    const slug=name.slice(0,-5);
    const raw=beforeHarmanW03014Raw(beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(readFileSync(new URL(`beta/site/detail/data/${name}`,root),'utf8').replace(/\r\n/g,'\n'),slug),slug),slug),slug);
    return `${name}\0${bssW03011Slug(slug)||crownW03013Slug(slug)?JSON.stringify(beforeCrownW03013(beforeBssW03011(JSON.parse(raw),slug),slug),null,2)+'\n':raw}`;
  }).join(''));
  assert.equal(digest,evidence.otherDetailJsonSha256,'JBL之外 JSON changed');
});
