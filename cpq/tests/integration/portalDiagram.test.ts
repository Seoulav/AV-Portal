import { it, expect } from 'vitest';
import { parseDiagram } from '../../src/import/diagram/schema';
import { diagramToQuote } from '../../src/import/diagram/toQuote';
import { defaultHeader } from '../../src/app/defaultHeader';
it('does not quote annotations and shapes but preserves unknown equipment and systems', () => {
 const d=parseDiagram({version:'1.2',lineTypes:[],edges:[],nodes:[
 {id:'note',type:'annotation',data:{label:'회의실'}}, {id:'shape',type:'shape',data:{}},
 {id:'dev',type:'equipment',data:{model:'UNKNOWN',systemName:'A',selectedOptionQuantities:{OPT:2}}}],options:[{id:'OPT',model:'UNKNOWN-OPTION'}]});
 const r=diagramToQuote(d,{products:[],prices:new Map(),pricesAvailable:false,sourceSha256:'a'.repeat(64)},{header:defaultHeader('합성'),defaultSystemName:'기본'});
 expect(r.document.rows.filter(x=>x.type==='item')).toHaveLength(2);
 expect(r.document.systems.map(s=>s.name)).toEqual(['A']);
 expect(r.warnings.some(w=>w.blocking)).toBe(true);
});
