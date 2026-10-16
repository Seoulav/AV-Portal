import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-009-prior-fields.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');
export const w16009Slugs=new Set(Object.keys(fixture));
export function beforeW16009Product(current,slug){
 const r=fixture[slug];if(!r)return current;
 const fields=Object.keys(r.prior);
 if(fields.every(f=>hash(current[f])===hash(r.prior[f])))return current;
 for(const f of fields)if(hash(current[f])!==r.approved[f])throw Error(slug+': unexpected W-009 '+f+' change');
 const out=structuredClone(current);
 for(const f of fields)out[f]=structuredClone(r.prior[f]);
 return out;
}
export function beforeW16009Raw(raw,slug){
 if(!fixture[slug])return raw;
 const current=JSON.parse(raw),old=beforeW16009Product(current,slug);
 return current===old?raw:JSON.stringify(old,null,2)+'\n';
}
export function beforeW16009Images(images,slug){
 const r=fixture[slug];if(!r?.prior.images)return images;
 if(hash(images)===hash(r.prior.images))return images;
 if(hash(images)!==r.approved.images)throw Error(slug+': unexpected W-009 images change');
 return structuredClone(r.prior.images);
}