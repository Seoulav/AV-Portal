import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { selectPublicProducts } from './select.mjs';

const assets = ['index.html', 'styles.css', 'app.js'];
const assetDir = join(dirname(fileURLToPath(import.meta.url)), 'site');
const exec = promisify(execFile);

async function ensureIgnoredRootOutput(output) {
  let outputsDir = dirname(output);
  while (basename(outputsDir).toLowerCase() !== 'outputs') {
    const parent = dirname(outputsDir);
    if (parent === outputsDir) throw new Error('출력은 저장소 루트 outputs/ 아래여야 합니다.');
    outputsDir = parent;
  }
  const candidateRoot = dirname(outputsDir);
  try {
    const { stdout } = await exec('git', ['-C', candidateRoot, 'rev-parse', '--show-toplevel']);
    const actualRoot = resolve(stdout.trim());
    const sameRoot = process.platform === 'win32'
      ? actualRoot.toLowerCase() === resolve(candidateRoot).toLowerCase()
      : actualRoot === resolve(candidateRoot);
    if (!sameRoot) throw new Error('not repository root');
    await exec('git', ['-C', candidateRoot, 'check-ignore', '-q', '--no-index', '--', join(output, 'catalog.json')]);
  } catch {
    throw new Error('출력 폴더가 저장소 루트의 Git 제외 outputs/가 아닙니다.');
  }
}

export async function buildStaticSite({ catalogPath, decisionsPath, outDir }) {
  if (![catalogPath, decisionsPath, outDir].every(value => typeof value === 'string' && value.trim())) {
    throw new Error('원본 목록, 로컬 결정표, 출력 폴더를 모두 지정해야 합니다.');
  }
  const output = resolve(outDir);
  await ensureIgnoredRootOutput(output);
  const sourceBytes = await readFile(resolve(catalogPath));
  const actualHash = createHash('sha256').update(sourceBytes).digest('hex');
  const decisions = JSON.parse(await readFile(resolve(decisionsPath), 'utf8'));
  if (actualHash !== decisions.source_sha256?.toLowerCase()) {
    throw new Error('원본 목록 해시가 결정표의 검토 기준과 다릅니다.');
  }
  const catalog = JSON.parse(sourceBytes.toString('utf8'));
  const selected = selectPublicProducts(catalog, decisions);
  if (!selected.length) throw new Error('채택된 항목이 없습니다.');
  await mkdir(output);
  for (const asset of assets) await copyFile(join(assetDir, asset), join(output, asset));
  await writeFile(join(output, 'catalog.json'), `${JSON.stringify(selected, null, 2)}\n`, { flag: 'wx' });
  return {
    source: catalog.products.length, selected: selected.length,
    excluded: catalog.products.length - selected.length,
    equipment: selected.filter(item => item.kind === 'equipment').length,
    services: selected.filter(item => item.kind === 'service').length,
    brands: new Set(selected.map(item => item.brand)).size,
    official_links: selected.reduce((n, item) => n + item.official_links.length, 0),
    source_sha256: actualHash,
    output
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = Object.fromEntries(process.argv.slice(2).filter((_, i) => i % 2 === 0)
    .map((key, i) => [key, process.argv[3 + i * 2]]));
  try {
    const result = await buildStaticSite({
      catalogPath: args['--catalog'], decisionsPath: args['--decisions'], outDir: args['--out']
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
