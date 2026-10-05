import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeAmxW008Product,beforeAmxW008Raw} from './amx-w008-history.mjs';

// Historical assertions in this suite first undo the newer W-008 AMX image
// edits, then W-026's NETGEAR edits. Both inverses accept current products and
// restore only their approved fields; unrelated fields pass through unchanged.
const prior=JSON.parse(readFileSync(new URL('../Work/기록/W-20261004-026-prior-fields.json',import.meta.url)));
const approved=JSON.parse(readFileSync(new URL('../Work/기록/W-20261004-026-approved-fields.json',import.meta.url)));
export const w026Slugs=new Set(Object.keys(prior));
export function beforeW026Product(current,slug) {
  current=beforeAmxW008Product(current,slug);
  if(!w026Slugs.has(slug))return current;
  for(const field of ['images','imageStatuses','portMap']) {
    const actual=createHash('sha256').update(JSON.stringify(current[field]??null)).digest('hex');
    if(actual!==approved[slug][field])throw new Error(`${slug}: unexpected W-026 ${field} change`);
  }
  const result=structuredClone(current), previous=prior[slug];
  result.images=structuredClone(previous.images);
  result.imageStatuses=structuredClone(previous.imageStatuses);
  if(previous.portMap===null)delete result.portMap;
  else result.portMap=structuredClone(previous.portMap);
  return result;
}
export function beforeW026Raw(raw,slug) {
  raw=beforeAmxW008Raw(raw,slug);
  if(!w026Slugs.has(slug))return raw;
  return JSON.stringify(beforeW026Product(JSON.parse(raw),slug),null,2)+'\n';
}
