import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/w141002-004-history.json',import.meta.url),'utf8'));
const digest=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');

// Restore only the approved wording or Port Map fields. An unrelated change
// stays visible to older whole-product assertions.
export function beforeW141002004Product(current,slug){
  const record=fixture[slug];
  if(!record)return current;
  // W-20261012-006's older inverse has already removed these projector maps.
  if(slug.startsWith('pt-mz') && current.portMap===undefined)return current;
  const entries=Object.entries(record.fields);
  if(entries.every(([field,row])=>digest(current[field])===digest(row.prior)))return current;
  const result=structuredClone(current);
  for(const [field,row] of entries){
    if(digest(current[field])!==row.approved)throw new Error(`${slug}: unexpected W-002–004 ${field} change`);
    if(row.prior===null)delete result[field];
    else result[field]=structuredClone(row.prior);
  }
  return result;
}

export function beforeW141002004Raw(raw,slug){
  if(!fixture[slug])return raw;
  return JSON.stringify(beforeW141002004Product(JSON.parse(raw),slug),null,2)+'\n';
}
