import {beforeW16015RallyProduct} from './w16015-rally-history.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Undo only the fields approved for W-20261014-001 in historical assertions.
// All other fields remain the current product's values and stay test-visible.
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261014-001-prior-fields.json',import.meta.url)));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');
export const logitechW14001Slugs=new Set(Object.keys(fixture));
export function beforeLogitechW14001Product(current,slug){
  current=beforeW16015RallyProduct(current,slug);
  if(!logitechW14001Slugs.has(slug))return current;
  const {prior,approved}=fixture[slug];
  for(const [field,expected] of Object.entries(approved)){
    if(hash(current[field])!==expected)throw new Error(`${slug}: unexpected W-20261014-001 ${field} change`);
  }
  const result=structuredClone(current);
  for(const [field,oldValue] of Object.entries(prior)){
    if(oldValue===null)delete result[field];
    else result[field]=structuredClone(oldValue);
  }
  return result;
}
export function beforeLogitechW14001Raw(raw,slug){
  if(!logitechW14001Slugs.has(slug))return raw;
  return JSON.stringify(beforeLogitechW14001Product(JSON.parse(raw),slug),null,2)+'\n';
}
