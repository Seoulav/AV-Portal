// Selectively undo only W-013 session A phase-2 QM32C evidence updates when
// running older whole-product hashes. Other live fields remain under test.
const slug = 'lh32qmcebgcxkr';
const indices = [3, 5, 6, 7, 8];
const manual = {
  code: 'M1',
  name: '삼성전자 한글 사용설명서 BN81-24537G-14 (사용자 제공)',
  scope: 'QM32C 적용 모델 전용 단자 도면·설명 24쪽. 공개 사용설명서 BN81-24537G-14 · SHA-256 b82e05f4cf163ca62ff19fa9a1f9b9bb465560eb5776280d903358508afe56e3.',
};

export function beforeW013A2Product(current, id) {
  if (id !== slug) return current;
  const result = structuredClone(current);
  const sourceIndex = result.sources.findIndex(source => source.code === 'M1');
  if (sourceIndex !== 2 || JSON.stringify(result.sources[sourceIndex]) !== JSON.stringify(manual)) {
    throw new Error(`${slug}: unexpected W-013-A2 manual source change`);
  }
  result.sources.splice(sourceIndex, 1);
  for (const index of indices) {
    const row = result.io[index];
    if (row?.quantity !== '1' || row.source !== 'P, M1' || row.verification !== 'VERIFIED') {
      throw new Error(`${slug}: unexpected W-013-A2 io[${index}] change`);
    }
    row.quantity = '';
    row.source = 'P';
    row.verification = 'FOUND';
  }
  return result;
}

export function beforeW013A2Raw(raw, id) {
  return id === slug ? JSON.stringify(beforeW013A2Product(JSON.parse(raw), id), null, 2) + '\n' : raw;
}
