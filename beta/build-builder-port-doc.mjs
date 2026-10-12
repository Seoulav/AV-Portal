// Builder 장비별 입출력 단자 문서 생성(사람이 읽는 용도).
//   node beta/build-builder-port-doc.mjs [--out <경로>]
// builder-library.json과 같은 계산 결과를 Markdown 표로 옮긴다. 기본 출력: Work/빌더/장비별-입출력-단자.md
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBuilderLibrary } from './builder-library.mjs';
import { readLibraryInputs } from './build-builder-library.mjs';

const DEFAULT_OUT = new URL('../Work/빌더/장비별-입출력-단자.md', import.meta.url);

const DIRECTIONS = [['inputs', '입력'], ['outputs', '출력'], ['bidirectional', '양방향']];
const NON_PORT_LABEL = { slot: '확장 슬롯', service: '서비스 단자', wireless: '무선', unsupported: '미지원' };
const REASON_LABEL = {
  'multi-connector': '커넥터가 여러 종류',
  'multi-signal': '신호가 여러 종류',
  'no-signal': '신호 판별 불가',
  direction: '방향 불명',
  quantity: '개수 불명',
  txrx: 'TX/RX 분리 근거 부족',
  'series-io': '시리즈 I/O',
};

const cell = value => String(value ?? '').replace(/\s+/g, ' ').replaceAll('|', '\\|').trim() || '—';
const baseLabel = label => String(label).replace(/\s+\d+$/, '');
const rowText = row => [row?.connector, row?.signal].map(v => String(v ?? '').trim()).filter(Boolean).join(' / ');

// 같은 이름·커넥터·신호·검증 상태가 이어지면 한 줄로 묶는다
function groupPorts(ports, signalLabel) {
  const groups = [];
  for (const port of ports) {
    const key = [baseLabel(port.label), port.connector, port.signals.join(','), port.verification, rowText(port.portalIo)].join('|');
    const last = groups.at(-1);
    if (last && last.key === key) last.count += 1;
    else groups.push({ key, port, count: 1 });
  }
  return groups.map(({ port, count }) => ({
    name: count > 1 ? baseLabel(port.label) : port.label,
    connector: port.connector,
    signals: port.signals.map(signalLabel).join(', '),
    count,
    verification: port.verification,
    original: rowText(port.portalIo),
  }));
}

const countPorts = unit => Object.fromEntries(DIRECTIONS.map(([key]) => [key, unit.equipment[key].length]));

