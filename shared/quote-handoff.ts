// Shared wire contract. Never accept a quote document or a private-cost session here.
export const PROTOCOL = 'av-portal:quote:1';
export const MAX_BYTES = 8 * 1024 * 1024;
export type HandoffMessage = { protocol: typeof PROTOCOL; kind: 'hello' | 'ready' | 'diagram' | 'result'; id: string; payload?: unknown; accepted?: boolean };
export function isHandoffMessage(value: unknown): value is HandoffMessage {
 if (!value || typeof value !== 'object') return false;
 const m=value as Record<string, unknown>;
 return m.protocol===PROTOCOL && ['hello','ready','diagram','result'].includes(String(m.kind)) && typeof m.id==='string' && /^[a-zA-Z0-9-]{32,64}$/.test(m.id);
}
type Obj = Record<string, unknown>;
const fail = (): never => { throw new Error('구성도 전달 형식이나 크기를 확인해 주세요.'); };
const obj = (v: unknown): Obj => v && typeof v==='object' && !Array.isArray(v) ? v as Obj : fail();
const list = (v: unknown): unknown[] => Array.isArray(v) && v.length<=20000 ? v : fail();
const fields = (v: unknown, keys: string[]): Obj => {
 const o=obj(v); const out: Obj={};
 for(const k of keys) if(o[k]!==undefined) {
  if(typeof o[k] !== 'string' && (typeof o[k] !== 'number' || !Number.isFinite(o[k]))) fail();
  out[k]=o[k];
 }
 return out;
};
export interface QuotePayload { version: string; nodes: Array<{id: string; type?: string; data: Obj}>; edges: Obj[]; lineTypes: Obj[]; options?: Obj[] }
export function toQuotePayload(raw: unknown): QuotePayload {
 const d=obj(raw);
 let encoded: string; try { encoded=JSON.stringify(d); } catch { return fail(); }
 if(new TextEncoder().encode(encoded).length>MAX_BYTES || typeof d.version!=='string') return fail();
 const nodes=list(d.nodes).map(value=>{
  const n=obj(value), data=obj(n.data);
  if(typeof n.id!=='string' || (n.type!==undefined && typeof n.type!=='string')) return fail();
  const out=fields(data,['id','name','model','manufacturer','category','description','systemName']);
  for(const k of ['inputs','outputs','bidirectional']) if(data[k]!==undefined) out[k]=list(data[k]).map(p=>fields(p,['id','label','type','direction']));
  if(data.selectedOptionQuantities!==undefined) {
   const quantities=obj(data.selectedOptionQuantities);
   out.selectedOptionQuantities=Object.fromEntries(Object.entries(quantities).map(([id,q])=>{
    if(typeof q!=='number' || !Number.isSafeInteger(q) || q<0) return fail(); return [id,q];
   }));
  }
  if(data.optionPortIds!==undefined) out.optionPortIds=list(data.optionPortIds).map(id=>typeof id==='string'?id:fail());
  return {id:n.id,...(typeof n.type==='string'?{type:n.type}:{}),data:out};
 });
 const edges=list(d.edges).map(value=>{
  const e=obj(value), out=fields(e,['id','source','target','sourceHandle','targetHandle']);
  if(e.data!==undefined) {
   const data=obj(e.data), clean=fields(data,['lineTypeId']);
   if(data.bomRows!==undefined) clean.bomRows=list(data.bomRows).map(b=>fields(b,['cableType','productName','lineTypeId','length','quantity']));
   out.data=clean;
  }
  return out;
 });
 return {version:d.version,nodes,edges,lineTypes:list(d.lineTypes).map(l=>fields(l,['id','name','color'])),...(d.options!==undefined?{options:list(d.options).map(o=>fields(o,['id','model','name','manufacturer']))}:{})};
}
