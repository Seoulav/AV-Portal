import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {beforeW20261016_003Product,beforeW20261016_003Uploads,w20261016_003Slugs,w20261016_003UploadFiles} from './w20261016-003-history.mjs';
import {uploadedDocumentsFor,documentActionLabels} from '../beta/site/detail/pdf-documents.mjs';
const site=new URL('../beta/site/',import.meta.url);
const readJson=async rel=>JSON.parse(await readFile(new URL(rel,site),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const expected={
 'insta360-connect':['insta360-connect-brochure-20261016.pdf','95536f0ea8a290d312e654690b01f9b2bce4360210e23b0774739a436068acb0',8],
 'insta360-link-2':['insta360-link-2-brochure-20261016.pdf','b05b78559ae5bd9e36c292441577bdd33b8fa0894279ec1a1c32bbf7936549c4',8],
 'insta360-wave':['insta360-wave-brochure-20261016.pdf','cf1364499c9168e678f41b2a1c8bbda148c820119001edab8313fadaaf03d65f',10],
 'insta360-wave-business':['insta360-wave-for-business-brochure-20261016.pdf','7c50e65e1b8432b222c8d6bf992a51c429ddbb48c24c0039d39d61ffbedade7f',19],
};
const oldHashes={'insta360-connect':'48c17357bf608febdc0a8e36ef8e68ae21b54cafb0c10d5bf27c740732f6f0c5','insta360-link-2':'82670356755af2984eaeb6e5d88acb589506fbbd332768a5d6e2beb24bf04282','insta360-wave':'3fa3cf8791c5cb51dbe96bf6b7f27c7017973400fb0abdfe7a7a54d1eef6c6a4','insta360-wave-business':'beb80501a7988caa413b78983750a7b09e102c6f415aafa6083486a2aabe91b1'};
test('W-003 posts product brochures before the existing collection with view and download actions',async()=>{
 const manifest=await readJson('docs/manifest.json');
 for(const slug of w20261016_003Slugs){const [file,expectedSha]=expected[slug];const docs=uploadedDocumentsFor(slug,manifest);assert.equal(docs.length,2,slug);assert.equal(docs[0].action.kind,'local');assert.equal(docs[0].action.file,'../manuals/'+file);assert.match(docs[0].title,/사용자 제공/);assert.equal(docs[1].action.file,'../manuals/insta360-conference-line-collection-20260729.pdf');assert.equal(documentActionLabels(docs[0],docs[0].action).primary,'보기');assert.equal(documentActionLabels(docs[0],docs[0].action).download,'↓ 내려받기');const bytes=await readFile(new URL('manuals/'+file,site));assert.equal(sha(bytes),expectedSha,slug+' SHA-256');assert.equal(bytes.subarray(0,5).toString('ascii'),'%PDF-');const row=manifest.uploads.find(x=>x.slug===slug&&x.file==='manuals/'+file);assert.ok(row);assert.match(row.title,/한국어/);assert.match(row.title,new RegExp(expected[slug][2]+'쪽'));}
});
test('W-003 preserves both Wave dimension and desktop OS values as conflicts',async()=>{
 const wave=await readJson('detail/data/insta360-wave.json');const dims=wave.specifications.filter(x=>x.name==='크기');assert.ok(dims.some(x=>x.value==='Ø64.3'&&x.source==='M'&&x.verification==='CONFLICTED'));assert.ok(dims.some(x=>x.value==='52.8'&&x.source==='B'&&x.verification==='CONFLICTED'&&x.condition.includes('10쪽')));const os=wave.specifications.filter(x=>x.name==='컴퓨터 OS');assert.ok(os.some(x=>x.value==='Windows 10 이상, macOS 12 이상'&&x.verification==='CONFLICTED'));assert.ok(os.some(x=>x.value==='Windows 7 이상, macOS 10 이상'&&x.source==='B'&&x.verification==='CONFLICTED'&&x.condition.includes('2025-10-13')));const mobile=wave.specifications.filter(x=>x.name==='스마트폰·태블릿 OS');assert.ok(mobile.some(x=>x.value==='Android 10 이상, iOS 12 이상, iPadOS 12 이상'&&x.source==='M'&&x.verification==='CONFLICTED'));assert.ok(mobile.some(x=>x.value==='Android 8.0 이상, iOS 9 이상, iPadOS 9 이상'&&x.source==='B'&&x.verification==='CONFLICTED'));assert.deepEqual(wave.issues.filter(x=>['C3','C4','C5'].includes(x.code)).map(x=>x.status),['CONFLICTED','CONFLICTED','CONFLICTED']);
 const business=await readJson('detail/data/insta360-wave-business.json');const bSource=business.sources.find(x=>x.name.includes('제품 브로슈어'));assert.match(bSource.scope,/2쪽/);assert.match(bSource.scope,/7쪽/);assert.match(bSource.scope,/10–19쪽/);const standard=wave.sources.find(x=>x.name.includes('제품 브로슈어'));assert.match(standard.scope,/Video Bar 비호환 여부는 명시하지 않음/);assert.ok(wave.sources.some(x=>x.code==='U'&&x.name.includes('2026-10-13')));
});
test('W-003 rewind removes only its new brochure facts and uploads',async()=>{
 const manifest=await readJson('docs/manifest.json');const uploads=beforeW20261016_003Uploads(manifest.uploads);for(const slug of w20261016_003Slugs){const product=await readJson('detail/data/'+slug+'.json');assert.equal(sha(JSON.stringify(beforeW20261016_003Product(product,slug))),oldHashes[slug],slug+' original object hash');assert.equal(uploads.filter(x=>x.slug===slug&&x.file.includes('insta360-conference-line-collection')).length,1,slug+' collection retained');}assert.equal((await readdir(new URL('manuals/',site))).filter(name=>Object.values(w20261016_003UploadFiles).some(file=>file.endsWith('/'+name))).length,4);
});
