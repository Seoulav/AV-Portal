// Reconstruct the upload list as it stood before W-20261004-016 so immutable
// earlier evidence can still be checked after the six public links are removed.
const removedAfterManual = new Map([
  ['lh43qhcebgcxkr', {
    slug: 'lh43qhcebgcxkr', file: 'manuals/winstar-qhc-standalone-spec-ko.pdf',
    kind: 'reference', title: '윈스타비투비 제품 규격서 5. 단독형 QHC',
  }],
  ['lh75qhcebgcxkr', {
    slug: 'lh75qhcebgcxkr', file: 'manuals/winstar-qhc-standalone-spec-ko.pdf',
    kind: 'reference', title: '윈스타비투비 제품 규격서 5. 단독형 QHC',
  }],
  ['lh43qmcebgcxkr', {
    slug: 'lh43qmcebgcxkr', file: 'manuals/winstar-qmc-standalone-spec-ko.pdf',
    kind: 'reference', title: '윈스타비투비 제품 규격서 4. 단독형 QMC',
  }],
  ['lh85qmcebgcxkr', {
    slug: 'lh85qmcebgcxkr', file: 'manuals/winstar-qmc-standalone-spec-ko.pdf',
    kind: 'reference', title: '윈스타비투비 제품 규격서 4. 단독형 QMC',
  }],
  ['lh55vhcrbgbxkr', {
    slug: 'lh55vhcrbgbxkr', file: 'manuals/winstar-videowall-spec-ko.pdf',
    kind: 'reference', title: '윈스타비투비 제품 규격서 6. 비디오월',
  }],
  ['lh55vmcrbgbxkr', {
    slug: 'lh55vmcrbgbxkr', file: 'manuals/winstar-videowall-spec-ko.pdf',
    kind: 'reference', title: '윈스타비투비 제품 규격서 6. 비디오월',
  }],
]);

export function beforeWinstarW04016Uploads(current) {
  const historical = [];
  const inserted = new Set();
  for (const entry of current) {
    historical.push(entry);
    if (removedAfterManual.has(entry.slug) && entry.kind === 'manual' &&
        /^manuals\/samsung-(?:qbc-qhc-qmc-shc|vhcr-vmcr-vhce-vmce)-manual-ko\.pdf$/.test(entry.file)) {
      if (inserted.has(entry.slug)) throw new Error(`Duplicate historical insertion: ${entry.slug}`);
      historical.push(removedAfterManual.get(entry.slug));
      inserted.add(entry.slug);
    }
  }
  if (inserted.size !== removedAfterManual.size) throw new Error('Incomplete historical Winstar upload reconstruction');
  return historical;
}
