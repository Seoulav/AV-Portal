import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const proof=read('Work/기록/W-20261001-001-crown-port-map-evidence.json');
const later=read('Work/기록/W-20261003-009-evidence.json');
test('22 approved Crown models have evidence-tied maps without modifying technical data',()=>{
 assert.equal(Object.keys(proof.products).length,22);
 for(const [slug,e] of Object.entries(proof.products)){
  const p=read(`beta/site/detail/data/${slug}.json`),map=prepareEnhancements(p).portMap;
  assert.ok(map,slug);assert.equal(createHash('sha256').update(readFileSync(new URL('../beta/site/'+e.pdf,import.meta.url))).digest('hex'),e.pdfSha256);assert.deepEqual(map.items,e.markers.map(({pages,...m})=>m));
  assert.deepEqual(map.items.map(x=>x.n),map.items.map((_,i)=>i+1));
  const image=p.images.find(i=>i.role==='Rear');assert.equal(image.file,e.image.file);
  assert.equal(createHash('sha256').update(readFileSync(new URL('../beta/site/detail/images/'+image.file,import.meta.url))).digest('hex'),e.image.sha256);
  assert.deepEqual(map.measuredImage,{file:image.file,width:e.image.width,height:e.image.height});
  for(const m of e.markers)assert.ok(m.pages.length && m.pages.every(n=>Number.isInteger(n)&&n>0&&n<=e.pageCount));
  // W-20261003-009 only moved condition/source notes; reconstruct the approved
  // W-20261001-001 row snapshot before checking this historical core hash.
  p.specifications=later.products[slug].beforeSpecifications;
  p.io=later.products[slug].beforeIo;
  p.issues=later.products[slug].beforeIssues;
  if(slug!=='dci-4-600da') { delete p.lead;delete p.subtitle;delete p.keyFacts; } // Approved pilot predates W-013.
  delete p.portMap;assert.equal(createHash('sha256').update(JSON.stringify(p)).digest('hex'),e.coreSha256,slug+' original values');
  if(slug.startsWith('cdi-')){assert.equal(map.items.filter(x=>x.label.startsWith('BLU link')).length,slug.endsWith('bl')?2:0);assert.ok(!JSON.stringify(map).includes('Dante'));}
 }
 // The four previously excluded DCi N models received maps in W-20261003-009.
});
