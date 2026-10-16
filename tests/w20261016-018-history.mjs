// W-018 is an additive registration. Historical snapshots exclude only these
// four exact approved catalog/upload rows and their detail filenames.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readBeforeGroup6bFileSync,readBeforeGroup6bFile} from './group6b-w16015-history.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/w018/additions.json',import.meta.url)));
export const w018Slugs=['aquilon-cmini','aquilon-c','aquilon-cplus','aquilon-cmax'];
export const isW018DetailFile=file=>w018Slugs.some(slug=>file===slug+'.json');
function removeApproved(rows,kind){
 const added=rows.filter(row=>w018Slugs.includes(row.slug));
 if(!added.length)return rows;
 assert.deepEqual(added,fixture[kind],'Unexpected W-018 '+kind+' rows');
 return rows.filter(row=>!w018Slugs.includes(row.slug));
}
export const beforeW018Catalog=rows=>removeApproved(rows,'catalog');
export const beforeW018Uploads=rows=>removeApproved(rows,'uploads');
const normalized=file=>String(file).replaceAll('\\','/');
function restore(file,bytes,options){
 const path=normalized(file);if(!path.endsWith('/beta/site/catalog.json')&&!path.endsWith('/beta/site/docs/manifest.json'))return bytes;
 const raw=Buffer.isBuffer(bytes)?bytes.toString('utf8'):bytes,p=JSON.parse(raw);
 const next=path.endsWith('/catalog.json')?beforeW018Catalog(p):{...p,uploads:beforeW018Uploads(p.uploads)};
 const text=JSON.stringify(next,null,2)+'\n';
 const encoding=typeof options==='string'?options:options?.encoding;return encoding?text:Buffer.from(text);
}
export const readBeforeW018FileSync=(file,options)=>restore(file,fs.readFileSync(file,options),options);
export const readBeforeW018File=async(file,options)=>restore(file,await fs.promises.readFile(file,options),options);
export const readBeforeW018Group6bFileSync=(file,options)=>restore(file,readBeforeGroup6bFileSync(file,options),options);
export const readBeforeW018Group6bFile=async(file,options)=>restore(file,await readBeforeGroup6bFile(file,options),options);
function priorNames(file,names){return /(?:^|\/)beta\/site\/detail\/data\/?$/.test(normalized(file))?names.filter(name=>!isW018DetailFile(typeof name==='string'?name:name.name)):names;}
export const readdirBeforeW018Sync=(file,options)=>priorNames(file,fs.readdirSync(file,options));
export const readdirBeforeW018=async(file,options)=>priorNames(file,await fs.promises.readdir(file,options));

export function beforeW018Snapshot(snapshot){
 const found=w018Slugs.filter(slug=>Object.hasOwn(snapshot.details,slug));
 if(!found.length)return snapshot;
 assert.equal(found.length,4,'Incomplete W-018 snapshot');
 const prior=structuredClone(snapshot);prior.catalog.count-=found.length;
 for(const slug of found)delete prior.details[slug];
 return prior;
}
