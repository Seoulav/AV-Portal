import assert from 'node:assert/strict';

// Historical assertions still measure their original inventory. Only the
// eight new products and LH43's one approved VESA row are reversed here.
export const w006Slugs = new Set([
  'hg55u800fnfxkr', 'hg75u800fnfxkr', 'hg85u800fnfxkr',
  'lh50behhlbfxkr', 'lh55behhlbfxkr', 'lh65behhlbfxkr',
  'lh75behhlbfxkr', 'lh85behhlbfxkr',
]);
export const isW006Name = name => w006Slugs.has(name.replace(/\.json$/, ''));
export const withoutW006Uploads = uploads => uploads.filter(item => !w006Slugs.has(item.slug));
export const withoutW006Catalog = catalog => catalog.filter(item => !w006Slugs.has(item.slug));

const vesa = {group:'Physical',name:'벽걸이 규격(VESA)',value:'200 x 200',unit:'mm',condition:'나사 M8',source:'IG',verification:'VERIFIED'};
export function beforeW006Product(current, slug) {
  if (slug !== 'lh43behhlbfxkr') return current;
  const copy = structuredClone(current);
  const rows = copy.specifications.filter(row => row.name === vesa.name);
  assert.equal(rows.length, 1, 'W-006 VESA row count changed');
  assert.deepEqual(rows[0], vesa, 'W-006 VESA row changed');
  copy.specifications.splice(copy.specifications.indexOf(rows[0]), 1);
  return copy;
}
export function beforeW006Raw(raw, slug) {
  if (slug !== 'lh43behhlbfxkr') return raw;
  const line = raw.split(/\r?\n/).find(part => part.includes('"벽걸이 규격(VESA)"'));
  assert.ok(line, 'W-006 VESA row absent');
  assert.deepEqual(JSON.parse(line.trim().replace(/,$/, '')), vesa, 'W-006 VESA row changed');
  return raw.replace(`${line}\n`, '');
}
