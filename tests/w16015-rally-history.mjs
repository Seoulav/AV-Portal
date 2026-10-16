import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const fixture=JSON.parse(readFileSync(new URL('./w16015-rally-prior.json',import.meta.url)));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');

// Undo only the approved Rally Plus image/status/map edits. All other current
// fields continue into historical assertions so unrelated regressions remain visible.
export function beforeW16015RallyProduct(current,slug){
  if(slug!=='rally-plus')return current;
  for(const [field,{approved}] of Object.entries(fixture)){
    if(hash(current[field])!==approved)throw new Error(slug+': unexpected W-015 Rally Plus '+field+' change');
  }
  const result=structuredClone(current);
  for(const [field,{prior}] of Object.entries(fixture)){
    if(prior===null)delete result[field];
    else result[field]=structuredClone(prior);
  }
  return result;
}
export function beforeW16015RallyRaw(raw,slug){
  if(slug!=='rally-plus')return raw;
  return JSON.stringify(beforeW16015RallyProduct(JSON.parse(raw),slug),null,2)+'\n';
}
