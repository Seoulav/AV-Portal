// 6px scope confirmed by Work 2026-10-16: an in-photo leader versus another
// marker leader or bracket. Edge bracket legs versus each other are visually reviewed.
import{portMapGeometry,renderPortMap}from'../prototype/brc-am7/detail-enhancement-view.mjs';import{withSvgDocument}from'./w20261016-017-svg-dom.mjs';
export function portMapSegments(map){
 const im={naturalWidth:map.measuredImage.width,naturalHeight:map.measuredImage.height,src:'rear',alt:'Rear'},g=portMapGeometry(map,im.naturalWidth,im.naturalHeight);
 const svg=withSvgDocument(()=>renderPortMap(map,im)),paths=svg.children.filter(n=>n.tag==='path');const segments=[];
 for(let index=0;index<paths.length;index++){
  const d=paths[index].attrs.d,tokens=d.match(/[MHVL]|-?(?:\d*\.)?\d+(?:e[+-]?\d+)?/gi);let x=0,y=0,i=0;while(i<tokens.length){const c=tokens[i++],ox=x,oy=y;if(c==='M'||c==='L'){x=Number(tokens[i++]);y=Number(tokens[i++]);}else if(c==='H')x=Number(tokens[i++]);else if(c==='V')y=Number(tokens[i++]);else throw Error('Unexpected path '+d);if(c!=='M')segments.push({n:g.markers[Math.floor(index/2)].item.n,kind:index%2?'leader':'bracket',x1:ox,y1:oy,x2:x,y2:y});}
 }
 const inside=segments.map(s=>{if(s.y1===s.y2){if(s.y1<g.photoTop||s.y1>g.photoBottom)return null;return{...s,axis:'h',from:Math.max(Math.min(s.x1,s.x2),g.image.x),to:Math.min(Math.max(s.x1,s.x2),g.image.x+g.image.width),at:s.y1};}if(s.x1===s.x2){if(s.x1<g.image.x||s.x1>g.image.x+g.image.width)return null;return{...s,axis:'v',from:Math.max(Math.min(s.y1,s.y2),g.photoTop),to:Math.min(Math.max(s.y1,s.y2),g.photoBottom),at:s.x1};}throw Error('Diagonal leader');}).filter(s=>s&&s.to-s.from>1e-6);
 const tooLong=inside.filter(s=>s.kind==='leader'&&s.axis==='h'&&s.to-s.from>g.image.width/4+1e-6).map(s=>({...s,fraction:(s.to-s.from)/g.image.width}));
 let minGap=Infinity;const close=[];for(let a=0;a<inside.length;a++)for(let b=a+1;b<inside.length;b++){const x=inside[a],y=inside[b];if(x.n===y.n||x.kind!=='leader'&&y.kind!=='leader'||x.axis!==y.axis)continue;const gap=Math.abs(x.at-y.at),overlap=Math.min(x.to,y.to)-Math.max(x.from,y.from);if(overlap>1e-6)minGap=Math.min(minGap,gap-1.5);if(gap-1.5<6-1e-6&&overlap>1e-6)close.push({a:x.n,b:y.n,kind:[x.kind,y.kind],axis:x.axis,gap,overlap});}
 return{width:g.image.width,maxHorizontalFraction:Math.max(0,...inside.filter(s=>s.kind==='leader'&&s.axis==='h').map(s=>(s.to-s.from)/g.image.width)),minimumParallelClearance:Number.isFinite(minGap)?minGap:null,tooLong,close};
}
