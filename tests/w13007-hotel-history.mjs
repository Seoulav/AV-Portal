import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/w13007-hotel-history.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');

// Restore only W-007's approved diagram metadata and map; leave every other
// current field visible to the older historical assertions.
export function beforeW13007HotelProduct(current,slug){
 const record=fixture[slug];if(!record)return current;
 let result=current;
 for(const [field,{previous,approvedSha256}] of Object.entries(record)){
   const actual=hash(result[field]);
   if(actual===hash(previous))continue;
   if(actual!==approvedSha256)throw new Error(`${slug}: unexpected W-007 ${field} change`);
   if(result===current)result=structuredClone(current);
   if(previous===null)delete result[field];else result[field]=structuredClone(previous);
 }
 return result;
}
export function beforeW13007HotelRaw(raw,slug){
 if(!fixture[slug])return raw;
 return JSON.stringify(beforeW13007HotelProduct(JSON.parse(raw),slug),null,2)+'\n';
}
