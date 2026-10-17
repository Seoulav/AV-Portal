/**
 * 회의실 견적 샘플 → `data/approved/room-templates.json` 생성 (B-20261016-07 2단계).
 *
 * 실행(이 PC에서만):
 *   npx vite-node tools/build-room-templates.ts -- <샘플.xlsx>
 *
 * - 샘플 파일 경로를 코드에 두지 않는다. 경로는 인자로 받는다.
 * - 출력에는 타입·시스템 묶음·품목(품명·규격·설명)·단위·수량·비고만 담는다.
 *   **가격(원가·재료비·노무비·금액)과 제조사/구매처는 읽지도 쓰지도 않는다**
 *   (2026-10-16 사용자 승인 범위). 쓰기 전에 금지 값 검사로 한 번 더 막는다.
 * - SKU는 승인 카탈로그(`data/approved/products.json`)와 1건으로 맞고 단위가
 *   같을 때만 적는다. 못 맞춘 품목은 품명·규격 그대로 둔다 — 지어내지 않는다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listXlsxSheets, previewXlsxRows } from '../src/services/private-cost/readTable';
import { DEFAULT_LIMITS } from '../src/services/private-cost/limits';
import { productsFileSchema } from '../src/data/catalog/schema';
import { roomTemplatesFileSchema, type RoomTemplate } from '../src/import/room/templates';
import { buildSpecIndex, type SampleProduct } from './laborSampleCompare';
import {
  extractRoomSheet,
  findForbiddenValues,
  parseRoomTitle,
  readTypeNames,
  type RoomSheetStats,
} from './roomTemplateExtract';

const CPQ_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APPROVED = resolve(CPQ_DIR, 'data/approved');
/** `1-1`, `7-1, 8-1`(두 타입 공용 시트), `VIP1-1`. `집계표`·`Sheet1`은 뺀다. */
const SAMPLE_SHEET = /^(\d+-\d+(\s*,\s*\d+-\d+)*|VIP\d+-\d+)$/;
const SUMMARY_SHEET = '집계표';

function parseArgs(argv: readonly string[]): { input: string } {
  const input = argv.find((a) => a.toLowerCase().endsWith('.xlsx'));
  if (input === undefined) {
    throw new Error('사용법: build-room-templates.ts -- <샘플.xlsx>');
  }
  return { input: resolve(input) };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  const products = productsFileSchema.parse(
    JSON.parse(readFileSync(resolve(APPROVED, 'products.json'), 'utf8')),
  ).products;
  const sampleProducts: SampleProduct[] = products.map((p) => ({
    sku: p.sku,
    model: p.model,
    quoteName: p.quoteName,
    quoteSpec: p.quoteSpec,
    unit: p.unit,
    laborMappingId: p.laborMappingId,
  }));
  const index = buildSpecIndex(sampleProducts);

  const bytes = new Uint8Array(readFileSync(args.input));
  const limits = { ...DEFAULT_LIMITS, maxBytes: Math.max(DEFAULT_LIMITS.maxBytes, bytes.byteLength) };
  const sheets = listXlsxSheets(bytes, limits);

  const summarySheet = sheets.find((s) => s.name.trim() === SUMMARY_SHEET);
  if (summarySheet === undefined) throw new Error(`'${SUMMARY_SHEET}' 시트가 없다.`);
  const typeNames = readTypeNames(previewXlsxRows(bytes, summarySheet.sheetPath, Number.MAX_SAFE_INTEGER, limits));

  const templates: RoomTemplate[] = [];
  const skipped: string[] = [];
  const titleConflicts: string[] = [];
  const total: RoomSheetStats = {
    itemRows: 0,
    indirectRows: 0,
    skuOne: 0,
    skuMany: 0,
    skuNone: 0,
    unitMismatch: 0,
    droppedText: 0,
  };

  for (const sheet of sheets) {
    const sheetName = sheet.name.trim();
    if (!SAMPLE_SHEET.test(sheetName)) continue;
    const rows = previewXlsxRows(bytes, sheet.sheetPath, Number.MAX_SAFE_INTEGER, limits);
    const extracted = extractRoomSheet(sheetName, rows, sampleProducts, index);
    if (extracted === undefined || extracted.systems.length === 0) {
      skipped.push(sheetName);
      continue;
    }
    const sheetTitle = parseRoomTitle(rows);
    for (const key of Object.keys(total) as (keyof RoomSheetStats)[]) total[key] += extracted.stats[key];

    // `7-1, 8-1`처럼 한 시트가 두 타입을 담당하면 타입마다 템플릿을 만든다.
    const ids = sheetName.split(',').map((s) => s.trim());
    for (const id of ids) {
      const typeName = typeNames.get(id);
      if (typeName === undefined) throw new Error(`집계표에 '${id}' 타입 이름이 없다.`);
      if (sheetTitle !== undefined && sheetTitle !== typeName) {
        titleConflicts.push(`${id}: 집계표 '${typeName}' ↔ 시트 '${sheetTitle}'`);
      }
      templates.push({
        id,
        typeName,
        ...(sheetTitle !== undefined ? { sheetTitle } : {}),
        sourceSheet: sheetName,
        systems: extracted.systems,
      });
    }
  }

  // 집계표 순서(1-1 → VIP3-3)로 정렬한다.
  const order = [...typeNames.keys()];
  templates.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const file = {
    version: 1 as const,
    source: '회의실 타입별 분류 샘플 (사용자 제공, 2026-10-16) — 품명·규격·수량·비고만 추출',
    note: '품명·규격·설명·단위·수량·비고만 담는다. 생성: tools/build-room-templates.ts (B-20261016-07 2단계)',
    templates,
  };

  // 공개 금지 값 검사 — 틀린 칸을 읽게 바뀌어도 여기서 멈춘다.
  const leaks = findForbiddenValues(file);
  if (leaks.length > 0) {
    throw new Error(`공개 금지 값이 섞였다 — 쓰지 않았다:\n${leaks.join('\n')}`);
  }
  // 스키마 자기 검증 — 커밋 전에 앱이 읽을 수 있는 모양인지 본다.
  roomTemplatesFileSchema.parse(file);

  const outPath = resolve(APPROVED, 'room-templates.json');
  writeFileSync(outPath, `${JSON.stringify(file, null, 1)}\n`);

  console.log(
    JSON.stringify(
      {
        templates: templates.length,
        sheets: new Set(templates.map((t) => t.sourceSheet)).size,
        skippedSheets: skipped,
        titleConflicts,
        ...total,
      },
      null,
      1,
    ),
  );
}

main();
