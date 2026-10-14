// Builder "Portal 반영 요청" 파일을 Portal 상세 JSON의 io 행에 적용한다(B-20261013-02).
//   node beta/apply-builder-io-request.mjs <요청 파일> [--dry-run] [--overlap-checked]
//
// 순서
//   1. 형식 검사. RTCOM 제품(source "rtcom")은 적용하지 않는다(RTCOM 원본은 Portal에서 고치지 않는다 — AGENTS.md)
//   2. 요청을 만든 라이브러리의 catalogSha·detailSetSha가 지금과 다르면 경고하고, 행마다 before가 지금 행과 같은지 본다. 다르면 그 변경만 건너뛴다
//   3. 겹치는 작업 확인: Work/지시서.md·Work/지시서-B.md·Work/지시서-C.md의 진행 중 작업, 열린 PR(gh). 겹치면 중단
//      gh를 쓸 수 없으면 확인 목록을 출력하고 중단한다. 사람이 확인했으면 --overlap-checked로 다시 실행한다
//   4. 적용: 고친 행·새 행은 verification "REVIEW REQUIRED", source "". reason은 상세 JSON에 쓰지 않는다(PR 본문에 쓴다). remove는 행을 지운다
//   5. 검색 인덱스·공개 스냅샷 재생성, 라이브러리 생성 확인, 검색 인덱스 --check
//   6. 바뀐 행 요약과 PR 본문 초안 출력
// --dry-run: 1~3과 적용 계획만 보여 주고 파일을 바꾸지 않는다(겹침이 있어도 계획은 보여 준다)
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classifyIoRow } from './port-classify.mjs';
import { IO_OVERRIDES } from './port-vocabulary.mjs';
import { ROW_FIELDS, overrideApplies, validateIoRequest } from '../builder/engine/io-request.mjs';

const root = new URL('../', import.meta.url);
const site = new URL('./site/', import.meta.url);
export const REVIEW_REQUIRED = 'REVIEW REQUIRED';
const text = value => String(value ?? '').trim();
const rowSnapshot = row => Object.fromEntries(ROW_FIELDS.map(field => [field, text(row?.[field])]));

// 건너뛴 이유(사람이 읽는 문구)
export const SKIP_REASONS = Object.freeze({
  'index-missing': '행 번호가 지금 상세에 없다',
  'before-mismatch': '요청을 만든 뒤 Portal 행이 바뀌었다(before 불일치)',
  override: '개별 지정(IO_OVERRIDES) 행이다. 생성기 표를 함께 고쳐야 하므로 Builder 작업으로 따로 처리한다',
  'override-shift': '이 행을 지우면 뒤 행의 개별 지정(IO_OVERRIDES) 번호가 밀린다',
  'not-port': '고친 원문이 단자 행으로 판정되지 않는다',
  'source-skipped': '갈라져 나온 원래 행의 변경을 건너뛰어 이 새 행도 넣지 않는다',
  'already-applied': '이미 반영된 값이다(같은 요청을 다시 적용)',
});

