import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CPQ_TEMPLATES,isApprovedCpqTemplate} from '../scripts/cpq-public-assets.mjs';
test('only unchanged approved CPQ templates are exempt from private-workbook exclusion',()=>{
 for(const [path] of Object.entries(CPQ_TEMPLATES)) {
  const bytes=readFileSync(new URL('../'+path,import.meta.url));assert.ok(isApprovedCpqTemplate(path,bytes));
  const changed=Buffer.from(bytes);changed[0]^=1;assert.equal(isApprovedCpqTemplate(path,changed),false);
  assert.equal(isApprovedCpqTemplate('cpq/templates/sanitized/customer.xlsx',bytes),false);
 }
});
