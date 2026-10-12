import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Historical checks restore only the user-approved MX392/MX418D I/O,
// MX392 specification name, and ULXD4Q Port Map. Other live fields pass through.
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/20261012-mx392-ulxd4q-후속-prior-fields.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');

export function beforeMx392Ulxd4qFollowupProduct(current,slug){
  const fields=fixture[slug];
  if(!fields)return current;
  const result=structuredClone(current);
  for(const [field,{prior,approvedSha256}] of Object.entries(fields)){
    const actual=sha(result[field]);
    if(actual===sha(prior))continue;
    if(actual!==approvedSha256)throw new Error(`${slug}: unexpected MX392/ULXD4Q followup ${field} change`);
    result[field]=structuredClone(prior);
  }
  return result;
}

export function beforeMx392Ulxd4qFollowupRaw(raw,slug){
  if(!fixture[slug])return raw;
  return JSON.stringify(beforeMx392Ulxd4qFollowupProduct(JSON.parse(raw),slug),null,2)+'\n';
}
