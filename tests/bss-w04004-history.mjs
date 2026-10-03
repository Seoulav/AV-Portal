// Reconstruct the approved snapshot preceding W-20261004-004. Historical
// evidence files are immutable; current tests apply this inverse before their
// own earlier-work inverses.
export const bssW04004Slugs=new Set(['blu-100','blu-101','blu-160','blu-dan']);

export function beforeBssW04004(product,slug){
  if(bssW04004Slugs.has(slug)){
    product.images=product.images.filter(image=>image.role!=='Rear');
    const rear=product.imageStatuses.find(image=>image.role==='Rear');
    rear.status='MISSING';
    rear.sourceUrl=`https://bssaudio.com/en-US/products/${slug==='blu-dan'?'blu-da':slug}`;
    delete product.portMap;
  }
  if(slug==='mxa925w-r'){
    const fact=product.keyFacts.find(item=>item.label==='커넥터 타입 · 1번만 PoE');
    if(fact)fact.label='RJ45 · 1번만 PoE';
  }
  return product;
}

export function beforeBssW04004Raw(raw,slug){
  if(!bssW04004Slugs.has(slug)&&slug!=='mxa925w-r')return raw;
  return JSON.stringify(beforeBssW04004(JSON.parse(raw),slug),null,2)+'\n';
}
