import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeSamsungSourceCleanup, currentKeyFactAnchors} from './samsung-w010-history.mjs';
import {beforeSamsungForeignPurge} from './samsung-w014-history.mjs';
import {beforeSamsungManualIo} from './samsung-w015-history.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const targets = ['hg43u800fnfxkr','hg50u800fnfxkr','hg65u800fnfxkr','lh115qhfebgxkr','lh32qmcebgcxkr','lh43qhcebgcxkr','lh43qmcebgcxkr','lh75qhcebgcxkr','lh85qmcebgcxkr','lh98qmcebgcxkr','lh55vhcrbgbxkr','lh55vmcrbgbxkr','lh55wmfwbgcxkr','lh75wmfwlgcxkr'];

test('14 published Samsung overview cards use verified product rows and preserve all existing fields', () => {
  const evidence = read('Work/기록/W-20261002-007-samsung-key-facts-evidence.json');
  const later = read('Work/기록/W-20261002-008-evidence.json');
  // W-007 evidence preserves the discontinued model's historical review.
  assert.deepEqual(Object.keys(evidence.products).filter(slug => slug !== 'lh98qecedgcxkr'), targets);
  for (const slug of targets) {
    const p = beforeSamsungForeignPurge(beforeSamsungManualIo(read(`beta/site/detail/data/${slug}.json`), slug), slug);
    const e = evidence.products[slug];
    assert.match(p.lead, /^.+[.!?] .+[.!?]$/u, `${slug}: two lead sentences`);
    assert.equal((p.lead.match(/\*\*/g) || []).length, 2, `${slug}: one bold span`);
    assert.ok(p.subtitle && typeof p.subtitle === 'string');
    assert.ok(p.keyFacts.length >= 2 && p.keyFacts.length <= 4);
    if (slug.startsWith('hg')) {
      assert.match(p.keyFacts[2].label, /추가 구매/);
      assert.match(p.keyFacts[3].label, /별도 구매/);
    }
    const changedFacts = currentKeyFactAnchors(slug);
    assert.equal(p.keyFacts.length, changedFacts?.after.length ?? e.facts.length);
    for (const [i, fact] of p.keyFacts.entries()) {
      const proof = changedFacts ? {
        kind:'spec', index:changedFacts.anchors[i].index,
        label:changedFacts.after[i].label, value:changedFacts.after[i].value,
        unit:changedFacts.after[i].unit, rowName:changedFacts.anchors[i].name, condition:''
      } : e.facts[i];
      assert.deepEqual(Object.keys(fact).sort(), ['label','unit','value']);
      assert.deepEqual(fact, {label:proof.label, value:proof.value, unit:proof.unit});
      const row = p[proof.kind === 'spec' ? 'specifications' : 'io'][proof.index];
      assert.ok(['VERIFIED','FOUND'].includes(row.verification));
      assert.equal(fact.value, row.value, `${slug}: ${proof.index} original value`);
      assert.equal(fact.unit, row.unit || '');
      assert.equal(row.name, proof.rowName);
      assert.equal(row.condition || '', proof.condition);
    }
    const original = beforeSamsungSourceCleanup(p, slug);
    // Reconstruct the W-007 snapshot before W-008 restored verification and added document-backed quantities/sources.
    for (const change of later.products[slug]?.quantityChanges ?? []) original.io[change.index].quantity = change.before;
    original.sources = original.sources.filter(source => !(later.products[slug]?.addedSourceCodes ?? []).includes(source.code));
    delete original.lead;
    delete original.subtitle;
    delete original.keyFacts;
    for (const conflict of e.conflicts) original.io[conflict.index].verification = conflict.beforeVerification;
    assert.equal(sha(original), e.coreSha256, `${slug}: only three overview fields and approved conflict verification states may change`);
  }
});

test('9 published Korean none connector rows retain their provenance after W-008', () => {
  const evidence = read('Work/기록/W-20261002-007-samsung-key-facts-evidence.json');
  let count = 0;
  for (const [slug, e] of Object.entries(evidence.products)) {
    if (slug === 'lh98qecedgcxkr') continue;
    const p = beforeSamsungManualIo(read(`beta/site/detail/data/${slug}.json`), slug);
    for (const c of e.conflicts) {
      const row = p.io[c.index];
      assert.equal(row.connector, c.connector);
      assert.equal(row.verification, 'FOUND');
      assert.notEqual(row.quantity, '0');
      assert.equal(c.korean.value, '없음');
      assert.match(c.korean.url, /^https:\/\/www\.samsung\.com\/sec\/business\//);
      assert.ok(c.overseas.url.includes('samsung.com/'));
      assert.ok(c.overseas.code !== 'P');
      assert.equal(c.overseas.priorAvailability, row.availability);
      assert.match(c.overseas.priorAvailability, /미지원/);
      assert.match(c.interpretation, /지역 간 있음\/없음 충돌은 미확인/);
      // The W-007 citation is historical; W-014 removes its foreign source code.
      assert.equal(c.existingSource, beforeSamsungForeignPurge(beforeSamsungManualIo(p,slug), slug).io[c.index].source);
      count++;
    }
  }
  assert.equal(count, 9);
});
