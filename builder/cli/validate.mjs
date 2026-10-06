// 구성도 JSON 1.2 검증.
//   node builder/cli/validate.mjs <구성도.json> [<구성도.json> …] [--library <경로|URL>]
// 종료 코드: 0 모두 통과 · 1 오류가 있는 파일이 있음 · 2 사용법·파일 읽기 문제
// 이슈는 경고·안내라 종료 코드에 영향이 없다.
// --library를 주면 저장 이후 Portal 데이터가 바뀌었는지(library-drift·product-removed)도 본다.
import { readFile } from 'node:fs/promises';
import { createLibraryIndex } from '../engine/library.mjs';
import { validateDiagram } from '../engine/validate.mjs';

const USAGE = '사용법: node builder/cli/validate.mjs <구성도.json> [<구성도.json> …] [--library <경로|URL>]';

function parseArgs(argv) {
  const files = [];
  let library = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--library') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) return null;
      library = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--library=')) {
      library = arg.slice('--library='.length);
      if (!library) return null;
    } else if (arg.startsWith('--')) {
      return null;
    } else {
      files.push(arg);
    }
  }
  return files.length ? { files, library } : null;
}

async function readJson(location) {
  const text = /^https?:\/\//.test(location)
    ? await (async () => {
      const response = await fetch(location);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })()
    : await readFile(location, 'utf8');
  return JSON.parse(text.replace(/^﻿/, ''));
}

const where = target => (target ? Object.entries(target).map(([key, value]) => `${key}=${value}`).join(' ') : '');

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) { console.error(USAGE); return 2; }
  let library = null;
  if (options.library) {
    try {
      library = createLibraryIndex(await readJson(options.library));
    } catch (error) {
      console.error(`라이브러리를 읽지 못했다: ${options.library} — ${error.message}`);
      return 2;
    }
  }
  let status = 0;
  for (const file of options.files) {
    let diagram;
    try {
      diagram = await readJson(file);
    } catch (error) {
      console.error(`파일을 읽지 못했다: ${file} — ${error.message}`);
      status = Math.max(status, 2);
      continue;
    }
    const { errors, issues } = validateDiagram(diagram, { library });
    console.log(file);
    console.log(`오류 ${errors.length}건`);
    for (const error of errors) console.log(`  ✖ ${error.code} ${error.path ?? where(error.target)}${error.detail ? ` — ${error.detail}` : ''}`);
    console.log(`이슈 ${issues.length}건${library ? '' : ' (라이브러리 비교 없음)'}`);
    for (const issue of issues) console.log(`  ${issue.severity === 'warning' ? '!' : 'i'} ${issue.code} ${where(issue.target)}${issue.detail ? ` — ${issue.detail}` : ''}`);
    if (errors.length) status = Math.max(status, 1);
  }
  return status;
}

process.exitCode = await main();
