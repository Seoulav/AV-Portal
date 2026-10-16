import fs from 'node:fs';
const escText=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const escAttr=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;');
class Node {
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.text='';}
 set className(v){this.attrs.class=v;} set scope(v){this.attrs.scope=v;} set tabIndex(v){this.attrs.tabindex=v;}
 set textContent(v){this.text=String(v);this.children=[];} get textContent(){return this.text+this.children.map(x=>x.textContent).join('');}
 setAttribute(k,v){this.attrs[k]=String(v);} append(...v){this.children.push(...v);}
 get outerHTML(){return '<'+this.tag+Object.entries(this.attrs).map(([k,v])=>' '+k+'="'+escAttr(v)+'"').join('')+'>'+escText(this.text)+this.children.map(x=>x.outerHTML).join('')+'</'+this.tag+'>';}
}
const element=(tag,cls='',value)=>{const n=new Node(tag);n.className=cls;if(value!==undefined&&value!==null)n.textContent=value;return n;};
export function renderLayer(source,plan,slug){const start=source.indexOf('function renderAquilonLayerPlan('),end=source.indexOf('\nfunction renderVideoLayerPlan(');if(start<0||end<start)throw Error('Layer renderer missing');return Function('element',source.slice(start,end)+'; return renderAquilonLayerPlan;')(element)(plan,slug);}
export const layerSource=()=>fs.readFileSync(new URL('../prototype/brc-am7/app.js',import.meta.url),'utf8');
