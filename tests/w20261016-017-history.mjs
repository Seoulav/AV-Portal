import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-017-prior-fields.json',import.meta.url)));
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
// W-017: restore only approved Sony placement; never replace whole products.
export function beforeW20261016_017Product(current,slug){
 const f=fixture.products[slug];
 if(!f||current.portMap===undefined)return current;
 const actual=sha(current.portMap);
 if(actual===sha(f.priorPortMap))return current;
 if(actual!==f.approvedPortMapSha)throw Error(slug+': unexpected W-017 portMap change (approved Sony map changed)');
 const p=structuredClone(current);p.portMap=structuredClone(f.priorPortMap);return p;
}
export function beforeW20261016_017Raw(raw,slug){
 if(!fixture.products[slug])return raw;
 return JSON.stringify(beforeW20261016_017Product(JSON.parse(raw),slug),null,2)+'\n';
}

// Restore only the approved Port Map implementation; unrelated view code stays visible.
export function beforeW20261016_017View(current){
 const start=current.indexOf('export function portMapGeometry('),end=current.indexOf('export function renderPortMapCards(');
 if(start<0||end<start)throw Error('W-017 renderer boundary changed');
 const block=current.slice(start,end),hash=createHash('sha256').update(block).digest('hex');
 if(block===fixture.priorViewBlock)return current;
 if(hash!==fixture.approvedViewBlockSha)throw Error('unexpected W-017 renderer change');
 return current.slice(0,start)+fixture.priorViewBlock+current.slice(end);
}