export function renderPortDoc(library, ioByProduct) {
  const signalLabels = new Map(library.vocabulary.signals.map(signal => [signal.id, signal.label]));
  const signalLabel = id => signalLabels.get(id) ?? id;
  const products = [...library.products].sort((a, b) => a.brand.localeCompare(b.brand, 'en') || a.product.localeCompare(b.product, 'en'));
  const brands = [...new Set(products.map(p => p.brand))];
  const totals = products.reduce((sum, p) => {
    for (const unit of p.units) for (const [key] of DIRECTIONS) sum[key] += unit.equipment[key].length;
    sum.review += p.unresolved.length;
    return sum;
  }, { inputs: 0, outputs: 0, bidirectional: 0, review: 0 });

  const out = [];
  out.push('# Builder 장비별 입출력 단자', '');
  out.push('> 자동 생성 문서다. 직접 고치지 말고 `node beta/build-builder-port-doc.mjs`로 다시 만든다.');
  out.push('> 원본: Portal 상세 데이터(`beta/site/detail/data/`)·RTCOM 동기화본(`beta/site/rtcom/raw/`) → 단자 변환 규칙(`beta/port-vocabulary.mjs`).');
  out.push(`> 기준: catalog SHA \`${library.source.catalogSha.slice(0, 12)}\` · 어휘 ${library.source.vocabularyVersion}`, '');
  out.push(`제품 **${products.length}종** · 제조사 ${brands.length}곳 · 단자 입력 ${totals.inputs} · 출력 ${totals.outputs} · 양방향 ${totals.bidirectional} · 확인 필요 행 ${totals.review}`, '');
  out.push('## 읽는 법', '');
  out.push('- **개수**: 같은 단자가 여러 개면 한 줄로 묶었다. Builder 화면에는 `HDMI In 1`, `HDMI In 2`처럼 하나씩 나온다.');
  out.push('- **커넥터 / 신호**: Builder가 결선 판정에 쓰는 정규화 값이다. **원문**은 Portal 상세의 커넥터 / 신호 칸 그대로다.');
  out.push('- **검증**: Portal I/O 행의 검증 상태(`VERIFIED`·`FOUND`·`REVIEW REQUIRED` 등).');
  out.push('- **확인 필요**: 원문만으로 단자를 만들 수 없어 Builder에 나오지 않는 행이다. 사유를 함께 적었다.');
  out.push('- **단자 아님**: 확장 슬롯·서비스 단자·무선·미지원 행. 결선 대상이 아니다.');
  out.push('- **배치 불가**: Builder 캔버스에 놓지 않는 제품(케이블·라이선스처럼 장비 노드가 아닌 것, 단자가 없는 것).', '');

  out.push('## 신호 종류', '');
  out.push('| 신호 | 선 종류 | 양방향 대칭 |', '|---|---|---|');
  const lineNames = new Map(library.lineTypes.map(t => [t.id, t.name]));
  for (const s of library.vocabulary.signals) out.push(`| ${s.label} | ${lineNames.get(s.lineType) ?? s.lineType} | ${s.symmetric ? '예' : ''} |`);
  out.push('');

  out.push('## 제품 목록', '');
  out.push('| 제조사 | 제품 | 분류 | 입력 | 출력 | 양방향 | 확인 필요 | 비고 |', '|---|---|---|---:|---:|---:|---:|---|');
  for (const p of products) {
    const c = p.units.map(countPorts).reduce((a, b) => ({ inputs: a.inputs + b.inputs, outputs: a.outputs + b.outputs, bidirectional: a.bidirectional + b.bidirectional }));
    const notes = [p.placeable ? '' : '배치 불가', p.units.length > 1 ? `${p.units.length}개 장치` : ''].filter(Boolean).join(', ');
    out.push(`| ${cell(p.brand)} | [${cell(p.product)}](#${p.productId}) | ${cell(p.categories.at(-1))} | ${c.inputs} | ${c.outputs} | ${c.bidirectional} | ${p.unresolved.length || ''} | ${notes} |`);
  }
  out.push('');

  for (const brand of brands) {
    out.push(`## ${brand}`, '');
    for (const p of products.filter(item => item.brand === brand)) {
      out.push(`<a id="${p.productId}"></a>`, '');
      out.push(`### ${p.product}`, '');
      out.push(`\`${p.productId}\` · ${cell(p.categories.join(' › '))} · [Portal 상세](${p.detailUrl})${p.placeable ? '' : ' · **배치 불가**'}`, '');
      for (const unit of p.units) {
        if (p.units.length > 1) out.push(`#### ${unit.equipment.model || unit.unitId}`, '');
        const rows = DIRECTIONS.flatMap(([key, label]) => groupPorts(unit.equipment[key], signalLabel).map(g => ({ label, ...g })));
        if (!rows.length) { out.push('단자 없음', ''); continue; }
        out.push('| 방향 | 단자 | 개수 | 커넥터 | 신호 | 검증 | 원문 |', '|---|---|---:|---|---|---|---|');
        for (const r of rows) out.push(`| ${r.label} | ${cell(r.name)} | ${r.count} | ${cell(r.connector)} | ${cell(r.signals)} | ${cell(r.verification)} | ${cell(r.original)} |`);
        out.push('');
      }
      const io = ioByProduct.get(p.productId) ?? [];
      if (p.unresolved.length) {
        out.push('**확인 필요**', '');
        for (const u of p.unresolved) out.push(`- ${cell(u.group)}: ${cell(rowText(u))} — ${u.reasons.map(r => REASON_LABEL[r] ?? r).join(', ')}`);
        out.push('');
      }
      if (p.nonPort.length) {
        out.push('**단자 아님**', '');
        for (const n of p.nonPort) {
          const row = io[n.ioIndex];
          out.push(`- ${NON_PORT_LABEL[n.kind] ?? n.kind}${row ? `: ${cell(row.group)} — ${cell(rowText(row))}` : ''}`);
        }
        out.push('');
      }
    }
  }
  return `${out.join('\n').trimEnd()}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  if (outIndex >= 0 && !args[outIndex + 1]) throw new Error('--out 다음에 파일 경로가 필요하다');
  const out = outIndex >= 0 ? resolve(args[outIndex + 1]) : fileURLToPath(DEFAULT_OUT);
  const inputs = await readLibraryInputs();
  const ioByProduct = new Map();
  for (const [slug, raw] of inputs.details) ioByProduct.set(slug, JSON.parse(raw).io ?? []);
  for (const [id, raw] of inputs.rtcomProducts) ioByProduct.set(`rtcom-${id}`, JSON.parse(raw).io ?? []);
  await writeFile(out, renderPortDoc(buildBuilderLibrary(inputs), ioByProduct));
  console.log(`단자 문서 생성: ${out}`);
}
