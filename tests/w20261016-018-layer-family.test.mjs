import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {renderLayer,layerSource} from './w20261016-018-layer-dom.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const baseline=read('./fixtures/w018/rs-layer-dom-hashes.json');
const hash=s=>createHash('sha256').update(s).digest('hex');
test('W-003 keeps the seven RS model-number cards stable after moving shared rules to the standards card',()=>{
 for(const [slug,b]of Object.entries(baseline)){const p=read('../beta/site/detail/data/'+slug+'.json');const n=renderLayer(layerSource(),p.layerPlan,slug);assert.equal(hash(n.outerHTML),b.html,slug+' DOM');assert.equal(hash(n.textContent),b.text,slug+' text');}
});
test('W-018 family labels cover C-only and mixed plans in both approved locations',()=>{
 const base=read('../beta/site/detail/data/aquilon-rs1.json').layerPlan;
 const c=structuredClone(base);c.models=c.models.slice(0,4).map((x,i)=>({...x,slug:'aquilon-c'+i,model:['Aquilon Cmini','Aquilon C','Aquilon C+','Aquilon Cmax'][i]}));
 for(const row of c.models){const n=renderLayer(layerSource(),c,row.slug);assert.match(n.outerHTML,/Aquilon C · 모든 모델/);assert.match(n.outerHTML,/aria-label="Aquilon C 모델별 레이어·출력 비교표"/);assert.doesNotMatch(n.outerHTML,/Aquilon RS · 모든 모델/);}
 const mixed=structuredClone(c);mixed.models.push(base.models[1]);const n=renderLayer(layerSource(),mixed,mixed.models[0].slug);assert.match(n.outerHTML,/Aquilon · 모든 모델/);assert.match(n.outerHTML,/aria-label="Aquilon 모델별 레이어·출력 비교표"/);
});
