import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPrivateRecord } from '../scripts/build-private-provenance.mjs';

test('keeps old source identities and new file positions separate from private notes and suppliers', () => {
  const proposal = {
    input_hashes_before: { previous_excel: 'old-hash', new_excel: 'new-hash', catalog: 'catalog-hash', resource_register: 'register-hash' },
    notes: [{ sheet: '영상', old_row: 2, new_row: 3, old_note: 'historic note', new_note: null }],
    private_supplier_records: [{ sheet: '영상', old_row: 2, new_row: 3, new_supplier: 'private supplier' }],
    source_version_mapping: [{ sheet: '영상', old_row: 2, new_row: 3, record_id: 'ROW-2', product_id: 'AVP-1' }],
    options: Array.from({ length: 19 }, (_, i) => ({ decision: i < 8 ? '편입 후보' : '보류' }))
  };
  const catalog = { products: [{ id: 'AVP-1', source_records: [{ record_id: 'ROW-2', sheet: '영상', row: 2 }] }] };
  const record = buildPrivateRecord(proposal, catalog, { previous_excel: 'old-hash', new_excel: 'new-hash', catalog: 'catalog-hash', resource_register: 'register-hash' }, { sourceRows: 1, notes: 1, suppliers: 1 });
  assert.deepEqual(record.source_versions[0], {
    product_id: 'AVP-1', record_id: 'ROW-2',
    previous: { file_sha256: 'old-hash', sheet: '영상', row: 2 },
    current: { file_sha256: 'new-hash', sheet: '영상', row: 3 }
  });
  assert.equal(record.historic_notes[0].text, 'historic note');
  assert.equal(record.historic_notes[0].current_validity, 'unverified');
  assert.equal(record.internal_suppliers[0].supplier, 'private supplier');
  assert.deepEqual(record.option_review, { inclusion_candidates: 8, held: 11, products_added: 0 });
  assert.throws(() => buildPrivateRecord(proposal, catalog, { previous_excel: 'wrong' }, { sourceRows: 1, notes: 1, suppliers: 1 }), /해시/);
  const invalid = structuredClone(proposal);
  invalid.source_version_mapping[0].new_row = 0;
  assert.throws(() => buildPrivateRecord(invalid, catalog, proposal.input_hashes_before, { sourceRows: 1, notes: 1, suppliers: 1 }), /대응/);
  const duplicate = structuredClone(proposal);
  duplicate.source_version_mapping.push({ sheet: '영상', old_row: 4, new_row: 3, record_id: 'ROW-4', product_id: 'AVP-2' });
  const twoProducts = { products: [...catalog.products, { id: 'AVP-2', source_records: [{ record_id: 'ROW-4', sheet: '영상', row: 4 }] }] };
  assert.throws(() => buildPrivateRecord(duplicate, twoProducts, proposal.input_hashes_before, { sourceRows: 2, notes: 1, suppliers: 1 }), /대응/);
});
