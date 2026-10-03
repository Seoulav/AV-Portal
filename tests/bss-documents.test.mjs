import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {beforeCrownW03013,crownW03013Slug} from './crown-w03013-history.mjs';
import {readFileSync,readdirSync} from 'node:fs';
import {uploadedDocumentsFor} from '../beta/site/detail/pdf-documents.mjs';

const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const bytes=path=>readFileSync(new URL(path,root));
const sha=value=>createHash('sha256').update(value).digest('hex');
const evidence=read('Work/기록/W-20261003-011-evidence.json');
const manifest=read('beta/site/docs/manifest.json');
const slugs=Object.keys(evidence.products);
const product=slug=>read(`beta/site/detail/data/${slug}.json`);
const changed=['blu-100','blu-101','blu-160','blu-dan','ec-4bv'];

test('six model-gated supplied PDFs serve only five BSS products without replacing existing mirrors',()=>{
  assert.equal(sha(JSON.stringify(manifest.mirrors)),evidence.manifest.mirrorsSha256);
  assert.equal(sha(JSON.stringify(manifest.uploads.slice(0,evidence.manifest.uploadCount))),evidence.manifest.uploadsSha256);
  const added=manifest.uploads.slice(evidence.manifest.uploadCount);
  assert.equal(added.length,6);
  assert.deepEqual(added.map(({slug,file,kind,title})=>({slug,file,kind,title})),
    evidence.inventory.documents.map(({slug,file,kind,title})=>({slug,file,kind,title})));
  assert.equal(new Set(added.map(item=>item.file)).size,6);
  for(const doc of evidence.inventory.documents){
    assert.match(doc.file,/^manuals\/[a-z0-9-]+\.pdf$/);
    const file=bytes(`beta/site/${doc.file}`);
    assert.equal(file.length,doc.bytes,doc.file);
    assert.equal(sha(file),doc.sha256,doc.file);
    const source=product(doc.slug).sources.find(item=>item.scope?.includes(doc.file));
    assert.ok(source,`${doc.slug}: missing document source ${doc.file}`);
    assert.equal(source.name,doc.title);
    assert.ok(source.scope.includes(doc.sha256),`${doc.slug}: missing SHA provenance`);
    assert.ok(source.scope.includes(doc.language==='ko'?'국문':'영문'),`${doc.slug}: language mismatch`);
  }
  for(const slug of changed) assert.ok(uploadedDocumentsFor(slug,manifest).length>0,slug);
});

test('BLU-50v2 and three card models receive no unverified document',()=>{
  for(const slug of ['blu-50v2','blu-aec-in','blucard-in','blucard-out']){
    assert.equal(uploadedDocumentsFor(slug,manifest).length,0,slug);
  }
  assert.equal(evidence.inventory.bl50.version2Matches,0);
  assert.deepEqual(evidence.inventory.bl50.blankPages,[2,19]);
});

test('BSS specification conditions fall to 60 without losing card-configuration facts',()=>{
  const conditions=slugs.reduce((total,slug)=>total+product(slug).specifications.filter(row=>row.condition).length,0);
  assert.equal(conditions,60);
  const blu160=product('blu-160');
  const weight=blu160.specifications.find(row=>row.name==='무게');
  assert.equal(weight.value,'4.1');
  assert.equal(weight.unit,'kg');
  assert.ok(!weight.condition);
  assert.match(blu160.sources.find(source=>source.code==='D').scope,/estimated/);
  for(const text of ['Analog Input Card 4장 장착 시','Analog Output Card 4장 장착 시',
    'Digital Input Card 4장 장착 시','Digital Output Card 4장 장착 시',
    'AEC Input Card 4장 장착 시','Telephone Hybrid Card 장착 시'])
    assert.ok(blu160.specifications.some(row=>row.condition?.includes(text)),text);
  for(const slug of ['blu-aec-in','blucard-in','blucard-out'])
    assert.ok(product(slug).specifications.some(row=>row.condition==='카드 1장 기준'),slug);
});

test('only documented BSS condition moves and BLU-160 weight normalization change existing specifications',()=>{
  for(const slug of slugs){
    const current=product(slug),prior=evidence.products[slug];
    const expected=structuredClone(prior.beforeSpecifications);
    const spec=name=>{
      const found=expected.find(row=>row.name===name);
      assert.ok(found,`${slug}: ${name}`);
      return found;
    };
    if(['blu-100','blu-101','blu-160'].includes(slug)){
      delete spec('외형 치수(H x W x D)').condition; // 1U is already in the chassis value.
      delete spec('제어 입출력').condition; // GPIO is already in the unchanged I/O row.
    }
    if(['blu-100','blu-101'].includes(slug)){
      spec('RS-232').value='지원 (로직 프로세싱용)';
      delete spec('RS-232').condition;
    }
    if(slug==='blu-160'){
      spec('무게').value='4.1';
      spec('무게').unit='kg';
      delete spec('무게').condition;
    }
    assert.deepEqual(current.specifications,expected,slug);
    const previousSources=structuredClone(prior.beforeSources);
    if(slug==='blu-160')previousSources.find(source=>source.code==='D').scope+=' · 무게 4.1 kg은 원문 estimated(추정치) 표기';
    assert.deepEqual(current.sources.slice(0,previousSources.length),previousSources,`${slug}: prior sources`);
  }
});

test('BSS I/O, BLU-50v2 map, key facts, mirrors, and every non-BSS JSON remain unchanged',()=>{
  for(const slug of slugs){
    const current=product(slug),before=evidence.products[slug];
    const {specifications,sources,...core}=current;
    assert.equal(sha(JSON.stringify(core)),before.coreSha256,`${slug}: protected fields`);
    assert.equal(sha(JSON.stringify(current.io)),before.ioSha256,`${slug}: I/O`);
    assert.equal(sha(JSON.stringify(current.portMap??null)),before.portMapSha256,`${slug}: portMap`);
    assert.equal(current.keyFacts?.length??0,0,`${slug}: deferred keyFacts`);
    if(!changed.includes(slug)){
      assert.equal(sha(JSON.stringify(specifications)),before.specificationsSha256,`${slug}: specs unchanged`);
      assert.equal(sha(JSON.stringify(sources)),before.sourcesSha256,`${slug}: sources unchanged`);
      assert.equal(sha(bytes(`beta/site/detail/data/${slug}.json`).toString('utf8').replace(/\r\n/g,'\n')),before.fileSha256,`${slug}: full JSON bytes`);
    }else{
      assert.equal(specifications.length,before.beforeSpecifications.length,`${slug}: spec row count`);
      assert.equal(sources.length,before.beforeSources.length+evidence.inventory.documents.filter(doc=>doc.slug===slug).length,`${slug}: sources`);
    }
  }
  const names=readdirSync(new URL('beta/site/detail/data/',root)).filter(name=>name.endsWith('.json')&&!slugs.includes(name.slice(0,-5))).sort();
  const digest=sha(names.map(name=>{
    const slug=name.slice(0,-5),raw=bytes(`beta/site/detail/data/${name}`).toString('utf8').replace(/\r\n/g,'\n');
    return `${name}\0${crownW03013Slug(slug)?JSON.stringify(beforeCrownW03013(JSON.parse(raw),slug),null,2)+'\n':raw}`;
  }).join(''));
  assert.equal(digest,evidence.otherDetailJsonSha256,'non-BSS product JSON changed');
});
