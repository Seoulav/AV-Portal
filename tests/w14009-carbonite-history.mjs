import { createHash } from 'node:crypto';

// Historical whole-product assertions may undo only W-009's 16 descriptions.
// Read the current product first: every other field must remain visible.
const prior = [
  '전원 공급 입력 PS1', '전원 공급 입력 PS2', 'RJ45 · RS-422 편집기 제어 연결',
  'RJ45 · Ethernet 네트워크 연결', 'DB25 · 24 fixed tally 연결',
  'DB25 · 24 GPI/O 연결', 'Analog LTC 입력', 'AES audio 출력 포트 1',
  'AES audio 출력 포트 2', 'Reference 입력', 'Reference 출력',
  '빨간색 MV OUTPUT 구획 · 사진 인쇄 IO-1, IO-2, 1, 2',
  '초록색 출력 구획 · 사진 인쇄 3–12',
  '파란색 SDI 입력 구획 · 사진 인쇄 1–24',
  'UPGD 표기 단자 식별', 'SD 표기 단자 식별'
];
const approvedSha256 = '5fa3ebc053db677d1722ef7c91b0a59986682e74f81fb1d80050541705895d51';
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW14009CarboniteProduct(current, slug) {
  if (slug !== 'carbonite-ultra') return current;
  const desc = current.portMap?.items?.map(item => item.desc);
  if (desc?.length !== prior.length || sha(desc) !== approvedSha256) {
    throw new Error('carbonite-ultra: unexpected W-009 Port Map description change');
  }
  const previous = structuredClone(current);
  previous.portMap.items.forEach((item, index) => { item.desc = prior[index]; });
  return previous;
}

export function beforeW14009CarboniteRaw(raw, slug) {
  if (slug !== 'carbonite-ultra') return raw;
  return `${JSON.stringify(beforeW14009CarboniteProduct(JSON.parse(raw), slug), null, 2)}\n`;
}
