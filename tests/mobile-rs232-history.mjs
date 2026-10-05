// Undo only W-20261004-027's user-confirmed Port Map wording before older
// immutable product snapshots are compared. Current behavior is checked by
// mobile-header-rs232.test.mjs; older evidence keeps its original meaning.
const slugs = new Set([
  'lh115qhfebgxkr', 'lh32qmcebgcxkr', 'lh43qmcebgcxkr',
  'lh85qmcebgcxkr', 'lh98qmcebgcxkr', 'lh43qhcebgcxkr',
  'lh75qhcebgcxkr'
]);
const oldDescription = 'RS232C 어댑터를 이용하여 MDC를 연결할 때 사용합니다.';

export function beforeMobileRs232(product, slug) {
  if (!slugs.has(slug) || !product.sources?.some(source => source.code === 'U2')) return product;
  const earlier = structuredClone(product);
  const output = earlier.portMap?.items.filter(item => item.label === 'RS-232C 출력') ?? [];
  if (output.length !== 1) throw Error(`${slug}: expected one RS-232C output marker`);
  output[0].desc = oldDescription;
  earlier.sources = earlier.sources.filter(source => source.code !== 'U2');
  return earlier;
}

export function beforeMobileRs232Raw(raw, slug) {
  if (!slugs.has(slug) || !raw.includes('"code": "U2"')) return raw;
  return `${JSON.stringify(beforeMobileRs232(JSON.parse(raw), slug), null, 2)}\n`;
}
