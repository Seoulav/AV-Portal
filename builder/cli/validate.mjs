// 구성도 JSON 1.2 검증.
//   node builder/cli/validate.mjs <구성도.json> [--library <경로|URL>]
// 오류가 있으면 종료 코드 1. 이슈는 경고·안내라 종료 코드에 영향이 없다.
// --library를 주면 저장 이후 Portal 데이터가 바뀌었는지(library-drift·product-removed)도 본다.
import { readFile } from 'node:fs/promises';
import { createLibraryIndex } from '../engine/library.mjs';
import { validateDiagram } from '../engine/validate.mjs';

const args = process.argv.slice(2);
const libraryAt = args.indexOf('--library');
const file = args.find((arg, i) => !arg.startsWith('--') && i !== libraryAt + 1);
if (!file || (libraryAt >= 0 && !args[libraryAt + 1])) {
  console.error('사용법: node builder/cli/validate.mjs <구성도.json> [--library <경로|URL>]');
  process.exit(2);
}

async function readJson(location) {
  if (/^https?:\/\//.test(location)) {
    const response = await fetch(location);
    if (!response.ok) throw new Error(`${location}: HTTP ${response.status}`);
    return response.json();
  }
  return JSON.parse(await readFile(location, 'utf8'));
}

const diagram = await readJson(file);
const library = libraryAt >= 0 ? createLibraryIndex(await readJson(args[libraryAt + 1])) : null;
const { errors, issues } = validateDiagram(diagram, { library });
const where = target => (target ? Object.entries(target).map(([key, value]) => `${key}=${value}`).join(' ') : '');
console.log(`${file}`);
console.log(`오류 ${errors.length}건`);
for (const error of errors) console.log(`  ✖ ${error.code} ${error.path ?? where(error.target)}${error.detail ? ` — ${error.detail}` : ''}`);
console.log(`이슈 ${issues.length}건${library ? '' : ' (라이브러리 비교 없음)'}`);
for (const issue of issues) console.log(`  ${issue.severity === 'warning' ? '!' : 'i'} ${issue.code} ${where(issue.target)}${issue.detail ? ` — ${issue.detail}` : ''}`);
process.exit(errors.length ? 1 : 0);
