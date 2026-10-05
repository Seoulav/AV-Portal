// Preserve earlier whole-product hashes while keeping every field other than
// W-005's two RF-row fields and newly appended evidence source observable.
const slug = 'lh43behhlbfxkr';
const oldAvailability = '공식 스펙: 지상파/케이블/위성 1/1/0 · 물리 단자 수는 미확인';
const newAvailability = '공식 스펙: 지상파/케이블/위성 1/1/0 · 설치가이드 1쪽 단자 안내에 ANT 단자 표시 · 물리 단자 수는 미확인';
const expectedGuide = {
  code: 'IG',
  name: '삼성전자 BEHX-H 설치가이드 BN68-26620A-01 (사용자 제공)',
  scope: '1쪽 단자 안내 상자에 ANT 단자 표시. BEHX-H 43~85인치 공용 설치가이드(2쪽)이며 단자 종류·존재의 근거만 된다. 같은 상자의 HDMI 그림 수와 공식 스펙의 HDMI 수량이 달라 물리 단자 개수와 개별 위치는 확정하지 않는다. 공개 사본: manuals/samsung-behx-h-installation-guide-ko.pdf.',
};

export function beforeW005Product(current, productSlug) {
  if (productSlug !== slug) return current;
  const row = current.io?.[3];
  if (row?.availability !== newAvailability || row?.source !== 'P, IG' || row?.quantity !== '') {
    throw new Error('W-005 RF evidence changed outside the approved state');
  }
  if (current.sources.filter(source => source.code === 'IG').length !== 1 ||
      JSON.stringify(current.sources.find(source => source.code === 'IG')) !== JSON.stringify(expectedGuide)) {
    throw new Error('W-005 installation-guide source changed');
  }
  const previous = structuredClone(current);
  previous.io[3].availability = oldAvailability;
  previous.io[3].source = 'P';
  previous.sources = previous.sources.filter(source => source.code !== 'IG');
  return previous;
}

export function beforeW005Raw(raw, productSlug) {
  if (productSlug !== slug) return raw;
  beforeW005Product(JSON.parse(raw), productSlug);
  // Preserve the hand-formatted JSON bytes used by the historical file hash.
  const currentRow = `"availability": "${newAvailability}", "condition": "", "source": "P, IG"`;
  const previousRow = `"availability": "${oldAvailability}", "condition": "", "source": "P"`;
  const addedSource = `,\n    { "code": "IG", "name": ${JSON.stringify(expectedGuide.name)}, "scope": ${JSON.stringify(expectedGuide.scope)} }`;
  if (!raw.includes(currentRow) || !raw.includes(addedSource)) throw new Error('W-005 raw evidence formatting changed');
  return raw.replace(currentRow, previousRow).replace(addedSource, '');
}
