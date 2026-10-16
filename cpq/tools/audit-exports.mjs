// 원가 모듈이 고객용 경로에 섞이지 않는지 정적으로 검사한다 (설계서 §10.4, §8.1).
//
// 설계서 §10.4: "고객용 exporter에서 원가 모듈 import를 금지하는 의존성 검사도 추가한다."
//
// 리뷰로 지키는 규칙은 언젠가 깨진다. 이 검사는 `npm run audit:exports`로 돌고
// CI에서 실패하면 병합을 막는다.
//
// 검사 내용:
//   1. 금지 import — 고객용/도메인/직렬화 경로가 services/private-cost를 참조하는가
//      (import 문자열을 실제 경로로 풀어 본다. 1-1: services/price-book은 정해진 화면·앱 파일에서만 가져온다)
//   2. 영속 저장 API — 원가를 다룰 수 있는 모듈이 localStorage 등에 닿는가
//   3. 네트워크 API — 원가를 다룰 수 있는 모듈이 fetch 등을 쓰는가
//   4. 위험한 실행 — eval, new Function, dynamic import (설계서 §8.3)
//   5. 화면 경로 — 견적 문서를 브라우저에 영속 저장하거나 외부 origin으로 보내는가 (§8.8, §8.4)
//   6. 시그니처 — calculateQuote/buildCustomerProjection이 PrivateCostSession을 받는가 (§10.4)
//   7. 영속 저장 허용 목록 — 위 경로 밖(예: 새 services/*)도 브라우저 저장소를 쓰면 막는다.
//      예외는 두 파일뿐이고, 각 파일은 정해진 열쇠 하나로만 읽고 쓴다.
//        - "확인한 품셈 연결 기억"(B-20261016-05): localStorage, `LABOR_MEMORY_STORAGE_KEY`
//        - "가격표"(B-20261016-06, LED 구성기 방식): IndexedDB, 데이터베이스·저장소·열쇠
//          상수 세 개(`PRICE_BOOK_DB_NAME`·`PRICE_BOOK_STORE`·`PRICE_BOOK_RECORD_KEY`)
//      가격표는 원가를 담으므로 `services/price-book`도 원가 모듈로 본다(1·3번 규칙).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(ROOT, 'src');

/** 원가를 절대 만지면 안 되는 경로. */
const COST_FREE_PREFIXES = [
  'src/domain',
  'src/export/customer',
  'src/export/ooxml',
  'src/services/files',
  // 공유용(1단계)과 준비 단계는 **원가를 받지 않는다**.
  // 받는 곳은 src/export/internal 뿐이다.
  'src/export/shared',
  'src/export/variants',
];

/**
 * 원가 모듈로 간주하는 경로. 가격표(B-20261016-06)도 원가를 담는다 — 고객용·
 * 도메인·직렬화 경로가 가져오지 못하고(1번), 네트워크에 닿지 못한다(3번).
 */
const COST_MODULE = /services[/\\](private-cost|price-book)/;

/**
 * 영속 저장 — 설계서 §8.1: 원가를 localStorage/IndexedDB에 넣지 않는다.
 * 유일한 예외는 2026-10-16 사용자 지시(B-20261016-06, "LED 구성기 방식처럼")로
 * 둔 가격표 저장 파일 하나다(7번 규칙의 허용 목록).
 */
const PERSISTENCE = /\b(localStorage|sessionStorage|indexedDB|openDatabase|caches)\b/;

/** 네트워크 — 설계서 §8.4: 네트워크 요청에 문서 상태를 싣는 공용 함수를 두지 않는다. */
const NETWORK = /\b(fetch|XMLHttpRequest|WebSocket|navigator\.sendBeacon|EventSource)\b/;

