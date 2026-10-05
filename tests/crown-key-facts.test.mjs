import { isW006Name } from './w006-history.mjs';
import {beforeW026Raw, beforeW026Product} from './w026-history.mjs';
import { beforeW032Raw } from './w032-history.mjs';
import { beforeW032Product } from './w032-history.mjs';
import { isW029Name } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeBssW04004,beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignment,beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';
import {beforeSamsungW04010,beforeSamsungW04010Raw} from './samsung-w04010-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const dataDir = new URL('beta/site/detail/data/', root);
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const crown = readdirSync(dataDir).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json')
  .map(name => name.slice(0, -5)).filter(slug => read(`beta/site/detail/data/${slug}.json`).manufacturer === 'Crown').sort();
const pilot = 'dci-4-600da';
const targets = crown.filter(slug => slug !== pilot);
const evidence = read('Work/기록/W-20261003-013-evidence.json');

test('Crown 25 new overview cards render two to four evidence-shaped facts', () => {
  assert.equal(crown.length, 26);
  assert.equal(targets.length, 25);
  for (const slug of targets) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    const proof = evidence.products[slug];
    assert.ok(product.lead && product.subtitle, `${slug}: lead/subtitle`);
    assert.equal((product.lead.match(/\*\*/g) || []).length, 2, `${slug}: one bold span`);
    assert.equal((product.lead.match(/[^.!?]+[.!?]/g) || []).length, 2, `${slug}: two lead sentences`);
    assert.equal(product.series, proof.series);
    assert.equal(product.overview, proof.overview);
    assert.ok(product.keyFacts?.length >= 2 && product.keyFacts.length <= 4, `${slug}: 2–4 facts`);
    assert.equal(prepareEnhancements(product).keyFacts.length, product.keyFacts.length, `${slug}: rendered facts`);
    assert.equal(product.keyFacts.length, proof.facts.length, slug);
    for (const [position, fact] of product.keyFacts.entries()) {
      const anchor = proof.facts[position];
      assert.deepEqual(Object.keys(fact).sort(), ['label','unit','value'], slug);
      assert.deepEqual(fact, {label:anchor.label,value:anchor.value,unit:anchor.unit}, slug);
      const row = product.specifications[anchor.index];
      assert.ok(['VERIFIED','FOUND'].includes(row.verification), `${slug}: verified source`);
      assert.equal(row.name, anchor.rowName, slug);
      assert.equal(row.group, anchor.rowGroup, slug);
      assert.equal(row.condition || '', anchor.rowCondition, slug);
      assert.equal(row.value, fact.value, `${slug}: exact source value`);
      assert.equal(row.unit || '', fact.unit, `${slug}: exact source unit`);
      if (anchor.axis === '채널당 정격 출력') assert.match(fact.label, /4Ω|Lo-Z\/Hi-Z/, `${slug}: output condition in label`);
    }
    const core = structuredClone(product);
    delete core.lead; delete core.subtitle; delete core.keyFacts;
    assert.equal(sha(core), proof.coreSha256, `${slug}: only three presentation fields change`);
  }
});

test('the approved DCi 4|600DA pilot remains untouched', () => {
  const product = read(`beta/site/detail/data/${pilot}.json`);
  assert.equal(product.keyFacts.length, 4);
  assert.equal(sha(product.keyFacts), '04fb5ebbf30be83c434f0b94f85b1f62ef3ec676a2e8057e7692e1cb335b862c');
  assert.equal(sha(product), evidence.pilotSha256);
});

test('217 other product JSON objects retain their pre-task content', () => {
  const names = readdirSync(dataDir).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json' && !isW029Name(name) && !isW030Name(name) && !isW006Name(name)).sort();
  const otherNames = names.filter(name => !targets.includes(name.slice(0,-5)));
  const other = otherNames.map(name => [name,beforeHarmanW03014(beforeBssW04004(beforeSamsungW04010(beforeBssAlignment(beforeW032Product(beforeW026Product(read(`beta/site/detail/data/${name}`), name.slice(0,-5)), name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5))]);
  assert.equal(otherNames.length, 217);
  assert.equal(sha(other), evidence.otherDetailJsonSha256);
  const normalizedBytes = otherNames.map(name => `${name}\0${beforeHarmanW03014Raw(beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(beforeW032Raw(beforeW026Raw(readFileSync(new URL(`beta/site/detail/data/${name}`, root), 'utf8').replace(/\r\n/g, '\n'), name.slice(0,-5)), name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5))}`).join('');
  assert.equal(createHash('sha256').update(normalizedBytes).digest('hex'), evidence.otherDetailRawSha256,
    'all 217 non-target JSON files retain their exact Git blob content (normalizing checkout line endings)');
});
