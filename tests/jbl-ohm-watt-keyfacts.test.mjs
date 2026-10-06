import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeJblW06001Product } from './jbl-w06001-history.mjs';

const root = new URL('../beta/site/detail/data/', import.meta.url);
const prior = JSON.parse(readFileSync(new URL('../Work/기록/W-20261006-001-prior-facts.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const impedance = {
  'ac18-26': 8, 'ac18-95': 8, 'control-23-1': 8, 'control-25-1': 8,
  'control-28-1': 8, 'control-412ct': 8, 'control-414ct': 8,
  'control-416ct': 8, 'control-418ct': 8, 'control-419cst': 8,
  'control-424ct': 16, 'control-424lp': 16, 'control-426ct': 12,
  'control-426lp': 12, 'control-440cst': 8, 'control-447ct': 8,
};
const longPower = {
  'ac18-95': { row: '시스템 전력 정격', watts: 250, kind: '컨티뉴어스 핑크노이즈' },
  'control-23-1': { row: '전력 정격', watts: 100, kind: '연속 프로그램 전력(2시간)' },
  'control-25-1': { row: '전력 정격', watts: 200, kind: '연속 프로그램 전력(2시간)' },
  'control-28-1': { row: '전력 정격', watts: 240, kind: '연속 프로그램 전력(2시간)' },
  'control-426ct': { row: '전력 용량', watts: 110, kind: '컨티뉴어스 핑크노이즈(2시간)' },
};

test('all 16 JBL overview cards show model-specific nominal ohms and a source-backed watt figure', () => {
  assert.equal(Object.keys(impedance).length, 16);
  for (const [slug, ohms] of Object.entries(impedance)) {
    const product = JSON.parse(readFileSync(new URL(`${slug}.json`, root), 'utf8'));
    const row = product.specifications.find(s => s.name === '공칭 임피던스');
    assert.ok(row && ['VERIFIED', 'FOUND'].includes(row.verification), slug);
    assert.equal(Number(row.value), ohms, slug);
    assert.ok(product.keyFacts.length >= 2 && product.keyFacts.length <= 4, slug);
    assert.equal(prepareEnhancements(product).keyFacts.length, product.keyFacts.length, slug);
    const pair = product.keyFacts.filter(f => f.label.startsWith('공칭 임피던스 · '));
    assert.equal(pair.length, 1, `${slug}: one combined fact`);
    assert.deepEqual(Object.keys(pair[0]).sort(), ['label', 'unit', 'value'], slug);
    assert.equal(pair[0].unit, '', slug);
    const match = /^(\d+) Ω · (\d+) W$/.exec(pair[0].value);
    assert.ok(match, `${slug}: ohm/watt notation`);
    assert.equal(Number(match[1]), ohms, slug);
    if (longPower[slug]) {
      const expected = longPower[slug];
      const power = product.specifications.find(s => s.name === expected.row);
      assert.ok(power && ['VERIFIED', 'FOUND'].includes(power.verification), slug);
      assert.ok(power.value.startsWith(`${expected.watts}W`), `${slug}: source watt figure`);
      assert.equal(Number(match[2]), expected.watts, slug);
      assert.ok(pair[0].label.includes(expected.kind), `${slug}: source condition in label`);
    } else {
      const name = slug === 'ac18-26' ? '시스템 전력 정격(AES)' : '연속 프로그램 전력(2시간)';
      const power = product.specifications.find(s => s.name === name);
      assert.ok(power && ['VERIFIED', 'FOUND'].includes(power.verification), slug);
      assert.equal(Number(match[2]), Number(String(power.value).replace(/\s*W$/, '')), slug);
      assert.ok(pair[0].label.includes(slug === 'ac18-26' ? '시스템 전력 · AES' : '연속 프로그램 전력 · 2시간'), slug);
    }
  }
});

test('only each JBL card changes; old card facts are restored without hiding other fields', () => {
  assert.deepEqual(Object.keys(prior).sort(), Object.keys(impedance).sort());
  for (const slug of Object.keys(impedance)) {
    const current = JSON.parse(readFileSync(new URL(`${slug}.json`, root), 'utf8'));
    const protectedFields = structuredClone(current);
    delete protectedFields.keyFacts;
    assert.equal(sha(protectedFields), prior[slug].protectedSha256, `${slug}: protected fields`);
    const old = beforeJblW06001Product(current, slug);
    assert.deepEqual(old.keyFacts, prior[slug].prior, slug);
    if (prior[slug].prior.length === 4) assert.deepEqual(current.keyFacts.slice(1), old.keyFacts.slice(1), `${slug}: other three facts`);
    else if (slug === 'control-440cst') assert.deepEqual(current.keyFacts.slice(1), old.keyFacts.slice(1), `${slug}: other two facts`);
    else assert.deepEqual(current.keyFacts.slice(1), old.keyFacts, `${slug}: existing facts`);
    const altered = structuredClone(current);
    altered.keyFacts[0].value = '999 Ω · 999 W';
    assert.throws(() => beforeJblW06001Product(altered, slug), /unexpected W-001 keyFacts change/, slug);
    const changedIo = structuredClone(current);
    changedIo.io = [];
    assert.deepEqual(beforeJblW06001Product(changedIo, slug).io, [], `${slug}: unrelated I/O passes through`);
  }
});
