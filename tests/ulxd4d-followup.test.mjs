import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wrapFlowText} from '../prototype/brc-am7/detail-enhancement-view.mjs';
import {enhancementErrors} from '../prototype/brc-am7/detail-enhancements.mjs';
const p=JSON.parse(readFileSync(new URL('../beta/site/detail/data/ulxd4d.json',import.meta.url)));
test('flow wrapping keeps Korean words and protocol names together',()=>{
 assert.deepEqual(wrapFlowText('Dante 전송',63),['Dante','전송']);
 assert.deepEqual(wrapFlowText('채널별 오디오 전송',91),['채널별 오디오','전송']);
 assert.ok(wrapFlowText('averylongunbrokentoken',35).every(x=>x.length<=5));
});
test('ULXD4D independently routes both diversity antennas and two audio channels',()=>{
 assert.deepEqual(enhancementErrors(p),[]);
 assert.equal(p.io[1].quantity,'2');
 assert.equal(p.documents[0].title,'Shure ULX-D Digital Wireless User Guide');
 const f=p.signalFlow;
 for(const ch of ['ch1','ch2']){
  for(const antenna of ['ant-a','ant-b'])assert.ok(f.connections.some(e=>e.from===antenna&&e.to===ch));
  for(const to of ['xlr-'+ch,'dante-'+ch])assert.ok(f.connections.some(e=>e.from===ch&&e.to===to));
 }
 assert.ok(!f.connections.some(e=>e.from==='ch1'&&e.to==='ch2'));
 for(const suffix of ['a','b'])assert.ok(f.auxiliary.some(e=>e.from==='ant-'+suffix&&e.to==='cascade-'+suffix&&e.signal==='rf'));
 for(const row of [...f.inputs,...f.outputs,...f.processes,...f.connections,...f.auxiliary,...f.groups])assert.ok(row.evidence.every(e=>e.kind==='pdf'&&e.source==='M'));
 assert.match(f.notes.join(' '),/Audio Summing/);
});
