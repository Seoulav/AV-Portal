// Earlier task tests reconstruct their own published baseline before W-20261004-013.
// The 131 removed rows are preserved verbatim in that task's evidence; live-data
// requirements and the exact approved deletion are checked in display-spec-order.test.mjs.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeSamsungW04011} from './samsung-w04011-history.mjs';

const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261004-013-evidence.json',import.meta.url),'utf8'));
const hash=raw=>createHash('sha256').update(raw.replace(/\r\n/g,'\n')).digest('hex');
const deletedBySlug=new Map();
for(const entry of evidence.deletedRows){
  if(!deletedBySlug.has(entry.slug))deletedBySlug.set(entry.slug,new Map());
  deletedBySlug.get(entry.slug).set(entry.index,entry.row);
}

export function beforeDisplayW04013(product,slug){
  product = beforeSamsungW04011(product,slug);
  const deleted=deletedBySlug.get(slug);
  if(!deleted)return product;
  if(product.specifications.length===evidence.products[slug].before)return product;
  const earlier=structuredClone(product);
  const rows=[];
  let cursor=0;
  for(let index=0;index<evidence.products[slug].before;index++){
    if(deleted.has(index))rows.push(structuredClone(deleted.get(index)));
    else rows.push(earlier.specifications[cursor++]);
  }
  if(cursor!==earlier.specifications.length)throw Error(`${slug}: retained row count changed`);
  earlier.specifications=rows;
  return earlier;
}
export function beforeDisplayW04013Raw(raw,slug){
  if(!deletedBySlug.has(slug))return raw;
  const restored=`${JSON.stringify(beforeDisplayW04013(JSON.parse(raw),slug),null,2)}\n`;
  if(hash(restored)!==evidence.products[slug].originalSha256)throw Error(`${slug}: historical restore does not match origin/main`);
  return restored;
}
export function beforeDisplayW04013Path(path,product){
  const slug=/(?:^|\/)([^/]+)\.json$/.exec(path)?.[1]??'';
  return beforeDisplayW04013(product,slug);
}