// 요청 → 적용 계획. detail: 상세 JSON 객체.
// 결과: { io(새 io 배열), applied: [{ change, index }], skipped: [{ change, index, code }], alreadyApplied(같은 요청을 다시 적용한 흔적) }
// 변경은 원래 행 번호로 판단한다: update를 먼저 제자리에 쓰고, remove는 큰 번호부터 지우고, add는 끝에 붙인다
export function planIoRequest(request, detail, { overrides = IO_OVERRIDES } = {}) {
  const io = Array.isArray(detail.io) ? detail.io.map(row => ({ ...row })) : [];
  const original = io.map(row => ({ ...row }));
  const overrideIndexes = Object.keys(overrides).filter(key => key.startsWith(`${request.productId}#`)).map(key => Number(key.slice(request.productId.length + 1))).filter(Number.isInteger);
  const applied = [];
  const skipped = [];
  const removals = [];
  const additions = [];
  const skippedRows = new Set();
  let alreadyApplied = false;
  // update·remove를 먼저 판단한다(갈라진 add가 원래 행의 결과를 따라야 해서)
  const order = request.changes.map((change, index) => ({ change, index })).sort((a, b) => (a.change.op === 'add') - (b.change.op === 'add'));
  for (const { change, index } of order) {
    const skip = code => {
      skipped.push({ change, index, code });
      if (change.op !== 'add') skippedRows.add(change.ioIndex);
    };
    const done = () => applied.push({ change, index });
    if (change.op !== 'add') {
      const current = original[change.ioIndex];
      if (!current) { skip('index-missing'); continue; }
      if (!isDeepStrictEqual(rowSnapshot(current), rowSnapshot(change.before))) {
        // 지금 행이 after와 같으면 같은 요청을 이미 적용한 것이다
        if (change.op === 'update' && isDeepStrictEqual(rowSnapshot(current), rowSnapshot(change.after)) && text(current.verification) === REVIEW_REQUIRED) { alreadyApplied = true; skip('already-applied'); } else skip('before-mismatch');
        continue;
      }
      if (overrideIndexes.includes(change.ioIndex) && overrideApplies(overrides, `${request.productId}#${change.ioIndex}`, current)) { skip('override'); continue; }
      if (change.op === 'remove') {
        if (overrideIndexes.some(other => other > change.ioIndex)) { skip('override-shift'); continue; }
        removals.push(change.ioIndex);
        done();
        continue;
      }
      const next = { ...current, ...change.after, source: '', verification: REVIEW_REQUIRED };
      if (classifyIoRow(next).kind !== 'port') { skip('not-port'); continue; }
      io[change.ioIndex] = next;
      done();
      continue;
    }
    if (change.fromIoIndex !== undefined && skippedRows.has(change.fromIoIndex)) { skip('source-skipped'); continue; }
    const row = { ...change.row, protocol: '', availability: '', condition: '', source: '', verification: REVIEW_REQUIRED };
    // 같은 새 행이 이미 있으면(REVIEW REQUIRED·출처 없음) 같은 요청을 다시 적용한 것이다
    if (original.some(item => isDeepStrictEqual(rowSnapshot(item), rowSnapshot(row)) && text(item.verification) === REVIEW_REQUIRED && !text(item.source))) { alreadyApplied = true; skip('already-applied'); continue; }
    if (classifyIoRow(row).kind !== 'port') { skip('not-port'); continue; }
    additions.push(row);
    done();
  }
  for (const ioIndex of removals.sort((a, b) => b - a)) io.splice(ioIndex, 1);
  io.push(...additions);
  const byIndex = (a, b) => a.index - b.index;
  return { io, applied: applied.sort(byIndex), skipped: skipped.sort(byIndex), alreadyApplied };
}

