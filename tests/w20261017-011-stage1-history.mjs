// Undo only W-20261017-011's two approved prototype maps before older hash checks.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/w20261017-011-stage1-prior-maps.json',import.meta.url),'utf8'));
const approved={
  'aquilon-rs2':'4c01aa61c91ea4b94dc1ca58a9f558d11f66671bab2d279e2e39e60bdfd5f007',
  'aquilon-cplus':'465a66c4a900781e87bbab2096e865cbb1cf2f0a1e18bd4a7503b6ab23f6838e'
};
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW20261017_011Stage1Product(product,slug){
  const record=fixture[slug];
  if(!record)return product;
  if(!product.portMap)return product;
  const current=sha(product.portMap);
  if(current===record.portMapSha256)return product;
  // Older inverse helpers may hand us a pre-W-014 map in the same chain.
  if(!product.portMap.items?.[0]?.label?.startsWith('슬롯 1'))return product;
  if(current!==approved[slug])throw new Error(`${slug}: unexpected W-20261017-011 map change`);
  return {...product,portMap:structuredClone(record.portMap)};
}

export function beforeW20261017_011Stage1Raw(raw,slug){
  const product=JSON.parse(raw.charCodeAt(0)===0xfeff?raw.slice(1):raw);
  const prior=beforeW20261017_011Stage1Product(product,slug);
  return prior===product?raw:JSON.stringify(prior,null,2)+'\n';
}
