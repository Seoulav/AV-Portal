// Rewind only the nine W-20261017-011 phase 2 maps before older hash checks.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/w20261017-011-stage2-prior-maps.json',import.meta.url),'utf8'));
const approved={
  'aquilon-rsalpha':'fd2bbcfb599bb95ae18628ffe0bdf8a90fe789df6bf3708602f27feab7d063b4',
  'aquilon-rs1':'2bb4ec4ff2b69347851f40820204d5f5345aeb5d1e756cbe03956d4596459aca',
  'aquilon-rs3':'cc88e07d9f90d992bbcd9340187f3cf239d037c9f78ac4fbfd793dad4347d340',
  'aquilon-rs4':'79bbd2f98a10fd2b6b10567098b094ca1bbc6d43d6b0b4c1c58919b8aa246bd5',
  'aquilon-rs5':'ae04fa83e59b8a4c4406c80dfc604c6a1d7104f544583cb7e2205d7e6dab56c6',
  'aquilon-rs6':'cd1d538e193fa157c3ead51e509b29f5d64ceacd362d824d5d01dad630708bcc',
  'aquilon-cmini':'e31288e2cdd11af71d44f40d58b97b42eb53983ffdbe830625e5adc732e08ccb',
  'aquilon-c':'7c3c346065e43942fbc24fb85b266ac78bd82f952c19e695846b333bd65b5262',
  'aquilon-cmax':'e1fc666a5fb1c1d6a0fd093f42c2d5b117c58effa2c81c2a3ae60d770c6224be'
};
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW20261017_011Stage2Product(product,slug){
  const record=fixture[slug];
  if(!record||!product.portMap)return product;
  const current=sha(product.portMap);
  if(current===record.portMapSha256)return product;
  // Earlier inverse helpers may pass in a pre-W-014 map in the same chain.
  if(!product.portMap.items?.[0]?.label?.startsWith('슬롯 1'))return product;
  if(current!==approved[slug])throw new Error(`${slug}: unexpected W-20261017-011 phase 2 map change`);
  return {...product,portMap:structuredClone(record.portMap)};
}

export function beforeW20261017_011Stage2Raw(raw,slug){
  const product=JSON.parse(raw.charCodeAt(0)===0xfeff?raw.slice(1):raw);
  const prior=beforeW20261017_011Stage2Product(product,slug);
  return prior===product?raw:JSON.stringify(prior,null,2)+'\n';
}
