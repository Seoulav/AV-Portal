import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-012-prior-fields.json',import.meta.url)));
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
// W-012 / W-015: restore only approved Sony placement; never replace whole products.
export function beforeW20261016_012Product(current,slug){
 const f=fixture.products[slug];
 if(!f||current.portMap===undefined)return current;
 const actual=sha(current.portMap);
 if(actual===sha(f.priorPortMap))return current;
 if(actual!==f.approvedPortMapSha)throw Error(slug+': unexpected W-012 portMap change (approved Sony map changed)');
 const p=structuredClone(current);p.portMap=structuredClone(f.priorPortMap);return p;
}
export function beforeW20261016_012Raw(raw,slug){
 if(!fixture.products[slug])return raw;
 return JSON.stringify(beforeW20261016_012Product(JSON.parse(raw),slug),null,2)+'\n';
}
