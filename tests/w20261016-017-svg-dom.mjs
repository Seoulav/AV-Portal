// Small SVG DOM used by the existing renderer tests; preserves attribute/child order.
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export class SvgNode {
  constructor(tag) { this.tag=tag;this.attrs={};this.style={};this.children=[]; }
  setAttribute(name,value) { this.attrs[name]=String(value); }
  append(...children) { this.children.push(...children); }
  get outerHTML() {
    const attrs={...this.attrs};
    const styles=Object.entries(this.style).map(([k,v])=>k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+': '+v+';').join(' ');
    if(styles)attrs.style=styles;
    return '<'+this.tag+Object.entries(attrs).map(([k,v])=>' '+k+'="'+escape(v)+'"').join('')+'>'+escape(this.textContent??'')+this.children.map(c=>c.outerHTML).join('')+'</'+this.tag+'>';
  }
}
export function withSvgDocument(callback) {
  const original=globalThis.document;
  globalThis.document={createElementNS:(_ns,tag)=>new SvgNode(tag)};
  try{return callback();}finally{globalThis.document=original;}
}
