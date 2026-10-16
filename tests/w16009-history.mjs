import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-009-prior-fields.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');
// Raw product file baselines from main a16ec71587ab137072a06c0b91eb7e865125d772,
// before W-009 edits. Keep these fixed because origin/main now contains the approved edits.
export const w16009BaselineFileSha256 = Object.freeze({
 'pt-mz11k':'cca8a2f53254bf013fda71a11d64ccbd0bdee74e20af71dee60ee79f7ccec2a6',
 'pt-mz14k':'94813987a877c544de35f69d53c67b48261e53e666052670f4a80b77b99cc22f',
 'pt-mz17k':'cb29f313aac14503486b7ecceae5740b3f639826fe0f3458c07ecb50e8f25297',
 'x100pro-2u':'cd1e19b75b7796e6da6ec92852b5ae518b87d463ee7cd4f9f42094eab38fcafa',
 'eb-l895e':'a7a1b18cca95fd1cd68eb1e9f9b57e9bb80802cee6a21939d4f14fd53a0cda77'
});
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