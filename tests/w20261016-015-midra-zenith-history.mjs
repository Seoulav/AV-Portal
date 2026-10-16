import fs from 'node:fs';
import { createHash } from 'node:crypto';
const prior=JSON.parse(fs.readFileSync(new URL('./fixtures/w015-midra-zenith-prior.json',import.meta.url),'utf8'));
const approved=JSON.parse(fs.readFileSync(new URL('./fixtures/w015-midra-zenith-approved.json',import.meta.url),'utf8'));
const slugs=new Set(Object.keys(prior));
const sha=value=>createHash('sha256').update(value).digest('hex');
const layout=map=>({image:map.image,measuredImage:map.measuredImage,crop:map.crop??null,items:map.items.map(item=>Object.fromEntries(['n','side','x','x1','x2','y','y1','y2','labelX','via'].filter(key=>Object.hasOwn(item,key)).map(key=>[key,item[key]])))});
const stable=map=>map.items.map(({n,label,desc})=>({n,label,desc}));
const bytes=product=>JSON.stringify(product,null,2)+'\n';
export function beforeW20261016_015MidraProduct(current,slug){
 if(!slugs.has(slug))return current;
 const base=prior[slug],expected=approved[slug];
 if(!current.portMaps)return current;
 if(!current.portMap||!Array.isArray(current.portMaps)||current.portMaps.length!==2||
    JSON.stringify(stable(current.portMaps[0]))!==JSON.stringify(stable(current.portMap))||JSON.stringify(stable(current.portMaps[1]))!==JSON.stringify(stable(base.portMap)))
  throw new Error(slug+': unexpected W-015 Midra/Zenith Port Map facts');
 const actualSha=sha(JSON.stringify({portMap:layout(current.portMap),portMaps:current.portMaps.map(layout)}));
 if(actualSha!==expected.portMapsSha256)throw new Error(slug+': unexpected W-015 Midra/Zenith Port Map layout');
 const panels=current.images.filter(image=>image.role==='Other');
 if(panels.length!==1||JSON.stringify(panels[0])!==JSON.stringify(expected.otherImage))
  throw new Error(slug+': unexpected W-015 Midra/Zenith panel image metadata');
 const panelBytes=fs.readFileSync(new URL(`../beta/site/detail/images/${expected.otherImage.file}`,import.meta.url));
 if(sha(panelBytes)!==expected.panelFileSha256)throw new Error(slug+': unexpected W-015 Midra/Zenith panel image');
 const currentStatus=current.imageStatuses.find(status=>status.role==='Other');
 if(JSON.stringify(currentStatus)!==JSON.stringify(expected.otherStatus))throw new Error(slug+': unexpected W-015 Midra/Zenith image status');
 const restored=structuredClone(current);
 restored.portMap=structuredClone(base.portMap);delete restored.portMaps;
 restored.images=restored.images.filter(image=>image.role!=='Other');
 const statusIndex=restored.imageStatuses.findIndex(status=>status.role==='Other');
 if(statusIndex<0)throw new Error(slug+': missing original Other image status');
 restored.imageStatuses[statusIndex]=structuredClone(base.imageStatuses.find(status=>status.role==='Other'));
 return restored;
}
export function beforeW20261016_015MidraRaw(raw,slug){
 if(!slugs.has(slug))return raw;
 return bytes(beforeW20261016_015MidraProduct(JSON.parse(raw),slug));
}
