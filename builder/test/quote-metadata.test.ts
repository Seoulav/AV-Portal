import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { serializeDiagram, validateDiagram } from '../src/engine';
import { createBuilderStore } from '../src/state/store';
const sample = () => JSON.parse(readFileSync(new URL('../examples/small-room.diagram.json', import.meta.url), 'utf8'));
it('preserves systems and options across export, open and undo', () => {
 const d = sample(); const n = d.nodes.find((n: any) => n.type === 'equipment');
 n.data.systemName = '회의실 A'; n.data.selectedOptionQuantities = { OPT: 2 }; n.data.optionPortIds = [];
 d.options = [{id:'OPT',model:'TEST-OPTION',name:'합성 옵션'}];
 const stored = JSON.parse(serializeDiagram(d));
 expect(stored.nodes.find((x: any) => x.id === n.id).data.systemName).toBe('회의실 A');
 expect(stored.options).toEqual(d.options);
 const s = createBuilderStore(); expect(s.getState().importText(JSON.stringify(stored)).ok).toBe(true);
 expect(JSON.parse(s.getState().exportText()).nodes.find((x: any) => x.id === n.id).data.selectedOptionQuantities).toEqual({OPT:2});
});
it('rejects invalid option quantities before accepting a saved diagram', () => {
 const d=sample(); d.nodes.find((n: any)=>n.type==='equipment').data.selectedOptionQuantities={OPT:-1};
 expect(validateDiagram(d).errors.length).toBeGreaterThan(0);
});

it('keeps option definitions when copying into a new diagram and refuses conflicting ids', () => {
 const d=sample(), n=d.nodes.find((n:any)=>n.type==='equipment');
 n.selected=true; n.data.selectedOptionQuantities={OPT:2};d.options=[{id:'OPT',model:'OPT-A'}];
 const s=createBuilderStore({initial:d});s.getState().copySelection();s.getState().newDiagram();s.getState().paste();
 expect(JSON.parse(s.getState().exportText()).options).toEqual(d.options);
 s.getState().undo();expect(s.getState().diagram.nodes).toHaveLength(0);s.getState().redo();
 expect(s.getState().diagram.options).toEqual(d.options);
 s.setState({diagram:{...s.getState().diagram,options:[{id:'OPT',model:'OPT-B'}]}});
 expect(s.getState().paste()).toBe(0);
 expect(s.getState().diagram.options?.[0].model).toBe('OPT-B');
});

it.each([true, false])('does not resolve undefined option references from another diagram (source missing: %s)', sourceMissing => {
 const d=sample(), n=d.nodes.find((n:any)=>n.type==='equipment');
 n.selected=true; n.data.selectedOptionQuantities={OPT:2};
 d.options=sourceMissing?[]:[{id:'OPT',model:'OPT-A'}];
 const s=createBuilderStore({initial:d});s.getState().copySelection();
 const target=sample();target.nodes[0].data.selectedOptionQuantities={OPT:3};
 target.options=sourceMissing?[{id:'OPT',model:'OPT-B'}]:[];
 s.setState({diagram:target});
 const before=s.getState().exportText();
 expect(s.getState().paste()).toBe(0);
 expect(s.getState().exportText()).toBe(before);
});
