import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const key = (sheet, row) => `${sheet}\u0000${row}`;

export function buildPrivateRecord(proposal, catalog, hashes, expected = { sourceRows: 342, notes: 6, suppliers: 340 }) {
  for (const name of ['previous_excel', 'new_excel', 'catalog', 'resource_register']) {
    if (proposal.input_hashes_before[name]?.toLowerCase() !== hashes[name]?.toLowerCase()) {
      throw new Error(`${name} 입력 해시가 W-008 기준과 다릅니다.`);
    }
  }
  const sourceRows = new Map(catalog.products.flatMap(product =>
    product.source_records.map(row => [row.record_id, { product_id: product.id, sheet: row.sheet, row: row.row }])));
  if (sourceRows.size !== expected.sourceRows || proposal.source_version_mapping.length !== expected.sourceRows) {
    throw new Error('원본 행 수가 기준과 다릅니다.');
  }
  const seen = new Set();
  const seenNewPositions = new Set();
  const byOldPosition = new Map();
  const source_versions = proposal.source_version_mapping.map(entry => {
    const original = sourceRows.get(entry.record_id);
    const newPosition = key(entry.sheet, entry.new_row);
    if (!original || seen.has(entry.record_id) || original.product_id !== entry.product_id ||
        original.sheet !== entry.sheet || original.row !== entry.old_row ||
        !Number.isInteger(entry.new_row) || entry.new_row < 1 || seenNewPositions.has(newPosition)) {
      throw new Error('기존 ID·원본 행 대응이 변경되었습니다.');
    }
    seen.add(entry.record_id);
    seenNewPositions.add(newPosition);
    byOldPosition.set(key(entry.sheet, entry.old_row), entry);
    return {
      product_id: entry.product_id, record_id: entry.record_id,
      previous: { file_sha256: hashes.previous_excel, sheet: entry.sheet, row: entry.old_row },
      current: { file_sha256: hashes.new_excel, sheet: entry.sheet, row: entry.new_row }
    };
  });
  if (proposal.notes.length !== expected.notes || proposal.private_supplier_records.length !== expected.suppliers) {
    throw new Error('비공개 메모·공급처 수가 기준과 다릅니다.');
  }
  const linked = entry => {
    const mapping = byOldPosition.get(key(entry.sheet, entry.old_row));
    if (!mapping || mapping.new_row !== entry.new_row) throw new Error('비공개 항목의 출처 대응이 없습니다.');
    return mapping.record_id;
  };
  const historic_notes = proposal.notes.map(entry => ({
    record_id: linked(entry), text: entry.old_note,
    source: { file_sha256: hashes.previous_excel, sheet: entry.sheet, row: entry.old_row },
    matched_new: { file_sha256: hashes.new_excel, sheet: entry.sheet, row: entry.new_row },
    current_validity: 'unverified', visibility: 'private_history'
  }));
  const internal_suppliers = proposal.private_supplier_records.map(entry => ({
    record_id: linked(entry), supplier: entry.new_supplier,
    source: { file_sha256: hashes.new_excel, sheet: entry.sheet, row: entry.new_row },
    role: 'internal_supplier_not_manufacturer', visibility: 'private'
  }));
  const inclusion_candidates = proposal.options.filter(entry => entry.decision === '편입 후보').length;
  const held = proposal.options.filter(entry => entry.decision === '보류').length;
  if (proposal.options.length !== 19 || inclusion_candidates !== 8 || held !== 11) {
    throw new Error('옵션 19행 검토 기준이 변경되었습니다.');
  }
  return {
    classification: 'local_private_not_for_git_or_api',
    file_versions: { previous_excel_sha256: hashes.previous_excel, new_excel_sha256: hashes.new_excel },
    source_versions, historic_notes, internal_suppliers,
    option_review: { inclusion_candidates, held, products_added: 0 }
  };
}

export async function writePrivateRecord(paths) {
  const hashes = {};
  for (const name of ['previous_excel', 'new_excel', 'catalog', 'resource_register']) {
    hashes[name] = sha256(await readFile(paths[name]));
  }
  const proposal = JSON.parse(await readFile(paths.proposal, 'utf8'));
  const catalog = JSON.parse(await readFile(paths.catalog, 'utf8'));
  const record = buildPrivateRecord(proposal, catalog, hashes);
  const content = `${JSON.stringify(record, null, 2)}\n`;
  await mkdir(dirname(paths.output), { recursive: true });
  let previous = null;
  try { previous = await readFile(paths.output); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous?.toString('utf8') === content) return { status: 'unchanged', hash: sha256(Buffer.from(content)), record };
  let backup = null;
  if (previous) {
    backup = join(dirname(paths.output), 'backups', `${new Date().toISOString().replace(/[:.]/g, '-')}-${sha256(previous).slice(0, 12)}.json`);
    await mkdir(dirname(backup), { recursive: true });
    await copyFile(paths.output, backup, constants.COPYFILE_EXCL);
    if (sha256(await readFile(backup)) !== sha256(previous)) throw new Error('백업 무결성 확인 실패');
  }
  const temporary = `${paths.output}.tmp-${process.pid}`;
  await writeFile(temporary, content, { flag: 'wx' });
  await rename(temporary, paths.output);
  const resultHash = sha256(await readFile(paths.output));
  if (resultHash !== sha256(Buffer.from(content))) throw new Error('파생 기록 무결성 확인 실패');
  return { status: previous ? 'updated' : 'created', hash: resultHash, backup, record };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [proposal, catalog, previous_excel, new_excel, resource_register, output] = process.argv.slice(2);
  if (![proposal, catalog, previous_excel, new_excel, resource_register, output].every(Boolean)) {
    throw new Error('사용법: node scripts/build-private-provenance.mjs <제안표> <목록> <이전Excel> <새Excel> <자료대장> <출력>');
  }
  const result = await writePrivateRecord({ proposal, catalog, previous_excel, new_excel, resource_register, output });
  process.stdout.write(`${result.status}: source=${result.record.source_versions.length}, notes=${result.record.historic_notes.length}, suppliers=${result.record.internal_suppliers.length}, options=${result.record.option_review.inclusion_candidates}+${result.record.option_review.held}, sha256=${result.hash}${result.backup ? ', backup=verified' : ''}\n`);
}
