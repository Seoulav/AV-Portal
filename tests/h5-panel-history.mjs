import fs from 'node:fs';import assert from 'node:assert/strict';
const old=JSON.parse(fs.readFileSync(new URL('./fixtures/h5/prior-product.json',import.meta.url)));
const approved=JSON.parse(fs.readFileSync(new URL('./fixtures/h5/approved-layout.json',import.meta.url)));
const keys=['side','x1','x2','y','x','y1','y2','labelX','via'];
const mapLayout=m=>({...m,items:m.items.map(i=>Object.fromEntries(['n',...keys].filter(k=>k in i).map(k=>[k,i[k]])))});
export function beforeH5PanelProduct(p,slug){
 if(slug!=='novastar-h5'||!p.portMaps)return p;
 assert.deepEqual(p.portMap,p.portMaps[0],'unexpected H5 panel mirror');
 assert.deepEqual({portMap:mapLayout(p.portMap),portMaps:p.portMaps.map(mapLayout)},approved.layout,'unexpected H5 panel layout');
 assert.deepEqual(p.images.filter(i=>i.file===approved.panelImage.file),[approved.panelImage],'unexpected H5 panel image');
 const result=structuredClone(p),live=new Map(p.portMaps.flatMap(m=>m.items).map(i=>[i.n,i]));
 result.images=result.images.filter(i=>i.file!==approved.panelImage.file);
 result.portMap={...old.portMap,items:old.portMap.items.map(i=>{const now=live.get(i.n),next={};for(const k of Object.keys(i))next[k]=keys.includes(k)?i[k]:now[k];for(const [k,v]of Object.entries(now))if(!keys.includes(k)&&!(k in next))next[k]=v;return next;})};delete result.portMaps;return result;
}
export function beforeH5PanelRaw(raw,slug){const p=JSON.parse(raw),prior=beforeH5PanelProduct(p,slug);return p===prior?raw:JSON.stringify(prior,null,2)+'\n';}
