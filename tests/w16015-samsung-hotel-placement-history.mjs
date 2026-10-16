import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/w16015-samsung-hotel-placement-history.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');
export const w16015SamsungHotelPlacementSlugs=new Set(Object.keys(fixture));

// Rewind only the Samsung U800F Port Map coordinates changed after W-015 #587.
export function beforeW16015SamsungHotelPlacementProduct(current,slug){
 const record=fixture[slug];
 if(!record)return current;
 const {previous,approvedSha256}=record.portMap;
 const actual=hash(current.portMap);
 if(actual===hash(previous))return current;
 if(actual!==approvedSha256)throw new Error(`${slug}: unexpected W-015 Samsung hotel Port Map placement change`);
 const result=structuredClone(current);
 result.portMap=structuredClone(previous);
 return result;
}

export function beforeW16015SamsungHotelPlacementRaw(raw,slug){
 if(!fixture[slug])return raw;
 const current=JSON.parse(raw),restored=beforeW16015SamsungHotelPlacementProduct(current,slug);
 return restored===current?raw:JSON.stringify(restored,null,2)+'\n';
}
