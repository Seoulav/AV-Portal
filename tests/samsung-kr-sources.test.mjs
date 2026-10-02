import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const targets = ['hg43u800fnfxkr','hg50u800fnfxkr','hg65u800fnfxkr','lh115qhfebgxkr','lh32qmcebgcxkr','lh43qhcebgcxkr','lh43qmcebgcxkr','lh75qhcebgcxkr','lh85qmcebgcxkr','lh98qmcebgcxkr','lh55vhcrbgbxkr','lh55vmcrbgbxkr','lh55wmfwbgcxkr','lh75wmfwlgcxkr'];
const evidence = read('Work/기록/W-20261002-005-samsung-sources-evidence.json');
const documentAudit = read('Work/기록/W-20261002-008-evidence.json');

test('Samsung Korean business spec audit covers the 14 still-published models', () => {
  // Keep W-005's original 15-model evidence unchanged.
  assert.deepEqual(Object.keys(evidence.products).filter(slug => slug !== 'lh98qecedgcxkr'), targets);
  for (const slug of targets) {
    const p = read(`beta/site/detail/data/${slug}.json`);
    const e = evidence.products[slug];
    const source = p.sources.find(s => s.code === 'P');
    assert.equal(source.url, e.koreanUrl);
    assert.match(source.url, /^https:\/\/www\.samsung\.com\/sec\/business\//);
    assert.ok(e.koreanRows > 0);
    const fixed = {...p};
    delete fixed.specifications;
    delete fixed.io;
    delete fixed.sources;
    delete fixed.issues;
    delete fixed.verificationSummary;
    // W-007 adds overview-only fields after this source audit was recorded.
    delete fixed.lead;
    delete fixed.subtitle;
    delete fixed.keyFacts;
    assert.equal(sha(fixed), e.fixedSha256, `${slug}: unrelated product fields`);
    for (const decision of e.rows) {
      const row = {...p[decision.kind][decision.index]};
      // Compare W-005's historical quantity against its state before W-008 document evidence.
      if (decision.kind === 'io') {
        const later = documentAudit.products[slug]?.quantityChanges.find(change => change.index === decision.index);
        if (later) row.quantity = later.before;
      }
      assert.equal(row.source, decision.after.source, `${slug}: ${decision.kind}[${decision.index}] source`);
      assert.equal(row[decision.field], decision.after.value, `${slug}: ${decision.kind}[${decision.index}] value`);
      assert.equal(row.condition, decision.after.condition, `${slug}: ${decision.kind}[${decision.index}] condition`);
      if (decision.decision === 'KOREAN') assert.equal(row.source, 'P');
      if (decision.decision === 'OVERSEAS') assert.notEqual(row.source, 'P');
    }
    assert.match(p.verificationSummary, /2026-10-02.*상세 스펙 탭/);
    assert.doesNotMatch(p.verificationSummary, /확인하지 못했다/);
  }
});

test('regional TV power and RF input values follow the Korean model spec tab', () => {
  for (const [slug, power, max, typical] of [
    ['hg43u800fnfxkr','AC220-240V~ 50/60Hz','140','51.8'],
    ['hg50u800fnfxkr','AC220-240V~ 50/60Hz','155','57.4'],
    ['hg65u800fnfxkr','AC 220-240 V ~ 50/60Hz','240','73.8']
  ]) {
    const p = read(`beta/site/detail/data/${slug}.json`);
    const spec = name => p.specifications.find(r => r.name === name);
    assert.equal(spec('전원 사양').value, power);
    assert.equal(spec('소비전력(최대)').value, max);
    assert.equal(spec('소비전력(일반/Typical)').value, typical);
    const rf = p.io.find(r => r.connector === 'RF 입력');
    assert.equal(rf.quantity, '1/1/0');
    assert.equal(rf.source, 'P');
    assert.equal(evidence.products[slug].valueChanges.length, 4);
    assert.equal(spec('영상 처리 엔진').verification, 'CONFLICTED');
    assert.equal(spec('영상 처리 엔진(사양표)').verification, 'CONFLICTED');
  }
});

test('provenance notices leave condition fields and remain in named sources and audit', () => {
  const later = read('Work/기록/W-20261002-008-evidence.json');
  for (const slug of targets) {
    const p = read(`beta/site/detail/data/${slug}.json`);
    const e = evidence.products[slug];
    assert.ok(e.conditionChanges.length > 0, slug);
    for (const row of [...p.specifications,...p.io]) {
      assert.doesNotMatch(row.condition || '', /판매 모델.*공식 사양표 기준|지역 코드만 상이|운영사 확인/);
    }
    // W-008 adds exact-model local documents; this W-005 check covers only its overseas-source notices.
    for (const source of p.sources.filter(s => s.code !== 'P' && !(later.products[slug]?.addedSourceCodes ?? []).includes(s.code))) {
      assert.match(source.name + ' ' + source.scope, /해외|영국|캐나다|카리브|뉴질랜드|홍콩/);
      assert.match(source.scope, /한국 페이지 미기재/);
    }
  }
  const color = read('beta/site/detail/data/lh32qmcebgcxkr.json').specifications.find(row => row.name === '색재현율');
  assert.equal(color.source, 'P, S2', 'Korean 72% has no NTSC basis; overseas qualifier remains attributed');
});
