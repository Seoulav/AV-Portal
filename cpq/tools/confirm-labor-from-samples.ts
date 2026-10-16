/**
 * 회의실 견적 샘플로 품셈 연결을 한꺼번에 확인한다 (B-20261016-07 1단계).
 *
 * 실행(이 PC에서만):
 *   npx vite-node tools/confirm-labor-from-samples.ts -- <샘플.xlsx> --out <저장소 밖 폴더> [--apply] [--date YYYY-MM-DD]
 *
 * - 샘플 파일 경로·금액을 코드에 두지 않는다. 경로는 인자로 받는다.
 * - 행별 대조 결과(금액 포함)는 `--out` 폴더에만 쓴다. **저장소 안 폴더는 거부한다.**
 * - `--apply`가 있을 때만 `data/approved/labor-mappings.json`을 고친다.
 *   바꾸는 것은 확인한 연결의 `confirmed`와 금액 없는 note뿐이다.
 * - 비교 가능한 행의 절반 이상이 다르면 노임 판 차이를 의심하고 `--apply`를 거부한다.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listXlsxSheets, previewXlsxRows } from '../src/services/private-cost/readTable';
import { DEFAULT_LIMITS } from '../src/services/private-cost/limits';
import { buildGuideBasis } from '../src/data/catalog/guideBasis';
import { productsFileSchema } from '../src/data/catalog/schema';
import { readGuideTemplate, type GuideId, type GuideManifest } from '../src/export/ooxml/guideTemplate';
import {
  MISMATCH_LABEL,
  applyConfirmations,
  buildSpecIndex,
  decideMappings,
  extractRows,
  findHeader,
  judgeRow,
  type MismatchKind,
  type RowVerdict,
  type SampleProduct,
  type SampleRow,
} from './laborSampleCompare';

const CPQ_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = resolve(CPQ_DIR, '..');
const APPROVED = resolve(CPQ_DIR, 'data/approved');
const TEMPLATES = resolve(CPQ_DIR, 'templates/sanitized');
/** `src/app/workspace.ts`의 `WAGE_GUIDE_ID`와 같다. */
const WAGE_GUIDE_ID: GuideId = 'pumsem';
/** `1-1`, `7-1, 8-1`(두 타입 공용 시트), `VIP1-1`. `집계표`·`Sheet1`은 뺀다. */
const SAMPLE_SHEET = /^(\d+-\d+(\s*,\s*\d+-\d+)*|VIP\d+-\d+)$/;

