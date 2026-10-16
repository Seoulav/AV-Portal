import {beforeW16015Product,beforeW16015Raw} from './w16015-group1-history.mjs';
import { readFileSync } from 'node:fs';
import { beforeW16009Product, beforeW16009Raw } from './w16009-history.mjs';
import { createHash } from 'node:crypto';
import { beforeMxc420PhotoProduct, beforeMxc420PhotoRaw } from './mxc420-photo-history.mjs';
import { beforeW141002004Product, beforeW141002004Raw } from './w141002-004-history.mjs';
import { beforeW20261015_002EpsonProduct } from './w20261015-002-history.mjs';
import { beforeW20261015_007Product } from './w20261015-007-history.mjs';

// Older whole-product hashes see the current product with only W-006's
// approved fields restored. Every unrelated current field stays observable.
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-006-prior-fields.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');
export const w12006Slugs=new Set(Object.keys(fixture));

export function beforeW12006Product(current,slug,skipW16009=false){
 if(!skipW16009){current=beforeW16015Product(current,slug);current=beforeW16009Product(current,slug);}
 current=beforeW20261015_007Product(current,slug);
 current=beforeW20261015_002EpsonProduct(current,slug);
 current=beforeW141002004Product(current,slug);
 current=beforeMxc420PhotoProduct(current,slug);
 const record=fixture[slug];if(!record)return current;
 if(record.fields.every(field=>hash(current[field])===hash(record.prior[field])))return current;
 for(const field of record.fields){
  if(hash(current[field])!==record.approved[field])throw Error(`${slug}: unexpected W-006 ${field} change`);
 }
 const result=structuredClone(current);
 for(const field of record.fields){
  if(record.prior[field]===null)delete result[field];
  else result[field]=structuredClone(record.prior[field]);
 }
 return result;
}

export function beforeW12006Raw(raw,slug){
 raw=beforeW16015Raw(raw,slug);
 raw=beforeW16009Raw(raw,slug);
 raw=beforeW141002004Raw(raw,slug);
 raw=beforeMxc420PhotoRaw(raw,slug);
 if(!fixture[slug])return raw;
 return JSON.stringify(beforeW12006Product(JSON.parse(raw),slug,true),null,2)+'\n';
}