// ── 겹치는 작업 ──
// 작업 블록: 지시서.md는 W- ID로 시작하는 단락(모든 절), 지시서-B.md·지시서-C.md는 "## W-" 절.
// 진행 표시(IN_PROGRESS·REVIEW·BLOCKED 등)가 있으면 MERGED가 함께 있어도 진행 중으로 본다(예: "IN_PROGRESS · 1차 MERGED").
// 끝난 표시(MERGED·DEPLOYED·완료·종료)만 있으면 끝난 작업이다. 상태를 알아볼 수 없으면 진행 중으로 본다(놓치지 않게)
const ACTIVE = /IN_PROGRESS|REVIEW|BLOCKED|진행|검토|보류|준비|대기/;
const DONE = /MERGED|DEPLOYED|완료|종료/;
const TASK_ID = /^W-\d{8}-\d{3}/;
const isActive = status => ACTIVE.test(status) || !DONE.test(status);
export function activeTasks(file, markdown) {
  const lines = String(markdown).replaceAll('\r\n', '\n').split('\n');
  const blocks = [];
  if (/지시서-[BC]/.test(file)) {
    let current = null;
    for (const line of lines) {
      if (/^## /.test(line)) { current = { title: line.slice(3).trim(), lines: [] }; blocks.push(current); continue; }
      current?.lines.push(line);
    }
    return blocks.filter(block => TASK_ID.test(block.title)).map(block => {
      const status = block.lines.find(line => /^- 상태:/.test(line)) ?? '';
      return { file, task: TASK_ID.exec(block.title)[0], title: block.title, status: status.replace(/^- 상태:\s*/, ''), text: `${block.title}\n${block.lines.join('\n')}` };
    }).filter(block => isActive(block.status));
  }
  let current = null;
  for (const line of lines) {
    if (/^#/.test(line)) { current = null; continue; }
    if (TASK_ID.test(line)) { current = { task: TASK_ID.exec(line)[0], title: line, lines: [line] }; blocks.push(current); continue; }
    current?.lines.push(line);
  }
  return blocks.map(block => {
    // 상태: 첫 줄의 굵은 글씨(**IN_PROGRESS** 등). 없으면 첫 줄 앞부분(예: "종료 보완:")
    const status = /\*\*([^*]+)\*\*/.exec(block.title)?.[1] ?? block.title.slice(block.task.length, block.task.length + 40);
    return { file, task: block.task, title: block.title.slice(0, 120), status: status.trim(), text: block.lines.join('\n') };
  }).filter(block => isActive(block.status));
}

// 진행 중 작업이 이 제품을 언급하는지(slug·상세 경로·모델명·제조사). 대소문자 무시.
// 제조사 단위로 맡은 작업("Powersoft 앰프 18종")도 잡도록 제조사 이름을 넣는다. 지나치게 잡히면 사람이 확인하고 --overlap-checked로 넘긴다
export function instructionOverlaps(tasks, { slug, model, brand }) {
  const needles = [slug, `detail/data/${slug}.json`, model, brand].map(text).filter(value => value.length >= 3).map(value => value.toLowerCase());
  return tasks.filter(task => needles.some(needle => task.text.toLowerCase().includes(needle)));
}

// 열린 PR 중 같은 상세 파일을 고치는 것. prs: gh pr list --json number,title,url,files 결과.
// gh는 PR마다 파일을 100개까지만 돌려준다. 100개 이상이면 다 보지 못했으므로 uncertain으로 둔다
export const PR_FILE_LIMIT = 100;
export function pullRequestOverlaps(prs, slug) {
  const path = `beta/site/detail/data/${slug}.json`;
  const hits = prs.filter(pr => (pr.files ?? []).some(file => file.path === path));
  const uncertain = prs.filter(pr => !hits.includes(pr) && (pr.files ?? []).length >= PR_FILE_LIMIT);
  return { hits, uncertain };
}

// gh로 열린 PR 목록. 쓸 수 없으면 null. 저장소를 지정해 복제본(원격이 로컬 경로)에서도 쓴다
export const REPOSITORY = 'Seoulav/AV-Portal';
export function listOpenPullRequests() {
  if (process.env.AV_PORTAL_NO_GH === '1') return null;
  try {
    const out = execFileSync('gh', ['pr', 'list', '--repo', REPOSITORY, '--state', 'open', '--limit', '200', '--json', 'number,title,url,files'], { cwd: fileURLToPath(root), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

// 상세 파일에 커밋하지 않은 변경이 있는지(같은 요청을 두 번 적용하거나 손으로 고친 중인 파일에 덮어쓰지 않게). git이 없으면 null
export function detailIsDirty(slug) {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', `beta/site/detail/data/${slug}.json`], { cwd: fileURLToPath(root), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== '';
  } catch {
    return null;
  }
}

// ── 상세 파일 쓰기: io 배열 부분만 바꿔 나머지 서식(들여쓰기·줄바꿈)을 그대로 둔다 ──
function closingBracket(raw, open) {
  let depth = 0;
  let inString = false;
  for (let i = open; i < raw.length; i += 1) {
    const char = raw[i];
    if (inString) {
      if (char === '\\') i += 1;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '[' || char === '{') depth += 1;
    else if (char === ']' || char === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function replaceIoText(raw, io) {
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lf = raw.replaceAll('\r\n', '\n');
  const expected = { ...JSON.parse(lf), io };
  const key = lf.indexOf('\n  "io": ');
  let out = null;
  if (key >= 0) {
    const open = lf.indexOf('[', key);
    const close = closingBracket(lf, open);
    if (close > open) out = `${lf.slice(0, open)}${JSON.stringify(io, null, 2).replaceAll('\n', '\n  ')}${lf.slice(close + 1)}`;
  }
  // 부분 교체가 안 되면 전체를 다시 쓴다
  if (out === null || !isDeepStrictEqual(JSON.parse(out), expected)) out = `${JSON.stringify(expected, null, 2)}\n`;
  return out.replaceAll('\n', eol);
}

// ── 출력 ──
const describeRow = row => `${row.group} · ${row.connector} · ${row.signal} · ${row.direction} · ${row.quantity}`;
export function describeChange(change) {
  if (change.op === 'add') return `추가: ${describeRow(change.row)}`;
  if (change.op === 'remove') return `삭제 io[${change.ioIndex}]: ${describeRow(change.before)}`;
  const fields = ROW_FIELDS.filter(field => change.before[field] !== change.after[field]).map(field => `${field} "${change.before[field]}" → "${change.after[field]}"`);
  return `변경 io[${change.ioIndex}] (${describeRow(change.before)}): ${fields.join(', ')}`;
}

export function pullRequestBody(request, { product, applied, skipped, shaMismatch }) {
  const lines = [
    `## Builder Portal 반영 요청 — ${product}`,
    '',
    `- 작업 흐름: [B-20261013-02](Work/빌더/작업/B-20261013-02.md) "Portal 반영 요청 처리"`,
    `- 제품: \`${request.productId}\` (${request.model || product})`,
    `- 요청 파일 라이브러리: catalogSha \`${request.library.catalogSha.slice(0, 12)}\` · detailSetSha \`${request.library.detailSetSha.slice(0, 12)}\`${shaMismatch ? ' (지금과 다름 — 행마다 before를 확인했다)' : ''}`,
    `- 고친 행·새 행은 \`verification: "${REVIEW_REQUIRED}"\`, \`source: ""\`이다. 자료로 확인한 뒤 사람이 출처와 상태를 채운다`,
    '',
    '### 바뀐 행과 근거',
    '',
    '| # | 변경 | 근거 |',
    '|---|---|---|',
    ...applied.map(({ change }, i) => `| ${i + 1} | ${describeChange(change).replaceAll('|', '\\|')} | ${change.reason ? change.reason.replaceAll('|', '\\|') : '근거 없음'} |`),
  ];
  if (skipped.length) {
    lines.push('', '### 적용하지 않은 변경', '');
    for (const { change, code } of skipped) lines.push(`- ${describeChange(change)} — ${SKIP_REASONS[code]}`);
  }
  lines.push('', '### 검증', '', '- [ ] `node beta/build-search-index.mjs --check`', '- [ ] `node beta/verify-pages.mjs`', '- [ ] `node beta/build-builder-library.mjs --report`', '- [ ] LF 복제본 `node --test --test-concurrency=1 tests/*.test.mjs`');
  return lines.join('\n');
}

function parseArgs(argv) {
  const flags = new Set(argv.filter(arg => arg.startsWith('--')));
  const files = argv.filter(arg => !arg.startsWith('--'));
  const unknown = [...flags].filter(flag => !['--dry-run', '--overlap-checked'].includes(flag));
  return { file: files[0], dryRun: flags.has('--dry-run'), overlapChecked: flags.has('--overlap-checked'), unknown, extra: files.slice(1) };
}

const run = (script, args = []) => execFileSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args], { cwd: fileURLToPath(root), encoding: 'utf8' });

export async function main(argv, log = console.log) {
  const args = parseArgs(argv);
  if (!args.file || args.unknown.length || args.extra.length) {
    log('사용법: node beta/apply-builder-io-request.mjs <요청 파일> [--dry-run] [--overlap-checked]');
    return 1;
  }
  const request = JSON.parse(await readFile(args.file, 'utf8'));
  const errors = validateIoRequest(request);
  if (errors.length) {
    log(`요청 파일 형식 오류:\n${errors.map(error => `  - ${error}`).join('\n')}`);
    return 1;
  }
  if (request.source === 'rtcom') {
    log(`RTCOM 제품(${request.productId})은 적용하지 않습니다. RTCOM 원본(rtcom-configurator)은 Portal에서 고치지 않습니다(AGENTS.md).\n이 요청 파일을 RTCOM 원본 담당에게 전달하세요. 원본에 반영되면 node beta/sync-rtcom.mjs로 가져옵니다.`);
    return 2;
  }
  if (request.unitId !== request.productId) {
    log(`TX/RX·시리즈 배치 단위(${request.unitId})의 요청은 아직 적용하지 않습니다. 단일 제품만 적용합니다.`);
    return 2;
  }
  const catalog = JSON.parse(await readFile(new URL('catalog.json', site), 'utf8'));
  const item = catalog.find(entry => entry.kind === 'equipment' && entry.slug === request.productId);
  if (!item) {
    log(`Portal 목록에 상세 제품 ${request.productId}가 없습니다.`);
    return 1;
  }
  const detailUrl = new URL(`detail/data/${request.productId}.json`, site);
  const raw = await readFile(detailUrl, 'utf8');
  const detail = JSON.parse(raw);

  const { expectedBuilderLibrary } = await import('./build-builder-library.mjs');
  const current = (await expectedBuilderLibrary()).source;
  const shaMismatch = current.catalogSha !== request.library.catalogSha || current.detailSetSha !== request.library.detailSetSha;
  if (shaMismatch) log('경고: 요청을 만든 라이브러리와 지금 Portal 데이터가 다릅니다. 행마다 before를 확인해 바뀐 행은 건너뜁니다.');

  // 겹치는 작업
  const tasks = [];
  for (const name of ['지시서.md', '지시서-B.md', '지시서-C.md']) {
    try { tasks.push(...activeTasks(name, await readFile(new URL(`Work/${name}`, root), 'utf8'))); } catch { /* 파일이 없으면 넘어간다 */ }
  }
  const taskHits = instructionOverlaps(tasks, { slug: request.productId, model: detail.model ?? item.product, brand: item.brand });
  const prs = listOpenPullRequests();
  const { hits: prHits, uncertain: prUncertain } = prs ? pullRequestOverlaps(prs, request.productId) : { hits: [], uncertain: [] };
  let blocked = false;
  if (prHits.length) {
    blocked = true;
    log(`중단: 열린 PR이 같은 상세 파일을 고칩니다.\n${prHits.map(pr => `  - #${pr.number} ${pr.title} ${pr.url ?? ''}`).join('\n')}`);
  }
  if (prUncertain.length && !args.overlapChecked) {
    blocked = true;
    log(`중단: 파일이 ${PR_FILE_LIMIT}개 이상인 열린 PR은 gh가 파일을 다 보여 주지 않습니다. 같은 상세 파일을 고치지 않는지 직접 확인한 뒤 --overlap-checked로 다시 실행하세요.\n${prUncertain.map(pr => `  - #${pr.number} ${pr.title} ${pr.url ?? ''}`).join('\n')}`);
  }
  if (taskHits.length && !args.overlapChecked) {
    blocked = true;
    log(`중단: 진행 중 작업이 이 제품(또는 제조사)을 언급합니다. 사용자에게 확인한 뒤 --overlap-checked로 다시 실행하세요.\n${taskHits.map(task => `  - ${task.file} ${task.task} [${task.status}]`).join('\n')}`);
  }
  if (!prs && !args.overlapChecked) {
    blocked = true;
    log([
      'gh로 열린 PR을 확인하지 못했습니다. 아래를 직접 확인한 뒤 --overlap-checked로 다시 실행하세요.',
      `  - [ ] 열린 PR 중 beta/site/detail/data/${request.productId}.json을 고치는 PR이 없다 (https://github.com/${REPOSITORY}/pulls)`,
      `  - [ ] Work/지시서.md·Work/지시서-B.md·Work/지시서-C.md의 진행 중 작업이 이 제품을 다루지 않는다`,
      ...tasks.map(task => `      · ${task.file} ${task.task} [${task.status}]`),
    ].join('\n'));
  }

  const plan = planIoRequest(request, detail);
  log(`\n${item.product} (${request.productId}) — 적용 ${plan.applied.length}건 · 건너뜀 ${plan.skipped.length}건`);
  for (const { change } of plan.applied) log(`  ✓ ${describeChange(change)}${change.reason ? ` — 근거: ${change.reason}` : ' — 근거 없음'}`);
  for (const { change, code } of plan.skipped) log(`  ✗ ${describeChange(change)} — ${SKIP_REASONS[code]}`);
  if (plan.alreadyApplied) {
    blocked = true;
    log('중단: 이 요청은 이미 반영된 것으로 보입니다(같은 새 행 또는 바뀐 값이 이미 있다). 다시 적용하지 않습니다.');
  }

  if (args.dryRun) {
    log('\n--dry-run: 파일을 바꾸지 않았습니다.');
    return blocked ? 1 : 0;
  }
  if (blocked) return 1;
  if (!plan.applied.length) {
    log('적용할 변경이 없습니다.');
    return 1;
  }
  // 커밋하지 않은 변경이 있는 상세에는 쓰지 않는다(재생성 도중 실패한 뒤 다시 실행해 행이 겹치는 일을 막는다)
  if (detailIsDirty(request.productId)) {
    log(`중단: beta/site/detail/data/${request.productId}.json에 커밋하지 않은 변경이 있습니다. 앞 실행의 결과라면 git checkout으로 되돌린 뒤 다시 실행하세요.`);
    return 1;
  }
  await writeFile(detailUrl, replaceIoText(raw, plan.io));
  log(`\n${fileURLToPath(detailUrl)} 갱신`);
  log(run('./build-search-index.mjs').trim());
  log(run('./update-snapshot.mjs').trim());
  // 생성기가 바뀐 상세로 라이브러리를 만들 수 있는지(형식 오류면 여기서 멈춘다)
  const library = await expectedBuilderLibrary();
  const product = library.products.find(entry => entry.productId === request.productId);
  log(`라이브러리 생성 확인: ${product.productId} 단자 ${product.readiness.ports}개 · 확인 필요 행 ${product.readiness.unresolvedRows}개`);
  log(run('./build-search-index.mjs', ['--check']).trim());
  log([
    '',
    '다음: LF 복제본에서 전체 시험과 node beta/verify-pages.mjs를 돌린 뒤 PR을 엽니다.',
    `  - 이 제품의 io 내용·행 번호를 고정한 시험(제품 전용 시험, tests/*history*.mjs 되감기 검사 등)이 실패하면 이번 변경에 맞게 고칩니다. 행을 지웠으면 뒤 행 번호가 하나씩 당겨집니다.`,
    `  - 찾기: grep -l "${request.productId}" tests/*.mjs`,
  ].join('\n'));
  log(`\nPR 제목 초안: data: ${item.product} I/O 행 Portal 반영 (Builder 요청)\n\n${pullRequestBody(request, { product: item.product, ...plan, shaMismatch })}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
