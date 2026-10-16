import { beforeW20261016_001View, beforeW20261016_001Styles } from './w20261016-001-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW20261015_001Product,beforeW20261015_001Raw} from './w20261015-001-history.mjs';
import {beforeW20261015_003Product} from './w20261015-003-history.mjs';
import {enhancementErrors} from '../beta/site/detail/detail-enhancements.mjs';

const detailPath = new URL('../beta/site/detail/data/', import.meta.url);
const read = slug => readFileSync(new URL(slug+'.json',detailPath),'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');

test('selective inverse restores the exact pre-flow HDF-CCF JSON', () => {
  const before003 = beforeW20261015_003Product(JSON.parse(read('hdf-ccf')), 'hdf-ccf');
  assert.equal(sha(beforeW20261015_001Raw(JSON.stringify(before003, null, 2) + '\n','hdf-ccf')),
    '1e584920f55f4009baece93c7fca04dfc2986679ae0a307359c169a358e0cb1f');
  const product = beforeW20261015_003Product(JSON.parse(read('hdf-ccf')), 'hdf-ccf');
  product.overview += ' 독립적인 후속 설명';
  assert.match(beforeW20261015_001Product(product,'hdf-ccf').overview,/후속 설명/);
  product.signalFlow.scenarios[1].powerDirection='forward';
  assert.throws(()=>beforeW20261015_001Product(product,'hdf-ccf'),/approved flow changed/);
  const other = {model:'OTHER',signalFlow:{future:true}};
  assert.equal(beforeW20261015_001Product(other,'other'),other);
});

test('PD source correction inverse restores only the previous flow wording', () => {
  const current = JSON.parse(read('hdf-ccf'));
  const prior = beforeW20261015_003Product(current, 'hdf-ccf');
  assert.equal(sha(JSON.stringify(prior.signalFlow)), '46c40b840df4c0f31493f3a0a0560d806e151b5976cb771d202d6292acc32f59');
  current.signalFlow.scenarios[1].powerDirection = 'forward';
  assert.throws(() => beforeW20261015_003Product(current, 'hdf-ccf'), /revised PD flow changed/);
  const other = { model: 'OTHER' };
  assert.equal(beforeW20261015_003Product(other, 'other'), other);
});

test('all pre-existing products still validate and view source matches the approved marker-offset revision', () => {
  for(const name of readdirSync(detailPath).filter(x=>x.endsWith('.json')&&x!=='hdf-ccf.json')){
    const p=JSON.parse(readFileSync(new URL(name,detailPath),'utf8'));
    assert.deepEqual(enhancementErrors(p),[],name);
  }
  const view=beforeW20261016_001View(readFileSync(new URL('../beta/site/detail/detail-enhancement-view.mjs',import.meta.url),'utf8'))
    .replace(/\/\/ HDF-CCF cable scenario renderer start\n[\s\S]*?\/\/ HDF-CCF cable scenario renderer end\n/,'')
    .replace("  if (flow.layout === 'cable-scenarios') return renderCableScenarioFlow(flow, model);\n",'');
  assert.equal(sha(view),'1f512b14f80b04e862e56c9a1c729a1ac73a60ea0986ccb9b1402f538b843e3d');
  const css=beforeW20261016_001Styles(readFileSync(new URL('../beta/site/detail/styles.css',import.meta.url),'utf8'))
    .replace(/\n\/\* W-20261016-010 Aquilon layer-plan card\. \*\/[\s\S]*?\/\* W-20261016-010 Aquilon layer-plan card end\. \*\/\n/,'\n')
    .split('\n/* HDF-CCF cable scenarios. Existing signal-flow layout uses its own classes. */')[0];
  assert.equal(sha(css),'415112b0c26aae92313c91840579a1505d2de0f5d4559367407e44b80f9cc61d');
});
