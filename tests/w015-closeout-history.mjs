// Restore only the exact closeout-approved map for older historical assertions.
import fs from 'node:fs';import{createHash}from'node:crypto';
import {beforeW20261017_011Stage1Product} from './w20261017-011-stage1-history.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/w015-closeout-before.json',import.meta.url)));
const sha=m=>createHash('sha256').update(JSON.stringify(m)).digest('hex');
export function beforeW015CloseoutProduct(product,slug,context='W-015 closeout map change'){
 product=beforeW20261017_011Stage1Product(product,slug);
 const f=fixture[slug];if(!f||!product.portMap)return product;
 const current=sha(product.portMap),old=sha(f.portMap);if(current===old)return product;
 if(current!==f.afterPortMapSha256)throw Error(slug+': unexpected '+context+' (W-015 closeout map differs)');
 const restored=structuredClone(product);restored.portMap=structuredClone(f.portMap);return restored;
}
