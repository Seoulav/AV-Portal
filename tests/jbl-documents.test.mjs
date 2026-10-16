// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import {beforeW16015Group5Raw, beforeW16015Group5Product} from './w16015-group5-history.mjs';
import { beforeW008Catalog, beforeW008Manifest, isW008DetailFile } from './w20261016-008-history.mjs';
import {beforeJblW15010Raw,beforeJblW15010Product} from './jbl-w15010-history.mjs';
import { isW20261014_005DetailFile, beforeW20261014_005Uploads } from './w20261014-005-history.mjs';
import { beforeW20261016_003Uploads } from './w20261016-003-history.mjs';
import { beforeW009Uploads, isW009DetailFile } from './w009-history.mjs';
import { isW004Name } from './w004-history.mjs';
import { beforeW013Product, beforeW013Raw } from './w013-history.mjs';
import { beforeW12005Product, beforeW12005Raw } from './w12005-history.mjs';
import { isW06002Name } from './w06002-history.mjs';
import { isW1010Name } from './w1010-history.mjs';
import { isW1012Name } from './w1012-history.mjs';
import { isW007Name } from './w007-history.mjs';
import { isW006Name } from './w006-history.mjs';
import {beforeW026Raw as priorbeforeW026Raw, beforeW026Product as priorbeforeW026Product} from './w026-history.mjs';
import { beforeW12001Raw, beforeW12001Product } from './w12001-history.mjs';
import { beforeW12001IdentityRaw, beforeW12001IdentityProduct } from './w12001-identity-history.mjs';
const beforeW026RawWithoutGroup5 = (value, slug) => priorbeforeW026Raw(beforeW12001Raw(beforeW12001IdentityRaw(beforeW12005Raw(beforeW013Raw(beforeJblW15010Raw(value, slug), slug), slug), slug), slug), slug);
const beforeW026Raw = (value, slug) => beforeW026RawWithoutGroup5(beforeW16015Group5Raw(value, slug), slug);
const beforeW026ProductWithoutGroup5 = (value, slug) => priorbeforeW026Product(beforeW12001Product(beforeW12001IdentityProduct(beforeW12005Product(beforeW013Product(beforeJblW15010Product(value, slug), slug), slug), slug), slug), slug);
const beforeW026Product = (value, slug) => beforeW026ProductWithoutGroup5(beforeW16015Group5Product(value, slug), slug);

import { beforeW032Raw } from './w032-history.mjs';
import { beforeW032Mirrors } from './w032-history.mjs';
import { isW029Name } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import {readdirSync} from 'node:fs';
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
const manifest = beforeW008Manifest(read('beta/site/docs/manifest.json'));
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
  assert.equal(hash(JSON.stringify(beforeW032Mirrors(manifest.mirrors))),evidence.manifest.mirrorsSha256);
  const historicalUploads=beforeW20261014_005Uploads(beforeW04021Uploads(beforeWinstarW04016Uploads(beforeW009Uploads(beforeW20261016_003Uploads(manifest.uploads)))));
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
    const p=beforeHarmanW03014(beforeJblW15010Product(product(slug),slug),slug),before=evidence.products[slug];
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
      assert.equal(hash(Buffer.from(beforeHarmanW03014Raw(beforeJblW15010Raw(readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root),'utf8').replace(/\r\n/g,'\n'),slug),slug))),before.fileSha256,`${slug}: entire JSON bytes must remain unchanged`);
    }
  }
  const names=readdirSync(new URL('beta/site/detail/data/',root)).filter(x=>x.endsWith('.json') && !isW008DetailFile(x) && !isW20261014_005DetailFile(x) && !isW004Name(x) && x !== 'lh43behhlbfxkr.json'&&!isW029Name(x) && !isW030Name(x) && !isW006Name(x) && !isW007Name(x) && !isW06002Name(x) && !isW1010Name(x) && !isW1012Name(x)&&!isW009DetailFile(x)&&!slugs.includes(x.slice(0,-5))).sort();
  const digest=hash(names.map(name=>{
    const slug=name.slice(0,-5);
    const raw=beforeHarmanW03014Raw(beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(beforeW032Raw(beforeW026Raw(readFileSync(new URL(`beta/site/detail/data/${name}`,root),'utf8').replace(/\r\n/g,'\n'), slug), slug),slug),slug),slug),slug);
    return `${name}\0${bssW03011Slug(slug)||crownW03013Slug(slug)?JSON.stringify(beforeCrownW03013(beforeBssW03011(JSON.parse(raw),slug),slug),null,2)+'\n':raw}`;
  }).join(''));
  assert.equal(digest,evidence.otherDetailJsonSha256,'JBL之外 JSON changed');
});
