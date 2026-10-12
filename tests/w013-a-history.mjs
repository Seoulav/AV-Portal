import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Restore only the three manual-backed ULXD4Q I/O row fields approved in
// session A. All other live fields still reach the older historical checks.
const fixture=JSON.parse(readFileSync(new URL('./fixtures/w013-a-ulxd4q-history.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW013AProduct(current,slug){
  if(slug!=='ulxd4q')return current;
  const result=structuredClone(current);
  for(const [index,fields] of Object.entries(fixture)){
    for(const [field,{prior,approved}] of Object.entries(fields)){
      const actual=result.io[Number(index)]?.[field];
      if(sha(actual)!==sha(approved))throw new Error(`ulxd4q: unexpected W-013-A io[${index}].${field} change`);
      result.io[Number(index)][field]=prior;
    }
  }
  return result;
}

export function beforeW013ARaw(raw,slug){
  if(slug!=='ulxd4q')return raw;
  return JSON.stringify(beforeW013AProduct(JSON.parse(raw),slug),null,2)+'\n';
}
