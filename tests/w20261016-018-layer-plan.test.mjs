import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validLayerPlan} from '../prototype/brc-am7/detail-enhancements.mjs';
const product=JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/aquilon-rs1.json',import.meta.url)));
const original=structuredClone(product.layerPlan);
function planWith(n){const p=structuredClone(original);p.models=Array.from({length:n},(_,i)=>i===0?structuredClone(original.models[1]):{...original.models[1],slug:'test-model-'+i,model:'Test Model '+i});return p;}
test('W-018 layerPlan accepts C 4 rows and 12 rows while preserving the existing RS 7-row result',()=>{
 const c=planWith(4);c.currentSlug='aquilon-c';c.models[0]={...c.models[0],slug:'aquilon-c',model:'Aquilon C'};
 assert.equal(validLayerPlan(c,{model:'Aquilon C'}),true);
 assert.equal(validLayerPlan(original,product),true);
 assert.deepEqual(product.layerPlan,original);
 assert.equal(validLayerPlan(planWith(12),product),true);
});
test('W-018 layerPlan rejects 1/13 rows, duplicate slugs and a currentSlug absent from models',()=>{
 for(const n of [1,13])assert.equal(validLayerPlan(planWith(n),product),false);
 const dup=planWith(4);dup.models[3].slug=dup.models[2].slug;assert.equal(validLayerPlan(dup,product),false);
 const absent=planWith(4);absent.currentSlug='missing-model';assert.equal(validLayerPlan(absent,product),false);
 const missing=planWith(4);delete missing.currentSlug;assert.equal(validLayerPlan(missing,product),false);
});
