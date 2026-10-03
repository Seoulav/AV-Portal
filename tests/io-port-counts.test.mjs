import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { connectorPresentation } from '../prototype/brc-am7/product-detail-model.mjs';
import { beforeSamsungSourceCleanup } from './samsung-w010-history.mjs';
import { beforeSamsungForeignPurge } from './samsung-w014-history.mjs';
import { beforeSamsungManualIo } from './samsung-w015-history.mjs';
import { beforeSamsungWhiteboard } from './samsung-w03006-history.mjs';

const app = readFileSync(new URL('../prototype/brc-am7/app.js', import.meta.url), 'utf8');
const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const targets = ['hg43u800fnfxkr','hg50u800fnfxkr','hg65u800fnfxkr','lh115qhfebgxkr','lh32qmcebgcxkr','lh43qhcebgcxkr','lh43qmcebgcxkr','lh75qhcebgcxkr','lh85qmcebgcxkr','lh98qmcebgcxkr','lh55vhcrbgbxkr','lh55vmcrbgbxkr','lh55wmfwbgcxkr','lh75wmfwlgcxkr'];

test('connector cards show direction alone when port count is unknown, while the full table retains it', () => {
  const badge = app.match(/port\.append\(element\('span', 'port-direction', (.+)\)\);/);
  assert.ok(badge, 'the card badge expression must exist');
  const render = new Function('item', `return (${badge[1]});`);
  for (const directionLabel of ['입력', '출력', '양방향']) {
    assert.equal(render({ directionLabel, portCount: '미확인' }), directionLabel);
  }
  assert.equal(render({ directionLabel: '입력', portCount: '3' }), '입력 · 포트 3');
  assert.match(app, /element\('td', '', item\.portCount\)/);
  assert.equal(connectorPresentation({ connector: 'RS-232C 입력', quantity: '' }).portCount, '미확인');
});

test('Samsung quantity audit covers 82 active unknown rows and preserves the 87-row historical record', () => {
  const evidence = read('Work/기록/W-20261002-006-io-port-counts-evidence.json');
  const laterAudit = read('Work/기록/W-20261002-007-samsung-key-facts-evidence.json');
  const currentAudit = read('Work/기록/W-20261002-008-evidence.json');
  assert.equal(Object.values(evidence.products).reduce((sum, product) => sum + product.rows.length, 0), 87);
  // The W-006 evidence keeps the historical 15th model; audit the 14 still published.
  assert.deepEqual(Object.keys(evidence.products).filter(slug => slug !== 'lh98qecedgcxkr'), targets);
  let unknown = 0;
  let filled = 0;
  for (const slug of targets) {
    const p = beforeSamsungManualIo(beforeSamsungWhiteboard(read(`beta/site/detail/data/${slug}.json`), slug), slug);
    const e = evidence.products[slug];
    assert.equal(e.url, p.sources.find(source => source.code === 'P').url);
    assert.match(e.url, /^https:\/\/www\.samsung\.com\/sec\/business\//);
    // W-007 adds overview fields and flags 12 connector-existence conflicts.
    // Reconstruct the W-006 snapshot so its original quantity audit remains locked.
    const snapshot = beforeSamsungSourceCleanup(beforeSamsungForeignPurge(p, slug), slug);
    delete snapshot.lead;
    delete snapshot.subtitle;
    delete snapshot.keyFacts;
    for (const change of currentAudit.products[slug]?.quantityChanges ?? []) snapshot.io[change.index].quantity = change.before;
    snapshot.sources = snapshot.sources.filter(source => !(currentAudit.products[slug]?.addedSourceCodes ?? []).includes(source.code));
    for (const conflict of laterAudit.products[slug].conflicts) snapshot.io[conflict.index].verification = conflict.beforeVerification;
    assert.equal(sha(snapshot), e.baselineSha256, `${slug}: W-006 product snapshot`);
    const withoutQuantity = {...snapshot, io: snapshot.io.map(({quantity, ...row}) => row)};
    assert.equal(sha(withoutQuantity), e.coreSha256, `${slug}: fields outside io quantity`);
    const blankRows = snapshot.io.flatMap((row, index) => row.quantity ? [] : [index]);
    assert.deepEqual(e.rows.map(row => row.index), blankRows);
    for (const row of e.rows) {
      assert.equal(snapshot.io[row.index].connector, row.connector);
      assert.equal(snapshot.io[row.index].quantity, row.after);
      assert.equal(row.before, '');
      assert.ok(['NOT_STATED','PRESENT_NO_COUNT','NOT_PHYSICAL','SAYS_NONE','OTHER_CONNECTOR_ONLY'].includes(row.decision));
      if (row.decision === 'SAYS_NONE') assert.equal(row.officialValue, '없음');
      if (row.decision === 'NOT_STATED') assert.equal(row.officialValue, null);
      unknown++;
      if (row.after) filled++;
    }
  }
  assert.equal(unknown, 82);
  assert.equal(filled, 0);
});
