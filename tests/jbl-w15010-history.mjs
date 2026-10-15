import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Undo only the three approved new maps for older whole-product assertions.
// Every other current product field remains visible to those assertions.
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261015-010-prior-fields.json',import.meta.url)));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');
export const jblW15010Slugs=new Set(Object.keys(fixture));
export function beforeJblW15010Product(current,slug){
  if(!jblW15010Slugs.has(slug))return current;
  if(hash(current.portMap)!==fixture[slug].approved.portMap)throw new Error(slug+': unexpected W-20261015-010 portMap change');
  const result=structuredClone(current);
  delete result.portMap;
  return result;
}
export function beforeJblW15010Raw(raw,slug){
  if(!jblW15010Slugs.has(slug))return raw;
  return JSON.stringify(beforeJblW15010Product(JSON.parse(raw),slug),null,2)+'\n';
}