/** 설계서 §5.1, §8.3: eval 금지, dynamic import 금지. */
const DANGEROUS = /\beval\s*\(|new\s+Function\s*\(|(?<![.\w])import\s*\(/;

/**
 * 화면 경로. 설계서 §8.8이 "RTCOM의 localStorage 자동 저장을 계승하지 않는다"고 한 곳이다.
 *
 * 견적 문서에는 고객명·공사명·금액이 들어간다. 브라우저에 영속 저장하면
 * 같은 origin의 스크립트가 읽을 수 있고(설계서 §8.5), 사용자가 지웠다고 생각한 뒤에도 남는다.
 * 저장은 사용자가 명시적으로 파일로 내보낼 때만 한다 (설계서 §6.3).
 */
const UI_PREFIXES = ['src/features', 'src/app'];

/**
 * 화면이 **외부 origin**으로 나가는 요청.
 *
 * 설계서 §8.4: "네트워크 요청에 문서 상태를 싣는 공용 함수를 두지 않는다."
 * 같은 origin의 배포 데이터(`data/approved/*.json`)를 읽는 것은 허용한다 —
 * 읽기이고 문서 상태를 바깥으로 보내지 않는다.
 */
const EXTERNAL_ORIGIN = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(\s*[`'"]\s*https?:/;
const BEACON = /navigator\s*\.\s*sendBeacon/;

/**
 * 7. 영속 저장 허용 목록 (B-20261016-05 독립 검토 지적).
 *
 * "확인한 품셈 연결 기억"은 품셈 판·연결 id·연결 내용 지문·확인 시각만
 * 브라우저 저장소에 둔다(문서·고객·금액·원가 없음). 이 **파일 하나**에서만,
 * 그리고 **이 열쇠 하나**로만 허용한다. 다른 모든 `src` 경로의 영속 저장은
 * 이 규칙이 막는다(1~5번 규칙이 다루지 않는 새 경로 포함).
 */
const PERSISTENCE_ALLOWED = new Map([
  ['src/services/labor-memory/laborMappingMemory.ts', {
    kind: 'local-storage',
    keyConstant: 'LABOR_MEMORY_STORAGE_KEY',
    keyValue: 'av-cpq.confirmed-labor-mappings.v1',
  }],
  // 가격표(B-20261016-06). 원가·판매가를 이 브라우저에만 둔다. 데이터베이스 하나,
  // 저장소 하나, 열쇠 하나 — 상수 세 개가 정확히 이 값으로 선언돼 있어야 한다.
  ['src/services/price-book/store.ts', {
    kind: 'indexed-db',
    constants: {
      PRICE_BOOK_DB_NAME: 'av-cpq.price-book.v1',
      PRICE_BOOK_STORE: 'price-book',
      PRICE_BOOK_RECORD_KEY: 'current',
    },
  }],
]);
/** 저장소 메서드 호출 — 첫 인자가 정해진 열쇠 상수여야 한다. */
const STORAGE_CALL = /\.(getItem|setItem|removeItem|clear|key)\s*\(([^,)]*)/g;

/**
 * IndexedDB 호출 — **정해진 모양 그대로만** 허용한다(같은 줄 안에서 닫혀야 한다).
 *   indexedDB.open(PRICE_BOOK_DB_NAME, …)          데이터베이스는 하나
 *   transaction(PRICE_BOOK_STORE, 'readonly'|'readwrite')
 *   objectStore(PRICE_BOOK_STORE) / createObjectStore(PRICE_BOOK_STORE)   (옵션 없이 — 자동 열쇠 금지)
 *   get(PRICE_BOOK_RECORD_KEY) / delete(PRICE_BOOK_RECORD_KEY)           열쇠는 하나
 *   put(값, PRICE_BOOK_RECORD_KEY)
 * 목록을 훑거나 통째로 지우거나 구조를 바꾸는 호출은 막는다.
 */
const IDB_CALL_SHAPES = [
  [/\.open\s*\(/g, /^\s*PRICE_BOOK_DB_NAME\s*,/],
  [/\.transaction\s*\(/g, /^\s*PRICE_BOOK_STORE\s*,\s*'(readonly|readwrite)'\s*\)/],
  [/\.objectStore\s*\(/g, /^\s*PRICE_BOOK_STORE\s*\)/],
  [/\.createObjectStore\s*\(/g, /^\s*PRICE_BOOK_STORE\s*\)/],
  [/\.get\s*\(/g, /^\s*PRICE_BOOK_RECORD_KEY\s*\)/],
  [/\.delete\s*\(/g, /^\s*PRICE_BOOK_RECORD_KEY\s*\)/],
  [/\.put\s*\(/g, /^\s*[A-Za-z_$][\w$]*\s*,\s*PRICE_BOOK_RECORD_KEY\s*\)/],
];
const IDB_FORBIDDEN =
  /\.(getAll|getAllKeys|getKey|openCursor|openKeyCursor|clear|add|deleteDatabase|deleteObjectStore|count|index|createIndex|databases)\s*\(/;
/** 상수 이름을 다른 곳에서 다시 선언(가리기)하지 못하게 — 선언은 각각 한 번뿐이어야 한다. */
const IDB_CONSTANT_DECLARATION = /\b(PRICE_BOOK_DB_NAME|PRICE_BOOK_STORE|PRICE_BOOK_RECORD_KEY)\s*=(?!=)/g;

/**
 * 1-1. 가격표 모듈(원가·판매가를 담는다)을 가져올 수 있는 곳 — 이 목록뿐이다.
 * 카탈로그·구성도·도메인 쪽이 가격표 원가를 직접 끌어가지 못하게 한다.
 */
const PRICE_BOOK_MODULE = /^src\/services\/price-book\//;
const PRICE_BOOK_IMPORTERS = ['src/services/price-book/', 'src/features/price-book/', 'src/app/App.tsx'];

/** IndexedDB 허용 파일에서도 다른 브라우저 저장소는 쓰지 않는다. */
const NON_IDB_PERSISTENCE = /\b(localStorage|sessionStorage|openDatabase|caches)\b/;

const findings = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function posix(path) {
  return path.split(sep).join('/');
}

/** import 문자열 → 저장소 기준 경로(`src/...`). 상대 경로와 `@/` 별칭을 푼다. 패키지는 그대로. */
function importTarget(fromRel, spec) {
  if (spec.startsWith('@/')) return `src/${spec.slice(2)}`;
  if (!spec.startsWith('.')) return spec;
  return posix(relative(ROOT, resolve(ROOT, dirname(fromRel), spec)));
}

/** 줄 단위 검사 — 주석 줄은 건너뛴다. 설명에 쓴 단어를 위반으로 잡지 않기 위해서다. */
function codeLines(source) {
  const lines = source.split('\n');
  const out = [];
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i];
    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end === -1) continue;
      inBlockComment = false;
      line = line.slice(end + 2);
    }
    const blockStart = line.indexOf('/*');
    if (blockStart !== -1) {
      const end = line.indexOf('*/', blockStart + 2);
      if (end === -1) {
        inBlockComment = true;
        line = line.slice(0, blockStart);
      } else {
        line = line.slice(0, blockStart) + line.slice(end + 2);
      }
    }
    const lineComment = line.indexOf('//');
    if (lineComment !== -1) line = line.slice(0, lineComment);
    if (line.trim() === '') continue;
    out.push([i + 1, line]);
  }
  return out;
}

const files = walk(SRC);
if (files.length === 0) {
  console.error('src에서 검사할 파일을 찾지 못했다.');
  process.exit(1);
}

for (const file of files) {
  const rel = posix(relative(ROOT, file));
  const source = readFileSync(file, 'utf8');
  const lines = codeLines(source);
  const isCostFree = COST_FREE_PREFIXES.some((p) => rel.startsWith(p));
  const isCostModule = COST_MODULE.test(rel);
  const isUi = UI_PREFIXES.some((p) => rel.startsWith(p));
  const persistenceRule = PERSISTENCE_ALLOWED.get(rel);

  if (persistenceRule?.kind === 'local-storage') {
    const declaration = `export const ${persistenceRule.keyConstant} = '${persistenceRule.keyValue}';`;
    if (!source.includes(declaration)) {
      findings.push(`${rel}  허용된 저장 열쇠 ${persistenceRule.keyConstant} = '${persistenceRule.keyValue}' 선언이 없다`);
    }
  }
  if (persistenceRule?.kind === 'indexed-db') {
    const declarations = [...source.matchAll(IDB_CONSTANT_DECLARATION)].map((m) => m[1]);
    for (const name of Object.keys(persistenceRule.constants)) {
      const count = declarations.filter((d) => d === name).length;
      if (count !== 1) findings.push(`${rel}  저장 상수 ${name}는 한 번만 선언해야 한다(지금 ${count}번)`);
    }
    for (const [name, value] of Object.entries(persistenceRule.constants)) {
      const declaration = `export const ${name} = '${value}';`;
      if (!source.includes(declaration)) {
        findings.push(`${rel}  허용된 저장 상수 ${name} = '${value}' 선언이 없다`);
      }
    }
  }

  for (const [number, line] of lines) {
    // 1. 금지 import — import 문자열을 **실제 경로로 풀어** 본다. 상대 경로
    //    (`../price-book/store`)로 `services/`를 빼고 들어와도 잡는다(독립 리뷰 지적).
    const importMatch = /(?:from|import)\s+['"]([^'"]+)['"]/.exec(line);
    if (importMatch) {
      const target = importTarget(rel, importMatch[1]);
      if (isCostFree && (COST_MODULE.test(importMatch[1]) || COST_MODULE.test(target))) {
        findings.push(
          `${rel}:${number}  원가 모듈 import 금지 경로에서 '${importMatch[1]}'을 가져온다`,
        );
      }
      // 1-1. 가격표 모듈은 허용 목록에서만 가져온다.
      if (PRICE_BOOK_MODULE.test(target) && !PRICE_BOOK_IMPORTERS.some((p) => rel.startsWith(p))) {
        findings.push(`${rel}:${number}  가격표 모듈은 정해진 화면·앱 파일에서만 가져온다: '${importMatch[1]}'`);
      }
    }

    // 2. 영속 저장 — 원가를 만질 수 있는 모듈 전부. 7번 허용 파일(가격표 저장)만
    //    예외이고, 그 파일은 아래 7번이 호출 하나하나를 검사한다.
    if ((isCostModule || isCostFree) && persistenceRule === undefined && PERSISTENCE.test(line)) {
      findings.push(`${rel}:${number}  영속 저장 API 사용: ${line.trim()}`);
    }

    // 3. 네트워크 — 원가 모듈은 네트워크에 닿으면 안 된다
    if (isCostModule && NETWORK.test(line)) {
      findings.push(`${rel}:${number}  원가 모듈에서 네트워크 API 사용: ${line.trim()}`);
    }

    // 7. 영속 저장 허용 목록 — 원가·화면 규칙 밖의 경로도 막는다.
    if (PERSISTENCE.test(line) && !isCostModule && !isCostFree && !isUi && persistenceRule === undefined) {
      findings.push(`${rel}:${number}  허용 목록 밖에서 영속 저장 API 사용: ${line.trim()}`);
    }
    if (persistenceRule?.kind === 'local-storage') {
      for (const match of line.matchAll(STORAGE_CALL)) {
        if (match[1] === 'clear' || match[1] === 'key' || match[2].trim() !== persistenceRule.keyConstant) {
          findings.push(
            `${rel}:${number}  저장소 호출은 ${persistenceRule.keyConstant} 열쇠 하나로만 한다: ${line.trim()}`,
          );
        }
      }
    }
    if (persistenceRule?.kind === 'indexed-db') {
      if (NON_IDB_PERSISTENCE.test(line)) {
        findings.push(`${rel}:${number}  가격표 저장은 IndexedDB 한 곳만 쓴다: ${line.trim()}`);
      }
      if (IDB_FORBIDDEN.test(line)) {
        findings.push(`${rel}:${number}  목록 훑기·통째 지우기 호출 금지(열쇠 하나만 읽고 쓴다): ${line.trim()}`);
      }
      for (const [call, shape] of IDB_CALL_SHAPES) {
        for (const match of line.matchAll(call)) {
          const rest = line.slice(match.index + match[0].length);
          if (!shape.test(rest)) {
            findings.push(`${rel}:${number}  저장소 호출이 정해진 모양(상수·열쇠 하나)이 아니다: ${line.trim()}`);
          }
        }
      }
    }

    // 4. 위험한 실행 — 전 범위
    if (DANGEROUS.test(line)) {
      findings.push(`${rel}:${number}  eval/Function/dynamic import: ${line.trim()}`);
    }

    // 5. 화면 경로 — 견적 문서를 브라우저에 영속 저장하거나 외부로 보내지 않는다
    if (isUi) {
      if (PERSISTENCE.test(line)) {
        findings.push(
          `${rel}:${number}  화면에서 영속 저장 API 사용 (설계서 §8.8): ${line.trim()}`,
        );
      }
      if (EXTERNAL_ORIGIN.test(line)) {
        findings.push(
          `${rel}:${number}  화면에서 외부 origin 요청 (설계서 §8.4): ${line.trim()}`,
        );
      }
      if (BEACON.test(line)) {
        findings.push(`${rel}:${number}  sendBeacon 사용 (설계서 §8.4): ${line.trim()}`);
      }
    }
  }
}

// 6. 시그니처 검사 — 설계서 §10.4가 "PrivateCostSession을 인자로 받지 않는다"고 못박은 함수들
const SIGNATURE_RULES = [
  ['src/domain/calculation/calculate.ts', 'calculateQuote'],
  ['src/export/customer/projection.ts', 'buildCustomerProjection'],
  ['src/export/shared/projection.ts', 'buildSharedProjection'],
  ['src/export/variants/prepare.ts', 'prepareQuote'],
];
for (const [relPath, fn] of SIGNATURE_RULES) {
  const source = readFileSync(join(ROOT, relPath), 'utf8');
  const at = source.indexOf(`export function ${fn}`);
  if (at === -1) {
    findings.push(`${relPath}  ${fn}를 찾을 수 없다 — 검사 규칙이 낡았다`);
    continue;
  }
  const signature = source.slice(at, source.indexOf('{', at));
  if (/PrivateCostSession/.test(signature)) {
    findings.push(`${relPath}  ${fn}가 PrivateCostSession을 인자로 받는다 (설계서 §10.4 위반)`);
  }
}

const uiFiles = files.filter((f) =>
  UI_PREFIXES.some((p) => posix(relative(ROOT, f)).startsWith(p)),
);
console.log(`검사한 파일: ${files.length} (화면 경로 ${uiFiles.length})`);
if (findings.length > 0) {
  console.error(`\n=== 위반 ${findings.length}건 ===`);
  for (const f of findings) console.error('  ! ' + f);
  process.exit(1);
}
console.log('=== 통과: 원가 모듈이 고객용 경로에 섞이지 않았다 ===');
