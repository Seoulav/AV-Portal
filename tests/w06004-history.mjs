import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Restore only approved W-004 photo metadata and UA864A map coordinates.
// All other current fields remain visible to the historical hash assertions.
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261006-004-prior-fields.json',import.meta.url)));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');
export const w06004Slugs=new Set(Object.keys(fixture));
export function beforeW06004Product(current,slug) {
  if(!w06004Slugs.has(slug))return current;
  const {prior,approved}=fixture[slug];
  for(const field of Object.keys(approved)) {
    if(hash(current[field])!==approved[field])throw new Error(`${slug}: unexpected W-004 ${field} change`);
  }
  const result=structuredClone(current);
  for(const field of Object.keys(prior)) {
    if(prior[field]===null)delete result[field];
    else result[field]=structuredClone(prior[field]);
  }
  return result;
}
export function beforeW06004Raw(raw,slug) {
  if(!w06004Slugs.has(slug))return raw;
  return JSON.stringify(beforeW06004Product(JSON.parse(raw),slug),null,2)+'\n';
}
