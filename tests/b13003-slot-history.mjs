// B-20261013-03 승인 변경 되감기. 상세 JSON 16종에 최상위 slots(프레임) 또는 slotType·compatibleFrames(카드)만 추가했다.
// 과거 검사는 현재 제품을 받아 이 키만 지운다. 값이 승인한 값과 다르면 오류로 알린다. 다른 필드는 그대로 지나간다.
const H = ['novastar-h2', 'novastar-h5'];
const approved = {
  'novastar-h2': { slots: { input: 4, output: 2, source: 'D', verification: 'FOUND', note: "일부 입력 슬롯은 프리뷰 카드 겸용(데이터시트: 'can accept an input card or preview card'). 겸용 슬롯 번호는 데이터시트에 없음" } },
  'novastar-h5': { slots: { input: 10, output: 3, source: 'D', verification: 'FOUND', note: 'MVR 슬롯(프리뷰 카드 전용)은 데이터시트 텍스트에 수량이 없어 넣지 않음' } },
  'blu-160': { slots: { shared: 4, source: 'P', verification: 'FOUND', note: '4슬롯 공용(카드 종류별 4장 장착 시 최대 16채널). Digital In/Out·Telephone Hybrid 카드는 Portal 제품 미등록' } },
  'h-preview-card-2xrj45-1xhdmi13': { slotType: 'input', compatibleFrames: ['novastar-h2'] },
  'blucard-in': { slotType: 'input', compatibleFrames: ['blu-160'] },
  'blucard-out': { slotType: 'output', compatibleFrames: ['blu-160'] },
  'blu-aec-in': { slotType: 'input', compatibleFrames: ['blu-160'] },
};
for (const slug of ['h-input-card-12g-sdi', 'h-input-card-2xhdmi20-2xdp12', 'h-input-card-4x3g-sdi', 'h-input-card-4xhdmi', 'h-input-card-dp12-4k', 'h-input-card-hdmi20-4k', 'h-input-card-hdmi20-dp12-4k']) approved[slug] = { slotType: 'input', compatibleFrames: H };
for (const slug of ['h-output-card-4xhdmi-dl', 'h-output-card-hdmi20-4k']) approved[slug] = { slotType: 'output', compatibleFrames: H };

export const b13003Approved = approved;
export const b13003Slugs = new Set(Object.keys(approved));

export function beforeB13003Product(current, slug) {
  const fields = approved[slug];
  if (!fields || !Object.keys(fields).some(key => key in current)) return current;
  const result = structuredClone(current);
  for (const [key, value] of Object.entries(fields)) {
    if (JSON.stringify(current[key]) !== JSON.stringify(value)) throw new Error(`${slug}: unexpected B-20261013-03 ${key} change`);
    delete result[key];
  }
  return result;
}

// 대상 상세는 모두 JSON.stringify(_, null, 2) 형식이라 키를 지운 뒤 다시 쓰면 이전 바이트가 된다
export function beforeB13003Raw(raw, slug) {
  if (!b13003Slugs.has(slug)) return raw;
  const current = JSON.parse(raw);
  const result = beforeB13003Product(current, slug);
  return result === current ? raw : JSON.stringify(result, null, 2) + '\n';
}
