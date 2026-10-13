import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/w13007-wmf-history.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');

// Undo only the approved WMFX Diagram and map fields for older history checks.
export function beforeW13007WmfProduct(current,slug){
  const record=fixture[slug];if(!record)return current;
  let result=current;
  for(const [field,{previous,approvedSha256}] of Object.entries(record)){
    const actual=hash(result[field]);
    if(actual===hash(previous))continue;
    if(actual!==approvedSha256)throw new Error(`${slug}: unexpected W-007 WMF ${field} change`);
    if(result===current)result=structuredClone(current);
    if(previous===null)delete result[field];else result[field]=structuredClone(previous);
  }
  return result;
}
export function beforeW13007WmfRaw(raw,slug){
  if(!fixture[slug])return raw;
  return JSON.stringify(beforeW13007WmfProduct(JSON.parse(raw),slug),null,2)+'\n';
}