function parseArgs(argv: readonly string[]) {
  let input: string | undefined;
  let out: string | undefined;
  let apply = false;
  let date = new Date().toLocaleDateString('sv-SE');
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!;
    if (a === '--') continue;
    if (a === '--apply') apply = true;
    else if (a === '--out') out = argv[++i];
    else if (a === '--date') date = argv[++i] ?? date;
    else if (a.toLowerCase().endsWith('.xlsx')) input = a;
  }
  if (input === undefined || out === undefined) {
    throw new Error('사용법: confirm-labor-from-samples.ts -- <샘플.xlsx> --out <저장소 밖 폴더> [--apply] [--date YYYY-MM-DD]');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date는 YYYY-MM-DD 형식이어야 한다.');
  const outDir = resolve(out);
  const rel = relative(REPO_DIR, outDir);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
    throw new Error('--out은 저장소 밖이어야 한다. 대조 결과에는 금액이 들어 있다.');
  }
  return { input: resolve(input), outDir, apply, date };
}

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(resolve(APPROVED, name), 'utf8'));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  const products = productsFileSchema.parse(readJson('products.json')).products;
  const sampleProducts: SampleProduct[] = products.map((p) => ({
    sku: p.sku,
    model: p.model,
    quoteName: p.quoteName,
    quoteSpec: p.quoteSpec,
    unit: p.unit,
    laborMappingId: p.laborMappingId,
  }));
  const index = buildSpecIndex(sampleProducts);
  const productBySku = new Map(sampleProducts.map((p) => [p.sku, p]));
  const mappingsPath = resolve(APPROVED, 'labor-mappings.json');
  const mappingsText = readFileSync(mappingsPath, 'utf8');
  // 앱(`src/app/workspace.ts`)과 같은 기준: 품셈·연결은 배포본, 노임은
  // 견적서 가이드('pumsem')의 노임. 배포본 노임으로 비교하면 화면 견적과 다른
  // 값을 보게 된다.
  const manifest = JSON.parse(readFileSync(resolve(TEMPLATES, 'guide-manifest.json'), 'utf8')) as GuideManifest;
  const guide = readGuideTemplate(
    WAGE_GUIDE_ID,
    new Uint8Array(readFileSync(resolve(TEMPLATES, `guide-${WAGE_GUIDE_ID}.xlsx`))),
    manifest,
  );
  const basis = buildGuideBasis({
    laborItemsRaw: readJson('labor-items.json'),
    wageTableRaw: readJson('wage-table.json'),
    laborMappingsRaw: JSON.parse(mappingsText),
    choice: { kind: 'guide', guide },
  });
  const lab = basis.reference;
  const reference = { items: lab.items, mappings: lab.mappings, wages: lab.wages };

  const bytes = new Uint8Array(readFileSync(args.input));
  const limits = { ...DEFAULT_LIMITS, maxBytes: Math.max(DEFAULT_LIMITS.maxBytes, bytes.byteLength) };
  const sheets = listXlsxSheets(bytes, limits).filter((s) => SAMPLE_SHEET.test(s.name.trim()));

  const rows: SampleRow[] = [];
  const skippedSheets: string[] = [];
  for (const s of sheets) {
    const raw = previewXlsxRows(bytes, s.sheetPath, Number.MAX_SAFE_INTEGER, limits);
    const header = findHeader(raw);
    if (header === undefined) {
      skippedSheets.push(s.name);
      continue;
    }
    rows.push(...extractRows(s.name.trim(), raw, header));
  }

  const verdicts: RowVerdict[] = rows.map((r) => judgeRow(r, index, productBySku, reference));
  const count = (k: RowVerdict['kind']): number => verdicts.filter((v) => v.kind === k).length;
  const decisions = decideMappings(verdicts);
  const confirmed = decisions.filter((d) => d.confirm);
  const rejected = decisions.filter((d) => !d.confirm);

  const rejectedByKind: Partial<Record<MismatchKind, number>> = {};
  for (const d of rejected) {
    for (const k of Object.keys(d.mismatches) as MismatchKind[]) {
      rejectedByKind[k] = (rejectedByKind[k] ?? 0) + 1;
    }
  }
  const rowsByKind: Partial<Record<MismatchKind, number>> = {};
  for (const v of verdicts) if (v.kind === 'differ') rowsByKind[v.mismatch] = (rowsByKind[v.mismatch] ?? 0) + 1;

  const comparable = count('equal') + count('differ');
  const mostlyDiffer = comparable > 0 && count('differ') * 2 >= comparable;
  const alreadyConfirmed = lab.mappings.filter((m) => m.confirmed).length;

  const summary = {
    wageTable: lab.wages.periodLabel,
    wageReplaced: basis.wageReplaced,
    sheets: sheets.length,
    skippedSheets,
    itemRows: rows.length,
    indirectRows: count('indirect'),
    skuNoneRows: count('sku-none'),
    skuManyRows: count('sku-many'),
    skuOneRows: rows.length - count('indirect') - count('sku-none') - count('sku-many'),
    noMappingRows: count('no-mapping'),
    noEvidenceRows: count('no-evidence'),
    comparableRows: comparable,
    equalRows: count('equal'),
    differRows: count('differ'),
    differRowsByKind: Object.fromEntries(Object.entries(rowsByKind).map(([k, n]) => [MISMATCH_LABEL[k as MismatchKind], n])),
    mappingsCompared: decisions.length,
    mappingsConfirmed: confirmed.length,
    mappingsRejected: rejected.length,
    mappingsRejectedMixed: rejected.filter((d) => d.equalRows > 0).length,
    mappingsRejectedByKind: Object.fromEntries(
      Object.entries(rejectedByKind).map(([k, n]) => [MISMATCH_LABEL[k as MismatchKind], n]),
    ),
    mappingsTotal: lab.mappings.length,
    alreadyConfirmedBefore: alreadyConfirmed,
    mostlyDiffer,
  };

  // 행별 상세(금액 포함)는 저장소 밖에만 쓴다.
  mkdirSync(args.outDir, { recursive: true });
  const detail = rows.map((r, i) => {
    const v = verdicts[i]!;
    return {
      sheet: r.sheet,
      row: r.rowNumber,
      name: r.name,
      spec: r.spec,
      verdict: v.kind,
      ...('sku' in v ? { sku: v.sku } : {}),
      ...('laborMappingId' in v ? { laborMappingId: v.laborMappingId } : {}),
      ...('sample' in v ? { sample: v.sample.toString(), computed: v.computed.toString() } : {}),
      ...(v.kind === 'differ' ? { mismatch: v.mismatch } : {}),
    };
  });
  writeFileSync(resolve(args.outDir, 'labor-compare-rows.json'), `${JSON.stringify(detail, null, 1)}\n`);
  writeFileSync(resolve(args.outDir, 'labor-compare-mappings.json'), `${JSON.stringify(decisions, null, 1)}\n`);
  writeFileSync(resolve(args.outDir, 'labor-compare-summary.json'), `${JSON.stringify(summary, null, 1)}\n`);

  console.log(JSON.stringify(summary, null, 1));

  if (!args.apply) return;
  if (mostlyDiffer) {
    throw new Error('비교 가능한 행의 절반 이상이 다르다. 노임 판 차이를 먼저 확인한다 — 반영하지 않았다.');
  }

  const parsed = JSON.parse(mappingsText) as Parameters<typeof applyConfirmations>[0];
  // 원래 서식(공백 1칸 들여쓰기·끝 줄바꿈)을 그대로 다시 만들 수 있는지 먼저 본다.
  if (`${JSON.stringify(parsed, null, 1)}\n` !== mappingsText) {
    throw new Error('labor-mappings.json의 서식을 그대로 다시 만들 수 없다 — 반영하지 않았다.');
  }
  const { file, changed } = applyConfirmations(parsed, decisions, args.date, lab.wages.periodLabel);
  writeFileSync(mappingsPath, `${JSON.stringify(file, null, 1)}\n`);
  console.log(`반영: ${changed.length}개 연결을 confirmed: true로 바꿨다.`);
}

main();
