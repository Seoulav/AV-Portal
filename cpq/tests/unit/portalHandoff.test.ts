import { it, expect } from 'vitest';
import { toQuotePayload, isHandoffMessage } from '../../../shared/quote-handoff';
const raw = () => ({version:'1.2',nodes:[{id:'n',type:'equipment',data:{model:'FIX',systemName:'A',selectedOptionQuantities:{OPT:2},cost:987654321,inputs:[{id:'in',type:'audio',cost:987654321}]}}],edges:[{id:'e',source:'n',target:'n',data:{lineTypeId:'audio',bomRows:[{quantity:2,length:3,cableType:'ready-made',productName:'TEST',cost:987654321}]}}],lineTypes:[{id:'audio',name:'Audio'}],options:[{id:'OPT',model:'FIX-OPT',cost:987654321}],privateCost:987654321});
it('projects only diagram fields at every level, including option quantity maps',()=>{
 const data=toQuotePayload(raw()); expect(JSON.stringify(data)).not.toContain('987654321');
 expect(data.nodes[0]?.data.systemName).toBe('A'); expect(data.nodes[0]?.data.selectedOptionQuantities).toEqual({OPT:2});
 expect(data.edges).toHaveLength(1); expect(data.options).toHaveLength(1);
});
it('rejects malformed, huge, nonfinite and unsafe quantities without echoing contents',()=>{
 for(const value of [{}, {...raw(),nodes:'bad'}, {...raw(),version:'x'.repeat(9_000_000)}, {...raw(),nodes:[{id:'n',data:{selectedOptionQuantities:{a:Infinity}}}]}]) expect(()=>toQuotePayload(value)).toThrow();
});
it('requires protocol, phase and unguessable request token',()=>{
 expect(isHandoffMessage({protocol:'av-portal:quote:1',kind:'hello',id:'a'.repeat(36)})).toBe(true);
 expect(isHandoffMessage({protocol:'av-portal:quote:1',kind:'hello',id:'x'})).toBe(false);
 expect(isHandoffMessage({protocol:'bad',kind:'hello',id:'a'.repeat(36)})).toBe(false);
});
