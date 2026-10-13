// Rewind only session C's model-specific USB count and citation for older hashes.
const slug = 'varia-80';
const quickGuide = {
  code: 'Q1',
  name: 'AMX VARIA-80 Quick Start Guide',
  url: 'https://www.amx.com/en-US/site_elements/quick-start-guide-varia-80',
  scope: 'VARIA-80(AMX-UTP0811) 전용 가이드 1쪽 Fig. 1 후면 그림의 USB 단자 1개. USB Type-C OTG 형상은 D1 사양서 2쪽과 대조.',
};

export function beforeW013C3Product(current, id) {
  if (id !== slug) return current;
  const result = structuredClone(current);
  const row = result.io[1];
  if (row?.connector !== 'USB Type-C' || row.signal !== 'USB OTG' ||
      row.quantity !== '1' || row.condition !== 'VARIA-80 전용 Quick Start Guide 1쪽 후면 그림의 USB 1개' ||
      row.source !== 'D1, Q1') {
    throw new Error(`${slug}: unexpected W-013-C3 USB row change`);
  }
  if (JSON.stringify(result.sources.at(-1)) !== JSON.stringify(quickGuide)) {
    throw new Error(`${slug}: unexpected W-013-C3 source change`);
  }
  row.quantity = '';
  row.condition = '';
  row.source = 'D1';
  result.sources.pop();
  return result;
}

export function beforeW013C3Raw(raw, id) {
  return id === slug ? JSON.stringify(beforeW013C3Product(JSON.parse(raw), id), null, 2) + '\n' : raw;
}
