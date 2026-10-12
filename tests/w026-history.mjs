import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeAmxW008Product,beforeAmxW008Raw} from './amx-w008-history.mjs';
import {beforeJblW06001Product,beforeJblW06001Raw} from './jbl-w06001-history.mjs';
import {beforeW06002Product,beforeW06002Raw} from './w06002-history.mjs';
import {beforeW06003Product,beforeW06003Raw} from './w06003-history.mjs';
import {beforeW06004Product,beforeW06004Raw} from './w06004-history.mjs';
import {beforeW06005Product,beforeW06005Raw} from './w06005-history.mjs';
import {beforeW12002Product,beforeW12002Raw} from './w12002-wording-history.mjs';
import {beforeW12014Product,beforeW12014Raw} from './w12014-history.mjs';

// Historical assertions undo approved W-005 maps and W-004 photo edits, then
// the newer Sony, Aquilon, JBL, AMX, and W-026 edits. Each inverse accepts current products and
// restores only its approved fields; unrelated fields pass through unchanged.
const prior=JSON.parse(readFileSync(new URL('../Work/기록/W-20261004-026-prior-fields.json',import.meta.url)));
const approved=JSON.parse(readFileSync(new URL('../Work/기록/W-20261004-026-approved-fields.json',import.meta.url)));
export const w026Slugs=new Set(Object.keys(prior));
export function beforeW026Product(current,slug,{wordingAlreadyRestored=false}={}) {
  if(slug!=='ulxd4q'||current.portMap?.items?.length===13)current=beforeW12014Product(current,slug);
  if(!wordingAlreadyRestored)current=beforeW12002Product(current,slug);
  current=beforeW06005Product(current,slug);
  current=beforeW06004Product(current,slug);
  current=beforeAmxW008Product(beforeJblW06001Product(beforeW06002Product(beforeW06003Product(current,slug),slug),slug),slug);
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
  if(slug!=='ulxd4q'||JSON.parse(raw).portMap?.items?.length===13)raw=beforeW12014Raw(raw,slug);
  raw=beforeW12002Raw(raw,slug);
  raw=beforeW06005Raw(raw,slug);
  raw=beforeW06004Raw(raw,slug);
  raw=beforeAmxW008Raw(beforeJblW06001Raw(beforeW06002Raw(beforeW06003Raw(raw,slug),slug),slug),slug);
  if(!w026Slugs.has(slug))return raw;
  return JSON.stringify(beforeW026Product(JSON.parse(raw),slug,{wordingAlreadyRestored:true}),null,2)+'\n';
}
