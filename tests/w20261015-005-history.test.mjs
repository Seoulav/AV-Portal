import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW20261015_005Product, beforeW20261015_005Raw } from './w20261015-005-history.mjs';

const raw = readFileSync(new URL('../beta/site/detail/data/dci-4-600da.json', import.meta.url), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');

test('Crown coordinate inverse restores the prior exact product while preserving unrelated fields', () => {
  assert.equal(sha(beforeW20261015_005Raw(raw, 'dci-4-600da')),
    '52a40972ef45243518235f194d708cc92a08cfc453b4db60d8ca265f1992eae9');
  const changed = JSON.parse(raw);
  changed.overview += ' independent later wording';
  assert.match(beforeW20261015_005Product(changed, 'dci-4-600da').overview, /independent later wording/);
  changed.portMap.items[0].x2--;
  assert.throws(() => beforeW20261015_005Product(changed, 'dci-4-600da'), /approved connector ranges changed|unexpected W-015 Crown geometry change/);
  const other = { model: 'OTHER' };
  assert.equal(beforeW20261015_005Product(other, 'other'), other);
});
