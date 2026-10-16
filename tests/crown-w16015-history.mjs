import fs from 'node:fs';
import {createHash} from 'node:crypto';
const records=JSON.parse(fs.readFileSync(new URL('../Work/기록/W-20261016-015-group3-prior-coords.json',import.meta.url)));
const keys=['side','x1','x2','y','x','y1','y2','labelX','via'];
export const crownGroup3Geometry=p=>({...(Object.hasOwn(p.portMap,'crop')?{crop:p.portMap.crop}:{}),items:p.portMap.items.map(i=>Object.fromEntries(['n',...keys].filter(k=>Object.hasOwn(i,k)).map(k=>[k,i[k]])))});
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
// Restore layout only; current names, descriptions, I/O, images and other fields flow through.
export function beforeCrownW16015Product(current,slug){
 const r=records[slug];if(!r)return current;
 const h=sha(crownGroup3Geometry(current));if(h===sha(r.prior))return current;
 if(h!==r.approved)throw Error(slug+': unexpected W-015 Crown geometry change');
 const p=structuredClone(current);
 if(Object.hasOwn(r.prior,'crop'))p.portMap.crop=structuredClone(r.prior.crop);else delete p.portMap.crop;
 p.portMap.items=p.portMap.items.map((item,index)=>{
  const old=r.prior.items[index],restored={};
  for(const k of r.itemOrders[index]){
   if(keys.includes(k)){if(Object.hasOwn(old,k))restored[k]=structuredClone(old[k]);}
   else if(Object.hasOwn(item,k))restored[k]=item[k];
  }
  for(const [k,v]of Object.entries(item))if(!keys.includes(k)&&!Object.hasOwn(restored,k))restored[k]=v;
  return restored;
 });
 return p;
}
export function beforeCrownW16015Raw(raw,slug){
 if(!records[slug])return raw;
 const p=JSON.parse(raw),restored=beforeCrownW16015Product(p,slug);
 return p===restored?raw:JSON.stringify(restored,null,2)+'\n';
}
